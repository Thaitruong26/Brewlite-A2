# Task 1.2 — Software Requirements Specification (SRS) rút gọn

**Mã:** REQ-02 · **Hệ:** BrewLite A2 (source mới) · **Baseline:** [D-01..D-06](decision-register.md) · **Kỳ vọng:** Viết trước code.

## 1. Phạm vi, nguồn và ưu tiên

Nguồn: Quyết định của nhóm 14/11/2026 + Assignment2-BrewLite. `Must` = điều kiện nghiệm thu MVP, `Should` = làm nếu đủ thời gian, `Could` = tùy chọn, `Won't` = loại trừ. Đặc biệt VNPay Sandbox, refund bù điểm và idempotency là **Must** (không phải mock-only).

### Ví dụ áp dụng đủ bốn mức MoSCoW

| Mức | Phạm vi | Ví dụ |
|---|---|---|
| Must | Không thể nghiệm thu MVP nếu thiếu | VNPay Sandbox, cancellation/refund/compensation, menu/checkout, CI |
| Should | Ưu tiên khi đạt Must | Dùng điểm tích lũy ở checkout, UI quản lý kho |
| Could | Mở rộng không ảnh hưởng nghiệm thu MVP | Cài PWA/offline, push notifications, WebSocket |
| Won't | Không làm trong Assignment 2 | Native app, cổng ngân hàng tự viết, lưu dữ liệu thẻ, hủy sau PREPARING |

## 2. Functional requirements (FR)

| ID | Yêu cầu | MoSCoW | Acceptance criteria đo/kiểm được | Use case |
|---|---|---|---|---|
| FR-01 | Xem menu | Must | GET /products trả danh sách món đang bán; UI thể hiện loading/empty/error | UC-01 |
| FR-02 | Xem chi tiết/size/topping | Must | GET /products/:id trả size, topping hợp lệ; lựa chọn sai bị từ chối | UC-02 |
| FR-03 | Quản lý giỏ hàng | Must | Thêm/sửa/xóa item và tính tổng tạm; giỏ rỗng không thể checkout | UC-03 |
| FR-04 | Tính giá tại máy chủ | Must | Tổng order tính từ giá/size/topping/promo/điểm trên DB; sửa total phía client không đổi số tiền | UC-04;UC-05 |
| FR-05 | Đăng ký khách | Must | Email hợp lệ/không trùng mới tạo User; mật khẩu lưu hash | UC-06 |
| FR-06 | Đăng nhập JWT | Must | Đúng credential nhận JWT; hết hạn/sai credential không truy cập checkout | UC-06 |
| FR-07 | Phân quyền | Must | Customer không được cập nhật trạng thái pha chế/quản trị; HTTP 403 | UC-06;UC-13 |
| FR-08 | Kiểm tra khả dụng/đủ kho | Must | Món không bán/hết nguyên liệu bị từ chối; kho không âm khi 10 checkout đồng thời | UC-05 |
| FR-09 | Tạo đơn bằng transaction | Must | Đơn + các item + giữ kho được commit cùng nhau hoặc rollback toàn bộ | UC-05 |
| FR-10 | Snapshot đơn hàng | Must | Sửa giá sau khi đặt không đổi item/total của đơn đã tạo | UC-05 |
| FR-11 | Theo dõi và lịch sử đơn | Must | Customer chỉ xem đơn của mình, gồm trạng thái/thanh toán/lịch sử | UC-12 |
| FR-12 | Chọn phương thức thanh toán | Must | Checkout cho chọn VNPay sandbox hoặc Mock (chỉ ở môi trường cho phép) | UC-07 |
| FR-13 | Khởi tạo VNPay Sandbox | Must | Backend sinh URL thanh toán hợp lệ, signed, đúng số tiền ×100 và txnRef duy nhất | UC-07 |
| FR-14 | Xác thực kết quả VNPay IPN | Must | IPN sai chữ ký hoặc sai order/amount không thể chuyển PAID; trả code theo contract | UC-08 |
| FR-15 | Ghi nhận trạng thái thanh toán | Must | IPN thành công duy nhất chuyển PENDING/PAYMENT_FAILED -> PAID, thất bại -> PAYMENT_FAILED | UC-08 |
| FR-16 | Chống xử lý trùng thanh toán | Must | Replay IPN và retry cùng Idempotency-Key/payload không tạo charge/payment effects lần hai | UC-07;UC-08 |
| FR-17 | Đối soát giao dịch chưa rõ | Must | Return URL không tự PAID; UNKNOWN được QueryDr/đối soát trước kết luận | UC-08 |
| FR-18 | Mock payment qua provider | Must | Provider Mock đạt cùng contract; không được chọn trong production public | UC-07 |
| FR-19 | Khuyến mãi | Must | Mã khuyến mãi hợp lệ mới áp dụng; giới hạn sử dụng không vượt quota khi cạnh tranh | UC-04 |
| FR-20 | Điểm thưởng cơ bản | Must | Tích điểm khi đơn chuyển sang PAID, đúng một lần cho mỗi order; 1 điểm/1.000đ trên tổng tiền thực trả. Khi hủy PAID, thu hồi điểm đã tích đúng một lần | UC-14 |
| FR-21 | Dùng điểm ở checkout | Should | Điểm dùng không vượt số dư, bị giữ/khấu trừ một lần và được trả khi hủy | UC-04;UC-10 |
| FR-22 | Chặn hủy sau khi bắt đầu pha chế | Must | Cancel khi PREPARING/READY/COMPLETED/CANCELLED trả 409, không đổi dữ liệu | UC-09 |
| FR-23 | Hủy đơn chưa trả tiền | Must | PENDING/PAYMENT_FAILED -> CANCELLED; hoàn giữ kho, promo, điểm một lần | UC-09 |
| FR-24 | Hủy đơn PAID và tạo nghĩa vụ hoàn tiền | Must | Khách nhập ngân hàng và STK hợp lệ; đơn chuyển CANCELLED, tạo đúng một Refund PENDING, hoàn tài nguyên một lần | UC-10 |
| FR-25 | Tạo VietQR cho Barista hoàn tiền | Must | QR chứa ngân hàng, STK, đúng số tiền thực trả và mã tham chiếu đơn; chỉ hiển thị cho nhân viên có quyền | UC-10;UC-13 |
| FR-26 | Barista xác nhận hoàn tiền | Must | Sau khi kiểm tra giao dịch thành công, nhân viên lưu bằng chứng; Refund chuyển COMPLETED. Không cộng điểm bù | UC-10;UC-13 |
| FR-27 | Xử lý hoàn tiền thất bại và chống trùng | Must | Refund FAILED được thử lại có kiểm soát; không tạo nghĩa vụ hoàn tiền thứ hai, không xác nhận thành công hai lần | UC-09;UC-10 |
| FR-28 | Đối soát hoàn tiền chưa rõ kết quả | Must | Refund UNKNOWN phải được đối soát trước khi thử lại; không tự coi là thất bại hoặc thành công | UC-10 |
| FR-29 | Hàng đợi Barista | Must | Barista xem PAID; Customer không được xem hàng đợi nội bộ | UC-13 |
| FR-30 | State machine pha chế | Must | PAID -> PREPARING -> READY -> COMPLETED; bước nhảy không hợp lệ trả 409 | UC-13 |
| FR-31 | Quản lý tồn kho | Should | Manager cập nhật tồn kho qua ledger, không sửa âm và có audit actor/reason | UC-15 |
| FR-32 | Xác nhận trạng thái cho khách | Must | Sau xử lý IPN/refund/pha chế, trang theo dõi phản ánh trạng thái server; không dùng return URL làm nguồn sự thật | UC-12 |

