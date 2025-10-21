-- Query para descobrir a constraint do campo sexo
-- Execute isso no SQL Editor do Supabase do sistema EXTERNO

-- 1. Ver a definição da constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'clientes_sexo_check';

-- 2. Ver valores únicos existentes na tabela
SELECT DISTINCT sexo, COUNT(*) as total
FROM clientes
WHERE sexo IS NOT NULL
GROUP BY sexo
ORDER BY total DESC;

-- 3. Ver a definição completa da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'clientes' AND column_name = 'sexo';
