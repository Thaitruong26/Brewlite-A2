import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartBar } from "@/components/layout/cart-bar";

/* ── Google Fonts qua next/font (zero layout shift, tự host) ── */
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      data-theme="light"
      style={{ colorScheme: "light" }}
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="min-h-screen min-h-dvh bg-[#f5f7f2] md:bg-[#eaede6] text-[#21372b] antialiased selection:bg-emerald-500 selection:text-white">
        <AppProviders>
          {/* 
            Mobile-First Shell:
            - Trên điện thoại thật (mobile): Chiếm trọn 100% màn hình, không khung viền giả lập, cuộn tự nhiên mượt mà theo trình duyệt điện thoại.
            - Trên máy tính (desktop): Căn giữa gọn gàng dạng mobile container (max-w-[440px]) với viền mềm và đổ bóng tinh tế.
          */}
          <div className="mx-auto w-full max-w-[440px] min-h-screen min-h-dvh bg-[#f5f7f2] flex flex-col relative md:shadow-2xl md:border-x md:border-[#e2e6dc]">
            {/* Header ứng dụng di động */}
            <SiteHeader />

            {/* Vùng nội dung màn hình chính - cuộn tự nhiên, padding đáy để không bị BottomNav và CartBar che */}
            <main className="flex-1 w-full pb-28">
              {children}
            </main>

            {/* Thanh giỏ hàng nổi khi có món */}
            <CartBar />

            {/* Thanh điều hướng cố định dưới đáy */}
            <BottomNav />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
