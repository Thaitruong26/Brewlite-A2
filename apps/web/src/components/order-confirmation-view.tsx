"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CancelOrder } from "@/components/cancel-order";
import { ApiError, formatVND, getOrderByIdApi } from "@/lib/api";
import { OrderResponse, OrderStatus } from "@/types/order";

const statusTitle: Record<OrderStatus, string> = {
  PENDING: "Đang chờ nhân viên xác nhận",
  PAID: "Thanh toán thành công",
  PREPARING: "Đơn hàng đang được pha chế",
  READY: "Đồ uống đã sẵn sàng",
  COMPLETED: "Đơn hàng đã hoàn tất",
  PAYMENT_FAILED: "Thanh toán thất bại",
  CANCELLED: "Đơn hàng đã hủy",
};

const STATUS_BADGE_MAP: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "PENDING • Chờ nhân viên xác nhận",
    className: "bg-amber-100 text-amber-900 border-amber-300",
  },
  PAID: {
    label: "PAID • Đã thanh toán",
    className: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  PREPARING: {
    label: "PREPARING • Đang pha chế",
    className: "bg-blue-100 text-blue-900 border-blue-300",
  },
  READY: {
    label: "READY • Đã pha xong",
    className: "bg-purple-100 text-purple-900 border-purple-300",
  },
  COMPLETED: {
    label: "COMPLETED • Hoàn tất",
    className: "bg-stone-200 text-stone-800 border-stone-300",
  },
  PAYMENT_FAILED: {
    label: "PAYMENT_FAILED • Thanh toán lỗi",
    className: "bg-red-100 text-red-900 border-red-300",
  },
  CANCELLED: {
    label: "CANCELLED • Đã hủy",
    className: "bg-stone-100 text-stone-600 border-stone-300",
  },
};

const SIMPLIFIED_STEPS = [
  { key: "preparing", label: "Đang pha chế", icon: "☕", sub: "Quầy đang làm đồ uống" },
  { key: "ready", label: "Mời lấy nước", icon: "🔔", sub: "Đồ uống đã pha xong" },
  { key: "completed", label: "Hoàn tất", icon: "✓", sub: "Đã giao cho bạn" },
];

// Chức năng: Lấy dữ liệu SimplifiedStepIndex. Cách hoạt động: Truy vấn dữ liệu và trả về kết quả đã định dạng.
function getSimplifiedStepIndex(status: string): number {
  if (status === "READY") return 1;
  if (status === "COMPLETED") return 2;
  if (status === "CANCELLED" || status === "PAYMENT_FAILED" || status === "PENDING") return -1;
  return 0; 
}

const ORDER_STEPS: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PREPARING",
  "READY",
  "COMPLETED",
];

