# Task 1.1 — Bối cảnh, stakeholder và phạm vi BrewLite A2

**Mã tài liệu:** REQ-01 · **Baseline:** D-01..D-06 trong [decision-register.md](decision-register.md) · **Trạng thái:** Draft để nhóm phê duyệt.

## 1. Bối cảnh và vấn đề

Quầy cà phê phục vụ người dùng trên điện thoại; chọn size/topping, theo dõi tiến độ và kiểm soát nguyên liệu là nguồn phát sinh sai giá, quá bán và giao dịch lặp khi quy trình thủ công. A2 cần kiểm chứng quy trình **Menu → Tùy chọn → Giỏ → Đặt đơn → Thanh toán → Theo dõi** trên sản phẩm mới hoàn toàn, không dùng code A1 làm baseline. Ngoài happy path, A2 phải xử lý hoàn tiền và bù điểm khi VNPay Sandbox thất bại.

## 2. Mục tiêu và đo lường

| Goal | Mô tả | Cách chứng minh |
|---|---|---|
| G-01 | Khách đặt được đồ uống từ web mobile 1 cột | E2E-01: duyệt menu → hoàn tất đơn |
| G-02 | Checkout không sai giá, không âm kho | INT-01: transaction + race condition |
| G-03 | Thanh toán VNPay Sandbox đáng tin cậy | INT-02: IPN signature, duplicate, QueryDr |
| G-04 | Hủy đúng state machine và hoàn tiền | INT-03: PENDING, FAILED, PAID và 409 |
| G-05 | Refund confirmed FAILED được bù đủ giá trị, không trùng | INT-04: payment ledger/loyalty ledger |
| G-06 | Có pipeline và bản production kiểm chứng được | CI logs, URL HTTPS, smoke test (Task 4–5) |

## 3. Stakeholder và kỳ vọng

| Stakeholder | Mục tiêu/kỳ vọng | Tương tác | Chấp nhận bằng |
|---|---|---|---|
| Customer (khách) | Đặt nhanh, thanh toán dễ, xem đơn/cancel & được bù nếu refund thất bại | Mobile web | UC-05, UC-07..12; FR-01..27 |
| Barista (nhân viên quầy) | Hàng đợi rõ ràng, không pha đơn chưa trả hoặc đang hủy | Web nội bộ | UC-13; FR-29,30 |
| Manager (quản lý) | Giá/promo, tồn kho, đối soát tài chính minh bạch | Dashboard | UC-15; FR-19,31 |
| Lecturer/acceptance owner | Có nguồn/sơ đồ/test/CI/production truy vết được | Tài liệu, demo | NFR-15, Task 1–5 |
| Development team | Source mới có cấu trúc, rủi ro kiểm soát, kiểm thử tự động | Git PR/CI | ADR-001..008 |
| Payment provider (VNPay) | Merchant dùng signed API/IPN, request IDs đúng contract | Sandbox | UC-07/08/10; FR-13..18,24..28 |

## 4. Scope theo giai đoạn

### MVP bắt buộc / Must (Task 4–5)

- Next.js mobile-first 1 cột, menu, chi tiết, size/topping, giỏ và checkout.
- NestJS REST API, JWT, PostgreSQL + Prisma migration/seed, CRUD lõi và stock transaction.
- **VNPay Sandbox** là đường thanh toán bắt buộc; `PaymentProvider` abstraction + Mock provider để test/demo (mock không thay thế VNPay).
- Sơ đồ trạng thái đơn, Barista cập nhật PAID → PREPARING → READY → COMPLETED, lịch sử đơn.
- Promo và loyalty ledger cơ bản (tính điểm và bù điểm theo D-06); tránh double-use.
- Hủy `PENDING`, `PAYMENT_FAILED` hoàn kho/promo/điểm; hủy `PAID` yêu cầu refund trước khi finalized; refund FAILED cấp điểm bù.
- Integration/E2E, CI/CD, Docker, production HTTPS, health endpoint và documentation.

### Mở rộng / Should hoặc Could

- Dùng điểm đã tích tại checkout (Should, FR-21); inventory adjustments dashboard (Should, FR-31).
- PWA cài đặt/offline (Could, **không bắt buộc**).
- Thông báo push/realtime/WebSocket, đa chi nhánh, tích hợp hóa đơn điện tử, vận chuyển giao hàng (Could).