**Cách test:** mọi FR có test ID duy nhất T-FR-xx trong [ma trận truy vết](../traceability-matrix.md); test chi tiết ở [acceptance-test-catalog.md](../quality/acceptance-test-catalog.md).

## 3. Non-functional requirements (NFR)

| ID | Yêu cầu | MoSCoW | Tiêu chí nghiệm thu có thể kiểm chứng |
|---|---|---|---|
| NFR-01 | Hiệu năng API | Must | Trong môi trường thử chuẩn 30 người dùng đồng thời, GET /products p95 <= 700 ms, POST /orders p95 <= 1500 ms (không tính VNPay bên ngoài). |
| NFR-02 | Khả dụng | Must | Trong đợt UAT 24h, uptime web/API >= 99%; có health check để phát hiện downtime. |
| NFR-03 | Bảo mật đăng nhập | Must | Hash password bằng argon2/bcrypt; endpoint bảo vệ JWT+role; thử 401/403. |
| NFR-04 | Bảo vệ VNPay | Must | 100% IPN/return được kiểm checksum; backend kiểm amount, merchantRef, status; không ghi secret vào log. |
| NFR-05 | Nhất quán ACID | Must | Tạo đơn/giữ kho atomic; stress 10 request tranh 5 suất không phát sinh tồn kho âm. |
| NFR-06 | Idempotency | Must | Replay payment/refund/confirm 10 lần không sinh bản ghi nghiệp vụ trùng hoặc lặp nghĩa vụ chuyển tiền. |
| NFR-07 | Khả dụng giao diện | Must | Mobile width 360–430 px không cuộn ngang; một cột và điều hướng dưới; hỗ trợ keyboard. |
| NFR-08 | Khả năng deploy | Must | docker compose chạy web, api, DB; migration/seed và GET /api/health kiểm tra được. |
| NFR-09 | Cấu hình/secrets | Must | Mọi secret trong env/secret store; quét git không có HashSecret, JWT secret hoặc mật khẩu DB thật. |
| NFR-10 | Audit | Must | Log structured có correlationId cho create, IPN, cancel, manual refund attempt, refund confirm; không log dữ liệu nhạy cảm. |
| NFR-11 | Dễ bảo trì | Should | Module/domain tách riêng; kiểm thử unit PaymentProvider và cancellation service với fake provider. |
| NFR-12 | Phục hồi dữ liệu | Should | DB production có backup hàng ngày; thử restore vào staging thành công. |
| NFR-13 | Tương thích | Should | Smoke test trên Chrome Android và Safari iOS bản gần hiện hành với width 375 px. |
| NFR-14 | Quan sát | Must | GET /api/health trả 200 khi API+DB sẵn sàng, non-2xx khi DB không sẵn sàng; có request log. |
| NFR-15 | Truy vết và kiểm thử | Must | 100% FR Must có UC, diagram, planned API, test ID; validation script chạy thành công. |
| NFR-16 | Thời gian phản hồi thanh toán | Should | UI hiển thị PENDING/UNKNOWN rõ ràng khi chờ kết quả; không tự báo thành công theo timeout. |

