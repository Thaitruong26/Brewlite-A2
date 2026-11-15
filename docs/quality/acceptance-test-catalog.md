# Test design — catalog for Tasks 1–3

**Tất cả test là kế hoạch, chưa thực thi.** NFR thresholds cần phê duyệt trước chạy benchmark (O-06); point ratio cần phê duyệt trước chạy compensation tests (O-01).

## FR acceptance test mapping

| Test ID | Given / When / Then (rút gọn) | Requirement |
|---|---|---|
| T-FR-01 | GET /products trả danh sách món đang bán; UI thể hiện loading/empty/error | FR-01 |
| T-FR-02 | GET /products/:id trả size, topping hợp lệ; lựa chọn sai bị từ chối | FR-02 |
| T-FR-03 | Thêm/sửa/xóa item và tính tổng tạm; giỏ rỗng không thể checkout | FR-03 |
| T-FR-04 | Tổng order tính từ giá/size/topping/promo/điểm trên DB; sửa total phía client không đổi số tiền | FR-04 |
| T-FR-05 | Email hợp lệ/không trùng mới tạo User; mật khẩu lưu hash | FR-05 |
| T-FR-06 | Đúng credential nhận JWT; hết hạn/sai credential không truy cập checkout | FR-06 |
| T-FR-07 | Customer không được cập nhật trạng thái pha chế/quản trị; HTTP 403 | FR-07 |
| T-FR-08 | Món không bán/hết nguyên liệu bị từ chối; kho không âm khi 10 checkout đồng thời | FR-08 |
| T-FR-09 | Đơn + các item + giữ kho được commit cùng nhau hoặc rollback toàn bộ | FR-09 |
| T-FR-10 | Sửa giá sau khi đặt không đổi item/total của đơn đã tạo | FR-10 |
| T-FR-11 | Customer chỉ xem đơn của mình, gồm trạng thái/thanh toán/lịch sử | FR-11 |
| T-FR-12 | Checkout cho chọn VNPay sandbox hoặc Mock (chỉ ở môi trường cho phép) | FR-12 |
| T-FR-13 | Backend sinh URL thanh toán hợp lệ, signed, đúng số tiền ×100 và txnRef duy nhất | FR-13 |
| T-FR-14 | IPN sai chữ ký hoặc sai order/amount không thể chuyển PAID; trả code theo contract | FR-14 |
| T-FR-15 | IPN thành công duy nhất chuyển PENDING/PAYMENT_FAILED -> PAID, thất bại -> PAYMENT_FAILED | FR-15 |
| T-FR-16 | Replay IPN và retry cùng Idempotency-Key/payload không tạo charge/payment effects lần hai | FR-16 |
| T-FR-17 | Return URL không tự PAID; UNKNOWN được QueryDr/đối soát trước kết luận | FR-17 |
| T-FR-18 | Provider Mock đạt cùng contract; không được chọn trong production public | FR-18 |
| T-FR-19 | Mã khuyến mãi hợp lệ mới áp dụng; giới hạn sử dụng không vượt quota khi cạnh tranh | FR-19 |
| T-FR-20 | Tích điểm khi COMPLETED đúng một lần; transaction ledger có source unique | FR-20 |
| T-FR-21 | Điểm dùng không vượt số dư, bị giữ/khấu trừ một lần và được trả khi hủy | FR-21 |
| T-FR-22 | Cancel khi PREPARING/READY/COMPLETED/CANCELLED trả 409, không đổi dữ liệu | FR-22 |
| T-FR-23 | PENDING/PAYMENT_FAILED -> CANCELLED; hoàn giữ kho, promo, điểm một lần | FR-23 |
| T-FR-24 | Khách nhập ngân hàng và STK hợp lệ; đơn chuyển CANCELLED, tạo đúng một Refund PENDING, hoàn tài nguyên một lần | FR-24 |
| T-FR-25 | QR chứa ngân hàng, STK, đúng số tiền thực trả và mã tham chiếu đơn; chỉ hiển thị cho nhân viên có quyền | FR-25 |
| T-FR-26 | Sau khi kiểm tra giao dịch thành công, nhân viên lưu bằng chứng; Refund chuyển COMPLETED. Không cộng điểm bù | FR-26 |
| T-FR-27 | Refund FAILED được thử lại có kiểm soát; không tạo nghĩa vụ hoàn tiền thứ hai, không xác nhận thành công hai lần | FR-27 |
| T-FR-28 | Refund UNKNOWN phải được đối soát trước khi thử lại; không tự coi là thất bại hoặc thành công | FR-28 |
| T-FR-29 | Barista xem PAID; Customer không được xem hàng đợi nội bộ | FR-29 |
| T-FR-30 | PAID -> PREPARING -> READY -> COMPLETED; bước nhảy không hợp lệ trả 409 | FR-30 |
| T-FR-31 | Manager cập nhật tồn kho qua ledger, không sửa âm và có audit actor/reason | FR-31 |
| T-FR-32 | Sau xử lý IPN/refund/pha chế, trang theo dõi phản ánh trạng thái server; không dùng return URL làm nguồn sự thật | FR-32 |

