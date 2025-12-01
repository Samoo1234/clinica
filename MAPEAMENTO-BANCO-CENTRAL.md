# 📊 MAPEAMENTO: Páginas que Precisam do Banco Central de Clientes

## 🎯 Resumo Executivo

O sistema VisionCare possui **duas fontes de dados de pacientes/clientes**:
- **`patients`** (tabela local do VisionCare) - Pacientes cadastrados diretamente na clínica
- **`clientes`** (Banco Central Supabase) - Clientes compartilhados entre sistemas

### Status da Integração (Atualizado em 27/11/2025)

| Página | Status | Fonte de Dados | Observação |
|--------|--------|----------------|------------|
| AppointmentsExternal | ✅ Integrado | Banco Central | Já funcionava |
| Patients | ✅ Integrado | Banco Central | `PatientCentralService` |
| Appointments | ✅ Integrado | Banco Central | `PatientCentralService` |
| Consultations | ✅ Integrado | Banco Central | Usa agendamentos externos |
| MedicalRecords | ✅ Integrado | Banco Central | `PatientSelector` atualizado |
| Dashboard | ✅ Integrado | Banco Central | Contagem real de pacientes |
| Financial | ✅ Integrado | Banco Central | Via appointments |
| Reports | ⚠️ Pendente | Local | Baixa prioridade |

---

## 📋 DETALHAMENTO POR PÁGINA

---

### 1️⃣ **Patients.tsx** (Pacientes)
**Prioridade: 🔴 ALTA**

**Localização:** `frontend/src/pages/Patients.tsx`

**Situação Atual:**
- Usa `PatientService` de `services/patients.ts`
- Busca dados da tabela local `patients`
- Componentes: `PatientList`, `PatientForm`, `PatientDetails`

**O que precisa mudar:**
```
Atual:  PatientService → API Backend → Tabela `patients` (local)
Futuro: ClienteCentralService → API Backend → Tabela `clientes` (central)
```

**Arquivos a alterar:**
- `frontend/src/pages/Patients.tsx`
- `frontend/src/components/patients/PatientList.tsx`
- `frontend/src/components/patients/PatientForm.tsx`
- `frontend/src/components/patients/PatientDetails.tsx`
- `frontend/src/services/patients.ts` (ou substituir por `central-clients.ts`)

**Campos a mapear:**
| Campo Local (`patients`) | Campo Central (`clientes`) |
|--------------------------|----------------------------|
| `id` | `id` |
| `name` | `nome` |
| `cpf` | `cpf` |
| `birth_date` | `data_nascimento` |
| `phone` | `telefone` |
| `email` | `email` |
| `address` (JSONB) | `endereco` (JSONB) |
| `created_at` | `created_at` |
| - | `cadastro_completo` (novo) |
| - | `active` (novo) |

---

### 2️⃣ **Appointments.tsx** (Agendamentos)
**Prioridade: 🔴 ALTA**

**Localização:** `frontend/src/pages/Appointments.tsx`

**Situação Atual:**
- Usa `appointmentService` de `services/appointments.ts`
- Busca pacientes via relação com tabela `patients`
- Formulário `AppointmentForm` permite selecionar paciente

**O que precisa mudar:**
- Ao criar agendamento, buscar cliente no Banco Central
- Se não existir, criar cadastro parcial (nome + telefone)
- Exibir status `cadastro_completo` nos agendamentos

**Arquivos a alterar:**
- `frontend/src/components/appointments/AppointmentForm.tsx`
- `frontend/src/components/appointments/AppointmentDetails.tsx`
- `frontend/src/services/appointments.ts`

**Fluxo proposto:**
```
1. Usuário digita telefone do paciente
2. Sistema busca no Banco Central: GET /api/central-clients/telefone/:tel
3. Se encontrar: preenche dados automaticamente
4. Se não encontrar: permite cadastro rápido (nome + telefone)
5. Agendamento salvo com `cliente_id` do Banco Central
```

---

### 3️⃣ **AppointmentsExternal.tsx** (Agendamentos Externos)
**Status: ✅ JÁ INTEGRADO**

**Localização:** `frontend/src/pages/AppointmentsExternal.tsx`

**Situação Atual:**
- ✅ Já usa `central-clients.ts`
- ✅ Busca clientes por telefone no Banco Central
- ✅ Cria clientes no Banco Central
- ✅ Modal de cadastro completo

**Nenhuma alteração necessária.**

---

### 4️⃣ **Consultations.tsx** (Consultas)
**Prioridade: 🟡 MÉDIA**

**Localização:** `frontend/src/pages/Consultations.tsx`

**Situação Atual:**
- Usa `consultationsService` para gerenciar consultas
- Exibe dados de pacientes dos agendamentos
- Mostra agendamentos externos (já integrado)

**O que precisa mudar:**
- Exibir dados completos do cliente do Banco Central
- Ao iniciar consulta de agendamento externo, buscar cliente central
- Mostrar status `cadastro_completo` do cliente

**Arquivos a alterar:**
- `frontend/src/components/consultations/ConsultationList.tsx`
- `frontend/src/components/consultations/ConsultationDetails.tsx`
- `frontend/src/components/consultations/StartConsultationModal.tsx`

---

### 5️⃣ **MedicalRecords.tsx** (Prontuários)
**Prioridade: 🟡 MÉDIA**

**Localização:** `frontend/src/pages/MedicalRecords.tsx`

