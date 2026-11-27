"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OrderConfirmationView } from "@/components/order-confirmation-view";

// Chức năng: Component giao diện CheckoutConfirmContent. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
function CheckoutConfirmContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("id") || "1042";

  return <OrderConfirmationView orderId={orderId} />;
}

// Chức năng: Component giao diện CheckoutConfirmPage. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
export default function CheckoutConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
          <div className="w-10 h-10 border-4 border-amber-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutConfirmContent />
    </Suspense>
  );
}

