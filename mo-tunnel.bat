@echo off
title Cloudflare Tunnel - BrewLite A2
echo ========================================================
echo DANG KHOI CHAY DUONG HAM CLOUDFLARE CHO BREWLITE A2
echo ========================================================
echo.
.\cloudflared.exe tunnel --url http://localhost:3001
pause

