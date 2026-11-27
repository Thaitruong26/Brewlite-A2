
export type SizeKey = 'S' | 'M' | 'L';

export const SIZE_SURCHARGE: Record<SizeKey, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

export const MAX_TOPPINGS_PER_ITEM = 3;

export const VND_PER_LOYALTY_POINT = 1000;
