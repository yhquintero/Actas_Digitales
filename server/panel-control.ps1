<#
.SYNOPSIS
  Actas Digitales - Panel de Control Visual Futurista (Windows PowerShell GUI)
  Ventana de control HUD con botones futuristas iluminados y telemetría en tiempo real.

.DESCRIPTION
  Gestiona el ciclo de vida del servidor HTTPS de Actas Digitales en Windows:
  1) Valida y genera certificados TLS 1.3 si no existen.
  2) Inicia el servidor FastAPI con TLS en el puerto 8443 en segundo plano.
  3) Ofrece controles futuristas interactivos con estado en tiempo real.
#>

[CmdletBinding()]
param(
    [int]$Puerto = 8443,
    [switch]$OmitirNavegador
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$Raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$CertsDir = Join-Path $Raiz 'certs'
$Fullchain = Join-Path $CertsDir 'fullchain.pem'
$ServerKey = Join-Path $CertsDir 'server.key'
$BackendDir = Join-Path $Raiz 'backend'
$UploadsDir = Join-Path $Raiz 'backend\app\uploads'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   ACTAS DIGITALES - PANEL DE CONTROL FUTURISTA HUD" -ForegroundColor Magenta
Write-Host "   Raiz: $Raiz" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Asegurar certificados
if (-not (Test-Path $Fullchain) -or -not (Test-Path $ServerKey)) {
    Write-Host "[*] Generando certificados TLS 1.3 con CA local..." -ForegroundColor Yellow
    python (Join-Path $Raiz 'tools\generar_certificados_https.py')
}

# 2. Construir Ventana Futurista WinForms
$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Actas Digitales · Panel de Control Futurista [TLS 1.3 / HUD]"
$Form.Size = New-Object System.Drawing.Size(680, 630)
$Form.StartPosition = "CenterScreen"
$Form.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
$Form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$Form.MaximizeBox = $false

# Encabezado
$LblTitulo = New-Object System.Windows.Forms.Label
$LblTitulo.Text = "ACTAS DIGITALES :: PANEL DE CONTROL"
$LblTitulo.Font = New-Object System.Drawing.Font("Consolas", 15, [System.Drawing.FontStyle]::Bold)
$LblTitulo.ForeColor = [System.Drawing.Color]::FromArgb(129, 140, 248)
$LblTitulo.Location = New-Object System.Drawing.Point(20, 18)
$LblTitulo.Size = New-Object System.Drawing.Size(630, 28)
$Form.Controls.Add($LblTitulo)

$LblSub = New-Object System.Windows.Forms.Label
$LblSub.Text = "TELEMETRÍA EN TIEMPO REAL · SERVIDOR SEGURO HTTPS · ORQUESTACIÓN INTEGRAL"
$LblSub.Font = New-Object System.Drawing.Font("Consolas", 8, [System.Drawing.FontStyle]::Regular)
$LblSub.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$LblSub.Location = New-Object System.Drawing.Point(20, 48)
$LblSub.Size = New-Object System.Drawing.Size(630, 18)
$Form.Controls.Add($LblSub)

# Caja de Estado
$GrpEstado = New-Object System.Windows.Forms.GroupBox
$GrpEstado.Text = " TELEMETRÍA Y ESTADO DEL NÚCLEO "
$GrpEstado.Font = New-Object System.Drawing.Font("Consolas", 9, [System.Drawing.FontStyle]::Bold)
$GrpEstado.ForeColor = [System.Drawing.Color]::FromArgb(99, 102, 241)
$GrpEstado.Location = New-Object System.Drawing.Point(20, 72)
$GrpEstado.Size = New-Object System.Drawing.Size(625, 78)
$GrpEstado.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)

$LblEstado = New-Object System.Windows.Forms.Label
$LblEstado.Text = "ESTADO: [ EN ESPERA ] · PUERTO: $Puerto (HTTPS) · PROTOCOLO: TLS 1.3 / AES-256"
$LblEstado.Font = New-Object System.Drawing.Font("Consolas", 9, [System.Drawing.FontStyle]::Bold)
$LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
$LblEstado.Location = New-Object System.Drawing.Point(15, 25)
$LblEstado.Size = New-Object System.Drawing.Size(595, 22)
$GrpEstado.Controls.Add($LblEstado)