**Situação Atual:**
- Usa `PatientSelector` para selecionar paciente
- Busca pacientes da tabela local `patients`
- Prontuários vinculados a `patient_id`

**O que precisa mudar:**
- `PatientSelector` deve buscar clientes do Banco Central
- Permitir busca por telefone/CPF/nome
- Mostrar clientes com cadastro completo primeiro

**Arquivos a alterar:**
- `frontend/src/components/medical-records/PatientSelector.tsx`
- `frontend/src/pages/MedicalRecords.tsx`

**Fluxo proposto:**
```
1. Usuário busca paciente (nome, CPF ou telefone)
2. Sistema busca no Banco Central: GET /api/central-clients?search=xxx
3. Lista mostra clientes com indicador de cadastro completo
4. Ao selecionar, carrega prontuários do paciente
```

---

### 6️⃣ **Financial.tsx** (Financeiro)
**Prioridade: 🟢 BAIXA**

**Localização:** `frontend/src/pages/Financial.tsx`

**Situação Atual:**
- Exibe alertas de pagamento com `patient_name` e `patient_phone`
- Dados vêm via relação com `appointments → patients`

**O que precisa mudar:**
- Alertas devem exibir dados do cliente do Banco Central
- Backend deve fazer JOIN com tabela `clientes`

**Arquivos a alterar:**
- `backend/src/services/financial.ts`
- `frontend/src/pages/Financial.tsx`

---

### 7️⃣ **Dashboard.tsx**
**Prioridade: 🟢 BAIXA**

**Localização:** `frontend/src/pages/Dashboard.tsx`

**Situação Atual:**
- Exibe estatísticas mockadas (valores fixos no código)
- Card "Pacientes" mostra valor estático "1,234"

**O que precisa mudar:**
- Buscar contagem real de clientes do Banco Central
- Endpoint: GET /api/central-clients?limit=1 (usar `pagination.total`)

**Arquivos a alterar:**
- `frontend/src/pages/Dashboard.tsx`
- Criar novo endpoint de estatísticas

---

### 8️⃣ **Reports.tsx** (Relatórios)
**Prioridade: 🟢 BAIXA**

**Localização:** `frontend/src/pages/Reports.tsx`

**O que precisa mudar:**
- Relatórios de pacientes devem usar Banco Central
- Estatísticas de cadastros completos vs parciais

---

## 🔧 COMPONENTES COMPARTILHADOS A ATUALIZAR

| Componente | Localização | Uso |
|------------|-------------|-----|
| `PatientSelector` | `components/medical-records/` | Seleção de paciente |
| `PatientList` | `components/patients/` | Lista de pacientes |
| `PatientForm` | `components/patients/` | Formulário de cadastro |
| `PatientDetails` | `components/patients/` | Detalhes do paciente |
| `AppointmentForm` | `components/appointments/` | Formulário de agendamento |

---

## 📊 SERVIÇOS A CRIAR/MODIFICAR

### Opção 1: Migrar tudo para `central-clients.ts`
- Substituir `patients.ts` por `central-clients.ts`
- Atualizar todos os componentes

### Opção 2: Criar serviço híbrido
- Manter `patients.ts` para compatibilidade
- Criar `patient-central.ts` que busca do Banco Central
- Migração gradual

### Serviço Recomendado (central-clients.ts):
```typescript
// Já existe: frontend/src/services/central-clients.ts
// Funções disponíveis:
- listarClientesCentral(filtros)
- buscarClientePorId(id)
- buscarClientePorCPF(cpf)
- buscarClientePorTelefone(telefone)
- criarClienteCentral(dados)
- atualizarClienteCentral(id, dados)
- desativarClienteCentral(id)
- cadastroRapidoCliente(nome, telefone)
- completarCadastroCliente(id, dadosCompletos)
```

---

## 🚀 PLANO DE MIGRAÇÃO SUGERIDO

### Fase 1: Alta Prioridade (Esta Semana)
1. ✅ `AppointmentsExternal` - Já integrado
2. 🔄 `Patients` - Migrar para Banco Central
3. 🔄 `Appointments` - Integrar busca de clientes

### Fase 2: Média Prioridade (Próxima Semana)
4. `MedicalRecords` - Atualizar PatientSelector
5. `Consultations` - Integrar dados do cliente

### Fase 3: Baixa Prioridade (Futuro)
6. `Dashboard` - Estatísticas reais
7. `Financial` - Dados de cliente
8. `Reports` - Relatórios integrados

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Para cada página:
- [ ] Identificar componentes que usam dados de paciente
- [ ] Substituir chamadas de `PatientService` por `central-clients`
- [ ] Mapear campos (nome → nome, cpf → cpf, etc.)
- [ ] Adicionar tratamento de `cadastro_completo`
- [ ] Testar busca por telefone, CPF e nome
- [ ] Testar criação de novo cliente
- [ ] Testar atualização de cadastro

---

## 🔗 ENDPOINTS DO BANCO CENTRAL DISPONÍVEIS

```
GET    /api/central-clients              → Listar todos (com filtros)
GET    /api/central-clients/:id          → Buscar por ID
GET    /api/central-clients/cpf/:cpf     → Buscar por CPF
GET    /api/central-clients/telefone/:tel → Buscar por telefone
POST   /api/central-clients              → Criar cliente
PUT    /api/central-clients/:id          → Atualizar cliente
DELETE /api/central-clients/:id          → Desativar cliente
```

---

**Última atualização:** 27 de novembro de 2025
