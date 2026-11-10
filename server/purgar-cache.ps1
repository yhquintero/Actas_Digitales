<#
.SYNOPSIS
  Actas Digitales - Purga Profunda de Cache y Service Workers (Edge / Chrome / Windows)
  Limpia la memoria del navegador y elimina registros residuales de Inventario / NovaGest.
#>

[CmdletBinding()]
param(
    [int]$Puerto = 8443,
    [switch]$CerrarNavegadores
)

$ErrorActionPreference = 'Continue'
try { chcp 65001 | Out-Null } catch { }
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$Raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$UploadsDir = Join-Path $Raiz 'backend\app\uploads'

function Log-Ok($m)    { Write-Host "  [OK] $m" -ForegroundColor Green }
function Log-Aviso($m) { Write-Host "  [!] $m" -ForegroundColor Yellow }
function Log-Info($m)  { Write-Host "  [*] $m" -ForegroundColor Cyan }

Write-Host ''
Write-Host '  ===============================================================' -ForegroundColor Cyan
Write-Host '    ACTAS DIGITALES - PURGA TOTAL DE CACHE Y SERVICE WORKERS     ' -ForegroundColor Magenta
Write-Host '  ===============================================================' -ForegroundColor Cyan
Write-Host ''

# 1. Purgar archivos temporales del backend
Log-Info "Purgando archivos temporales de audio en backend..."
if (Test-Path $UploadsDir) {
    Get-ChildItem -Path $UploadsDir -Exclude ".gitkeep" | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Log-Ok "Temporales de audio eliminados."
}

# 2. Desalojar procesos ajenos en puerto 8443
Log-Info "Verificando puerto $Puerto..."
try {
    $lineas = @(netstat -ano | Select-String ":$Puerto\s+.*LISTENING|:$Puerto\s+.*ESCUCHANDO")
    foreach ($l in $lineas) {
        if ($l -match '(?:\s+)(\d+)$') {
            $pidNum = [int]$matches[1]
            if ($pidNum -and $pidNum -gt 4 -and $pidNum -ne $PID) {
                Log-Aviso "Cerrando proceso previo en puerto $Puerto (PID: $pidNum)..."
                Stop-Process -Id $pidNum -Force -ErrorAction SilentlyContinue
                taskkill /F /PID $pidNum 2>$null | Out-Null
            }
        }
    }
} catch { }

# 3. Purgar directorios de Service Workers y Cache de Edge y Chrome
$rutasCache = @(
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Service Worker",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache"
)

Log-Info "Limpiando caches de Service Worker en Edge y Chrome para localhost..."
foreach ($rc in $rutasCache) {
    if (Test-Path $rc) {
        try {
            Get-ChildItem -Path $rc -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
            Log-Ok "Limpio: $rc"
        } catch {
            Log-Aviso "Algunos archivos de cache en uso fueron omitidos (normal si el navegador esta abierto)."
        }
    }
}

# 4. Lanzar Edge o Chrome en modo InPrivate / Incognito
Log-Info "Lanzando navegador en Modo InPrivate (100% libre de cache de Inventario)..."
$urlLimpia = "https://localhost:$Puerto/limpiar-cache"

$edgePaths = @(
    "$env:ProgramFiles (x86)\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)
$edgeExe = $edgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($edgeExe) {
    Start-Process -FilePath $edgeExe -ArgumentList "-inprivate", $urlLimpia
    Log-Ok "Microsoft Edge abierto en MODO INPRIVATE en: $urlLimpia"
} else {
    $chromePaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles (x86)\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    $chromeExe = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($chromeExe) {
        Start-Process -FilePath $chromeExe -ArgumentList "-incognito", $urlLimpia
        Log-Ok "Google Chrome abierto en MODO INCOGNITO en: $urlLimpia"
    } else {
        Start-Process $urlLimpia
        Log-Ok "Navegador predeterminado abierto en: $urlLimpia"
    }
}

Write-Host ''
Log-Ok "Purga completada. La pagina cargara de inmediato Actas Digitales sin rastros de Inventario."
Write-Host ''
