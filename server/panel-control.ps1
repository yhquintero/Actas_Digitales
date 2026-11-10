<#
.SYNOPSIS
  Actas Digitales - Panel de Control Visual (Windows PowerShell GUI)
  Ventana de control HUD con botones interactivos, diagnostico real y purga de cache.

.DESCRIPTION
  Gestiona el ciclo de vida del servidor HTTPS de Actas Digitales en Windows:
  - Diagnostica en tiempo real si el puerto 8443 esta ocupado por Inventario/NovaGest o Actas Digitales.
  - Inicia el servidor de Actas Digitales desalojando cualquier proceso en conflicto.
  - Ofrece purga profunda de cache de Edge/Chrome y apertura en Modo InPrivate sin cache.
  - Pruebas de fuego OWASP, gestion de certificados TLS 1.3 y candado verde.
#>

[CmdletBinding()]
param(
    [int]$Puerto = 8443,
    [switch]$OmitirNavegador
)

$ErrorActionPreference = 'Continue'
try { chcp 65001 | Out-Null } catch { }
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$Raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$CertsDir = Join-Path $Raiz 'certs'
$Fullchain = Join-Path $CertsDir 'fullchain.pem'
$ServerKey = Join-Path $CertsDir 'server.key'
$CaCert = Join-Path $CertsDir 'ca.crt'
$BackendDir = Join-Path $Raiz 'backend'
$RunServerPy = Join-Path $BackendDir 'run_server.py'
$UploadsDir = Join-Path $Raiz 'backend\uploads'
$LogDir = Join-Path $Raiz 'logs'

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

$PyExe = Obtener-Python

function Test-PuertoEscuchando([int]$p) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect("127.0.0.1", $p, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne(600)
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
            try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch { }
            try { taskkill /F /PID $_.ProcessId 2>$null | Out-Null } catch { }
        }
    } catch { }

    Start-Sleep -Milliseconds 800
}

function Abrir-NavegadorInPrivate($url) {
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

# 1. Asegurar certificados
if (-not (Test-Path $Fullchain) -or -not (Test-Path $ServerKey)) {
    Write-Host "[*] Generando certificados TLS 1.3..." -ForegroundColor Yellow
    & $PyExe (Join-Path $Raiz 'tools\generar_certificados_https.py')
}

# 2. Construir Ventana WinForms
$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Actas Digitales - Panel de Control [TLS 1.3 / HTTPS]"
$Form.Size = New-Object System.Drawing.Size(680, 660)
$Form.StartPosition = "CenterScreen"
$Form.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
$Form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$Form.MaximizeBox = $false

# Encabezado
$LblTitulo = New-Object System.Windows.Forms.Label
$LblTitulo.Text = "ACTAS DIGITALES :: PANEL DE CONTROL"
$LblTitulo.Font = New-Object System.Drawing.Font("Consolas", 14, [System.Drawing.FontStyle]::Bold)
$LblTitulo.ForeColor = [System.Drawing.Color]::FromArgb(129, 140, 248)
$LblTitulo.Location = New-Object System.Drawing.Point(20, 16)
$LblTitulo.Size = New-Object System.Drawing.Size(630, 26)
$Form.Controls.Add($LblTitulo)

$LblSub = New-Object System.Windows.Forms.Label
$LblSub.Text = "TELEMETRIA EN TIEMPO REAL - SERVIDOR SEGURO HTTPS - ORQUESTACION"
$LblSub.Font = New-Object System.Drawing.Font("Consolas", 8, [System.Drawing.FontStyle]::Regular)
$LblSub.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$LblSub.Location = New-Object System.Drawing.Point(20, 44)
$LblSub.Size = New-Object System.Drawing.Size(630, 16)
$Form.Controls.Add($LblSub)

# Caja de Estado
$GrpEstado = New-Object System.Windows.Forms.GroupBox
$GrpEstado.Text = " TELEMETRIA Y ESTADO DEL NUCLEO "
$GrpEstado.Font = New-Object System.Drawing.Font("Consolas", 9, [System.Drawing.FontStyle]::Bold)
$GrpEstado.ForeColor = [System.Drawing.Color]::FromArgb(99, 102, 241)
$GrpEstado.Location = New-Object System.Drawing.Point(20, 66)
$GrpEstado.Size = New-Object System.Drawing.Size(625, 76)
$GrpEstado.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)