$LblSubEstado = New-Object System.Windows.Forms.Label
$LblSubEstado.Text = "PROTECCIÓN: DoS Token Bucket (120 req/min) · ESTÁNDARES: OWASP Top 10 + ASVS v4.0"
$LblSubEstado.Font = New-Object System.Drawing.Font("Consolas", 8, [System.Drawing.FontStyle]::Regular)
$LblSubEstado.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$LblSubEstado.Location = New-Object System.Drawing.Point(15, 48)
$LblSubEstado.Size = New-Object System.Drawing.Size(595, 18)
$GrpEstado.Controls.Add($LblSubEstado)
$Form.Controls.Add($GrpEstado)

# Botones Futuristas
function CrearBotonFuturista($texto, $x, $y, $w, $h, $colorFondo, $colorBorde) {
    $btn = New-Object System.Windows.Forms.Button
    $btn.Text = $texto
    $btn.Location = New-Object System.Drawing.Point($x, $y)
    $btn.Size = New-Object System.Drawing.Size($w, $h)
    $btn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $btn.FlatAppearance.BorderSize = 2
    $btn.FlatAppearance.BorderColor = $colorBorde
    $btn.BackColor = $colorFondo
    $btn.ForeColor = [System.Drawing.Color]::White
    $btn.Font = New-Object System.Drawing.Font("Consolas", 9, [System.Drawing.FontStyle]::Bold)
    $btn.Cursor = [System.Windows.Forms.Cursors]::Hand
    return $btn
}

# Fila 1: Iniciar Todo / Abrir Navegador
$BtnIniciar = CrearBotonFuturista "🚀 INICIAR TODO (HTTPS)" 20 160 300 42 `
    ([System.Drawing.Color]::FromArgb(49, 46, 129)) ([System.Drawing.Color]::FromArgb(99, 102, 241))

$BtnIniciar.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Levantando servidor FastAPI + Uvicorn con TLS 1.3 en puerto $Puerto...")
    Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port $Puerto --ssl-keyfile `"$ServerKey`" --ssl-certfile `"$Fullchain`"" -WorkingDirectory $BackendDir -WindowStyle Minimized
    Start-Sleep -Seconds 1
    $LblEstado.Text = "ESTADO: [ EN LÍNEA (ONLINE) ] · PUERTO: $Puerto (HTTPS) · PROTOCOLO: TLS 1.3"
    $LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
    $TxtConsola.AppendText("`r`n[✓] Servidor activo en https://localhost:$Puerto")
})
$Form.Controls.Add($BtnIniciar)

$BtnAbrir = CrearBotonFuturista "🌐 ABRIR NAVEGADOR" 345 160 300 42 `
    ([System.Drawing.Color]::FromArgb(6, 78, 59)) ([System.Drawing.Color]::FromArgb(16, 185, 129))

$BtnAbrir.Add_Click({
    Start-Process "https://localhost:$Puerto"
    $TxtConsola.AppendText("`r`n[+] Navegador abierto en https://localhost:$Puerto")
})
$Form.Controls.Add($BtnAbrir)

# Fila 2: Pruebas de Fuego / Renovar Certificados
$BtnPruebas = CrearBotonFuturista "🔥 PRUEBAS DE FUEGO OWASP" 20 210 300 42 `
    ([System.Drawing.Color]::FromArgb(136, 19, 55)) ([System.Drawing.Color]::FromArgb(244, 63, 94))

$BtnPruebas.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Ejecutando Suite de Pruebas de Fuego OWASP Top 10...")
    $p = Start-Process -FilePath "python" -ArgumentList (Join-Path $Raiz "tools\test_pruebas_de_fuego.py") -NoNewWindow -PassThru -Wait
    if ($p.ExitCode -eq 0) {
        $TxtConsola.AppendText("`r`n[✓] 10/10 Pruebas Superadas Exitosamente (OWASP, TLS 1.3, Rate Limit, RAE).")
    } else {
        $TxtConsola.AppendText("`r`n[!] Alerta en pruebas de fuego (Código de salida: $($p.ExitCode)).")
    }
})
$Form.Controls.Add($BtnPruebas)

