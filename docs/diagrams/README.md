# Sequence diagrams – BrewLite A2

## UC-01: Đặt & Thanh toán đơn hàng

- Source: `sequence-payment.puml`
- Actor và thành phần được đối chiếu từ `apps/web`, `apps/api/src/payments` và `apps/api/src/orders` trong source snapshot.
- Đây là bản sơ đồ kỹ thuật dựa trên implementation hiện tại; nhóm cần đối chiếu lại tên bước/luồng ngoại lệ với đặc tả use-case Task 1.3 trước khi nghiệm thu.

### Lưu ý về implementation

`PaymentsService.createPayment()` hiện xác định kết quả qua `dto.mockResult` và tạo response với `providerRef: null`. Trong hàm này chưa có lời gọi tới cổng thanh toán bên ngoài. Vì vậy sơ đồ mô tả đúng luồng mô phỏng thanh toán hiện tại, không mô tả VNPAY/MoMo như thể đã tích hợp thật.

### Render

Mở file `.puml` bằng PlantUML (VS Code extension hoặc PlantUML CLI) để xuất SVG/PNG. Không chỉnh sơ đồ thành luồng tích hợp payment gateway thật nếu source chưa có adapter/callback tương ứng.
