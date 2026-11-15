# ADR-006 — State machine cancel + refund + điểm bù (Cơ chế cũ)

- **Trạng thái:** SUPERSEDED by ADR-009 / D-07
- **Ngày tạo ban đầu:** 2026-11-14
- **Liên quan:** FR-20..30; NFR-06/10; Quyết định D-06 cũ

## Bối cảnh lịch sử
Ban đầu hệ thống dự kiến tích hợp trực tiếp API Refund tự động của VNPay và cấp điểm thưởng bù (`CREDIT_COMPENSATION`) trong trường hợp VNPay xác nhận hoàn tiền thất bại.

## Quyết định cũ
Cancel PENDING/PAYMENT_FAILED release; PAID refund qua API cổng thanh toán trước; confirmed FAILED -> CANCELLED + one compensation ledger; UNKNOWN chờ reconcile, khóa Barista; PREPARING+ 409.

## Lý do thay thế
1. VNPay Sandbox và môi trường ngân hàng thực tế yêu cầu thủ tục đối soát phức tạp (7 - 14 ngày làm việc) không phù hợp cho mô hình hoàn trả tức thì tại quán cà phê.
2. Việc cấp điểm thưởng bù `CREDIT_COMPENSATION` gây rủi ro thất thoát doanh thu, phát sinh vấn đề tỷ giá quy đổi điểm phức tạp (O-01) và không đáp ứng nhu cầu nhận lại tiền mặt thực tế của khách hàng.
3. Quyết định D-07 và ADR-009 chính thức thay thế toàn bộ cơ chế này bằng **Hoàn tiền chuyển khoản thủ công qua VietQR Napas247 tại quầy Barista**.

## Truy vết
Xem tài liệu kế thừa tại [ADR-009](009-manual-vietqr-refund.md).
