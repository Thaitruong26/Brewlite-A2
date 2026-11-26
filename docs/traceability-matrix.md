# Ma trận truy vết — BrewLite A2 (Tasks 1–5 Hoàn chỉnh)

**Baseline:** 15/11/2026 · **Trạng thái:** Triển khai và liên kết chặt chẽ 5/5 Task (Tasks 1–5: Requirements, Modeling, Architecture, Sprint 1 MVP, Sprint 2 Delivery & Production). Toàn bộ 32 FR và 16 NFR được liên kết thông suốt một-một từ Yêu cầu (SRS) → Use-case → Sơ đồ UML → Quyết định kiến trúc (ADR) → Mã nguồn Code/API thật → Kiểm thử Test case.

| Requirement | Use-case / User Story | Design / UML | Kiến trúc / ADR | Code/API triển khai | Test case xác thực |
|---|---|---|---|---|---|
| FR-01 Xem menu | UC-01 | ACT-01;CLASS-01 | ADR-002 | `GET /products` | T-FR-01 |
| FR-02 Xem chi tiết/size/topping | UC-02 | ACT-01;CLASS-01 | ADR-002 | `GET /products/:id` | T-FR-02 |
| FR-03 Quản lý giỏ hàng | UC-03 | ACT-01 | ADR-002 | `Next.js cart state` | T-FR-03 |
| FR-04 Tính giá tại máy chủ | UC-04;UC-05 | ACT-01;SEQ-01;CLASS-01 | ADR-003 | `POST /orders` | T-FR-04 |
| FR-05 Đăng ký khách | UC-06 | ACT-01;CLASS-01 | ADR-005 | `POST /auth/register` | T-FR-05 |
| FR-06 Đăng nhập JWT | UC-06 | ACT-01;SEQ-01 | ADR-005 | `POST /auth/login` | T-FR-06 |
| FR-07 Phân quyền | UC-06;UC-13 | SEQ-01;CLASS-01 | ADR-005 | `PATCH /orders/:id/status` | T-FR-07 |
| FR-08 Kiểm tra khả dụng/đủ kho | UC-05 | ACT-01;SEQ-01;CLASS-01 | ADR-003 | `POST /orders` | T-FR-08 |
| FR-09 Tạo đơn bằng transaction | UC-05 | ACT-01;SEQ-01;CLASS-01 | ADR-003 | `POST /orders` | T-FR-09 |
| FR-10 Snapshot đơn hàng | UC-05 | SEQ-01;CLASS-01 | ADR-003 | `POST /orders` | T-FR-10 |
| FR-11 Theo dõi và lịch sử đơn | UC-12 | ACT-01;CLASS-01 | ADR-005 | `GET /orders; GET /orders/:id` | T-FR-11 |
| FR-12 Chọn phương thức thanh toán | UC-07 | ACT-01;SEQ-01 | ADR-004 | `POST /orders/:id/payments` | T-FR-12 |
| FR-13 Khởi tạo VNPay Sandbox | UC-07 | SEQ-01;CLASS-01 | ADR-004 | `POST /orders/:id/payments` | T-FR-13 |
| FR-14 Xác thực kết quả VNPay IPN | UC-08 | SEQ-01;CLASS-01 | ADR-004;ADR-005 | `GET /payments/vnpay/ipn` | T-FR-14 |
| FR-15 Ghi nhận trạng thái thanh toán | UC-08 | ACT-01;SEQ-01;CLASS-01 | ADR-004 | `GET /payments/vnpay/ipn` | T-FR-15 |
| FR-16 Chống xử lý trùng thanh toán | UC-07;UC-08 | SEQ-01;CLASS-01 | ADR-004 | `POST /orders/:id/payments; IPN` | T-FR-16 |
| FR-17 Đối soát giao dịch chưa rõ | UC-08 | SEQ-01 | ADR-004 | `GET /orders/:id/payment-status` | T-FR-17 |
| FR-18 Mock payment qua provider | UC-07 | SEQ-01 | ADR-004 | `PaymentProvider interface` | T-FR-18 |
| FR-19 Khuyến mãi | UC-04 | ACT-01;CLASS-01 | ADR-003 | `POST /orders` | T-FR-19 |
| FR-20 Điểm thưởng cơ bản | UC-14 | CLASS-01 | ADR-006 | `LoyaltyService.award() khi Payment SUCCESS / Order PAID` | T-FR-20 |
| FR-21 Dùng điểm ở checkout | UC-04;UC-10 | ACT-01;CLASS-01 | ADR-006 | `POST /orders` | T-FR-21 |
| FR-22 Chặn hủy sau khi bắt đầu pha chế | UC-09 | ACT-01;SEQ-02;CLASS-01 | ADR-006 | `POST /orders/:id/cancel` | T-FR-22 |
| FR-23 Hủy đơn chưa trả tiền | UC-09 | ACT-01;SEQ-02;CLASS-01 | ADR-003;ADR-006 | `POST /orders/:id/cancel` | T-FR-23 |
| FR-24 Hủy đơn PAID và tạo nghĩa vụ hoàn tiền | UC-10 | ACT-01;SEQ-02;CLASS-01 | ADR-006;ADR-009 | `POST /orders/:id/cancel` | T-FR-24;INT-04 |
| FR-25 Tạo VietQR cho Barista hoàn tiền | UC-10 | SEQ-02;CLASS-01 | ADR-009 | `Barista KDS VietQR UI` | T-FR-25 |
| FR-26 Barista xác nhận hoàn tiền | UC-10 | SEQ-02;CLASS-01 | ADR-009 | `PATCH /orders/:id/confirm-refund` | T-FR-26 |
| FR-27 Xử lý hoàn tiền thất bại và chống trùng | UC-09;UC-10 | SEQ-02;CLASS-01 | ADR-009 | `POST /orders/:id/cancel (Idempotent)` | T-FR-27;INT-05/08 |
| FR-28 Đối soát hoàn tiền chưa rõ kết quả | UC-10 | ACT-01;SEQ-02 | ADR-009 | `PATCH /orders/:id/confirm-refund & Audit` | T-FR-28;INT-06 |
| FR-29 Hàng đợi Barista | UC-13 | ACT-01;CLASS-01 | ADR-005 | `GET /barista/orders` | T-FR-29 |
| FR-30 State machine pha chế | UC-13 | ACT-01;CLASS-01 | ADR-006 | `PATCH /orders/:id/status` | T-FR-30 |
| FR-31 Quản lý tồn kho | UC-15 | CLASS-01 | ADR-003 | `POST /inventory/adjustments` | T-FR-31 |
| FR-32 Xác nhận trạng thái cho khách | UC-12 | ACT-01;SEQ-01 | ADR-002;ADR-004 | `GET /orders/:id` | T-FR-32 |

