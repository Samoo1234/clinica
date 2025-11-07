# 📋 Mapeamento Completo do Sistema VisionCare

## 🎯 Visão Geral

**VisionCare** é um sistema completo de gestão para clínicas oftalmológicas com arquitetura moderna e integrações robustas.

### Arquitetura Geral
```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  - Interface de usuário moderna com Tailwind CSS            │
│  - Gerenciamento de estado com React Query                  │
│  - Autenticação e autorização                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js/Express)                  │
│  - API RESTful com TypeScript                               │
│  - Middleware de segurança (Helmet, CORS, Rate Limit)       │
│  - Validação com Zod                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (BaaS)                          │
│  - PostgreSQL Database                                      │
│  - Autenticação JWT                                         │
│  - Storage para arquivos                                    │
│  - Realtime subscriptions                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Estrutura do Projeto

```
visioncare/
├── frontend/              # Aplicação React + TypeScript
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── services/     # Serviços de API
│   │   ├── contexts/     # Contextos React
│   │   ├── hooks/        # Custom hooks
│   │   ├── utils/        # Funções utilitárias
│   │   └── config/       # Configurações (Supabase)
│   └── package.json
│
├── backend/              # API Node.js + TypeScript
│   ├── src/
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Lógica de negócio
│   │   ├── middleware/   # Middlewares (auth, validation)
│   │   ├── config/       # Configurações (Supabase)
│   │   ├── types/        # Tipos TypeScript
│   │   └── utils/        # Funções utilitárias
│   └── database/         # Scripts SQL e migrações
│
├── api/                  # Serverless function para Vercel
│   └── index.js          # Wrapper do backend para deploy
│
├── supabase/             # Configurações Supabase
│   ├── migrations/       # Migrações de banco
│   └── functions/        # Edge functions
│
└── docs/                 # Documentação
```

---

## 🔐 Sistema de Autenticação

### Fluxo de Autenticação

```
┌──────────┐      Login      ┌──────────┐     Validate    ┌──────────┐
│ Frontend │ ─────────────► │ Backend  │ ──────────────► │ Supabase │
│          │                 │          │                 │   Auth   │
└──────────┘                 └──────────┘                 └──────────┘
     │                            │                            │
     │         JWT Token          │         Session            │
     │ ◄──────────────────────────│ ◄─────────────────────────│
     │                            │                            │
     ▼                            ▼                            ▼
  Armazena                   Middleware                   Valida
  no Context                 de Auth                      Credenciais
```

### Componentes de Autenticação

**Frontend:**
- `SimpleAuthContext.tsx` - Gerencia estado de autenticação
- `SimpleLogin.tsx` - Componente de login
- `services/auth.ts` - Chamadas à API de autenticação

**Backend:**
- `routes/auth.ts` - Rotas de autenticação
- `services/auth.ts` - Lógica de autenticação
- `middleware/auth.ts` - Middleware de verificação JWT

### Endpoints de Autenticação

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/auth/login` | Login de usuário | Não |
| POST | `/api/auth/register` | Registro de usuário | Admin |
| POST | `/api/auth/logout` | Logout | Não |
| GET | `/api/auth/me` | Dados do usuário atual | Sim |
| POST | `/api/auth/refresh` | Renovar token | Não |
| PUT | `/api/auth/users/:userId/role` | Atualizar role | Admin |
| GET | `/api/auth/users` | Listar usuários | Admin |

### Roles e Permissões

```typescript
enum UserRole {
  ADMIN = 'admin',           // Acesso total ao sistema
  DOCTOR = 'doctor',         // Acesso a consultas e prontuários
  RECEPTIONIST = 'receptionist' // Acesso a agendamentos e pacientes
}
```

---

## 💾 Modelo de Dados

### Diagrama de Entidades

```
┌─────────────┐
│    users    │
│  (Supabase) │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────────┐         ┌──────────────┐
│  appointments   │ ◄─────► │   patients   │
│                 │   N:1   │              │
└────────┬────────┘         └──────┬───────┘
         │                         │
         │ 1:1                     │ 1:N
         ▼                         ▼
┌─────────────────┐         ┌──────────────────┐
│ consultations   │         │ medical_records  │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
         │                         │
         │                         │ 1:N
         │                         ▼
         │                  ┌──────────────┐
         │                  │ attachments  │
         │                  │              │
         │                  └──────────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│    invoices     │
│                 │
└─────────────────┘
```

### Tabelas Principais

#### 1. **users** (Usuários do Sistema)
```sql
- id: UUID (PK, FK para auth.users)
- email: TEXT
- name: TEXT
- role: user_role (admin, doctor, receptionist)
- active: BOOLEAN
- created_at, updated_at: TIMESTAMP
```

