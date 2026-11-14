# Tài liệu Dự án BrewLite – Assignment 2 (Nhóm 13)

Thư mục `docs/` lưu trữ toàn bộ tạo phẩm phân tích, thiết kế, kiến trúc, kiểm thử và hướng dẫn vận hành của hệ thống **BrewLite** (ứng dụng đặt đồ uống trực tuyến mobile-first tích hợp thanh toán VNPay Sandbox).

---

## 1. Cấu trúc thư mục tài liệu

| Thư mục / Tệp | Nội dung chính | Task & Phụ trách |
|---|---|---|
| [`requirements/`](./requirements/) | Bối cảnh, stakeholder, phạm vi, SRS (FR/NFR, MoSCoW) và đặc tả Use-case thanh toán | Task 1.1 – 1.3 (Loan, Khôi, Quang Huy) |
| [`diagrams/`](./diagrams/) | Nguồn PlantUML (`.puml`) và ảnh xuất (`.svg`, `.png`) cho Use-case, Activity, Sequence, Class, Architecture và Deployment | Task 1.2 – 3.2 (Khôi, Quang Huy, Nghĩa, Khánh Huy, Thái) |
| [`architecture/`](./architecture/) | Mô tả kiến trúc hệ thống (Next.js, NestJS, PostgreSQL) và các bản ghi quyết định kiến trúc (`adr/*.md`) | Task 3.1 (Trương Quốc Thái) |
| [`quality/`](./quality/) | Checklist kiểm tra chéo tạo phẩm Task 1–3, nguồn gốc tạo phẩm và báo cáo xác nhận chất lượng | Task 4.2 (Lê Khánh Linh) |
| [`traceability-matrix.md`](./traceability-matrix.md) | Ma trận truy vết từ Yêu cầu (FR/NFR) $\rightarrow$ Use-case/Sơ đồ $\rightarrow$ API $\rightarrow$ Test case | Task 4.2 (Lê Khánh Linh) |
| [`deployment.md`](./deployment.md) | Hướng dẫn cấu hình môi trường local, CI/CD và triển khai production | Task 3.2, 5.3 (Trương Quốc Thái) |
| [`user-guide.md`](./user-guide.md) | Hướng dẫn sử dụng giao diện đặt món, thanh toán VNPay và theo dõi/hủy đơn | Task 4.2 (Lê Khánh Linh) |

---

## 2. Quy ước quản lý & cập nhật tài liệu

1. **Đồng bộ giữa mã nguồn và tài liệu:** Mọi thay đổi liên quan đến luồng nghiệp vụ, API endpoint, trạng thái đơn hàng hoặc schema dữ liệu phải được cập nhật đồng thời vào `docs/` và [`traceability-matrix.md`](./traceability-matrix.md) trong cùng Pull Request.
2. **Định dạng sơ đồ chuẩn:** Mọi sơ đồ trong `diagrams/` phải có đủ tệp nguồn `.puml` đi kèm bản xuất `.svg` (hoặc `.png`) để đảm bảo khả năng bảo trì và hiển thị trực tiếp trên GitHub.
3. **Quy tắc nghiệp vụ cốt lõi (Baseline A2):**
   - Tích hợp thanh toán **VNPay Sandbox** (kèm Mock PaymentProvider cho kiểm thử).
   - Trạng thái đơn hàng được phép hủy: `PENDING`, `PAYMENT_FAILED` và `PAID`.
   - Hủy đơn ở trạng thái `PAID` bắt buộc kích hoạt luồng hoàn tiền (`refund`); trường hợp hoàn tiền thất bại sẽ tự động ghi nhận điểm bù tương đương có kiểm soát **idempotency**.
4. **Quy trình duyệt (Review):** Tài liệu được cập nhật trên nhánh riêng (`docs/...`), mở Pull Request và phải được tối thiểu 01 thành viên review trước khi merge vào `main`.
