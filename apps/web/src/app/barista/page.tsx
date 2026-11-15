"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useStockStore } from "@/store/stock-store";
import { useAuthStore } from "@/store/auth-store";
import {
  getAllBaristaOrders,
  updateOrderStatus,
  confirmRefund,
  getProductsStock,
  getIngredientsStock,
  addIngredientStock,
  getProductRecipe,
  BaristaOrder as BackendOrder,
} from "@/lib/api/barista";

type OrderStage = "pending" | "preparing" | "ready" | "completed" | "cancelled";
type QueueTab = "pending" | "preparing" | "ready" | "history" | "cancelled";
type ProductLine = { quantity: number; name: string; size: string; options: string[] };
type IngredientItem = { id?: number; sku: string; name: string; detail: string; unit: string; stock: number; minimum: number };
type BaristaOrder = {
  id: number;
  rawStatus: "PENDING" | "PAID" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  customer: string;
  placedAt: string;
  stage: OrderStage;
  elapsed: string;
  items: ProductLine[];
  note?: string;
  total: number;
  isRefunded?: boolean;
  refundRef?: string | null;
  refundedAt?: string | null;
};
type StockItem = { id?: number; sku: string; name: string; description: string; category: string; price: number; stock: number; target: number };

type RecipeIngredient = {
  ingredient: string;
  quantity: number;
  unit: string;
  ingredientId?: number;
};

// Từ điển công thức chuẩn đồng bộ 100% với database (backend/prisma/seed.ts)
const PRODUCT_RECIPES: Record<string, RecipeIngredient[]> = {
  "Trà Sữa Truyền Thống": [
    { ingredient: "Cốt trà đen đã pha", quantity: 150, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 120, unit: "ml" },
    { ingredient: "Bột kem béo", quantity: 20, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 20, unit: "ml" },
  ],
  "Ô Long Sữa": [
    { ingredient: "Cốt trà ô long đã pha", quantity: 180, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 100, unit: "ml" },
    { ingredient: "Bột kem béo", quantity: 15, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 20, unit: "ml" },
  ],
  "Trà Sữa Khoai Môn": [
    { ingredient: "Cốt trà đen đã pha", quantity: 130, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 100, unit: "ml" },
    { ingredient: "Bột khoai môn", quantity: 25, unit: "g" },
    { ingredient: "Bột kem béo", quantity: 15, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 15, unit: "ml" },
  ],
  "Trà Sữa Oreo Phô Mai": [
    { ingredient: "Cốt trà đen đã pha", quantity: 130, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 100, unit: "ml" },
    { ingredient: "Bột kem béo", quantity: 15, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 15, unit: "ml" },
    { ingredient: "Bánh Oreo nghiền", quantity: 10, unit: "g" },
    { ingredient: "Kem cheese", quantity: 30, unit: "ml" },
  ],
  "Trà Sữa Trân Châu Đen": [
    { ingredient: "Cốt trà đen đã pha", quantity: 150, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 120, unit: "ml" },
    { ingredient: "Bột kem béo", quantity: 20, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 20, unit: "ml" },
    { ingredient: "Trân châu đen đã nấu", quantity: 40, unit: "g" },
  ],
  "Trà Sữa Trân Châu Đường Đen": [
    { ingredient: "Cốt trà đen đã pha", quantity: 140, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 120, unit: "ml" },
    { ingredient: "Bột kem béo", quantity: 15, unit: "g" },
    { ingredient: "Syrup đường đen", quantity: 20, unit: "ml" },
    { ingredient: "Trân châu đường đen đã nấu", quantity: 40, unit: "g" },
  ],
  "Trà Đào Cam Sả": [
    { ingredient: "Cốt trà đen đã pha", quantity: 200, unit: "ml" },
    { ingredient: "Đào ngâm", quantity: 40, unit: "g" },
    { ingredient: "Cam tươi", quantity: 30, unit: "g" },
    { ingredient: "Sả", quantity: 5, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 15, unit: "ml" },
  ],
  "Trà Vải": [
    { ingredient: "Cốt trà hoa nhài đã pha", quantity: 200, unit: "ml" },
    { ingredient: "Vải ngâm", quantity: 40, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 15, unit: "ml" },
  ],
  "Trà Chanh Dây": [
    { ingredient: "Cốt trà đen đã pha", quantity: 180, unit: "ml" },
    { ingredient: "Syrup chanh dây", quantity: 30, unit: "ml" },
    { ingredient: "Đường nước / syrup đường", quantity: 15, unit: "ml" },
  ],
  "Trà Dâu Tây": [
    { ingredient: "Cốt trà hoa nhài đã pha", quantity: 180, unit: "ml" },
    { ingredient: "Dâu tây / puree dâu", quantity: 40, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 15, unit: "ml" },
  ],
  "Trà Xoài": [
    { ingredient: "Cốt trà xanh đã pha", quantity: 180, unit: "ml" },
    { ingredient: "Xoài / puree xoài", quantity: 50, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 15, unit: "ml" },
  ],
  "Ô Long Sữa Nhài": [
    { ingredient: "Cốt trà ô long đã pha", quantity: 140, unit: "ml" },
    { ingredient: "Cốt trà hoa nhài đã pha", quantity: 40, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 100, unit: "ml" },
    { ingredient: "Đường nước / syrup đường", quantity: 15, unit: "ml" },
  ],
  "Ô Long Sữa Tươi Nướng": [
    { ingredient: "Cốt trà ô long đã pha", quantity: 160, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 120, unit: "ml" },
    { ingredient: "Bột kem béo", quantity: 10, unit: "g" },
  ],
  "Ô Long Sữa Tươi Xoài": [
    { ingredient: "Cốt trà ô long đã pha", quantity: 150, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 100, unit: "ml" },
    { ingredient: "Mứt xoài", quantity: 35, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 10, unit: "ml" },
  ],
  "Matcha Latte": [
    { ingredient: "Sữa tươi", quantity: 220, unit: "ml" },
    { ingredient: "Bột matcha", quantity: 4, unit: "g" },
    { ingredient: "Đường nước / syrup đường", quantity: 15, unit: "ml" },
  ],
  "Matcha Sữa Dâu": [
    { ingredient: "Sữa tươi", quantity: 200, unit: "ml" },
    { ingredient: "Bột matcha", quantity: 4, unit: "g" },
    { ingredient: "Mứt dâu", quantity: 35, unit: "g" },
  ],
  "Matcha Đậu Đỏ": [
    { ingredient: "Sữa tươi", quantity: 200, unit: "ml" },
    { ingredient: "Bột matcha", quantity: 4, unit: "g" },
    { ingredient: "Đậu đỏ đã nấu", quantity: 40, unit: "g" },
  ],
  "Cà Phê Sữa": [
    { ingredient: "Cà phê espresso/phin đã pha", quantity: 50, unit: "ml" },
    { ingredient: "Sữa đặc", quantity: 35, unit: "g" },
    { ingredient: "Nước lọc", quantity: 30, unit: "ml" },
  ],
  "Bạc Xỉu": [
    { ingredient: "Cà phê espresso/phin đã pha", quantity: 30, unit: "ml" },
    { ingredient: "Sữa tươi", quantity: 150, unit: "ml" },
    { ingredient: "Sữa đặc", quantity: 25, unit: "g" },
  ],
  "Cà Phê Muối": [
    { ingredient: "Cà phê espresso/phin đã pha", quantity: 50, unit: "ml" },
    { ingredient: "Sữa đặc", quantity: 20, unit: "g" },
    { ingredient: "Kem nền / whipping cream", quantity: 30, unit: "ml" },
    { ingredient: "Muối", quantity: 1, unit: "g" },
  ],
};

