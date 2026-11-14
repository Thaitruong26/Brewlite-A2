Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   ĐANG KHỞI CHẠY BREWLITE A2 (BACKEND + FRONTEND)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
docker start brewlite-a2-db 2>$null
if ($LASTEXITCODE -ne 0) {
    docker compose up -d db
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/api; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/web; npm run dev"
Write-Host "Backend A2 đang chạy tại: http://localhost:4001/api" -ForegroundColor Yellow
Write-Host "Frontend A2 đang chạy tại: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Quầy Barista A2: http://localhost:3001/barista" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
