# Task 3.2 — DEP-01 Deployment Diagram (Production Blueprint trên Render Cloud Platform)

**Trạng thái: LOCKED & APPROVED — ĐÃ CHỐT CHÍNH THỨC NỀN TẢNG RENDER CLOUD PLATFORM**.
Theo quyết định nhóm tại **O-02** và **ADR-007**, hệ thống BrewLite A2 chốt triển khai chính thức trên nền tảng **Render Cloud Platform (Singapore / Southeast Asia Region)** với mô hình Containerized Web Services và Managed PostgreSQL Database.

**Tài liệu & Diagram nguồn:**
- PlantUML Source: [deployment-production.puml](architecture/deployment-production.puml)
- Diagram SVG: [deployment-production.svg](architecture/deployment-production.svg)
- Quyết định kiến trúc liên quan: [ADR-007](architecture/adr/007-delivery-observability.md), [ADR-009](architecture/adr/009-manual-vietqr-refund.md)
- Ma trận truy vết: [traceability-matrix.md](traceability-matrix.md) (DEP-01)

---

## 1. Ba ranh giới môi trường (Environment Boundaries)

| Môi trường | Dịch vụ (Services) | Mạng & Lưu trữ (Network / Storage) | Vai trò & Mục đích |
|---|---|---|---|
| **Local Development** | Docker Compose v2 (`docker-compose.yml`):<br>- `brewlite-a2-frontend` (:3001)<br>- `brewlite-a2-backend` (:4001)<br>- `brewlite-a2-db` (Postgres 16, port ngoài 5434) | Local Docker bridge network (`pgdata-a2` named volume). Biến môi trường file `.env` nội bộ. | Phát triển tính năng, kiểm thử Unit & Concurrency E2E test, demo chức năng một chạm. |
| **CI / CD Pipeline** | **GitHub Actions** (`ci.yml`, `cd.yml`):<br>- Runner: Ubuntu Latest<br>- Buildx: Node.js 22, Oxlint, Vitest, Docker | Short-lived isolated runner. Secrets được nạp từ GitHub Actions Secrets. Push container images lên **GHCR.io**. | Tự động hóa kiểm thử hồi quy (100% pass), build Docker Image gán nhãn Git SHA (`ghcr.io/brewlite/backend:sha-<commit>`). |
| **Production (Render Singapore)** | **Frontend:** Next.js 16.4.0 (`brewlite-web-bggg.onrender.com`)<br>**Backend:** NestJS 12 / Prisma 7.10.x (`brewlite-a2-syoc.onrender.com`)<br>**Database:** Render PostgreSQL 16 | HTTPS công khai qua Render; API và web chạy Docker; database dùng Internal URL | Phục vụ khách hàng, Barista KDS, VNPay Sandbox và hoàn tiền VietQR |

---

## 2. Chi tiết cấu hình mạng, bảo mật và Ingress trên Render

