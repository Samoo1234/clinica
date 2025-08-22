# 🚀 Guia Completo de Deploy - Sistema Clínica Oftalmológica

## 📋 **RESUMO DO SETUP**

Seu sistema usa uma arquitetura moderna e eficiente:
- **Frontend**: React + Vite (hospedado na Vercel)
- **Backend**: Node.js Serverless Functions (Vercel)
- **Database**: Supabase (PostgreSQL na nuvem)
- **Deploy**: Automático via Git Push

## ✅ **DEPLOY AUTOMÁTICO JÁ CONFIGURADO**

### **O que acontece quando você faz `git push`:**

1. **Vercel detecta** o push no GitHub
2. **Builda o frontend** usando `npm run build`
3. **Deploya as serverless functions** do backend
4. **Aplica as variáveis de ambiente**
5. **Disponibiliza o sistema** na URL da Vercel

## 🔧 **CONFIGURAÇÃO NECESSÁRIA NA VERCEL**

### **1. Variáveis de Ambiente (CRÍTICO):**

Vá em **Settings > Environment Variables** e configure:

```
Nome: VITE_SUPABASE_URL
Valor: https://seu-projeto.supabase.co

Nome: VITE_SUPABASE_ANON_KEY  
Valor: sua-chave-anonima-do-supabase

Nome: SUPABASE_URL
Valor: https://seu-projeto.supabase.co

Nome: SUPABASE_ANON_KEY
Valor: sua-chave-anonima-do-supabase

Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: sua-chave-service-role-do-supabase
```

**⚠️ IMPORTANTE:** 
- Variáveis com `VITE_` são para o frontend
- Variáveis sem `VITE_` são para o backend
- Marque todas para Production, Preview e Development

### **2. Build Settings:**
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## 🔄 **PROCESSO DE DEPLOY**

### **Deploy Automático:**
```bash
git add .
git commit -m "Sua mensagem"
git push origin master
```

### **Deploy Manual (se necessário):**
1. Vá no dashboard da Vercel
2. Clique em "Deployments"
3. Clique "Redeploy" no último deploy

## 🗄️ **CONFIGURAÇÃO DO BANCO (SUPABASE)**

### **Já configurado automaticamente:**
- ✅ Tabelas criadas via migrations
- ✅ RLS (Row Level Security) configurado
- ✅ Triggers e functions implementados
- ✅ Dados de teste inseridos

### **Se precisar reconfigurar:**
```sql
-- Execute os arquivos na ordem:
-- 1. backend/database/schema.sql
-- 2. backend/database/rls-policies.sql
-- 3. backend/database/functions.sql
-- 4. backend/database/triggers.sql
-- 5. backend/database/test-data.sql
```

## 🧪 **TESTANDO O DEPLOY**

### **1. Verificar Frontend:**
- Acesse sua URL da Vercel
- Verifique se carrega sem erros
- Teste o login/cadastro

### **2. Verificar Backend:**
- Acesse: `https://sua-url.vercel.app/api/health`
- Deve retornar: `{"status":"OK","message":"Backend is running"}`

### **3. Verificar Database:**
- Teste operações CRUD (criar/ler/atualizar/deletar)
- Verifique se os dados persistem

## 🚨 **TROUBLESHOOTING**

### **Erro: "Environment variables not found"**
- Configure as variáveis com prefixo `VITE_` na Vercel
- Faça redeploy após configurar

### **Erro: "Backend not responding"**
- Verifique se `api/index.js` está correto
- Confirme se as rotas estão importadas

### **Erro: "Database connection failed"**
- Verifique as credenciais do Supabase
- Confirme se o projeto Supabase está ativo

### **Build falha:**
- Verifique erros de TypeScript
- Confirme se todas as dependências estão no package.json

## 📊 **MONITORAMENTO**

### **Logs da Vercel:**
- Dashboard > Functions > View Function Logs
- Dashboard > Deployments > View Build Logs

### **Logs do Supabase:**
- Dashboard Supabase > Logs
- Monitoring de queries e erros

## 🔄 **ATUALIZAÇÕES FUTURAS**

### **Para adicionar novas funcionalidades:**
1. Desenvolva localmente
2. Teste com `npm run dev` (frontend) e `npm run dev` (backend)
3. Commit e push
4. Vercel faz deploy automático

### **Para mudanças no banco:**
1. Crie migration no Supabase
2. Teste localmente
3. Aplique em produção via dashboard Supabase

## 🎯 **PRÓXIMOS PASSOS**

1. **Configure as variáveis de ambiente na Vercel**
2. **Faça um redeploy**
3. **Teste todas as funcionalidades**
4. **Configure domínio personalizado (opcional)**

---

## 📞 **SUPORTE**

Se algo não funcionar:
1. Verifique os logs da Vercel
2. Confirme as variáveis de ambiente
3. Teste localmente primeiro
4. Verifique se o Supabase está funcionando

**Seu sistema está pronto para produção! 🚀**