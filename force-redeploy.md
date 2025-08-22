# Como Forçar Redeploy na Vercel

## 📋 Passos:

### Opção 1: Via Dashboard
1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto "clinica"
3. Vá na aba "Deployments"
4. Clique nos 3 pontos (...) do último deploy
5. Clique em "Redeploy"
6. Confirme o redeploy

### Opção 2: Via Git (Mais Rápido)
1. Faça um commit vazio:
```bash
git commit --allow-empty -m "Force redeploy with env vars"
git push origin master
```

### Opção 3: Via CLI Vercel
```bash
npx vercel --prod
```

## ⚠️ IMPORTANTE:
- As variáveis de ambiente só são aplicadas após um novo deploy
- Certifique-se que as variáveis estão em "All Environments" ou pelo menos "Production"