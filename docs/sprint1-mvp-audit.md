# Sprint 1 MVP – rà soát source snapshot

> Phạm vi rà soát: luồng xem menu sản phẩm (MVP Sprint 1). Nội dung dưới đây ghi nhận những gì đang có trong source; đây không phải kết quả chạy test trên môi trường thực tế.

## 1. Backend

- `GET /api/products`: đã khai báo trong `apps/api/src/products/products.controller.ts`.
- `GET /api/products/:id`: đã khai báo trong cùng controller.
- `ProductsService.findAll()` lọc sản phẩm `isActive`, hỗ trợ `search`, `category`, phân trang và trả metadata.
- Số lượng tồn khả dụng được tính từ công thức nguyên liệu thông qua `RecipeService.maxCups()`.
- `ProductsService.findOne()` trả chi tiết sản phẩm, sizes và toppings; sản phẩm không tồn tại/ngừng bán trả `NotFoundException`.
- `GetProductsDto` giới hạn `page >= 1`, `1 <= limit <= 50`.
- `products.service.spec.ts` có kiểm thử danh sách, lọc/tìm kiếm, danh sách rỗng, chi tiết và trường hợp không tìm thấy.

## 2. Frontend

- Trang menu: `apps/web/src/app/menu/page.tsx`.
- Gọi API qua `getProducts()` trong `apps/web/src/lib/api/products.ts`.
- Có loading skeleton, error state kèm retry, empty state.
- Có lọc danh mục; tìm kiếm tên hiện được thực hiện ở client trên dữ liệu đã tải.
- Có thể bật dữ liệu fixture để xem trước khi API lỗi; UI có nhãn cảnh báo dữ liệu mẫu.
- Có trang chi tiết sản phẩm tại `apps/web/src/app/products/[id]/page.tsx`.

## 3. Khoảng trống cần xử lý/kiểm tra

1. Chưa thấy bộ test component hoặc test giao diện cho trang menu trong `apps/web/package.json`; frontend hiện chưa khai báo script `test`.
2. `GET /api/products` và `GET /api/products/:id` cần được kiểm tra trên database đã migrate và seed, không chỉ dựa vào unit test mock.
3. Trang menu hiện tải tối đa 20 sản phẩm ở page 1; tìm kiếm đang lọc client-side trên tập dữ liệu đã tải. Nếu seed có hơn 20 sản phẩm, tìm kiếm có thể không bao phủ toàn bộ catalog.
4. Chưa chạy `npm test`, build backend/frontend hoặc E2E trong lần rà soát này vì ZIP source không kèm `node_modules`.

## 4. Kết luận theo source

Luồng xem menu đã có implementation ở cả backend và frontend, gồm loading/error/empty state và unit test cho service. Vì vậy không nên viết lại các chức năng này từ đầu. Phần tiếp theo nên tập trung vào kiểm thử chạy thật (API + UI), xử lý các khoảng trống ở mục 3 và ghi nhận kết quả chạy trên branch `Khanh-Huy`.
