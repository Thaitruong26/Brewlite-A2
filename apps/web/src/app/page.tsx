import Link from "next/link";
import { ProductImage } from "@/components/products/product-image";

/**
 * Trang chủ — Mobile-first Vertical Layout
 */
export default function Home() {
  return (
    <section className="relative w-full flex flex-col gap-6 px-4 py-5">
      {/* ── Text content ─────────────────────── */}
      <div className="flex flex-col items-start">
        {/* Eye-brow */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#183d2c]">
            BrewLite · Cà phê mỗi ngày
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#183d2c]">
          Một khoảng lặng,{" "}
          <span
            className="text-[#183d2c]"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 700,
            }}
          >
            đúng vị bạn.
          </span>
        </h1>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-[#66736a]">
          Chọn thức uống yêu thích từ thực đơn BrewLite. Đặt món gọn nhẹ, giao nhận nhanh chóng tại quầy.
        </p>

        {/* CTAs */}
        <div className="mt-5 w-full">
          <Link
            href="/menu"
            className="group flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#183d2c] px-6 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-[#24563e] active:scale-[0.99]"
          >
            Khám phá thực đơn ngay
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              ↗
            </span>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
          {[
            { icon: "☕", label: "Rang mộc thủ công" },
            { icon: "🌿", label: "Nguyên liệu tươi" },
            { icon: "⚡", label: "Đặt trong 30 giây" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 rounded-full bg-[#eef2ec] px-3 py-1">
              <span className="text-xs" aria-hidden="true">{icon}</span>
              <span className="text-[11px] font-semibold text-[#4a6155]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Image card ──────────────────────── */}
      <div className="relative mx-auto mt-2 w-full">
        {/* Decorative tilted slab */}
        <div
          className="absolute -inset-2 rotate-[1.5deg] rounded-3xl bg-[#e6eadc]"
          aria-hidden="true"
        />

        {/* Main coffee photo */}
        <div className="relative overflow-hidden rounded-2xl shadow-md">
          <ProductImage
            src="/img/ca-phe-sua.jpg"
            alt="Ly cà phê sữa BrewLite"
            className="aspect-[4/3] w-full object-cover"
          />
          {/* Subtle gradient vignette at bottom for caption legibility */}
          <div
            className="absolute inset-x-0 bottom-0 h-20 rounded-b-2xl"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 100%)",
            }}
            aria-hidden="true"
          />
        </div>

        {/* Caption card */}
        <div
          className="absolute -bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-[#e5e7dc] bg-[#fbf8ef] px-4 py-2.5 shadow-md"
        >
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#66736a]">
              Pha chậm, thưởng thức lâu
            </p>
            <p className="text-xs font-semibold text-[#183d2c]">
              Chào ngày mới cùng BrewLite
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
            <span>★</span> 4.9
          </div>
        </div>
      </div>
    </section>
  );
}
