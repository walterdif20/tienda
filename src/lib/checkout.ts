import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import type { CartItem, OrderBuyer, OrderDelivery } from "@/types";

export type CreateOrderInput = {
  buyer: OrderBuyer;
  delivery: OrderDelivery;
  items: CartItem[];
};

export type CreateOrderResponse = {
  orderId: string;
  initPoint: string;
  publicTrackingToken: string;
};

export const createOrder = async (input: CreateOrderInput) => {
  const callable = httpsCallable<CreateOrderInput, CreateOrderResponse>(
    functions,
    "createOrder",
  );
  const response = await callable(input);
  return response.data;
};