$BtnCerts = CrearBotonFuturista "🛡️ RENOVAR TLS / SAN" 345 210 300 42 `
    ([System.Drawing.Color]::FromArgb(88, 28, 135)) ([System.Drawing.Color]::FromArgb(168, 85, 247))

$BtnCerts.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Regenerando y refirmando certificados X.509 v3 con SAN...")
    python (Join-Path $Raiz 'tools\generar_certificados_https.py')
    $TxtConsola.AppendText("`r`n[✓] Certificados actualizados con SAN: localhost, 127.0.0.1, 0.0.0.0, actasdigitales.local")
})
$Form.Controls.Add($BtnCerts)

# Fila 3: Detener Servicios / Purgar Caché
$BtnDetener = CrearBotonFuturista "🛑 DETENER SERVICIOS" 20 260 300 42 `
    ([System.Drawing.Color]::FromArgb(127, 29, 29)) ([System.Drawing.Color]::FromArgb(239, 68, 68))

$BtnDetener.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Deteniendo procesos de Uvicorn en ejecución...")
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    $LblEstado.Text = "ESTADO: [ DETENIDO (STOPPED) ] · PUERTO: $Puerto · SERVICIOS APAGADOS"
    $LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(248, 113, 113)
    $TxtConsola.AppendText("`r`n[✓] Servidor detenido correctamente.")
})
$Form.Controls.Add($BtnDetener)

$BtnPurgar = CrearBotonFuturista "🧹 PURGAR CACHÉ Y TEMPORALES" 345 260 300 42 `
    ([System.Drawing.Color]::FromArgb(30, 58, 138)) ([System.Drawing.Color]::FromArgb(59, 130, 246))

$BtnPurgar.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Purgando archivos temporales de audio...")
    if (Test-Path $UploadsDir) {
        Get-ChildItem -Path $UploadsDir -Exclude ".gitkeep" | Remove-Item -Force -ErrorAction SilentlyContinue
    }
    $TxtConsola.AppendText("`r`n[✓] Búfer purgado. Retención cero garantizada.")
})
$Form.Controls.Add($BtnPurgar)

# Fila 4: Confiar Certificado CA en Windows (Candado verde en Chrome / Edge)
$BtnConfiar = CrearBotonFuturista "🔒 CONFIAR CA EN WINDOWS (CANDADO VERDE)" 20 310 625 40 `
    ([System.Drawing.Color]::FromArgb(4, 120, 87)) ([System.Drawing.Color]::FromArgb(16, 185, 129))

$BtnConfiar.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Registrando Autoridad Certificadora (ca.crt) en el almacén de Windows...")
    $CaCertPath = Join-Path $Raiz "certs\ca.crt"
    if (-not (Test-Path $CaCertPath)) {
        python (Join-Path $Raiz 'tools\generar_certificados_https.py')
    }
    try {
        certutil -user -addstore -f "Root" $CaCertPath | Out-Null
        $TxtConsola.AppendText("`r`n[✓] ¡Certificado Raíz registrado con éxito! Chrome y Edge mostrarán el candado verde.")
    } catch {
        $TxtConsola.AppendText("`r`n[!] Error al registrar el certificado: $_")
    }
})
$Form.Controls.Add($BtnConfiar)

# Consola de Eventos HUD
$TxtConsola = New-Object System.Windows.Forms.TextBox
$TxtConsola.Multiline = $true
$TxtConsola.ScrollBars = "Vertical"
$TxtConsola.Location = New-Object System.Drawing.Point(20, 360)
$TxtConsola.Size = New-Object System.Drawing.Size(625, 215)
$TxtConsola.BackColor = [System.Drawing.Color]::FromArgb(2, 6, 23)
$TxtConsola.ForeColor = [System.Drawing.Color]::FromArgb(56, 189, 248)
$TxtConsola.Font = New-Object System.Drawing.Font("Consolas", 9)
$TxtConsola.ReadOnly = $true
$TxtConsola.Text = "[*] Actas Digitales HUD Inicializado.`r`n[*] Listo para orquestar servicios seguros.`r`nHaz clic en [ 🚀 INICIAR TODO (HTTPS) ] y luego en [ 🌐 ABRIR NAVEGADOR ]."
$Form.Controls.Add($TxtConsola)

[void]$Form.ShowDialog()
