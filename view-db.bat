@echo off
echo ========================================================
echo     GIAO DIEN XEM DATABASE A2 (PRISMA STUDIO)
echo ========================================================
echo.
echo Dang mo Prisma Studio A2 tren trinh duyet tai: http://localhost:5556
echo Ban co the xem toan bo cac bang (User, Order, Payment, Product, Ingredient...)
echo.
echo Nhan Ctrl+C de tat giao dien khi xem xong.
echo ========================================================
cd /d "%~dp0apps\api"
start http://localhost:5556
npx prisma studio --port 5556
