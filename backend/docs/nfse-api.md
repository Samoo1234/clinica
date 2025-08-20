# API de Integração com Emissor de NFS-e

Esta documentação descreve a API para integração com emissores de Nota Fiscal de Serviço eletrônica (NFS-e) no sistema VisionCare.

## Visão Geral

A API de NFS-e permite:
- Emitir notas fiscais automaticamente após pagamento de consultas
- Cancelar notas fiscais emitidas
- Consultar status e dados de notas fiscais
- Gerar relatórios fiscais
- Configurar integração com diferentes provedores de NFS-e

## Base URL

```
/api/nfse
```

## Autenticação

Todas as rotas requerem autenticação via JWT token no header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Emitir Nota Fiscal

Emite uma nova nota fiscal para um agendamento.

**POST** `/issue`

#### Request Body

```json
{
  "appointment_id": "uuid",
  "amount": 150.00,
  "service_description": "Consulta oftalmológica"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "appointment_id": "uuid",
    "nfse_number": "NFS-e-2024-001",
    "nfse_verification_code": "ABC123DEF456",
    "nfse_url": "https://exemplo.com/nfse/001",
    "amount": 150.00,
    "service_description": "Consulta oftalmológica",
    "tax_amount": 7.50,
    "net_amount": 142.50,
    "issue_date": "2024-01-15T10:30:00Z",
    "status": "issued",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Possíveis Erros

- `400 Bad Request`: Dados obrigatórios ausentes
- `404 Not Found`: Agendamento não encontrado
- `400 Bad Request`: Já existe nota fiscal para este agendamento
- `500 Internal Server Error`: Erro na emissão da NFS-e

### 2. Buscar Nota Fiscal por ID

**GET** `/invoice/:id`

#### Response (200 OK)

```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "appointment_id": "uuid",
    "nfse_number": "NFS-e-2024-001",
    "amount": 150.00,
    "status": "issued",
    // ... outros campos
  }
}
```

### 3. Buscar Notas Fiscais de um Agendamento

**GET** `/appointment/:appointmentId/invoices`

#### Response (200 OK)

```json
{
  "success": true,
  "invoices": [
    {
      "id": "uuid",
      "appointment_id": "uuid",
      "nfse_number": "NFS-e-2024-001",
      "status": "issued",
      // ... outros campos
    }
  ]
}
```

### 4. Listar Notas Fiscais

**GET** `/invoices`

#### Query Parameters

- `status` (opcional): Filtrar por status (`pending`, `processing`, `issued`, `error`, `cancelled`)
- `start_date` (opcional): Data inicial (ISO 8601)
- `end_date` (opcional): Data final (ISO 8601)
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de registros para pular (padrão: 0)

#### Response (200 OK)

```json
{
  "success": true,
  "invoices": [
    {
      "id": "uuid",
      "nfse_number": "NFS-e-2024-001",
      "amount": 150.00,
      "status": "issued",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 25
}
```

### 5. Cancelar Nota Fiscal

**POST** `/invoice/:id/cancel`

#### Request Body

```json
{
  "reason": "Cancelamento por solicitação do cliente"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "status": "cancelled",
    // ... outros campos
  }
}
```

### 6. Retentar Emissão

**POST** `/invoice/:id/retry`

#### Response (200 OK)

```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "status": "issued",
    "nfse_number": "NFS-e-2024-002",
    // ... outros campos
  }
}
```

### 7. Buscar Configuração

**GET** `/config`

#### Response (200 OK)

```json
{
  "success": true,
  "config": {
    "id": "uuid",
    "provider_name": "Provedor NFS-e",
    "api_url": "https://api-nfse.exemplo.com.br",
    "api_key": "***",
    "city_code": "3304557",
    "cnpj": "12.345.678/0001-90",
    "service_code": "1401",
    "tax_rate": 5.00,
    "active": true
  }
}
```

### 8. Atualizar Configuração

**PUT** `/config`

#### Request Body

```json
{
  "provider_name": "Novo Provedor",
  "api_url": "https://nova-api.exemplo.com.br",
  "api_key": "nova-chave-api",
  "tax_rate": 6.00
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "config": {
    // ... configuração atualizada
  }
}
```

### 9. Buscar Logs de Integração

**GET** `/logs`

#### Query Parameters

- `invoice_id` (opcional): Filtrar por ID da nota fiscal
- `operation` (opcional): Filtrar por operação (`issue`, `cancel`, `query`)
- `status` (opcional): Filtrar por status (`success`, `error`)
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de registros para pular (padrão: 0)

#### Response (200 OK)

```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "invoice_id": "uuid",
      "operation": "issue",
      "status": "success",
      "processing_time_ms": 1250,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15
}
```

### 10. Relatório de Notas Fiscais

**GET** `/report`

#### Query Parameters

- `start_date` (opcional): Data inicial
- `end_date` (opcional): Data final
- `status` (opcional): Filtrar por status

#### Response (200 OK)

```json
{
  "success": true,
  "invoices": [
    {
      "id": "uuid",
      "nfse_number": "NFS-e-2024-001",
      "amount": 150.00,
      "tax_amount": 7.50,
      "net_amount": 142.50,
      "status": "issued",
      "issue_date": "2024-01-15T10:30:00Z",
      "patient_name": "João Silva",
      "patient_cpf": "123.456.789-00",
      "doctor_name": "Dr. Maria Santos"
    }
  ],
  "summary": {
    "total_invoices": 25,
    "total_amount": 3750.00,
    "total_tax": 187.50,
    "total_net": 3562.50,
    "by_status": {
      "issued": 20,
      "cancelled": 3,
      "error": 2
    }
  }
}
```

## Status de Nota Fiscal

- `pending`: Aguardando processamento
- `processing`: Em processamento
- `issued`: Emitida com sucesso
- `error`: Erro na emissão
- `cancelled`: Cancelada

## Códigos de Erro

### Emissão de NFS-e

- `NFSE_001`: Configuração não encontrada
- `NFSE_002`: Agendamento não encontrado
- `NFSE_003`: Nota fiscal já existe para este agendamento
- `NFSE_004`: Erro na API do emissor
- `NFSE_005`: Dados inválidos para emissão

### Cancelamento

- `NFSE_101`: Nota fiscal não encontrada
- `NFSE_102`: Nota fiscal não pode ser cancelada
- `NFSE_103`: Erro no cancelamento via API

### Retry

- `NFSE_201`: Nota fiscal não está em status de erro
- `NFSE_202`: Limite de tentativas excedido
- `NFSE_203`: Dados do agendamento não encontrados

## Integração com API Externa

### Formato de Requisição para Emissor

```json
{
  "prestador": {
    "cnpj": "12.345.678/0001-90",
    "inscricao_municipal": "123456789"
  },
  "tomador": {
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "email": "joao@exemplo.com"
  },
  "servico": {
    "codigo": "1401",
    "descricao": "Consulta oftalmológica",
    "valor": 150.00,
    "aliquota_iss": 5.00
  },
  "numero_rps": "uuid-do-agendamento",
  "data_emissao": "2024-01-15T10:30:00Z"
}
```

### Formato de Resposta do Emissor

```json
{
  "sucesso": true,
  "numero_nfse": "NFS-e-2024-001",
  "codigo_verificacao": "ABC123DEF456",
  "url_visualizacao": "https://exemplo.com/nfse/001",
  "data_emissao": "2024-01-15T10:30:00Z",
  "valor_total": 150.00,
  "valor_iss": 7.50
}
```

## Configuração de Ambiente

### Variáveis de Ambiente

```env
# Configuração do emissor de NFS-e
NFSE_PROVIDER_NAME=Nome do Provedor
NFSE_API_URL=https://api-nfse.exemplo.com.br
NFSE_API_KEY=sua-chave-api
NFSE_CITY_CODE=codigo-da-cidade
NFSE_CNPJ=12.345.678/0001-90
NFSE_MUNICIPAL_INSCRIPTION=123456789
NFSE_SERVICE_CODE=1401
NFSE_TAX_RATE=5.00
```

## Exemplos de Uso

### Emitir NFS-e após Pagamento

```javascript
// Após confirmar pagamento de uma consulta
const response = await fetch('/api/nfse/issue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    appointment_id: appointmentId,
    amount: 150.00,
    service_description: 'Consulta oftalmológica'
  })
});

