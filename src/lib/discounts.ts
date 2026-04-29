import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type DiscountType = "percentage" | "fixed";
export type DiscountTargetType = "product" | "category";

export type DiscountRule = {
  id: string;
  name: string;
  targetType: DiscountTargetType;
  targetId: string;
  type: DiscountType;
  value: number;
  isActive: boolean;
};

const discountsCollection = collection(db, "discounts");

export const fetchDiscountRules = async (): Promise<DiscountRule[]> => {
  const snapshot = await getDocs(query(discountsCollection, orderBy("createdAt", "desc")));
  return snapshot.docs.map((discountDoc) => {
    const data = discountDoc.data() as Omit<DiscountRule, "id">;
    return { id: discountDoc.id, ...data };
  });
};

export const createDiscountRule = async (input: Omit<DiscountRule, "id">) => {
  await addDoc(discountsCollection, {
    ...input,
    createdAt: serverTimestamp(),
  });
};

export const updateDiscountRule = async (
  id: string,
  input: Partial<Omit<DiscountRule, "id">>,
) => {
  await updateDoc(doc(db, "discounts", id), input);
};

export const deleteDiscountRule = async (id: string) => {
  await deleteDoc(doc(db, "discounts", id));
};
