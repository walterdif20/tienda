import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { defaultCategories } from "@/data/products";
import { db } from "@/lib/firebase";
import type { Category } from "@/types";

const categoriesCollection = collection(db, "categories");

export const slugifyCategory = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeCategory = (
  id: string,
  data: Record<string, unknown>,
): Category => ({
  id,
  name: String(data.name ?? id),
  slug: String(data.slug ?? id),
});

export const fetchCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(
    query(categoriesCollection, orderBy("createdAt", "asc")),
  );

  if (snapshot.empty) {
    return defaultCategories;
  }

  return snapshot.docs.map((docSnap) =>
    normalizeCategory(docSnap.id, docSnap.data() as Record<string, unknown>),
  );
};

export const createCategory = async (input: {
  id?: string;
  name: string;
  slug?: string;
}) => {
  const name = input.name.trim();
  const slug = slugifyCategory(input.slug?.trim() || name);
  const id = input.id?.trim() || slug;

  if (!name || !slug || !id) {
    throw new Error("Nombre y slug son obligatorios.");
  }

  await setDoc(doc(categoriesCollection, id), {
    name,
    slug,
    createdAt: Timestamp.now(),
    updatedAt: serverTimestamp(),
  });

  return id;
};

export const updateCategory = async (
  id: string,
  input: { name: string; slug: string },
) => {
  const name = input.name.trim();
  const slug = slugifyCategory(input.slug.trim() || input.name);

  if (!name || !slug) {
    throw new Error("Nombre y slug son obligatorios.");
  }

  await updateDoc(doc(categoriesCollection, id), {
    name,
    slug,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCategory = async (id: string) => {
  await deleteDoc(doc(categoriesCollection, id));
};
