# Script PowerShell para inicialização do ecossistema Aresta no Windows
$Host.UI.RawUI.WindowTitle = "Aresta Ecosystem"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   Iniciando Aresta (Backend, Frontend e Conversor)   " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$ROOT_DIR = $PSScriptRoot
$processes = @()

function Cleanup {
    Write-Host "`n[Aresta] Encerrando serviços..." -ForegroundColor Yellow
    foreach ($p in $processes) {
        if ($p -and -not $p.HasExited) {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

try {
    # 1. Conversor PDF -> EPUB
    $uvicornPath = Join-Path $ROOT_DIR "pdf2epub\.venv\Scripts\uvicorn.exe"
    $pythonPath = Join-Path $ROOT_DIR "pdf2epub\.venv\Scripts\python.exe"

    if (Test-Path $uvicornPath) {
        Write-Host "[Conversor] Iniciando microsserviço Python em pdf2epub (porta 8000)..." -ForegroundColor Green
        $env:PYTHONPATH = Join-Path $ROOT_DIR "pdf2epub\src"
        $conv = Start-Process -FilePath $uvicornPath -ArgumentList "pdf2epub.api.server:app --host 0.0.0.0 --port 8000" -WorkingDirectory (Join-Path $ROOT_DIR "pdf2epub") -PassThru -NoNewWindow
        $processes += $conv
    } elseif (Test-Path $pythonPath) {
        Write-Host "[Conversor] Iniciando microsserviço Python em pdf2epub (porta 8000)..." -ForegroundColor Green
        $env:PYTHONPATH = Join-Path $ROOT_DIR "pdf2epub\src"
        $conv = Start-Process -FilePath $pythonPath -ArgumentList "-m uvicorn pdf2epub.api.server:app --host 0.0.0.0 --port 8000" -WorkingDirectory (Join-Path $ROOT_DIR "pdf2epub") -PassThru -NoNewWindow
        $processes += $conv
    } else {
        Write-Host "[Conversor] ⚠ Ambiente virtual Python não encontrado em pdf2epub\.venv." -ForegroundColor Yellow
        Write-Host "            → Execute 'npm run setup' para configurar o conversor (requer Python 3 instalado)." -ForegroundColor Yellow
        Write-Host "            → Continuando sem o microsserviço conversor...`n" -ForegroundColor Yellow
    }

    # 2. Backend
    Write-Host "[Backend] Iniciando servidor Express em aresta-back-node (porta 7070)..." -ForegroundColor Green
    $back = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory (Join-Path $ROOT_DIR "aresta-back-node") -PassThru -NoNewWindow
    $processes += $back

    # 3. Frontend
    Write-Host "[Frontend] Iniciando Nuxt dev server em front (porta 3000)..." -ForegroundColor Green
    $front = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory (Join-Path $ROOT_DIR "front") -PassThru -NoNewWindow
    $processes += $front

    Write-Host "`n✓ Todos os serviços foram iniciados!" -ForegroundColor Green
    Write-Host "Acesse:" -ForegroundColor Yellow
    Write-Host "  • Frontend:     http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  • Conversor:    http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "  • Backend API:  http://localhost:7070/api/health" -ForegroundColor Cyan
    Write-Host "  • Swagger UI:   http://localhost:7070/api-docs" -ForegroundColor Cyan
    Write-Host "Pressione Ctrl+C a qualquer momento para interromper todos.`n" -ForegroundColor Yellow

    # Aguardar até interrupção
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Cleanup
}
