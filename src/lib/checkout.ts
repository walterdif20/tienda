import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
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

export const createOrder = async (input: CreateOrderInput) => {
  const callable = httpsCallable<CreateOrderInput, CreateOrderResponse>(
    functions,
    "createOrder",
  );
  const response = await callable(input);
  return response.data;
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
