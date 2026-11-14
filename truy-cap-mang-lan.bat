@echo off
title Truy cap BrewLite qua mang noi bo Wi-Fi (0ms Delay)
chcp 65001 >nul
cls
echo ========================================================================
echo        BREWLITE - TRUY CẬP TRỰC TIẾP QUA MẠNG WI-FI NỘI BỘ (0ms)
echo ========================================================================
echo.
echo [!] Bạn và Điện thoại chỉ cần kết nối cùng 1 mạng Wi-Fi.
echo.

powershell -NoProfile -Command "& {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'vEthernet|Loopback|Docker' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1).IPAddress;
    if ($ip) {
        $url = 'http://' + $ip + ':3001';
        $baristaUrl = $url + '/barista';
        Write-Host '------------------------------------------------------------------------' -ForegroundColor Cyan;
        Write-Host ' ĐIỆN THOẠI QUÉT HOẶC MỞ LINK DƯỚI ĐÂY (KHÔNG ĐỘ TRỄ):' -ForegroundColor Green;
        Write-Host ' 👉 Khách hàng: ' -NoNewline -ForegroundColor Yellow; Write-Host $url -ForegroundColor White;
        Write-Host ' 👉 Quầy Barista: ' -NoNewline -ForegroundColor Yellow; Write-Host $baristaUrl -ForegroundColor White;
        Write-Host '------------------------------------------------------------------------' -ForegroundColor Cyan;
        Write-Host '';
        Write-Host 'Đang mở trình duyệt máy tính tới: ' -NoNewline; Write-Host $url -ForegroundColor Green;
        Start-Process $url;
    } else {
        Write-Host 'Không tìm thấy địa chỉ IP Wi-Fi! Vui lòng kiểm tra lại mạng.' -ForegroundColor Red;
    }
}"

echo.
echo ========================================================================
echo Nhấn phím bất kỳ để đóng cửa sổ này...
pause >nul

