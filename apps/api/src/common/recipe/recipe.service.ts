import { ConflictException, Injectable } from '@nestjs/common';
import { SIZE_FACTOR, type SizeKey } from './recipe.constants.js';

export interface RecipeItemPart {
  ingredientId: number;
  quantity: number;
}

export interface ProductWithRecipes {
  id: number;
  name?: string;
  recipes?: RecipeItemPart[];
  productRecipes?: RecipeItemPart[];
}

export interface ToppingWithRecipes {
  id: number;
  name?: string;
  recipes?: RecipeItemPart[];
  toppingRecipes?: RecipeItemPart[];
}

export interface OrderLineInput {
  product: ProductWithRecipes;
  size: SizeKey;
  toppings?: ToppingWithRecipes[];
  qty: number;
}

@Injectable()
export class RecipeService {
  // Chức năng: Xử lý tính toán / định dạng dữ liệu (calculateLine). Cách hoạt động: Biến đổi tham số đầu vào (product, size, toppings, qty) thành kết quả chuẩn để hiển thị hoặc tính toán.
  calculateLine(
    product: ProductWithRecipes,
    size: SizeKey,
    toppings: ToppingWithRecipes[] = [],
    qty: number = 1,
  ): Map<number, number> {
    const productRecipes = product.recipes ?? product.productRecipes ?? [];
    if (productRecipes.length === 0) {
      throw new ConflictException({
        code: 'RECIPE_MISSING',
        message: `Sản phẩm '${product.name || product.id}' chưa có công thức`,
        details: [{ productId: product.id }],
      });
    }

    const factor = SIZE_FACTOR[size] ?? 1.0;
    const singleCupMap = new Map<number, number>();

    for (const item of productRecipes) {
      const cupNeed = Math.ceil(item.quantity * factor);
      singleCupMap.set(item.ingredientId, (singleCupMap.get(item.ingredientId) || 0) + cupNeed);
    }

    for (const topping of toppings) {
      const toppingRecipes = topping.recipes ?? topping.toppingRecipes ?? [];
      for (const item of toppingRecipes) {
        singleCupMap.set(item.ingredientId, (singleCupMap.get(item.ingredientId) || 0) + item.quantity);
      }
    }

    const lineMap = new Map<number, number>();
    for (const [ingredientId, cupNeed] of singleCupMap.entries()) {
      lineMap.set(ingredientId, cupNeed * qty);
    }

    return lineMap;
  }

  // Chức năng: Xử lý tính toán / định dạng dữ liệu (calculateOrder). Cách hoạt động: Biến đổi tham số đầu vào (items) thành kết quả chuẩn để hiển thị hoặc tính toán.
  calculateOrder(items: OrderLineInput[]): Map<number, number> {
    const totalOrderMap = new Map<number, number>();

    for (const item of items) {
      const lineMap = this.calculateLine(
        item.product,
        item.size,
        item.toppings ?? [],
        item.qty,
      );

      for (const [ingredientId, amount] of lineMap.entries()) {
        const current = totalOrderMap.get(ingredientId) || 0;
        totalOrderMap.set(ingredientId, current + amount);
      }
    }

    return totalOrderMap;
  }

  // Chức năng: Hàm maxCups(product, size, stockMap). Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
  maxCups(
    product: ProductWithRecipes,
    size: SizeKey,
    stockMap: Map<number, number>,
  ): number {
    const productRecipes = product.recipes ?? product.productRecipes ?? [];
    if (productRecipes.length === 0) {
      return 0;
    }

    const factor = SIZE_FACTOR[size] ?? 1.0;
    let minCups = Number.MAX_SAFE_INTEGER;

    for (const item of productRecipes) {
      const cupNeed = Math.ceil(item.quantity * factor);
      if (cupNeed <= 0) continue;
      const currentStock = stockMap.get(item.ingredientId) ?? 0;
      const cups = Math.floor(currentStock / cupNeed);
      if (cups < minCups) {
        minCups = cups;
      }
    }

    return minCups === Number.MAX_SAFE_INTEGER ? 0 : Math.max(0, minCups);
  }

  // Chức năng: Lấy dữ liệu Bottleneck. Cách hoạt động: Truy vấn dữ liệu và trả về kết quả đã định dạng.
  getBottleneck(
    product: ProductWithRecipes,
    size: SizeKey,
    stockMap: Map<number, number>,
    ingredientNameMap?: Map<number, string>,
  ): { maxCups: number; limitedBy: string | null } {
    const productRecipes = product.recipes ?? product.productRecipes ?? [];
    if (productRecipes.length === 0) {
      return { maxCups: 0, limitedBy: null };
    }

    const factor = SIZE_FACTOR[size] ?? 1.0;
    let minCups = Number.MAX_SAFE_INTEGER;
    let bottleneckIngId: number | null = null;

    for (const item of productRecipes) {
      const cupNeed = Math.ceil(item.quantity * factor);
      if (cupNeed <= 0) continue;
      const currentStock = stockMap.get(item.ingredientId) ?? 0;
      const cups = Math.floor(currentStock / cupNeed);
      if (cups < minCups) {
        minCups = cups;
        bottleneckIngId = item.ingredientId;
      }
    }

    if (minCups === Number.MAX_SAFE_INTEGER) {
      return { maxCups: 0, limitedBy: null };
    }

    const maxCups = Math.max(0, minCups);
    const limitedBy = bottleneckIngId && ingredientNameMap ? (ingredientNameMap.get(bottleneckIngId) ?? null) : null;

    return { maxCups, limitedBy };
  }

  // Chức năng: Hàm isToppingAvailable(topping, stockMap). Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
  isToppingAvailable(topping: ToppingWithRecipes, stockMap: Map<number, number>): boolean {
    const toppingRecipes = topping.recipes ?? topping.toppingRecipes ?? [];
    if (toppingRecipes.length === 0) return true;

    for (const item of toppingRecipes) {
      const currentStock = stockMap.get(item.ingredientId) ?? 0;
      if (currentStock < item.quantity) {
        return false;
      }
    }
    return true;
  }
}
