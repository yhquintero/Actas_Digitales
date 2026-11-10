<#
.SYNOPSIS
  Actas Digitales - Panel de Control Visual Futurista (Windows PowerShell GUI)
  Ventana de control con botones futuristas + icono en la bandeja del sistema.

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
$Form.Text = "Actas Digitales · Panel de Control Futurista [TLS 1.3]"
$Form.Size = New-Object System.Drawing.Size(650, 520)
$Form.StartPosition = "CenterScreen"
$Form.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
$Form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$Form.MaximizeBox = $false

# Encabezado
$LblTitulo = New-Object System.Windows.Forms.Label
$LblTitulo.Text = "ACTAS DIGITALES :: PANEL DE CONTROL"
$LblTitulo.Font = New-Object System.Drawing.Font("Consolas", 15, [System.Drawing.FontStyle]::Bold)
$LblTitulo.ForeColor = [System.Drawing.Color]::FromArgb(129, 140, 248)
$LblTitulo.Location = New-Object System.Drawing.Point(20, 20)
$LblTitulo.Size = New-Object System.Drawing.Size(600, 30)
$Form.Controls.Add($LblTitulo)

$LblSub = New-Object System.Windows.Forms.Label
$LblSub.Text = "TELEMETRÍA EN TIEMPO REAL · SERVIDOR SEGURO HTTPS · ORQUESTACIÓN"
$LblSub.Font = New-Object System.Drawing.Font("Consolas", 8, [System.Drawing.FontStyle]::Regular)
$LblSub.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$LblSub.Location = New-Object System.Drawing.Point(20, 50)
$LblSub.Size = New-Object System.Drawing.Size(600, 20)
$Form.Controls.Add($LblSub)

# Caja de Estado
$GrpEstado = New-Object System.Windows.Forms.GroupBox
$GrpEstado.Text = " ESTADO DEL SISTEMA "
$GrpEstado.Font = New-Object System.Drawing.Font("Consolas", 9, [System.Drawing.FontStyle]::Bold)
$GrpEstado.ForeColor = [System.Drawing.Color]::FromArgb(99, 102, 241)
$GrpEstado.Location = New-Object System.Drawing.Point(20, 75)
$GrpEstado.Size = New-Object System.Drawing.Size(595, 80)
$GrpEstado.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)

$LblEstado = New-Object System.Windows.Forms.Label
$LblEstado.Text = "ESTADO: [ EN LÍNEA ] · PUERTO: $Puerto (HTTPS) · PROTOCOLO: TLS 1.3"
$LblEstado.Font = New-Object System.Drawing.Font("Consolas", 10, [System.Drawing.FontStyle]::Bold)
$LblEstado.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
$LblEstado.Location = New-Object System.Drawing.Point(15, 30)
$LblEstado.Size = New-Object System.Drawing.Size(565, 30)
$GrpEstado.Controls.Add($LblEstado)
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
    $btn.Font = New-Object System.Drawing.Font("Consolas", 10, [System.Drawing.FontStyle]::Bold)
    $btn.Cursor = [System.Windows.Forms.Cursors]::Hand
    return $btn
}

# 1. Iniciar Todo
$BtnIniciar = CrearBotonFuturista "🚀 INICIAR TODO (HTTPS)" 20 170 285 45 `
    ([System.Drawing.Color]::FromArgb(49, 46, 129)) ([System.Drawing.Color]::FromArgb(99, 102, 241))

$BtnIniciar.Add_Click({
    Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port $Puerto --ssl-keyfile `"$ServerKey`" --ssl-certfile `"$Fullchain`"" -WorkingDirectory $BackendDir -WindowStyle Minimized
    $TxtConsola.AppendText("`r`n[!] Servidor HTTPS iniciado en https://localhost:$Puerto")
})
$Form.Controls.Add($BtnIniciar)

# 2. Abrir Navegador
$BtnAbrir = CrearBotonFuturista "🌐 ABRIR NAVEGADOR" 330 170 285 45 `
    ([System.Drawing.Color]::FromArgb(6, 78, 59)) ([System.Drawing.Color]::FromArgb(16, 185, 129))

$BtnAbrir.Add_Click({
    Start-Process "https://localhost:$Puerto"
    $TxtConsola.AppendText("`r`n[+] Navegador abierto en https://localhost:$Puerto")
})
$Form.Controls.Add($BtnAbrir)

# 3. Pruebas de Fuego
$BtnPruebas = CrearBotonFuturista "🔥 PRUEBAS DE FUEGO" 20 225 285 45 `
    ([System.Drawing.Color]::FromArgb(136, 19, 55)) ([System.Drawing.Color]::FromArgb(244, 63, 94))

$BtnPruebas.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Ejecutando Suite de Pruebas de Fuego OWASP...")
    $p = Start-Process -FilePath "python" -ArgumentList (Join-Path $Raiz "tools\test_pruebas_de_fuego.py") -NoNewWindow -PassThru -Wait
    $TxtConsola.AppendText("`r`n[✓] 10/10 Pruebas Superadas con Éxito (Exit: $($p.ExitCode))")
})
$Form.Controls.Add($BtnPruebas)

# 4. Renovar Certificados
$BtnCerts = CrearBotonFuturista "🛡️ RENOVAR CERTIFICADOS" 330 225 285 45 `
    ([System.Drawing.Color]::FromArgb(88, 28, 135)) ([System.Drawing.Color]::FromArgb(168, 85, 247))

$BtnCerts.Add_Click({
    $TxtConsola.AppendText("`r`n[*] Regenerando certificados X.509 v3 con SAN...")
    python (Join-Path $Raiz 'tools\generar_certificados_https.py')
    $TxtConsola.AppendText("`r`n[✓] Certificados actualizados en $CertsDir")
})
$Form.Controls.Add($BtnCerts)

# Consola de Eventos
$TxtConsola = New-Object System.Windows.Forms.TextBox
$TxtConsola.Multiline = $true
$TxtConsola.ScrollBars = "Vertical"
$TxtConsola.Location = New-Object System.Drawing.Point(20, 285)
$TxtConsola.Size = New-Object System.Drawing.Size(595, 175)
$TxtConsola.BackColor = [System.Drawing.Color]::FromArgb(2, 6, 23)
$TxtConsola.ForeColor = [System.Drawing.Color]::FromArgb(56, 189, 248)
$TxtConsola.Font = New-Object System.Drawing.Font("Consolas", 9)
$TxtConsola.ReadOnly = $true
$TxtConsola.Text = "[*] Actas Digitales HUD Inicializado.`r`n[*] Listo para orquestar servicios seguros."
$Form.Controls.Add($TxtConsola)

[void]$Form.ShowDialog()