## Nonfunctional traceability

| Requirement | Architecture | Test / phương pháp |
|---|---|---|
| NFR-01 Hiệu năng API | ADR-002;ADR-003 | T-NFR-01: Trong môi trường thử chuẩn 30 người dùng đồng thời, GET /products p95 <= 700 ms, POST /orders p95 <= 1500 ms (không tính VNPay bên ngoài). |
| NFR-02 Khả dụng | ADR-007 | T-NFR-02: Trong đợt UAT 24h, uptime web/API >= 99%; có health check để phát hiện downtime. |
| NFR-03 Bảo mật đăng nhập | ADR-005 | T-NFR-03: Hash password bằng argon2/bcrypt; endpoint bảo vệ JWT+role; thử 401/403. |
| NFR-04 Bảo vệ VNPay | ADR-004;ADR-005 | T-NFR-04: 100% IPN/return được kiểm checksum; backend kiểm amount, merchantRef, status; không ghi secret vào log. |
| NFR-05 Nhất quán ACID | ADR-003 | T-NFR-05: Tạo đơn/giữ kho atomic; stress 10 request tranh 5 suất không phát sinh tồn kho âm. |
| NFR-06 Idempotency | ADR-004;ADR-006 | T-NFR-06: Replay payment/refund/credit 10 lần không sinh bản ghi nghiệp vụ trùng. |
| NFR-07 Khả dụng giao diện | ADR-002 | T-NFR-07: Mobile width 360–430 px không cuộn ngang; một cột và điều hướng dưới; hỗ trợ keyboard. |
| NFR-08 Khả năng deploy | ADR-001;ADR-007 | T-NFR-08: docker compose chạy web, api, DB; migration/seed và GET /health kiểm tra được. |
| NFR-09 Cấu hình/secrets | ADR-007 | T-NFR-09: Mọi secret trong env/secret store; quét git không có HashSecret, JWT secret hoặc mật khẩu DB thật. |
| NFR-10 Audit | ADR-006;ADR-007 | T-NFR-10: Log structured có correlationId cho create, IPN, cancel, refund, compensate; không log dữ liệu nhạy cảm. |
| NFR-11 Dễ bảo trì | ADR-001;ADR-004 | T-NFR-11: Module/domain tách riêng; kiểm thử unit PaymentProvider và cancellation service với fake provider. |
| NFR-12 Phục hồi dữ liệu | ADR-007 | T-NFR-12: DB production có backup hàng ngày; thử restore vào staging thành công. |
| NFR-13 Tương thích | ADR-002 | T-NFR-13: Smoke test trên Chrome Android và Safari iOS bản gần hiện hành với width 375 px. |
| NFR-14 Quan sát | ADR-007 | T-NFR-14: GET /health trả 200 khi API+DB sẵn sàng, non-2xx khi DB không sẵn sàng; có request log. |
| NFR-15 Truy vết và kiểm thử | ADR-001 | T-NFR-15: 100% FR Must có UC, diagram, planned API, test ID; validation script chạy thành công. |
| NFR-16 Thời gian phản hồi thanh toán | ADR-004 | T-NFR-16: UI hiển thị PENDING/UNKNOWN rõ ràng khi chờ kết quả; không tự báo thành công theo timeout. |

