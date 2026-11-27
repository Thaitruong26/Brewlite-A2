"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ApiError,
  cancelOrderApi,
  formatVND,
  getOrderByIdApi,
} from "@/lib/api";
import { OrderResponse } from "@/types/order";

// Chức năng: Component giao diện PaymentContent. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const method = searchParams.get("method") || "WALLET";

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isSuccessRedirecting, setIsSuccessRedirecting] = useState<boolean>(false);
  const [clientNotified, setClientNotified] = useState<boolean>(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError("Thiếu mã đơn hàng hợp lệ.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await getOrderByIdApi(orderId);
      setOrder(data);
      setError(null);

      if (data.status === "PAID") {
        setIsSuccessRedirecting(true);
        setTimeout(() => {
          router.push(`/orders/${data.id}`);
        }, 1500);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Không thể tải thông tin đơn hàng."
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!order || order.status !== "PENDING") return;

    const createdAtMs = new Date(order.createdAt).getTime();
    const expireTimeMs = createdAtMs + 15 * 60 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const remainingSec = Math.max(0, Math.floor((expireTimeMs - now) / 1000));
      setTimeLeft(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(timer);
        void handleAutoCancel();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order]);

  useEffect(() => {
    if (!orderId || isSuccessRedirecting) return;

    let ignore = false;
    const pollInterval = setInterval(async () => {
      try {
        const data = await getOrderByIdApi(orderId);
        if (ignore) return;

        setOrder(data);

        if (data.status === "PAID") {
          clearInterval(pollInterval);
          setIsSuccessRedirecting(true);
          setTimeout(() => {
            router.push(`/orders/${data.id}`);
          }, 1500);
        }
      } catch {
        // Bỏ qua lỗi mạng chớp nhoáng khi polling
      }
    }, 2000);

    return () => {
      ignore = true;
      clearInterval(pollInterval);
    };
  }, [orderId, isSuccessRedirecting, router]);

  // Chức năng: Xử lý sự kiện AutoCancel. Cách hoạt động: Nhận sự kiện từ giao diện, cập nhật state hoặc gọi API xử lý nghiệp vụ tương ứng.
  const handleAutoCancel = async () => {
    if (!orderId) return;
    try {
      await cancelOrderApi(orderId);
      const updated = await getOrderByIdApi(orderId);
      setOrder(updated);
    } catch {
      // Bỏ qua nếu đơn đã hủy
    }
  };

  // Chức năng: Xử lý sự kiện ManualCancel. Cách hoạt động: Nhận sự kiện từ giao diện, cập nhật state hoặc gọi API xử lý nghiệp vụ tương ứng.
  const handleManualCancel = async () => {
    if (!orderId || isCancelling) return;
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    setIsCancelling(true);
    try {
      await cancelOrderApi(orderId);
      const updated = await getOrderByIdApi(orderId);
      setOrder(updated);
    } catch (err: any) {
      alert(err?.message || "Không thể hủy đơn hàng.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Chức năng: Hàm copyToClipboard(text, field). Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
  const copyToClipboard = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Chức năng: Xử lý tính toán / định dạng dữ liệu (formatCountdown). Cách hoạt động: Biến đổi tham số đầu vào (totalSec) thành kết quả chuẩn để hiển thị hoặc tính toán.
  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-stone-600">Đang chuẩn bị mã VietQR Vietcombank...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-lg font-bold text-stone-900">Không tìm thấy đơn hàng</h1>
          <p className="text-sm text-stone-600 mt-2">{error || "Mã đơn hàng không hợp lệ."}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/menu"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 transition-colors"
            >
              Quay lại Thực đơn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = timeLeft <= 0 || order.status === "CANCELLED";
  const transferContent = `BREWLITE DH${order.id}`;
  const bankNumber = "1040263376";
  const bankName = "Vietcombank";
  const accountHolder = "BREWLITE COFFEE";
  const vietQrUrl = `https://img.vietqr.io/image/VCB-${bankNumber}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(
    transferContent,
  )}&accountName=${encodeURIComponent(accountHolder)}`;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-emerald-900">
            <span className="text-2xl">☕</span>
            <span>BrewLite</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/menu" className="text-sm font-medium text-stone-600 hover:text-emerald-800">
              Thực đơn
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
          {/* BANNER THÀNH CÔNG: XÁC NHẬN ĐÃ NHẬN TIỀN MỚI CHUYỂN TRANG */}
          {isSuccessRedirecting && (
            <div className="mb-6 p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-center space-y-2 animate-in fade-in duration-300">
              <div className="size-12 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
                ✓
              </div>
              <h2 className="text-lg font-black text-emerald-950 uppercase tracking-tight">
                Đã xác nhận nhận được tiền thành công!
              </h2>
              <p className="text-xs font-semibold text-emerald-800">
                Hệ thống & Barista đã nhận được <strong>{formatVND(order.total)}</strong> cho đơn hàng <strong>#{order.id}</strong>.
              </p>
              <p className="text-[11px] text-emerald-700 font-bold animate-pulse pt-1">
                ⏳ Đang chuyển quý khách sang trang theo dõi đơn hàng...
              </p>
            </div>
          )}

          {/* Tiêu đề & Logo Ngân hàng */}
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 uppercase tracking-wider">
              {method === "CARD" ? "Thẻ POS · VietQR" : "VietQR · Napas247"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-emerald-950 tracking-tight">
            {method === "CARD" ? "Thanh toán Thẻ / VietQR tại quầy" : "Thanh toán Chuyển khoản VietQR"}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {method === "CARD"
              ? "Quý khách có thể quẹt thẻ POS tại quầy hoặc quét mã QR Vietcombank bên dưới"
              : "Quét mã QR bằng App Vietcombank hoặc bất kỳ ứng dụng ngân hàng nào"}
          </p>

          {isExpired ? (
            <div className="my-8 p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
              <div className="text-4xl">⏱️</div>
              <h2 className="text-lg font-bold text-red-900">Đơn hàng đã hết hạn thanh toán</h2>
              <p className="text-xs text-red-700 max-w-sm mx-auto leading-relaxed">
                Đơn hàng <strong>#{order.id}</strong> đã quá thời hạn 15 phút mà chưa nhận được tiền nên đã tự động đổi thành <strong>ĐÃ HỦY ĐƠN HÀNG</strong> và hoàn lại nguyên liệu vào kho.
              </p>
              <div className="pt-2">
                <Link
                  href="/menu"
                  className="inline-block px-5 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors"
                >
                  Đặt lại đơn mới
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Ảnh Mã QR VietQR Vietcombank */}
              <div className="my-5 flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-emerald-600/60 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vietQrUrl}
                    alt="Mã VietQR Vietcombank 1040263376"
                    className="w-full max-w-[260px] aspect-square object-contain rounded-xl"
                  />
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
                  <span className="size-2 rounded-full bg-amber-600 animate-ping" />
                  <span>Chờ xác nhận nhận tiền · Đơn #{order.id}</span>
                </div>
              </div>

              {/* THẺ THÔNG TIN CHUYỂN KHOẢN KÈM MÃ ĐƠN HÀNG */}
              <div className="my-4 rounded-2xl bg-[#f7f9f7] border border-emerald-200/80 p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    Thông tin chuyển khoản
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                    Mã đơn: #{order.id}
                  </span>
                </div>

                {/* Ngân hàng */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-stone-900">{bankName} (VCB)</span>
                </div>

                {/* Số tài khoản */}
                <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-stone-200/80">
                  <div>
                    <p className="text-[10px] text-stone-400">Số tài khoản:</p>
                    <p className="font-mono text-base font-black text-emerald-900">{bankNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankNumber, "acc")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer border border-emerald-200"
                  >
                    {copiedField === "acc" ? "✓ Đã chép" : "Sao chép STK"}
                  </button>
                </div>

                {/* Chủ tài khoản */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Tên chủ tài khoản:</span>
                  <span className="font-bold text-stone-900 uppercase">{accountHolder}</span>
                </div>

                {/* Số tiền */}
                <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-stone-200/80">
                  <div>
                    <p className="text-[10px] text-stone-400">Số tiền thanh toán:</p>
                    <p className="text-base font-black text-emerald-900">{formatVND(order.total)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(String(order.total), "amount")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer border border-emerald-200"
                  >
                    {copiedField === "amount" ? "✓ Đã chép" : "Sao chép số tiền"}
                  </button>
                </div>

                {/* Nội dung chuyển khoản */}
                <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-emerald-300 shadow-2xs">
                  <div>
                    <p className="text-[10px] text-stone-400">Nội dung chuyển khoản (có mã đơn):</p>
                    <p className="font-mono text-base font-extrabold text-red-600">{transferContent}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(transferContent, "memo")}
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition cursor-pointer border border-red-200"
                  >
                    {copiedField === "memo" ? "✓ Đã chép" : "Sao chép nội dung"}
                  </button>
                </div>

                <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  📌 <strong>Quy định:</strong> Quý khách chuyển tiền nhớ giữ nguyên nội dung{" "}
                  <strong>{transferContent}</strong>. Hệ thống phải nhận được xác nhận tiền vào từ Barista thì mới chuyển sang trang hoàn tất cho khách.
                </div>
              </div>

              {/* Trạng thái xác nhận & Thời gian */}
              <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 space-y-2.5 text-xs text-left">
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Trạng thái thanh toán:</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full">
                    <span className="size-2 rounded-full bg-amber-600 animate-ping" />
                    Đang chờ quầy Barista xác nhận nhận tiền...
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                  <span className="text-stone-600">Thời gian giữ đơn còn lại:</span>
                  <span
                    className={`font-mono text-sm font-bold ${timeLeft < 180 ? "text-red-600 animate-pulse" : "text-emerald-900"
                      }`}
                  >
                    ⏱ {formatCountdown(timeLeft)}
                  </span>
                </div>
              </div>

              {/* CÁC NÚT THAO TÁC XÁC NHẬN */}
              <div className="mt-5 space-y-2.5">
                {/* Khách báo đã chuyển tiền */}
                <button
                  type="button"
                  onClick={() => setClientNotified(true)}
                  className="w-full rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-sm cursor-pointer"
                >
                  {clientNotified
                    ? "✓ Đã báo chuyển tiền · Quầy Barista đang đối soát số dư..."
                    : "Tôi đã chuyển tiền thành công"}
                </button>
              </div>

              {/* Nút hủy đơn hàng chủ động */}
              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-3 text-xs">
                <span className="text-stone-500 text-left">
                  Đổi ý không mua nữa?
                </span>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleManualCancel}
                  className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isCancelling ? "Đang hủy đơn..." : "✕ Hủy đơn hàng này"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Chức năng: Component giao diện PaymentPage. Cách hoạt động: Quản lý trạng thái hiển thị bằng React hooks và render cấu trúc JSX tương ứng.
export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
          <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
