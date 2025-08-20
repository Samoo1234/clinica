# API de Integração Externa - VisionCare

## Visão Geral

A API de Integração Externa permite que parceiros externos (óticas, farmácias, laboratórios) acessem dados específicos do sistema VisionCare de forma segura e controlada. A API utiliza autenticação baseada em chaves API e implementa controle granular de permissões.

## Autenticação

Todos os endpoints da API externa requerem autenticação via headers HTTP:

```http
X-API-Key: sua-chave-api
X-API-Secret: seu-segredo-api
```

### Obtenção de Credenciais

As credenciais são fornecidas pelo administrador do sistema VisionCare através dos endpoints administrativos.

## Endpoints Administrativos

### Gerenciamento de Parceiros

#### Criar Parceiro
```http
POST /api/external/admin/partners
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "name": "Ótica Exemplo",
  "partner_type": "optics",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@oticaexemplo.com",
  "phone": "(11) 99999-9999",
  "address": {
    "street": "Rua Exemplo, 123",
    "city": "São Paulo",
    "state": "SP"
  },
  "permissions": {
    "patient_access": true,
    "patient_search": true,
    "prescription_access": true
  },
  "webhook_url": "https://oticaexemplo.com/webhook"
}
```

**Resposta:**
```json
{
  "id": "partner-uuid",
  "name": "Ótica Exemplo",
  "partner_type": "optics",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@oticaexemplo.com",
  "api_key": "chave-api-gerada",
  "api_secret": "segredo-api-gerado",
  "status": "active",
  "permissions": {
    "patient_access": true,
    "patient_search": true,
    "prescription_access": true
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Listar Parceiros
```http
GET /api/external/admin/partners
Authorization: Bearer {jwt-token}
```

#### Obter Parceiro por ID
```http
GET /api/external/admin/partners/{partner-id}
Authorization: Bearer {jwt-token}
```

#### Atualizar Parceiro
```http
PUT /api/external/admin/partners/{partner-id}
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "status": "inactive",
  "permissions": {
    "patient_access": false,
    "patient_search": true,
    "prescription_access": true
  }
}
```

#### Excluir Parceiro
```http
DELETE /api/external/admin/partners/{partner-id}
Authorization: Bearer {jwt-token}
```

#### Logs de Acesso do Parceiro
```http
GET /api/external/admin/partners/{partner-id}/logs?limit=100
Authorization: Bearer {jwt-token}
```

#### Estatísticas do Parceiro
```http
GET /api/external/admin/partners/{partner-id}/stats
Authorization: Bearer {jwt-token}
```

**Resposta:**
```json
{
  "totalRequests": 150,
  "successfulRequests": 145,
  "failedRequests": 5,
  "prescriptionsShared": 25,
  "prescriptionsDispensed": 20
}
```

#### Compartilhar Receita
```http
POST /api/external/admin/prescriptions/share
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "record_id": "record-uuid",
  "partner_id": "partner-uuid",
  "patient_id": "patient-uuid",
  "prescription_data": {
    "prescription": "Óculos com grau -0.5 OD, -0.75 OE",
    "doctor_name": "Dr. João Silva",
    "doctor_crm": "12345-SP",
    "date": "2024-01-01"
  },
  "notes": "Receita válida por 90 dias"
}
```

## Endpoints da API Externa

### Teste de Autenticação
```http
GET /api/external/api/test
X-API-Key: sua-chave-api
X-API-Secret: seu-segredo-api
```

**Resposta:**
```json
{
  "message": "Authentication successful",
  "partner": {
    "id": "partner-uuid",
    "name": "Ótica Exemplo",
    "type": "optics"
  }
}
```

### Acesso a Dados de Pacientes

#### Obter Paciente por ID
```http
GET /api/external/api/patients/{patient-id}
X-API-Key: sua-chave-api
X-API-Secret: seu-segredo-api
```

**Permissão necessária:** `patient_access`

**Resposta:**
```json
{
  "id": "patient-uuid",
  "name": "João Silva",
  "birth_date": "1990-01-01",
  "phone": "(11) 98765-4321",
  "email": "joao@email.com"
}
```

#### Buscar Paciente por CPF
```http
GET /api/external/api/patients/search/{cpf}
X-API-Key: sua-chave-api
X-API-Secret: seu-segredo-api
```

**Permissão necessária:** `patient_search`

**Resposta:** Mesmo formato do endpoint anterior.

### Gerenciamento de Receitas

#### Listar Receitas Compartilhadas
```http
GET /api/external/api/prescriptions
X-API-Key: sua-chave-api
X-API-Secret: seu-segredo-api
```

**Permissão necessária:** `prescription_access`

**Resposta:**
```json
[
  {
    "id": "share-uuid",
    "record_id": "record-uuid",
    "patient_id": "patient-uuid",
    "prescription_data": {
      "prescription": "Óculos com grau -0.5 OD, -0.75 OE",
      "doctor_name": "Dr. João Silva",
      "doctor_crm": "12345-SP",
      "date": "2024-01-01"
    },
    "status": "shared",
    "shared_at": "2024-01-01T10:00:00Z",
    "notes": "Receita válida por 90 dias"
  }
]
```

#### Confirmar Aviamento de Receita
```http
POST /api/external/api/prescriptions/{share-id}/dispense
X-API-Key: sua-chave-api
X-API-Secret: seu-segredo-api
Content-Type: application/json

