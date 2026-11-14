# Task 1.3 — UC-CHK-01: Đặt và thanh toán đơn hàng

**Mã tài liệu:** REQ-03 · **Use-case chính:** UC-CHK-01 · **Các use-case con:** UC-04/05/07/08/09/10/12/13 · **Task 2:** ACT-01, SEQ-01, SEQ-02, CLASS-01.

## 1. Phạm vi và actors

| Thuộc tính | Đặc tả |
|---|---|
| Mục tiêu | Customer đặt đồ uống mobile-first và trả bằng VNPay Sandbox (hoặc Mock trong test), theo dõi đơn và hủy đúng điều kiện |
| Actor chính | Customer |
| Actor hỗ trợ | VNPay (external payment/refund), Barista (chuyển trạng thái), NestJS backend và DB |
| Trigger | Customer nhấn “Đặt hàng” từ giỏ |
| Tiền điều kiện | Có item hợp lệ, đăng nhập JWT; product active; recipe/giá có thể xác định từ backend |
| Thành công | Order tạo với snapshot + giữ kho; thanh toán xác nhận hợp lệ → PAID; Customer xem trạng thái; Barista nhận PAID |
| Thất bại có kiểm soát | Không có order rác khi giỏ/kho sai; payment fail → PAYMENT_FAILED; hoàn tiền thất bại xác nhận → CANCELLED + credit bù điểm duy nhất |
| Ngoài phạm vi | Lưu thẻ trực tiếp, tiền thật, giao hàng, hủy PREPARING+; không xem ReturnUrl như IPN |
| Liên kết FR | FR-03/04/06/07/08/09/10/11/12/13/14/15/16/17/18/19/21/22/23/24/25/26/27/28/29/30/32 |
| Nonfunctional | NFR-03/04/05/06/07/10/14/15 |

Use-case diagram riêng: [use-case-checkout.svg](../diagrams/use-case-checkout.svg); source: [use-case-checkout.puml](../diagrams/use-case-checkout.puml).

## 2. Luồng chính — VNPay Sandbox thành công (M-01)

1. Customer truy cập menu, chọn sản phẩm, size/topping, số lượng và giỏ. UI có thể tính giá **tạm**, nhưng backend là nguồn giá cuối (FR-01..04).
2. Nếu chưa đăng nhập, UI đưa đến đăng nhập JWT; sau thành công quay lại checkout (FR-05..07).
3. Customer xác nhận đơn; UI gọi `POST /orders` với các lựa chọn và optional promotion/loyalty (FR-08..10,19,21).
4. Backend kiểm tra JWT/DTO, giá server, kho & quota promotion; transaction tạo Order/OrderItem/snapshot/InventoryReservation, trạng thái `PENDING`. Nếu fail thì rollback tất cả (FR-08/09).
5. Customer chọn VNPay. Frontend gọi `POST /orders/{id}/payments` với `Idempotency-Key` cố định cho một payment attempt.
6. Backend dùng `PaymentProvider(VNPay)` tạo signed sandbox URL, ghi PaymentAttempt/PENDING có providerTxnRef, trả URL; UI redirect sang VNPay.
7. VNPay xử lý sandbox và phát IPN đến backend. Backend verify signature, txnRef, amount, merchant, business status; một transaction cập nhật Payment success và Order `PAID`, duplicate IPN không cập nhật lại (FR-14..17).
8. Trình duyệt quay về `ReturnUrl` chỉ để hiển thị; UI lấy `GET /orders/{id}` hoặc payment status từ backend. Không tự kết luận thành công từ query trên browser.
9. Barista thấy đơn `PAID`, chuyển lần lượt `PREPARING → READY → COMPLETED`, Customer xem tiến độ; Loyalty EARNED ghi một lần khi hoàn tất.

**Hậu điều kiện:** Một đơn PAID được truy vết đến đúng payment; stock reservation không tạo trùng; điểm thưởng ghi một lần khi COMPLETED.

## 3. Luồng thay thế/ngoại lệ (A/E)

| ID | Điểm rẽ | Điều kiện / kết quả kiểm chứng | Truy vết |
|---|---|---|---|
| A-01 | 2 | JWT thiếu/hết hạn: HTTP 401, buộc login, không create order | FR-06,07 |
| A-02 | 3–4 | Product/size/topping không hợp lệ: HTTP 400/422, giao diện cho sửa | FR-02,04 |
| A-03 | 4 | Kho/khuyến mãi hết quota: HTTP 409, rollback, không âm kho | FR-08,09,19 |
| A-04 | 5–6 | Mock Provider ở môi trường test: cùng contract, trả SUCCESS/FAILED; không làm bằng chứng VNPay | FR-18 |
| A-05 | 6–7 | VNPay từ chối/khách bỏ thanh toán: Payment FAILED, Order `PAYMENT_FAILED`, hiển thị thử lại với key mới | FR-15 |
| A-06 | 5–7 | Cùng idempotency key/payload gửi lại: trả kết quả cũ; key trùng payload khác từ chối 409/422 theo contract A2 | FR-16 |
| A-07 | 7 | IPN sai HMAC hoặc sai amount/txnRef: không chuyển PAID, tạo audit security event | FR-14 |
| A-08 | 7–8 | ReturnUrl đến trước IPN: chỉ hiển thị chờ; QueryDr xác thực khi cần; không false success | FR-17,32 |
| A-09 | 7 | IPN trễ sau lệnh cancel PENDING: không cho hồi sinh CANCELLED; ghi đối soát và xử lý hoàn/điểm theo chính sách | FR-17,27 |
| A-10 | 3–4 | Timeout tạo đơn mà chưa rõ response: tra cứu order theo clientOrderKey trước retry (proposal to implement) | FR-09 |

