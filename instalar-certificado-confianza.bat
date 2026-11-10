@echo off
chcp 65001 >nul
title Actas Digitales · Instalar Certificado de Confianza TLS en Windows
echo ======================================================================
echo    ACTAS DIGITALES - INSTALADOR DE CERTIFICADO DE CONFIANZA RAÍZ (CA)
echo ======================================================================
echo.
echo Este asistente instala el certificado de la Autoridad Raíz (ca.crt)
echo en el almacén de "Entidades de certificación raíz de confianza" de Windows.
echo.
echo Esto soluciona de forma definitiva el aviso:
echo    "Su conexión no es privada (NET::ERR_CERT_AUTHORITY_INVALID)"
echo en Google Chrome, Microsoft Edge, Mozilla Firefox y Brave,
echo activando el candado de seguridad verde en https://localhost:8443
echo.

set "CA_CERT=%~dp0certs\ca.crt"

if not exist "%CA_CERT%" (
    echo [*] Generando certificados TLS 1.3 primero...
    python "%~dp0tools\generar_certificados_https.py"
)

echo [*] Registrando certificado raíz en el almacén de usuario de Windows...
certutil -user -addstore -f "Root" "%CA_CERT%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo  [✓] ¡CERTIFICADO INSTALADO CON ÉXITO!
    echo ======================================================================
    echo Ahora puedes acceder con total seguridad a:
    echo    https://localhost:8443
    echo    https://127.0.0.1:8443
    echo El navegador mostrará la conexión como segura y privada.
) else (
    echo.
    echo [!] Solicitando permisos de administrador para instalar a nivel de máquina...
    powershell -Command "Start-Process certutil -ArgumentList '-addstore -f Root \"%CA_CERT%\"' -Verb RunAs"
)

echo.
pause
