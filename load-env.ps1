# Script para carregar variáveis de ambiente necessárias para executar a aplicação RAG
Write-Host "🔄 Carregando variáveis de ambiente do Azure Developer CLI..." -ForegroundColor Cyan

# Carregar todas as variáveis de ambiente do azd
foreach ($line in (& azd env get-values)) {
    if ($line -match "([^=]+)=(.*)") {
        $key = $matches[1]
        $value = $matches[2] -replace '^"|"$'
        Set-Item -Path "env:\$key" -Value $value
        Write-Host "✅ $key" -ForegroundColor Green
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao carregar variáveis de ambiente do azd" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Verificar se as variáveis essenciais estão definidas
$essentialVars = @(
    "AZURE_SEARCH_SERVICE",
    "AZURE_SEARCH_INDEX", 
    "AZURE_STORAGE_ACCOUNT",
    "AZURE_STORAGE_CONTAINER",
    "AZURE_OPENAI_SERVICE",
    "AZURE_OPENAI_CHATGPT_MODEL",
    "AZURE_OPENAI_CHATGPT_DEPLOYMENT",
    "AZURE_OPENAI_EMB_MODEL_NAME",
    "AZURE_OPENAI_EMB_DEPLOYMENT"
)

Write-Host "`n🔍 Verificando variáveis essenciais..." -ForegroundColor Yellow

$missingVars = @()
foreach ($var in $essentialVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var)
    if ([string]::IsNullOrEmpty($value)) {
        $missingVars += $var
        Write-Host "❌ $var - NÃO DEFINIDA" -ForegroundColor Red
    } else {
        Write-Host "✅ $var = $value" -ForegroundColor Green
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "`n⚠️  Algumas variáveis essenciais não estão definidas:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host "`nExecute 'azd env set <VARIABLE>=<VALUE>' para definir as variáveis faltantes." -ForegroundColor Yellow
} else {
    Write-Host "`n🎉 Todas as variáveis essenciais estão configuradas!" -ForegroundColor Green
}

# Mostrar resumo das configurações principais
Write-Host "`n📋 Resumo das Configurações:" -ForegroundColor Cyan
Write-Host "🔍 Azure Search: $env:AZURE_SEARCH_SERVICE" -ForegroundColor White
Write-Host "📄 Search Index: $env:AZURE_SEARCH_INDEX" -ForegroundColor White
Write-Host "💾 Storage Account: $env:AZURE_STORAGE_ACCOUNT" -ForegroundColor White
Write-Host "🤖 OpenAI Service: $env:AZURE_OPENAI_SERVICE" -ForegroundColor White
Write-Host "💬 Chat Model: $env:AZURE_OPENAI_CHATGPT_MODEL" -ForegroundColor White
Write-Host "🎯 Chat Deployment: $env:AZURE_OPENAI_CHATGPT_DEPLOYMENT" -ForegroundColor White
Write-Host "📊 Embedding Model: $env:AZURE_OPENAI_EMB_MODEL_NAME" -ForegroundColor White
Write-Host "🚀 Multimodal: $env:USE_MULTIMODAL" -ForegroundColor White
Write-Host "🔐 Authentication: $env:AZURE_USE_AUTHENTICATION" -ForegroundColor White

Write-Host "`n✨ Ambiente carregado com sucesso! Agora você pode executar a aplicação." -ForegroundColor Green
Write-Host "Para iniciar a aplicação, execute: .\app\start.ps1" -ForegroundColor Yellow