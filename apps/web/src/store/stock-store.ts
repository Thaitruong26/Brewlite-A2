"use client";

import { create } from "zustand";

const STORAGE_KEY = "brewlite.stock-availability";
const CHANGE_EVENT = "brewlite:stock-availability-change";

// Chức năng: Hàm readAvailability. Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
function readAvailability(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

interface StockState {
  availability: Record<string, boolean>;
  hydrate: () => void;
  setAvailability: (sku: string, available: boolean) => void;
  setProductAvailability: (identifiers: string[], available: boolean) => void;
}

export const useStockStore = create<StockState>((set) => ({
  availability: {},
  hydrate: () => set({ availability: readAvailability() }),
  setAvailability: (sku, available) => {
    set((state) => {
      const next = { ...state.availability, [sku]: available };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return { availability: next };
    });
  },
  setProductAvailability: (identifiers, available) => {
    set((state) => {
      const next = { ...state.availability };
      for (const id of identifiers) {
        if (id) next[id] = available;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return { availability: next };
    });
  },
}));

// Chức năng: Hàm checkIsAvailable(product, availability). Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
export function checkIsAvailable(
  product: { id?: number; name?: string; inStock?: boolean },
  availability: Record<string, boolean>,
): boolean {
  if (!product) return false;
  if (product.name && availability[product.name] !== undefined) {
    return availability[product.name];
  }
  if (product.name && availability[product.name.toLowerCase().trim()] !== undefined) {
    return availability[product.name.toLowerCase().trim()];
  }
  if (product.id !== undefined) {
    const sku = `SP-${String(product.id).padStart(3, "0")}`;
    if (availability[sku] !== undefined) return availability[sku];
    if (availability[String(product.id)] !== undefined) return availability[String(product.id)];
  }
  return product.inStock !== false;
}
