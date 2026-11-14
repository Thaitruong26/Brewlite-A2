# Decision register — BrewLite A2

**Decision baseline:** 14/11/2026. Các quyết định D-01..D-06 là quyết định **đã chốt do nhóm cung cấp**, có hiệu lực với toàn bộ Task 1–3. Thiết kế sau đây là **đề xuất mới**, chưa phải mã nguồn thực thi.

| ID | Trạng thái | Quyết định | Ảnh hưởng |
|---|---|---|---|
| D-01 | LOCKED | A2 viết source/repository mới (`apps/web`, `apps/api`, `docs`), chỉ kế thừa nghiệp vụ A1 | ADR-001; Task 4 |
| D-02 | LOCKED | Web mobile-first: dọc, một cột, bottom navigation; PWA install tùy chọn | NFR-07; ADR-002 |
| D-03 | LOCKED | Hoàn tất Task 1–3 trước khi code | Quy trình, traceability |
| D-04 | LOCKED | VNPay Sandbox **Must** qua `PaymentProvider`; Mock provider phục vụ test/demo | FR-12..18; ADR-004 |
| D-05 | LOCKED | Hủy chỉ PENDING / PAYMENT_FAILED / PAID; từ PREPARING trở đi HTTP 409 | FR-22..25; UC-09/10 |
| D-06 | LOCKED | Refund xác nhận thất bại: vẫn CANCELLED, lưu Refund FAILED, cộng điểm bù tương đương, idempotent | FR-26..28; ADR-006 |
| O-01 | BLOCKER / OPEN | Tỷ lệ `R = số VND / 1 điểm` và độ chính xác/rounding cho điểm bù; tài liệu **không tự chốt** | FR-26, TC-27, schema Decimal |
| O-02 | OPEN | Nền tảng production thực tế chưa được nhóm chọn. Sơ đồ Task 3.2 là **Render proposed** | ADR-007; DEP-01 |
| O-03 | OPEN | Chính sách hết hạn PENDING, thời gian giữ kho, xử lý giao dịch VNPay về muộn | FR-08..09, 17, UC-07 |
| O-04 | OPEN | Refund request khi VNPay trả timeout/UNKNOWN: thời hạn đối soát, escalation, disable kitchen | FR-28; ADR-006 |
| O-05 | OPEN | Nhóm có thông tin TMN Code/HashSecret sandbox, return/IPN URL public hay chưa | Task 5.1 |
| O-06 | OPEN | Các chỉ tiêu NFR p95/availability được đề xuất cho UAT, cần duyệt cùng môi trường đo | NFR-01, NFR-02 |

## Invariants (bắt buộc thống nhất)

- `OrderStatus`: `PENDING`, `PAYMENT_FAILED`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`.
- Customer không thể hủy ở/qua `PREPARING`; khi PAID có `CancellationRequest` chờ refund, ngăn Barista nhận pha chế.
- Refund **FAILED được xác nhận** mới cấp điểm bù. Timeout/UNKNOWN **không được** suy diễn là FAILED; đối soát sau.
- Điểm bù có `originRefundId` duy nhất; tiền bù được tính từ **số tiền thực tế cần hoàn**, không phải giá niêm yết.
- Nếu reconciliation về sau phát hiện refund đã thành công khi đã cấp điểm bù, đánh dấu `RECONCILIATION_REQUIRED` và xử lý có audit (không âm thầm phát quà hai lần).
- `vnp_ReturnUrl` chỉ hiển thị thông tin; IPN có chữ ký hợp lệ (hoặc QueryDr đã xác minh) mới quyết định `PAID`.
