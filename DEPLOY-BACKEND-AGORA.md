# 🚀 Deploy do Backend - Passo a Passo

## ⚠️ IMPORTANTE
Como a URL deu 404, seu backend não está deployado ainda.
Vamos fazer isso agora!

---

## Comandos para Executar (PowerShell)

### 1️⃣ Instalar CLI da Vercel (só precisa fazer 1 vez)

```powershell
npm install -g vercel
```

Aguarde a instalação terminar...

---

### 2️⃣ Fazer Login na Vercel

```powershell
vercel login
```

Isso vai:
- Abrir uma página no navegador
- Pedir para você fazer login
- Confirmar o acesso

✅ Clique em "Confirm" na página que abrir

---

### 3️⃣ Ir para a pasta do backend

```powershell
Set-Location F:\clinica\backend
```

---

### 4️⃣ Fazer o Deploy

```powershell
vercel --prod
```

⏳ A Vercel vai fazer algumas perguntas. Responda assim:

**Pergunta:** Set up and deploy "F:\clinica\backend"?
**Resposta:** `Y` (Enter)

**Pergunta:** Which scope do you want to deploy to?
**Resposta:** (Escolha seu usuário com as setas e Enter)

**Pergunta:** Link to existing project?
**Resposta:** `N` (Enter)

**Pergunta:** What's your project's name?
**Resposta:** `visioncare-backend` (ou o nome que preferir) (Enter)

**Pergunta:** In which directory is your code located?
**Resposta:** `./` (Enter)

**Pergunta:** Want to override the settings?
**Resposta:** `N` (Enter)

---

### 5️⃣ Aguarde o Deploy

⏳ Aguarde alguns minutos...

Quando terminar, a Vercel vai mostrar:

```
✅ Production: https://visioncare-backend-abc123.vercel.app
```

**📝 ANOTE ESSA URL!** Você vai precisar dela!

---

## 🔧 Configurar Variáveis de Ambiente

Depois do deploy, você PRECISA configurar as variáveis de ambiente:

### 1. Acesse o painel da Vercel
https://vercel.com/dashboard

### 2. Selecione o projeto do **BACKEND** (que acabou de criar)

### 3. Vá em: Settings → Environment Variables

### 4. Adicione cada uma dessas variáveis (copie do arquivo frontend\.env):

```
Name: VITE_SUPABASE_URL
Value: https://nfvrbyiocqozpkyispkb.supabase.co

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mdnJieWlvY3FvenBreWlzcGtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzczMDU5OCwiZXhwIjoyMDY5MzA2NTk4fQ.zCMyvjZTLiBgS8GRvG_gjkgOAEDsa0kuRQbnlkkLVYc

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mdnJieWlvY3FvenBreWlzcGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzA1OTgsImV4cCI6MjA2OTMwNjU5OH0.HtUXmZTeQQber9BYBbOhmh6xc8L1GcUZVaUAs5J9nmA

Name: NODE_ENV
Value: production

Name: PORT
Value: 3001

Name: FRONTEND_URL
Value: https://visioncare-2025-ukmk.vercel.app
```

⚠️ **ATENÇÃO:** Confirme se `FRONTEND_URL` é a URL correta do seu frontend na Vercel!

### 5. Faça Redeploy do Backend

Depois de adicionar TODAS as variáveis:
1. Vá em: Deployments
2. Clique nos 3 pontos do último deploy
3. Clique em: Redeploy

⏳ Aguarde 1-2 minutos

---

## ✅ Testar o Backend

Abra no navegador: `https://sua-url-backend.vercel.app/health`

Deve mostrar algo como:

```json
{
  "status": "OK",
  "message": "VisionCare API is running",
  "database": {
    "connected": true
  }
}
```

✅ **Funcionou?** Perfeito! Anote essa URL!

---

## 🎯 Próximo Passo: Configurar o Frontend

Agora que o backend está funcionando, volte para o `README-URGENTE.md` e siga o **Passo 2**:

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto do **FRONTEND**
3. Settings → Environment Variables → Add New
4. Adicione:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://sua-url-backend.vercel.app/api`
   
   ⚠️ Use a URL do seu backend + `/api` no final

5. Deployments → Redeploy

---

## 🆘 Problemas?

### "Command not found: vercel"
Execute: `npm install -g vercel` novamente

### "Authentication failed"
Execute: `vercel logout` e depois `vercel login` novamente

### Deploy deu erro
Verifique se está na pasta `backend` antes de executar `vercel --prod`

### Backend dá erro 500 ao acessar /health
Verifique se configurou TODAS as variáveis de ambiente no painel da Vercel

---

**🎉 Depois de tudo configurado, seu sistema vai funcionar perfeitamente!**

