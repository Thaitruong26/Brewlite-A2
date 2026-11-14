# ☕ BrewLite — Hệ Thống Đặt Cà Phê & Quản Lý Quầy Không Dùng Tiền Mặt (Assignment 2)

> **Trường Đại học Sài Gòn (SGU) — Khoa Công nghệ Thông tin**  
> **Môn học:** Công nghệ Phần mềm | **Học kỳ:** I, Năm học 2026–2027  
> **Đồ án:** Assignment 2 — Hệ thống BrewLite Monorepo (Next.js 16 + NestJS + PostgreSQL)  
> **Quy trình phát triển:** Agile Scrum

---

## 👥 Danh sách thành viên nhóm phát triển (Assignment 2)

| STT | Họ và tên | GitHub / Email | Vai trò & Đóng góp chính |
|:---:|---|---|---|
| 1 | **Thái Trương** (Trưởng nhóm) | `Truongquocthai627@gmail.com` | Quản lý kiến trúc, Backend Core, tích hợp thanh toán VNPAY & VietQR, tối ưu hiệu năng |
| 2 | **Anh Khôi** | `anhkhoi05082006@gmail.com` | Đặc tả yêu cầu SRS (Task 1.2), Thiết kế Class Diagram (Task 2.3), E2E Test (Task 5.2) |
| 3 | **Nguyễn Thị Loan** | `nt-loan` | Giao diện Web Mobile-first, Trang chi tiết món, Layout & UX giỏ hàng (Task 1.1) |
| 4 | **Lê Khánh Linh** | `khlink06@gmail.com` | Quản lý tài liệu kỹ thuật, Hướng dẫn sử dụng, Ma trận truy vết (Task 4.2) |
| 5 | **Kiều Ngọc Nghĩa** | `kieungocnghia1142006@gmail.com` | Sơ đồ luồng Activity Diagram thanh toán VNPAY & hoàn tiền (Task 2.1) |
| 6 | **Trần Quang Huy** | `tranquanghuy2k6.no.pro@gmail.com` | Dịch vụ thanh toán, Kiểm thử dịch vụ và tối ưu giao dịch |
| 7 | **Khánh Huy** | `khanhhuy2006huy@gmail.com` | Thiết kế giao diện Barista, Kiểm thử luồng xử lý đơn hàng |

---

## 📌 1. Giới thiệu tổng quan (Project Overview)

**BrewLite** là nền tảng ứng dụng đặt đồ uống và quản lý vận hành quầy pha chế theo định hướng **không dùng tiền mặt (cashless)**, giải quyết bài toán quá tải và giảm thiểu thời gian chờ đợi vào các khung giờ cao điểm tại quầy cà phê khuôn viên trường học/văn phòng.

### 🎯 Sứ mệnh & Tầm nhìn
> *"BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy; đồng thời cung cấp công cụ quản lý hàng đợi và kiểm soát kho nguyên liệu chính xác cho Barista."*

### 📱 Đối tượng & Phân hệ
* **Khách hàng (Customer Web Mobile-First):** Xem thực đơn tức thì (0s delay), chọn size/topping, áp mã voucher, dùng điểm thưởng, thanh toán qua cổng VNPAY Sandbox hoặc mã VietQR Napas247, theo dõi đơn và gửi yêu cầu hủy đơn nhận hoàn tiền.
* **Nhân viên pha chế (Barista KDS & Kho):** Tiếp nhận đơn tự động theo thời gian thực, chuyển trạng thái pha chế, kiểm soát tồn kho theo định lượng công thức, và xử lý hoàn tiền tại quầy qua mã QR khi đơn bị hủy.

---

## 🛠️ 2. Kiến trúc & Công nghệ (Tech Stack)

Hệ thống cấu trúc Monorepo phân tách rõ rệt:
```
apps/web (Next.js 16 App Router) ──[REST API / JWT]──> apps/api (NestJS) ──> Prisma ORM ──> PostgreSQL 16
```

