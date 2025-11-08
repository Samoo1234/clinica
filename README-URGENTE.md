# 🚨 LEIA ISSO PRIMEIRO

## O Problema

Seu frontend na Vercel está tentando buscar dados de `localhost:3001`, mas isso não funciona porque:
- O frontend está na nuvem (Vercel)
- O backend está local ou em outra URL
- Eles não conseguem se comunicar

## A Solução em 3 Cliques

### 1️⃣ Descubra onde está seu backend

Tente abrir no navegador: `https://visioncare-2025-myuw4te0-samoel-duartes-projects.vercel.app/health`

- ✅ **Abriu e mostrou JSON?** Perfeito! Essa é a URL do seu backend!
- ❌ **Deu erro 404 ou não carregou?** Seu backend não está deployado ainda.

### 2️⃣ Configure a variável de ambiente

1. Entre em: https://vercel.com/dashboard
2. Escolha o projeto do **FRONTEND** (o que já está funcionando)
3. Settings → Environment Variables → Add New
4. Coloque:
   - **Nome:** `VITE_API_URL`
   - **Valor:** `https://visioncare-2025-32zd4uyu0-samoel-duartes-projects.vercel.app/api`
   
   ⚠️ Use a URL que funcionou no passo 1 + `/api` no final

### 3️⃣ Faça Redeploy

1. Ainda na Vercel, vá em: Deployments
2. Clique nos 3 pontinhos do último deploy
3. Clique em: Redeploy
4. Aguarde 1-2 minutos

## ✅ Pronto!

Agora teste novamente e os erros devem ter sumido!

---

## ❌ Se o backend não estiver deployado

Execute estes comandos no PowerShell (na pasta do projeto):

```powershell
# Instala a CLI da Vercel (só precisa fazer 1 vez)
npm install -g vercel

# Faz login
vercel login

# Deploy do backend
cd backend
npm run build
vercel --prod
```

Depois volte para o **Passo 2** acima e use a URL que a Vercel mostrar.

---

## 📞 Precisa de Ajuda?

Veja os guias detalhados:
- **Solução rápida:** `SOLUCAO-PROBLEMA-API.md`
- **Guia completo:** `DEPLOY-GUIDE.md`
- **Scripts auxiliares:** Execute `.\setup-vercel.ps1`