Ngưỡng hiệu năng/availability là **đề xuất để nhóm phê duyệt**, không phải thông số đã đo trên hệ thống hiện hữu (O-06).

## 4. Use-case catalog

| UC ID | Tên | Actors |
|---|---|---|
| UC-01 | Xem menu | Customer |
| UC-02 | Tùy chỉnh sản phẩm | Customer |
| UC-03 | Giỏ hàng | Customer |
| UC-04 | Tính giá/khuyến mãi/điểm | Customer |
| UC-05 | Tạo đơn + giữ kho | Customer |
| UC-06 | Đăng ký/đăng nhập | Customer |
| UC-07 | Khởi tạo thanh toán VNPay hoặc Mock | Customer |
| UC-08 | Xác minh IPN/đối soát | VNPay |
| UC-09 | Hủy đơn chưa thanh toán | Customer |
| UC-10 | Hủy đơn PAID và hoàn tiền thủ công bằng VietQR | Customer;Barista |
| UC-12 | Theo dõi/lịch sử đơn | Customer |
| UC-13 | Xử lý đơn pha chế & hoàn tiền quầy | Barista |
| UC-14 | Tích/tiêu điểm | Customer |
| UC-15 | Quản lý tồn kho | Manager |

Sơ đồ tổng quát: [use-case-overview.svg](use-case-overview.svg) / [PlantUML](use-case-overview.puml). Phạm vi trọng tâm checkout: [UC-CHK-01](use-case-checkout-specification.md) / [sơ đồ hủy đơn & hoàn tiền](use-case-cancel-refund.svg).

## 5. Data dictionary và state machine

| Entity | Thuộc tính bắt buộc | Ghi chú |
|---|---|---|
| User | id, email, passwordHash, role, loyaltyBalanceCached | Ledger làm nguồn gốc số điểm |
| Product / ProductVariant / Topping | id, name, active, priceVnd, recipe | Không tin tổng tiền frontend |
| Order / OrderItem | id, userId, status, totalVnd, snapshot, version | Tạo theo transaction; nhiều item |
| InventoryStock / InventoryReservation | ingredientId, availableQty, reservedQty, orderId | Một reservation release tối đa một lần |
| Payment / PaymentAttempt | id, orderId, provider, status, providerTxnRef, idempotencyKey | Callback verify signed; 1 payment success hiệu lực |
| Refund | id, orderId, paymentId, amount, status, bankCode, accountNumber, accountName, confirmedBy, confirmedAt, evidenceRef | Status: PENDING, IN_PROGRESS, FAILED, UNKNOWN, COMPLETED |
| RefundAttempt | id, refundId, baristaId, attemptNo, status, failureReason, startedAt, finishedAt | Quản lý lịch sử thử hoàn tiền thủ công |
| Promotion / PromotionRedemption | code, scope, quota, status | Không overuse khi concurrency |
| LoyaltyTransaction | id, userId, orderId, type, points | Type: EARN, REDEEM, REVERSE (Bỏ CREDIT_COMPENSATION) |

**Order transition:** `PENDING -> PAID | PAYMENT_FAILED | CANCELLED`; `PAYMENT_FAILED -> PAID | CANCELLED`; `PAID -> PREPARING | CANCELLED`; `PREPARING -> READY -> COMPLETED`. Mọi trạng thái từ `PREPARING` trở đi không thể cancel: HTTP 409 Conflict. `CANCELLED` là trạng thái kết thúc (terminal).

