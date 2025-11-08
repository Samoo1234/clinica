# 🚨 CONFIGURAÇÃO URGENTE - VERCEL

## ❌ Problema Atual
Seu frontend está tentando acessar `localhost:3001` em produção.

## ✅ Solução em 4 Passos (5 minutos)

---

### 📝 Passo 1: Commit e Push dos Arquivos de Configuração

Acabei de criar 2 arquivos importantes:
- `frontend/.env.production` - Variáveis de produção
- `frontend/vercel.json` - Configuração da Vercel

**Execute AGORA:**

```powershell
cd F:\clinica
git add frontend/.env.production frontend/vercel.json
git commit -m "fix: Adiciona configuração de produção para Vercel"
git push
```

---

### 🌐 Passo 2: Configurar Variáveis na Vercel

1. **Acesse:** https://vercel.com/dashboard
2. **Selecione o projeto do FRONTEND**
3. **Settings** → **Environment Variables**

**Adicione estas 5 variáveis (COPIE E COLE):**

```
Name:  VITE_API_URL
Value: https://visioncare-2025-myuw4te0-samoel-duartes-projects.vercel.app/api
Environments: ✅ Production ✅ Preview ✅ Development

---

Name:  VITE_SUPABASE_URL
Value: https://nfvrbyiocqozpkyispkb.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development

---

Name:  VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mdnJieWlvY3FvenBreWlzcGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzA1OTgsImV4cCI6MjA2OTMwNjU5OH0.HtUXmZTeQQber9BYBbOhmh6xc8L1GcUZVaUAs5J9nmA
Environments: ✅ Production ✅ Preview ✅ Development

---

Name:  VITE_SUPABASE_EXTERNO_URL
Value: https://dmsaqxuoruinwpnonpky.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development

---

Name:  VITE_SUPABASE_EXTERNO_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU
Environments: ✅ Production ✅ Preview ✅ Development
```

**IMPORTANTE:** Clique em **Save** após adicionar CADA variável!

---

### 🔄 Passo 3: Redeploy FORÇADO

1. Ainda no painel da Vercel, vá em **Deployments**
2. Clique nos **3 pontos** (⋮) do último deploy
3. Clique em **Redeploy**
4. ⚠️ **DESMARQUE** a opção "Use existing Build Cache"
5. Clique em **Redeploy** novamente
6. ⏳ Aguarde 2-3 minutos

---

### ✅ Passo 4: Verificar

1. Quando o deploy terminar, **LIMPE O CACHE** do navegador:
   - Chrome: Ctrl+Shift+R (Windows) ou ⌘+Shift+R (Mac)
   - Ou abra em modo anônimo

2. Abra o DevTools (F12)

3. Vá na aba **Console** e veja se aparecem estas mensagens:
   ```
   🔍 Variáveis de ambiente:
   VITE_SUPABASE_EXTERNO_URL: ✅ Carregada
   VITE_SUPABASE_EXTERNO_ANON_KEY: ✅ Carregada
   ```

4. Vá na aba **Network**

5. Tente fazer login ou acessar qualquer página

6. As requisições DEVEM ir para:
   - ✅ `https://visioncare-2025-myuw4te0-samoel-duartes-projects.vercel.app/api/...`
   - ❌ NÃO para `localhost:3001`

---

## 🆘 Se Ainda Não Funcionar

### Opção A: Verificar se as variáveis foram salvas

1. Settings → Environment Variables
2. Verifique se TODAS as 5 variáveis aparecem
3. Se alguma estiver faltando, adicione novamente

### Opção B: Forçar novo deploy

```powershell
cd F:\clinica
git commit --allow-empty -m "chore: Trigger Vercel redeploy"
git push
```

Aguarde o deploy automático terminar.

### Opção C: Verificar Build Logs

1. Na Vercel, vá em **Deployments**
2. Clique no último deployment
3. Vá na aba **Build Logs**
4. Procure por erros relacionados a variáveis de ambiente

---

## 📊 Checklist Final

- [ ] Arquivos `.env.production` e `vercel.json` commitados
- [ ] Push feito para o repositório
- [ ] 5 variáveis adicionadas na Vercel
- [ ] Redeploy feito (sem cache)
- [ ] Cache do navegador limpo
- [ ] Requisições vão para o backend correto (não mais localhost)
- [ ] Sistema funcionando! 🎉

---

## 💡 Por que isso aconteceu?

A Vercel não lê automaticamente o arquivo `.env` do seu projeto.
Você PRECISA configurar as variáveis no painel da Vercel manualmente.

O arquivo `.env.production` que criei serve como backup/referência,
mas as variáveis DEVEM estar no painel da Vercel para funcionar!

---

**⚡ Execute o Passo 1 AGORA e depois siga os demais passos!**


