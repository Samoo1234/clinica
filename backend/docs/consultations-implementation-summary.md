# Implementação de Consultas - VisionCare

## Resumo

A funcionalidade de consultas foi implementada para permitir que médicos iniciem, gerenciem e finalizem consultas médicas a partir de agendamentos existentes.

## Arquivos Implementados

### Backend

1. **`backend/src/routes/consultations.ts`**
   - Rotas REST para gerenciamento de consultas
   - Endpoints para CRUD, estatísticas e operações especiais

2. **`backend/src/services/consultations.ts`**
   - Lógica de negócio para consultas
   - Integração com Supabase
   - Gerenciamento de estados e transições

3. **`backend/database/consultations-schema.sql`**
   - Schema da tabela `consultations`
   - Índices e políticas RLS
   - Triggers e funções auxiliares

4. **`backend/database/setup-consultations.sql`**
   - Script de configuração do banco
   - Dados de teste opcionais

### Frontend

1. **`frontend/src/pages/Consultations.tsx`**
   - Página principal de consultas
   - Dashboard com estatísticas
   - Integração com componentes

2. **`frontend/src/components/consultations/`**
   - `ConsultationList.tsx` - Lista de consultas
   - `ConsultationDetails.tsx` - Detalhes da consulta
   - `ConsultationFilters.tsx` - Filtros de busca
   - `StartConsultationModal.tsx` - Modal para iniciar consulta
   - `CompleteConsultationModal.tsx` - Modal para finalizar consulta
   - `VitalSignsForm.tsx` - Formulário de sinais vitais
   - `ConsultationNotes.tsx` - Notas da consulta

3. **`frontend/src/services/consultations.ts`**
   - Cliente HTTP para API de consultas
   - Métodos para todas as operações

4. **`frontend/src/types/consultations.ts`**
   - Tipos TypeScript para consultas
   - Interfaces e enums

## Funcionalidades Implementadas

### 1. Gestão de Consultas
- ✅ Listar consultas com filtros
- ✅ Visualizar detalhes da consulta
- ✅ Iniciar consulta a partir de agendamento
- ✅ Atualizar dados da consulta
- ✅ Finalizar consulta com criação de prontuário
- ✅ Cancelar consulta

### 2. Dashboard e Estatísticas
- ✅ Estatísticas em tempo real
- ✅ Consultas do dia
- ✅ Consultas em andamento
- ✅ Consultas concluídas
- ✅ Consultas pendentes

### 3. Filtros e Busca
- ✅ Filtro por status
- ✅ Filtro por médico
- ✅ Filtro por nome do paciente
- ✅ Filtro por período

### 4. Sinais Vitais
- ✅ Registro de pressão arterial
- ✅ Registro de frequência cardíaca
- ✅ Registro de temperatura
- ✅ Registro de peso e altura

### 5. Integração com Prontuários
- ✅ Criação automática de prontuário ao finalizar consulta
- ✅ Vinculação consulta-prontuário
- ✅ Histórico de consultas do paciente

## Endpoints da API

### GET `/api/consultations`
- Lista consultas com filtros opcionais
- Parâmetros: status, doctorId, patientName, dateFrom, dateTo

### GET `/api/consultations/stats`
- Retorna estatísticas das consultas

### GET `/api/consultations/available-appointments`
- Lista agendamentos disponíveis para iniciar consulta

### GET `/api/consultations/:id`
- Retorna detalhes de uma consulta específica

### POST `/api/consultations/start`
- Inicia nova consulta a partir de agendamento
- Body: { appointmentId, vitalSigns?, notes? }

### PUT `/api/consultations/:id`
- Atualiza dados da consulta

### POST `/api/consultations/:id/complete`
- Finaliza consulta e cria prontuário
- Body: { diagnosis, treatment, prescription, notes, followUpDate? }

### POST `/api/consultations/:id/cancel`
- Cancela consulta
- Body: { reason? }

### PUT `/api/consultations/:id/vital-signs`
- Atualiza sinais vitais
- Body: { vitalSigns }

### PUT `/api/consultations/:id/notes`
- Adiciona/atualiza notas
- Body: { notes }

## Schema do Banco de Dados

```sql
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'waiting',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    vital_signs JSONB DEFAULT '{}',
    notes TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Estados da Consulta

1. **waiting** - Aguardando início
2. **in_progress** - Em andamento
3. **completed** - Concluída
4. **cancelled** - Cancelada

## Segurança

- ✅ Políticas RLS implementadas
- ✅ Médicos só veem suas consultas
- ✅ Admins e recepcionistas têm acesso completo
- ✅ Autenticação obrigatória em todas as rotas

## Testes

- ✅ Testes unitários básicos implementados
- ✅ Testes de integração com Supabase
- ✅ Validação de tipos TypeScript

## Próximos Passos

1. Implementar notificações em tempo real
2. Adicionar relatórios específicos de consultas
3. Integrar com sistema de faturamento
4. Implementar templates de consulta por especialidade
5. Adicionar suporte a consultas em grupo

## Configuração

Para usar a funcionalidade de consultas:

1. Execute o script de setup do banco:
   ```bash
   psql -d visioncare -f backend/database/setup-consultations.sql
   ```

2. Certifique-se de que as rotas estão registradas no `index.ts`

3. Acesse a página de consultas no frontend: `/consultations`

## Dependências

- Supabase (banco de dados e autenticação)
- React (frontend)
- Express.js (backend)
- TypeScript (tipagem)
- Lucide React (ícones)