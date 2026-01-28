import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
}

const clampQty = (qty: number, stock: number) =>
  Math.min(Math.max(qty, 1), stock);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1) => {
        const items = get().items;
        const existing = items.find((item) => item.productId === product.id);
        if (existing) {
          const nextQty = clampQty(existing.qty + qty, product.stock);
          set({
            items: items.map((item) =>
              item.productId === product.id
                ? { ...item, qty: nextQty }
                : item
            ),
          });
          return;
        }
        set({
          items: [
            ...items,
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              qty: clampQty(qty, product.stock),
              imageUrl: product.images[0]?.url,
              slug: product.slug,
              stock: product.stock,
            },
          ],
        });
      },
      removeItem: (productId) =>
        set({ items: get().items.filter((item) => item.productId !== productId) }),
      updateQty: (productId, qty) => {
        const items = get().items;
        set({
          items: items.map((item) =>
            item.productId === productId
              ? { ...item, qty: clampQty(qty, item.stock) }
              : item
          ),
        });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "tienda-cart" }
  )
);
