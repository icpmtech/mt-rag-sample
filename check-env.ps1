# Script para verificar se as variáveis de ambiente estão carregadas
Write-Host "🔍 Verificando variáveis de ambiente..." -ForegroundColor Cyan

# Lista das variáveis essenciais para a aplicação
$essentialVars = @(
    "AZURE_SEARCH_SERVICE",
    "AZURE_SEARCH_INDEX", 
    "AZURE_STORAGE_ACCOUNT",
    "AZURE_STORAGE_CONTAINER",
    "AZURE_OPENAI_SERVICE",
    "AZURE_OPENAI_CHATGPT_MODEL",
    "AZURE_OPENAI_CHATGPT_DEPLOYMENT",
    "AZURE_OPENAI_EMB_MODEL_NAME",
    "AZURE_OPENAI_EMB_DEPLOYMENT",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_VISION_ENDPOINT",
    "AZURE_TENANT_ID",
    "AZURE_SUBSCRIPTION_ID"
)

$allLoaded = $true
$missingVars = @()

foreach ($var in $essentialVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var)
    if ([string]::IsNullOrEmpty($value)) {
        $missingVars += $var
        Write-Host "❌ $var - NÃO DEFINIDA" -ForegroundColor Red
        $allLoaded = $false
    } else {
        Write-Host "✅ $var" -ForegroundColor Green
    }
}

if ($allLoaded) {
    Write-Host "`n🎉 Todas as variáveis essenciais estão carregadas!" -ForegroundColor Green
    Write-Host "✨ A aplicação está pronta para ser executada." -ForegroundColor Green
    
    # Mostrar comandos úteis
    Write-Host "`n📝 Comandos úteis:" -ForegroundColor Yellow
    Write-Host "  🚀 Iniciar aplicação:     .\app\start.ps1" -ForegroundColor White
    Write-Host "  🏗️  Iniciar desenvolvimento: azd tasks start 'Development'" -ForegroundColor White
    Write-Host "  🔧 Apenas backend:        azd tasks start 'Backend: quart run'" -ForegroundColor White
    Write-Host "  🎨 Apenas frontend:       azd tasks start 'Frontend: npm run dev'" -ForegroundColor White
    
} else {
    Write-Host "`n⚠️  Algumas variáveis não estão carregadas:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host "`n💡 Execute '.\load-env.ps1' para carregar as variáveis." -ForegroundColor Yellow
}

# Mostrar informações sobre o ambiente atual
Write-Host "`n📋 Informações do Ambiente:" -ForegroundColor Cyan
Write-Host "🏷️  Environment: $env:AZURE_ENV_NAME" -ForegroundColor White
Write-Host "🌍 Location: $env:AZURE_LOCATION" -ForegroundColor White
Write-Host "🔐 Authentication: $env:AZURE_USE_AUTHENTICATION" -ForegroundColor White
Write-Host "🤖 Multimodal: $env:USE_MULTIMODAL" -ForegroundColor White