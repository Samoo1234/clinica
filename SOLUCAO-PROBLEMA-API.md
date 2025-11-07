# 🔴 PROBLEMA: Frontend tentando acessar localhost:3001

## 🎯 Resumo do Problema

Você está vendo estes erros no console do navegador:
- ❌ `Failed to load localhost:3001/api/v1?page=1&limit=20#1`
- ❌ `TypeError: Failed to fetch`
- ❌ Erros de CORS

**Causa:** O frontend deployado na Vercel está configurado para usar `localhost:3001`, mas o backend está local/em outra URL.

---

## ✅ SOLUÇÃO RÁPIDA (2 passos)

### 📍 Passo 1: Descubra a URL do seu Backend

**Seu backend está deployado?**

Teste acessando: `https://sua-possivel-url.vercel.app/health`

#### Opção A: Backend JÁ está deployado ✅

Se você consegue acessar `/health`, anote essa URL!

#### Opção B: Backend NÃO está deployado ❌

Você precisa fazer o deploy primeiro. Execute:

```powershell
cd backend
npm run build
npm install -g vercel
vercel login
vercel --prod
```

Anote a URL que aparecer (ex: `https://visioncare-backend-abc123.vercel.app`)

---

### 📍 Passo 2: Configure no Painel da Vercel

#### 1. Acesse o Painel
- Vá para: https://vercel.com/dashboard
- Selecione o projeto do **FRONTEND** (não o backend!)

#### 2. Adicione a Variável de Ambiente
- Clique em **Settings** (no menu lateral)
- Clique em **Environment Variables**
- Clique em **Add New Variable**

Adicione:
```
Name:  VITE_API_URL
Value: https://sua-url-backend.vercel.app/api
```

⚠️ **IMPORTANTE:** Não esqueça o `/api` no final!

#### 3. Redeploy
- Vá em **Deployments**
- No último deploy, clique nos **3 pontos** (...)
- Clique em **Redeploy**
- ✅ Pronto! Aguarde 1-2 minutos

---

## 🧪 Como Testar

1. Abra seu frontend na Vercel: `https://seu-frontend.vercel.app`
2. Aperte **F12** para abrir DevTools
3. Vá na aba **Network**
4. Tente fazer login
5. Verifique as requisições:
   - ✅ **Certo:** `https://seu-backend.vercel.app/api/...`
   - ❌ **Errado:** `localhost:3001/...`

---

## 📊 Checklist Completo

Marque conforme for fazendo:

### Backend
- [ ] Backend está deployado e acessível
- [ ] `/health` endpoint responde com status 200
- [ ] Variáveis de ambiente configuradas no backend:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `NODE_ENV=production`
  - [ ] `FRONTEND_URL` (URL do frontend na Vercel)

### Frontend
- [ ] Variável `VITE_API_URL` adicionada no painel da Vercel
- [ ] Redeploy realizado após adicionar variável
- [ ] Console não mostra mais erros de `localhost:3001`

---

## 🚨 Problemas Comuns

### 1. "Ainda está tentando acessar localhost"
- ✅ Verificou se fez **redeploy** após adicionar a variável?
- ✅ Limpou o cache? (Redeploy → Clear Cache)

### 2. "Erro de CORS"
- ✅ Configurou `FRONTEND_URL` no backend com a URL correta?
- ✅ A URL do frontend está na lista de CORS do backend?

Para verificar o CORS, veja o arquivo: `backend/src/index.ts` linha 32-39

### 3. "Backend não responde"
- ✅ Backend está realmente deployado?
- ✅ Variáveis de ambiente estão configuradas?
- ✅ Fez build antes do deploy? (`npm run build`)

### 4. "Erro 404 nas rotas da API"
- ✅ Verificou se o `vercel.json` existe na pasta backend?
- ✅ O arquivo `dist/index.js` foi gerado após o build?

---

## 🛠️ Scripts Auxiliares Criados

Execute na **raiz do projeto**:

### Configuração Automática
```powershell
.\setup-vercel.ps1
```
Este script vai:
- Perguntar as URLs do backend e frontend
- Atualizar automaticamente o arquivo `.env` local
- Mostrar as variáveis que você precisa configurar na Vercel

### Verificação de Deploy
```powershell
.\check-deployment.ps1
```
Este script vai:
- Testar se o backend está respondendo
- Testar se o frontend está acessível
- Mostrar um checklist de verificações

---

## 📖 Documentação Completa

Para mais detalhes, veja:
- `DEPLOY-GUIDE.md` - Guia completo de deploy
- `backend/vercel.json` - Configuração do backend para Vercel

---

## 💡 Dica Profissional

**Sempre que deployar na Vercel:**

1. Configure as variáveis de ambiente ANTES do primeiro deploy
2. Use o arquivo `.env.production.example` como referência
3. Nunca commite arquivos `.env` no Git
4. Faça redeploy após adicionar/modificar variáveis
5. Teste sempre em modo anônimo/privado do navegador

---

## 🆘 Ainda com problemas?

Se seguiu todos os passos e ainda não funciona:

1. Abra o console do navegador (F12)
2. Tire um screenshot dos erros
3. Verifique a aba Network para ver para onde as requisições estão indo
4. Verifique os logs do backend na Vercel:
   - Dashboard → Seu Projeto Backend → Functions
   - Clique em qualquer função e veja os logs

---

**✅ Após configurar corretamente, seu sistema estará 100% funcional na Vercel!**