## Diagram IDs và vị trí file

| ID | Mục đích | Source | View |
|---|---|---|---|
| UC-ALL | Use case toàn hệ | [use-case-overview.puml](requirements/use-case-overview.puml) | [SVG](requirements/use-case-overview.svg) |
| UC-CHK-01 | Use case checkout | [use-case-checkout.puml](requirements/use-case-checkout.puml) | [SVG](requirements/use-case-checkout.svg) |
| ACT-01 | Activity checkout/hủy/refund | [activity-checkout.puml](diagrams/activity-checkout.puml) | [SVG](diagrams/activity-checkout.svg) |
| SEQ-01 | Tạo đơn/thanh toán/IPN | [sequence-checkout.puml](diagrams/sequence-checkout.puml) | [SVG](diagrams/sequence-checkout.svg) |
| CLASS-01 | Domain core | [class-domain.puml](diagrams/class-domain.puml) | [SVG](diagrams/class-domain.svg) |
| DEP-01 | Production deployment blueprint (Render Cloud Platform) | [deployment-production.puml](architecture/deployment-production.puml) | [SVG](architecture/deployment-production.svg) |

### Traceability chain ví dụ

`D-07 → FR-24/25/26/27/28 → UC-10 → ACT-01/SEQ-02/CLASS-01 → ADR-009 → POST /orders/:id/cancel & Barista VietQR → T-FR-24..28 + INT-04..08`.

`D-04 → FR-13..17 → UC-07/08 → SEQ-01/CLASS-01 → ADR-004 → /payments/vnpay/ipn → T-FR-13..17 + INT-02/03`.

> **Xác nhận liên kết chặt chẽ:** Hệ thống đã hoàn thành và liên kết thông suốt 5/5 Task của Assignment 2. Toàn bộ các yêu cầu nghiệp vụ đều có sơ đồ đối chiếu (Activity, Sequence, Class), quyết định kiến trúc phân lớp (Next.js, NestJS, Postgres), API xử lý thực tế và kịch bản kiểm thử tương ứng.