#### 2. **patients** (Pacientes)
```sql
- id: UUID (PK)
- cpf: TEXT (UNIQUE)
- name: TEXT
- birth_date: DATE
- phone: TEXT
- email: TEXT
- address: JSONB
- insurance_info: JSONB
- emergency_contact: JSONB
- created_at, updated_at: TIMESTAMP
```

#### 3. **appointments** (Agendamentos)
```sql
- id: UUID (PK)
- patient_id: UUID (FK)
- doctor_id: UUID (FK)
- scheduled_at: TIMESTAMP
- duration_minutes: INTEGER
- status: appointment_status
- notes: TEXT
- value: DECIMAL
- payment_status: payment_status
- created_at, updated_at: TIMESTAMP
```

#### 4. **medical_records** (Prontuários)
```sql
- id: UUID (PK)
- patient_id: UUID (FK)
- doctor_id: UUID (FK)
- consultation_date: DATE
- chief_complaint: TEXT
- anamnesis: TEXT
- physical_exam: JSONB
- diagnosis: TEXT
- prescription: TEXT
- follow_up_date: DATE
- created_at, updated_at: TIMESTAMP
```

#### 5. **consultations** (Consultas em Andamento)
```sql
- id: UUID (PK)
- appointment_id: UUID (FK)
- patient_id: UUID (FK)
- doctor_id: UUID (FK)
- status: VARCHAR (waiting, in_progress, completed, cancelled)
- start_time, end_time: TIMESTAMP
- vital_signs: JSONB
- notes, diagnosis, treatment, prescription: TEXT
- created_at, updated_at: TIMESTAMP
```

---

## 🔌 Integrações do Sistema

### 1. **Integração com Supabase**

#### Frontend
```typescript
// Configuração: frontend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Backend
```typescript
// Configuração: backend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Cliente Admin (service role)
export const supabaseAdmin = createClient(
  env.SUPABASE_URL, 
  env.SUPABASE_SERVICE_KEY
)

// Cliente Regular (anon key)
export const supabase = createClient(
  env.SUPABASE_URL, 
  env.SUPABASE_ANON_KEY
)
```

**Uso:**
- **supabaseAdmin**: Operações administrativas (bypass RLS)
- **supabase**: Operações de usuário (respeitando RLS)

---

### 2. **Integração com Sistema Externo de Agendamentos**

**Objetivo:** Importar agendamentos de outro projeto Supabase

**Configuração:**
```typescript
// frontend/src/services/agendamentos-externos.ts
const SUPABASE_EXTERNO_URL = 'https://dmsaqxuoruinwpnonpky.supabase.co'
const SUPABASE_EXTERNO_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

const supabaseExterno = createClient(SUPABASE_EXTERNO_URL, SUPABASE_EXTERNO_KEY)
```

**Funcionalidades:**
- Buscar agendamentos externos
- Importar agendamentos para o sistema local
- Sincronizar dados de clientes/pacientes
- Visualizar agendamentos de múltiplas fontes

**Endpoints:**
- `buscarAgendamentos()` - Lista agendamentos do sistema externo
- `buscarAgendamentoPorId()` - Busca agendamento específico
- `importarAgendamento()` - Importa para o sistema local
- `buscarClientes()` - Lista clientes do sistema externo

---

### 3. **Integração com API de Assinatura Digital**

**Objetivo:** Permitir assinatura digital de documentos médicos

**Configuração:**
```env
DIGITAL_SIGNATURE_API_URL=https://api.assinatura-digital.com
DIGITAL_SIGNATURE_API_KEY=sua_chave_api
```

**Fluxo:**
```
1. Médico finaliza prontuário
2. Sistema gera documento PDF
3. Envia para API de assinatura
4. Médico assina digitalmente
5. Documento assinado é armazenado no Supabase Storage
6. Hash da assinatura é salvo no banco
```

**Endpoints Backend:**
- POST `/api/digital-signature/documents` - Criar documento
- POST `/api/digital-signature/sign` - Assinar documento
- GET `/api/digital-signature/documents/:id` - Buscar documento
- GET `/api/digital-signature/verify/:id` - Verificar assinatura

---

### 4. **Integração com NFS-e (Nota Fiscal de Serviço Eletrônica)**

**Objetivo:** Emitir notas fiscais automaticamente

**Configuração:**
```env
NFSE_API_URL=https://api.nfse.prefeitura.gov.br
NFSE_API_KEY=sua_chave_api
```

**Fluxo:**
```
1. Consulta é finalizada e paga
2. Sistema coleta dados do serviço
3. Envia para API da prefeitura
4. Recebe número da NFS-e
5. Armazena dados da nota
6. Envia nota por email ao paciente
```

**Endpoints Backend:**
- POST `/api/nfse/issue` - Emitir NFS-e
- GET `/api/nfse/:id` - Consultar NFS-e
- POST `/api/nfse/:id/cancel` - Cancelar NFS-e
- GET `/api/nfse/batch` - Emissão em lote

---

### 5. **Integração com API Externa para Óticas (Parceiros)**

**Objetivo:** Permitir que óticas parceiras acessem receitas de pacientes

**Autenticação:** API Key por parceiro

**Fluxo:**
```
1. Ótica se cadastra como parceiro
2. Recebe API Key única
3. Médico compartilha receita com ótica
4. Ótica acessa receita via API
5. Confirma dispensação dos óculos
6. Sistema registra log de acesso
```

**Endpoints Backend:**
```typescript
// Admin (gerenciar parceiros)
POST   /api/external/admin/partners
GET    /api/external/admin/partners
GET    /api/external/admin/partners/:id
PUT    /api/external/admin/partners/:id
DELETE /api/external/admin/partners/:id
GET    /api/external/admin/partners/:id/logs
GET    /api/external/admin/partners/:id/stats

