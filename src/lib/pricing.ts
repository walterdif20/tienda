import type { DiscountRule } from "@/lib/discounts";
import { getCategoryDescendantIds } from "@/lib/categories";
import type { Category, Product } from "@/types";

export type AppliedDiscount = {
  label: string;
  amount: number;
};

export const getProductPricing = (
  product: Product,
  discounts: DiscountRule[],
  categories: Category[],
) => {
  const matching = discounts.filter((discount) => {
    if (discount.targetType === "product") {
      return discount.targetId === product.id;
    }

    const affectedCategoryIds = getCategoryDescendantIds(categories, discount.targetId);
    return affectedCategoryIds.includes(product.categoryId);
  });

  if (matching.length === 0) {
    return { originalPrice: product.price, finalPrice: product.price, appliedDiscount: null as AppliedDiscount | null };
  }

  const best = matching.reduce((current, candidate) => {
    const currentPrice = calculatePrice(product.price, current);
    const candidatePrice = calculatePrice(product.price, candidate);
    return candidatePrice < currentPrice ? candidate : current;
  });

  const finalPrice = calculatePrice(product.price, best);
  const amount = Math.max(0, product.price - finalPrice);

  return {
    originalPrice: product.price,
    finalPrice,
    appliedDiscount: {
      label: best.type === "percentage" ? `-${best.value}%` : `-$${best.value}`,
      amount,
    },
  };
};

const calculatePrice = (basePrice: number, discount: DiscountRule) => {
  if (discount.type === "percentage") {
    return Math.max(0, Math.round(basePrice * (1 - discount.value / 100)));
  }

  return Math.max(0, Math.round(basePrice - discount.value));
};
