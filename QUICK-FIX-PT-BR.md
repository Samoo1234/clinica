# 🔧 Correção Rápida - Problema de API localhost

## ❌ Problema
Seu frontend na Vercel está tentando acessar `localhost:3001` ao invés do backend correto.

## ✅ Solução Rápida (5 minutos)

### 1. Configure a URL da API no Frontend (Vercel)

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto do **FRONTEND**
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Adicione a variável:
   - **Name:** `VITE_API_URL`
   - **Value:** `<URL_DO_SEU_BACKEND>/api`

**Exemplos de valores:**
- Se seu backend está na Vercel: `https://seu-backend.vercel.app/api`
- Se seu backend está no Railway: `https://seu-backend.railway.app/api`
- Se seu backend está no Render: `https://seu-backend.onrender.com/api`

6. Clique em **Save**

### 2. Redeploy do Frontend

1. Na mesma página da Vercel, vá em **Deployments**
2. No último deployment, clique nos **3 pontos** (...)
3. Selecione **Redeploy**
4. Aguarde o deploy finalizar (1-2 minutos)

### 3. Teste

1. Abra seu frontend na Vercel
2. Aperte **F12** para abrir o Console
3. Vá na aba **Network**
4. Tente fazer login ou qualquer ação
5. Verifique se as requisições agora vão para o backend correto

---

## ⚠️ Seu Backend Está Deployado?

### ❓ Como Descobrir

Tente acessar: `https://sua-url/health`

- ✅ **Funciona?** Seu backend está no ar! Use essa URL.
- ❌ **Não funciona?** Você precisa fazer deploy do backend primeiro.

### 🚀 Deploy Rápido do Backend na Vercel

1. **Instale a CLI da Vercel:**
   ```powershell
   npm install -g vercel
   ```

2. **Faça login:**
   ```powershell
   vercel login
   ```

3. **Deploy do backend:**
   ```powershell
   cd backend
   npm run build
   vercel --prod
   ```

4. **Anote a URL** que aparecer (ex: `https://seu-backend.vercel.app`)

5. **Configure variáveis de ambiente no painel da Vercel:**
   - Acesse o projeto do backend
   - Settings → Environment Variables
   - Adicione (copie do arquivo `frontend\.env`):
     ```
     VITE_SUPABASE_URL=<sua_url_supabase>
     SUPABASE_SERVICE_ROLE_KEY=<sua_key>
     VITE_SUPABASE_ANON_KEY=<sua_anon_key>
     NODE_ENV=production
     PORT=3001
     FRONTEND_URL=<url_do_frontend_vercel>
     ```

6. **Redeploy** o backend

7. **Volte para o Passo 1** desta correção rápida

---

## 🆘 Scripts Auxiliares

Execute na raiz do projeto:

```powershell
# Configurar tudo automaticamente
.\setup-vercel.ps1

# Verificar se está tudo funcionando
.\check-deployment.ps1
```

---

## 📱 Suporte

Se ainda tiver problemas, verifique:

1. ✅ Variável `VITE_API_URL` está configurada no Vercel?
2. ✅ Fez redeploy após adicionar a variável?
3. ✅ Backend está respondendo em `/health`?
4. ✅ CORS está configurado no backend com a URL do frontend?

Se sim para todos, limpe o cache:
- No painel da Vercel → Deployments
- Redeploy with **Clear Cache**