// API Externa (para parceiros)
GET    /api/external/api/test
GET    /api/external/api/patients/:patientId
GET    /api/external/api/patients/search/:cpf
GET    /api/external/api/prescriptions
POST   /api/external/api/prescriptions/:shareId/dispense
GET    /api/external/api/stats
```

**Middleware de Autenticação:**
```typescript
// backend/src/middleware/partner-auth.ts
- authenticatePartner: Valida API Key
- requirePartnerPermission: Verifica permissões
- logPartnerRequest: Registra acessos
```

**Permissões:**
- `patient_access` - Acessar dados de pacientes
- `patient_search` - Buscar pacientes por CPF
- `prescription_access` - Acessar receitas compartilhadas

---

### 6. **Integração com SMTP (Email)**

**Objetivo:** Enviar notificações por email

**Configuração:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
FROM_EMAIL=noreply@visioncare.com.br
```

**Casos de Uso:**
- Confirmação de agendamento
- Lembrete de consulta (24h antes)
- Envio de NFS-e
- Recuperação de senha
- Notificações de sistema

---

## 🚀 Fluxos Principais do Sistema

### 1. **Fluxo de Agendamento**

```
┌─────────────┐
│ Recepcionista│
│ acessa tela │
│ agendamentos│
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Seleciona paciente  │
│ (busca por CPF/nome)│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Escolhe médico,     │
│ data e horário      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Define valor e      │
│ forma de pagamento  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Sistema cria        │
│ appointment no BD   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Envia confirmação   │
│ por email/SMS       │
└─────────────────────┘
```

### 2. **Fluxo de Consulta**

```
┌─────────────┐
│ Paciente    │
│ chega       │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Recepcionista       │
│ confirma presença   │
│ (status: confirmed) │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Médico inicia       │
│ consulta            │
│ (cria consultation) │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Registra sinais     │
│ vitais, anamnese    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Realiza exame       │
│ físico              │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Registra diagnóstico│
│ e prescrição        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Finaliza consulta   │
│ (cria medical_record│
│ status: completed)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Opcionalmente:      │
│ - Assina digital    │
│ - Compartilha receita│
│ - Agenda retorno    │
└─────────────────────┘
```

### 3. **Fluxo Financeiro**

```
┌─────────────┐
│ Consulta    │
│ finalizada  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Sistema verifica    │
│ payment_status      │
└──────┬──────────────┘
       │
       ├─► pending ──┐
       │             │
       └─► paid ─────┤
                     │
                     ▼
              ┌─────────────┐
              │ Se paid:    │
              │ Emite NFS-e │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │ Envia nota  │
              │ por email   │
              └─────────────┘
```

---

## 📊 Módulos do Sistema

### 1. **Dashboard**
- Visão geral de métricas
- Agendamentos do dia
- Receita mensal
- Pacientes atendidos

### 2. **Pacientes**
- Cadastro completo
- Histórico de consultas
- Documentos anexados
- Dados de convênio

### 3. **Agendamentos**
- Calendário visual
- Gestão de horários
- Confirmação de presença
- Integração com agendamentos externos

### 4. **Consultas**
- Fila de espera
- Atendimento em tempo real
- Registro de sinais vitais
- Prontuário eletrônico

