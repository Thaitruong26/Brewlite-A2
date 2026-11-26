# ADR-007 — Docker, CI/CD, Observability, Secrets và Triển Khai Render Cloud Platform

- **Trạng thái:** LOCKED & APPROVED — Đã chốt chính thức nền tảng Render Cloud Platform
- **Ngày:** 2026-11-15
- **Liên quan:** FR-32; NFR-02/08/09/10/12/14; O-02; DEP-01; Task 3.2

## Bối cảnh
Yêu cầu đồ án cần một kiến trúc triển khai thực tế có phân định rõ 3 ranh giới môi trường: Local development, CI/CD automated pipeline, và Production hosting có khả năng phục vụ người dùng thực tế với kết nối Internet HTTPS an toàn cho cả Webhook IPN của VNPay và KDS Barista quét VietQR.

## Quyết định
1. **Môi trường Local:** Sử dụng Docker Compose (`docker-compose.yml`) đóng gói 3 container (PostgreSQL 16, NestJS Backend, Next.js Frontend) cho phép kiểm thử và khởi chạy một chạm (`docker compose up --build`).
2. **Môi trường CI/CD:** GitHub Actions (`ci.yml`, `cd.yml`) tự động thực hiện lint, unit test, e2e concurrency test, build và đóng gói Docker image với nhãn Git SHA đẩy lên GitHub Container Registry (`ghcr.io`).
3. **Nền tảng Production:** **Render Cloud Platform (Singapore / Southeast Asia Region)**:
   - **Frontend:** Render Web Service (Next.js 16.4.0, Docker, Node.js 22, Port 3001, domain `brewlite-web-bggg.onrender.com`).
   - **Backend:** Render Web Service (NestJS 12 Modular Monolith (Prisma 7.10.x), Port 4001, domain `brewlite-a2-syoc.onrender.com`).
   - **Database:** Render Managed PostgreSQL 16 trong Private Virtual Network (`dpg-*.singapore.render.com:5432`), không expose ra Internet.
   - **Ingress:** Render Cloudflare Ingress tự động cấu hình TLS 1.3 / HTTPS :443.
   - **Secret Store:** Quản lý tập trung qua Render Environment Groups.
   - **Observability:** Healthcheck probe `GET /api/health` hỗ trợ đánh giá tính sẵn sàng khi triển khai; không tự bảo đảm zero-downtime.

## Hệ quả tích cực
- Môi trường triển khai thực tế, độ trễ thấp tối ưu cho thị trường Việt Nam (Singapore Region).
- Không cần quản trị máy chủ hạ tầng vật lý (PaaS/Managed Serverless Container).
- Cô lập database hoàn toàn trong mạng nội bộ private VPC.
- Khả năng rollback 1 chạm theo Docker Image tag SHA.

## Hạn chế / Trade-off
- Cần theo dõi chi phí và hạn mức sử dụng băng thông trên Render.
- Phụ thuộc vào kết nối mạng ngoài giữa Render và cổng thanh toán VNPay Sandbox.

## Truy vết
- [Deployment Specification (DEP-01)](../../deployment.md)
- [Deployment Diagram PUML](../deployment-production.puml)
- [Ma trận truy vết](../../traceability-matrix.md)
