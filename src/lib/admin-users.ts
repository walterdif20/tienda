import { httpsCallable } from "firebase/functions";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, functions } from "@/lib/firebase";

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  whatsappNumber: string;
  role: "admin" | "customer";
  createdAtMs: number;
};

const normalizePhoneForLink = (value: string) => value.replace(/[^\d]/g, "");

const usersCollection = collection(db, "users");

export const fetchAdminUsers = async () => {
  const snapshot = await getDocs(
    query(usersCollection, orderBy("createdAt", "desc")),
  );

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const createdAt = data.createdAt as { toMillis?: () => number } | undefined;
    const role = data.role === "admin" ? "admin" : "customer";

    return {
      id: doc.id,
      email: String(data.email ?? "Sin email"),
      displayName: String(data.displayName ?? "Sin nombre"),
      whatsappNumber: String(data.whatsappNumber ?? ""),
      role,
      createdAtMs: createdAt?.toMillis?.() ?? 0,
    } satisfies AdminUser;
  });
};

export const makeUserAdmin = async (uid: string) => {
  const makeAdmin = httpsCallable(functions, "setUserAdminRole");
  await makeAdmin({ uid });
};

export const toWhatsAppLink = (phone: string) =>
  `https://wa.me/${normalizePhoneForLink(phone)}`;
