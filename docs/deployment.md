# Hướng dẫn và Mô hình Triển khai (Deployment Guide) – BrewLite

## 1. Môi trường phát triển Local (Docker Compose)
Dịch vụ được định nghĩa trong `docker-compose.yml`:
- **Frontend (apps/web):** Next.js PWA, chạy tại cổng `3000` (http://localhost:3000)
- **Backend (apps/api):** NestJS REST API, chạy tại cổng `4000` (http://localhost:4000/api)
- **Database:** PostgreSQL 16, chạy tại cổng `5433` (Database: `brewlite`)

### Lệnh chạy nhanh:
```bash
# Khởi động toàn bộ dịch vụ
docker compose up --build -d

# Xem log
docker compose logs -f

# Dừng hệ thống
docker compose down
```

## 2. Đường ống Tích hợp & Triển khai liên tục (CI/CD Pipeline)
- **CI Pipeline (`.github/workflows/ci.yml`):**
  - Chạy khi mở PR hoặc Push vào `develop`, `main`.
  - Kiểm tra độc lập cả `apps/api` (lint, unit tests, E2E tests, build) và `apps/web` (lint, build).
  - Kiểm tra tính toàn vẹn của Docker Compose config & build.
- **CD Pipeline (`.github/workflows/cd.yml`):**
  - Kích hoạt khi có commit merge vào nhánh `main`.
  - Tự động đóng gói và đẩy container image lên GitHub Container Registry (GHCR).

## 3. Triển khai Production (Task 5)
- **Mục tiêu:** Cung cấp URL production hoạt động ổn định có HTTPS.
- **Health Check Endpoint:** `GET /health` (hoặc `GET /api/products`).
- **Bảo mật:** Biến môi trường và thông tin đăng nhập DB được cấu hình an toàn qua GitHub Secrets / Environment Variables của hosting provider.
