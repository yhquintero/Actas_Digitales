@echo off
chcp 65001 >nul
title Actas Digitales · Iniciar Todo Seguro (HTTPS + Web Automática)
echo ======================================================================
echo    ACTAS DIGITALES - INICIANDO SISTEMA COMPLETO CON HTTPS Y WEB
echo ======================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\iniciar-https.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Si hubo algún error, revisa los requisitos de Python.
    pause
)
