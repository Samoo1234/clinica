# ⚡ Checklist Rápido - Deploy Limpo

## 🗑️ **DELETAR:**
- [ ] Vá na Vercel > Projeto > Settings > Delete Project

## 🆕 **CRIAR NOVO:**
- [ ] Add New > Project > Import do GitHub
- [ ] Selecione repositório `Samoo1234/clinica`

## ⚙️ **CONFIGURAR:**
- [ ] Framework: **Vite**
- [ ] Build Command: `cd frontend && npm run build`
- [ ] Output Directory: `frontend/dist`
- [ ] Install Command: `cd frontend && npm install`

## 🔐 **VARIÁVEIS (CRÍTICO):**
- [ ] `VITE_SUPABASE_URL` = sua-url-supabase
- [ ] `VITE_SUPABASE_ANON_KEY` = sua-chave-anonima
- [ ] `SUPABASE_URL` = sua-url-supabase
- [ ] `SUPABASE_ANON_KEY` = sua-chave-anonima
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = sua-chave-service-role
- [ ] Marcar: Production + Preview + Development

## 🚀 **DEPLOY:**
- [ ] Clique "Deploy"
- [ ] Aguarde 2-3 minutos

## ✅ **TESTAR:**
- [ ] Site carrega sem erro
- [ ] `/api/health` retorna `{"status":"OK"}`
- [ ] Login funciona
- [ ] Gestão Financeira SEM erro

---

**🎯 RESULTADO ESPERADO:**
Sistema funcionando 100% sem "Erro ao carregar dados financeiros"!