# 🎯 CONFIGURAÇÃO DO BANCO CENTRAL DE CLIENTES

## ✅ O QUE FOI FEITO

### 1. Backend
- ✅ Adicionado suporte ao Supabase Central em `backend/src/env.ts`
- ✅ Criado cliente Supabase Central em `backend/src/config/supabase-central.ts`
- ✅ Criado API completa para gerenciar clientes em `backend/src/routes/central-clients.ts`
- ✅ Registrado rota `/api/central-clients` em `backend/src/index.ts`

### 2. Frontend
- ✅ Criado serviço de clientes central em `frontend/src/services/central-clients.ts`
- ✅ Atualizado página de Agendamentos (`AppointmentsExternal.tsx`) para usar banco central
- ✅ Agendamentos agora criam clientes no banco central (cadastro parcial)

### 3. Banco de Dados
- ✅ Criado projeto Supabase Central
- ✅ Criada tabela `clientes` com todos os campos necessários
- ✅ Configurados índices para performance
- ✅ Habilitado RLS com política de acesso

---

## 🔧 CONFIGURAR VARIÁVEIS DE AMBIENTE

### **Backend Local** (`backend/.env`)
Adicione estas linhas:

```env
# Supabase Central (Banco de Clientes Compartilhado)
SUPABASE_CENTRAL_URL=https://egyirufudbococcgdidj.supabase.co
SUPABASE_CENTRAL_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneWlydWZ1ZGJvY29jY2dkaWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODc0ODgsImV4cCI6MjA3ODM2MzQ4OH0.-NQJU-ATNtrU-2fU1MZYpF2Q1umKvGOv1_6LrF66HxE
SUPABASE_CENTRAL_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneWlydWZ1ZGJvY29jY2dkaWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc4NzQ4OCwiZXhwIjoyMDc4MzYzNDg4fQ.DSMJvdPakYk9tfAxqxo_J5gSc-LISpcRHYaqjNeZmwA
```

### **Frontend Local** (`frontend/.env`)
Adicione estas linhas:

```env
# Supabase Central (Banco de Clientes Compartilhado)
VITE_SUPABASE_CENTRAL_URL=https://egyirufudbococcgdidj.supabase.co
VITE_SUPABASE_CENTRAL_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneWlydWZ1ZGJvY29jY2dkaWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODc0ODgsImV4cCI6MjA3ODM2MzQ4OH0.-NQJU-ATNtrU-2fU1MZYpF2Q1umKvGOv1_6LrF66HxE
```

---

## 🚀 DEPLOY NA VERCEL

### **1. Backend (Vercel)**

Acesse: https://vercel.com/seu-usuario/seu-backend/settings/environment-variables

Adicione estas variáveis:

```
SUPABASE_CENTRAL_URL=https://egyirufudbococcgdidj.supabase.co
SUPABASE_CENTRAL_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneWlydWZ1ZGJvY29jY2dkaWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODc0ODgsImV4cCI6MjA3ODM2MzQ4OH0.-NQJU-ATNtrU-2fU1MZYpF2Q1umKvGOv1_6LrF66HxE
SUPABASE_CENTRAL_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneWlydWZ1ZGJvY29jY2dkaWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc4NzQ4OCwiZXhwIjoyMDc4MzYzNDg4fQ.DSMJvdPakYk9tfAxqxo_J5gSc-LISpcRHYaqjNeZmwA
```

**Comandos:**
```bash
cd backend
git add .
git commit -m "feat: adicionar banco central de clientes"
git push
vercel --prod
```

### **2. Frontend (Vercel)**

Acesse: https://vercel.com/seu-usuario/seu-frontend/settings/environment-variables

Adicione estas variáveis:

```
VITE_SUPABASE_CENTRAL_URL=https://egyirufudbococcgdidj.supabase.co
VITE_SUPABASE_CENTRAL_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneWlydWZ1ZGJvY29jY2dkaWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODc0ODgsImV4cCI6MjA3ODM2MzQ4OH0.-NQJU-ATNtrU-2fU1MZYpF2Q1umKvGOv1_6LrF66HxE
```

**Comandos:**
```bash
cd frontend
git add .
git commit -m "feat: integrar com banco central de clientes"
git push
vercel --prod
```

---

## 🧪 TESTAR LOCALMENTE

### **1. Testar Backend**

```bash
cd backend
npm install
npm run dev
```

