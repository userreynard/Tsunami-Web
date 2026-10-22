@echo off
title Portal Tsunami Indonesia
color 0B

echo ========================================================
echo    PORTAL INFORMASI & MONITORING TSUNAMI INDONESIA
echo ========================================================
echo.
echo Menjalankan local server dan membuka browser...
echo.

node local-server.js
if %errorlevel% neq 0 (
    echo.
    echo Node server tidak dapat dijalankan, membuka index.html langsung...
    start "" "%~dp0index.html"
)

pause
