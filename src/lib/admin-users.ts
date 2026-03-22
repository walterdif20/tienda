import {
  Timestamp,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";

export type ProductSlugViewStat = {
  slug: string;
  count: number;
  lastViewedAtMs: number;
};

export type LoyaltyHistoryEntry = {
  orderId: string;
  orderNumber: string;
  total: number;
  pointsEarned: number;
  redeemedPoints: number;
  status: "pending" | "credited";
  createdAtMs: number;
  paidAtMs: number;
  creditedAtMs: number;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  whatsappNumber: string;
  favoriteProductIds: string[];
  productSlugViews: ProductSlugViewStat[];
  loyaltyPoints: number;
  loyaltyHistory: LoyaltyHistoryEntry[];
  role: "admin" | "customer";
  isBlocked: boolean;
  createdAtMs: number;
};

const normalizePhoneForLink = (value: string) => value.replace(/[^\d]/g, "");

const usersCollection = collection(db, "users");
const ordersCollection = collection(db, "orders");

export const fetchAdminUsers = async () => {
  const [usersSnapshot, ordersSnapshot] = await Promise.all([
    getDocs(query(usersCollection, orderBy("createdAt", "desc"))),
    getDocs(query(ordersCollection, orderBy("createdAt", "desc"))),
  ]);

  const loyaltyHistoryByUserId = new Map<string, LoyaltyHistoryEntry[]>();

  ordersSnapshot.docs.forEach((orderDoc) => {
    const data = orderDoc.data() as Record<string, unknown>;
    const userId = String(data.userId ?? "").trim();
    const loyalty = (data.loyalty ?? {}) as Record<string, unknown>;
    const pointsEarned = Number(loyalty.pointsEarned ?? 0);
    const redeemedPoints = Number(loyalty.redeemedPoints ?? 0);

    if (!userId || (pointsEarned <= 0 && redeemedPoints <= 0)) {
      return;
    }

    const createdAt = data.createdAt as Timestamp | undefined;
    const paidAt = loyalty.paidAt as Timestamp | undefined;
    const creditedAt = loyalty.creditedAt as Timestamp | undefined;

    const entry: LoyaltyHistoryEntry = {
      orderId: orderDoc.id,
      orderNumber: String(data.orderNumber ?? orderDoc.id),
      total: Number(data.total ?? 0),
      pointsEarned,
      redeemedPoints,
      status: loyalty.status === "credited" ? "credited" : "pending",
      createdAtMs: createdAt?.toMillis?.() ?? 0,
      paidAtMs: paidAt?.toMillis?.() ?? 0,
      creditedAtMs: creditedAt?.toMillis?.() ?? 0,
    };

    loyaltyHistoryByUserId.set(userId, [
      ...(loyaltyHistoryByUserId.get(userId) ?? []),
      entry,
    ]);
  });

  return Promise.all(
    usersSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const createdAt = data.createdAt as
        | { toMillis?: () => number }
        | undefined;
      const role = data.role === "admin" ? "admin" : "customer";
      const isBlocked = data.isBlocked === true;
      const favoriteProductIds = Array.isArray(data.favoriteProductIds)
        ? data.favoriteProductIds.filter(
            (item): item is string => typeof item === "string",
          )
        : [];

      const productViewsSnapshot = await getDocs(
        collection(docSnap.ref, "productSlugViews"),
      );

      const productSlugViews = productViewsSnapshot.docs
        .map((viewDoc) => {
          const viewData = viewDoc.data() as Record<string, unknown>;
          const updatedAt = viewData.updatedAt as
            | { toMillis?: () => number }
            | undefined;

          return {
            slug: String(viewData.slug ?? viewDoc.id),
            count: Number(viewData.count ?? 0),
            lastViewedAtMs: updatedAt?.toMillis?.() ?? 0,
          } satisfies ProductSlugViewStat;
        })
        .sort((a, b) => b.count - a.count);

      return {
        id: docSnap.id,
        email: String(data.email ?? "Sin email"),
        displayName: String(data.displayName ?? "Sin nombre"),
        whatsappNumber: String(data.whatsappNumber ?? ""),
        favoriteProductIds,
        productSlugViews,
        loyaltyPoints: Number(data.loyaltyPoints ?? 0),
        loyaltyHistory: loyaltyHistoryByUserId.get(docSnap.id) ?? [],
        role,
        isBlocked,
        createdAtMs: createdAt?.toMillis?.() ?? 0,
      } satisfies AdminUser;
    }),
  );
};

export const makeUserAdmin = async (uid: string) => {
  const makeAdmin = httpsCallable(functions, "setUserAdminRole");
  await makeAdmin({ uid });
};

export const toWhatsAppLink = (phone: string) =>
  `https://wa.me/${normalizePhoneForLink(phone)}`;

export const setUserBlockedStatus = async (uid: string, blocked: boolean) => {
  const setBlockedStatus = httpsCallable(functions, "setUserBlockedStatus");
  await setBlockedStatus({ uid, blocked });
};
