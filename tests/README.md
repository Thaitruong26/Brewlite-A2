# Integration & E2E Tests – BrewLite

Thư mục lưu trữ các kịch bản kiểm thử tích hợp (Integration) và kiểm thử đầu-cuối (End-to-End) theo yêu cầu Task 5.2 của Assignment 2.

## Cấu trúc kiểm thử:
- `apps/api/test/`: Kiểm thử Unit test, Integration test và Concurrency test với cơ sở dữ liệu PostgreSQL thực tế (sử dụng Vitest).
- `tests/`: Kịch bản kiểm thử E2E liên module (luồng Đặt hàng - Thanh toán - Barista).
