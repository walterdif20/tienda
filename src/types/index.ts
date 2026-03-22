export type Category = {
  id: string;
  name: string;
  label: string;
  slug: string;
  parentId?: string | null;
};

export type ProductCollectionId =
  | "gift"
  | "daily"
  | "premium"
  | "last-units"
  | "layering"
  | "trending";

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
  collectionIds?: ProductCollectionId[];
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
  collectionIds?: ProductCollectionId[];
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
  orderNumber?: string;
  userId?: string | null;
  buyer: OrderBuyer;
  delivery: OrderDelivery;
  status:
    | "pending"
    | "link_pending"
    | "link_sent"
    | "paid"
    | "in_progress"
    | "in_transit"
    | "payment_in_review"
    | "completed"
    | "cancelled";
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  publicTrackingToken: string;
  payment?: {
    provider: "mercado_pago_link" | "bank_transfer" | "manual";
    transferAlias?: string;
    transferConfirmedAt?: string;
    transferReceiptUrl?: string;
    adminNotes?: string;
  };
  loyalty?: {
    pointsEarned: number;
    redeemedPoints?: number;
    status: "pending" | "credited";
    paidAt?: string;
    creditedAt?: string;
  };
};
