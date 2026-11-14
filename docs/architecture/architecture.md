# Task 3.1 — Architecture Blueprint BrewLite A2

**Mã:** ARC-01 · **Kiến trúc đề xuất cho code A2 viết mới** · **Trạng thái:** Designed/NOT implemented · **Quyết định khóa:** D-01..D-06.

## 1. Phương pháp C4 + modular monolith

**C1 – Context:** Customer và Barista truy cập Next.js mobile-first, Manager quản trị; VNPay Sandbox là hệ thống ngoại vi, gửi signed IPN và nhận refund/QueryDr. Không dùng tiền thật.

**C2 – Containers:** Browser/PWA-optional → Next.js (`apps/web`) → NestJS REST API (`apps/api`) → PostgreSQL (`Prisma` migration). `PaymentProvider` là interface nội bộ NestJS, hai adapter `VNPaySandboxAdapter` (Must) và `MockPaymentAdapter` (test/demo). Đồ thị: [architecture-logical.svg](../diagrams/architecture-logical.svg).

**C3 – Components (API):**

| Module định xây | Trách nhiệm | Phụ thuộc | FR |
|---|---|---|---|
| AuthModule | JWT, roles, credentials | User DB | 05–07 |
| CatalogModule | Product/variant/topping + public GET | Product DB | 01–02 |
| CheckoutModule | Cart quote, promotions, points redemption | Catalog, Inventory, Promotion, Loyalty | 03–04,19,21 |
| OrdersModule | Order/OrderItem snapshot, state machine, history | Inventory, Payments | 08–11,22–23,29–30,32 |
| InventoryModule | Stock, recipes, reservations, audit ledger | PostgreSQL | 08–09,23,31 |
| PaymentsModule | VNPay URL/IPN/QueryDr, Mock adapter, idempotency | `PaymentProvider`, Provider external | 12–18 |
| CancellationModule | Refund state/outbox/reconciliation, CANCELLED | Orders, Payments, Loyalty | 22–28 |
| LoyaltyModule | Earn/spend/return/compensate as append-only ledger | User/Order/Refund | 20–21,26–27 |
| HealthModule | readiness/liveness, structured logs | DB, logger | NFR-10,14 |

## 2. Các nguyên tắc thiết kế quan trọng

1. **Server authority:** Giá và tổng tiền trên backend, integer VND; snapshot line-items khi tạo đơn, không tin client total.
2. **Transaction boundary:** Postgres transaction đảm bảo đặt đơn/giữ nguyên liệu/promo/point reserve atomic, optimistic row version hoặc `SELECT ... FOR UPDATE` phù hợp cho inventory. External VNPay I/O không nằm trong transaction DB dài.
3. **State machine độc lập:** Order, PaymentAttempt, Refund, CancellationRequest độc lập; chỉ service/domain method mới đổi state và kiểm 409.
4. **Idempotency:** uniqueness `(operation, idempotencyKey, principal)`, payloadHash; các callback provider định danh bằng providerTxnRef; `LoyaltyTransaction` compensation uniqueness theo `originRefundId`.
5. **Webhook security:** VNPay IPN phải xác minh signature/merchant/amount/txnRef; dùng replay-safe transaction. ReturnUrl chỉ hiển thị và poll status. QueryDr khi trạng thái chưa rõ.
6. **Refund failure:** `Refund.FAILED` xác nhận → cancel + credit bù trong transaction; `UNKNOWN`/timeout → chờ đối soát, không bù. Chặn Barista khi cancellation pending.
7. **Reconciliation:** Trường hợp provider kết quả muộn/collision phải có audit flag/manual process để tránh hai lợi ích cùng tồn tại.
8. **Domain-driven organization:** Module không query bảng của nhau vô tội vạ, service APIs cho domain contracts; adapter VNPay nằm ranh giới infrastructure.

## 3. PaymentProvider contract (dự kiến)

```ts
interface PaymentProvider {
  createPaymentIntent(input: {
    orderId: string; amountVnd: number; transactionRef: string;
    returnUrl: string; ipnUrl: string;
  }): Promise<{ redirectUrl?: string; providerTxnRef: string }>;
  verifyNotification(raw: Record<string, string>): Promise<VerifiedNotification>;
  queryPayment(ref: string): Promise<PaymentResolution>;
  refund(input: { paymentRef: string; amountVnd: number; requestId: string }): Promise<RefundResolution>;
  queryRefund(requestId: string): Promise<RefundResolution>; // nếu provider không hỗ trợ trực tiếp, dùng đối soát hỗ trợ
}
```

**Lưu ý:** Interface ở mức dự kiến, không khẳng định VNPay có API queryRefund riêng biệt; adapter có thể kết hợp API QueryDr và nghiệp vụ đối soát tùy contract thực tế. Không đưa Mock vào production public.

## 4. Dữ liệu và migration

- **PostgreSQL** là source of truth; Prisma schema mới được thiết kế theo [CLASS-01](../diagrams/class-domain.puml) và [CLASS-02](../diagrams/class-inventory.puml), có migration/seed đi cùng PR code.
- Money = integer VND (`BigInt` hoặc `Int` với giới hạn an toàn; quyết định khi implement). VNPay dùng `amount * 100` ở boundary adapter. Số điểm ledger dùng `Decimal`; `R` chưa chốt (O-01).
- Bảng/unique: `PaymentAttempt(unique(operation,key,actor))`, `PaymentAttempt.unique(providerTxnRef)`, `Refund.unique(providerRequestId)`, `CancellationRequest.unique(orderId active)`, `LoyaltyTransaction.unique(originRefundId,type)` (partial unique nếu dùng postgres constraint SQL), `InventoryReservation.unique(orderId,ingredientId,source)`.
- `OutboxEvent` khuyến nghị cho việc gọi/tái xử lý refund và reconcile; chống side effect được gửi trước commit. Không giữ lock DB qua HTTP tới VNPay.

