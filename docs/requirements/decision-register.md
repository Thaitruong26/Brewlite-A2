# Decision register — BrewLite A2

**Decision baseline:** 15/11/2026. Các quyết định D-01..D-05, D-07 là quyết định **đã chốt do nhóm thống nhất**, có hiệu lực với toàn bộ hệ thống A2.

| ID | Trạng thái | Quyết định | Ảnh hưởng |
|---|---|---|---|
| D-01 | LOCKED | A2 viết source/repository mới (`apps/web`, `apps/api`, `docs`), chỉ kế thừa nghiệp vụ A1 | ADR-001; Task 4 |
| D-02 | LOCKED | Web mobile-first: dọc, một cột, bottom navigation; PWA install tùy chọn | NFR-07; ADR-002 |
| D-03 | LOCKED | Hoàn tất Task 1–3 trước khi code | Quy trình, traceability |
| D-04 | LOCKED | VNPay Sandbox **Must** qua `PaymentProvider`; Mock provider phục vụ test/demo | FR-12..18; ADR-004 |
| D-05 | LOCKED | Hủy chỉ PENDING / PAYMENT_FAILED / PAID; từ PREPARING trở đi HTTP 409 | FR-22..25; UC-09/10 |
| D-06 | SUPERSEDED | *(Đã bị thay thế bởi D-07)* Refund tự động qua API cổng thanh toán và cộng điểm bù khi thất bại | Thay thế bởi D-07, ADR-009 |
| D-07 | LOCKED | **Hoàn tiền chuyển khoản VietQR thủ công qua Barista:** Khách hủy PAID cung cấp ngân hàng và STK; Order chuyển CANCELLED và tạo Refund PENDING; Barista quét mã VietQR Napas247 trên KDS để chuyển khoản thủ công bằng Mobile Banking; Barista xác nhận lưu bằng chứng -> Refund COMPLETED. Không cộng điểm bù. | FR-24..28; UC-10; ADR-009; SEQ-02; ACT-01; Task 10 |
| O-01 | RESOLVED | Quyết định D-07 chuyển sang hoàn tiền VietQR 100% giá trị tiền mặt thực trả, bãi bỏ điểm bù; O-01 được đóng | FR-24..28; ADR-009 |
| O-02 | LOCKED | **Chốt chính thức nền tảng Render Cloud Platform (Singapore Region)**: Frontend Web Service (Next.js), Backend Web Service (NestJS), Managed PostgreSQL 16 (Private VPC), Ingress HTTPS tự động; Local dùng Docker Compose | ADR-007; DEP-01; Task 3.2 |
| O-03 | RESOLVED | Quét tự động hủy đơn PENDING/PAYMENT_FAILED sau 15 phút, hoàn tồn kho nguyên liệu | FR-08..09, 17, UC-07 |
| O-04 | RESOLVED | Refund UNKNOWN được Barista đối soát trực tiếp với ứng dụng ngân hàng trước khi cho phép thử lại | FR-28; ADR-009 |
| O-05 | RESOLVED | Thông tin VNPay TMN Code và HashSecret Sandbox nạp an toàn từ biến môi trường | P0.1, Task 5.1 |
| O-06 | RESOLVED | Đo kiểm chuẩn đạt yêu cầu trên môi trường containerized | NFR-01, NFR-02 |

## Invariants (bắt buộc thống nhất)

- `OrderStatus`: `PENDING`, `PAYMENT_FAILED`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`.
- `RefundStatus`: `PENDING`, `IN_PROGRESS`, `FAILED`, `UNKNOWN`, `COMPLETED`. Trạng thái `Order.CANCELLED` độc lập hoàn toàn với `RefundStatus`.
- Customer không thể hủy ở/qua `PREPARING` (trả về HTTP 409 Conflict).
- Khi hủy đơn `PAID`, hệ thống chuyển `Order` sang `CANCELLED`, hoàn trả nguyên liệu, hoàn lượt voucher, thu hồi điểm thưởng đã tích và tạo đúng 1 bản ghi `Refund PENDING`.
- Màn hình Barista KDS tạo mã Napas247 VietQR chứa chính xác ngân hàng, STK của khách, số tiền thực tế cần hoàn và nội dung chuyển tiền `Hoan tien don #ID`.
- Barista chịu trách nhiệm kiểm tra giao dịch trên Banking App; xác nhận thành công chuyển `Refund` sang `COMPLETED`. Không có callback ngân hàng tự động.
- Không có nghiệp vụ cộng điểm bù `CREDIT_COMPENSATION` cho Refund thất bại. Tích điểm thưởng mua hàng khi đơn hoàn tất vẫn giữ nguyên.
- `vnp_ReturnUrl` chỉ hiển thị thông tin; xác thực chữ ký HMAC và so khớp `amount === order.total` mới cho phép chuyển `PAID`.
