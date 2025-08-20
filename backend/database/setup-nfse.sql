-- Setup script para integração com NFS-e
-- Execute este script para configurar as tabelas e dados iniciais

-- Executar o schema principal
\i nfse-schema.sql

-- Inserir configuração padrão para desenvolvimento/teste
INSERT INTO nfse_config (
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
    'Provedor Teste NFS-e',
    'https://api-teste-nfse.exemplo.com.br',
    'test-api-key-12345',
    '3304557', -- Código do Rio de Janeiro
    '12.345.678/0001-90',
    '123456789',
    '1401', -- Código de serviço médico
    5.00, -- 5% de ISS
    true
) ON CONFLICT DO NOTHING;

-- Inserir alguns dados de teste para desenvolvimento
DO $$
DECLARE
    test_appointment_id UUID;
    test_invoice_id UUID;
BEGIN
    -- Buscar um appointment existente para teste
    SELECT id INTO test_appointment_id FROM appointments LIMIT 1;
    
    IF test_appointment_id IS NOT NULL THEN
        -- Inserir nota fiscal de teste
        INSERT INTO invoices (
            appointment_id,
            nfse_number,
            nfse_verification_code,
            amount,
            service_description,
            tax_amount,
            net_amount,
            issue_date,
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
            '{"numero": "NFS-e-TEST-001", "codigo_verificacao": "ABC123DEF456", "url_visualizacao": "https://exemplo.com/nfse/001"}'::jsonb
        ) RETURNING id INTO test_invoice_id;
        
        -- Inserir log de teste
        INSERT INTO nfse_integration_logs (
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

-- Criar função para buscar próximo número de NFS-e
CREATE OR REPLACE FUNCTION get_next_nfse_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_number INTEGER;
    formatted_number VARCHAR(50);
BEGIN
    -- Buscar o maior número atual e incrementar
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(nfse_number FROM '[0-9]+') AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM invoices 
    WHERE nfse_number IS NOT NULL 
    AND nfse_number ~ '^[0-9]+$';
    
    -- Formatar com zeros à esquerda
    formatted_number := LPAD(next_number::TEXT, 8, '0');
    
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Criar função para calcular impostos
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
    -- Se não foi fornecida taxa, buscar da configuração
    IF tax_rate IS NULL THEN
        SELECT nfse_config.tax_rate INTO config_tax_rate
        FROM nfse_config 
        WHERE active = true 
        LIMIT 1;
        
        tax_rate := COALESCE(config_tax_rate, 0);
    END IF;
    
    -- Calcular valores
    calculated_tax := ROUND(gross_amount * (tax_rate / 100), 2);
    calculated_net := gross_amount - calculated_tax;
    
    RETURN QUERY SELECT calculated_tax, calculated_net;
END;
$$ LANGUAGE plpgsql;

-- Criar view para relatórios de NFS-e
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.id,
    i.nfse_number,
    i.amount,
    i.tax_amount,
    i.net_amount,
    i.status,
    i.issue_date,
    i.created_at,
    a.scheduled_at as appointment_date,
    p.name as patient_name,
    p.cpf as patient_cpf,
    u.name as doctor_name
FROM invoices i
JOIN appointments a ON i.appointment_id = a.id
JOIN patients p ON a.patient_id = p.id
JOIN users u ON a.doctor_id = u.id
ORDER BY i.created_at DESC;

COMMENT ON VIEW invoice_summary IS 'View consolidada para relatórios de notas fiscais com dados do paciente e médico';