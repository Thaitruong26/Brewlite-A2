# Hướng dẫn sử dụng ứng dụng BrewLite (Mobile-First)

Tài liệu này hướng dẫn các thao tác cơ bản dành cho **Khách hàng (Customer)** và **Nhân viên pha chế (Barista)** trên giao diện web của hệ thống BrewLite.

---

## 1. Dành cho Khách hàng (Customer)

### Bước 1: Duyệt menu và tùy chỉnh đồ uống
1. Truy cập trang chủ BrewLite trên trình duyệt điện thoại hoặc máy tính.
2. Duyệt danh sách đồ uống theo danh mục hoặc xem chi tiết từng sản phẩm.
3. Chọn **Kích cỡ (Size)**, **Topping** kèm theo và số lượng mong muốn, sau đó nhấn **Thêm vào giỏ hàng**.

### Bước 2: Quản lý giỏ hàng và tạo đơn
1. Mở biểu tượng **Giỏ hàng** trên thanh điều hướng.
2. Kiểm tra lại danh sách món, điều chỉnh số lượng hoặc xóa món nếu cần, áp dụng mã khuyến mãi (nếu có).
3. Đăng nhập tài khoản (hệ thống yêu cầu xác thực JWT trước khi đặt đơn) và nhấn **Đặt hàng**.

### Bước 3: Thanh toán qua VNPay Sandbox
1. Tại màn hình thanh toán, chọn phương thức **VNPay** (hoặc Mock Provider trong môi trường kiểm thử nội bộ).
2. Hệ thống chuyển hướng sang cổng **VNPay Sandbox**; nhập thông tin thẻ test để xác nhận giao dịch.
3. Sau khi thanh toán hoàn tất, hệ thống tự động điều hướng về trang xác nhận đơn hàng và cập nhật trạng thái sang `PAID` thông qua IPN/Return URL.

### Bước 4: Theo dõi và hủy đơn hàng
1. Vào mục **Lịch sử đơn hàng** để theo dõi trạng thái xử lý theo thời gian thực (`PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`).
2. **Quy định hủy đơn:**
   - Khách hàng chỉ có thể yêu cầu hủy khi đơn đang ở trạng thái **`PENDING`**, **`PAYMENT_FAILED`** hoặc **`PAID`**.
   - Nếu hủy đơn đã thanh toán (`PAID`), hệ thống tự động gửi yêu cầu hoàn tiền (**Refund**). Trong trường hợp cổng thanh toán hoàn tiền thất bại, hệ thống sẽ tự động cộng **điểm tích lũy bù** có giá trị tương đương vào tài khoản của bạn.

---

## 2. Dành cho Quầy pha chế (Barista)

1. Đăng nhập bằng tài khoản có quyền **Barista / Admin**.
2. Truy cập màn hình quản lý đơn hàng để xem danh sách các đơn đã thanh toán (`PAID`).
3. Cập nhật tiến độ pha chế theo từng giai đoạn (`PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`) để khách hàng nhận thông báo kịp thời.