const defaultMenuStock: StockItem[] = [
  { id: 1, sku: "SP-001", name: "Trà Sữa Truyền Thống", description: "Trà đen đậm đà kết hợp sữa thơm béo", category: "Trà sữa", price: 35000, stock: 50, target: 50 },
  { id: 2, sku: "SP-002", name: "Ô Long Sữa", description: "Trà ô long thanh mát hòa quyện vị sữa béo ngậy", category: "Trà sữa", price: 38000, stock: 45, target: 50 },
  { id: 3, sku: "SP-003", name: "Trà Sữa Khoai Môn", description: "Vị khoai môn bùi béo tự nhiên, màu tím bắt mắt", category: "Trà sữa", price: 42000, stock: 40, target: 50 },
  { id: 4, sku: "SP-004", name: "Trà Sữa Oreo Phô Mai", description: "Vụn bánh Oreo giòn tan kết hợp lớp kem phô mai béo ngậy", category: "Trà sữa", price: 45000, stock: 35, target: 50 },
  { id: 5, sku: "SP-005", name: "Trà Sữa Trân Châu Đen", description: "Trà sữa truyền thống kèm trân châu đen dẻo dai", category: "Trà sữa", price: 40000, stock: 40, target: 50 },
  { id: 6, sku: "SP-006", name: "Trà Sữa Trân Châu Đường Đen", description: "Đường đen thơm lừng quyện cùng sữa tươi và trân châu", category: "Trà sữa", price: 45000, stock: 30, target: 50 },
  { id: 7, sku: "SP-007", name: "Trà Đào Cam Sả", description: "Trà đen thanh mát kết hợp đào ngâm giòn, cam tươi và sả thơm", category: "Trà trái cây", price: 39000, stock: 35, target: 50 },
  { id: 8, sku: "SP-008", name: "Trà Vải", description: "Trà hoa nhài thanh khiết với trái vải mọng nước", category: "Trà trái cây", price: 42000, stock: 30, target: 50 },
  { id: 9, sku: "SP-009", name: "Trà Chanh Dây", description: "Vị chua ngọt thanh mát giải nhiệt tức thì", category: "Trà trái cây", price: 35000, stock: 40, target: 50 },
  { id: 10, sku: "SP-010", name: "Trà Dâu Tây", description: "Dâu tây tươi ngọt ngào hòa quyện cùng cốt trà hoa quả", category: "Trà trái cây", price: 42000, stock: 25, target: 50 },
  { id: 11, sku: "SP-011", name: "Trà Xoài", description: "Thịt xoài chín thơm ngọt thanh mát trên nền trà xanh", category: "Trà trái cây", price: 40000, stock: 30, target: 50 },
  { id: 12, sku: "SP-012", name: "Ô Long Sữa Nhài", description: "Hương hoa nhài thoang thoảng hòa cùng cốt trà ô long sữa", category: "Trà nguyên vị và ô long", price: 40000, stock: 30, target: 50 },
  { id: 13, sku: "SP-013", name: "Ô Long Sữa Tươi Nướng", description: "Vị trà nướng đậm đà đặc trưng kết hợp sữa tươi thanh trùng", category: "Trà nguyên vị và ô long", price: 45000, stock: 28, target: 50 },
  { id: 14, sku: "SP-014", name: "Ô Long Sữa Tươi Xoài", description: "Trà ô long sữa thơm ngậy kết hợp mứt xoài ngọt dịu", category: "Trà nguyên vị và ô long", price: 45000, stock: 25, target: 50 },
  { id: 15, sku: "SP-015", name: "Matcha Latte", description: "Bột trà xanh Nhật Bản nguyên chất hòa cùng sữa tươi", category: "Matcha", price: 48000, stock: 20, target: 50 },
  { id: 16, sku: "SP-016", name: "Matcha Sữa Dâu", description: "Hai tầng đẹp mắt: mứt dâu tây chua ngọt và matcha thơm đậm", category: "Matcha", price: 50000, stock: 20, target: 50 },
  { id: 17, sku: "SP-017", name: "Matcha Đậu Đỏ", description: "Matcha đậm vị kết hợp topping đậu đỏ bùi ngọt truyền thống", category: "Matcha", price: 52000, stock: 22, target: 50 },
  { id: 18, sku: "SP-018", name: "Cà Phê Sữa", description: "Cà phê phin truyền thống pha sữa đặc đậm đà", category: "Cà phê và món đặc biệt", price: 35000, stock: 50, target: 50 },
  { id: 19, sku: "SP-019", name: "Bạc Xỉu", description: "Nhiều sữa ít cà phê, ngọt béo thơm lừng", category: "Cà phê và món đặc biệt", price: 38000, stock: 45, target: 50 },
  { id: 20, sku: "SP-020", name: "Cà Phê Muối", description: "Lớp kem béo mặn độc đáo trên nền cà phê phin đậm đặc", category: "Cà phê và món đặc biệt", price: 42000, stock: 5, target: 15 },
];

const defaultIngredients: IngredientItem[] = [
  { id: 1, sku: "NL-001", name: "Cốt trà đen đã pha", detail: "Đã ủ chuẩn nhiệt · Bảo quản bình giữ nhiệt", unit: "ml", stock: 20000, minimum: 2000 },
  { id: 2, sku: "NL-002", name: "Cốt trà ô long đã pha", detail: "Đã ủ chuẩn nhiệt · Bảo quản bình giữ nhiệt", unit: "ml", stock: 20000, minimum: 2000 },
  { id: 3, sku: "NL-003", name: "Cốt trà xanh đã pha", detail: "Trà xanh lài thơm nhẹ", unit: "ml", stock: 10000, minimum: 2000 },
  { id: 4, sku: "NL-004", name: "Cốt trà hoa nhài đã pha", detail: "Trà hoa nhài thanh hương", unit: "ml", stock: 10000, minimum: 2000 },
  { id: 5, sku: "NL-005", name: "Sữa tươi", detail: "Bảo quản tủ mát 2-4°C", unit: "ml", stock: 30000, minimum: 5000 },
  { id: 6, sku: "NL-006", name: "Sữa đặc", detail: "Sữa đặc có đường đậm đà", unit: "g", stock: 15000, minimum: 2000 },
  { id: 7, sku: "NL-007", name: "Bột kem béo", detail: "Bột kem béo thực vật", unit: "g", stock: 10000, minimum: 1000 },
  { id: 8, sku: "NL-008", name: "Đường nước / syrup đường", detail: "Syrup đường mía chuẩn độ ngọt", unit: "ml", stock: 20000, minimum: 2000 },
  { id: 9, sku: "NL-009", name: "Bột khoai môn", detail: "Bột khoai môn bùi béo tự nhiên", unit: "g", stock: 3000, minimum: 500 },
  { id: 10, sku: "NL-010", name: "Bánh Oreo nghiền", detail: "Vụn bánh Oreo giòn rụm", unit: "g", stock: 3000, minimum: 500 },
  { id: 11, sku: "NL-011", name: "Kem cheese", detail: "Kem phô mai béo mặn", unit: "ml", stock: 8000, minimum: 1000 },
  { id: 12, sku: "NL-012", name: "Trân châu đen đã nấu", detail: "Trân châu truyền thống dẻo dai", unit: "g", stock: 10000, minimum: 2000 },
  { id: 13, sku: "NL-013", name: "Trân châu đường đen đã nấu", detail: "Ngâm đường mía nguyên chất", unit: "g", stock: 10000, minimum: 2000 },
  { id: 14, sku: "NL-014", name: "Syrup đường đen", detail: "Đường đen nấu chuẩn vị", unit: "ml", stock: 5000, minimum: 500 },
  { id: 15, sku: "NL-015", name: "Đào ngâm", detail: "Đào miếng giòn bảo quản lạnh", unit: "g", stock: 5000, minimum: 1000 },
  { id: 16, sku: "NL-016", name: "Cam tươi", detail: "Cam vàng tươi cắt lát", unit: "g", stock: 5000, minimum: 500 },
  { id: 17, sku: "NL-017", name: "Sả", detail: "Sả tươi đập dập tạo mùi", unit: "g", stock: 2000, minimum: 200 },
  { id: 18, sku: "NL-018", name: "Vải ngâm", detail: "Vải thiều mọng nước", unit: "g", stock: 5000, minimum: 1000 },
  { id: 19, sku: "NL-019", name: "Syrup chanh dây", detail: "Chanh dây cô đặc tươi chua thanh", unit: "ml", stock: 5000, minimum: 1000 },
  { id: 20, sku: "NL-020", name: "Dâu tây / puree dâu", detail: "Puree dâu tây mọng ngọt", unit: "g", stock: 5000, minimum: 1000 },
  { id: 21, sku: "NL-021", name: "Xoài / puree xoài", detail: "Puree xoài chín thơm", unit: "g", stock: 5000, minimum: 1000 },
  { id: 22, sku: "NL-022", name: "Bột matcha", detail: "Matcha chuẩn Nhật Bản", unit: "g", stock: 2000, minimum: 200 },
  { id: 23, sku: "NL-023", name: "Đậu đỏ đã nấu", detail: "Đậu đỏ hầm bùi ngọt", unit: "g", stock: 5000, minimum: 500 },
  { id: 24, sku: "NL-024", name: "Cà phê espresso/phin đã pha", detail: "Robusta Đắk Lắk chiết xuất phin", unit: "ml", stock: 15000, minimum: 1500 },
  { id: 25, sku: "NL-025", name: "Muối", detail: "Muối tinh luyện pha kem mặn", unit: "g", stock: 500, minimum: 50 },
  { id: 26, sku: "NL-026", name: "Kem nền / whipping cream", detail: "Whipping cream béo ngậy làm kem", unit: "ml", stock: 5000, minimum: 500 },
  { id: 27, sku: "NL-027", name: "Thạch củ năng đã chuẩn bị", detail: "Thạch củ năng giòn ngọt", unit: "g", stock: 5000, minimum: 500 },
  { id: 28, sku: "NL-028", name: "Thạch đen đã chuẩn bị", detail: "Thạch sương sáo thanh mát", unit: "g", stock: 5000, minimum: 500 },
  { id: 29, sku: "NL-029", name: "Trân châu popping", detail: "Trân châu nổ vị hoa quả", unit: "g", stock: 5000, minimum: 500 },
  { id: 30, sku: "NL-030", name: "Thạch dừa", detail: "Thạch dừa giòn ngọt tự nhiên", unit: "g", stock: 5000, minimum: 500 },
  { id: 31, sku: "NL-031", name: "Pudding trứng", detail: "Pudding mềm mịn thơm béo", unit: "g", stock: 5000, minimum: 500 },
  { id: 32, sku: "NL-032", name: "Mứt dâu", detail: "Mứt dâu tây miếng ngọt dịu", unit: "g", stock: 5000, minimum: 500 },
  { id: 33, sku: "NL-033", name: "Mứt xoài", detail: "Mứt xoài nhiệt đới", unit: "g", stock: 5000, minimum: 500 },
  { id: 34, sku: "NL-034", name: "Nước lọc", detail: "Nước tinh khiết đã lọc", unit: "ml", stock: 50000, minimum: 5000 },
];