### Out-of-scope / Won't cho A2

- Không chuyển/cherry-pick mã nguồn A1; không bắt buộc tái dùng Prisma schema A1.
- Không xử lý tiền thật qua môi trường production VNPay; A2 chỉ bắt buộc Sandbox.
- Không lưu thông tin thẻ, số CVV; không tự xây cổng thanh toán ngân hàng.
- Không buộc cài PWA lên điện thoại; không yêu cầu native Android/iOS.
- Không thực hiện hủy đơn từ `PREPARING` trở đi.
- Không cấp điểm bù khi tình trạng refund chỉ `UNKNOWN`/timeout chưa xác nhận thất bại.

## 5. Giả định

1. Nhóm có hoặc đăng ký được credential và môi trường IPN public VNPay Sandbox.
2. Thông tin sản phẩm, giá, recipe và seed do nhóm định nghĩa; giá đồng Việt Nam dạng số nguyên.
3. Customer có email và có thể nhận token JWT; Barista/Manager có tài khoản nội bộ.
4. Payment return và IPN có thể đến nhiều lần, đến sai thứ tự hoặc đến muộn.
5. Một Order có thể có nhiều PaymentAttempt nhưng tối đa một thanh toán hợp lệ được ghi nhận là thành công.
6. Trừ/giữ kho ở bước tạo đơn; tồn kho được phục hồi đúng một lần khi hủy.
7. Tỷ lệ quy đổi `R` điểm–tiền chưa được phê duyệt, giữ thành open decision O-01 (đã giải quyết bởi D-07 hoàn tiền 100% bằng VietQR).
8. Đã chốt chính thức nền tảng Render Cloud Platform (Singapore Region) cho môi trường Production (Next.js Web Service, NestJS API Web Service, Managed PostgreSQL private network).

## 6. Ràng buộc

- Công nghệ không được thay thế: Next.js, NestJS, PostgreSQL; giao diện mobile-first.
- Tài liệu Task 1→2→3 có truy vết; Task 4/5 chỉ bắt đầu sau review baseline.
- VNPay IPN phải kiểm signature, amount, reference; external callback không đáng tin trước xác minh.
- Retry cần idempotency keyed bởi operation, request payload hash và unique constraint DB.
- State machine cancel phải tuân D-05; trạng thái đã hủy là terminal.
- Tài liệu giả định hệ thống tương lai, không tuyên bố đã có source A2, CI hay production.

## 7. Rủi ro và biện pháp

| Rủi ro | Mức | Giảm thiểu | Truy vết |
|---|---|---|---|
| Sandbox credential/IPN không dùng được | Cao | Test sớm trên staging HTTPS; Mock chỉ fallback test | O-05, FR-13/14 |
| Giao dịch redirect success nhưng IPN chưa tới | Cao | Chỉ IPN/QueryDr được chuyển PAID; UI chờ | FR-14..17 |
| Retry duplicate payment/refund/loyalty | Cao | Idempotency + unique DB + outbox | FR-16/27 |
| Timeout refund hiểu nhầm FAILED | Rất cao | UNKNOWN cần QueryDr/đối soát; không cấp điểm trước xác nhận | FR-28 |
| Bù điểm sai tỷ giá | Cao | Chốt O-01 trước implement; kiểm thử Decimal/rounding | FR-26 |
| Refund thành công muộn sau đã bù điểm | Cao | Ledger/audit + cảnh báo đối soát, tránh double benefit | FR-28 |
| Overstock khi checkout đồng thời | Cao | ACID + optimistic/pessimistic lock | FR-08/09 |
| Scope creep nếu đòi offline/native | Trung bình | PWA install là Could | D-02 |
| Mô hình deployment không khớp sản phẩm thật | Thấp | Đã chốt Render Cloud Platform (O-02), chuẩn hóa tài liệu và sơ đồ DEP-01 | Task 3.2 |

## 8. Quy tắc hoàn thành

REQ-01 liên kết [REQ-02 SRS](software-requirements-specification.md) → [UC checkout](use-case-checkout-specification.md) → [ma trận truy vết](../traceability-matrix.md). Khi nhóm đổi D-01..D-06, phải cập nhật tài liệu downstream qua pull request.
