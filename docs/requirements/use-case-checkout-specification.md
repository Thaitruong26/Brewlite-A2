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

Sơ đồ luồng hủy đơn & hoàn tiền VietQR: [use-case-cancel-refund.svg](use-case-cancel-refund.svg); source: [use-case-cancel-refund.puml](use-case-cancel-refund.puml).

## 2. Luồng chính — VNPay Sandbox thành công (M-01)

1. Customer truy cập menu, chọn sản phẩm, size/topping, số lượng và giỏ. UI có thể tính giá **tạm**, nhưng backend là nguồn giá cuối (FR-01..04).
2. Nếu chưa đăng nhập, UI đưa đến đăng nhập JWT; sau thành công quay lại checkout (FR-05..07).
3. Customer xác nhận đơn; UI gọi `POST /orders` với các lựa chọn và optional promotion/loyalty (FR-08..10,19,21).
4. Backend kiểm tra JWT/DTO, giá server, kho & quota promotion; transaction tạo Order/OrderItem/snapshot/InventoryReservation, trạng thái `PENDING`. Nếu fail thì rollback tất cả (FR-08/09).
5. Customer chọn VNPay. Frontend gọi `POST /orders/{id}/payments` với `Idempotency-Key` cố định cho một payment attempt.
6. Backend dùng `PaymentProvider(VNPay)` tạo signed sandbox URL, ghi PaymentAttempt/PENDING có providerTxnRef, trả URL; UI redirect sang VNPay.
7. VNPay xử lý sandbox và phát IPN đến backend. Backend verify signature, txnRef, amount, merchant, business status; một transaction cập nhật Payment success và Order `PAID`, duplicate IPN không cập nhật lại (FR-14..17).
8. Trình duyệt quay về `ReturnUrl` chỉ để hiển thị; UI lấy `GET /orders/{id}` hoặc payment status từ backend. Không tự kết luận thành công từ query trên browser.
9. Barista thấy đơn `PAID`, chuyển lần lượt `PREPARING → READY → COMPLETED`, Customer xem tiến độ; Loyalty EARNED được ghi một lần khi thanh toán thành công và đơn chuyển PAID.

**Hậu điều kiện:** Một đơn PAID được truy vết đến đúng payment; stock reservation không tạo trùng; điểm thưởng ghi một lần khi PAID; nếu hủy PAID hợp lệ thì thu hồi điểm.

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

## 5. Luồng hủy PAID và hoàn tiền thủ công bằng VietQR — UC-10

**Actor chính:** Customer  
**Actor hỗ trợ:** Barista  
**Tiền điều kiện:** Customer là chủ đơn, Order đang `PAID` và chưa chuyển sang `PREPARING`.

### Luồng chính:
1. Customer yêu cầu hủy đơn hàng `PAID`.
2. Giao diện yêu cầu nhập ngân hàng, số tài khoản (STK) và tên chủ tài khoản nhận tiền.
3. Backend xác thực Customer, kiểm tra trạng thái đơn và thông tin nhận tiền.
4. Trong một transaction nguyên tử, hệ thống:
   - Chuyển `Order` sang `CANCELLED`.
   - Hoàn nguyên liệu tồn kho, hoàn lượt sử dụng mã khuyến mãi và hoàn điểm đã sử dụng theo chính sách.
   - Thu hồi điểm thưởng đã tích của đơn.
   - Tạo một bản ghi `Refund` với trạng thái `PENDING` và số tiền thực tế cần hoàn.
   - Lưu thông tin tài khoản nhận tiền được bảo vệ an toàn.
5. Barista mở danh sách đơn đã hủy có `Refund PENDING` trên màn hình KDS (`/barista`).
6. Barista chọn yêu cầu hoàn tiền; hệ thống tạo mã Napas247 VietQR với đúng ngân hàng, STK, số tiền và nội dung chuyển khoản `Hoan tien don #ID`.
7. Barista quét VietQR bằng ứng dụng ngân hàng di động (Mobile Banking) và thực hiện chuyển khoản.
8. Sau khi xác minh giao dịch thành công, Barista bấm xác nhận và lưu bằng chứng.
9. `Refund` chuyển `COMPLETED`. Customer theo dõi thấy trạng thái đơn đã hủy và đã hoàn tiền thành công.

