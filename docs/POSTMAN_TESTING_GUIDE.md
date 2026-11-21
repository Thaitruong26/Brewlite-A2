# Hướng dẫn Import và Test API BrewLite trong Postman

Dự án đã tích hợp sẵn 2 định dạng chuẩn để bạn có thể import và test ngay trong Postman một cách dễ dàng và tự động nhất.

---

## 1. Cách 1: Kéo thả file Collection đã cấu hình sẵn (Khuyên dùng ⭐)

Trong thư mục `docs/`, hệ thống đã sinh sẵn file collection Postman v2.1 với đầy đủ 34 API và cấu hình thông minh:
- **File:** [BrewLite_API.postman_collection.json](file:///e:/brewlite-a2/docs/BrewLite_API.postman_collection.json)
- **Điểm nổi bật:**
  1. **Tự động lưu Token JWT:** Khi bạn gọi API `POST /api/auth/login`, script tự động trích xuất `access_token` và lưu vào biến `{{accessToken}}` của Postman. Mọi API cần đăng nhập (Barista, Admin, Khách) sẽ tự động nhận token mà bạn không cần copy-paste thủ công.
  2. **Tự sinh `idempotency-key`:** Tự động điền biến `{{$guid}}` trong Header của các request tạo đơn, thanh toán để chống trừ tiền 2 lần.
  3. **Đã có sẵn Body mẫu:** Các request `POST`/`PUT`/`PATCH` đều được điền sẵn payload JSON thực tế (tạo đơn, thêm nguyên liệu, hủy đơn kèm STK, xác nhận hoàn tiền).

### Các bước thực hiện:
1. Mở ứng dụng **Postman**.
2. Bấm nút **Import** (ở góc trên cùng bên trái).
3. Kéo và thả file `docs/BrewLite_API.postman_collection.json` vào khung Import (hoặc bấm *files* và chọn file).
4. Bấm **Import**. Bạn sẽ thấy Collection **`BrewLite API - Postman Collection`** xuất hiện với 9 folder module rõ ràng.

---

## 2. Cách 2: Import trực tiếp bằng Link Swagger / OpenAPI JSON

Nếu backend đang chạy (local hoặc trên Render), bạn có thể import trực tiếp qua URL:

1. Trong Postman, bấm **Import**.
2. Dán đường dẫn URL sau vào ô tìm kiếm/nhập link:
   - **Local:** `http://localhost:4000/api/docs-json`
   - **Render Production:** `https://<backend-subdomain>.onrender.com/api/docs-json`
3. Chọn **OpenAPI 3.0** -> Bấm **Import as: Postman Collection**.

---

## 3. Cách 3: Import từ file OpenAPI / Swagger JSON gốc

Nếu muốn Postman tự parse cấu trúc OpenAPI 3.0 tiêu chuẩn:
1. Trong Postman, bấm **Import**.
2. Chọn file [brewlite-api.swagger.json](file:///e:/brewlite-a2/docs/brewlite-api.swagger.json).
3. Bấm **Import**.

---

## 4. Hướng dẫn Test luồng nghiệp vụ thực tế (Flow Test)

### Bước 1: Cấu hình biến môi trường
Mặc định Collection sử dụng biến `baseUrl` là `http://localhost:4000/api`.
- Nếu test trên server Render, bạn chỉ cần click vào Collection **BrewLite API - Postman Collection** -> tab **Variables** -> sửa giá trị `baseUrl` thành `https://<backend-render-domain>/api`.

### Bước 2: Đăng nhập nhận quyền
1. Mở folder **Auth Module** -> chọn **`POST Đăng nhập, trả về JWT access_token`**.
2. Bấm **Send**.
3. *Kết quả:* Đăng nhập thành công và mã `access_token` sẽ tự động được gán vào biến môi trường để dùng cho các request tiếp theo.
   - Tài khoản Barista mẫu: `barista1` / `Password123!`
   - Tài khoản Khách hàng mẫu: `customer1` / `Password123!`

### Bước 3: Xem thực đơn (Menu)
1. Mở folder **Products Module** -> chọn **`GET Lấy danh sách sản phẩm (menu)`**.
2. Bấm **Send** để lấy danh sách món và id size.

### Bước 4: Tạo đơn hàng
1. Mở folder **Orders Module** -> chọn **`POST Tạo đơn hàng mới`**.
2. Body mẫu đã có sẵn thông tin món và số bàn. Bấm **Send**.
3. Lưu lại `orderId` trả về trong phản hồi JSON (ví dụ đơn #10).

### Bước 5: Thanh toán đơn hàng
- **Cách A - Giả lập thanh toán (Simulate):**
  - Mở folder **Payments Module** -> chọn **`POST payments/vnpay/simulate-complete`**.
  - Nhập `orderId` vừa tạo và bấm **Send**. Đơn sẽ lập tức chuyển sang trạng thái `PAID`.
- **Cách B - Lấy Link VNPay Sandbox thật:**
  - Chọn **`POST payments/vnpay/create-url`** -> Bấm **Send** -> Click vào đường link trả về để mở cổng thanh toán sandbox của VNPay trên trình duyệt.

### Bước 6: Barista cập nhật tiến độ pha chế
1. Đăng nhập bằng tài khoản Barista (`barista1`).
2. Mở folder **Orders Module** -> chọn **`PATCH Cập nhật trạng thái đơn hàng (Barista)`**.
3. Điền `:id` đơn hàng và chọn trạng thái `PREPARING`, `READY`, hoặc `COMPLETED`.

### Bước 7: Test hủy đơn & Hoàn tiền (Refund)
1. Chọn **`POST Khách hủy đơn hàng`**: Điền lý do và thông tin số tài khoản nhận hoàn tiền (`bankCode`, `accountNumber`, `accountHolder`).
2. Chọn **`PATCH Xác nhận đã hoàn tiền thành công`**: Barista nhập mã giao dịch ngân hàng `transactionCode` để kết thúc hoàn tiền.