**Quy tắc trạng thái Refund:**
- `Order.CANCELLED` độc lập hoàn toàn với `Refund.PENDING / IN_PROGRESS / FAILED / UNKNOWN / COMPLETED`.
- Hệ thống không tự xác minh chuyển khoản ngân hàng: VietQR hỗ trợ sinh thông tin chuyển tiền Napas247, Barista chịu trách nhiệm kiểm tra app ngân hàng và xác nhận.
- Khi hủy đơn PAID hợp lệ: Order chuyển `CANCELLED` ngay lập tức, hoàn kho/voucher, thu hồi điểm đã tích và tạo đúng 1 `Refund` với trạng thái `PENDING`.
- Barista nhận xử lý: Refund chuyển `IN_PROGRESS` (khóa tránh 2 Barista thao tác cùng lúc).
- Barista xác nhận chuyển khoản thành công: Refund chuyển `COMPLETED`.
- Giao dịch chuyển tiền thất bại: Refund chuyển `FAILED`, Barista được thử lại có kiểm soát sau khi xác minh.
- Giao dịch chưa rõ: Refund chuyển `UNKNOWN`, Barista phải đối soát với app ngân hàng trước khi thử lại, không tự coi là thất bại hay thành công.

## 6. VNPay integration requirements

- Khởi tạo hosted payment URL server-side theo VNPay Sandbox 2.1.0, ký HMAC-SHA512, `vnp_Amount = amountVnd * 100`. Cấu hình secret đọc từ biến môi trường (P0.1).
- `ReturnUrl` = điều hướng/hiển thị; `IPN` = nguồn cập nhật server sau khi verify; QueryDr để đối soát giao dịch UNKNOWN.
- Trước khi đặt `PAID`: xác thực chữ ký HMAC, mã merchant `vnp_TmnCode`, kiểm tra `amount === order.total` (chống sửa đổi số tiền P0.2), và chỉ cho phép chuyển từ `PENDING` hoặc `PAYMENT_FAILED`.
- Giao diện thanh toán tách biệt hoàn toàn giữa luồng thu tiền (VNPay) và luồng hoàn tiền thủ công VietQR tại quầy (ADR-009).

## 7. Hành vi cancel/refund và decision table

| Trạng thái lúc xin hủy | Thao tác hoàn tiền | Kết quả Order | Trạng thái Refund | Kho/promo/điểm đã dùng | Điểm thưởng đã tích |
|---|---|---|---|---|---|
| PENDING | Không | CANCELLED ngay | Không | Release 1 lần | Không áp dụng |
| PAYMENT_FAILED | Không | CANCELLED ngay | Không | Release 1 lần | Không áp dụng |
| PAID (hợp lệ) | Barista quét VietQR chuyển khoản | CANCELLED ngay | PENDING → IN_PROGRESS → COMPLETED | Release 1 lần | Thu hồi điểm đã tích |
| PAID (thất bại chuyển) | Barista xác nhận thất bại | CANCELLED giữ nguyên | FAILED (cho phép thử lại) | Release 1 lần | Thu hồi điểm đã tích |
| PAID (chưa rõ kết quả) | Chờ đối soát ngân hàng | CANCELLED giữ nguyên | UNKNOWN (cần đối soát) | Release 1 lần | Thu hồi điểm đã tích |
| PREPARING/READY/COMPLETED/CANCELLED | Không | HTTP 409 Conflict | Không áp dụng | Không đổi | Không đổi |

> **Lưu ý:** Hệ thống hoàn tiền 100% bằng tiền mặt chuyển khoản qua Napas247 VietQR; không áp dụng chính sách cộng điểm bù (`CREDIT_COMPENSATION`). Điểm thưởng mua hàng được cộng khi PAID và thu hồi nếu đơn PAID bị hủy; không cộng điểm bù hoàn tiền.

## 8. Ràng buộc nghiệp vụ ngoài phạm vi

Không lưu số thẻ; không dùng tiền thật; không coi Mock là chứng minh đã tích hợp VNPay; không phát điểm bù khi provider chỉ timeout/UNKNOWN; không thay core stack; PWA install không bắt buộc. NFR-15 yêu cầu cross-doc traceability không có FR orphan.

## 9. Phê duyệt và thay đổi

Mọi thay đổi FR/NFR phải cập nhật theo thứ tự [UC 1.3](use-case-checkout-specification.md) → [Task 2 diagrams](../diagrams/) → [Task 3 ADR](../architecture/architecture.md) → [traceability-matrix](../traceability-matrix.md) cùng PR. Chưa chốt O-01/O-02 thì không tuyên bố tài liệu là baseline cuối.
