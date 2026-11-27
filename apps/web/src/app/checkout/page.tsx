"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  api,
  ApiError,
  createOrderApi,
  createPaymentApi,
  createVnpayUrlApi,
  formatVND,
  getAccessToken,
  saveSession,
} from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { calculateItemUnitPrice, useCartStore } from "@/store/cart-store";
import {
  CreateOrderDto,
  CreatePaymentDto,
  MockPaymentResult,
  OrderResponse,
  PaymentMethod,
} from "@/types/order";

// Chức năng: Hàm generateUUID. Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Chức năng: Component giao diện CheckoutPage. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    items,
    promoCode,
    discountAmount: storeDiscountAmount,
    clearCart,
    getSubtotal,
    getTotal,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("VNPAY");
  const [mockResult, setMockResult] = useState<MockPaymentResult>("SUCCESS");
  const [useRewardPoints, setUseRewardPoints] = useState<boolean>(false);

  const [currentOrder, setCurrentOrder] = useState<OrderResponse | null>(null);

  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [lastUsedKey, setLastUsedKey] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [stepStatus, setStepStatus] = useState<
    "IDLE" | "CREATING_ORDER" | "PROCESSING_PAYMENT"
  >("IDLE");
  const [errorState, setErrorState] = useState<{
    statusCode: number;
    code: string;
    message: string;
    replayed?: boolean;
  } | null>(null);
  const [replayNotice, setReplayNotice] = useState<string | null>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setIdempotencyKey(generateUUID());
      if (typeof window !== "undefined") {
        setUseRewardPoints(localStorage.getItem("useRewardPoints") === "true");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Chức năng: Xử lý sự kiện SelectMethod. Cách hoạt động: Nhận sự kiện từ giao diện, cập nhật state hoặc gọi API xử lý nghiệp vụ tương ứng.
  const handleSelectMethod = (method: PaymentMethod) => {
    if (method !== paymentMethod) {
      setPaymentMethod(method);
      setIdempotencyKey(generateUUID());
      setErrorState(null);
      setReplayNotice(null);
    }
  };

  const clientSubtotal = mounted ? getSubtotal() : 0;
  const clientTotal = mounted ? getTotal() : 0;
  const clientDiscount = Math.max(0, clientSubtotal - clientTotal);

  const displaySubtotal = currentOrder ? currentOrder.subtotal : clientSubtotal;
  const displayDiscount = currentOrder
    ? currentOrder.discountAmount
    : clientDiscount || storeDiscountAmount;
  const displayTotal = currentOrder ? currentOrder.total : clientTotal;
  const displayPromoCode = currentOrder
    ? currentOrder.promoCode
    : promoCode || null;

  // Chức năng: Xử lý sự kiện ConfirmPayment. Cách hoạt động: Nhận sự kiện từ giao diện, cập nhật state hoặc gọi API xử lý nghiệp vụ tương ứng.
  const handleConfirmPayment = async (options?: {
    forceNewKey?: boolean;
    customKey?: string;
  }) => {
    if (items.length === 0 && !currentOrder) return;

    setIsSubmitting(true);
    setErrorState(null);
    setReplayNotice(null);

    const activeKey =
      options?.customKey ||
      (options?.forceNewKey ? generateUUID() : idempotencyKey || generateUUID());

    if (activeKey !== idempotencyKey) {
      setIdempotencyKey(activeKey);
    }

    try {
      let orderToPay = currentOrder;

      if (!orderToPay) {
        setStepStatus("CREATING_ORDER");
        const orderDto: CreateOrderDto = {
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            toppingIds: (item.toppings || []).map((t) => t.id),
            quantity: item.quantity ?? item.qty ?? 1,
            ...(item.note ? { note: item.note } : {}),
          })),
          ...(promoCode ? { promoCode: promoCode.trim().toUpperCase() } : {}),
          ...(useRewardPoints ? { usePoints: true } : {}),
        };

        orderToPay = await createOrderApi(orderDto);
        setCurrentOrder(orderToPay);

        if (typeof window !== "undefined") {
          localStorage.removeItem("useRewardPoints");
        }
        try {
          const freshUser = await api<any>("/auth/me");
          if (freshUser && typeof freshUser.loyaltyPoints === "number") {
            const token = getAccessToken();
            if (token) {
              saveSession(token, freshUser);
              useAuthStore.getState().setSession(token, freshUser);
            }
          }
        } catch {}
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }

      if (paymentMethod === "VNPAY") {
        setStepStatus("PROCESSING_PAYMENT");
        const { paymentUrl } = await createVnpayUrlApi(orderToPay.id);

        if (!paymentUrl) {
          throw new Error("Không tạo được URL thanh toán VNPay");
        }

        clearCart();
        window.location.assign(paymentUrl);
        return;
      }

      clearCart();
      router.push(`/payment?orderId=${orderToPay.id}&method=${paymentMethod}`);
      return;
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorState({
          statusCode: err.statusCode,
          code: err.code,
          message: err.message,
          replayed: err.replayed,
        });

        if (err.statusCode === 402) {
          setCurrentOrder((prev) =>
            prev ? { ...prev, status: "PAYMENT_FAILED" } : prev
          );
          setIdempotencyKey(generateUUID());
        }
      } else {
        setErrorState({
          statusCode: 500,
          code: "UNEXPECTED_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi không xác định.",
        });
      }
    } finally {
      setIsSubmitting(false);
      setStepStatus("IDLE");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-stone-600">
            Đang tải trang thanh toán...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
      {/* Tiêu đề trang */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[#183d2c]">Thanh toán</h1>
        <Link
          href="/cart"
          className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200"
        >
          Giỏ hàng ({items.reduce((sum, i) => sum + i.quantity, 0)})
        </Link>
      </div>

      <main className="w-full">
        {/* Nếu giỏ hàng trống và chưa có đơn */}
        {items.length === 0 && !currentOrder ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center max-w-lg mx-auto shadow-sm">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-xl font-bold text-stone-900">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Vui lòng chọn đồ uống từ thực đơn để tiếp tục đặt hàng và thanh toán.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/menu"
                className="px-5 py-2.5 rounded-xl bg-[#183d2c] text-white text-sm font-semibold hover:bg-[#133023] transition-colors"
              >
                Khám phá Thực đơn
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
            {/* Khối trái: Chi tiết đơn hàng */}
            <div className="space-y-6 w-full lg:col-span-7 xl:col-span-7">
              <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
                  <div>
                    <h1 className="text-xl font-bold text-stone-900">
                      Chi tiết đơn hàng
                    </h1>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Kiểm tra lại đồ uống, size và topping trước khi thanh toán
                    </p>
                  </div>

                  {currentOrder ? (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        currentOrder.status === "PAYMENT_FAILED"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}
                    >
                      Đơn {currentOrder.code || `#${currentOrder.id}`} •{" "}
                      {currentOrder.status}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                      {items.reduce((sum, i) => sum + i.quantity, 0)} phần
                    </span>
                  )}
                </div>

                {/* Danh sách món */}
                <div className="divide-y divide-stone-100">
                  {currentOrder
                    ? currentOrder.items.map((item, idx) => (
                        <div
                          key={`${item.productId}-${item.size}-${idx}`}
                          className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-lg font-bold text-amber-900 shrink-0">
                              {item.qty}x
                            </div>
                            <div>
                              <h3 className="font-semibold text-stone-900">
                                {item.productName}
                              </h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium">
                                  Size {item.size}
                                </span>
                                {item.toppings && item.toppings.length > 0 ? (
                                  item.toppings.map((t) => (
                                    <span
                                      key={t.id}
                                      className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60 text-xs"
                                    >
                                      + {t.name} ({formatVND(t.price)})
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-stone-400">
                                    Không topping
                                  </span>
                                )}
                              </div>
                              {item.note && (
                                <p className="text-xs text-stone-500 italic mt-1">
                                  Ghi chú: &ldquo;{item.note}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-stone-900">
                              {formatVND(item.lineTotal)}
                            </p>
                            <p className="text-xs text-stone-500">
                              {formatVND(item.unitPrice)} / ly
                            </p>
                          </div>
                        </div>
                      ))
                    : items.map((item, idx) => {
                        const unitPrice = calculateItemUnitPrice(item);
                        const lineTotal = unitPrice * item.quantity;
                        return (
                          <div
                            key={item.id || `${item.productId}-${item.size}-${idx}`}
                            className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                          >
                            <div className="flex items-start gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl || "/img/cappuccino.jpg"}
                                alt={item.productName}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "/img/ca-phe-sua.jpg";
                                }}
                                className="w-14 h-14 rounded-xl object-cover border border-stone-200 bg-stone-100 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-stone-900">
                                    {item.productName}
                                  </h3>
                                  <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                                    x{item.quantity}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium">
                                    Size {item.size}
                                    {item.sizeSurcharge > 0
                                      ? ` (+${formatVND(item.sizeSurcharge)})`
                                      : ""}
                                  </span>
                                  {item.toppings.map((t) => (
                                    <span
                                      key={t.id}
                                      className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60 text-xs"
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
                              <p className="font-semibold text-stone-900">
                                {formatVND(lineTotal)}
                              </p>
                              <p className="text-xs text-stone-500">
                                {formatVND(unitPrice)} / ly
                              </p>
                            </div>
                          </div>
                        );
                      })}
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>
                    Giỏ hàng được tự động lưu an toàn trong suốt quá trình đặt món.
                  </span>
                </div>
              </section>
            </div>

            {/* Khối phải: Chọn phương thức Ví / Thẻ & Tổng tiền & Nút Xác nhận trả */}
            <div className="space-y-6 w-full lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24">
              <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-stone-900">
                    Phương thức thanh toán
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold shrink-0">
                    💳 Không tiền mặt
                  </span>
                </div>

                {/* Chọn VNPay Sandbox (Bắt buộc ADR-004), Ví điện tử hoặc Thẻ */}
                <div className="space-y-3" role="radiogroup" aria-label="Phương thức thanh toán">
                  {/* Cổng VNPay Sandbox */}
                  <label
                    onClick={() => handleSelectMethod("VNPAY")}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paymentMethod === "VNPAY"
                        ? "border-[#183d2c] bg-emerald-50/70 shadow-xs"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={paymentMethod === "VNPAY"}
                      onChange={() => handleSelectMethod("VNPAY")}
                      className="mt-1 accent-[#183d2c]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5 flex-wrap">
                          VNPay Sandbox
                          <span className="text-[10px] font-bold bg-[#183d2c] text-white px-2 py-0.5 rounded-full shrink-0">
                            Cổng trực tuyến
                          </span>
                        </span>
                        <span className="text-xl">🏦</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        Cổng thanh toán quốc dân: Quét mã QR ngân hàng hoặc thẻ ATM nội địa NCB.
                      </p>
                      {paymentMethod === "VNPAY" && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-100/70 text-[11px] text-emerald-950 border border-emerald-200 space-y-1">
                          <p className="font-bold">💳 Thông tin thẻ thử nghiệm (Ngân hàng NCB):</p>
                          <p>Số thẻ: <span className="font-mono font-bold">9704198526191432198</span></p>
                          <p>Tên chủ thẻ: <span className="font-bold">NGUYEN VAN A</span> | Ngày phát hành: <span className="font-bold">07/15</span></p>
                          <p>Mã OTP xác thực: <span className="font-mono font-bold">123456</span></p>
                        </div>
                      )}
                    </div>
                  </label>

                </div>

                {/* Bảng tính tổng tiền */}
                <div className="mt-6 pt-5 border-t border-stone-200 space-y-2.5 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} món)</span>
                    <span className="font-medium text-stone-900">
                      {formatVND(displaySubtotal)}
                    </span>
                  </div>

                  {displayDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>
                        Giảm giá{" "}
                        {displayPromoCode ? (
                          <code className="font-mono text-xs bg-emerald-100 px-1.5 py-0.5 rounded">
                            {displayPromoCode}
                          </code>
                        ) : null}
                      </span>
                      <span className="font-semibold">
                        -{formatVND(displayDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-3 border-t border-stone-200">
                    <div>
                      <span className="text-base font-bold text-stone-900">
                        Tổng thanh toán
                      </span>
                      <p className="text-[11px] text-stone-500">
                        {currentOrder
                          ? "Số tiền chính thức do Server tính (POST /orders)"
                          : "Sẽ được Server xác nhận khi tạo đơn"}
                      </p>
                    </div>
                    <span className="text-2xl font-extrabold text-amber-900">
                      {formatVND(displayTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200/70">
                    <span>🎁 Điểm thưởng dự kiến (+1 điểm / 1.000đ):</span>
                    <span className="font-bold">
                      +{Math.floor(displayTotal / 1000)} điểm
                    </span>
                  </div>
                </div>

                {/* Thông báo Replay nếu có */}
                {replayNotice && (
                  <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                    <strong>🔁 Idempotent Replay:</strong> {replayNotice}
                  </div>
                )}

                {/* Hiển thị lỗi (Đặc biệt là lỗi 402 PAYMENT_FAILED) */}
                {errorState && (
                  <div
                    role="alert"
                    className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>
                          {errorState.statusCode === 402
                            ? "Thanh toán thất bại (HTTP 402)"
                            : `Lỗi (${errorState.code})`}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold">
                        {errorState.code}
                      </span>
                    </div>

                    <p className="text-xs text-red-800 leading-relaxed">
                      {errorState.message}
                    </p>

                    {errorState.replayed && (
                      <p className="text-[11px] font-medium text-red-700 bg-red-100/80 px-2.5 py-1 rounded">
                        🔁 Kết quả này được trả lại từ snapshot cũ (<code className="font-mono">Idempotent-Replayed: true</code>) do gửi trùng Idempotency-Key!
                      </p>
                    )}

                    {errorState.statusCode === 402 && (
                      <div className="pt-2 border-t border-red-200/80 space-y-2">
                        <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                          ✓ Giỏ hàng của bạn vẫn được giữ nguyên. Đơn{" "}
                          <strong>{currentOrder?.code || `#${currentOrder?.id}`}</strong>{" "}
                          đang ở trạng thái <code className="font-mono">PAYMENT_FAILED</code>.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => {
                              setMockResult("SUCCESS");
                              handleConfirmPayment({ forceNewKey: true });
                            }}
                            className="flex-1 px-3 py-2 rounded-lg bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition-colors cursor-pointer"
                          >
                            🔄 Thử lại với Key mới
                          </button>

                          {lastUsedKey && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() =>
                                handleConfirmPayment({ customKey: lastUsedKey })
                              }
                              className="px-3 py-2 rounded-lg border border-red-300 bg-white text-red-800 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              🔁 Thử lại giao dịch
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {errorState.statusCode === 401 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Link
                          href="/login"
                          className="px-3 py-1.5 rounded-lg bg-red-800 text-white text-xs font-semibold hover:bg-red-900"
                        >
                          Đi tới trang Đăng nhập
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Nút Xác nhận trả */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmPayment()}
                  className="mt-6 w-full py-3.5 px-6 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:bg-stone-400 text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {stepStatus === "CREATING_ORDER"
                          ? "Đang khởi tạo đơn hàng..."
                          : "Đang xử lý thanh toán..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {paymentMethod === "WALLET" ? "Quét mã VietQR chuyển khoản" : "Xác nhận trả"}
                      </span>
                      <span>•</span>
                      <span>{formatVND(displayTotal)}</span>
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-stone-500">
                  Bằng việc bấm &ldquo;Xác nhận trả&rdquo;, hệ thống sẽ giữ tồn kho và thanh
                  toán an toàn chống trừ tiền 2 lần (<code className="font-mono">Idempotency-Key</code>).
                </p>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

