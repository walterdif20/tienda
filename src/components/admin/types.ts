import type { Product } from "@/types";

export type AdminOrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export type AdminOrderItem = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export type AdminOrder = {
  id: string;
  buyer: string;
  email: string;
  items: AdminOrderItem[];
  total: number;
  status: AdminOrderStatus;
  note: string;
  createdAt: string;
  paymentMethod: "manual" | "mercadopago";
};

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  badge: string;
  isActive: boolean;
};

export type SaveProductInput = {
  id?: string;
  values: ProductFormValues;
};

export type SaveProductResult = {
  ok: boolean;
  message?: string;
};

export type StatusChangeResult = {
  ok: boolean;
  message?: string;
};

export type ManualSaleInput = {
  buyer: string;
  email: string;
  productId: string;
  qty: number;
};

export type ManualSaleResult = {
  ok: boolean;
  message?: string;
};

export type AdminProduct = Product;
