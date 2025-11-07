# 🚀 Guia de Deploy - VisionCare

## Problema Identificado

O frontend na Vercel está tentando fazer requisições para `localhost:3001` porque a variável de ambiente `VITE_API_URL` não está configurada.

## 📋 Soluções

### ✅ Opção 1: Deploy do Backend na Vercel (Recomendado)

#### Passo 1: Deploy do Backend

1. **Instale a CLI da Vercel** (se ainda não tiver):
   ```bash
   npm install -g vercel
   ```

2. **Faça login na Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy do backend**:
   ```bash
   cd backend
   npm run build
   vercel --prod
   ```

4. **Configure as variáveis de ambiente no painel da Vercel**:
   - Acesse: https://vercel.com/dashboard
   - Selecione o projeto do backend
   - Vá em "Settings" → "Environment Variables"
   - Adicione as seguintes variáveis:

   ```
   VITE_SUPABASE_URL=https://nfvrbyiocqozpkyispkb.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mdnJieWlvY3FvenBreWlzcGtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzczMDU5OCwiZXhwIjoyMDY5MzA2NTk4fQ.zCMyvjZTLiBgS8GRvG_gjkgOAEDsa0kuRQbnlkkLVYc
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mdnJieWlvY3FvenBreWlzcGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzA1OTgsImV4cCI6MjA2OTMwNjU5OH0.HtUXmZTeQQber9BYBbOhmh6xc8L1GcUZVaUAs5J9nmA
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://seu-frontend-url.vercel.app
   ```

5. **Anote a URL do backend** (ex: `https://seu-backend.vercel.app`)

#### Passo 2: Configurar o Frontend

1. **Adicione a variável no arquivo `.env` local**:
   ```bash
   cd frontend
   # Adicione ao arquivo .env
   echo "VITE_API_URL=https://seu-backend.vercel.app/api" >> .env
   ```

2. **Configure no painel da Vercel (Frontend)**:
   - Acesse: https://vercel.com/dashboard
   - Selecione o projeto do **frontend**
   - Vá em "Settings" → "Environment Variables"
   - Adicione:
   ```
   VITE_API_URL=https://seu-backend.vercel.app/api
   ```

3. **Faça o redeploy do frontend**:
   - No painel da Vercel, vá em "Deployments"
   - Clique nos 3 pontos do último deploy
   - Selecione "Redeploy"

#### Passo 3: Configurar CORS no Backend

O backend precisa permitir requisições do frontend na Vercel. Verifique se o CORS está configurado corretamente no `backend/src/index.ts`.

---

### ✅ Opção 2: Backend em outro serviço (Railway, Render, etc.)

Se você preferir hospedar o backend em outro serviço:

1. **Deploy o backend** no serviço escolhido
2. **Anote a URL** do backend (ex: `https://seu-backend.railway.app`)
3. **Configure a variável no frontend**:
   - No painel da Vercel (projeto frontend)
   - Settings → Environment Variables
   - Adicione: `VITE_API_URL=https://seu-backend.railway.app/api`
4. **Redeploy o frontend**

---

### ✅ Opção 3: Backend Local (apenas para desenvolvimento)

⚠️ **Não recomendado para produção**, mas útil para testes:

1. **Exponha seu backend local usando ngrok**:
   ```bash
   npm install -g ngrok
   ngrok http 3001
   ```

2. **Anote a URL pública** (ex: `https://abc123.ngrok.io`)

3. **Configure temporariamente no frontend**:
   - Painel da Vercel → Environment Variables
   - `VITE_API_URL=https://abc123.ngrok.io/api`

---

## 🔍 Verificação

Após configurar, verifique se está funcionando:

1. **Abra o console do navegador** no frontend da Vercel
2. **Verifique a aba Network** 
3. **As requisições devem ir para** o backend correto (não mais localhost)

## ⚠️ Checklist de Segurança

- [ ] Nunca exponha o `SUPABASE_SERVICE_ROLE_KEY` no frontend
- [ ] Configure CORS corretamente no backend
- [ ] Use HTTPS em produção
- [ ] Configure rate limiting no backend
- [ ] Revise as variáveis de ambiente antes do deploy

## 🆘 Problemas Comuns

### Erro de CORS
- Verifique se o `FRONTEND_URL` está configurado corretamente no backend
- Verifique se o CORS está habilitado no `backend/src/index.ts`

### Erro 404 nas rotas da API
- Verifique se o backend foi buildado: `npm run build`
- Verifique se o `vercel.json` está correto

### Variáveis de ambiente não funcionam
- Certifique-se de fazer redeploy após adicionar variáveis
- Variáveis do frontend devem começar com `VITE_`

