# Guia de Configuração - Integração NFS-e

Este guia descreve como configurar e implementar a integração com emissores de Nota Fiscal de Serviço eletrônica (NFS-e) no sistema VisionCare.

## Pré-requisitos

1. **Banco de Dados**: PostgreSQL configurado com Supabase
2. **Certificado Digital**: Certificado A1 ou A3 para assinatura digital (se necessário)
3. **Credenciais do Emissor**: API key e configurações do provedor de NFS-e
4. **Dados da Empresa**: CNPJ, Inscrição Municipal, códigos de serviço

## Instalação

### 1. Executar Scripts do Banco de Dados

```bash
# Navegar para o diretório do backend
cd backend

# Executar script de criação das tabelas
psql -h your-supabase-host -U postgres -d your-database -f database/nfse-schema.sql

# Executar script de configuração inicial
psql -h your-supabase-host -U postgres -d your-database -f database/setup-nfse.sql
```

### 2. Instalar Dependências

```bash
# Instalar axios para chamadas HTTP (se não estiver instalado)
npm install axios

# Instalar tipos do axios para TypeScript
npm install --save-dev @types/axios
```

### 3. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```env
# Configuração NFS-e
NFSE_PROVIDER_NAME="Nome do Provedor"
NFSE_API_URL="https://api-nfse.exemplo.com.br"
NFSE_API_KEY="sua-chave-api-aqui"
NFSE_CITY_CODE="3304557"  # Código IBGE da cidade
NFSE_CNPJ="12.345.678/0001-90"
NFSE_MUNICIPAL_INSCRIPTION="123456789"
NFSE_SERVICE_CODE="1401"  # Código do serviço médico
NFSE_TAX_RATE="5.00"      # Taxa de ISS em percentual

# Certificado Digital (se necessário)
NFSE_CERTIFICATE_PATH="/path/to/certificate.p12"
NFSE_CERTIFICATE_PASSWORD="senha-do-certificado"
```

## Configuração por Provedor

### Nota Carioca (Rio de Janeiro)

```env
NFSE_PROVIDER_NAME="Nota Carioca"
NFSE_API_URL="https://notacarioca.rio.gov.br/WSNacional/nfse.asmx"
NFSE_CITY_CODE="3304557"
NFSE_SERVICE_CODE="1401"
NFSE_TAX_RATE="5.00"
```

### ISS Online (São Paulo)

```env
NFSE_PROVIDER_NAME="ISS Online"
NFSE_API_URL="https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx"
NFSE_CITY_CODE="3550308"
NFSE_SERVICE_CODE="1401"
NFSE_TAX_RATE="5.00"
```

### NFS-e Nacional

```env
NFSE_PROVIDER_NAME="NFS-e Nacional"
NFSE_API_URL="https://www.nfse.gov.br/NfseWS/nfse.asmx"
NFSE_CITY_CODE="codigo-da-cidade"
NFSE_SERVICE_CODE="1401"
NFSE_TAX_RATE="5.00"
```

## Configuração Inicial

### 1. Configurar Dados da Empresa

Execute o seguinte SQL para configurar os dados da sua clínica:

```sql
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
    'Seu Provedor NFS-e',
    'https://api-do-seu-provedor.com.br',
    'sua-api-key',
    'codigo-da-cidade',
    'seu-cnpj',
    'sua-inscricao-municipal',
    '1401',  -- Código para serviços médicos
    5.00,    -- Taxa de ISS
    true
);
```

### 2. Testar Configuração

```bash
# Executar testes para verificar configuração
npm test -- nfse-simple.test.ts
```

### 3. Verificar Conectividade

```bash
# Testar conexão com a API do emissor
curl -X GET "http://localhost:3001/api/nfse/config" \
  -H "Authorization: Bearer seu-jwt-token"
```

## Códigos de Serviço Médico

### Principais Códigos para Oftalmologia

- `1401` - Serviços médicos e hospitalares
- `1402` - Análises clínicas e patologia clínica
- `1403` - Imagenologia, radiologia, tomografia e congêneres
- `1404` - Terapias de qualquer espécie
- `1405` - Cirurgia e anestesiologia

### Verificar Código Específico

Consulte a prefeitura da sua cidade para obter o código específico para serviços oftalmológicos.

## Configuração de Certificado Digital

### Certificado A1 (arquivo .p12)

```env
NFSE_CERTIFICATE_PATH="/path/to/certificado.p12"
NFSE_CERTIFICATE_PASSWORD="senha-do-certificado"
```

### Certificado A3 (token/smartcard)

Para certificados A3, você precisará configurar o middleware do fabricante do token.

## Testes

### Executar Todos os Testes

```bash
# Testes básicos
npm test -- nfse-simple.test.ts

