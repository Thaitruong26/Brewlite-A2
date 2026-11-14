"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore, selectTotalItems, selectTotalAmount } from "@/store/cart-store";

const formatVnd = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount);

function CartBarContent() {
  const pathname = usePathname();
  const totalItems = useCartStore(selectTotalItems);
  const totalAmount = useCartStore(selectTotalAmount);

  if (pathname?.startsWith("/barista") || totalItems === 0) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 mx-auto w-full max-w-[440px] px-3 pb-2 mb-[env(safe-area-inset-bottom,0px)] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      <Link
        href="/cart"
        className="pointer-events-auto flex items-center justify-between rounded-2xl bg-[#183d2c] px-4 py-3 shadow-xl transition-all duration-200 hover:bg-[#24563e] active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          {/* Cart icon */}
          <span className="relative flex size-9 items-center justify-center rounded-full bg-white/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#e8f5e2] text-[9px] font-bold text-[#183d2c]">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          </span>
          <div className="leading-tight">
            <p className="text-xs text-white/75">{totalItems} món trong giỏ</p>
            <p className="text-sm font-bold text-white">{formatVnd(totalAmount)} đ</p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-[#183d2c] shadow-sm">
          Xem giỏ
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
            <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
          </svg>
        </span>
      </Link>
    </div>
  );
}

/**
 * Thanh tóm tắt giỏ hàng nổi — hiển thị phía trên BottomNav khi giỏ có ít nhất 1 món.
 */
export function CartBar() {
  return (
    <Suspense fallback={null}>
      <CartBarContent />
    </Suspense>
  );
}
