
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/require-auth";
import { getOrder, type OrderResponse } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

// Chức năng: Xử lý tính toán / định dạng dữ liệu (formatVnd). Cách hoạt động: Biến đổi tham số đầu vào (amount) thành kết quả chuẩn để hiển thị hoặc tính toán.
const formatVnd = (amount: number) =>
  `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;

const statusTitle: Record<string, string> = {
  PENDING: "Đang chờ thanh toán",
  PAID: "Thanh toán thành công",
  PREPARING: "Đơn hàng đang được pha chế",
  READY: "Đồ uống đã sẵn sàng",
  COMPLETED: "Đơn hàng đã hoàn tất",
  PAYMENT_FAILED: "Thanh toán thất bại",
  CANCELLED: "Đơn hàng đã hủy",
};

// Chức năng: Component giao diện OrderConfirmationContent. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
function OrderConfirmationContent() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    // Chức năng: Hàm loadOrder. Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
    async function loadOrder() {
      if (!Number.isInteger(orderId) || orderId <= 0) {
        setError("Mã đơn hàng không hợp lệ.");
        setLoading(false);
        return;
      }

      try {
        const result = await getOrder(orderId);
        if (active) setOrder(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError && err.status === 404
              ? "Không tìm thấy đơn hàng."
              : "Không thể tải thông tin đơn hàng. Vui lòng thử lại.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOrder();

    return () => {
      active = false;
    };
  }, [orderId]);

  const isPaidStatus = Boolean(
    order && ["PAID", "PREPARING", "READY", "COMPLETED"].includes(order.status)
  );
  const isPending = order?.status === "PENDING";

  return (
    <RequireAuth>
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-12">
        <section className="rounded-2xl border border-gray-200 p-6 sm:p-8">
          <div className="text-center">
            {isPaidStatus ? (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
                ✓
              </div>
            ) : isPending ? (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
                ⏱
              </div>
            ) : (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-700">
                ✕
              </div>
            )}
            <h1 className="mt-4 text-2xl font-bold text-[#183d2c]">
              {order ? statusTitle[order.status] || "Thông tin đơn hàng" : "Thông tin đơn hàng"}
            </h1>
            <p className="mt-2 text-gray-600">
              Cảm ơn bạn đã đặt hàng tại BrewLite.
            </p>
          </div>

          {loading ? (
            <p className="mt-8 text-center text-gray-500">
              Đang tải thông tin đơn hàng...
            </p>
          ) : error ? (
            <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </p>
          ) : order ? (
            <div className="mt-8">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Mã đơn hàng</p>
                <p className="mt-1 text-lg font-bold text-[#183d2c]">
                  {order.code || `#${order.id}`}
                </p>
                <p className="mt-3 text-sm text-gray-500">Trạng thái</p>
                <p className="mt-1 font-medium">{order.status}</p>
              </div>

              <h2 className="mt-6 font-semibold">Chi tiết đơn hàng</h2>
              <ul className="mt-3 divide-y divide-gray-100">
                {order.items.map((item, index) => (
                  <li
                    key={`${item.productId}-${item.size}-${index}`}
                    className="flex justify-between gap-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-500">
                        Cỡ {item.size} · Số lượng {item.qty}
                      </p>
                    </div>
                    <p className="shrink-0 font-medium">
                      {formatVnd(item.lineTotal)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-lg font-bold">
                <span>
                  {order.status === "CANCELLED"
                    ? "Giá trị đơn đã hủy"
                    : isPaidStatus
                      ? "Tổng đã thanh toán"
                      : "Tổng tiền đơn hàng"}
                </span>
                <span>{formatVnd(order.total)}</span>
              </div>

              {typeof order.pointsEarned === "number" && (
                <p className="mt-3 text-sm text-green-700">
                  Bạn nhận được {order.pointsEarned} điểm thưởng.
                </p>
              )}

              {order.status === "READY" && (
                <p className="mt-6 rounded-xl bg-amber-50 p-4 text-center font-medium text-amber-900 animate-pulse">
                  ☕ Mời tới quầy lấy nước!
                </p>
              )}
            </div>
          ) : null}

          <Link
            href="/menu"
            className="mt-6 block rounded-xl bg-[#183d2c] px-5 py-3 text-center font-semibold text-white hover:bg-[#24563e]"
          >
            Quay lại thực đơn
          </Link>
        </section>
      </main>
    </RequireAuth>
  );
}

// Chức năng: Component giao diện OrderConfirmationPage. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-2xl px-4 py-12 text-center text-gray-500">
          Đang tải thông tin đơn hàng...
        </main>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
