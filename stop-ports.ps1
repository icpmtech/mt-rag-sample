# Script para parar processos que estão usando portas específicas
param(
    [int[]]$Ports = @(50505, 3000, 5000, 8000)
)

Write-Host "🛑 Verificando processos nas portas especificadas..." -ForegroundColor Cyan

foreach ($port in $Ports) {
    Write-Host "🔍 Verificando porta $port..." -ForegroundColor Yellow
    
    try {
        # Encontrar processos usando a porta
        $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty OwningProcess | 
                    Sort-Object -Unique
        
        if ($processes) {
            foreach ($processId in $processes) {
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "❌ Processo encontrado: $($process.ProcessName) (PID: $processId) na porta $port" -ForegroundColor Red
                        
                        # Perguntar se deve parar o processo
                        $response = Read-Host "Deseja parar este processo? (s/N)"
                        if ($response -eq 's' -or $response -eq 'S' -or $response -eq 'sim') {
                            Stop-Process -Id $processId -Force
                            Write-Host "✅ Processo $($process.ProcessName) (PID: $processId) parado" -ForegroundColor Green
                        }
                    }
                }
                catch {
                    Write-Host "⚠️  Não foi possível obter informações do processo PID: $processId" -ForegroundColor Yellow
                }
            }
        }
        else {
            Write-Host "✅ Porta $port está livre" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "✅ Porta $port está livre" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Verificação concluída!" -ForegroundColor Green
Write-Host "💡 Agora você pode executar: .\start-backend.ps1" -ForegroundColor Yellow