* **Frontend (`apps/web`):**
  * [Next.js 16](https://nextjs.org/) (App Router, Turbopack/Webpack) & [React 19](https://react.dev/)
  * [Tailwind CSS v4](https://tailwindcss.com/) — Thiết kế giao diện mobile-first tối ưu trải nghiệm chạm
  * [Zustand](https://github.com/pmndrs/zustand) — Quản lý State giỏ hàng, thông tin phiên đăng nhập
  * [TanStack Query](https://tanstack.com/query) — Caching thông minh (StaleTime 60s), loại bỏ độ trễ skeleton menu
  * [Lucide React](https://lucide.dev/) — Icon trực quan
* **Backend (`apps/api`):**
  * [NestJS 12](https://nestjs.com/) (Node.js/TypeScript, chuẩn ESM)
  * [Prisma ORM 7](https://www.prisma.io/) — Schema, migration và truy vấn CSDL
  * [PostgreSQL 16](https://www.postgresql.org/) — CSDL quan hệ chính
  * [VNPAY SDK & Napas247 VietQR Standard](https://sandbox.vnpayment.vn/) — Cổng thanh toán trực tuyến
* **DevOps & Testing:**
  * [Docker & Docker Compose](https://www.docker.com/) — Container hóa đa nền tảng
  * [Vitest](https://vitest.dev/) — Bộ Unit Test (86 tests) và Concurrency E2E Test (11 tests)
  * [GitHub Actions](https://github.com/features/actions) — Pipeline CI/CD tự động kiểm tra Lint, Test, Build

---

## 🌟 3. Các tính năng nổi bật (Key Features)

### 3.1. Trải nghiệm Khách hàng (Customer Portal)
* **Menu tải tức thì (Instant 0s Loading):** Caching sản phẩm thông minh, hiển thị ngay danh mục đồ uống nổi bật mà không bị nhấp nháy skeleton xám trên thiết bị di động.
* **Tùy biến món & Giỏ hàng:** Chọn kích cỡ (S/M/L), thêm topping (Trân châu, Thạch củ năng, Kem cheese...), kèm ghi chú khẩu vị cho barista.
* **Thanh toán chuẩn kép:**
  * **Cổng VNPAY Sandbox chính thức:** Tích hợp kiểm thử thẻ nội địa NCB, thẻ quốc tế, quét mã VNPAY-QR.
  * **Mã VietQR Napas247:** Quét nhanh bằng 100% ứng dụng ngân hàng thật tại Việt Nam (Vietcombank, MB, Techcombank, VPBank,...) với số tiền và nội dung đơn được điền tự động.
* **Hủy đơn & Hoàn tiền minh bạch:** Cho phép khách hàng hủy đơn khi ở trạng thái `PAID` và nhập thông tin tài khoản để Barista hoàn tiền.

### 3.2. Quầy pha chế & Vận hành (Barista KDS)
* **Bảng điều phối đơn thông minh:** Phân loại theo hàng đợi (`Chờ TT`, `Đã hủy`, `Đang làm`, `Làm xong`, `Lịch sử`).
* **Hộp thoại hoàn tiền nhanh (`Refund Modal`):** Banner cảnh báo đỏ nổi bật khi có đơn hủy, tích hợp nút **"💸 Trả lại tiền cho khách (Hiện mã QR)"** để Barista quét mã VietQR và hoàn tiền ngay tại quầy.
* **Quản lý kho theo định lượng công thức:** Giám sát 34 loại nguyên liệu theo gam/ml, tự động cảnh báo nguyên liệu sắp hết và tính toán số ly tối đa có thể phục vụ.

---

## 🚀 4. Hướng dẫn khởi chạy hệ thống (Getting Started)

### Cách 1: Chạy trọn gói qua Docker Compose (Khuyên dùng khi chấm bài)

Chỉ với **1 lệnh duy nhất**, toàn bộ PostgreSQL, Backend và Frontend sẽ tự động build, migrate schema, nạp dữ liệu mẫu và chạy đồng bộ:

```bash
docker compose up --build
```

Sau khi khởi chạy thành công:
* 🌐 **Giao diện Khách hàng:** [http://localhost:3000](http://localhost:3000) (hoặc `http://localhost:3001` nếu dùng cấu hình port mapping)
* 🍵 **Màn hình quầy Barista:** [http://localhost:3000/barista](http://localhost:3000/barista)
* 🔌 **Backend API:** [http://localhost:4000/api](http://localhost:4000/api)
* 📚 **Swagger API Docs:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

### Cách 2: Chạy môi trường Development (Thủ công)

#### Yêu cầu:
* **Node.js** v22 trở lên.
* Bật **Docker Desktop** để chạy Database PostgreSQL.

#### Bước 1: Khởi động Database:
```bash
docker compose up -d db
```

#### Bước 2: Khởi động Backend (`apps/api`):
```bash
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

#### Bước 3: Khởi động Frontend (`apps/web`):
```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

---

## 💳 5. Hướng dẫn thử nghiệm Luồng Thanh toán & Hoàn tiền (Test Payment Guide)

### 5.1. Thử nghiệm Thanh toán VNPAY Sandbox (Thẻ thử nghiệm)

Khi đặt đơn và chọn phương thức **Cổng VNPAY (Sandbox)**, bạn sẽ được chuyển hướng tới trang thanh toán chính thức của VNPAY. Sử dụng thông tin thẻ thử nghiệm sau để thanh toán:

| Trường thông tin | Giá trị kiểm thử VNPAY Sandbox |
|---|---|
| **Ngân hàng** | `NCB` |
| **Số thẻ** | `9704198526191432198` |
| **Tên chủ thẻ** | `NGUYEN VAN A` |
| **Ngày phát hành** | `07/15` |
| **Mật khẩu OTP** | `123456` |

*Sau khi bấm "Xác nhận", VNPAY sẽ chuyển về màn hình thông báo thanh toán thành công, cộng điểm tích lũy thành viên và chuyển đơn sang hàng đợi Barista.*

---

### 5.2. Thử nghiệm Thanh toán VietQR Napas247 (Tài khoản thật)

Nếu muốn trải nghiệm quét mã qua ứng dụng ngân hàng thật trên điện thoại:
1. Tại trang thanh toán, hệ thống hiển thị mã **VietQR Napas247**.
2. Mở bất kỳ ứng dụng ngân hàng nào (Vietcombank, MB Bank, Techcombank, TPBank,...) và chọn tính năng **Quét mã QR**.
3. Ứng dụng ngân hàng sẽ tự động nhận diện:
   * **Ngân hàng thụ hưởng:** Vietcombank (VCB)
   * **Số tài khoản:** `1040263376` (BREWLITE)
   * **Số tiền:** Điền đúng theo tổng tiền đơn hàng.
   * **Nội dung chuyển khoản:** `BREWLITE DH{Mã_Đơn_Hàng}` (hiện rõ mã đơn hàng).
4. **Quy tắc bắt buộc:** Mọi thanh toán phải có xác nhận đã nhận được tiền mới chuyển trang cho khách:
   * Barista tại màn hình [`/barista`](http://localhost:3000/barista) kiểm tra tài khoản và bấm **"✓ Xác nhận đã nhận tiền (PAID)"**, hoặc trên màn hình thanh toán bấm **"⚡ Xác nhận đã nhận tiền (Dành cho Barista / Demo)"**.
   * Hệ thống xác nhận trạng thái `PAID` thành công, hiển thị thông báo nhận tiền và tự động chuyển khách sang trang nhận nước [`/orders/{id}`].

---

### 5.3. Thử nghiệm Luồng Hủy đơn & Barista Hoàn tiền

1. **Khách hàng hủy đơn:**
   * Tại trang theo dõi đơn hàng [`/orders/{id}`](http://localhost:3000/orders), khi đơn ở trạng thái `PAID` (Đã thanh toán), bấm nút **"Hủy đơn hàng"**.
   * Nhập lý do hủy và thông tin nhận hoàn tiền (Ngân hàng & Số tài khoản).
2. **Barista xử lý hoàn tiền:**
   * Barista mở màn hình [`/barista`](http://localhost:3000/barista), tab **"Đã hủy"** sẽ có cờ đỏ cảnh báo: *🚨 Có X đơn đã hủy cần hoàn trả tiền*.
   * Barista bấm **"💸 Trả lại tiền cho khách (Hiện mã QR)"**.
   * Cửa sổ QR hoàn tiền bật lên với đúng số tiền và thông tin tài khoản khách, Barista dùng app ngân hàng quét mã để chuyển trả tiền cho khách ngay lập tức.

---

## 🔑 6. Tài khoản kiểm thử có sẵn (Demo Accounts)

| Vai trò | Email đăng nhập | Mật khẩu | Chức năng kiểm thử |
|---|---|---|---|
| **Nhân viên Barista** | `barista@brewlite.com` | `Barista@123` | Quản lý quầy KDS, xác nhận đơn, xử lý hoàn tiền QR, quản lý kho |
| **Khách hàng mẫu** | `demo@brewlite.com` | `Demo@1234` | Đặt hàng, đổi size/topping, dùng điểm thưởng, hủy đơn |
| **Mã giảm giá mẫu** | `WELCOME50` (Giảm 50%, tối đa 25.000đ), `FREESHIP` (Giảm 15.000đ) |

---

## 📁 7. Cấu trúc thư mục Monorepo

```
brewlite/
├── apps/
│   ├── api/                      # Backend Service (NestJS 12 + Prisma 7)
│   │   ├── prisma/               # Schema PostgreSQL, Migrations và Seed
│   │   ├── src/                  # Modules: auth, orders, payments, products, ingredients
│   │   └── test/                 # Bộ kiểm thử Unit & Concurrency E2E
│   └── web/                      # Frontend Web App (Next.js 16 + Tailwind CSS v4)
│       ├── public/               # Tài nguyên tĩnh và hình ảnh đồ uống
│       └── src/
│           ├── app/              # Next.js App Router (menu, cart, checkout, payment, barista)
│           ├── components/       # UI Components (Header, Footer, Modals, QR generator)
│           ├── lib/              # API Client, Dev Products Fallback, Utils
│           └── store/            # Quản lý Global State (Zustand: Cart, Auth, Stock)
├── docs/                         # Toàn bộ tạo phẩm thiết kế & tài liệu Assignment 2
│   ├── requirements/             # Task 1: Bối cảnh, SRS, Use-case specifications
│   ├── diagrams/                 # Task 2: Activity, Sequence, Class Diagrams
│   ├── architecture/             # Task 3: 8 ADRs, Logical & Deployment Diagrams
│   ├── traceability-matrix.md     # Ma trận truy vết từ yêu cầu đến mã nguồn và kiểm thử
│   └── user-guide.md             # Hướng dẫn chi tiết người dùng và Barista
├── tests/                        # Task 5: Integration & E2E Tests mở rộng
├── .github/workflows/            # CI/CD Pipelines
│   ├── ci.yml                    # Tự động hóa Lint, Unit Test, Build khi có PR
│   └── cd.yml                    # Tự động đóng gói & phát hành Docker Image
├── docker-compose.yml            # Khởi chạy một chạm Database, Backend và Frontend
└── README.md                     # Tài liệu hướng dẫn đồ án
```

---

## 🧪 8. Kiểm thử tự động (Automated Testing)

```bash
# Chạy Unit Tests Backend (86 tests)
npm --prefix apps/api run test

# Chạy End-to-End Tests Backend (11 tests)
npm --prefix apps/api run test:e2e

# Kiểm tra build ứng dụng Web Frontend
npm --prefix apps/web run build
```

---

## 🔄 9. Quy trình CI/CD (GitHub Actions)

1. **Continuous Integration (`ci.yml`):**
   * Tự động kích hoạt khi có commit/pull request vào nhánh `main` và `develop`.
   * Chạy song song: Lint (ESLint, Oxlint) -> Unit Tests -> E2E Tests -> Build NestJS & Next.js -> Docker Compose Validation.
2. **Continuous Deployment (`cd.yml`):**
   * Đóng gói Docker Image tự động khi merge vào nhánh `main` và đẩy lên GitHub Container Registry (GHCR).