## 5. API dự kiến (chưa có source)

| API | Auth | Mục đích | FR |
|---|---|---|---|
| GET /products; GET /products/:id | public | menu/chi tiết | 01/02 |
| POST /auth/register; POST /auth/login | public | tài khoản/JWT | 05/06 |
| POST /orders | Customer | create transactional + stock reserve | 04,08–10,19,21 |
| GET /orders; GET /orders/:id | owner | tracking/history | 11,32 |
| POST /orders/:id/payments | owner | VNPay URL/Mock, idempotency | 12,13,16,18 |
| GET /payments/vnpay/ipn | signed by provider | authoritative payment processing | 14/15/17 |
| GET /payments/vnpay/return | public display | redirect only, no PAID mutation | 17 |
| POST /orders/:id/cancel | owner | cancellation / refund / compensation | 22–28 |
| GET /barista/orders; PATCH /orders/:id/status | Barista | handling queue/status | 29,30 |
| POST /inventory/adjustments | Manager | inventory audit adjustments | 31 |
| GET /health | public internal probing | readiness | NFR-14 |

**HTTP 409** cho transition không hợp lệ. API contract/DTO sẽ chuẩn hóa khi code. Cancellation refunds có thể trả **202 Accepted** khi đang refund/reconcile để tránh timeout request và mô tả `CancellationRequest` status.

## 6. Logging, health, configuration

- Pino hoặc NestJS Logger structured: correlationId, orderId, paymentRef, refundId, event/outcome; KHÔNG log secret/hash/PII thanh toán.
- `GET /health` trả readiness DB và build version (không lộ env); logs gồm IPN failures, retries, refund reconciliation, back-office alert.
- `.env.example` tên biến: DATABASE_URL, JWT_SECRET, VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_PAY_URL, VNPAY_RETURN_URL, VNPAY_IPN_URL, PAYMENT_PROVIDER, LOYALTY_VND_PER_POINT, NEXT_PUBLIC_API_BASE_URL. Secret chỉ CI/platform secret store, không commit giá trị.
- Edge HTTPS, secure cookies/authorization headers, CORS allowlist, schema DTO validation, prepared ORM queries.

## 7. Phân rã source A2 dự kiến

```text
apps/
  web/                 # Next.js 1-column, bottom nav, status pages
  api/src/modules/
    auth/ catalog/ checkout/ orders/ inventory/ promotions/
    payments/{domain,providers/vnpay,providers/mock}/
    cancellation/ loyalty/ health/
  api/prisma/          # schema.prisma, migrations/, seed.ts
docs/requirements/     # Task 1
docs/diagrams/         # Task 2
docs/architecture/adr/ # Task 3
tests/                 # unit, integration, e2e
.github/workflows/     # ci.yml, cd.yml
```

## 8. Lý do, ưu điểm, hạn chế và trade-offs

| Lựa chọn | Ưu điểm | Hạn chế/cost | Giảm thiểu |
|---|---|---|---|
| Monorepo + modular monolith | Dễ học/demo, deploy nhanh, transaction đơn giản | Scale theo module khó hơn microservice | API nội bộ qua interface, không coupling DB tùy tiện |
| Next.js mobile-first | Trải nghiệm trên điện thoại, code UI nhanh | SSR phụ thuộc web service | giữ client state và API rõ ràng |
| Postgres ACID + Prisma | Tránh kho âm/idempotency DB | lock contention, migration risk | retry transaction, index + migration test |
| VNPay Sandbox + PaymentProvider | Bám yêu cầu bắt buộc, test mock deterministic | Callback/timeout/refund phức tạp | audit, querydr, outbox, retry safe |
| Loyalty compensation | Giữ quyền lợi khi refund thất bại | Cần tỷ giá, late success risk | O-01, reconciliation, immutable ledger |
| Managed deployment proposed | Ít quản trị | lock-in, cấu hình phải khớp thực tế | O-02 pending, IaC/README |

## 9. ADR & truy vết

ADR-001..ADR-008 ở [adr/](adr/); [DEP-01](../deployment.md) mô tả proposed deployment. Diagram source [architecture-logical.puml](../diagrams/architecture-logical.puml). Ma trận tổng [traceability-matrix.md](../traceability-matrix.md). **Không có production đã deploy hoặc source A2 được tạo ở giai đoạn Task 1–3.**

## 10. Đồng nhất trạng thái và danh mục ADR

Thứ tự pha chế duy nhất: `PAID -> PREPARING -> READY -> COMPLETED`. Khi CancellationRequest đang chờ refund, bước `PAID -> PREPARING` bị chặn; từ `PREPARING` trở đi không được hủy (HTTP 409).

| ADR | Chủ đề |
|---|---|
| ADR-001 | Repo A2 viết mới + monorepo |
| ADR-002 | Next.js mobile-first, PWA optional |
| ADR-003 | PostgreSQL + Prisma, transaction + inventory |
| ADR-004 | VNPay Sandbox qua PaymentProvider |
| ADR-005 | JWT + RBAC security |
| ADR-006 | Cancel/refund/loyalty compensation |
| ADR-007 | CI/CD + health/log/secrets/deploy |
| ADR-008 | Promo/loyalty ledger |
