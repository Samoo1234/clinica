# Verificar Estrutura da Tabela Clientes

## Como verificar manualmente:

### **Opção 1: Via Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **dmsaqxuoruinwpnonpky** (Sistema Externo)
3. Vá em **Table Editor**
4. Clique na tabela **clientes**
5. Veja todas as colunas disponíveis

### **Opção 2: Via SQL Editor**

Execute este SQL no projeto **dmsaqxuoruinwpnonpky**:

```sql
-- Ver estrutura da tabela clientes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clientes'
ORDER BY ordinal_position;
```

### **Opção 3: Ver alguns registros**

```sql
-- Ver primeiros 5 clientes para entender os dados
SELECT * FROM clientes LIMIT 5;
```

---

## **Me envie o resultado!**

Depois de executar uma dessas opções, me envie:
- Quais colunas existem na tabela `clientes`
- Exemplos de dados (se possível)

Assim posso ajustar o código para importar **todos os campos** disponíveis!

---

## **Provável estrutura (baseado no padrão):**

A tabela `clientes` provavelmente tem:
- `id` - UUID
- `nome` - Nome completo
- `cpf` - CPF
- `telefone` - Telefone
- `email` - Email
- `data_nascimento` - Data de nascimento
- `endereco` - Endereço completo
- `cidade` - Cidade
- `estado` - Estado (UF)
- `cep` - CEP
- `created_at` - Data de criação
- `updated_at` - Data de atualização

**Mas preciso confirmar para fazer a integração correta!**
