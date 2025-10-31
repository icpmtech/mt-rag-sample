# Script simplificado para iniciar a aplicação RAG
# Este script assume que as dependências já foram instaladas

Write-Host "🚀 Iniciando aplicação RAG..." -ForegroundColor Cyan

# 1. Carregar variáveis de ambiente
Write-Host "📋 Carregando variáveis de ambiente..." -ForegroundColor Yellow
foreach ($line in (& azd env get-values)) {
    if ($line -match "([^=]+)=(.*)") {
        $key = $matches[1]
        $value = $matches[2] -replace '^"|"$'
        Set-Item -Path "env:\$key" -Value $value
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao carregar variáveis de ambiente do azd" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "✅ Variáveis de ambiente carregadas" -ForegroundColor Green

# 2. Navegar para diretório da aplicação
Set-Location app

# 3. Ativar ambiente virtual
Write-Host "🐍 Ativando ambiente virtual Python..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# 4. Iniciar backend em background
Write-Host "⚙️  Iniciando backend..." -ForegroundColor Yellow
Set-Location backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    python -m quart --app main:app run --host localhost --port 50505 --reload
}

# Aguardar um pouco para o backend inicializar
Start-Sleep -Seconds 5

# 5. Iniciar frontend
Set-Location ..\frontend
Write-Host "🎨 Iniciando frontend..." -ForegroundColor Yellow
Write-Host "🌐 Frontend estará disponível em: http://localhost:3000" -ForegroundColor Green
Write-Host "🔧 Backend está rodando em: http://localhost:50505" -ForegroundColor Green
Write-Host "" 
Write-Host "⚠️  Para parar a aplicação, pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar frontend (este comando irá bloquear)
npm run dev

# Limpeza quando o frontend for interrompido
Write-Host "🛑 Parando backend..." -ForegroundColor Yellow
Stop-Job $backendJob
Remove-Job $backendJob
Write-Host "✅ Aplicação finalizada" -ForegroundColor Green