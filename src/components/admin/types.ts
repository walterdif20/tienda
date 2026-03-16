import type { Product } from "@/types";

export type AdminOrderStatus =
  | "pending"
  | "link_pending"
  | "link_sent"
  | "paid"
  | "in_progress"
  | "in_transit"
  | "payment_in_review"
  | "completed"
  | "cancelled";

export type AdminOrderItem = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export type AdminOrder = {
  id: string;
  orderNumber?: string;
  buyer: string;
  email: string;
  items: AdminOrderItem[];
  total: number;
  status: AdminOrderStatus;
  note: string;
  createdAt: string;
  paymentMethod: "manual" | "bank_transfer" | "mercado_pago_link";
};

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  badge: string;
  images: Array<{
    url: string;
    alt: string;
  }>;
  isActive: boolean;
};

export type SaveProductInput = {
  id?: string;
  values: ProductFormValues;
};

export type SaveProductResult = Promise<{
  ok: boolean;
  message?: string;
}>;

export type UploadProductImageResult = Promise<{
  ok: boolean;
  url?: string;
  suggestedAlt?: string;
  message?: string;
}>;

export type DeleteProductResult = Promise<{
  ok: boolean;
  message?: string;
}>;

export type StatusChangeResult = Promise<{
  ok: boolean;
  message?: string;
}>;

export type ManualSaleInput = {
  buyer: string;
  email: string;
  productId: string;
  qty: number;
};

export type ManualSaleResult = Promise<{
  ok: boolean;
  message?: string;
}>;

export type AdminProduct = Product;
