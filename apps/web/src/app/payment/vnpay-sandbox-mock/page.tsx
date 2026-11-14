"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatVND, simulateVnpayCompleteApi } from "@/lib/api";

function crc16(str: string) {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

function generateUserVnpayQR(amount: number, orderId: number) {
  const f = (tag: string, val: string) => tag + String(val.length).padStart(2, "0") + val;
  const merchant38 = "0010A00000072701240006971015011009320936270208QRIBFTTA";
  let payload = f("00", "01") + f("01", "12") + f("38", merchant38) + f("53", "704");
  if (amount > 0) payload += f("54", String(Math.round(amount)));
  payload += f("58", "VN");
  const note = `BrewLite ${orderId}`;
  payload += f("62", f("08", note));
  payload += "6304";
  const checksum = crc16(payload);
  return payload + checksum;
}

function VnpayMockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const txnRef = searchParams.get("vnp_TxnRef") || "";
  const orderId = parseInt(txnRef.split("_")[0] || "0", 10);
  const rawAmount = parseInt(searchParams.get("vnp_Amount") || "0", 10);
  const amount = rawAmount > 0 ? rawAmount / 100 : 0;
  const orderInfo = searchParams.get("vnp_OrderInfo") || "Thanh toan don hang BrewLite";

  const [cardNumber, setCardNumber] = useState("9704198526191432198");
  const [cardHolder, setCardHolder] = useState("NGUYEN VAN A");
  const [issueDate, setIssueDate] = useState("07/15");
  const [otp, setOtp] = useState("123456");
  const [activeTab, setActiveTab] = useState<"ATM" | "QR">("ATM");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mở cổng thật trên sandbox.vnpayment.vn
  const externalSandboxUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${searchParams.toString()}`;

  const handlePay = async (responseCode: string = "00") => {
    setIsProcessing(true);
    try {
      const { query } = await simulateVnpayCompleteApi(orderId, txnRef, rawAmount, responseCode);
      router.push(`/payment/vnpay-return?${query}`);
    } catch {
      // Fallback nếu API lỗi
      router.push(`/payment/vnpay-return?vnp_ResponseCode=${responseCode}&vnp_TxnRef=${txnRef}&vnp_Amount=${rawAmount}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full px-4 py-5 flex flex-col gap-4">
      {/* ── Header cổng VNPay ── */}
      <div className="rounded-2xl bg-white p-4 border border-[#e5e7dc] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center tracking-tighter">
            VNP
          </div>
          <div>
            <p className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">Cổng thanh toán VNPAY</p>
            <p className="text-[11px] text-stone-500">Môi trường kiểm thử Sandbox 2.1.0</p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
          🧪 Test Gateway
        </span>
      </div>

      {/* ── Thông tin giao dịch ── */}
      <div className="rounded-2xl bg-gradient-to-br from-[#183d2c] to-[#25563e] p-5 text-white shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs text-emerald-200">
          <span>Đơn hàng BrewLite</span>
          <span className="font-mono font-bold text-white">#{orderId}</span>
        </div>
        <div className="flex items-baseline justify-between pt-1 border-t border-emerald-700/50">
          <span className="text-xs text-emerald-100">Số tiền thanh toán:</span>
          <span className="text-2xl font-black tracking-tight text-white">{formatVND(amount)}</span>
        </div>
        <p className="text-[11px] text-emerald-200/80 truncate pt-1">{orderInfo}</p>
      </div>

      {/* ── Chọn phương thức thanh toán trên VNPay ── */}
      <div className="rounded-2xl bg-white border border-[#e5e7dc] p-4 shadow-sm space-y-4">
        <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold text-stone-600">
          <button
            type="button"
            onClick={() => setActiveTab("ATM")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "ATM" ? "bg-white text-blue-900 shadow-xs" : "hover:text-stone-900"
            }`}
          >
            💳 Thẻ ATM NCB Test
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("QR")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "QR" ? "bg-white text-emerald-900 shadow-xs" : "hover:text-stone-900"
            }`}
          >
            📱 Quét VietQR / Ngân hàng
          </button>
        </div>

        {activeTab === "ATM" ? (
          <div className="space-y-3 text-xs">
            <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 text-[11px] text-blue-950 space-y-1">
              <p className="font-bold">✨ Thông tin thẻ mẫu đã được điền sẵn:</p>
              <p>Ngân hàng thử nghiệm: <span className="font-bold">NCB (Ngân hàng Quốc dân)</span></p>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Số thẻ ATM:</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-mono text-sm font-bold text-stone-900 focus:bg-white focus:border-blue-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tên chủ thẻ:</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 focus:bg-white focus:border-blue-600 outline-none uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ngày phát hành:</label>
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-mono text-xs font-bold text-stone-900 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Mã OTP xác thực:</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-mono text-base font-bold text-stone-900 tracking-widest text-center focus:bg-white focus:border-blue-600 outline-none"
              />
              <p className="text-[10px] text-stone-400 mt-1 text-center">OTP test mặc định VNPay Sandbox: 123456</p>
            </div>

            {/* Nút hành động */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePay("00")}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {isProcessing ? "Đang xử lý giao dịch..." : "✓ Xác nhận thanh toán thành công"}
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePay("24")}
                className="w-full py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 font-semibold text-xs transition"
              >
                ✕ Thử nghiệm Hủy giao dịch (Mã lỗi 24)
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
            <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-md flex flex-col items-center w-full max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="size-6 rounded-lg bg-[#005a3c] text-white font-black text-[10px] flex items-center justify-center">VCB</span>
                <p className="font-bold text-xs text-[#005a3c] uppercase">VietQR Chuyển khoản Vietcombank</p>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.vietqr.io/image/vietcombank-1040263376-compact2.png?amount=${Math.round(amount)}&addInfo=BrewLite%20${orderId}`}
                alt="Mã VietQR Vietcombank nhận tiền"
                className="w-56 h-56 rounded-xl object-contain border border-stone-200 p-1 bg-white shadow-xs"
              />

              <div className="mt-3 w-full rounded-xl bg-emerald-50/80 border border-emerald-200 p-3 text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Ngân hàng:</span>
                  <span className="font-bold text-[#005a3c]">Vietcombank (VCB)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Số tài khoản:</span>
                  <span className="font-mono font-black text-sm text-stone-900">1040263376</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Số tiền:</span>
                  <span className="font-black text-sm text-red-600">{formatVND(amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Nội dung CK:</span>
                  <span className="font-mono font-bold text-stone-800">BrewLite {orderId}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-950 text-left max-w-xs space-y-1">
              <p className="font-bold text-[#005a3c]">✨ Chuẩn VietQR Napas247 liên ngân hàng:</p>
              <p>Mở <b>bất kỳ App Ngân hàng nào</b> (Vietcombank, MB, Techcombank, TPBank, VPBank, ACB, BIDV, Agribank, Ví VNPay...) quét mã trên &rarr; Hệ thống <b>tự động điền đúng STK, đúng số tiền và đúng mã đơn hàng</b>.</p>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePay("00")}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? "Đang xử lý giao dịch..." : "✓ Tôi đã quét mã và chuyển tiền xong"}
            </button>
          </div>
        )}
      </div>

      {/* ── Tùy chọn mở cổng thật ── */}
      <div className="rounded-2xl bg-[#f5f7f2] border border-[#e2e6dc] p-4 text-xs space-y-2">
        <p className="font-bold text-[#183d2c]">🔗 Cổng VNPay Sandbox chính thức:</p>
        <p className="text-[#66736a] text-[11px] leading-relaxed">
          Nếu bạn đã cấu hình Merchant Key riêng trong file <code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">.env</code>, bạn có thể mở trực tiếp trang Sandbox của VNPay bên ngoài:
        </p>
        <a
          href={externalSandboxUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold underline text-xs"
        >
          Mở sandbox.vnpayment.vn trong tab mới →
        </a>
      </div>

      {/* ── Nút quay về ── */}
      <Link
        href="/checkout"
        className="w-full text-center py-2 text-xs font-semibold text-stone-500 hover:text-stone-800"
      >
        ← Quay lại trang Thanh toán BrewLite
      </Link>
    </div>
  );
}

export default function VnpayMockPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-stone-500">
          Đang tải cổng VNPay Sandbox...
        </div>
      }
    >
      <VnpayMockContent />
    </Suspense>
  );
}

