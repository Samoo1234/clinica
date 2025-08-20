-- Schema para integração com emissor de NFS-e
-- Tabela para armazenar dados das notas fiscais emitidas

-- Tabela principal de notas fiscais
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    nfse_number VARCHAR(50),
    nfse_verification_code VARCHAR(100),
    nfse_url TEXT,
    amount DECIMAL(10,2) NOT NULL,
    service_description TEXT NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    issue_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'issued', 'error', 'cancelled')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    nfse_data JSONB, -- Dados completos retornados pela API do emissor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações do emissor de NFS-e
CREATE TABLE IF NOT EXISTS nfse_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE TABLE IF NOT EXISTS nfse_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    operation VARCHAR(50) NOT NULL, -- 'issue', 'cancel', 'query', etc
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_invoices_appointment_id ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_nfse_number ON invoices(nfse_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_invoice_id ON nfse_integration_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_operation ON nfse_integration_logs(operation);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_created_at ON nfse_integration_logs(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nfse_config_updated_at 
    BEFORE UPDATE ON nfse_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfse_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfse_integration_logs ENABLE ROW LEVEL SECURITY;

-- Política para invoices - usuários autenticados podem ver/editar
CREATE POLICY "Users can view invoices" ON invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert invoices" ON invoices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update invoices" ON invoices
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para nfse_config - apenas administradores
CREATE POLICY "Only admins can manage nfse_config" ON nfse_config
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
    );

-- Política para logs - usuários autenticados podem visualizar
CREATE POLICY "Users can view nfse_logs" ON nfse_integration_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert nfse_logs" ON nfse_integration_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');