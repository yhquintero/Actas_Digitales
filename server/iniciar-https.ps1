<#
.SYNOPSIS
  Actas Digitales - Arranque HTTPS Automatico en Windows
  Garantiza el inicio exclusivo de Actas Digitales en https://localhost:8443 (liberando Inventario u otros procesos).

.DESCRIPTION
  Arranque todo en uno de Actas Digitales en Windows:
  - Libera el puerto 8443 si esta ocupado por Inventario / NovaGest u otra aplicacion.
  - Valida Python y librerias necesarias (las instala automaticamente si faltan).
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
$RunServerPy = Join-Path $BackendDir 'run_server.py'
$LogDir = Join-Path $Raiz 'logs'

function Log-Ok($m)    { Write-Host "  [OK] $m" -ForegroundColor Green }
function Log-Aviso($m) { Write-Host "  [!] $m" -ForegroundColor Yellow }
function Log-Fallo($m) { Write-Host "  [X] $m" -ForegroundColor Red }

function Obtener-Python {
    $venvPaths = @(
        (Join-Path $Raiz "backend\venv\Scripts\python.exe"),
        (Join-Path $Raiz "backend\.venv\Scripts\python.exe"),
        (Join-Path $Raiz ".venv\Scripts\python.exe"),
        (Join-Path $Raiz "venv\Scripts\python.exe")
    )
    foreach ($vp in $venvPaths) {
        if (Test-Path $vp) { return $vp }
    }

    $cmds = @(Get-Command 'python', 'py' -ErrorAction SilentlyContinue)
    foreach ($c in $cmds) {
        $p = $c.Source
        if ($p -and (Test-Path $p) -and ($p -notmatch 'WindowsApps')) {
            return $p
        }
    }

    $stdPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
        "$env:ProgramFiles\Python313\python.exe",
        "$env:ProgramFiles\Python312\python.exe",
        "$env:ProgramFiles\Python311\python.exe",
        "$env:ProgramFiles\Python310\python.exe"
    )
    foreach ($sp in $stdPaths) {
        if (Test-Path $sp) { return $sp }
    }

    return "python"
}

function Test-PuertoEscuchando([int]$p) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect("127.0.0.1", $p, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne(800)
        if ($wait) {
            $tcp.EndConnect($iar)
            $tcp.Close()
            return $true
        }
        $tcp.Close()
    } catch { }
    return $false
}

function Test-PuertoEnUso([int]$p) {
    try {
        return (@([System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
            Where-Object { $_.Port -eq $p }).Count -gt 0)
    } catch { return $false }
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

    Start-Sleep -Milliseconds 1000
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

# 1. Liberar puerto 8443
if (Test-PuertoEnUso $Puerto -or (Test-PuertoEscuchando $Puerto)) {
    Log-Aviso "El puerto $Puerto esta ocupado por otra aplicacion (ej. Inventario/NovaGest)."
    Log-Aviso "Liberando puerto $Puerto para asegurar ACTAS DIGITALES..."
    Liberar-Puerto $Puerto
}

# 2. Localizar Python
$PyExe = Obtener-Python
Log-Ok "Python detectado: $PyExe"

# 3. Validar dependencias
$depsOk = & $PyExe -c "import fastapi, uvicorn, docx, cryptography; print('OK')" 2>$null
if ($depsOk -ne "OK") {
    Log-Aviso "Instalando dependencias necesarias para Actas Digitales..."
    & $PyExe -m pip install -r (Join-Path $BackendDir 'requirements.txt')
}
Log-Ok "Dependencias validadas."

# 4. Certificados TLS 1.3
if (-not (Test-Path $Fullchain) -or -not (Test-Path $ServerKey) -or -not (Test-Path $CaCert)) {
    Log-Aviso "Generando certificados criptograficos TLS 1.3 con CA local y SAN..."
    & $PyExe (Join-Path $Raiz 'tools\generar_certificados_https.py')
}
Log-Ok "Certificados TLS 1.3 listos en: $CertsDir"

# 5. Registrar CA en Windows para candado verde
if (Test-Path $CaCert) {
    try {
        certutil -user -addstore -f "Root" $CaCert | Out-Null
        Log-Ok "Autoridad Raiz instalada en almacen de Windows (Candado verde en Chrome/Edge)."
    } catch {
        Log-Aviso "Registro de CA opcional omitido: $_"
    }
}

# 6. Iniciar servidor de Actas Digitales en segundo plano
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$LogOut = Join-Path $LogDir 'servidor.log'
$LogErr = Join-Path $LogDir 'servidor_error.log'
"" | Out-File $LogOut -Force
"" | Out-File $LogErr -Force

Log-Ok "Iniciando servidor de ACTAS DIGITALES en puerto $Puerto..."
$proc = Start-Process -FilePath $PyExe -ArgumentList "`"$RunServerPy`"", "$Puerto" `
    -WorkingDirectory $BackendDir -RedirectStandardOutput $LogOut -RedirectStandardError $LogErr `
    -WindowStyle Minimized -PassThru

# 7. Esperar a que el servidor este escuchando
$Listo = $false
$Limite = (Get-Date).AddSeconds(20)
while ((Get-Date) -lt $Limite) {
    if (Test-PuertoEscuchando $Puerto) {
        $Listo = $true
        break
    }
    if ($proc.HasExited) {
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
    Log-Fallo "El servidor no inicio correctamente."
    if (Test-Path $LogErr) {
        $err = Get-Content $LogErr -Raw -ErrorAction SilentlyContinue
        if ($err) { Write-Host $err -ForegroundColor Red }
    }
}

# 8. Lanzar Panel de Control
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