const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

function mapBackendOrderToBarista(bo: BackendOrder): BaristaOrder {
  const stageMap: Record<string, OrderStage> = {
    PENDING: "pending",
    PAID: "preparing",
    PREPARING: "preparing",
    READY: "ready",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  };
  const stage: OrderStage = stageMap[bo.status] || "preparing";

  const d = new Date(bo.createdAt);
  const placedAt = isNaN(d.getTime()) ? "Vừa xong" : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const items: ProductLine[] = bo.items.map((it) => ({
    quantity: it.qty,
    name: it.productName,
    size: it.size,
    options: [
      ...(Array.isArray(it.toppings) ? it.toppings.map((t) => `+ ${t.name}`) : []),
      ...(it.note ? [`Ghi chú: ${it.note}`] : []),
    ],
  }));

  return {
    id: bo.id,
    rawStatus: bo.status,
    customer: bo.customerName || `Khách hàng #${bo.id}`,
    placedAt,
    stage,
    elapsed: "Vừa xong",
    items,
    note: bo.items.find((i) => i.note)?.note || undefined,
    total: bo.total || 0,
    isRefunded: bo.isRefunded,
    refundRef: bo.refundRef,
    refundedAt: bo.refundedAt,
  };
}

export default function BaristaPage() {
  const [inventoryTab, setInventoryTab] = useState<"stock" | "ingredients">("stock");
  const [queueTab, setQueueTab] = useState<QueueTab>("preparing");
  const [orders, setOrders] = useState<BaristaOrder[]>([]);
  const [stock, setStock] = useState<StockItem[]>(defaultMenuStock);
  const [ingredientStock, setIngredientStock] = useState<IngredientItem[]>(defaultIngredients);
  const [receivingSku, setReceivingSku] = useState<string | null>(null);
  const [receivingAmount, setReceivingAmount] = useState("1000");
  const [selectedRecipeProduct, setSelectedRecipeProduct] = useState<StockItem | null>(null);
  const [dynamicRecipe, setDynamicRecipe] = useState<RecipeIngredient[] | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [refundOrder, setRefundOrder] = useState<BaristaOrder | null>(null);
  const [refundBank, setRefundBank] = useState("VCB");
  const [refundAccount, setRefundAccount] = useState("");
  const [refundedOrders, setRefundedOrders] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("brewlite_refunded_orders");
        if (saved) {
          setRefundedOrders(JSON.parse(saved));
        }
      } catch {}
    }
  }, []);

  const openRefundModal = (order: BaristaOrder) => {
    setRefundOrder(order);
    let acc = "";
    let bank = "MB";
    if (order.refundRef && order.refundRef.startsWith("VIETQR:")) {
      const parts = order.refundRef.split(":");
      if (parts[1]) bank = parts[1];
      if (parts[2]) acc = parts[2];
    } else if (typeof window !== "undefined") {
      acc = localStorage.getItem(`refund_account_${order.id}`) || "";
      bank = localStorage.getItem(`refund_bank_${order.id}`) || "MB";
    }
    setRefundAccount(acc);
    setRefundBank(bank);
  };

  const handleConfirmRefund = async (orderId: number) => {
    try {
      await confirmRefund(orderId, `VIETQR:${refundBank}:${refundAccount}`);
    } catch (e) {
      console.warn("Backend confirmRefund sync note:", e);
    }
    setRefundedOrders((prev) => {
      const next = Array.from(new Set([...prev, orderId]));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("brewlite_refunded_orders", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    setRefundOrder(null);
    setNotice(`Đã xác nhận hoàn tiền thành công cho đơn #${orderId}!`);
  };

  useEffect(() => {
    if (selectedRecipeProduct?.id) {
      let ignore = false;
      setLoadingRecipe(true);
      getProductRecipe(selectedRecipeProduct.id)
        .then((res) => {
          if (!ignore && res && Array.isArray(res.items) && res.items.length > 0) {
            setDynamicRecipe(
              res.items.map((i) => ({
                ingredient: i.name,
                quantity: i.quantity,
                unit: i.unit.toLowerCase(),
                ingredientId: i.ingredientId,
              }))
            );
          }
        })
        .catch(() => {
          if (!ignore) setDynamicRecipe(null);
        })
        .finally(() => {
          if (!ignore) setLoadingRecipe(false);
        });
      return () => {
        ignore = true;
      };
    } else {
      setDynamicRecipe(null);
    }
  }, [selectedRecipeProduct]);

  const availability = useStockStore((state) => state.availability);
  const hydrateAvailability = useStockStore((state) => state.hydrate);
  const setProductAvailability = useStockStore((state) => state.setProductAvailability);
  const user = useAuthStore((state) => state.user);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const [authChecked, setAuthChecked] = useState(false);
  const [notice, setNotice] = useState("");
  const [updatedAt, setUpdatedAt] = useState("vừa xong");

  useEffect(() => {
    hydrateAuth();
    hydrateAvailability();
    setAuthChecked(true);
    const sync = () => hydrateAvailability();
    window.addEventListener("brewlite:stock-availability-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("brewlite:stock-availability-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [hydrateAuth, hydrateAvailability]);

  const previousOrders = useRef<Map<number, string>>(new Map());

  // Tải danh sách đơn hàng thực tế từ backend
  useEffect(() => {
    let ignore = false;
    let timer: any = null;
    async function loadBackendOrders() {
      try {
        const res = await getAllBaristaOrders();
        const list = Array.isArray(res) ? res : res?.data;
        if (!ignore && Array.isArray(list)) {
          const newlyCancelled = list.filter((order) => order.status === "CANCELLED" && previousOrders.current.has(order.id) && previousOrders.current.get(order.id) !== "CANCELLED");
          previousOrders.current = new Map(list.map((order) => [order.id, order.status]));
          if (newlyCancelled.length) setNotice(`Đơn ${newlyCancelled.map((order) => `#${order.id}`).join(", ")} đã bị hủy. Không tiếp tục pha chế các đơn này.`);
          const mapped = list.map(mapBackendOrderToBarista);
          setOrders(mapped);
          setUpdatedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
        }
      } catch (err) {
        console.warn("Không thể tải đơn hàng từ máy chủ:", err);
      } finally {
        if (!ignore) {
          timer = setTimeout(loadBackendOrders, 5000);
        }
      }
    }
    loadBackendOrders();
    return () => {
      ignore = true;
      if (timer) clearTimeout(timer);
    };
  }, [user]);

  const loadRealIngredients = async () => {
    try {
      const res: any = await getIngredientsStock(1, 50);
      const raw = res?.data ?? res;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      if (Array.isArray(list) && list.length > 0) {
        setIngredientStock(
          list.map((item: any) => ({
            id: item.id,
            sku: `NL-${String(item.id).padStart(3, "0")}`,
            name: item.name,
            detail: `Nguyên liệu pha chế tiêu chuẩn · Mã DB #${item.id}`,
            unit: item.unit ? item.unit.toLowerCase() : "ml",
            stock: item.stock,
            minimum: item.lowThreshold || 500,
          }))
        );
      }
    } catch (err) {
      console.warn("Sử dụng danh sách nguyên liệu mặc định:", err);
    }
  };

  const loadRealStock = async () => {
    try {
      const res: any = await getProductsStock();
      const raw = res?.data ?? res;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      if (Array.isArray(list) && list.length > 0) {
        setStock(
          list.map((item: any) => ({
            id: item.id,
            sku: `SP-${String(item.id).padStart(3, "0")}`,
            name: item.name,
            description: item.category,
            category: item.category,
            price: item.price,
            stock: item.stock ?? 0,
            target: Math.max(item.stock ?? 0, 20),
          })),
        );
      }
    } catch (err) {
      console.warn("Sử dụng danh sách menu mặc định:", err);
    }
  };

  // Tải danh sách sản phẩm và nguyên liệu thực tế từ database
  useEffect(() => {
    loadRealStock();
    loadRealIngredients();
    const interval = setInterval(() => {
      loadRealIngredients();
      loadRealStock();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const counts = useMemo(() => ({
    pending: orders.filter((order) => order.stage === "pending").length,
    preparing: orders.filter((order) => order.stage === "preparing").length,
    ready: orders.filter((order) => order.stage === "ready").length,
    cancelled: orders.filter((order) => order.stage === "cancelled").length,
    history: orders.filter((order) => order.stage === "completed").length,
  }), [orders]);

  const needingRefundCount = useMemo(() => {
    return orders.filter(
      (order) => order.stage === "cancelled" && !order.isRefunded && !refundedOrders.includes(order.id)
    ).length;
  }, [orders, refundedOrders]);

  async function moveOrder(id: number, nextStatus: "PAID" | "PREPARING" | "READY" | "COMPLETED") {
    const stage: OrderStage =
      nextStatus === "COMPLETED"
        ? "completed"
        : nextStatus === "READY"
        ? "ready"
        : nextStatus === "PAID" || nextStatus === "PREPARING"
        ? "preparing"
        : "pending";
    try {
      // Khi Barista bấm "Bắt đầu pha chế" (PREPARING):
      // Trừ trực tiếp nguyên liệu của đơn hàng vào tồn kho quầy ngay lập tức,
      // tự động kéo theo việc giảm số ly pha được của các món liên quan trên giao diện!
      if (nextStatus === "PREPARING") {
        const orderToPrepare = orders.find((o) => o.id === id);
        if (orderToPrepare) {
          setIngredientStock((prevIngredients) => {
            const nextList = prevIngredients.map((item) => ({ ...item }));
            for (const line of orderToPrepare.items) {
              const recipe = getRecipeForProduct(line.name);
              const qty = line.quantity || 1;
              for (const rec of recipe) {
                const normalize = (s: string) => s.toLowerCase().trim();
                const recName = normalize(rec.ingredient);
                const targetIng = nextList.find((i) => {
                  const iName = normalize(i.name);
                  return iName === recName || iName.includes(recName) || recName.includes(iName);
                });
                if (targetIng) {
                  targetIng.stock = Math.max(0, targetIng.stock - rec.quantity * qty);
                }
              }
              if (Array.isArray(line.options)) {
                for (const opt of line.options) {
                  const optName = opt.replace(/^\+\s*/, "").toLowerCase().trim();
                  const targetTop = nextList.find((i) => {
                    const iName = i.name.toLowerCase().trim();
                    return iName === optName || iName.includes(optName) || optName.includes(iName);
                  });
                  if (targetTop) {
                    targetTop.stock = Math.max(0, targetTop.stock - 30 * qty);
                  }
                }
              }
            }
            return nextList;
          });
        }
      }

      await updateOrderStatus(id, nextStatus);
      setOrders((current) => current.map((order) => order.id === id ? { ...order, stage, rawStatus: nextStatus } : order));
      setNotice(
        nextStatus === "PAID"
          ? `Đơn #${id} đã xác nhận nhận tiền thành công (PAID). Màn hình khách đang được chuyển sang Chờ lấy nước.`
          : nextStatus === "PREPARING"
          ? `Đơn #${id} đã bắt đầu pha chế (PREPARING). Đã trừ nguyên liệu và tự động cập nhật giảm số ly tồn quầy!`
          : nextStatus === "READY"
          ? `Đơn #${id} đã làm xong và chuyển sang mục Làm xong (READY).`
          : `Đơn #${id} đã ghi nhận giao thành công (COMPLETED).`,
      );
      // Tải lại dữ liệu mới nhất từ CSDL máy chủ để đồng bộ
      await loadRealIngredients();
      await loadRealStock();
    } catch (err: unknown) {
      console.error("Lỗi cập nhật trạng thái đơn hàng:", err);
      const errMsg = err instanceof Error ? err.message : "Lỗi máy chủ";
      setNotice(`Không thể cập nhật đơn #${id}: ${errMsg}`);
    }
  }

  async function refresh() {
    setUpdatedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    try {
      const res = await getAllBaristaOrders();
      const list = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(list)) {
        setOrders(list.map(mapBackendOrderToBarista));
      }
    } catch (err) {
      console.error(err);
    }
    await loadRealStock();
    await loadRealIngredients();
    setNotice("Đã đồng bộ đơn hàng và tồn kho mới nhất.");
  }

  function toggleAvailability(sku: string) {
    const item = stock.find((entry) => entry.sku === sku);
    if (!item) return;
    const currentlyAvailable = availability[item.name] ?? availability[item.sku] ?? item.stock > 0;
    const nextAvailable = !currentlyAvailable;
    
    // Đồng bộ theo cả SKU và Tên món để trang /menu ẩn ngay lập tức
    setProductAvailability([item.sku, item.name, item.name.toLowerCase().trim()], nextAvailable);
    
    setNotice(
      `${item.name} đã chuyển sang ${
        nextAvailable
          ? "Đang bán (đã hiển thị trên thực đơn của khách)"
          : "Tạm hết (đã ẩn hoàn toàn khỏi thực đơn của khách)"
      }; thực đơn được đồng bộ ngay lập tức.`
    );
  }

  async function receiveIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(receivingAmount);
    if (!receivingSku || !Number.isFinite(amount) || amount <= 0) return;
    const item = ingredientStock.find((entry) => entry.sku === receivingSku);
    if (!item) return;

    setReceivingSku(null);

    // Tìm ID nguyên liệu trong database (trực tiếp hoặc theo id trong sku/tên)
    let targetId = item.id;
    if (!targetId && item.sku) {
      const parsed = parseInt(item.sku.replace("NL-", ""), 10);
      if (!isNaN(parsed) && parsed > 50) targetId = parsed;
    }

    if (targetId) {
      try {
        await addIngredientStock(targetId, amount, "Nhập thêm nguyên liệu tại quầy Barista");
        await loadRealIngredients();
        setNotice(`✓ Đã cập nhật CSDL thành công: Nhập thêm ${amount} ${item.unit} cho ${item.name}.`);
      } catch (err: any) {
        console.error("Lỗi lưu database:", err);
        setNotice(`Lỗi khi lưu CSDL: ${err.message || "Không thể kết nối"}`);
      }
    } else {
      // Cập nhật local nếu chưa tải xong database
      setIngredientStock((current) => current.map((entry) => entry.sku === receivingSku
        ? { ...entry, stock: Number((entry.stock + amount).toFixed(2)) }
        : entry));
      setNotice(`Đã nhập thêm ${amount} ${item.unit} ${item.name}.`);
    }
  }

  function getRecipeForProduct(productName: string): RecipeIngredient[] {
    if (PRODUCT_RECIPES[productName]) {
      return PRODUCT_RECIPES[productName];
    }
    // Fallback tìm gần đúng
    const foundKey = Object.keys(PRODUCT_RECIPES).find((k) => productName.includes(k) || k.includes(productName));
    if (foundKey) return PRODUCT_RECIPES[foundKey];
    return [
      { ingredient: "Cốt trà đen đã pha", quantity: 150, unit: "ml" },
      { ingredient: "Sữa tươi thanh trùng", quantity: 100, unit: "ml" },
      { ingredient: "Sữa đặc", quantity: 20, unit: "ml" },
    ];
  }

  function calculateProductMaxCups(productName: string, currentIngredients: IngredientItem[]): number {
    const recipe = getRecipeForProduct(productName);
    if (!recipe || recipe.length === 0) return 0;
    const normalize = (s: string) => s.toLowerCase().trim();
    let minCups = 999999;
    for (const rec of recipe) {
      const recName = normalize(rec.ingredient);
      const ing = currentIngredients.find((i) => {
        const iName = normalize(i.name);
        return iName === recName || iName.includes(recName) || recName.includes(iName);
      });
      if (!ing || ing.stock <= 0) {
        return 0;
      }
      const cups = Math.floor(ing.stock / rec.quantity);
      if (cups < minCups) {
        minCups = cups;
      }
    }
    return minCups === 999999 ? 0 : Math.max(0, minCups);
  }

  const visibleOrders = orders.filter((order) => order.stage === (queueTab === "history" ? "completed" : queueTab));

  const scrollTo = (id: string) => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // 1. Chặn khách hàng thông thường (CUSTOMER) truy cập quầy Barista
  if (authChecked && user && user.role !== "BARISTA") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="size-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl mb-4 shadow-sm">
          🚫
        </div>
        <h1 className="text-xl font-bold text-[#1e3429]">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-[#556358] max-w-xs leading-relaxed">
          Khu vực quầy pha chế chỉ dành riêng cho tài khoản nhân viên <b>Barista</b>. Tài khoản hiện tại của bạn là <b>{user.fullName}</b> ({user.role}).
        </p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-[#174c32] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#124029] transition active:scale-95"
        >
          Về trang chủ thực đơn
        </Link>
      </div>
    );
  }

  // 2. Chặn khách chưa đăng nhập truy cập quầy Barista
  if (authChecked && !user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="size-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-3xl mb-4 shadow-sm">
          🔒
        </div>
        <h1 className="text-xl font-bold text-[#1e3429]">Yêu cầu đăng nhập</h1>
        <p className="mt-2 text-sm text-[#556358] max-w-xs leading-relaxed">
          Vui lòng đăng nhập bằng tài khoản <b>Barista</b> để quản lý hàng đợi và quầy pha chế.
        </p>
        <Link
          href="/login?redirect=/barista"
          className="mt-6 rounded-xl bg-[#174c32] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#124029] transition active:scale-95"
        >
          Đăng nhập Barista
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f7f5ef] text-[#1e3429] pb-8">
      {/* Mobile Barista Subheader */}
      <div className="sticky top-0 z-20 border-b border-[#e2e5dc] bg-[#fbfaf6]/95 backdrop-blur-md px-3 py-2 shadow-2xs">
        <nav aria-label="Khu vực quầy" className="grid grid-cols-3 gap-1 rounded-xl bg-[#edece5] p-1 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => scrollTo("barista-queue")}
            className="rounded-lg py-2 transition cursor-pointer bg-white text-[#174c32] shadow-xs hover:brightness-95"
          >
            📋 Hàng đợi ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setInventoryTab("stock");
              scrollTo("barista-inventory");
            }}
            className="rounded-lg py-2 transition cursor-pointer text-[#657067] hover:text-[#174c32] hover:bg-white/50"
          >
            ☕ Tồn món ({stock.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setInventoryTab("ingredients");
              scrollTo("barista-inventory");
            }}
            className="rounded-lg py-2 transition cursor-pointer text-[#657067] hover:text-[#174c32] hover:bg-white/50"
          >
            🥛 NVL ({ingredientStock.length})
          </button>
        </nav>
      </div>

      <main className="px-4 py-4 space-y-6">
        {/* SECTION 1: HÀNG ĐỢI PHA CHẾ */}
        <section id="barista-queue" className="space-y-4 scroll-mt-14">
          {/* Title and Refresh Row */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#55715e]">Quầy pha chế mang đi</p>
              <h1 className="text-xl font-extrabold text-[#17432e]">Hàng đợi pha chế</h1>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-1 rounded-xl border border-[#d9ddd5] bg-white px-3 py-1.5 text-xs font-bold text-[#1e3429] shadow-2xs hover:bg-[#f5f5ef] active:scale-95 transition cursor-pointer shrink-0"
            >
              ↻ <span>Làm mới</span>
            </button>
          </div>

          {/* Live Status Bar */}
          <div className="flex items-center justify-between rounded-xl bg-white border border-[#e6e8e0] px-3.5 py-2 text-xs text-[#556358] shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#168451] animate-pulse" />
              <span className="font-semibold text-[#1e3429]">{orders.length} đơn</span>
              <span className="text-[11px] text-[#788078]">· Mang đi</span>
            </div>
            <span className="text-[11px] text-[#788078]">Cập nhật {updatedAt}</span>
          </div>

          {notice && (
            <p role="status" className="rounded-lg border border-[#d4e7d8] bg-[#eef7ef] px-4 py-2.5 text-xs text-[#225c3a] flex items-center justify-between">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")} className="font-bold text-sm cursor-pointer ml-2" aria-label="Đóng thông báo">×</button>
            </p>
          )}

          {/* Cảnh báo đơn đã hủy cần hoàn tiền nếu có */}
          {needingRefundCount > 0 ? (
            <button
              type="button"
              onClick={() => setQueueTab("cancelled")}
              className="w-full rounded-xl bg-red-50 border-2 border-red-500 p-3 flex items-center justify-between text-xs font-bold text-red-900 shadow-sm transition hover:bg-red-100 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-base animate-pulse">🚨</span>
                <div>
                  <p className="font-extrabold text-red-700">Có {needingRefundCount} đơn đã hủy cần hoàn trả tiền!</p>
                  <p className="text-[11px] font-normal text-stone-600">Bấm vào đây để mở tab Đã hủy & hiện mã QR chuyển lại tiền cho khách</p>
                </div>
              </div>
              <span className="bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shrink-0">
                Xử lý ngay →
              </span>
            </button>
          ) : counts.cancelled > 0 ? (
            <div className="w-full rounded-xl bg-emerald-50 border border-emerald-300 p-3 flex items-center gap-2 text-xs font-bold text-emerald-800 shadow-sm">
              <span className="text-base">✅</span>
              <div>
                <p className="font-extrabold text-emerald-800">Tất cả {counts.cancelled} đơn đã hủy đều đã hoàn tiền xong!</p>
                <p className="text-[11px] font-normal text-emerald-700">Không còn đơn nào nợ tiền khách hàng.</p>
              </div>
            </div>
          ) : null}

          {/* Status Filter Tabs (Flex Wrap để điện thoại hiển thị đủ tất cả tab) */}
          <div className="flex flex-wrap gap-1.5 pb-1 -mx-1 px-1" role="tablist" aria-label="Trạng thái đơn hàng">
            {(["pending", "cancelled", "preparing", "ready", "history"] as QueueTab[]).map((tab) => {
              const label =
                tab === "pending"
                  ? "Chờ TT"
                  : tab === "cancelled"
                  ? "Đã hủy"
                  : tab === "preparing"
                  ? "Đang làm"
                  : tab === "ready"
                  ? "Làm xong"
                  : "Lịch sử";
              const isActive = queueTab === tab;
              const isAlert = tab === "cancelled" && needingRefundCount > 0;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setQueueTab(tab)}
                  className={`whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? isAlert
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-[#174c32] text-white shadow-xs"
                      : isAlert
                      ? "bg-red-50 border-2 border-red-400 text-red-700 hover:bg-red-100"
                      : "bg-white border border-[#e3e5dc] text-[#556358] hover:bg-[#f4f5ef]"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/25 text-white"
                        : isAlert
                        ? "bg-red-200 text-red-800"
                        : "bg-[#edece5] text-[#445248]"
                    }`}
                  >
                    {tab === "cancelled"
                      ? (needingRefundCount > 0 ? `${needingRefundCount}` : `${counts.cancelled} xong`)
                      : counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          {queueTab === "pending" && <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed">Đơn đang chờ khách quét QR hoặc thanh toán. Kiểm tra số dư và bấm &ldquo;Xác nhận đã nhận tiền (PAID)&rdquo;.</div>}
          {queueTab === "cancelled" && <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">Đơn đã hủy · Không cần pha chế. Tự động đồng bộ mỗi 5 giây.</div>}
          {queueTab === "history" && <div className="rounded-xl bg-[#eeefe9] border border-[#e2e1d7] px-3.5 py-2.5 text-xs text-[#465b4c]">Lịch sử đơn đã giao hoàn tất trong ca làm việc.</div>}

          {visibleOrders.length ? (
            <div className="flex flex-col gap-4 w-full">
              {visibleOrders.map((order) => (
                <article key={order.id} className="overflow-hidden rounded-2xl border border-[#e9e7df] bg-white shadow-[0_2px_8px_rgba(31,47,35,0.04)]">
                  <div className="flex items-start justify-between gap-3 bg-[#f1f0e9] px-4 py-3.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-[#163f2b]">#{order.id}</h2>
                        <span className="rounded-md bg-[#e1e5dc] px-2 py-0.5 text-[11px] font-semibold text-[#445248]">Mang đi</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#2c3d32]">{order.customer}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                        order.stage === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : order.rawStatus === "PENDING"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : order.stage === "preparing" && order.rawStatus === "PAID"
                          ? "bg-[#e2e8f0] text-[#334155]"
                          : order.stage === "preparing"
                          ? "bg-[#e0f2fe] text-[#0369a1]"
                          : order.stage === "ready"
                          ? "bg-[#f3e8ff] text-[#6b21a8]"
                          : "bg-[#d7f5df] text-[#16623a]"
                      }`}>
                        {order.stage === "cancelled"
                          ? "Đã hủy"
                          : order.rawStatus === "PENDING"
                          ? "Chờ thanh toán"
                          : order.rawStatus === "PAID"
                          ? "Chờ làm"
                          : order.rawStatus === "PREPARING"
                          ? "Đang pha"
                          : order.stage === "ready"
                          ? "Chờ lấy"
                          : "Đã giao"}
                      </span>
                      <p className="mt-1.5 text-[11px] text-[#737970]">Đặt lúc {order.placedAt}</p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    {order.items.map((item, index) => (
                      <div key={`${order.id}-${index}`} className="rounded-xl bg-[#f8f7f3] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm">
                            <span className="mr-2 inline-flex size-6 items-center justify-center rounded-md bg-[#b5edc1] text-xs font-bold text-[#154a2c]">{item.quantity}×</span>
                            {item.name}
                          </p>
                          <span className="shrink-0 text-xs font-semibold text-[#35513e]">Size {item.size}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.options.map((option) => (
                            <span key={option} className="rounded-md bg-[#eeede7] px-2 py-0.5 text-[11px] text-[#555c56]">{option}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {order.note && <div className="rounded-xl bg-[#edede8] px-3 py-2 text-xs text-[#4b554e]"><span className="font-semibold text-[#315840]">Ghi chú:</span> {order.note}</div>}
                    {order.stage === "cancelled" ? (
                      <div className="space-y-2 border-t border-red-100 pt-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-red-700">Đơn đã hủy · Không cần pha chế</span>
                          <span className="font-bold text-stone-700">Cần trả lại: {money(order.total)}</span>
                        </div>
                        {refundedOrders.includes(order.id) || order.isRefunded ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-xl bg-emerald-50 border border-emerald-300 p-2 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                              <span>✅</span> Đã hoàn tiền cho khách thành công
                            </div>
                            <button
                              type="button"
                              onClick={() => openRefundModal(order)}
                              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer shrink-0"
                            >
                              Xem lại QR
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openRefundModal(order)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-red-700 hover:to-amber-700 transition cursor-pointer"
                          >
                            💸 Trả lại tiền cho khách (Hiện mã QR)
                          </button>
                        )}
                      </div>
                    ) : order.stage !== "completed" ? (
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="flex gap-2">
                          {order.rawStatus === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => moveOrder(order.id, "PAID")}
                              className="flex-1 rounded-xl bg-[#168451] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#126b42] cursor-pointer"
                            >
                              ✓ Xác nhận đã nhận tiền (PAID)
                            </button>
                          )}
                          {order.rawStatus === "PAID" && (
                            <button
                              type="button"
                              onClick={() => moveOrder(order.id, "PREPARING")}
                              className="flex-1 rounded-xl bg-[#145332] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f4328] cursor-pointer"
                            >
                              ▶ Bắt đầu pha
                            </button>
                          )}
                          {order.rawStatus === "PREPARING" && (
                            <button
                              type="button"
                              onClick={() => moveOrder(order.id, "READY")}
                              className="flex-1 rounded-xl bg-[#145332] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f4328] cursor-pointer"
                            >
                              ✓ Đã làm xong
                            </button>
                          )}
                          {order.stage === "ready" && (
                            <button
                              type="button"
                              onClick={() => moveOrder(order.id, "COMPLETED")}
                              className="flex-1 rounded-xl bg-[#145332] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f4328] cursor-pointer"
                            >
                              ✓ Đã giao thành công
                            </button>
                          )}
                        </div>
                        {/* Cho phép Barista hoàn tiền nếu khách báo hủy trực tiếp tại quầy */}
                        {order.rawStatus === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => openRefundModal(order)}
                            className="w-full text-center text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline py-1"
                          >
                            Hủy đơn & Hiện mã QR hoàn tiền cho khách
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="border-t border-[#eeede7] pt-2.5 text-xs text-[#56705d]">✓ Đã giao thành công · {order.elapsed}</div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d9ddd5] bg-white px-6 py-12 text-center text-sm text-[#737970] space-y-2">
              <p>Chưa có đơn trong mục <b>{queueTab === "preparing" ? "Đang làm" : queueTab === "ready" ? "Làm xong" : queueTab === "cancelled" ? "Đã hủy" : "Lịch sử"}</b>.</p>
            </div>
          )}
        </section>

        {/* SECTION 2: QUẢN LÝ TỒN KHO & NGUYÊN LIỆU (NẰM TRỰC TIẾP DƯỚI HÀNG ĐỢI) */}
        <section id="barista-inventory" className="space-y-4 scroll-mt-14 pt-4 border-t-2 border-[#e6e5dd]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#55715e]">Quản lý tồn kho tại quầy</p>
              <h2 className="text-xl font-extrabold text-[#17432e]">
                {inventoryTab === "stock" ? "Tồn kho theo món" : "Tồn kho nguyên liệu"}
              </h2>
            </div>
            <span className="rounded-full bg-[#eef0e9] px-2.5 py-1 text-xs font-bold text-[#35513e]">
              {inventoryTab === "stock" ? `${stock.length} món` : `${ingredientStock.length} loại`}
            </span>
          </div>

          {/* Sub Switcher: Món vs Nguyên liệu */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#edece5] p-1 text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => setInventoryTab("stock")}
              className={`rounded-lg py-2 transition cursor-pointer ${
                inventoryTab === "stock" ? "bg-white text-[#174c32] shadow-xs" : "text-[#657067] hover:text-[#174c32]"
              }`}
            >
              ☕ Tồn kho theo món ({stock.length})
            </button>
            <button
              type="button"
              onClick={() => setInventoryTab("ingredients")}
              className={`rounded-lg py-2 transition cursor-pointer ${
                inventoryTab === "ingredients" ? "bg-white text-[#174c32] shadow-xs" : "text-[#657067] hover:text-[#174c32]"
              }`}
            >
              🥛 Nguyên liệu ({ingredientStock.length})
            </button>
          </div>

          {inventoryTab === "stock" ? (
            <div className="space-y-3">
              <p className="text-xs text-[#737970] px-1">
                Bấm <b>Tạm hết</b> để ẩn món ngay lập tức khỏi menu khách. Bấm <b>Công thức</b> để xem định lượng và tồn NVL.
              </p>
              <div className="flex flex-col gap-3 w-full">
                {stock.map((item) => {
                  const currentCups = calculateProductMaxCups(item.name, ingredientStock);
                  const targetCups = Math.max(item.target || 20, currentCups);
                  const percentage = targetCups > 0 ? Math.round((currentCups / targetCups) * 100) : 0;
                  const isAvailable = (availability[item.name] ?? availability[item.sku] ?? true) && currentCups > 0;
                  return (
                    <div key={item.sku} className="rounded-2xl border border-[#e6e5dd] bg-white p-4 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded-md bg-[#eef0e9] px-2 py-0.5 font-mono text-[11px] font-bold text-[#556358]">{item.sku}</span>
                            <span className="rounded-md bg-[#f0f4ea] px-2 py-0.5 text-[11px] font-medium text-[#3b5e43]">{item.category}</span>
                          </div>
                          <h3 className="mt-1 font-bold text-base text-[#17432e] leading-snug">{item.name}</h3>
                          <p className="mt-0.5 text-xs text-[#737970] line-clamp-1">{item.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-sm text-[#183d2c]">{money(item.price)}</span>
                        </div>
                      </div>

                      {/* Stock Progress Bar */}
                      <div className="rounded-xl bg-[#f7f6f1] p-2.5">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[#647066] font-medium">Tồn tại quầy:</span>
                          <span className="font-bold text-[#1e3429]">
                            {currentCups} / {targetCups} ly <span className="font-normal text-[#737970]">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#e3e2dc]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              currentCups === 0 ? "bg-[#bd3d34]" : currentCups <= 5 ? "bg-[#bc8a2f]" : "bg-[#168451]"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#f0eee6]">
                        <button
                          type="button"
                          onClick={() => setSelectedRecipeProduct(item)}
                          className="flex items-center gap-1 rounded-xl border border-[#d9ddd5] bg-white px-3 py-2 text-xs font-semibold text-[#185332] hover:bg-[#f5f8f5] active:scale-95 transition cursor-pointer"
                        >
                          <span>🔍</span>
                          <span>Công thức</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAvailability(item.sku)}
                          aria-label={`Chuyển ${item.name} sang ${isAvailable ? "Tạm hết" : "Đang bán"}`}
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 cursor-pointer ${
                            currentCups === 0
                              ? "bg-[#fde4e1] text-[#a5332a] hover:bg-[#fbd3cf]"
                              : isAvailable
                              ? "bg-[#daf4e0] text-[#1e7141] hover:bg-[#cbf0d3]"
                              : "bg-[#fde4e1] text-[#a5332a] hover:bg-[#fbd3cf]"
                          }`}
                        >
                          {currentCups === 0 ? "● Hết hàng" : isAvailable ? "● Đang bán" : "● Tạm hết (Ẩn menu)"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[#737970] px-1">
                Theo dõi mức tồn nguyên liệu thực tế tại quầy và bấm <b>+ Nhập hàng</b> để bổ sung.
              </p>
              <div className="flex flex-col gap-3 w-full">
                {ingredientStock.map((item) => {
                  const status = item.stock === 0 ? "Tạm hết" : item.stock <= item.minimum ? "Sắp hết" : "Còn hàng";
                  const percent = Math.min(Math.round((item.stock / Math.max(item.minimum * 2, 1)) * 100), 100);
                  return (
                    <div key={item.sku} className="rounded-2xl border border-[#e6e5dd] bg-white p-4 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded-md bg-[#eef0e9] px-2 py-0.5 font-mono text-[11px] font-bold text-[#556358]">{item.sku}</span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                status === "Tạm hết"
                                  ? "bg-[#fde4e1] text-[#a5332a]"
                                  : status === "Sắp hết"
                                  ? "bg-[#fff1d5] text-[#805817]"
                                  : "bg-[#daf4e0] text-[#1e7141]"
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                          <h3 className="mt-1 font-bold text-base text-[#17432e] leading-snug">{item.name}</h3>
                          <p className="mt-0.5 text-xs text-[#737970]">{item.detail}</p>
                        </div>
                      </div>

                      {/* Ingredient Stock Bar */}
                      <div className="rounded-xl bg-[#f7f6f1] p-2.5">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[#647066] font-medium">Tồn kho hiện tại:</span>
                          <span className="font-bold text-[#1e3429]">
                            {new Intl.NumberFormat("vi-VN").format(item.stock)} {item.unit}
                            <span className="font-normal text-[#737970]"> (Tối thiểu {item.minimum} {item.unit})</span>
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#e3e2dc]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              status === "Tạm hết" ? "bg-[#bd3d34]" : status === "Sắp hết" ? "bg-[#bc8a2f]" : "bg-[#168451]"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#f0eee6]">
                        <button
                          type="button"
                          onClick={() => {
                            setReceivingSku(item.sku);
                            setReceivingAmount("1000");
                          }}
                          className="flex items-center gap-1 rounded-xl bg-[#174c32] px-4 py-2 text-xs font-bold text-white hover:bg-[#124029] active:scale-95 transition cursor-pointer shadow-xs"
                        >
                          <span>+ Nhập hàng</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL XEM CÔNG THỨC & TỒN KHO NGUYÊN LIỆU CHI TIẾT */}
      {selectedRecipeProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10251b]/50 backdrop-blur-xs p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedRecipeProduct(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#e9e7df] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#eaf4ed] px-2 py-0.5 text-xs font-bold text-[#145332]">{selectedRecipeProduct.sku}</span>
                  <span className="rounded-md bg-[#f0efe9] px-2 py-0.5 text-xs text-[#5c665e]">{selectedRecipeProduct.category}</span>
                </div>
                <h2 className="mt-2 text-2xl font-bold text-[#17432e]">{selectedRecipeProduct.name}</h2>
                <p className="mt-1 text-xs text-[#6e7870]">Định lượng công thức chuẩn (size M) và tồn kho nguyên liệu hiện tại tại quầy.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecipeProduct(null)}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 text-xl font-bold cursor-pointer"
                aria-label="Đóng popup công thức"
              >
                ×
              </button>
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#495e4f] mb-2.5">
                Công thức pha chế & Tồn nguyên liệu
                {loadingRecipe && <span className="ml-2 font-normal text-stone-400 lowercase">(đang tải...)</span>}
              </h3>
              <div className="overflow-hidden rounded-xl border border-[#e6e5dd]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f7f6f1] text-[#556358] uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2.5">Nguyên liệu</th>
                      <th className="px-3 py-2.5 text-right">Cần / ly (M)</th>
                      <th className="px-3 py-2.5 text-right">Tồn kho quầy</th>
                      <th className="px-3 py-2.5 text-center">Khả năng pha</th>
                      <th className="px-3.5 py-2.5 text-center">Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eceae3]">
                    {(dynamicRecipe || getRecipeForProduct(selectedRecipeProduct.name)).map((rec, idx) => {
                      const normalize = (s: string) => s.toLowerCase().trim();
                      const ingInfo =
                        ingredientStock.find((i) => normalize(i.name) === normalize(rec.ingredient)) ||
                        (rec.ingredientId ? ingredientStock.find((i) => i.id === rec.ingredientId) : undefined) ||
                        ingredientStock.find(
                          (i) =>
                            normalize(i.name).includes(normalize(rec.ingredient)) ||
                            normalize(rec.ingredient).includes(normalize(i.name)),
                        );
                      const curStock = ingInfo ? ingInfo.stock : 0;
                      const unit = ingInfo?.unit || rec.unit;
                      const maxCups = Math.floor(curStock / rec.quantity);
                      const isOutOfStock = curStock === 0 || maxCups === 0;
                      const isLow = curStock <= (ingInfo?.minimum ?? 500) || maxCups < 10;
                      return (
                        <tr key={idx} className="hover:bg-[#faf9f5]">
                          <td className="px-3.5 py-3 font-semibold text-[#1e3429]">{rec.ingredient}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-[#18462d]">
                            {rec.quantity} {unit}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-[#434e46]">
                            {new Intl.NumberFormat("vi-VN").format(curStock)} {unit}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-[#1a5b36]">
                            ~{maxCups} ly
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isOutOfStock
                                  ? "bg-red-100 text-red-800"
                                  : isLow
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isOutOfStock ? "Hết hàng" : isLow ? "Sắp hết" : "Dồi dào"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeede7] pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-600 font-medium">Trạng thái bán:</span>
                <button
                  type="button"
                  onClick={() => toggleAvailability(selectedRecipeProduct.sku)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    (availability[selectedRecipeProduct.name] ??
                    availability[selectedRecipeProduct.sku] ??
                    selectedRecipeProduct.stock > 0)
                      ? "bg-[#daf4e0] text-[#1e7141] hover:brightness-95"
                      : "bg-[#fde4e1] text-[#a5332a] hover:brightness-95"
                  }`}
                >
                  {(availability[selectedRecipeProduct.name] ??
                  availability[selectedRecipeProduct.sku] ??
                  selectedRecipeProduct.stock > 0)
                    ? "● Đang bán (Hiển thị trên menu)"
                    : "● Tạm hết (Đã ẩn khỏi menu khách)"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecipeProduct(null)}
                className="rounded-xl bg-[#145332] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0f4328] transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP NHẬP HÀNG NGUYÊN LIỆU */}
      {receivingSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10251b]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReceivingSku(null); }}>
          <form onSubmit={receiveIngredient} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#17432e]">Nhập hàng nguyên liệu</h2>
            <p className="mt-1 text-sm text-[#737970]">{ingredientStock.find((item) => item.sku === receivingSku)?.name}</p>
            <label className="mt-5 block text-sm font-semibold" htmlFor="ingredient-receive-amount">Số lượng nhập ({ingredientStock.find((item) => item.sku === receivingSku)?.unit})</label>
            <input autoFocus id="ingredient-receive-amount" type="number" min="1" step="1" value={receivingAmount} onChange={(event) => setReceivingAmount(event.target.value)} className="mt-2 w-full rounded-lg border border-[#d9ddd5] px-3 py-2.5 outline-none focus:border-[#267143] focus:ring-2 focus:ring-[#267143]/15"/>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setReceivingSku(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#59645b] hover:bg-[#f3f3ee] cursor-pointer">Hủy</button>
              <button type="submit" className="rounded-lg bg-[#145332] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f4328] cursor-pointer">Xác nhận nhập</button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP HOÀN TIỀN CHO KHÁCH (HIỆN MÃ QR CHUYỂN KHOẢN LẠI) */}
      {refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#eeede7] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#145332]">Hoàn tiền cho khách hàng</h3>
                <p className="text-xs text-[#556358]">Đơn #{refundOrder.id} · {refundOrder.customer}</p>
              </div>
              <button
                type="button"
                onClick={() => setRefundOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thông tin số tiền */}
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-center">
              <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Số tiền cần hoàn trả lại</p>
              <p className="text-2xl font-black text-red-700 mt-1">{money(refundOrder.total)}</p>
            </div>

            {/* Thông tin tài khoản nhận lại tiền của khách */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2c3d32] mb-1">Ngân hàng của khách:</label>
                <select
                  value={refundBank}
                  onChange={(e) => setRefundBank(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#145332]"
                >
                  <option value="MB">MB Bank (Quân Đội)</option>
                  <option value="VCB">Vietcombank</option>
                  <option value="TCB">Techcombank</option>
                  <option value="TPB">TPBank</option>
                  <option value="VPB">VPBank</option>
                  <option value="ACB">ACB</option>
                  <option value="ICB">VietinBank</option>
                  <option value="BIDV">BIDV</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2c3d32] mb-1">Số tài khoản của khách:</label>
                <input
                  type="text"
                  value={refundAccount}
                  onChange={(e) => setRefundAccount(e.target.value)}
                  placeholder="Nhập số tài khoản khách cấp (ví dụ: 0987654321)..."
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#145332]"
                />
              </div>

              {/* Mã QR VietQR tự động sinh cho Barista quét app ngân hàng */}
              <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#f8f9fa] border border-[#e9ecef]">
                <p className="text-xs text-[#495057] mb-2 font-medium text-center">
                  Barista mở App Ngân hàng trên điện thoại quét mã dưới đây để chuyển trả lại cho khách:
                </p>
                <img
                  src={`https://img.vietqr.io/image/${refundBank}-${refundAccount || "00000000"}-compact2.png?amount=${refundOrder.total}&addInfo=Hoan%20tien%20don%20${refundOrder.id}`}
                  alt="Mã VietQR hoàn tiền"
                  className="w-44 h-44 object-contain rounded-xl shadow-xs border bg-white p-1"
                />
                <p className="text-[11px] text-[#6c757d] mt-2">
                  Nội dung tự động: <b>Hoan tien don #{refundOrder.id}</b>
                </p>
              </div>
            </div>

            {/* Nút thao tác */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundOrder(null)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleConfirmRefund(refundOrder.id)}
                className="flex-1 rounded-xl bg-[#145332] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0f4328] transition cursor-pointer shadow-sm"
              >
                ✓ Đã chuyển hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
