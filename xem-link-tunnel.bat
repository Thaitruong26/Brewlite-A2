@echo off
title Lay Link Cloudflare Tunnel Dang Chay
echo ========================================================
echo DANG KIEM TRA LINK DEPLOY CLOUDFLARE HIEN TAI...
echo ========================================================
echo.
powershell -NoProfile -Command "& { try { $h = (Invoke-RestMethod -Uri 'http://127.0.0.1:20241/quicktunnel').hostname; if ($h) { $u = 'https://' + $h; Write-Host 'LINK DEPLOY HIEN TAI DANG HOAT DONG:' -ForegroundColor Green; Write-Host $u -ForegroundColor Yellow; Start-Process $u } } catch { Write-Host 'Chua bat tunnel hoac khong tim thay tunnel! Hay chay mo-tunnel.bat' -ForegroundColor Red } }"
echo.
pause
