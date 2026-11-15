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
| FR-20 | Điểm thưởng cơ bản | Must | Tích điểm khi COMPLETED đúng một lần; transaction ledger có source unique | UC-14 |
| FR-21 | Dùng điểm ở checkout | Should | Điểm dùng không vượt số dư, bị giữ/khấu trừ một lần và được trả khi hủy | UC-04;UC-10 |
| FR-22 | Chặn hủy sau khi bắt đầu pha chế | Must | Cancel khi PREPARING/READY/COMPLETED/CANCELLED trả 409, không đổi dữ liệu | UC-09 |
| FR-23 | Hủy đơn chưa trả tiền | Must | PENDING/PAYMENT_FAILED -> CANCELLED; hoàn giữ kho, promo, điểm một lần | UC-09 |
| FR-24 | Tiếp nhận thông tin hoàn tiền khi hủy PAID | Must | Khách hủy đơn PAID gửi kèm thông tin tài khoản ngân hàng thụ hưởng (Ngân hàng, STK); chuyển CANCELLED và ghi nhận yêu cầu hoàn tiền | UC-10 |
| FR-25 | Tự động sinh mã VietQR Napas247 cho Barista | Must | Màn hình Barista KDS tự động sinh mã VietQR Napas247 chứa đúng STK, ngân hàng, số tiền và nội dung chuyển khoản "Hoan tien don #ID" | UC-10;UC-13 |
| FR-26 | Barista xác nhận hoàn tiền đã chuyển khoản | Must | Barista quét VietQR chuyển trả tiền tức thì cho khách và bấm xác nhận; DB cập nhật refundedAt, refundedAmount, refundRef | UC-10;UC-13 |
| FR-27 | Idempotency và an toàn hủy/hoàn tiền | Must | Hủy đơn hoặc xác nhận hoàn tiền lặp lại đảm bảo Idempotency; từ PREPARING trở đi chặn không cho hủy (409 Conflict) | UC-09;UC-10 |
| FR-28 | Thu hồi ưu đãi và hoàn tồn kho khi hủy | Must | Hủy đơn PAID tự động hoàn trả tồn kho nguyên liệu, hoàn usedCount mã giảm giá và thu hồi điểm thưởng đã tích của đơn | UC-10;UC-14 |
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
| NFR-06 | Idempotency | Must | Replay payment/refund/credit 10 lần không sinh bản ghi nghiệp vụ trùng. |
| NFR-07 | Khả dụng giao diện | Must | Mobile width 360–430 px không cuộn ngang; một cột và điều hướng dưới; hỗ trợ keyboard. |
| NFR-08 | Khả năng deploy | Must | docker compose chạy web, api, DB; migration/seed và GET /health kiểm tra được. |
| NFR-09 | Cấu hình/secrets | Must | Mọi secret trong env/secret store; quét git không có HashSecret, JWT secret hoặc mật khẩu DB thật. |
| NFR-10 | Audit | Must | Log structured có correlationId cho create, IPN, cancel, refund, compensate; không log dữ liệu nhạy cảm. |
| NFR-11 | Dễ bảo trì | Should | Module/domain tách riêng; kiểm thử unit PaymentProvider và cancellation service với fake provider. |
| NFR-12 | Phục hồi dữ liệu | Should | DB production có backup hàng ngày; thử restore vào staging thành công. |
| NFR-13 | Tương thích | Should | Smoke test trên Chrome Android và Safari iOS bản gần hiện hành với width 375 px. |
| NFR-14 | Quan sát | Must | GET /health trả 200 khi API+DB sẵn sàng, non-2xx khi DB không sẵn sàng; có request log. |
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
| UC-10 | Hủy PAID và hoàn tiền/bù điểm | Customer;VNPay |
| UC-12 | Theo dõi/lịch sử đơn | Customer |
| UC-13 | Xử lý đơn pha chế | Barista |
| UC-14 | Tích/tiêu điểm | Customer |
| UC-15 | Quản lý tồn kho | Manager |

Sơ đồ tổng quát: [use-case-overview.svg](../diagrams/use-case-overview.svg) / [PlantUML](../diagrams/use-case-overview.puml). Phạm vi trọng tâm checkout: [UC-CHK-01](use-case-checkout-specification.md) / [sơ đồ checkout](../diagrams/use-case-checkout.svg).

## 5. Data dictionary và state machine

