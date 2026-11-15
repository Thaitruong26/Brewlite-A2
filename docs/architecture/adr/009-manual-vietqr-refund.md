# ADR-009 — Quy trình hoàn tiền chuyển khoản VietQR tại quầy Barista (Barista QR Refund Flow)

- **Trạng thái:** Accepted / LOCKED (Thay thế chính thức cơ chế cũ ADR-006 theo quyết định D-07)
- **Ngày:** 2026-11-15
- **Liên quan:** FR-24..28; NFR-06/10; UC-10; Task 10

## Bối cảnh
Khi khách hàng hủy một đơn hàng đã thanh toán (`PAID`), hệ thống cần một cơ chế hoàn trả tiền minh bạch, an toàn, không làm thất thoát ngân quỹ và phù hợp với mô hình vận hành thực tế tại quán cà phê. Việc gọi trực tiếp API Refund tự động của các cổng thanh toán ngân hàng truyền thống thường yêu cầu thời gian đối soát kéo dài (7 - 14 ngày làm việc), phụ thuộc vào tài khoản doanh nghiệp đã kích hoạt tính năng hoàn tiền trực tuyến, và không thể xử lý hoàn tiền tức thì cho khách hàng tại chỗ.

## Quyết định kiến trúc: Barista VietQR Transfer Refund Flow
Hệ thống chọn giải pháp **Hoàn tiền qua chuẩn VietQR Napas247 có trợ giúp của nhân viên Barista tại quầy (Barista VietQR Transfer Refund Flow)**:
1. **Thu thập thông tin thụ hưởng:** Khi khách hàng gửi yêu cầu hủy đơn `PAID` (qua `POST /orders/:id/cancel`), khách nhập ngân hàng thụ hưởng và số tài khoản (STK).
2. **Khóa đơn & Thu hồi ưu đãi:** Trong một database transaction nguyên tử, đơn hàng chuyển sang `CANCELLED`, hoàn trả nguyên liệu tồn kho vào hệ thống, hoàn lại lượt sử dụng mã ưu đãi (promo code), thu hồi điểm thưởng đã tích của đơn và tạo bản ghi `Refund` với trạng thái `PENDING`.
3. **Độc lập trạng thái:** Trạng thái `Order.CANCELLED` độc lập hoàn toàn với vòng đời `Refund` (`PENDING -> IN_PROGRESS -> COMPLETED | FAILED | UNKNOWN`).
4. **Sinh mã VietQR chuẩn Napas247:** Trên màn hình Barista KDS (`/barista`), đơn hủy xuất hiện kèm cảnh báo nổi bật. Khi Barista mở chi tiết, hệ thống tự động sinh mã VietQR Napas247 chứa đầy đủ mã ngân hàng, STK, số tiền chính xác và nội dung chuyển tiền `Hoan tien don #ID`.
5. **Thực hiện & Xác nhận hoàn tiền:** Barista dùng ứng dụng ngân hàng di động quét mã QR để chuyển tiền hoàn trả tức thì 24/7 cho khách, sau đó bấm "Xác nhận đã chuyển hoàn tiền" (`PATCH /orders/:id/confirm-refund`). Cơ sở dữ liệu ghi nhận `refundedAt`, `refundedAmount`, và `refundRef: VIETQR:...`.
6. **Xử lý thất bại và đối soát:** Giao dịch thất bại được đánh dấu `FAILED` và cho phép thử lại có kiểm soát. Giao dịch chưa rõ kết quả được đánh dấu `UNKNOWN` để đối soát sao kê trước khi xử lý tiếp.
7. **Bãi bỏ điểm bù:** Khách nhận lại 100% tiền thực tế; không áp dụng chính sách cộng điểm bù `CREDIT_COMPENSATION`.
8. **Chặn trạng thái:** Đơn hàng từ bước `PREPARING` trở đi không được phép hủy (trả về lỗi HTTP 409 Conflict).

## Hệ quả tích cực
- **Tiền về ngay lập tức:** Khách nhận lại tiền trong 1 - 2 giây qua Napas247, không phải chờ đợi 7 - 14 ngày.
- **Tránh thất thoát & sai lệch số liệu:** Mã VietQR mã hóa sẵn số tiền và nội dung, Barista không thể chuyển sai số tiền hay nhầm số tài khoản.
- **Minh bạch cơ sở dữ liệu:** Cả thời điểm yêu cầu hủy, số tài khoản nhận tiền và thời điểm Barista hoàn tất đều được lưu trữ bền vững trong cơ sở dữ liệu PostgreSQL.
- **Đóng các rủi ro tồn đọng:** Giải quyết triệt để vấn đề tỷ giá điểm bù (O-01 cũ).

## Hạn chế/trade-off
- Cần thao tác quét mã và xác nhận từ phía nhân viên Barista trên màn hình KDS.

## Truy vết
[SRS](../../requirements/software-requirements-specification.md), [Ma trận](../../traceability-matrix.md), [Acceptance Test Catalog](../../quality/acceptance-test-catalog.md).

