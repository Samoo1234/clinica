# Script de Configuração para Deploy na Vercel
# Execute este script para configurar o ambiente de produção

Write-Host "🚀 Configuração VisionCare - Deploy Vercel" -ForegroundColor Green
Write-Host ""

# Verifica se está no diretório correto
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Passo 1: Informações Necessárias" -ForegroundColor Cyan
Write-Host ""

# Solicita a URL do backend
$backendUrl = Read-Host "Digite a URL do backend na Vercel (ex: https://seu-backend.vercel.app)"
$backendUrl = $backendUrl.TrimEnd('/')

# Solicita a URL do frontend
$frontendUrl = Read-Host "Digite a URL do frontend na Vercel (ex: https://seu-frontend.vercel.app)"
$frontendUrl = $frontendUrl.TrimEnd('/')

Write-Host ""
Write-Host "✅ URLs Configuradas:" -ForegroundColor Green
Write-Host "   Backend: $backendUrl" -ForegroundColor Yellow
Write-Host "   Frontend: $frontendUrl" -ForegroundColor Yellow
Write-Host ""

# Lê o arquivo .env atual do frontend
$envPath = "frontend\.env"
$envContent = Get-Content $envPath -Raw

# Adiciona ou atualiza a variável VITE_API_URL
if ($envContent -match "VITE_API_URL=") {
    $envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=$backendUrl/api"
    Write-Host "📝 Variável VITE_API_URL atualizada no .env" -ForegroundColor Yellow
} else {
    $envContent += "`nVITE_API_URL=$backendUrl/api"
    Write-Host "📝 Variável VITE_API_URL adicionada ao .env" -ForegroundColor Yellow
}

# Salva o arquivo .env atualizado
Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host ""
Write-Host "✅ Arquivo .env atualizado!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos Passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Configure as variáveis de ambiente no Backend (Vercel):" -ForegroundColor White
Write-Host "   - Acesse: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   - Selecione o projeto do backend" -ForegroundColor Gray
Write-Host "   - Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   - Adicione as seguintes variáveis:" -ForegroundColor Gray
Write-Host ""
Write-Host "   VITE_SUPABASE_URL=https://nfvrbyiocqozpkyispkb.supabase.co" -ForegroundColor DarkGray
Write-Host "   SUPABASE_SERVICE_ROLE_KEY=<copie do arquivo .env>" -ForegroundColor DarkGray
Write-Host "   VITE_SUPABASE_ANON_KEY=<copie do arquivo .env>" -ForegroundColor DarkGray
Write-Host "   NODE_ENV=production" -ForegroundColor DarkGray
Write-Host "   PORT=3001" -ForegroundColor DarkGray
Write-Host "   FRONTEND_URL=$frontendUrl" -ForegroundColor DarkGray
Write-Host ""
Write-Host "2️⃣  Configure as variáveis de ambiente no Frontend (Vercel):" -ForegroundColor White
Write-Host "   - Selecione o projeto do frontend" -ForegroundColor Gray
Write-Host "   - Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   - Adicione:" -ForegroundColor Gray
Write-Host ""
Write-Host "   VITE_API_URL=$backendUrl/api" -ForegroundColor DarkGray
Write-Host "   VITE_SUPABASE_URL=https://nfvrbyiocqozpkyispkb.supabase.co" -ForegroundColor DarkGray
Write-Host "   VITE_SUPABASE_ANON_KEY=<copie do arquivo .env>" -ForegroundColor DarkGray
Write-Host ""
Write-Host "3️⃣  Faça o redeploy dos projetos:" -ForegroundColor White
Write-Host "   - No painel da Vercel, vá em Deployments" -ForegroundColor Gray
Write-Host "   - Clique nos 3 pontos do último deploy" -ForegroundColor Gray
Write-Host "   - Selecione 'Redeploy'" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Configuração local concluída!" -ForegroundColor Green
Write-Host ""

