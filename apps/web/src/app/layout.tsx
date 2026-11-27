import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartBar } from "@/components/layout/cart-bar";

const inter = { variable: "--font-inter" };
const playfair = { variable: "--font-playfair" };

export const metadata: Metadata = {
  title: {
    default: "BrewLite — Cà phê, theo cách của bạn",
    template: "%s | BrewLite",
  },
  description: "Khám phá thực đơn BrewLite và đặt món yêu thích.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BrewLite",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f5f7f2",
};

// Chức năng: Component giao diện RootLayout. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      data-theme="light"
      style={{ colorScheme: "light" }}
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="min-h-screen min-h-dvh bg-[#f5f7f2] text-[#21372b] antialiased selection:bg-emerald-500 selection:text-white">
        <AppProviders>
          {/* 
            Responsive Layout Shell:
            - Trên điện thoại (mobile): Chiếm trọn 100% màn hình, điều hướng dưới đáy (BottomNav) tự nhiên.
            - Trên máy tính (desktop): Tự động mở rộng sang chuẩn website hiện đại (max-w-7xl), thanh điều hướng ngang trên Header.
          */}
          <div className="mx-auto w-full max-w-7xl min-h-screen min-h-dvh bg-[#f5f7f2] flex flex-col relative md:shadow-xs overflow-x-clip">
            {/* Header ứng dụng di động & Desktop navbar */}
            <SiteHeader />

            {/* Vùng nội dung chính - pb-28 trên mobile để tránh thanh đáy, md:pb-12 trên desktop */}
            <main className="flex-1 w-full pb-28 md:pb-12">
              {children}
            </main>

            {/* Thanh giỏ hàng nổi khi có món (Mobile only) */}
            <CartBar />

            {/* Thanh điều hướng cố định dưới đáy (Mobile only) */}
            <BottomNav />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
