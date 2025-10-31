# Script para encontrar uma porta disponível e iniciar o backend
param(
    [int]$StartPort = 50505,
    [int]$MaxPort = 50600
)

Write-Host "🔍 Procurando por uma porta disponível..." -ForegroundColor Cyan

function Test-Port {
    param([int]$Port)
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    }
    catch {
        return $false
    }
}

$availablePort = $null
for ($port = $StartPort; $port -le $MaxPort; $port++) {
    if (Test-Port -Port $port) {
        $availablePort = $port
        break
    }
}

if ($availablePort -eq $null) {
    Write-Host "❌ Nenhuma porta disponível encontrada no intervalo $StartPort-$MaxPort" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Porta disponível encontrada: $availablePort" -ForegroundColor Green

# Verificar se as variáveis de ambiente estão carregadas
$essentialVars = @("AZURE_SEARCH_SERVICE", "AZURE_OPENAI_SERVICE", "AZURE_STORAGE_ACCOUNT")
$missingVars = @()

foreach ($var in $essentialVars) {
    if ([string]::IsNullOrEmpty([System.Environment]::GetEnvironmentVariable($var))) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Variáveis de ambiente não carregadas. Carregando..." -ForegroundColor Yellow
    # Carregar variáveis do azd
    foreach ($line in (& azd env get-values)) {
        if ($line -match "([^=]+)=(.*)") {
            $key = $matches[1]
            $value = $matches[2] -replace '^"|"$'
            Set-Item -Path "env:\$key" -Value $value
        }
    }
    Write-Host "✅ Variáveis de ambiente carregadas" -ForegroundColor Green
}

# Definir diretório de trabalho
Set-Location $PSScriptRoot

# Verificar se o ambiente virtual existe
if (!(Test-Path "app\.venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Ambiente virtual não encontrado. Execute primeiro o setup completo." -ForegroundColor Red
    Write-Host "💡 Execute: .\app\start.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Iniciando backend na porta $availablePort..." -ForegroundColor Green
Write-Host "📱 Backend estará disponível em: http://localhost:$availablePort" -ForegroundColor White

# Ativar ambiente virtual e iniciar o backend
Set-Location app
& .\.venv\Scripts\Activate.ps1
Set-Location backend

# Definir variáveis de ambiente específicas do Quart
$env:QUART_APP = "main:app"
$env:QUART_ENV = "development"
$env:QUART_DEBUG = "0"
$env:LOADING_MODE_FOR_AZD_ENV_VARS = "override"

# Iniciar o servidor
python -m quart --app main:app run --host localhost --port $availablePort --reload