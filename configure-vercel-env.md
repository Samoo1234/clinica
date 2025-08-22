# Configurar Variáveis de Ambiente na Vercel

## 📋 Passos para Configurar:

### 1. Acesse o Dashboard da Vercel
- Vá para: https://vercel.com/dashboard
- Clique no seu projeto "clinica"

### 2. Vá para Settings > Environment Variables
- Clique na aba "Settings"
- Clique em "Environment Variables"

### 3. Adicione as Variáveis:

**VITE_SUPABASE_URL**
- Name: `VITE_SUPABASE_URL`
- Value: `https://seu-projeto.supabase.co`
- Environment: Production, Preview, Development

**VITE_SUPABASE_ANON_KEY**
- Name: `VITE_SUPABASE_ANON_KEY`  
- Value: `sua-chave-anonima-do-supabase`
- Environment: Production, Preview, Development

### 4. Redeploy
- Após adicionar as variáveis, faça um novo deploy
- Ou vá em Deployments > clique nos 3 pontos > Redeploy

## 🔍 Como Encontrar suas Chaves do Supabase:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings > API
4. Copie:
   - Project URL (para VITE_SUPABASE_URL)
   - anon public key (para VITE_SUPABASE_ANON_KEY)

## ⚠️ IMPORTANTE:
- As variáveis devem começar com `VITE_` para serem acessíveis no frontend
- Após adicionar, sempre faça redeploy para aplicar as mudanças