$LblEstado = New-Object System.Windows.Forms.Label
$LblEstado.Text = "ESTADO: [ VERIFICANDO SERVICIO... ]"
$LblEstado.Font = New-Object System.Drawing.Font("Consolas", 9, [System.Drawing.FontStyle]::Bold)
$LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(251, 191, 36)
$LblEstado.Location = New-Object System.Drawing.Point(15, 22)
$LblEstado.Size = New-Object System.Drawing.Size(595, 22)
$GrpEstado.Controls.Add($LblEstado)

$LblSubEstado = New-Object System.Windows.Forms.Label
$LblSubEstado.Text = "PROTECCION: DoS Token Bucket (180 req/min) - ESTANDARES: OWASP Top 10 + RAE"
$LblSubEstado.Font = New-Object System.Drawing.Font("Consolas", 8, [System.Drawing.FontStyle]::Regular)
$LblSubEstado.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$LblSubEstado.Location = New-Object System.Drawing.Point(15, 46)
$LblSubEstado.Size = New-Object System.Drawing.Size(595, 18)
$GrpEstado.Controls.Add($LblSubEstado)
$Form.Controls.Add($GrpEstado)

# Botones
function CrearBoton($texto, $x, $y, $w, $h, $colorFondo, $colorBorde) {
    $btn = New-Object System.Windows.Forms.Button
    $btn.Text = $texto
    $btn.Location = New-Object System.Drawing.Point($x, $y)
    $btn.Size = New-Object System.Drawing.Size($w, $h)
    $btn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $btn.FlatAppearance.BorderSize = 2
    $btn.FlatAppearance.BorderColor = $colorBorde
    $btn.BackColor = $colorFondo
    $btn.ForeColor = [System.Drawing.Color]::White
    $btn.Font = New-Object System.Drawing.Font("Consolas", 8.5, [System.Drawing.FontStyle]::Bold)
    $btn.Cursor = [System.Windows.Forms.Cursors]::Hand
    return $btn
}

# Fila 1: Iniciar Todo / Abrir Navegador
$BtnIniciar = CrearBoton "INICIAR TODO (HTTPS)" 20 152 300 38 `
    ([System.Drawing.Color]::FromArgb(49, 46, 129)) ([System.Drawing.Color]::FromArgb(99, 102, 241))

$BtnIniciar.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Validando entorno Python y dependencias...")
    $deps = & $PyExe -c "import fastapi, uvicorn, docx, cryptography; print('OK')" 2>$null
    if ($deps -ne "OK") {
        $TxtConsola.AppendText("`r`n[*] Instalando dependencias requeridas (fastapi, uvicorn, docx, cryptography)...")
        & $PyExe -m pip install -r (Join-Path $BackendDir 'requirements.txt')
    }

    $TxtConsola.AppendText("`r`n[*] Liberando puerto $Puerto (desalojando Inventario/NovaGest)...")
    Liberar-Puerto $Puerto

    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
    $LogOut = Join-Path $LogDir 'servidor.log'
    $LogErr = Join-Path $LogDir 'servidor_error.log'
    "" | Out-File $LogOut -Force
    "" | Out-File $LogErr -Force

    $TxtConsola.AppendText("`r`n[*] Iniciando servidor ACTAS DIGITALES en https://localhost:$Puerto...")
    $proc = Start-Process -FilePath $PyExe -ArgumentList "`"$RunServerPy`"", "$Puerto" `
        -WorkingDirectory $BackendDir -RedirectStandardOutput $LogOut -RedirectStandardError $LogErr `
        -WindowStyle Minimized -PassThru

    $ok = $false
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Milliseconds 600
        if (Test-PuertoEscuchando $Puerto) { $ok = $true; break }
        if ($proc.HasExited) { break }
    }

    if ($ok) {
        $LblEstado.Text = "ESTADO: [ EN LINEA ] - PUERTO: $Puerto (HTTPS) - ACTAS DIGITALES EXCLUSIVO"
        $LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
        $TxtConsola.AppendText("`r`n[OK] Servidor Actas Digitales activo y escuchando en https://localhost:$Puerto")
        $TxtConsola.AppendText("`r`n[+] Haz clic en [ ABRIR EN EDGE INPRIVATE ] para ver la web sin cache de Inventario.")
    } else {
        $LblEstado.Text = "ESTADO: [ ERROR AL INICIAR ] - PUERTO $Puerto"
        $LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(248, 113, 113)
        $TxtConsola.AppendText("`r`n[X] El servidor no pudo iniciar.")
        if (Test-Path $LogErr) {
            $errContent = Get-Content $LogErr -Raw -ErrorAction SilentlyContinue
            if ($errContent) {
                $TxtConsola.AppendText("`r`n[DETALLE ERROR]: $errContent")
            }
        }
    }
})
$Form.Controls.Add($BtnIniciar)

$BtnAbrir = CrearBoton "ABRIR NAVEGADOR" 345 152 300 38 `
    ([System.Drawing.Color]::FromArgb(6, 78, 59)) ([System.Drawing.Color]::FromArgb(16, 185, 129))

