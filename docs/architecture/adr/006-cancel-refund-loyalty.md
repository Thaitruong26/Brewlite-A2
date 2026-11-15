# ADR-006 — Quy trình hoàn tiền chuyển khoản VietQR tại quầy Barista (Barista QR Refund Flow)

- **Trạng thái:** Accepted (Thay thế cơ chế mock refund/asynchronous bank gateway refund bằng Napas247 VietQR)
- **Ngày:** 2026-11-15
- **Liên quan:** FR-23..28; NFR-06/10; UC-10; Task 10

## Bối cảnh
Khi khách hàng hủy một đơn hàng đã thanh toán (`PAID`), hệ thống cần một cơ chế hoàn trả tiền minh bạch, an toàn, không làm thất thoát ngân quỹ và phù hợp với mô hình vận hành thực tế tại quán cà phê. Việc gọi trực tiếp API Refund tự động của các cổng thanh toán ngân hàng truyền thống thường yêu cầu thời gian đối soát kéo dài (7 - 14 ngày làm việc), phụ thuộc vào tài khoản doanh nghiệp đã kích hoạt tính năng hoàn tiền trực tuyến, và không thể xử lý hoàn tiền tức thì cho khách hàng tại quầy.

## Quyết định kiến trúc: Barista VietQR Transfer Refund Flow
Hệ thống chọn giải pháp **Hoàn tiền qua chuẩn VietQR Napas247 có trợ giúp của nhân viên Barista tại quầy (Barista VietQR Transfer Refund Flow)**:
1. **Thu thập thông tin thụ hưởng:** Khi khách hàng gửi yêu cầu hủy đơn `PAID` (qua `POST /orders/:id/cancel`), khách nhập ngân hàng thụ hưởng và số tài khoản (STK).
2. **Khóa đơn & Thu hồi ưu đãi:** Đơn hàng chuyển sang `CANCELLED`, hoàn trả nguyên liệu tồn kho vào hệ thống, hoàn lại lượt sử dụng mã ưu đãi (promo code), và thu hồi điểm thưởng đã tích của đơn.
3. **Sinh mã VietQR chuẩn Napas247:** Trên màn hình Barista KDS (`/barista`), đơn hủy xuất hiện kèm cảnh báo nổi bật. Khi Barista mở chi tiết, hệ thống tự động sinh mã VietQR Napas247 chứa đầy đủ mã ngân hàng, STK, số tiền chính xác và nội dung chuyển tiền `Hoan tien don #ID`.
4. **Thực hiện & Xác nhận hoàn tiền:** Barista dùng ứng dụng ngân hàng di động quét mã QR để chuyển tiền hoàn trả tức thì 24/7 cho khách, sau đó bấm "Xác nhận đã chuyển hoàn tiền" (`PATCH /orders/:id/confirm-refund`). Cơ sở dữ liệu ghi nhận `refundedAt`, `refundedAmount`, và `refundRef: VIETQR:...`.
5. **Chặn trạng thái:** Đơn hàng từ bước `PREPARING` trở đi không được phép hủy (trả về lỗi HTTP 409 Conflict).

## Hệ quả tích cực
- **Tiền về ngay lập tức:** Khách nhận lại tiền trong 1 - 2 giây qua Napas247, không phải chờ đợi 7 - 14 ngày đối soát.
- **Tránh thất thoát & sai lệch số liệu:** Mã VietQR mã hóa sẵn số tiền và nội dung, Barista không thể chuyển sai số tiền hay nhầm số tài khoản.
- **Minh bạch cơ sở dữ liệu:** Cả thời điểm yêu cầu hủy, số tài khoản nhận tiền và thời điểm Barista hoàn tất đều được lưu trữ bền vững trong bảng `Payment` trên cơ sở dữ liệu PostgreSQL.

## Hạn chế/trade-off
- Cần thao tác quét mã và xác nhận từ phía nhân viên Barista trên màn hình KDS.

## Truy vết
[SRS](../../requirements/software-requirements-specification.md), [Ma trận](../../traceability-matrix.md), [Acceptance Test Catalog](../../quality/acceptance-test-catalog.md).
