# Task 3.2 — DEP-01 Deployment Diagram (production blueprint)

**Trạng thái: PROPOSED, CHƯA TRIỂN KHAI / CHƯA CHỐT NỀN TẢNG**. Đề yêu cầu sơ đồ phản ánh **nền tảng triển khai thực tế**; nhóm chưa cung cấp nền tảng. Vì vậy DEP-01 trình bày **phương án Render**, phải cập nhật (hoặc thay bằng provider thực) khi O-02 được duyệt và có URL production. Không tuyên bố đã hoàn thành nghiệm thu triển khai thực tế.

**Nguồn:** [deployment-production.puml](diagrams/deployment-production.puml) · [SVG](diagrams/deployment-production.svg) · ADR-007.

## 1. Ba ranh giới môi trường

| Environment | Services | Network / storage | Vai trò |
|---|---|---|---|
| Local | Docker Compose: web, api, db | Web:3000 API:3001; DB:5432 (local only); named volume | Development + unit/integration |
| CI | GitHub Actions + GHCR | short-lived runner, secrets, image SHA tag | install → lint → test → build → push image |
| Production *đề xuất Render* | Next.js Web Service, NestJS API Web Service, managed PostgreSQL | public HTTPS 443; internal DB TCP 5432; persistent managed storage | Serve app, payment IPN/refund, health/log |

## 2. Network / secrets / health

- Customer device và Barista web qua HTTPS. Next.js gọi NestJS `/api` qua HTTPS; nếu server-to-server sử dụng private address, CORS/CSRF/cookie policy phải phù hợp.
- IPN URL phải public HTTPS để VNPay gọi tới NestJS; backend cũng gọi VNPay Sandbox HTTPS 443 (pay URL, QueryDr/refund).
- DATABASE_URL chỉ có quyền API; PostgreSQL **không public** ra internet. JWT_SECRET và VNPAY_HASH_SECRET tồn tại ở secret store, không viết trong image/CI logs.
- `/health` trả readiness API/DB; CI/CD post-deploy smoke test. Structured log cho payment/refund và correlationId, retention do nền tảng quyết định.
- Migration chạy theo bước an toàn trước switch traffic; DB backup, rollback image theo SHA/release nếu smoke fail; migration rollback phải có kế hoạch riêng, không được chạy ngược tùy tiện.

## 3. Traceability to planned source, not existing code

| Node trong DEP-01 | Thành phần ARC-01 | Vị trí mã nguồn **dự kiến** |
|---|---|---|
| Browser/PWA optional | Next.js UI | `apps/web/` |
| Next.js Web Service | Next.js UI | `apps/web/`, Dockerfile web |
| NestJS API Web Service | API modular monolith | `apps/api/`, Dockerfile api |
| PostgreSQL | Data layer | `apps/api/prisma/schema.prisma`, migrations |
| VNPay Sandbox | External provider | `apps/api/src/modules/payments/providers/vnpay/` |
| GitHub Actions CI/CD | Build/deploy | `.github/workflows/ci.yml`, `cd.yml` |
| GHCR | Container registry | image tags `sha-<commit>` |
| Logs/health | Observability | `apps/api/src/modules/health/` |

## 4. Chứng cứ còn thiếu để nghiệm thu Task 3.2/5

- [ ] Chốt O-02: nền tảng Render hay nền tảng khác.
- [ ] Xác nhận đường đi CDN/ingress thực tế, IPN public URL, port/internal hostname, DB persistence và registry compatibility.
- [ ] Có source A2 thực tế ở vị trí được thiết kế, chạy migration/seed.
- [ ] Có URL front/API production HTTPS + GET /health.
- [ ] Có log deploy, smoke test, backup, rollback và CI/CD secret config.

Khi chốt nền tảng, giữ ID DEP-01 nhưng cập nhật hình, file nguồn và bản ghi ADR-007 trong cùng PR; không để deployment diagram lý thuyết khác cấu hình triển khai.
