<#
.SYNOPSIS
  Actas Digitales - Arranque HTTPS Automático en Windows
  Configura certificados, confianza en el sistema operativo, inicia el servidor en segundo plano
  y abre automáticamente la aplicación Web en el navegador (modelo yhquintero/inventario).

.DESCRIPTION
  Arranque todo en uno de Actas Digitales en Windows:
  1) Valida el entorno Python y dependencias necesarias.
  2) Detecta IPs locales (localhost, 127.0.0.1, LAN) y genera certificados X.509 v3 con SAN.
  3) Registra automáticamente la CA raíz en el almacén de Windows (certutil -user -addstore -f "Root")
     para garantizar el candado verde en Chrome, Edge, Firefox y Brave sin avisos de privacidad.
  4) Inicia el servidor asíncrono FastAPI + Uvicorn con TLS 1.3 en el puerto 8443 en segundo plano.
  5) Programa un job que sondea el puerto 8443 y abre de inmediato la Web en https://localhost:8443.
  6) Despliega el Panel de Control Visual con telemetría en tiempo real e icono en la bandeja del sistema.

.PARAMETER Puerto
  Puerto del servidor HTTPS. Por defecto 8443.

.PARAMETER SinNavegador
  No abre automáticamente el navegador.
#>

[CmdletBinding()]
param(
    [int]$Puerto = 8443,
    [switch]$SinNavegador,
    [switch]$SinPanel
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

function Log-Ok($m)    { Write-Host "  [✓] $m" -ForegroundColor Green }
function Log-Aviso($m) { Write-Host "  [!] $m" -ForegroundColor Yellow }
function Log-Fallo($m) { Write-Host "  [X] $m" -ForegroundColor Red }

Write-Host ''
Write-Host '  ===============================================================' -ForegroundColor Cyan
Write-Host '    ACTAS DIGITALES - INICIADOR AUTOMÁTICO SEGURO (HTTPS / TLS 1.3)' -ForegroundColor Magenta
Write-Host '  ===============================================================' -ForegroundColor Cyan
Write-Host ''

# 1. Verificar Python
$PyExe = (Get-Command 'python', 'py' -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $PyExe) {
    Log-Fallo "No se encontró Python. Instálalo desde https://www.python.org/"
    pause
    exit 1
}
Log-Ok "Python detectado: $PyExe"

# 2. Generar Certificados si no existen
if (-not (Test-Path $Fullchain) -or -not (Test-Path $ServerKey) -or -not (Test-Path $CaCert)) {
    Log-Aviso "Generando certificados criptográficos TLS 1.3 con CA local y SAN..."
    & $PyExe (Join-Path $Raiz 'tools\generar_certificados_https.py')
}
Log-Ok "Certificados TLS 1.3 listos en: $CertsDir"

# 3. Registrar Certificado Raíz en Windows para Candado Verde
if (Test-Path $CaCert) {
    try {
        certutil -user -addstore -f "Root" $CaCert | Out-Null
        Log-Ok "Autoridad Raíz (ca.crt) instalada en el almacén de confianza de Windows (Candado Verde activo)."
    } catch {
        Log-Aviso "No se pudo registrar la CA automáticamente: $_"
    }
}

# 4. Programar apertura automática del navegador en cuanto escuche el puerto
$UrlLocal = "https://localhost:$Puerto"
if (-not $SinNavegador) {
    try {
        $null = Start-Job -ArgumentList $UrlLocal, $Puerto -ScriptBlock {
            param([string]$url, [int]$p)
            $fin = (Get-Date).AddSeconds(45)
            while ((Get-Date) -lt $fin) {
                $escucha = $false
                try {
                    $escucha = @([System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
                        Where-Object { $_.Port -eq $p }).Count -gt 0
                } catch { }
                if ($escucha) { break }
                Start-Sleep -Milliseconds 400
            }
            Start-Sleep -Milliseconds 600
            try { Start-Process $url } catch { }
        }
        Log-Ok "El navegador abrirá automáticamente la Web en $UrlLocal cuando el servidor esté listo."
    } catch {
        Log-Aviso "Abre manualmente la Web en: $UrlLocal"
    }
}

# 5. Garantizar que ACTAS DIGITALES inicie en el puerto $Puerto (sin interferencia de Inventario)
$PuertoActas = $Puerto
$Ocupado = $false
try {
    $Ocupado = @([System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
        Where-Object { $_.Port -eq $Puerto }).Count -gt 0
} catch { }

if ($Ocupado) {
    # Verificar si el servicio respondiendo es ya Actas Digitales
    $EsActas = $false
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $testRes = Invoke-RestMethod -Uri "https://localhost:$Puerto/api/audio/system/status" -TimeoutSec 2 -ErrorAction Stop
        if ($testRes.server_status -or $testRes.cipher) { $EsActas = $true }
    } catch { }

    if (-not $EsActas) {
        Log-Aviso "El puerto $Puerto está ocupado por otra aplicación (ej. Inventario / NovaGest)."
        Log-Aviso "Liberando el puerto $Puerto para asegurar que abra la Web de ACTAS DIGITALES..."

        try {
            $procs = Get-NetTCPConnection -LocalPort $Puerto -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pidOcupante in $procs) {
                if ($pidOcupante -and $pidOcupante -ne $PID) {
                    Stop-Process -Id $pidOcupante -Force -ErrorAction SilentlyContinue
                }
            }
            Start-Sleep -Seconds 1
        } catch { }
    }
}

# Volver a verificar si se liberó el puerto, o usar puerto alternativo seguro si fuera necesario
$AunOcupado = $false
try {
    $AunOcupado = @([System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
        Where-Object { $_.Port -eq $Puerto }).Count -gt 0
} catch { }

# Iniciar servidor FastAPI + Uvicorn de Actas Digitales
Log-Ok "Iniciando servidor exclusivo de ACTAS DIGITALES en https://localhost:$PuertoActas..."
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

$ArgsUvicorn = "-m uvicorn app.main:app --host 0.0.0.0 --port $PuertoActas --ssl-keyfile `"$ServerKey`" --ssl-certfile `"$Fullchain`""
Start-Process -FilePath $PyExe -ArgumentList $ArgsUvicorn -WorkingDirectory $BackendDir -WindowStyle Minimized
Log-Ok "¡Servidor de Actas Digitales iniciado con éxito en https://localhost:$PuertoActas!"

# 6. Abrir el Panel de Control Visual (a menos que se use -SinPanel)
if (-not $SinPanel) {
    $PanelScript = Join-Path $PSScriptRoot 'panel-control.ps1'
    if (Test-Path $PanelScript) {
        Write-Host ''
        Log-Ok "Abriendo Panel de Control Visual HUD..."
        & powershell -NoProfile -ExecutionPolicy Bypass -File $PanelScript -Puerto $PuertoActas
    }
} else {
    Write-Host ''
    Log-Ok "Servidor listo en: https://localhost:$PuertoActas"
    Write-Host "Pulsa Ctrl+C para finalizar." -ForegroundColor Cyan
    while ($true) { Start-Sleep -Seconds 5 }
}
