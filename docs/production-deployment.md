# Hướng dẫn Triển Khai Production (Render Cloud Platform)

**Dự án:** BrewLite Coffee Ordering System — Assignment 2  
**Nền tảng chính thức:** **Render Cloud Platform (Singapore / Southeast Asia Region)**  
**Mô hình kiến trúc:** Containerized Micro-Monolith (Next.js 15 Standalone + NestJS 10 API + Managed PostgreSQL 16)  
**Tài liệu liên quan:** [DEP-01 Deployment Diagram](architecture/deployment-production.puml), [ADR-007](architecture/adr/007-delivery-observability.md), [render.yaml](../render.yaml)

---

## 1. Danh mục Endpoint & URL Production (HTTPS 100%)

Toàn bộ dịch vụ trên môi trường Production đều bắt buộc hoạt động trên giao thức bảo mật **HTTPS (Port 443)** với chứng chỉ số **TLS 1.3**:

| Dịch vụ / Thành phần | URL Endpoint Production | Giao thức / Port | Mục đích sử dụng |
|---|---|---|---|
| **Frontend Web App** | `https://brewlite.onrender.com` | HTTPS :443 | Ứng dụng đặt hàng cho Khách hàng (Mobile-first PWA). |
| **Barista KDS Station** | `https://brewlite.onrender.com/barista` | HTTPS :443 | Màn hình điều phối đơn hàng, nhận đơn và sinh mã Napas247 VietQR hoàn tiền. |
| **Backend API Gateway** | `https://brewlite-api.onrender.com/api` | HTTPS :443 | Cổng dịch vụ RESTful API cho toàn bộ hệ thống. |
| **Healthcheck Endpoint** | `https://brewlite-api.onrender.com/api/health` | HTTPS :443 | Giám sát trạng thái hoạt động của Backend và kết nối PostgreSQL (`{ status: "ok", db: "up" }`). |
| **Tài liệu API (Swagger)** | `https://brewlite-api.onrender.com/api/docs` | HTTPS :443 | Giao diện tra cứu và thử nghiệm toàn bộ REST API endpoint. |
| **VNPay Return URL** | `https://brewlite.onrender.com/payment/vnpay-return` | HTTPS :443 | Trang nhận điều hướng kết quả thanh toán từ cổng VNPay Sandbox. |
| **VNPay IPN Webhook** | `https://brewlite-api.onrender.com/api/payments/vnpay/verify` | HTTPS :443 | Webhook nhận thông báo thanh toán tức thì từ VNPay Sandbox (Server-to-Server). |

---

## 2. Tiêu chuẩn Bảo mật & Thiết lập HTTPS

### a) Mã hóa Đầu cuối & Chứng chỉ số TLS 1.3
* Render Ingress tích hợp Cloudflare Edge tự động kích hoạt và gia hạn chứng chỉ **SSL/TLS 1.3 (Let's Encrypt)**.
* Mọi kết nối không an toàn qua HTTP (Port 80) được tự động chuyển hướng (301 Permanent Redirect) sang HTTPS (Port 443).

### b) Cấu hình HTTP Strict Transport Security (HSTS) & Security Headers
Hệ thống cấu hình bộ header bảo mật chuẩn doanh nghiệp tại `apps/web/next.config.ts`:
* `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`: Ép buộc trình duyệt chỉ kết nối HTTPS.
* `X-Content-Type-Options: nosniff`: Ngăn chặn tấn công MIME sniffing.
* `X-Frame-Options: SAMEORIGIN`: Chống tấn công Clickjacking.
* `Referrer-Policy: strict-origin-when-cross-origin`: Bảo vệ dữ liệu nhạy cảm trong đường dẫn URL.

### c) Tin cậy Reverse Proxy (`trust proxy`)
Tại `apps/api/src/main.ts`, backend cấu hình `expressApp.set('trust proxy', 1)`. Điều này giúp:
* Đọc chính xác địa chỉ IP thực của khách hàng qua header `x-forwarded-for` (cần thiết cho tham số `vnp_IpAddr` khi gọi VNPay).
* Nhận diện chuẩn xác giao thức `https` khi client kết nối qua Cloudflare/Render Ingress.

### d) Cách ly Cơ sở dữ liệu trong Mạng nội bộ (Private VPC)
* Managed PostgreSQL 16 chạy hoàn toàn trong mạng ảo riêng (`dpg-*.singapore.render.com:5432`).
* Cổng 5432 **bị khóa 100% với Internet**, chỉ cho phép container Backend trong cùng VPC kết nối.

---

## 3. Cơ chế Healthcheck & Zero-Downtime Deployment

### a) Cấu hình Probe tại Backend API
Endpoint `GET /api/health` thực hiện kiểm tra 2 lớp:
1. **Liveness Probe:** Kiểm tra tiến trình NestJS đang phản hồi.
2. **Readiness Probe:** Thực thi câu lệnh `SELECT 1` trên PostgreSQL thật thông qua Prisma Client.

```json
// Phản hồi mẫu khi hệ thống khỏe mạnh (HTTP 200)
{
  "status": "ok",
  "db": "up"
}
```

### b) Quy trình Cập nhật Không Gián đoạn (Zero-Downtime Rolling Update)
```
[ Render nhận Webhook Deploy ]
             │
             ▼
Khởi chạy Container mới (v2) song song với Container cũ (v1)
             │
             ▼
Render gửi HTTP GET /api/health kiểm tra định kỳ mỗi 5s
             │
   ┌─────────┴─────────┐
   ▼                   ▼
(Healthcheck OK)    (Healthcheck Lỗi / Timeout)
   │                   │
Chuyển Traffic sang v2 Tắt container v2 lỗi, giữ nguyên v1
   │                   │
Tắt container v1 cũ    Kích hoạt Rollback về commit trước đó
```

### c) Dockerfile Healthcheck tích hợp
Cả hai Dockerfile (`apps/api/Dockerfile` và `apps/web/Dockerfile`) đều được trang bị chỉ thị `HEALTHCHECK`:
* Backend: Kiểm tra `wget -qO- http://localhost:4001/api/health | grep -q '"status":"ok"'`.
* Frontend: Kiểm tra `wget -qO- http://localhost:3001/ | grep -q 'BrewLite'`.

---

## 4. Hướng dẫn Khởi tạo 1-Chạm qua Blueprint (`render.yaml`)

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com/).
2. Chọn **Blueprints** -> Bấm **New Blueprint Instance**.
3. Kết nối repository GitHub `brewlite-a2`.
4. Render sẽ tự động đọc file `render.yaml` và khởi tạo trọn gói:
   - 1 Database Managed PostgreSQL (`brewlite-postgres`) tại Singapore.
   - 1 Web Service Backend (`brewlite-api`) kèm cấu hình healthcheck `/api/health`.
   - 1 Web Service Frontend (`brewlite-web`) kèm cấu hình healthcheck `/`.
5. Nhập các giá trị bí mật trên bảng điều khiển Environment Groups:
   - `VNPAY_TMN_CODE`
   - `VNPAY_HASH_SECRET`
6. Bấm **Apply**, toàn bộ hệ thống sẽ được build và khởi chạy tự động sau 3–5 phút.