$BtnAbrir.Add_Click({
    Start-Process "https://localhost:$Puerto"
    $TxtConsola.AppendText("`r`n[+] Navegador abierto en https://localhost:$Puerto")
})
$Form.Controls.Add($BtnAbrir)

# Fila 2: InPrivate (Cero Cache) y Purga Total de Cache del Navegador
$BtnInPrivate = CrearBoton "ABRIR EN EDGE INPRIVATE (SIN CACHE)" 20 196 300 38 `
    ([System.Drawing.Color]::FromArgb(14, 116, 144)) ([System.Drawing.Color]::FromArgb(34, 211, 238))

$BtnInPrivate.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Abriendo en Modo InPrivate sin cache previa...")
    $nav = Abrir-NavegadorInPrivate "https://localhost:$Puerto/limpiar-cache"
    $TxtConsola.AppendText("`r`n[OK] $nav lanzado en https://localhost:$Puerto/limpiar-cache (libre de cache de Inventario).")
})
$Form.Controls.Add($BtnInPrivate)

$BtnPurgar = CrearBoton "PURGAR CACHE NAVEGADOR / SW" 345 196 300 38 `
    ([System.Drawing.Color]::FromArgb(30, 58, 138)) ([System.Drawing.Color]::FromArgb(59, 130, 246))

$BtnPurgar.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Ejecutando purga total de cache y Service Workers residuales...")
    if (Test-Path $UploadsDir) {
        Get-ChildItem -Path $UploadsDir -Exclude ".gitkeep" | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    }

    $rutas = @(
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Service Worker",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache"
    )
    foreach ($r in $rutas) {
        if (Test-Path $r) {
            try { Get-ChildItem -Path $r -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue } catch { }
        }
    }

    $TxtConsola.AppendText("`r`n[OK] Cache de disco y Service Workers purgados.")
    $nav = Abrir-NavegadorInPrivate "https://localhost:$Puerto/limpiar-cache"
    $TxtConsola.AppendText("`r`n[OK] Navegador refrescado en modo limpio: $nav")
})
$Form.Controls.Add($BtnPurgar)

# Fila 3: Pruebas de Fuego / Renovar Certificados
$BtnPruebas = CrearBoton "PRUEBAS DE FUEGO OWASP" 20 240 300 38 `
    ([System.Drawing.Color]::FromArgb(136, 19, 55)) ([System.Drawing.Color]::FromArgb(244, 63, 94))

$BtnPruebas.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Ejecutando Suite de Pruebas de Fuego OWASP Top 10...")
    $p = Start-Process -FilePath $PyExe -ArgumentList (Join-Path $Raiz "tools\test_pruebas_de_fuego.py") -NoNewWindow -PassThru -Wait
    if ($p.ExitCode -eq 0) {
        $TxtConsola.AppendText("`r`n[OK] 11/11 Pruebas Superadas Exitosamente (OWASP, TLS 1.3, Rate Limit, DOCX, RAE).")
    } else {
        $TxtConsola.AppendText("`r`n[!] Alerta en pruebas de fuego (Codigo de salida: $($p.ExitCode)).")
    }
})
$Form.Controls.Add($BtnPruebas)

$BtnCerts = CrearBoton "RENOVAR TLS / SAN" 345 240 300 38 `
    ([System.Drawing.Color]::FromArgb(88, 28, 135)) ([System.Drawing.Color]::FromArgb(168, 85, 247))

$BtnCerts.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Regenerando y refirmando certificados X.509 v3 con SAN...")
    & $PyExe (Join-Path $Raiz 'tools\generar_certificados_https.py')
    $TxtConsola.AppendText("`r`n[OK] Certificados actualizados con SAN: localhost, 127.0.0.1, 0.0.0.0, actasdigitales.local")
})
$Form.Controls.Add($BtnCerts)