Testar endpoint:
```bash
curl http://localhost:3001/api/central-clients
```

### **2. Testar Frontend**

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000/agendamentos-externos

---

## 📊 FLUXO DE DADOS

```
1️⃣ AGENDAMENTO
   Cliente liga → Atendente cadastra nome + telefone
   ↓
   Salva no Banco Central (cadastro_completo = false)

2️⃣ CLÍNICA (VisionCare)
   Cliente chega → Recepcionista busca por telefone
   ↓
   Completa cadastro (CPF, endereço, etc)
   ↓
   Atualiza no Banco Central (cadastro_completo = true)

3️⃣ ERP
   Cliente compra → Vendedor busca por CPF
   ↓
   Registra venda com cliente_id
```

---

## 🔍 ENDPOINTS DISPONÍVEIS

### **Listar Clientes**
```
GET /api/central-clients?page=1&limit=50&search=João&cadastro_completo=true
```

### **Buscar por ID**
```
GET /api/central-clients/:id
```

### **Buscar por CPF**
```
GET /api/central-clients/cpf/123.456.789-00
```

### **Buscar por Telefone**
```
GET /api/central-clients/telefone/31988887777
```

### **Criar Cliente**
```
POST /api/central-clients
{
  "nome": "João Silva",
  "telefone": "31988887777"
}
```

### **Atualizar Cliente**
```
PUT /api/central-clients/:id
{
  "cpf": "123.456.789-00",
  "email": "joao@email.com",
  "cadastro_completo": true
}
```

### **Desativar Cliente**
```
DELETE /api/central-clients/:id
```

---

## 🌐 INTEGRAÇÃO COM OUTROS SISTEMAS (API REST)

### **📡 URL Base da API**
```
https://seu-visioncare-backend.vercel.app/api/central-clients
```

Os outros sistemas (Agendamento e ERP) vão fazer requisições HTTP para essa API.

---

### **🔧 CONFIGURAÇÃO NOS OUTROS SISTEMAS**

#### **Sistema de Agendamento**

Criar arquivo `services/clientes-api.js`:

```javascript
const API_BASE = 'https://seu-visioncare-backend.vercel.app';

export const clientesAPI = {
  // Buscar cliente por telefone (antes de criar agendamento)
  async buscarPorTelefone(telefone) {
    try {
      const response = await fetch(
        `${API_BASE}/api/central-clients/telefone/${telefone}`
      );
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  },

  // Criar novo cliente (cadastro parcial: nome + telefone)
  async criar(dados) {
    try {
      const response = await fetch(
        `${API_BASE}/api/central-clients`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: dados.nome,
            telefone: dados.telefone,
            cadastro_completo: false
          })
        }
      );
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },

  // Listar clientes (para busca/autocomplete)
  async listar(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await fetch(
        `${API_BASE}/api/central-clients?${params}`
      );
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      return { data: [], total: 0 };
    }
  }
};
```

**Uso no Sistema de Agendamento:**

```javascript
// Ao criar novo agendamento
async function criarAgendamento(formData) {
  // 1. Verificar se cliente já existe
  let cliente = await clientesAPI.buscarPorTelefone(formData.telefone);
  
  // 2. Se não existe, criar novo (cadastro parcial)
  if (!cliente) {
    cliente = await clientesAPI.criar({
      nome: formData.nome,
      telefone: formData.telefone
    });
    console.log('✅ Cliente criado:', cliente.id);
  } else {
    console.log('✅ Cliente encontrado:', cliente.id);
  }
  
  // 3. Criar agendamento com o cliente_id
  await criarAgendamentoNoBanco({
    cliente_id: cliente.id,  // ⬅️ Usa o ID do banco central
    data: formData.data,
    horario: formData.horario,
    servico: formData.servico
  });
}
```

---

#### **Sistema ERP**

Criar arquivo `services/clientes-api.js`:

