-- Schema para integração com emissor de NFS-e (CORRIGIDO)
-- Este script adiciona as colunas necessárias à tabela invoices existente

-- Adicionar colunas que faltam na tabela invoices existente
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS nfse_verification_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS nfse_url TEXT,
ADD COLUMN IF NOT EXISTS service_description TEXT,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Adicionar novo valor ao enum invoice_status
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'processing';

-- Tabela para configurações do emissor de NFS-e
CREATE TABLE IF NOT EXISTS public.nfse_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(100) NOT NULL, -- Nome do provedor (ex: Nota Carioca, ISS Online, etc)
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

-- Tabela para logs de integração com NFS-e
CREATE TABLE IF NOT EXISTS public.nfse_integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    operation VARCHAR(50) NOT NULL, -- 'issue', 'cancel', 'query', etc
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_invoices_nfse_number ON public.invoices(nfse_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON public.invoices(issued_at);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_invoice_id ON public.nfse_integration_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_operation ON public.nfse_integration_logs(operation);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_created_at ON public.nfse_integration_logs(created_at);

-- Trigger para atualizar updated_at na tabela nfse_config
CREATE TRIGGER update_nfse_config_updated_at 
    BEFORE UPDATE ON public.nfse_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para novas tabelas
ALTER TABLE public.nfse_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse_integration_logs ENABLE ROW LEVEL SECURITY;

-- Política para nfse_config - apenas administradores
CREATE POLICY "Only admins can manage nfse_config" ON public.nfse_config
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Política para logs - usuários autenticados podem visualizar
CREATE POLICY "Users can view nfse_logs" ON public.nfse_integration_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert nfse_logs" ON public.nfse_integration_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');