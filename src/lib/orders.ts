import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/types";

export const fetchOrdersByUser = async (userId: string): Promise<Order[]> => {
  const ordersSnapshot = await getDocs(
    query(collection(db, "orders"), where("userId", "==", userId))
  );
  return ordersSnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Order, "id">),
  }));
};
