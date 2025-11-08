# 🔧 CORREÇÃO URGENTE - Backend "Route not found"

## ❌ Problema
Seu backend está dando erro 404 "Route not found" porque o `vercel.json` estava mal configurado.

## ✅ SOLUÇÃO (3 Passos)

---

### 📝 Passo 1: Código Corrigido (JÁ FEITO!)

✅ Acabei de corrigir o arquivo `backend/vercel.json`
✅ Commit feito
✅ Push enviado para o GitHub

---

### 🚀 Passo 2: Novo Deploy do Backend

Execute ESTE comando:

```powershell
cd F:\clinica\backend
vercel --prod --force
```

**OU se já tem o projeto linkado:**

```powershell
cd F:\clinica\backend
vercel deploy --prod
```

⏳ Aguarde o deploy terminar (2-3 minutos)

---

### 🔍 Passo 3: Testar se Funcionou

Depois do deploy, teste a URL:

```
https://visioncare-2025-vercel.app/health
```

Deve retornar algo como:
```json
{
  "status": "OK",
  "message": "VisionCare API is running"
}
```

---

## ⚠️ SE DER ERRO NO DEPLOY

Execute:

```powershell
cd F:\clinica\backend
vercel --prod
```

E responda as perguntas:

```
? Set up and deploy? → Y
? Link to existing project? → Y (escolha visioncare-2025)
? Override settings? → N
```

---

## 🆘 ALTERNATIVA: Deploy Direto pela Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **visioncare-2025** (backend)
3. **Settings** → **Git**
4. Certifique-se que está conectado ao repositório correto
5. **Deployments** → **Redeploy**
6. Aguarde

---

## ✅ Depois do Deploy

1. A URL do backend vai ser:
   ```
   https://visioncare-2025-[algo].vercel.app
   ```

2. Copie essa URL

3. Vá no projeto do **FRONTEND** (visioncare-five)

4. Settings → Environment Variables

5. Edite `VITE_API_URL` para:
   ```
   https://visioncare-2025-[algo].vercel.app/api
   ```

6. Faça Redeploy do frontend

---

## 📊 Checklist

- [ ] Novo deploy do backend feito
- [ ] Backend responde em `/health`
- [ ] Frontend tem `VITE_API_URL` atualizado
- [ ] Redeploy do frontend feito
- [ ] Sistema funcionando! 🎉

---

**🚀 Execute o Passo 2 AGORA!**