### a) Ingress & TLS Termination
- **Edge Layer:** Render Managed Cloudflare Ingress tự động cấu hình và gia hạn chứng chỉ TLS 1.3 (Let's Encrypt).
- **Domain Production:**
  - Frontend: `https://brewlite-web-bggg.onrender.com`
  - Backend API & Webhook: `https://brewlite-a2-syoc.onrender.com`
- **Routing:** Mọi request từ Internet đều bắt buộc chuyển hướng HTTPS (Port 443). Lưu lượng từ Next.js Web gọi sang NestJS API thực hiện qua HTTPS URL nội bộ hoặc public API prefix `/api`.

### b) Cô lập Database & Quản trị Secrets
- **PostgreSQL Database:** Chỉ lắng nghe trên mạng nội bộ Render Private Network (`dpg-*.singapore.render.com:5432`). Không cấp quyền truy cập từ địa chỉ IP bên ngoài (Internet Deny-all).
- **Secret Store:** Biến môi trường nhạy cảm được cấu hình thông qua **Render Environment Groups**:
  - `DATABASE_URL`: Chuỗi kết nối mạng nội bộ private PostgreSQL.
  - `JWT_SECRET`: Khóa bí mật ký token xác thực người dùng.
  - `VNPAY_TMN_CODE` & `VNPAY_HASH_SECRET`: Khóa đối tác VNPay Sandbox chính thức (P0.1 Sanitization - không bao giờ commit vào Git).
  - `VNPAY_URL` & `VNPAY_RETURN_URL`: Endpoint thanh toán và callback định tuyến.

### c) Tích hợp Cổng thanh toán & Quy trình Hoàn tiền VietQR
1. **Thu tiền trực tuyến qua VNPay:**
   - Client gửi yêu cầu tạo giao dịch `POST /api/payments/vnpay/create-url`.
   - Backend ký số HMAC-SHA512 và chuyển hướng khách sang VNPay Sandbox Gateway.
   - Khi hoàn tất, VNPay gọi Webhook IPN HTTPS `https://brewlite-a2-syoc.onrender.com/api/payments/vnpay/verify` để backend xác thực chữ ký, số tiền và chuyển đơn hàng sang `PAID`.
2. **Hoàn tiền VietQR thủ công qua Barista (ADR-009):**
   - Khi đơn `PAID` bị hủy, backend ghi nhận thông tin nhận tiền của khách và đặt `Refund PENDING`.
   - Giao diện KDS Barista (`/barista`) tự động sinh mã VietQR Napas247 chuẩn chứa chính xác số tiền và số tài khoản của khách.
   - Barista quét mã bằng Mobile Banking cá nhân/quán để chuyển khoản trực tiếp, sau đó lưu bằng chứng và bấm xác nhận `PATCH /api/orders/:id/confirm-refund`. Quy trình không phụ thuộc vào API hoàn tiền tự động của ngân hàng.

---

## 3. Khả năng quan sát (Observability) & Chiến lược Triển khai

- **Healthcheck Probe:** Endpoint `GET /api/health` được cấu hình trên Render Web Service để kiểm tra tính sẵn sàng (Readiness / Liveness). Render chỉ chuyển hướng traffic sang container mới khi `/api/health` trả về HTTP 200 `{ status: "ok" }`.
- **Zero-Downtime Deployment:** Render sử dụng Health Check để đánh giá phiên bản triển khai. Khả năng cập nhật không gián đoạn phụ thuộc gói dịch vụ và cấu hình; cần kiểm chứng thực tế.
- **Rollback Strategy:** Khi có sự cố, hệ thống cho phép rollback 1-click về Docker Image tag SHA trước đó trên Dashboard của Render mà không cần build lại mã nguồn.
- **Structured Logs:** Ghi nhận log JSON kèm `correlationId`, mã đơn hàng và mã giao dịch VNPay/VietQR phục vụ việc tra soát kiểm toán (Audit Trail).

---

## 4. Truy vết thành phần triển khai (DEP-01 Traceability)

| Thành phần trong DEP-01 | Phân loại | Tài nguyên Render tương ứng | Mã nguồn / Cấu hình |
|---|---|---|---|
| **Next.js Web Service** | Frontend Container | Render Web Service (Next.js 16.4.0 (Node.js 22)) | `apps/web/Dockerfile`, `apps/web/src/` |
| **NestJS API Service** | Backend Container | Render Web Service (Modular Monolith) | `apps/api/Dockerfile`, `apps/api/src/` |
| **Managed PostgreSQL** | Database Layer | Render Managed PostgreSQL 16 (Private) | `apps/api/prisma/schema.prisma` |
| **Secret Store** | Configuration | Render Environment Groups | Dashboard Render / Secrets |
| **CI/CD & Registry** | Automation | GitHub Actions & GitHub Container Registry | `.github/workflows/ci.yml`, `cd.yml` |
| **Health Probe** | Monitoring | HTTP GET /api/health | `apps/api/src/app.controller.ts` |
| **VNPay Sandbox** | Third-party Gateway | External HTTPS Webhook Endpoint | `apps/api/src/payments/vnpay.service.ts` |
| **VietQR Napas247** | Third-party Standard | Client-side QR Generation (KDS UI) | `apps/web/src/app/barista/page.tsx` |


---

## 5. Quy trình CI/CD khép kín 5 giai đoạn (`.github/workflows/cd.yml`)

Hệ thống thiết lập đường ống CD tự động hóa hoàn toàn với 5 mắt xích liên hoàn:

```
[ Git Commit/PR Merge ]
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ 1. Docker Image Build                                  │
│    - Multi-stage build NestJS & Next.js                │
│    - Gán nhãn: :latest, :<sha>, :sha-<sha>             │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ 2. Container Registry Push (GHCR.io)                   │
│    - ghcr.io/<repo>/backend:<sha>                      │
│    - ghcr.io/<repo>/frontend:<sha>                     │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ 3. Automated Zero-Downtime Deploy (Render Webhook)     │
│    - Deploy Hook kích hoạt triển khai Web Service từ nguồn GitHub đã cấu hình                     │
│    - Render khởi tạo container mới song song           │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ 4. Post-Deployment Smoke Test (`smoke-test.sh`)        │
│    - 1. Backend Health & DB Connectivity               │
│    - 2. Product Catalog API Data                       │
│    - 3. VNPay Security Hash Guard                      │
│    - 4. Frontend UI Home Rendering                     │
│    - 5. Barista KDS Route Availability                 │
└────────────────────────────────────────────────────────┘
          │
          ├──────────────────────────┐
          ▼ (Nếu Pass 5/5)           ▼ (Nếu Thất Bại)
┌──────────────────────────┐   ┌──────────────────────────┐
│ 5a. Deploy Success       │   │ 5b. Automated Rollback   │
│ - Tag `:stable` trên GHCR│   │ - Kích hoạt Rollback Hook│
│ - Lưu vết Release Audit  │   │ - Đưa về previous SHA    │
└──────────────────────────┘   └──────────────────────────┘
```

1. **Docker Image Build:** Đóng gói độc lập Backend và Frontend bằng Docker Buildx.
2. **Registry:** Đẩy các images vào GitHub Container Registry (`ghcr.io`), lưu lại `previous_sha` của commit trước đó.
3. **Deploy:** Kích hoạt Webhook Deploy Hook của Render để bắt đầu quá trình cập nhật rolling update.
4. **Smoke Test:** Chạy bộ kiểm thử tự động `scripts/smoke-test.sh` (hoặc `scripts/smoke-test.ps1`). Nếu dịch vụ không sẵn sàng hoặc 1 trong 5 chốt chặn cốt lõi bị lỗi, script thoát với exit code `1`.
5. **Rollback:** Khi Smoke Test trả về lỗi, Job `rollback` lập tức được kích hoạt tự động: Chỉ ghi nhận rollback thành công sau khi Render xác nhận đã triển khai lại phiên bản trước, đồng thời xuất cảnh báo chi tiết lên GitHub Step Summary.
