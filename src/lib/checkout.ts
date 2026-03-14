import {
  Timestamp,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { OrderBuyer, OrderDelivery } from "@/types";

export type CheckoutCartItemInput = {
  productId: string;
  qty: number;
};

export type CreateOrderInput = {
  buyer: OrderBuyer;
  delivery: OrderDelivery;
  items: CheckoutCartItemInput[];
};

export type CreateOrderResponse = {
  orderId: string;
  publicTrackingToken: string;
  transferAlias: string;
  total: number;
};

const TRANSFER_ALIAS = import.meta.env.VITE_TRANSFER_ALIAS ?? "tienda.demo.alias";

const randomToken = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().split("-").join("");
  }

  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
};

export const createOrder = async (input: CreateOrderInput): Promise<CreateOrderResponse> => {
  if (!input.items.length) {
    throw new Error("Carrito vacío");
  }

  const groupedQtyByProduct = new Map<string, number>();
  input.items.forEach((item) => {
    const productId = String(item.productId ?? "").trim();
    const qty = Math.floor(Number(item.qty ?? 0));

    if (!productId || qty <= 0) {
      return;
    }

    groupedQtyByProduct.set(productId, (groupedQtyByProduct.get(productId) ?? 0) + qty);
  });

  if (groupedQtyByProduct.size === 0) {
    throw new Error("No hay ítems válidos en el carrito");
  }

  const officialItems = await Promise.all(
    Array.from(groupedQtyByProduct.entries()).map(async ([productId, qty]) => {
      const productRef = doc(db, "products", productId);
      const productSnapshot = await getDoc(productRef);
      const product = productSnapshot.data() as
        | { name?: unknown; price?: unknown; isActive?: unknown }
        | undefined;

      if (!productSnapshot.exists() || product?.isActive !== true) {
        throw new Error("Hay productos inactivos o inexistentes en tu carrito");
      }

      const name = String(product?.name ?? "").trim();
      const price = Number(product?.price ?? 0);

      if (!name || !Number.isFinite(price) || price <= 0) {
        throw new Error("Hay productos sin datos válidos para cobrar");
      }

      return { productId, name, price, qty };
    }),
  );

  const subtotal = officialItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingCost = input.delivery.method === "shipping" ? 1500 : 0;
  const total = subtotal + shippingCost;

  const orderRef = doc(collection(db, "orders"));
  const publicTrackingToken = randomToken();

  const batch = writeBatch(db);
  batch.set(orderRef, {
    userId: auth.currentUser?.uid ?? null,
    buyer: input.buyer,
    delivery: input.delivery,
    status: "pending",
    subtotal,
    shippingCost,
    total,
    createdAt: serverTimestamp(),
    publicTrackingToken,
    stockDiscounted: false,
    payment: {
      provider: "bank_transfer",
      transferAlias: TRANSFER_ALIAS,
    },
  });

  officialItems.forEach((item) => {
    const itemRef = doc(collection(orderRef, "items"));
    batch.set(itemRef, {
      productId: item.productId,
      nameSnapshot: item.name,
      priceSnapshot: item.price,
      qty: item.qty,
    });
  });

  await batch.commit();

  return {
    orderId: orderRef.id,
    publicTrackingToken,
    transferAlias: TRANSFER_ALIAS,
    total,
  };
};

export type ConfirmTransferInput = {
  orderId: string;
  publicTrackingToken: string;
};

export const confirmOrderTransfer = async (input: ConfirmTransferInput) => {
  const orderRef = doc(db, "orders", input.orderId);

  await runTransaction(db, async (tx) => {
    const orderSnapshot = await tx.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("No encontramos el pedido");
    }

    const data = orderSnapshot.data() as
      | {
          publicTrackingToken?: string;
          status?: string;
          payment?: { provider?: string; transferConfirmedAt?: Timestamp };
        }
      | undefined;

    if (String(data?.publicTrackingToken ?? "") !== input.publicTrackingToken) {
      throw new Error("Token inválido");
    }

    if (data?.status !== "pending") {
      return;
    }

    tx.update(orderRef, {
      status: "paid",
      "payment.transferConfirmedAt": serverTimestamp(),
    });
  });

  return { ok: true, status: "paid" };
};

export type ConfirmTransferInput = {
  orderId: string;
  publicTrackingToken: string;
};

export const confirmOrderTransfer = async (input: ConfirmTransferInput) => {
  const callable = httpsCallable<ConfirmTransferInput, { ok: boolean; status: string }>(
    functions,
    "confirmOrderTransfer",
  );
  const response = await callable(input);
  return response.data;
};
