# Script completo para iniciar a aplicação RAG com frontend e backend
Write-Host "🚀 Iniciando Aplicação RAG Completa..." -ForegroundColor Green

# Definir diretório de trabalho
Set-Location $PSScriptRoot

# Carregar variáveis de ambiente
Write-Host "`n🔄 Carregando variáveis de ambiente..." -ForegroundColor Cyan
foreach ($line in (& azd env get-values)) {
    if ($line -match "([^=]+)=(.*)") {
        $key = $matches[1]
        $value = $matches[2] -replace '^"|"$'
        Set-Item -Path "env:\$key" -Value $value
    }
}
Write-Host "✅ Variáveis de ambiente carregadas" -ForegroundColor Green

# Função para encontrar porta disponível
function Get-AvailablePort {
    param([int]$StartPort = 50505, [int]$MaxPort = 50600)
    
    for ($port = $StartPort; $port -le $MaxPort; $port++) {
        try {
            $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
            $listener.Start()
            $listener.Stop()
            return $port
        }
        catch {
            continue
        }
    }
    return $null
}

# Encontrar portas disponíveis
$backendPort = Get-AvailablePort -StartPort 50505
$frontendPort = Get-AvailablePort -StartPort 3000 -MaxPort 3100

if ($backendPort -eq $null) {
    Write-Host "❌ Não foi possível encontrar uma porta disponível para o backend" -ForegroundColor Red
    exit 1
}

if ($frontendPort -eq $null) {
    Write-Host "❌ Não foi possível encontrar uma porta disponível para o frontend" -ForegroundColor Red
    exit 1
}

Write-Host "📱 Backend será iniciado na porta: $backendPort" -ForegroundColor White
Write-Host "🎨 Frontend será iniciado na porta: $frontendPort" -ForegroundColor White

# Verificar se os diretórios existem
if (!(Test-Path "app\backend")) {
    Write-Host "❌ Diretório app\backend não encontrado" -ForegroundColor Red
    exit 1
}

if (!(Test-Path "app\frontend")) {
    Write-Host "❌ Diretório app\frontend não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar ambiente virtual
if (!(Test-Path "app\.venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Ambiente virtual não encontrado. Criando..." -ForegroundColor Yellow
    Set-Location app
    python -m venv .venv
    & .\.venv\Scripts\Activate.ps1
    Set-Location backend
    python -m pip install -r requirements.txt
    Set-Location ..\frontend
    npm install
    npm run build
    Set-Location ..\..
}

Write-Host "`n🏗️  Iniciando serviços..." -ForegroundColor Cyan

# Iniciar Backend em background
$backendJob = Start-Job -ScriptBlock {
    param($RootPath, $Port)
    Set-Location $RootPath
    Set-Location app
    & .\.venv\Scripts\Activate.ps1
    Set-Location backend
    $env:QUART_APP = "main:app"
    $env:QUART_ENV = "development"
    $env:QUART_DEBUG = "0"
    python -m quart --app main:app run --host localhost --port $Port --reload
} -ArgumentList $PSScriptRoot, $backendPort

Write-Host "✅ Backend iniciado (Job ID: $($backendJob.Id))" -ForegroundColor Green

# Aguardar um pouco para o backend inicializar
Start-Sleep -Seconds 3

# Iniciar Frontend em background
$frontendJob = Start-Job -ScriptBlock {
    param($RootPath, $Port, $BackendPort)
    Set-Location $RootPath
    Set-Location app\frontend
    $env:VITE_BACKEND_URL = "http://localhost:$BackendPort"
    npm run dev -- --port $Port --host
} -ArgumentList $PSScriptRoot, $frontendPort, $backendPort

Write-Host "✅ Frontend iniciado (Job ID: $($frontendJob.Id))" -ForegroundColor Green

# Aguardar serviços inicializarem
Write-Host "`n⏳ Aguardando serviços inicializarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Mostrar URLs de acesso
Write-Host "`n🎉 Aplicação iniciada com sucesso!" -ForegroundColor Green
Write-Host "📱 Backend:  http://localhost:$backendPort" -ForegroundColor White
Write-Host "🎨 Frontend: http://localhost:$frontendPort" -ForegroundColor White

Write-Host "`n📋 Comandos úteis:" -ForegroundColor Cyan
Write-Host "  🔍 Ver logs do backend:  Receive-Job -Id $($backendJob.Id) -Keep" -ForegroundColor White
Write-Host "  🔍 Ver logs do frontend: Receive-Job -Id $($frontendJob.Id) -Keep" -ForegroundColor White
Write-Host "  🛑 Parar backend:        Stop-Job -Id $($backendJob.Id)" -ForegroundColor White
Write-Host "  🛑 Parar frontend:       Stop-Job -Id $($frontendJob.Id)" -ForegroundColor White
Write-Host "  🛑 Parar tudo:           Stop-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor White

Write-Host "`n⌨️  Pressione ENTER para parar todos os serviços..." -ForegroundColor Yellow
Read-Host

# Parar os serviços
Write-Host "🛑 Parando serviços..." -ForegroundColor Red
Stop-Job -Id $backendJob.Id, $frontendJob.Id -ErrorAction SilentlyContinue
Remove-Job -Id $backendJob.Id, $frontendJob.Id -ErrorAction SilentlyContinue

Write-Host "✅ Todos os serviços foram parados." -ForegroundColor Green