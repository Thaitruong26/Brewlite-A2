# Ma trận truy vết (Traceability Matrix) – BrewLite Assignment 2

Nối chuỗi truy vết: **Mã yêu cầu (FR) → Use-case/User Story → Thiết kế/Sơ đồ → Code/API → Test**

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ | Code / API | Test tương ứng | Trạng thái |
|---|---|---|---|---|---|
| **FR-01** | US-01 Xem menu sản phẩm | Activity-01, Class-01 | `GET /products` (`apps/api`) | `products.service.spec.ts` | Sẵn sàng |
| **FR-02** | US-02 Xem chi tiết sản phẩm | Activity-01, Class-01 | `GET /products/:id` (`apps/api`) | `products.service.spec.ts` | Sẵn sàng |
| **FR-03** | US-03 Quản lý giỏ hàng | Activity-01 | `apps/web/src/store/cart.ts` | Cart UI verification | Sẵn sàng |
| **FR-04** | US-04 Tạo đơn hàng | Sequence-01, Class-01 | `POST /orders` (`apps/api`) | `orders.service.spec.ts`, E2E real DB test | Sẵn sàng |
| **FR-05** | UC-01 Đặt & Thanh toán (Trọng tâm) | Sequence-01 (Checkout) | `POST /payments` (`apps/api`) | `payments.service.spec.ts` | Sẵn sàng |
| **FR-06** | US-06 Lịch sử và theo dõi đơn hàng | Activity-01 | `GET /orders/my-orders`, `GET /orders/:id` | `orders.service.spec.ts` | Sẵn sàng |
| **FR-07** | US-07 Quản lý đơn quầy Barista | Activity-01 | `GET /orders`, `PATCH /orders/:id/status` | `orders.service.spec.ts` | Sẵn sàng |
| **FR-08** | US-08 Điểm thưởng & Khuyến mãi | Sequence-01 | `GET /auth/me`, `POST /orders` | `orders.service.spec.ts`, `pricing.service.spec.ts` | Sẵn sàng |