## NFR verification

| Test ID | Method + pass criteria | Requirement |
|---|---|---|
| T-NFR-01 | Trong môi trường thử chuẩn 30 người dùng đồng thời, GET /products p95 <= 700 ms, POST /orders p95 <= 1500 ms (không tính VNPay bên ngoài). | NFR-01 |
| T-NFR-02 | Trong đợt UAT 24h, uptime web/API >= 99%; có health check để phát hiện downtime. | NFR-02 |
| T-NFR-03 | Hash password bằng argon2/bcrypt; endpoint bảo vệ JWT+role; thử 401/403. | NFR-03 |
| T-NFR-04 | 100% IPN/return được kiểm checksum; backend kiểm amount, merchantRef, status; không ghi secret vào log. | NFR-04 |
| T-NFR-05 | Tạo đơn/giữ kho atomic; stress 10 request tranh 5 suất không phát sinh tồn kho âm. | NFR-05 |
| T-NFR-06 | Replay payment/refund/credit 10 lần không sinh bản ghi nghiệp vụ trùng. | NFR-06 |
| T-NFR-07 | Mobile width 360–430 px không cuộn ngang; một cột và điều hướng dưới; hỗ trợ keyboard. | NFR-07 |
| T-NFR-08 | docker compose chạy web, api, DB; migration/seed và GET /health kiểm tra được. | NFR-08 |
| T-NFR-09 | Mọi secret trong env/secret store; quét git không có HashSecret, JWT secret hoặc mật khẩu DB thật. | NFR-09 |
| T-NFR-10 | Log structured có correlationId cho create, IPN, cancel, refund, compensate; không log dữ liệu nhạy cảm. | NFR-10 |
| T-NFR-11 | Module/domain tách riêng; kiểm thử unit PaymentProvider và cancellation service với fake provider. | NFR-11 |
| T-NFR-12 | DB production có backup hàng ngày; thử restore vào staging thành công. | NFR-12 |
| T-NFR-13 | Smoke test trên Chrome Android và Safari iOS bản gần hiện hành với width 375 px. | NFR-13 |
| T-NFR-14 | GET /health trả 200 khi API+DB sẵn sàng, non-2xx khi DB không sẵn sàng; có request log. | NFR-14 |
| T-NFR-15 | 100% FR Must có UC, diagram, planned API, test ID; validation script chạy thành công. | NFR-15 |
| T-NFR-16 | UI hiển thị PENDING/UNKNOWN rõ ràng khi chờ kết quả; không tự báo thành công theo timeout. | NFR-16 |

## Integration and E2E regression set

| Test ID | Scenario | Expected result |
|---|---|---|
| INT-01 | 10 user cùng đặt sản phẩm, chỉ đủ kho 5 | Tối đa 5 thành công, kho không âm, số lượng release/hold đúng |
| INT-02 | ReturnUrl thành công tới trước IPN, IPN giả mạo/HMAC sai | Không false PAID, phát hiện IPN sai; chỉ verified IPN/QueryDr được cập nhật |
| INT-03 | Gửi lại POST payment cùng key/payload 10 lần; payload khác cùng key | 1 PaymentAttempt business-effect; conflict nếu payload khác |
| INT-04 | PAID -> khách hủy kèm STK hợp lệ -> tạo Refund PENDING | Order CANCELLED ngay, tạo đúng 1 Refund PENDING, kho/promo/loyalty release 1 lần, 0 điểm bù |
| INT-05 | Refund PENDING -> Barista quét VietQR chuyển khoản thành công -> xác nhận lưu evidence | Refund COMPLETED, audit lưu baristaId và bằng chứng giao dịch |
| INT-06 | Refund chuyển khoản chưa rõ kết quả -> đánh dấu UNKNOWN | Refund UNKNOWN, khóa thử lại, yêu cầu đối soát sao kê ngân hàng |
| INT-07 | Cancel khi PREPARING/READY/COMPLETED/CANCELLED | HTTP 409 Conflict, trạng thái không đổi |
| INT-08 | 2 cancel đồng thời hoặc retry cancel request | Chỉ 1 Refund PENDING, 1 lần hoàn tài nguyên, Idempotent response |
| E2E-01 | Menu → options → cart → login → order → VNPay sandbox → verified IPN → barista complete | Full end-to-end hoàn tất, UI mobile 375px không cuộn ngang |

## Fixtures bắt buộc

- VNPaySandboxAdapter: HMAC valid/invalid, amount mismatch, TxnRef mismatch, IPN duplicate/late, ReturnUrl early, timeout QueryDr.
- Refund: provider SUCCESS, confirmed FAILED, timeout UNKNOWN, late SUCCESS sau compensation (manual reconciliation flag).
- Inventory: 5 units and 10 concurrent orders, cancel release once; promo quota 1 and 3 concurrent carts.
- Loyalty: after O-01 approves R use exact amount fixtures including non-multiple of R, rounding, no double credit.
