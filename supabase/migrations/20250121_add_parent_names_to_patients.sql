-- Adicionar campos nome_pai e nome_mae na tabela patients
-- Para manter compatibilidade com a tabela clientes do sistema externo

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS nome_pai TEXT,
ADD COLUMN IF NOT EXISTS nome_mae TEXT;

-- Comentários para documentação
COMMENT ON COLUMN patients.nome_pai IS 'Nome do pai do paciente';
COMMENT ON COLUMN patients.nome_mae IS 'Nome da mãe do paciente';
