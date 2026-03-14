export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ProductImage = {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: "ARS";
  categoryId: string;
  featured?: boolean;
  isActive: boolean;
  images: ProductImage[];
  stock: number;
  badge?: string;
};

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: "ARS";
  categoryId: string;
  featured?: boolean;
  isActive: boolean;
  badge?: string;
  stock: number;
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  primaryImageUrl?: string;
  primaryImageAlt?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
  slug: string;
  stock: number;
};

export type OrderBuyer = {
  name: string;
  email: string;
  phone: string;
};

export type OrderDelivery = {
  method: "shipping" | "pickup";
  address?: string;
};

export type Order = {
  id: string;
  userId?: string | null;
  buyer: OrderBuyer;
  delivery: OrderDelivery;
  status:
    | "pending"
    | "paid"
    | "in_progress"
    | "payment_in_review"
    | "cancelled";
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  publicTrackingToken: string;
  payment?: {
    provider: "bank_transfer" | "manual";
    transferAlias?: string;
    transferConfirmedAt?: string;
    transferReceiptUrl?: string;
    adminNotes?: string;
  };
};