### Luồng thay thế và ngoại lệ:
- **A-01:** Đơn `PENDING`/`PAYMENT_FAILED` được hủy mà không tạo Refund chuyển khoản.
- **A-02:** Đơn `PREPARING`/`READY`/`COMPLETED`/`CANCELLED` không thể hủy; trả HTTP 409 Conflict.
- **A-03:** Thông tin tài khoản không hợp lệ; từ chối yêu cầu, không chuyển trạng thái.
- **A-04:** Chuyển khoản thất bại; `Refund` chuyển `FAILED`. Barista có thể tạo lần thử mới (`RefundAttempt`) sau khi xác minh lần trước không thành công.
- **A-05:** Chuyển khoản chưa rõ kết quả; `Refund` chuyển `UNKNOWN`. Phải đối soát sao kê trước khi thử lại.
- **A-06:** Hai Barista thao tác đồng thời; hệ thống chỉ cho một người nhận xử lý mỗi lần thử (`claim Refund IN_PROGRESS`).
- **A-07:** Gửi lại yêu cầu hủy; hệ thống trả kết quả hiện có (Idempotency), không hoàn kho hoặc tạo `Refund` trùng.

### Hậu điều kiện:
- `Order` vẫn `CANCELLED` bất kể `Refund` còn `PENDING`, `FAILED` hay `UNKNOWN`.
- Mỗi `Order` có tối đa một nghĩa vụ hoàn tiền, có thể có nhiều `RefundAttempt` nhưng không được ghi nhận nhiều lần hoàn tiền hoàn tất.
- **Không có nghiệp vụ cộng điểm bù cho Refund thất bại.**

## 6. Các tiêu chí nghiệm thu trọng tâm

| Test | Given – When – Then | Diagram |
|---|---|---|
| INT-01 | Given kho 5 suất; 10 create đồng thời → tối đa 5 đơn thành công, kho không âm | ACT-01, SEQ-01, CLASS-01 |
| INT-02 | Given IPN signed success nhưng return đến trước → chỉ IPN/QueryDr validated làm PAID | SEQ-01 |
| INT-03 | Given payment retry 10 lần cùng key → 1 active effect | SEQ-01, CLASS-01 |
| INT-04 | Given PAID, khách hủy kèm STK hợp lệ → Order CANCELLED ngay, tạo 1 Refund PENDING, hoàn kho 1 lần, 0 credit bù | SEQ-02, CLASS-01 |
| INT-05 | Given Refund PENDING, Barista chuyển khoản VietQR thành công → Barista xác nhận lưu evidence, Refund COMPLETED | SEQ-02, CLASS-01 |
| INT-06 | Given chuyển khoản chưa rõ kết quả → Refund UNKNOWN, khóa thử lại, yêu cầu đối soát sao kê | SEQ-02 |
| INT-07 | Given PREPARING/READY/COMPLETED → POST cancel trả 409 Conflict và không thay đổi DB | ACT-01, SEQ-02 |
| INT-08 | Given 2 cancel đồng thời hoặc retry → 1 Refund duy nhất, 1 lần release inventory, không duplicate | SEQ-02 |
| E2E-01 | Menu → tùy chọn → giỏ → JWT → order → VNPay sandbox → IPN → theo dõi → COMPLETED | ACT-01, SEQ-01 |

## 7. Liên kết nhất quán

[REQ-02](software-requirements-specification.md) → [Activity ACT-01](../diagrams/activity-checkout.puml) → [Sequence SEQ-01](../diagrams/sequence-checkout.puml) → [Class CLASS-01](../diagrams/class-domain.puml) → [Architecture](../architecture/architecture.md) → [traceability](../traceability-matrix.md).