// Chức năng: Component giao diện OrderConfirmationView. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
export function OrderConfirmationView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<{
    statusCode: number;
    code: string;
    message: string;
  } | null>(null);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getOrderByIdApi(orderId);
      setOrder(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError({
          statusCode: err.statusCode,
          code: err.code,
          message: err.message,
        });
      } else {
        setError({
          statusCode: 500,
          code: "UNKNOWN_ERROR",
          message: "Không thể tải thông tin xác nhận đơn hàng.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    let ignore = false;
    let timer: any = null;

    // Chức năng: Hàm loadData(isPolling). Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
    async function loadData(isPolling = false) {
      try {
        const data = await getOrderByIdApi(orderId);
        if (!ignore) {
          setOrder(data);
          setError(null);
          if (!isPolling) setIsLoading(false);

          if (data.status !== "COMPLETED" && data.status !== "CANCELLED") {
            timer = setTimeout(() => {
              void loadData(true);
            }, 3000);
          }
        }
      } catch (err) {
        if (ignore) return;
        if (!isPolling) {
          setError({
            statusCode: err instanceof ApiError ? err.statusCode : 500,
            code: err instanceof ApiError ? err.code : "UNKNOWN_ERROR",
            message:
              err instanceof ApiError
                ? err.message
                : "Không thể tải thông tin xác nhận đơn hàng.",
          });
          setIsLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      ignore = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-amber-800 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-base font-semibold text-stone-800">
          Đang tải thông tin đơn hàng #{orderId}...
        </p>
        <p className="text-xs text-stone-500 mt-1">
          Đang gọi <code className="font-mono">GET /orders/{orderId}</code>
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-lg font-bold text-stone-900">
            Không thể tải đơn hàng #{orderId}
          </h1>
          <p className="text-xs font-mono text-red-700 bg-red-50 inline-block px-2.5 py-1 rounded mt-2">
            HTTP {error.statusCode} • {error.code}
          </p>
          <p className="text-sm text-stone-600 mt-3">{error.message}</p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={fetchOrder}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900 transition-colors cursor-pointer"
            >
              Thử tải lại (GET /orders/{orderId})
            </button>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const displayCode = order.code || `#${order.id}`;
  const statusBadge = STATUS_BADGE_MAP[order.status] || {
    label: order.status,
    className: "bg-stone-100 text-stone-800 border-stone-300",
  };
  const currentStepIdx = getSimplifiedStepIndex(order.status);
  const isPaidStatus = ["PAID", "PREPARING", "READY", "COMPLETED"].includes(order.status);
  const isPending = order.status === "PENDING";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-amber-900"
          >
            <span className="text-2xl">☕</span>
            <span>BrewLite</span>
          </Link>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/menu"
              className="text-stone-600 hover:text-amber-800 transition-colors"
            >
              Thực đơn
            </Link>
            <Link
              href="/checkout"
              className="text-stone-600 hover:text-amber-800 transition-colors"
            >
              Thanh toán
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Thẻ xác nhận chính: Mã đơn, trạng thái đơn hàng */}
        <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
          {/* Biểu tượng trạng thái: Chỉ hiện dấu ✓ màu xanh khi đã thanh toán thành công */}
          {isPaidStatus ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xs">
              ✓
            </div>
          ) : isPending ? (
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xs">
              ⏱
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xs">
              ✕
            </div>
          )}

          <p
            className={`text-xs font-bold uppercase tracking-widest ${
              isPaidStatus
                ? "text-emerald-700"
                : isPending
                  ? "text-amber-700"
                  : "text-red-700"
            }`}
          >
            {isPaidStatus
              ? "Xác nhận đơn hàng"
              : isPending
                ? "Chờ nhân viên xác nhận"
                : "Trạng thái đơn hàng"}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            {statusTitle[order.status] || "Thông tin đơn hàng"}
          </h1>

          {/* Mã đơn & Trạng thái */}
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 bg-stone-50 border border-stone-200 px-5 py-3 rounded-2xl">
            <div className="text-left">
              <span className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                Mã đơn hàng
              </span>
              <span className="text-2xl font-black text-amber-900 tracking-tight">
                {displayCode}
              </span>
            </div>

            <div className="h-8 w-px bg-stone-200 hidden sm:block" />

            <div className="text-left">
              <span className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                Trạng thái
              </span>
              <span
                className={`inline-block mt-0.5 px-3 py-0.5 rounded-full text-xs font-extrabold border ${statusBadge.className}`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Dòng chữ: "Mời tới quầy lấy nước" (Chỉ hiển thị khi đơn READY) */}
          {order.status === "READY" && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 max-w-md mx-auto animate-pulse">
              <p className="text-lg font-extrabold text-amber-950 flex items-center justify-center gap-2">
                <span>☕</span>
                <span>Mời tới quầy lấy nước</span>
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Đồ uống đã pha xong! Vui lòng đọc mã đơn <strong>{displayCode}</strong> cho Barista tại quầy nhận đồ uống.
              </p>
            </div>
          )}

          {/* Hướng dẫn khi đang chờ nhân viên xác nhận (PENDING) */}
          {order.status === "PENDING" && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 max-w-md mx-auto">
              <p className="text-base font-extrabold text-amber-950 flex items-center justify-center gap-2">
                <span>⏱</span>
                <span>Đơn hàng đang chờ nhân viên xác nhận</span>
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Vui lòng đợi trong giây lát, nhân viên quầy pha chế sẽ xác nhận và chuẩn bị đồ uống cho bạn.
              </p>
            </div>
          )}

          {/* Hướng dẫn khi thanh toán thất bại (PAYMENT_FAILED) */}
          {order.status === "PAYMENT_FAILED" && (
            <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 max-w-md mx-auto">
              <p className="text-base font-extrabold text-red-950 flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>Thanh toán không thành công</span>
              </p>
              <p className="text-xs text-red-800 mt-1">
                Giao dịch chưa hoàn tất hoặc bị từ chối. Quý khách có thể thử lại bằng phương thức khác.
              </p>
              <div className="mt-3">
                <Link
                  href={`/payment?orderId=${order.id}`}
                  className="inline-block px-5 py-2.5 rounded-xl bg-red-800 text-white font-bold text-xs hover:bg-red-900 transition-colors shadow-xs"
                >
                  Thử lại thanh toán →
                </Link>
              </div>
            </div>
          )}
          {/* Tiến trình trạng thái đơn hàng (State Machine) */}
          {currentStepIdx !== -1 && (
            <div className="mt-7 pt-6 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-500 mb-3">
                Tiến trình đơn hàng ({statusBadge.label})
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                {SIMPLIFIED_STEPS.map((step, index) => {
                  const isDone = index < currentStepIdx;
                  const isCurrent = index === currentStepIdx;
                  return (
                    <div
                      key={step.key}
                      className={`py-2.5 px-2 rounded-xl border transition-all text-center ${
                        isCurrent
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                          : isDone
                            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                            : "bg-stone-50 text-stone-400 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{isDone ? "✓" : step.icon}</span>
                        <span className="font-bold">{step.label}</span>
                      </div>
                      <div className={`mt-0.5 text-[10px] hidden sm:block ${isCurrent ? "text-emerald-100" : isDone ? "text-emerald-700" : "text-stone-400"}`}>
                        {step.sub}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden">
                {ORDER_STEPS.map((step, index) => {
                  const isDone = index <= currentStepIdx;
                  const isCurrent = index === currentStepIdx;
                  return (
                    <div
                      key={step}
                      className={`py-2 px-1 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                          : isDone
                            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                            : "bg-stone-50 text-stone-400 border-stone-200"
                      }`}
                    >
                      <div className="truncate">{step}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Điểm thưởng tích lũy */}
          {typeof order.pointsEarned === "number" && order.pointsEarned > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
              <span>🎁</span>
              <span>
                {order.status === "CANCELLED" ? <>Đã thu hồi <strong>{order.pointsEarned} điểm thưởng</strong> của đơn đã hủy.</> : <>Bạn đã được cộng <strong>+{order.pointsEarned} điểm thưởng</strong> tích lũy cho đơn này!</>}
              </span>
            </div>
          )}
        </section>

        {/* Chi tiết các món đã đặt */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
            <h2 className="text-base font-bold text-stone-900">
              Chi tiết đồ uống đã đặt
            </h2>
            <span className="text-xs text-stone-500">
              {new Date(order.createdAt).toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {order.items.map((item, idx) => (
              <div
                key={item.id || `${item.productId}-${idx}`}
                className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                    {item.qty}x
                  </span>
                  <div>
                    <h3 className="font-semibold text-stone-900 text-sm">
                      {item.productName}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-xs">
                        Size {item.size}
                      </span>
                      {item.toppings &&
                        item.toppings.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/60 text-xs"
                          >
                            + {t.name} ({formatVND(t.price)})
                          </span>
                        ))}
                    </div>
                    {item.note && (
                      <p className="text-xs text-stone-500 italic mt-1">
                        Ghi chú: &ldquo;{item.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-stone-900 text-sm">
                    {formatVND(item.lineTotal)}
                  </p>
                  <p className="text-xs text-stone-500">
                    {formatVND(item.unitPrice)} / ly
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tổng cộng tiền từ server */}
          <div className="mt-5 pt-4 border-t border-stone-200 space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Tạm tính</span>
              <span className="font-medium text-stone-900">
                {formatVND(order.subtotal)}
              </span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>
                  Giảm giá{" "}
                  {order.promoCode ? `(${order.promoCode})` : ""}
                </span>
                <span className="font-semibold">
                  -{formatVND(order.discountAmount)}
                </span>
              </div>
            )}

            {order.pointsUsed && order.pointsUsed > 0 ? (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Điểm thưởng đã dùng:</span>
                <span className="font-semibold">
                  -{formatVND(order.pointsUsed * 10)} ({order.pointsUsed} điểm)
                </span>
              </div>
            ) : null}

            {order.pointsEarned && order.pointsEarned > 0 ? (
              <div className="flex justify-between text-amber-900 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200/70 text-xs">
                <span>🎁 Điểm tích lũy nhận được:</span>
                <span className="font-bold">+{order.pointsEarned} điểm</span>
              </div>
            ) : null}

            <div className="flex justify-between items-baseline pt-2 border-t border-stone-100">
              <span className="font-bold text-stone-900">
                {order.status === "CANCELLED"
                  ? "Giá trị đơn đã hủy"
                  : isPaidStatus
                    ? "Tổng đã thanh toán"
                    : "Tổng tiền đơn hàng"}
              </span>
              <span className="text-xl font-extrabold text-amber-900">
                {formatVND(order.total)}
              </span>
            </div>
          </div>
        </section>

        {/* Thông tin giao dịch thanh toán (payments) */}
        {order.payments && order.payments.length > 0 ? (
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-3">
              Thông tin giao dịch thanh toán
            </h2>
            <div className="space-y-2.5">
              {order.payments.map((p, idx) => {
                const isSuccess = p.status === "SUCCESS";
                const isPending =
                  p.status === "PROCESSING" ||
                  (p.status as string) === "PENDING";
                const isRefunded = Boolean(p.refundedAt);

                return (
                  <div
                    key={p.id || idx}
                    className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <span>
                          Phương thức:{" "}
                          {p.method === "WALLET"
                            ? "Ví điện tử (WALLET)"
                            : p.method === "VNPAY"
                              ? "Cổng VNPay Sandbox"
                              : "Thẻ ngân hàng (CARD)"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            isRefunded
                              ? "bg-purple-100 text-purple-800"
                              : isSuccess
                                ? "bg-emerald-100 text-emerald-800"
                                : isPending
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isRefunded
                            ? "Đã hoàn tiền"
                            : isSuccess
                              ? "Đã thanh toán"
                              : isPending
                                ? "Chờ nhân viên xác nhận"
                                : "Thanh toán thất bại"}
                        </span>
                      </div>
                      {p.refundedAt && (
                        <p className="text-stone-600">
                          Đã hoàn tiền {formatVND(p.refundedAmount ?? p.amount)} ·{" "}
                          {new Date(p.refundedAt).toLocaleString("vi-VN")}
                        </p>
                      )}
                      {p.providerRef && (
                        <p className="text-stone-500 font-mono">
                          Mã giao dịch: {p.providerRef}
                        </p>
                      )}
                    </div>
                    <div className="font-bold text-sm text-stone-900">
                      {formatVND(p.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : order.status === "PENDING" ? (
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-3">
              Thông tin giao dịch thanh toán
            </h2>
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                  <span>Trạng thái:</span>
                  <span className="px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Chờ nhân viên xác nhận
                  </span>
                </div>
                <p className="text-stone-500">
                  Chưa ghi nhận giao dịch thanh toán thành công cho đơn hàng này.
                </p>
              </div>
              <div className="font-bold text-sm text-amber-900">
                {formatVND(order.total)}
              </div>
            </div>
          </section>
        ) : order.status === "PAYMENT_FAILED" ? (
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-3">
              Thông tin giao dịch thanh toán
            </h2>
            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                  <span>Trạng thái:</span>
                  <span className="px-2 py-0.5 rounded font-semibold bg-red-100 text-red-800 border border-red-300">
                    Thanh toán thất bại
                  </span>
                </div>
                <p className="text-stone-500">
                  Giao dịch thanh toán chưa thành công hoặc đã bị từ chối/hủy.
                </p>
              </div>
              <div className="font-bold text-sm text-red-900">
                {formatVND(order.total)}
              </div>
            </div>
          </section>
        ) : null}

        {/* Các nút điều hướng cuối trang */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-amber-800 text-white font-semibold text-sm text-center hover:bg-amber-900 transition-colors shadow-sm"
          >
            Về trang chủ
          </Link>
          <Link
            href="/menu"
            className="px-6 py-3 rounded-xl border border-stone-300 bg-white text-stone-700 font-semibold text-sm text-center hover:bg-stone-50 transition-colors"
          >
            Đặt thêm đồ uống
          </Link>
          <Link
            href="/orders"
            className="px-6 py-3 rounded-xl border border-stone-300 bg-white text-stone-700 font-semibold text-sm text-center hover:bg-stone-50 transition-colors"
          >
            Lịch sử đơn hàng
          </Link>
          <CancelOrder compact key={order.id} order={order} onRefresh={fetchOrder} onCancelled={() => setOrder((current) => current ? { ...current, status: "CANCELLED" } : current)} />
        </div>
      </main>
    </div>
  );
}

