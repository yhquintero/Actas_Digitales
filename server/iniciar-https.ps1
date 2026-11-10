<#
.SYNOPSIS
  Actas Digitales - Arranque HTTPS Automatico en Windows
  Garantiza el inicio exclusivo de Actas Digitales en https://localhost:8443 (liberando Inventario u otros procesos).

.DESCRIPTION
  Arranque todo en uno de Actas Digitales en Windows:
  - Libera el puerto 8443 si esta ocupado por Inventario / NovaGest u otra aplicacion.
  - Valida Python y librerias necesarias.
  - Genera certificados TLS 1.3 con SAN si faltan.
  - Registra la CA raiz en el almacen de Windows para activar el candado verde.
  - Inicia el servidor de Actas Digitales en segundo plano en el puerto 8443.
  - Abre automaticamente la Web en https://localhost:8443 y despliega el Panel de Control.

.PARAMETER Puerto
  Puerto del servidor HTTPS. Por defecto 8443.

.PARAMETER SinNavegador
  No abre automaticamente el navegador.
#>

[CmdletBinding()]
param(
    [int]$Puerto = 8443,
    [switch]$SinNavegador,
    [switch]$SinPanel,
    [switch]$Forzar
)

$ErrorActionPreference = 'Continue'
try { chcp 65001 | Out-Null } catch { }
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$Raiz = Split-Path -Parent $PSScriptRoot
$CertsDir = Join-Path $Raiz 'certs'
$Fullchain = Join-Path $CertsDir 'fullchain.pem'
$ServerKey = Join-Path $CertsDir 'server.key'
$CaCert = Join-Path $CertsDir 'ca.crt'
$BackendDir = Join-Path $Raiz 'backend'
$LogDir = Join-Path $Raiz 'logs'

function Log-Ok($m)    { Write-Host "  [OK] $m" -ForegroundColor Green }
function Log-Aviso($m) { Write-Host "  [!] $m" -ForegroundColor Yellow }
function Log-Fallo($m) { Write-Host "  [X] $m" -ForegroundColor Red }

function Test-PuertoEnUso([int]$p) {
    try {
        return (@([System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
            Where-Object { $_.Port -eq $p }).Count -gt 0)
    } catch { return $false }
}

function Test-ActasOnline([int]$p) {
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $resp = Invoke-RestMethod -Uri "https://localhost:$p/api/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($resp -and $resp.service -match "Actas Digitales") {
            return $true
        }
    } catch { }
    return $false
}

function Liberar-Puerto([int]$p) {
    $ocupantes = @()
    try {
        $conns = @(Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue)
        foreach ($c in $conns) {
            if ($c.OwningProcess -and $c.OwningProcess -gt 4 -and $c.OwningProcess -ne $PID) {
                $ocupantes += $c.OwningProcess
            }
        }
    } catch { }

    try {
        $lineas = @(netstat -ano | Select-String ":$p\s+.*LISTENING|:$p\s+.*ESCUCHANDO")
        foreach ($l in $lineas) {
            if ($l -match '(?:\s+)(\d+)$') {
                $pidNum = [int]$matches[1]
                if ($pidNum -and $pidNum -gt 4 -and $pidNum -ne $PID) {
                    $ocupantes += $pidNum
                }
            }
        }
    } catch { }

    $unicos = $ocupantes | Select-Object -Unique
    foreach ($procId in $unicos) {
        Log-Aviso "Deteniendo proceso previo en puerto $p (PID $procId: Inventario u otra app)..."
        try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch { }
        try { taskkill /F /PID $procId 2>$null | Out-Null } catch { }
    }

    # Desalojar procesos python de Inventario / NovaGest en segundo plano
    try {
        Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
            ($_.Name -match 'python' -or $_.CommandLine -match 'uvicorn') -and
            ($_.CommandLine -match 'inventario|novagest') -and
            $_.ProcessId -ne $PID
        } | ForEach-Object {
            Log-Aviso "Cerrando proceso secundario de Inventario (PID $($_.ProcessId))..."
            try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch { }
            try { taskkill /F /PID $_.ProcessId 2>$null | Out-Null } catch { }
        }
    } catch { }

    Start-Sleep -Milliseconds 1200
}

function Abrir-NavegadorLimpio($url) {
    $edgePaths = @(
        "$env:ProgramFiles (x86)\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
    )
    $edgeExe = $edgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($edgeExe) {
        Start-Process -FilePath $edgeExe -ArgumentList "-inprivate", $url
        return "Microsoft Edge [InPrivate]"
    }

    $chromePaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles (x86)\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    $chromeExe = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($chromeExe) {
        Start-Process -FilePath $chromeExe -ArgumentList "-incognito", $url
        return "Google Chrome [Incognito]"
    }

    Start-Process $url
    return "Navegador Predeterminado"
}

