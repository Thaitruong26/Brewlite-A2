# Task 2.3 - Class Domain Model

Tài liệu này định nghĩa các thực thể (Entities) và quan hệ cốt lõi của hệ thống BrewLite A2, ánh xạ 1:1 từ sơ đồ `class-domain.puml`.

## Các Domain chính:
1. **User & Role**: `User` phân quyền qua `Role` (CUSTOMER, BARISTA, MANAGER). Quản lý lịch sử `Order` và `LoyaltyTransaction`.
2. **Catalog**: `Product` chứa nhiều `ProductVariant` (định nghĩa size và `priceVnd`).
3. **Order & Checkout**: `Order` chứa `OrderItem`. Ràng buộc chặt chẽ với `InventoryReservation` (giữ kho) và `PromotionRedemption` (giữ khuyến mãi).
4. **Payment Integration**: 
   - Sử dụng interface `PaymentProvider` (có `VNPaySandboxAdapter` và `MockPaymentAdapter`).
   - `Payment` chứa các `PaymentAttempt` để ghi nhận `idempotencyKey` và `providerTxnRef` chống duplicate transaction.
5. **Refund & Cancellation**: `CancellationRequest` quản lý yêu cầu hủy. `Refund` xử lý tiền hoàn với các trạng thái `SUCCESS/FAILED/UNKNOWN`.
6. **Loyalty & Compensation**: `LoyaltyTransaction` ghi nhận tích/tiêu điểm. Ràng buộc đặc biệt: 1 `Refund` có thể tạo ra tối đa 1 `LoyaltyTransaction` loại `CREDIT_COMPENSATION` (điểm bù) khi lỗi hoàn tiền.