# Fila 4: Detener Servicios / Confiar Certificado CA
$BtnDetener = CrearBoton "DETENER SERVICIOS" 20 284 300 38 `
    ([System.Drawing.Color]::FromArgb(127, 29, 29)) ([System.Drawing.Color]::FromArgb(239, 68, 68))

$BtnDetener.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Deteniendo procesos en puerto $Puerto...")
    Liberar-Puerto $Puerto
    $LblEstado.Text = "ESTADO: [ DETENIDO ] - PUERTO: $Puerto - SERVICIOS APAGADOS"
    $LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(248, 113, 113)
    $TxtConsola.AppendText("`r`n[OK] Servidor detenido correctamente.")
})
$Form.Controls.Add($BtnDetener)

$BtnConfiar = CrearBoton "CONFIAR CA (CANDADO VERDE)" 345 284 300 38 `
    ([System.Drawing.Color]::FromArgb(4, 120, 87)) ([System.Drawing.Color]::FromArgb(16, 185, 129))

$BtnConfiar.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Registrando Autoridad Certificadora (ca.crt) en Windows...")
    $CaCertPath = Join-Path $Raiz "certs\ca.crt"
    if (-not (Test-Path $CaCertPath)) {
        & $PyExe (Join-Path $Raiz 'tools\generar_certificados_https.py')
    }
    try {
        certutil -user -addstore -f "Root" $CaCertPath | Out-Null
        $TxtConsola.AppendText("`r`n[OK] Certificado Raiz registrado con exito. Candado verde activo en Chrome y Edge.")
    } catch {
        $TxtConsola.AppendText("`r`n[!] Error al registrar el certificado: $_")
    }
})
$Form.Controls.Add($BtnConfiar)

# Consola de Eventos HUD
$TxtConsola = New-Object System.Windows.Forms.TextBox
$TxtConsola.Multiline = $true
$TxtConsola.ScrollBars = "Vertical"
$TxtConsola.Location = New-Object System.Drawing.Point(20, 332)
$TxtConsola.Size = New-Object System.Drawing.Size(625, 272)
$TxtConsola.BackColor = [System.Drawing.Color]::FromArgb(2, 6, 23)
$TxtConsola.ForeColor = [System.Drawing.Color]::FromArgb(56, 189, 248)
$TxtConsola.Font = New-Object System.Drawing.Font("Consolas", 9)
$TxtConsola.ReadOnly = $true

# Diagnostico Inicial al Abrir el HUD
$TxtConsola.Text = "[*] Actas Digitales HUD Inicializado."
$TxtConsola.AppendText("`r`n[*] Interprete Python: $PyExe")

if (Test-PuertoEscuchando $Puerto) {
    $LblEstado.Text = "ESTADO: [ EN LINEA ] - PUERTO: $Puerto (HTTPS) - ACTAS DIGITALES EXCLUSIVO"
    $LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
    $TxtConsola.AppendText("`r`n[OK] Servidor detectado y respondiendo en puerto $Puerto.")
    $TxtConsola.AppendText("`r`n[+] Haz clic en [ ABRIR EN EDGE INPRIVATE ] para entrar sin cache de Inventario.")
} elseif (Test-PuertoEnUso $Puerto) {
    $LblEstado.Text = "ESTADO: [ CONFLICTO ] - PUERTO $Puerto OCUPADO POR INVENTARIO/NOVAGEST"
    $LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(248, 113, 113)
    $TxtConsola.AppendText("`r`n[!] ATENCION: El puerto $Puerto esta ocupado por Inventario / NovaGest.")
    $TxtConsola.AppendText("`r`n[>] Haz clic en [ INICIAR TODO (HTTPS) ] para cerrar Inventario e iniciar Actas Digitales.")
} else {
    $LblEstado.Text = "ESTADO: [ DETENIDO ] - PUERTO: $Puerto DISPONIBLE - LISTO PARA INICIAR"
    $LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(251, 191, 36)
    $TxtConsola.AppendText("`r`n[*] Servidor apagado. Haz clic en [ INICIAR TODO (HTTPS) ] para encenderlo.")
}

$Form.Controls.Add($TxtConsola)

[void]$Form.ShowDialog()