Write-Host ''
Write-Host '  ===============================================================' -ForegroundColor Cyan
Write-Host '    ACTAS DIGITALES - INICIADOR AUTOMATICO EXCLUSIVO (HTTPS 8443)' -ForegroundColor Magenta
Write-Host '  ===============================================================' -ForegroundColor Cyan
Write-Host ''

# 1. Garantizar que el puerto 8443 este libre para Actas Digitales (eliminando Inventario/NovaGest)
if (Test-PuertoEnUso $Puerto) {
    Log-Aviso "El puerto $Puerto esta ocupado (por ejemplo por Inventario / NovaGest)."
    Log-Aviso "Liberando el puerto $Puerto para asegurar que abra ACTAS DIGITALES..."
    Liberar-Puerto $Puerto
}

if (Test-PuertoEnUso $Puerto) {
    Log-Aviso "El puerto $Puerto sigue ocupado. Intentando una liberacion forzada..."
    Liberar-Puerto $Puerto
}

# 2. Localizar Python
$PyExe = (Get-Command 'python', 'py' -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $PyExe) {
    Log-Fallo "No se encontro Python. Instalalo desde https://www.python.org/"
    pause
    exit 1
}
Log-Ok "Python detectado: $PyExe"

# 3. Certificados TLS 1.3
if (-not (Test-Path $Fullchain) -or -not (Test-Path $ServerKey) -or -not (Test-Path $CaCert)) {
    Log-Aviso "Generando certificados criptograficos TLS 1.3 con CA local y SAN..."
    & $PyExe (Join-Path $Raiz 'tools\generar_certificados_https.py')
}
Log-Ok "Certificados TLS 1.3 listos en: $CertsDir"

# 4. Registrar CA en Windows para candado verde
if (Test-Path $CaCert) {
    try {
        certutil -user -addstore -f "Root" $CaCert | Out-Null
        Log-Ok "Autoridad Raiz instalada en almacen de Windows (Candado verde en Chrome/Edge)."
    } catch {
        Log-Aviso "Registro de CA opcional omitido: $_"
    }
}

# 5. Iniciar servidor de Actas Digitales en segundo plano
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$LogServidor = Join-Path $LogDir 'servidor.log'
$ArgsUvicorn = "-m uvicorn app.main:app --host 0.0.0.0 --port $Puerto --ssl-keyfile `"$ServerKey`" --ssl-certfile `"$Fullchain`""

Log-Ok "Iniciando servidor de ACTAS DIGITALES en puerto $Puerto..."
$ProcServidor = Start-Process -FilePath $PyExe -ArgumentList $ArgsUvicorn -WorkingDirectory $BackendDir `
    -WindowStyle Minimized -PassThru

# 6. Esperar y confirmar que Actas Digitales responda en /api/health
$Listo = $false
$Limite = (Get-Date).AddSeconds(20)
while ((Get-Date) -lt $Limite) {
    if (Test-ActasOnline $Puerto) {
        $Listo = $true
        break
    }
    Start-Sleep -Milliseconds 400
}

$UrlLimpia = "https://localhost:$Puerto/limpiar-cache"
$UrlLocal = "https://localhost:$Puerto"

if ($Listo) {
    Log-Ok "Servidor ACTAS DIGITALES confirmado y respondiendo en: $UrlLocal"
    if (-not $SinNavegador) {
        Start-Sleep -Milliseconds 500
        Log-Ok "Abriendo aplicacion Web de Actas Digitales en modo limpio sin cache..."
        $nav = Abrir-NavegadorLimpio $UrlLimpia
        Log-Ok "Navegador activo: $nav"
    }
} else {
    Log-Fallo "El servidor tardo en responder. Revisa que el puerto $Puerto este libre."
}

# 7. Lanzar el Panel de Control Visual (si no se omitio)
if (-not $SinPanel) {
    $PanelScript = Join-Path $PSScriptRoot 'panel-control.ps1'
    if (Test-Path $PanelScript) {
        Write-Host ''
        Log-Ok "Abriendo Panel de Control Visual..."
        & powershell -NoProfile -ExecutionPolicy Bypass -File $PanelScript -Puerto $Puerto
    }
} else {
    Write-Host ''
    Log-Ok "Actas Digitales listo en: $UrlLocal"
    Write-Host "Pulsa Ctrl+C para finalizar." -ForegroundColor Cyan
    while ($true) { Start-Sleep -Seconds 5 }
}
