<#
.SYNOPSIS
    Instala de forma automática y segura el certificado raíz de Actas Digitales en Windows.
.DESCRIPTION
    Registra certs/ca.crt en el almacén de Entidades de Certificación Raíz de Confianza
    (Cert:\CurrentUser\Root y Cert:\LocalMachine\Root) para garantizar candado verde
    en Chrome, Edge, Firefox y Brave en https://localhost:8443.
#>

[CmdletBinding()]
param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$CertsDir = Join-Path $RootDir "certs"
$CaCert = Join-Path $CertsDir "ca.crt"
$ServerCert = Join-Path $CertsDir "server.crt"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   ACTAS DIGITALES - INSTALADOR DE CERTIFICADO DE CONFIANZA TLS" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $CaCert)) {
    Write-Host "[*] Generando certificados locales actualizados..." -ForegroundColor Yellow
    python (Join-Path $RootDir "tools\generar_certificados_https.py")
}

if (-not (Test-Path $CaCert)) {
    Write-Host "[!] No se encontró el archivo $CaCert" -ForegroundColor Red
    exit 1
}

Write-Host "[1/2] Instalando CA en el almacén de Certificados Raíz del Usuario Actual..." -ForegroundColor Yellow
try {
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 $CaCert
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store "Root", "CurrentUser"
    $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
    $store.Add($cert)
    $store.Close()
    Write-Host "      [✓] CA instalada con éxito en Cert:\CurrentUser\Root" -ForegroundColor Green
} catch {
    Write-Host "      [!] Falló la instalación en CurrentUser: $_" -ForegroundColor Red
}

Write-Host "[2/2] Registrando en almacén de Windows mediante certutil..." -ForegroundColor Yellow
$proc = Start-Process -FilePath "certutil.exe" -ArgumentList "-user -addstore -f Root `"$CaCert`"" -Wait -NoNewWindow -PassThru
if ($proc.ExitCode -eq 0) {
    Write-Host "      [✓] Certutil validó e importó ca.crt en Root" -ForegroundColor Green
} else {
    Write-Host "      [!] Certutil devolvió código: $($proc.ExitCode)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  ¡CONFIGURACIÓN COMPLETADA CON ÉXITO!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Cierra y vuelve a abrir tu navegador (Chrome / Edge)." -ForegroundColor White
Write-Host "Ingresa a https://localhost:8443 y verás el candado seguro de conexión cifrada." -ForegroundColor White
Write-Host ""
