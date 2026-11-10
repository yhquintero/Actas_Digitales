@echo off
chcp 65001 >nul
title Actas Digitales · Asistente de Clonado Seguro y Búfer Git
echo ==========================================================
echo    ACTAS DIGITALES - SOLUCIÓN DE CLONADO Y CONFIGURACIÓN
echo ==========================================================
echo.
echo [1/3] Optimizando búfer HTTP de Git para descargas seguras...
git config --global http.postBuffer 524288000
git config --global http.maxRequestBuffer 100M
git config --global core.compression 0

echo.
echo [2/3] Descargando Actas Digitales con clonación optimizada...
if exist "Actas_Digitales\.git" (
    echo Ya existe la carpeta Actas_Digitales. Actualizando...
    cd Actas_Digitales
    git pull origin main
) else (
    git clone --depth 1 https://github.com/yhquintero/Actas_Digitales.git
    cd Actas_Digitales
)

echo.
echo [3/3] ¡Repositorio listo!
echo Para vincularlo con GitHub Desktop:
echo    1. Abre GitHub Desktop.
echo    2. Menú Archivo (File) ^> Añadir repositorio local (Add Local Repository).
echo    3. Selecciona la carpeta donde se descargó Actas_Digitales.
echo.
echo Iniciando el Panel de Control Futurista...
start "" "iniciar-panel.bat"
pause