| Entity | Thuộc tính bắt buộc | Ghi chú |
|---|---|---|
| User | id, email, passwordHash, role, loyaltyBalanceCached | Ledger làm nguồn gốc số điểm |
| Product / ProductVariant / Topping | id, name, active, priceVnd, recipe | Không tin tổng tiền frontend |
| Order / OrderItem | id, userId, status, totalVnd, snapshot, version | Tạo theo transaction; nhiều item |
| InventoryStock / InventoryReservation | ingredientId, availableQty, reservedQty, orderId | Một reservation release tối đa một lần |
| Payment / PaymentAttempt | id, orderId, provider, status, providerTxnRef, idempotencyKey | Callback verify signed; 1 payment success hiệu lực |
| Refund | id, paymentId, providerRequestId, status, amountVnd | SUCCESS/FAILED/UNKNOWN khác nhau |
| CancellationRequest | id, orderId, status, reason | Chặn pha chế trong khi chờ refund |
| Promotion / PromotionRedemption | code, scope, quota, status | Không overuse khi concurrency |
| LoyaltyTransaction | id, userId, orderId, refundId?, type, points, amountVndEquivalent | Unique(refundId,type=CREDIT_COMPENSATION) |

**Order transition:** `PENDING -> PAID | PAYMENT_FAILED | CANCELLED`; `PAYMENT_FAILED -> PAID | CANCELLED`; `PAID -> PREPARING | CANCELLED` (lệnh cancel PAID chỉ finalize sau refund result), `PREPARING -> READY -> COMPLETED`. Mọi trạng thái từ PREPARING trở đi không thể cancel: HTTP 409. `CANCELLED` terminal. `PaymentAttempt` và `Refund` có trạng thái độc lập, không đánh đồng với Order.

**Refund UNKNOWN:** khi provider không xác nhận thành công/thất bại, lưu `Refund.UNKNOWN` + `CancellationRequest.WAITING_RECONCILIATION`, order giữ `PAID` về mặt dữ liệu (nhưng tạm khóa pha chế). Chỉ khi biết kết quả mới finalized `CANCELLED`. Không cấp điểm khi UNKNOWN. Lựa chọn này cần nhóm phê duyệt trong O-04.

## 6. VNPay integration requirements

- Khởi tạo hosted payment URL server-side theo VNPay Sandbox 2.1.0, ký HMAC-SHA512, `vnp_Amount = amountVnd * 100` (tài liệu VNPay).
- `ReturnUrl` = điều hướng/hiển thị; `IPN` = nguồn cập nhật server sau khi verify; QueryDr để đối soát giao dịch UNKNOWN.
- Trước khi đặt `PAID`: xác thực chữ ký, mã merchant, `vnp_TxnRef`, amount, trạng thái và tính chưa xử lý; IPN duplicate phải trả kết quả idempotent.
- Refund qua giao diện `PaymentProvider.refund` và VNPay sandbox refund; `vnp_RequestId` unique. Không retry refund bằng request mới khi kết quả UNKNOWN chưa được đối soát.
- Ghi audit không chứa HMAC secret hoặc thông tin tài khoản nhạy cảm.

Tài liệu tham khảo chính thức: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html ; https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html ; https://sandbox.vnpayment.vn/apis/docs/faqs/ . Các trường API chi tiết phải xác minh ở thời điểm tích hợp, đây **chưa phải code đã chạy**.

## 7. Hành vi cancel/refund/điểm bù và các decision tables

| Trạng thái lúc xin hủy | Refund? | Kết quả | Kho/promo/điểm đã dùng | Điểm bù |
|---|---|---|---|---|
| PENDING | Không | CANCELLED ngay | Release 1 lần | Không |
| PAYMENT_FAILED | Không | CANCELLED ngay | Release 1 lần | Không |
| PAID | VNPay/Provider refund | Refund SUCCESS → CANCELLED | Release 1 lần | Không |
| PAID | VNPay/Provider refund | Refund confirmed FAILED → CANCELLED | Release 1 lần | `CREDIT_COMPENSATION` duy nhất |
| PAID | VNPay/Provider refund | Refund UNKNOWN → chờ reconcile, chưa finalize | Tạm khóa pha chế, không giải phóng trước kết luận | Không |
| PREPARING/READY/COMPLETED/CANCELLED | Không | HTTP 409 | Không đổi | Không |

Giá trị điểm bù: `points = refundAmountVnd / R` với `R` là VND/point. **O-01 BLOCKER:** chưa chốt `R`, precision và rounding; không tự chọn số. Test sử dụng fixture có `R` cố định khi nhóm phê duyệt. Bảo đảm bút toán quy đổi không làm mất giá trị của khách.

## 8. Ràng buộc nghiệp vụ ngoài phạm vi

Không lưu số thẻ; không dùng tiền thật; không coi Mock là chứng minh đã tích hợp VNPay; không phát điểm bù khi provider chỉ timeout/UNKNOWN; không thay core stack; PWA install không bắt buộc. NFR-15 yêu cầu cross-doc traceability không có FR orphan.

## 9. Phê duyệt và thay đổi

Mọi thay đổi FR/NFR phải cập nhật theo thứ tự [UC 1.3](use-case-checkout-specification.md) → [Task 2 diagrams](../diagrams/) → [Task 3 ADR](../architecture/architecture.md) → [traceability-matrix](../traceability-matrix.md) cùng PR. Chưa chốt O-01/O-02 thì không tuyên bố tài liệu là baseline cuối.