{
  "dispensed_by": "João Farmacêutico",
  "notes": "Óculos entregue ao paciente"
}
```

**Permissão necessária:** `prescription_access`

**Resposta:**
```json
{
  "id": "share-uuid",
  "status": "dispensed",
  "dispensed_at": "2024-01-01T15:30:00Z",
  "dispensed_by": "João Farmacêutico",
  "notes": "Óculos entregue ao paciente"
}
```

### Estatísticas do Parceiro

#### Obter Estatísticas Próprias
```http
GET /api/external/api/stats
X-API-Key: sua-chave-api
X-API-Secret: seu-segredo-api
```

**Resposta:**
```json
{
  "totalRequests": 150,
  "successfulRequests": 145,
  "failedRequests": 5,
  "prescriptionsShared": 25,
  "prescriptionsDispensed": 20
}
```

## Tipos de Parceiros

- `optics`: Óticas
- `pharmacy`: Farmácias
- `laboratory`: Laboratórios
- `other`: Outros tipos de parceiros

## Permissões Disponíveis

- `patient_access`: Acesso a dados básicos de pacientes por ID
- `patient_search`: Busca de pacientes por CPF
- `prescription_access`: Acesso a receitas compartilhadas e confirmação de aviamento

## Status de Parceiros

- `active`: Parceiro ativo, pode acessar a API
- `inactive`: Parceiro inativo, acesso negado
- `suspended`: Parceiro suspenso temporariamente

## Status de Receitas

- `pending`: Receita aguardando compartilhamento
- `shared`: Receita compartilhada com o parceiro
- `dispensed`: Receita aviada/dispensada
- `cancelled`: Receita cancelada

## Códigos de Erro

### Autenticação
- `401`: Credenciais inválidas ou ausentes
- `403`: Parceiro inativo ou sem permissão

### Recursos
- `404`: Recurso não encontrado
- `400`: Dados inválidos na requisição

### Servidor
- `500`: Erro interno do servidor

## Logs e Auditoria

Todas as requisições à API externa são registradas com:
- ID do parceiro
- Endpoint acessado
- Dados da requisição e resposta
- Status da operação
- IP e User-Agent
- Timestamp

## Webhooks

Parceiros podem configurar URLs de webhook para receber notificações sobre:
- Novas receitas compartilhadas
- Atualizações de status
- Eventos importantes

### Formato do Webhook
```json
{
  "event": "prescription_shared",
  "data": {
    "id": "share-uuid",
    "patient_id": "patient-uuid",
    "prescription_data": {...},
    "shared_at": "2024-01-01T10:00:00Z"
  }
}
```

## Limitações e Considerações

1. **Rate Limiting**: Aplicado globalmente (100 req/15min por IP)
2. **Dados Sensíveis**: CPF e endereço não são expostos na API externa
3. **Logs de Auditoria**: Mantidos por tempo indefinido para compliance
4. **Webhook Timeout**: 30 segundos para resposta
5. **Retry Policy**: Webhooks são tentados 3 vezes em caso de falha

## Exemplos de Integração

### Busca e Aviamento de Receita (Ótica)

```javascript
// 1. Buscar paciente por CPF
const patient = await fetch('/api/external/api/patients/search/123.456.789-00', {
  headers: {
    'X-API-Key': 'sua-chave',
    'X-API-Secret': 'seu-segredo'
  }
});

// 2. Listar receitas disponíveis
const prescriptions = await fetch('/api/external/api/prescriptions', {
  headers: {
    'X-API-Key': 'sua-chave',
    'X-API-Secret': 'seu-segredo'
  }
});

// 3. Confirmar aviamento
await fetch('/api/external/api/prescriptions/share-uuid/dispense', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sua-chave',
    'X-API-Secret': 'seu-segredo',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dispensed_by: 'João Ótico',
    notes: 'Óculos entregue'
  })
});
```

## Suporte

Para dúvidas sobre a integração, entre em contato com o suporte técnico do VisionCare.