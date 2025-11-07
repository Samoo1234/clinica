# Script para verificar o deploy
Write-Host "🔍 Verificando Deploy VisionCare" -ForegroundColor Green
Write-Host ""

# Solicita URLs
$backendUrl = Read-Host "Digite a URL do backend (ex: https://seu-backend.vercel.app)"
$frontendUrl = Read-Host "Digite a URL do frontend (ex: https://seu-frontend.vercel.app)"

Write-Host ""
Write-Host "🔍 Testando Backend..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend está funcionando!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Database Connected: $($response.database.connected)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao conectar com o backend!" -ForegroundColor Red
    Write-Host "   Erro: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Testando Frontend..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method Get -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend está acessível!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erro ao acessar o frontend!" -ForegroundColor Red
    Write-Host "   Erro: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Verificações Manuais Necessárias:" -ForegroundColor Yellow
Write-Host "1. Abra o frontend no navegador: $frontendUrl" -ForegroundColor Gray
Write-Host "2. Abra o Console (F12)" -ForegroundColor Gray
Write-Host "3. Vá para a aba Network" -ForegroundColor Gray
Write-Host "4. Tente fazer login" -ForegroundColor Gray
Write-Host "5. Verifique se as requisições vão para: $backendUrl/api" -ForegroundColor Gray
Write-Host ""

