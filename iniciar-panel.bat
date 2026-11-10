@echo off
chcp 65001 >nul
title Actas Digitales · Panel de Control Futurista
echo ==========================================================
echo    ACTAS DIGITALES - INICIANDO PANEL DE CONTROL HUD
echo ==========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\panel-control.ps1"
pause
