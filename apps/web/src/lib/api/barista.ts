import { apiRequest } from "./client";
import type { PaginatedResponse } from "./types";

export interface BaristaOrderItem {
  productName: string;
  size: "S" | "M" | "L";
  qty: number;
  toppings: { name: string; price?: number }[];
  note?: string | null;
}

export interface BaristaOrder {
  id: number;
  code: string;
  customerName?: string | null;
  status: "PAID" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  total: number;
  items: BaristaOrderItem[];
  createdAt: string;
  updatedAt?: string;
  isRefunded?: boolean;
  refundRef?: string | null;
  refundedAt?: string | null;
  refundStatus?: 'PENDING' | 'FAILED' | 'UNKNOWN' | 'COMPLETED' | null;
  refundBank?: string | null;
  refundAccount?: string | null;
  refundExtra?: string | null;
}

export function getBaristaOrders(status?: string, page = 1, limit = 50) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (page) query.set("page", String(page));
  if (limit) query.set("limit", String(limit));
  return apiRequest<PaginatedResponse<BaristaOrder>>(
    `/orders?${query.toString()}`,
    {
      authenticated: true,
    },
  );
}

export async function getAllBaristaOrders() {
  const first = await getBaristaOrders();
  const data = [...first.data];
  for (let page = 2; page <= first.meta.totalPages; page++) {
    const next = await getBaristaOrders(undefined, page);
    data.push(...next.data);
  }
  return { ...first, data };
}

export function updateOrderStatus(
  orderId: number,
  status: "PAID" | "PREPARING" | "READY" | "COMPLETED",
) {
  return apiRequest<BaristaOrder>(`/orders/${orderId}/status`, {
    method: "PATCH",
    authenticated: true,
    body: { status },
  });
}

export function cancelBaristaOrder(orderId: number) {
  return apiRequest<BaristaOrder>(`/orders/${orderId}/cancel`, {
    method: "POST",
    authenticated: true,
  });
}

export function confirmRefund(orderId: number, refundRef?: string) {
  return apiRequest(`/orders/${orderId}/confirm-refund`, {
    method: "PATCH",
    authenticated: true,
    body: { refundRef },
  });
}

export function failRefund(orderId: number, reason: string) {
  return apiRequest(`/orders/${orderId}/fail-refund`, {
    method: "PATCH",
    authenticated: true,
    body: { reason },
  });
}

export function holdRefund(orderId: number, note?: string) {
  return apiRequest(`/orders/${orderId}/hold-refund`, {
    method: "PATCH",
    authenticated: true,
    body: { note },
  });
}

export function retryRefund(orderId: number, refundBank?: string, refundAccount?: string) {
  return apiRequest(`/orders/${orderId}/retry-refund`, {
    method: "PATCH",
    authenticated: true,
    body: { refundBank, refundAccount },
  });
}

export interface ProductStockInfo {
  id: number;
  name: string;
  stock: number;
  inStock: boolean;
  price: number;
  category: string;
}

export function getProductsStock() {
  return apiRequest<PaginatedResponse<ProductStockInfo>>("/products?limit=100", {
    authenticated: true,
  });
}

export function addProductStock(
  productId: number,
  quantity: number,
  note?: string,
) {
  return apiRequest<{
    id: number;
    name: string;
    stock: number;
    inStock: boolean;
  }>(`/products/${productId}/stock`, {
    method: "POST",
    authenticated: true,
    body: { quantity, note },
  });
}

export interface BackendIngredient {
  id: number;
  name: string;
  unit: string;
  stock: number;
  lowThreshold: number;
  low: boolean;
}

export function getIngredientsStock(page = 1, limit = 50) {
  return apiRequest<PaginatedResponse<BackendIngredient>>(
    `/ingredients?page=${page}&limit=${limit}`,
    {
      authenticated: false,
    },
  );
}

export function addIngredientStock(
  ingredientId: number,
  quantity: number,
  note?: string,
) {
  return apiRequest<BackendIngredient>(`/ingredients/${ingredientId}/stock`, {
    method: "POST",
    authenticated: true,
    body: { quantity, note },
  });
}

export interface ProductRecipeItem {
  ingredientId: number;
  name: string;
  unit: string;
  quantity: number;
}

export interface ProductRecipeResponse {
  productId: number;
  items: ProductRecipeItem[];
}

export function getProductRecipe(productId: number) {
  return apiRequest<ProductRecipeResponse>(`/products/${productId}/recipe`, {
    authenticated: true,
  });
}