```javascript
const API_BASE = 'https://seu-visioncare-backend.vercel.app';

export const clientesAPI = {
  // Buscar cliente por CPF (principal no ERP)
  async buscarPorCPF(cpf) {
    try {
      // Remove pontos e traços do CPF
      const cpfLimpo = cpf.replace(/[.-]/g, '');
      
      const response = await fetch(
        `${API_BASE}/api/central-clients/cpf/${cpfLimpo}`
      );
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar cliente por CPF:', error);
      return null;
    }
  },

  // Buscar por ID
  async buscarPorId(id) {
    try {
      const response = await fetch(
        `${API_BASE}/api/central-clients/${id}`
      );
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  },

  // Buscar por telefone (alternativa)
  async buscarPorTelefone(telefone) {
    try {
      const response = await fetch(
        `${API_BASE}/api/central-clients/telefone/${telefone}`
      );
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  },

  // Listar clientes (para seleção)
  async listar(filtros = {}) {
    try {
      const params = new URLSearchParams({
        cadastro_completo: true,  // ERP só usa cadastros completos
        ...filtros
      });
      
      const response = await fetch(
        `${API_BASE}/api/central-clients?${params}`
      );
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      return { data: [], total: 0 };
    }
  }
};
```

**Uso no ERP:**

```javascript
// Ao criar venda/orçamento
async function criarVenda(formData) {
  // 1. Buscar cliente por CPF
  const cliente = await clientesAPI.buscarPorCPF(formData.cpf);
  
  if (!cliente) {
    alert('❌ Cliente não encontrado! Cadastre primeiro no VisionCare.');
    return;
  }
  
  // 2. Verificar se cadastro está completo
  if (!cliente.cadastro_completo) {
    alert('⚠️ Cadastro do cliente está incompleto! Complete no VisionCare.');
    return;
  }
  
  // 3. Criar venda usando o cliente_id
  await criarVendaNoBanco({
    cliente_id: cliente.id,  // ⬅️ Usa o ID do banco central
    produtos: formData.produtos,
    total: formData.total,
    forma_pagamento: formData.forma_pagamento
  });
  
  console.log('✅ Venda registrada para:', cliente.nome);
}
```

---

### **📊 FLUXO COMPLETO**

```
1️⃣ AGENDAMENTO
   └─ Busca por telefone → Se não existe, cria (nome + telefone)
   └─ Usa cliente_id no agendamento

2️⃣ VISIONCARE
   └─ Busca por telefone → Completa cadastro (CPF, email, etc)
   └─ Marca cadastro_completo = true

3️⃣ ERP
   └─ Busca por CPF → Usa cliente para venda
   └─ Valida se cadastro_completo = true
```

---

### **🔍 ENDPOINTS DISPONÍVEIS PARA OS SISTEMAS**

| Endpoint | Método | Sistema | Uso |
|----------|--------|---------|-----|
| `/api/central-clients/telefone/:telefone` | GET | Agendamento | Buscar antes de criar |
| `/api/central-clients` | POST | Agendamento | Criar novo cliente |
| `/api/central-clients` | GET | Todos | Listar/buscar clientes |
| `/api/central-clients/cpf/:cpf` | GET | ERP | Buscar por CPF |
| `/api/central-clients/:id` | GET | Todos | Buscar por ID |
| `/api/central-clients/:id` | PUT | VisionCare | Atualizar cliente |

---

## ✅ PRÓXIMOS PASSOS

### **Pendente:**
1. ⏳ Atualizar página de Clientes (VisionCare) para usar banco central
2. ⏳ Implementar API nos sistemas Agendamento e ERP
3. ⏳ Migrar dados existentes de `patients` para `clientes`

### **Concluído:**
- ✅ Backend configurado com Supabase Central
- ✅ API de clientes criada e funcionando
- ✅ Página de Agendamentos usando banco central
- ✅ Serviço frontend criado
- ✅ Documentado integração via API REST

---

## 🆘 TROUBLESHOOTING

### **Erro: "Cliente não autenticado"**
- Verifique se o token está sendo enviado no header Authorization
- Faça login novamente no sistema

### **Erro: "ROW_NOT_VISIBLE_ROW_LEVEL_SECURITY"**
- Certifique-se de usar `SUPABASE_CENTRAL_SERVICE_KEY` no backend
- Verifique as políticas RLS no Supabase

### **Erro 404 nos endpoints**
- Verifique se o backend foi redeployado após adicionar as variáveis
- Limpe o cache do navegador (Ctrl + Shift + R)

### **Cliente não aparece após cadastro**
- Verifique o console do navegador para erros
- Teste o endpoint diretamente: `GET /api/central-clients`
- Verifique se as variáveis de ambiente estão configuradas

---

## 📞 SUPORTE

Se precisar de ajuda:
1. Verifique o console do navegador (F12)
2. Verifique os logs do backend (Vercel → Seu Projeto → Logs)
3. Teste os endpoints com curl/Postman
4. Verifique se todas as variáveis de ambiente estão configuradas

