-- Script Final para NFS-e - Execute este no Supabase
-- Este script é compatível com o schema existente

-- 1. Adicionar novo valor ao enum invoice_status
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'processing';

-- 2. Adicionar colunas que faltam na tabela invoices existente
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS nfse_verification_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS nfse_url TEXT,
ADD COLUMN IF NOT EXISTS service_description TEXT,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 3. Criar tabela de configurações do emissor de NFS-e
CREATE TABLE IF NOT EXISTS public.nfse_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(100) NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    certificate_path TEXT,
    certificate_password TEXT,
    city_code VARCHAR(10) NOT NULL,
    cnpj VARCHAR(18) NOT NULL,
    municipal_inscription VARCHAR(50),
    service_code VARCHAR(10) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de logs de integração com NFS-e
CREATE TABLE IF NOT EXISTS public.nfse_integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    operation VARCHAR(50) NOT NULL,
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_invoices_nfse_number ON public.invoices(nfse_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON public.invoices(issued_at);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_invoice_id ON public.nfse_integration_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_operation ON public.nfse_integration_logs(operation);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_created_at ON public.nfse_integration_logs(created_at);

-- 6. Criar trigger para updated_at na tabela nfse_config
CREATE TRIGGER update_nfse_config_updated_at 
    BEFORE UPDATE ON public.nfse_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar RLS nas novas tabelas
ALTER TABLE public.nfse_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse_integration_logs ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS
CREATE POLICY "Only admins can manage nfse_config" ON public.nfse_config
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can view nfse_logs" ON public.nfse_integration_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert nfse_logs" ON public.nfse_integration_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 9. Inserir configuração padrão para desenvolvimento/teste
INSERT INTO public.nfse_config (
    provider_name,
    api_url,
    api_key,
    city_code,
    cnpj,
    municipal_inscription,
    service_code,
    tax_rate,
    active
) VALUES (
    'Teste Simples',
    'https://api-teste-nfse.exemplo.com.br',
    'test-api-key-12345',
    '3304557',
    '12.345.678/0001-90',
    '123456789',
    '1401',
    5.00,
    true
) ON CONFLICT DO NOTHING;

-- 10. Criar função para buscar próximo número de NFS-e
CREATE OR REPLACE FUNCTION get_next_nfse_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_number INTEGER;
    formatted_number VARCHAR(50);
BEGIN
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(nfse_number FROM '[0-9]+') AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM public.invoices 
    WHERE nfse_number IS NOT NULL 
    AND nfse_number ~ '^[0-9]+$';
    
    formatted_number := LPAD(next_number::TEXT, 8, '0');
    
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- 11. Criar função para calcular impostos
CREATE OR REPLACE FUNCTION calculate_invoice_taxes(
    gross_amount DECIMAL(10,2),
    tax_rate DECIMAL(5,2) DEFAULT NULL
)
RETURNS TABLE(
    tax_amount DECIMAL(10,2),
    net_amount DECIMAL(10,2)
) AS $$
DECLARE
    config_tax_rate DECIMAL(5,2);
    calculated_tax DECIMAL(10,2);
    calculated_net DECIMAL(10,2);
BEGIN
    IF tax_rate IS NULL THEN
        SELECT nfse_config.tax_rate INTO config_tax_rate
        FROM public.nfse_config 
        WHERE active = true 
        LIMIT 1;
        
        tax_rate := COALESCE(config_tax_rate, 0);
    END IF;
    
    calculated_tax := ROUND(gross_amount * (tax_rate / 100), 2);
    calculated_net := gross_amount - calculated_tax;
    
    RETURN QUERY SELECT calculated_tax, calculated_net;
END;
$$ LANGUAGE plpgsql;

-- 12. Criar view para relatórios de NFS-e
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.id,
    i.nfse_number,
    i.amount,
    i.tax_amount,
    i.net_amount,
    i.status,
    i.issued_at,
    i.created_at,
    a.scheduled_at as appointment_date,
    p.name as patient_name,
    p.cpf as patient_cpf,
    u.name as doctor_name
FROM public.invoices i
JOIN public.appointments a ON i.appointment_id = a.id
JOIN public.patients p ON a.patient_id = p.id
JOIN public.users u ON a.doctor_id = u.id
ORDER BY i.created_at DESC;

-- 13. Inserir dados de teste (se houver appointments)
DO $$
DECLARE
    test_appointment_id UUID;
    test_invoice_id UUID;
BEGIN
    SELECT id INTO test_appointment_id FROM public.appointments LIMIT 1;
    
    IF test_appointment_id IS NOT NULL THEN
        INSERT INTO public.invoices (
            appointment_id,
            nfse_number,
            nfse_verification_code,
            amount,
            service_description,
            tax_amount,
            net_amount,
            issued_at,
            status,
            nfse_data
        ) VALUES (
            test_appointment_id,
            'NFS-e-TEST-001',
            'ABC123DEF456',
            150.00,
            'Consulta oftalmológica',
            7.50,
            142.50,
            NOW(),
            'issued',
            '{"numero": "NFS-e-TEST-001", "codigo_verificacao": "ABC123DEF456"}'::jsonb
        ) RETURNING id INTO test_invoice_id;
        
        INSERT INTO public.nfse_integration_logs (
            invoice_id,
            operation,
            request_data,
            response_data,
            status,
            processing_time_ms
        ) VALUES (
            test_invoice_id,
            'issue',
            '{"valor": 150.00, "descricao": "Consulta oftalmológica"}'::jsonb,
            '{"sucesso": true, "numero_nfse": "NFS-e-TEST-001"}'::jsonb,
            'success',
            1250
        );
    END IF;
END $$;