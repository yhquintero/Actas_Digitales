@echo off
chcp 65001 >nul
title Actas Digitales · Purga Total de Cache y Service Workers
echo ==========================================================
echo    ACTAS DIGITALES - PURGA TOTAL DE CACHE Y NAVEGADOR
echo ==========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\purgar-cache.ps1"
pause