### 5. **Prontuários**
- Histórico médico
- Exames e diagnósticos
- Prescrições
- Anexos (imagens, PDFs)

### 6. **Financeiro**
- Controle de pagamentos
- Emissão de NFS-e
- Relatórios financeiros
- Dashboard de receitas

### 7. **Relatórios**
- Estatísticas de atendimento
- Relatórios médicos
- Análise financeira
- Exportação de dados

### 8. **Assinatura Digital**
- Gestão de documentos
- Assinatura eletrônica
- Verificação de autenticidade
- Histórico de assinaturas

### 9. **Integração Externa**
- Gestão de parceiros (óticas)
- Compartilhamento de receitas
- Logs de acesso
- Estatísticas de uso

### 10. **Notificações**
- Lembretes de consulta
- Alertas de sistema
- Emails automáticos
- Configurações de notificação

### 11. **Segurança**
- Auditoria de acessos
- Logs de sistema
- Backup automático
- Conformidade LGPD

---

## 🔒 Segurança

### Camadas de Segurança

1. **Autenticação JWT**
   - Tokens com expiração
   - Refresh tokens
   - Validação em cada request

2. **Row Level Security (RLS)**
   - Políticas no Supabase
   - Isolamento de dados por usuário
   - Controle granular de acesso

3. **Middleware de Segurança**
   - Helmet.js (headers HTTP seguros)
   - CORS configurado
   - Rate limiting (100 req/15min)
   - Validação de entrada (Zod)

4. **Criptografia**
   - Senhas com bcrypt
   - Dados sensíveis criptografados
   - HTTPS obrigatório em produção

5. **Auditoria**
   - Logs de todas as operações
   - Rastreamento de alterações
   - Monitoramento de acessos

---

## 🌐 Deploy

### Vercel (Frontend + API)

**Configuração:**
```json
// vercel.json
{
  "builds": [
    { "src": "frontend/package.json", "use": "@vercel/static-build" },
    { "src": "api/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**Variáveis de Ambiente (Vercel):**
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DIGITAL_SIGNATURE_API_URL
DIGITAL_SIGNATURE_API_KEY
NFSE_API_URL
NFSE_API_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
```

### Supabase (Database + Auth + Storage)

**Recursos Utilizados:**
- PostgreSQL Database
- Authentication
- Storage (para anexos e documentos)
- Realtime (para atualizações em tempo real)

---

## 📝 Variáveis de Ambiente

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_SUPABASE_EXTERNO_URL=https://dmsaqxuoruinwpnonpky.supabase.co
VITE_SUPABASE_EXTERNO_ANON_KEY=chave_do_projeto_externo
```

### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://seu-dominio.vercel.app

# Integrações
DIGITAL_SIGNATURE_API_URL=https://api.assinatura.com
DIGITAL_SIGNATURE_API_KEY=sua_chave
NFSE_API_URL=https://api.nfse.gov.br
NFSE_API_KEY=sua_chave

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
FROM_EMAIL=noreply@visioncare.com.br
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Router** - Navegação
- **React Query** - Gerenciamento de estado/cache
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **Lucide React** - Ícones
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Supabase JS** - Cliente Supabase
- **Zod** - Validação
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Nodemailer** - Envio de emails
- **Helmet** - Segurança HTTP
- **Morgan** - Logging
- **Compression** - Compressão de respostas

### Database
- **PostgreSQL** (via Supabase)
- **Row Level Security (RLS)**
- **Triggers e Functions**
- **Full-text search**

### DevOps
- **Vercel** - Hosting e CI/CD
- **Git** - Controle de versão
- **Docker** - Containerização (opcional)

---

## 📚 Documentação Adicional

- `docs/` - Documentação detalhada
- `backend/database/README.md` - Schema do banco
- `DEPLOY-STATUS.md` - Status do deploy
- `FRESH-VERCEL-DEPLOY-GUIDE.md` - Guia de deploy
- `criar-usuario-admin.md` - Criar usuário admin

---

## 🔄 Próximas Integrações Planejadas

1. **WhatsApp Business API** - Notificações via WhatsApp
2. **Google Calendar** - Sincronização de agendamentos
3. **Telemedicina** - Consultas por vídeo
4. **BI/Analytics** - Dashboard avançado
5. **Mobile App** - Aplicativo nativo

---

## 📞 Suporte

Para dúvidas sobre o sistema:
- Email: suporte@visioncare.com.br
- Documentação: `/docs`
- Issues: GitHub Issues

---

**Última atualização:** 27 de outubro de 2025
**Versão do Sistema:** 1.0.0
