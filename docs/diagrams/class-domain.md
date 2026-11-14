# Domain Model Definitions (A2 Schema)

- **User & LoyaltyTransaction:** Quản lý thông tin khách hàng. `LoyaltyTransaction` lưu vết tích điểm, hỗ trợ xử lý thu hồi (`reversedAt`) khi đơn bị hủy.
- **Product, Topping & Ingredient:** 
  - Tách biệt `Product/Topping` (thông tin bán hàng) và `Ingredient` (nguyên liệu tồn kho).
  - Quản lý định mức qua `ProductRecipe` và `ToppingRecipe`. Snapshot tiêu hao nguyên liệu ngay tại thời điểm đặt hàng.
- **Order & OrderItem:** Lưu chi tiết đơn. `OrderItem` lưu snapshot của topping và consumption dưới dạng JSON để tránh sai lệch lịch sử khi công thức/giá thay đổi.
- **Payment:** Quản lý thanh toán VNPay. 
  - Đảm bảo Idempotency (không trừ tiền 2 lần) thông qua `idempotencyKey` và `requestHash`.
  - Quá trình hoàn tiền (Refund) khi hủy đơn được gộp thẳng vào bản ghi Payment thông qua các field `refundedAt`, `refundedAmount`, và `refundRef` thay vì tách bảng riêng biệt.
- **StockMovement:** Ghi lại mọi biến động tồn kho (`ORDER_RESERVE`, `ORDER_RELEASE` khi hủy đơn, v.v.), giúp truy vết chính xác.