# Testes de integração
npm test -- nfse-integration.test.ts

# Testes completos
npm test -- nfse.test.ts
```

### Teste Manual via API

```bash
# Emitir nota fiscal de teste
curl -X POST "http://localhost:3001/api/nfse/issue" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu-jwt-token" \
  -d '{
    "appointment_id": "uuid-do-agendamento",
    "amount": 150.00,
    "service_description": "Consulta oftalmológica"
  }'
```

## Monitoramento

### Logs de Integração

```sql
-- Verificar logs recentes
SELECT * FROM nfse_integration_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar erros
SELECT * FROM nfse_integration_logs 
WHERE status = 'error' 
ORDER BY created_at DESC;
```

### Métricas de Performance

```sql
-- Tempo médio de processamento
SELECT 
    operation,
    AVG(processing_time_ms) as avg_time_ms,
    COUNT(*) as total_operations
FROM nfse_integration_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY operation;
```

### Status das Notas Fiscais

```sql
-- Resumo por status
SELECT 
    status,
    COUNT(*) as total,
    SUM(amount) as total_amount
FROM invoices 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status;
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Autenticação

```
Erro: "API key inválida"
```

**Solução**: Verificar se a API key está correta e ativa no provedor.

#### 2. Erro de Certificado

```
Erro: "Certificado digital inválido"
```

**Solução**: 
- Verificar se o certificado não está vencido
- Confirmar senha do certificado
- Verificar se o certificado é válido para NFS-e

#### 3. Erro de Dados

```
Erro: "CPF/CNPJ inválido"
```

**Solução**: Validar formato dos documentos antes de enviar.

#### 4. Timeout na API

```
Erro: "Timeout na requisição"
```

**Solução**: 
- Verificar conectividade de rede
- Aumentar timeout se necessário
- Verificar status do provedor

### Logs de Debug

Para ativar logs detalhados:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

### Verificar Configuração

```bash
# Verificar se as tabelas foram criadas
psql -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%nfse%' OR table_name = 'invoices';"

# Verificar configuração ativa
psql -c "SELECT * FROM nfse_config WHERE active = true;"
```

## Backup e Recuperação

### Backup das Configurações

```bash
# Backup da configuração
pg_dump -h your-host -U postgres -t nfse_config your-database > nfse_config_backup.sql

# Backup das notas fiscais
pg_dump -h your-host -U postgres -t invoices your-database > invoices_backup.sql
```

### Restauração

```bash
# Restaurar configuração
psql -h your-host -U postgres -d your-database < nfse_config_backup.sql

# Restaurar notas fiscais
psql -h your-host -U postgres -d your-database < invoices_backup.sql
```

## Segurança

### Proteção de Dados Sensíveis

1. **API Keys**: Nunca commitar chaves de API no código
2. **Certificados**: Armazenar certificados em local seguro
3. **Logs**: Não logar dados sensíveis como CPF completo
4. **Backup**: Criptografar backups que contenham dados fiscais

### Auditoria

```sql
-- Criar trigger para auditoria
CREATE OR REPLACE FUNCTION audit_invoice_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name,
        operation,
        old_values,
        new_values,
        user_id,
        timestamp
    ) VALUES (
        'invoices',
        TG_OP,
        row_to_json(OLD),
        row_to_json(NEW),
        current_user,
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_invoice_changes();
```

## Manutenção

### Limpeza de Logs Antigos

```sql
-- Remover logs mais antigos que 1 ano
DELETE FROM nfse_integration_logs 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Atualização de Configuração

```sql
-- Atualizar taxa de ISS
UPDATE nfse_config 
SET tax_rate = 6.00 
WHERE active = true;
```

### Monitoramento de Performance

```sql
-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_status_created_at ON invoices(status, created_at);
CREATE INDEX IF NOT EXISTS idx_nfse_logs_created_at ON nfse_integration_logs(created_at);
```

## Suporte

Para suporte técnico:

1. Verificar logs de erro no sistema
2. Consultar documentação do provedor de NFS-e
3. Verificar status dos serviços do provedor
4. Contatar suporte técnico do provedor se necessário

## Atualizações

### Versioning da API

O sistema suporta versionamento da API para compatibilidade:

```typescript
// Exemplo de versionamento
const apiVersion = config.api_version || 'v1';
const apiUrl = `${config.api_url}/${apiVersion}/nfse/emitir`;
```

### Migração de Dados

Para atualizações que requerem migração:

```sql
-- Exemplo de migração
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS new_field VARCHAR(100);
UPDATE invoices SET new_field = 'default_value' WHERE new_field IS NULL;
```