## 4. Luồng hủy chưa trả tiền — UC-09

**Trigger:** Customer nhấn Hủy, đang `PENDING` hoặc `PAYMENT_FAILED`. **Tiền điều kiện:** là chủ đơn, chưa bắt đầu pha chế. **Các bước:** 1) `POST /orders/{id}/cancel` kèm idempotency key, 2) lock Order kiểm tra state, 3) transaction chuyển `CANCELLED` + release `InventoryReservation`/promotion/loyalty hold đúng một lần, 4) trả state. **Ngoại lệ:** race/duplicate request trả kết quả cũ, không release gấp đôi. **AC:** T-FR-22/23/27.

## 5. Luồng hủy PAID — UC-10

**Trigger:** Customer yêu cầu cancel khi Order `PAID`; Barista chưa chuyển PREPARING.

1. Backend xác thực owner và lock Order. Nếu không phải `PAID` hoặc đã có lệnh cancel đang xử lý thì không tạo request mới.
2. Tạo `CancellationRequest` và `Refund` với providerRequestId/idempotency key duy nhất; đặt `CancellationRequest.WAITING_PROVIDER`, **khóa thao tác Barista PREPARING**.
3. Gọi `PaymentProvider.refund()` với giao dịch thanh toán gốc. **Không giữ transaction DB trong lúc gọi mạng**; xử lý kết quả bằng transaction mới và guard idempotent.
4. **Refund confirmed SUCCESS:** lưu `Refund.SUCCESS`, chuyển Order `CANCELLED`, release kho/promo/loyalty hold đúng một lần; **không** cấp điểm bù.
5. **Refund confirmed FAILED:** lưu `Refund.FAILED`, chuyển Order `CANCELLED`, release nguồn lực; tạo `LoyaltyTransaction(type=CREDIT_COMPENSATION, originRefundId)` đúng một lần, `amountVndEquivalent=refundAmountVnd` và `points=amount/R` với O-01 chưa chốt.
6. **Refund UNKNOWN/timeout:** ghi `UNKNOWN`/WAITING_RECONCILIATION, **chưa** cấp điểm, chưa finalize `CANCELLED`; giữ PAID tạm trong DB, chặn PREPARING và gọi QueryDr/đối soát. Khi có kết luận đi bước 4 hoặc 5.
7. UI hiển thị lần lượt “Đang xử lý hoàn”, “Đã hủy/đã hoàn”, “Đã hủy/đã bù điểm”, hoặc “Đang đối soát”. Không hiển thị thành công khi UNKNOWN.

**Hậu điều kiện:** mỗi order tối đa một cancel flow đang hoạt động; mọi bút toán `CREDIT_COMPENSATION` unique theo Refund; không có hiệu ứng kép khi retry/callback trùng. **Ngoại lệ:** PREPARING+ → HTTP 409; refund đến muộn sau compensation → reconciliation flag, audit/manual review.

## 6. Các tiêu chí nghiệm thu trọng tâm

| Test | Given – When – Then | Diagram |
|---|---|---|
| INT-01 | Given kho 5 suất; 10 create đồng thời → tối đa 5 đơn thành công, kho không âm | ACT-01, SEQ-01, CLASS-01 |
| INT-02 | Given IPN signed success nhưng return đến trước → chỉ IPN/QueryDr validated làm PAID | SEQ-01 |
| INT-03 | Given payment retry 10 lần cùng key → 1 active effect | SEQ-01, CLASS-01 |
| INT-04 | Given PAID, refund SUCCESS → CANCELLED, 0 credit bù, release stock once | SEQ-02 |
| INT-05 | Given PAID, refund confirmed FAILED → CANCELLED, Refund.FAILED và 1 ledger bù đúng giá trị | SEQ-02, CLASS-01 |
| INT-06 | Given refund timeout UNKNOWN → chưa cấp điểm, vẫn khóa Barista, chờ đối soát | SEQ-02 |
| INT-07 | Given PREPARING/READY/COMPLETED → POST cancel trả 409 và không thay đổi DB | ACT-01, SEQ-02 |
| INT-08 | Given 2 cancel đồng thời → 1 Refund, 1 credit, 1 release inventory | SEQ-02 |
| E2E-01 | Menu → tùy chọn → giỏ → JWT → order → VNPay sandbox → IPN → theo dõi → COMPLETED | ACT-01, SEQ-01 |

## 7. Liên kết nhất quán

[REQ-02](software-requirements-specification.md) → [Activity ACT-01](../diagrams/activity-checkout.puml) → [Sequence SEQ-01](../diagrams/sequence-checkout.puml) + [SEQ-02](../diagrams/sequence-cancel-refund.puml) → [Class CLASS-01](../diagrams/class-domain.puml) → [Architecture](../architecture/architecture.md) → [traceability](../traceability-matrix.md). Các HTTP path **được đề xuất cho A2**, không khẳng định đã tồn tại trong source.