const result = await response.json();
if (result.success) {
  console.log('NFS-e emitida:', result.invoice.nfse_number);
}
```

### Consultar Status de NFS-e

```javascript
const response = await fetch(`/api/nfse/invoice/${invoiceId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log('Status:', result.invoice.status);
```

### Gerar Relatório Mensal

```javascript
const startDate = '2024-01-01T00:00:00Z';
const endDate = '2024-01-31T23:59:59Z';

const response = await fetch(`/api/nfse/report?start_date=${startDate}&end_date=${endDate}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log('Total faturado:', result.summary.total_amount);
```

## Considerações de Segurança

1. **Autenticação**: Todas as rotas requerem autenticação
2. **Autorização**: Apenas usuários com permissão podem acessar configurações
3. **Logs**: Todas as operações são registradas para auditoria
4. **Dados Sensíveis**: Chaves de API são mascaradas nas respostas
5. **Rate Limiting**: Implementado para evitar abuso da API

## Monitoramento e Logs

- Todos os requests para APIs externas são logados
- Tempos de resposta são registrados
- Erros são categorizados e alertas são enviados
- Métricas de sucesso/falha são coletadas

## Suporte a Múltiplos Provedores

O sistema suporta integração com diferentes provedores de NFS-e:

- Nota Carioca (Rio de Janeiro)
- ISS Online (São Paulo)
- NFS-e Nacional
- Outros provedores compatíveis com padrão ABRASF