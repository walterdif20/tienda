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
const specialCategoryIds = new Set(["new", "featured"]);

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
  parentId:
    typeof data.parentId === "string" && data.parentId.trim().length > 0
      ? data.parentId.trim()
      : null,
});

export const isSpecialCategory = (categoryId: string) =>
  specialCategoryIds.has(categoryId);

export const getVisibleCategories = (categories: Category[]) =>
  categories.filter((category) => !isSpecialCategory(category.id));

export const getCategoryChildren = (categories: Category[], parentId: string) =>
  categories.filter((category) => category.parentId === parentId);

export const getRootCategories = (categories: Category[]) => {
  const visibleCategories = getVisibleCategories(categories);
  const visibleIds = new Set(visibleCategories.map((category) => category.id));

  return visibleCategories.filter(
    (category) =>
      !category.parentId ||
      !visibleIds.has(category.parentId) ||
      isSpecialCategory(category.parentId),
  );
};

export const getCategoryTree = (categories: Category[]) => {
  const visibleCategories = getVisibleCategories(categories);
  const rootCategories = getRootCategories(visibleCategories);

  return rootCategories.map((category) => ({
    category,
    subcategories: getCategoryChildren(visibleCategories, category.id),
  }));
};

export const getCategoryDisplayName = (
  categoryId: string,
  categories: Category[],
) => {
  const current = categories.find((category) => category.id === categoryId);

  if (!current) {
    return categoryId;
  }

  if (!current.parentId) {
    return current.name;
  }

  const parent = categories.find(
    (category) => category.id === current.parentId,
  );
  return parent ? `${parent.name} / ${current.name}` : current.name;
};

export const getCategoryDescendantIds = (
  categories: Category[],
  categoryId: string,
) => {
  const descendants = getCategoryChildren(categories, categoryId).map(
    (category) => category.id,
  );

  return [categoryId, ...descendants];
};

export const resolveCategoryFilter = (
  categories: Category[],
  categoryParam: string | null,
  subcategoryParam: string | null,
) => {
  const visibleCategories = getVisibleCategories(categories);
  const selectedCategory = visibleCategories.find(
    (category) => category.id === categoryParam,
  );
  const selectedSubcategory = visibleCategories.find(
    (category) => category.id === subcategoryParam,
  );

  if (selectedSubcategory?.parentId) {
    return {
      activeCategory: selectedSubcategory.parentId,
      activeSubcategory: selectedSubcategory.id,
    };
  }

  if (selectedCategory?.parentId) {
    return {
      activeCategory: selectedCategory.parentId,
      activeSubcategory: selectedCategory.id,
    };
  }

  return {
    activeCategory: selectedCategory?.id ?? "all",
    activeSubcategory: "all",
  };
};

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
  parentId?: string | null;
}) => {
  const name = input.name.trim();
  const slug = slugifyCategory(input.slug?.trim() || name);
  const id = input.id?.trim() || slug;
  const parentId = input.parentId?.trim() || null;

  if (!name || !slug || !id) {
    throw new Error("Nombre y slug son obligatorios.");
  }

  await setDoc(doc(categoriesCollection, id), {
    name,
    slug,
    parentId,
    createdAt: Timestamp.now(),
    updatedAt: serverTimestamp(),
  });

  return id;
};

export const updateCategory = async (
  id: string,
  input: { name: string; slug: string; parentId?: string | null },
) => {
  const name = input.name.trim();
  const slug = slugifyCategory(input.slug.trim() || input.name);
  const parentId = input.parentId?.trim() || null;

  if (!name || !slug) {
    throw new Error("Nombre y slug son obligatorios.");
  }

  await updateDoc(doc(categoriesCollection, id), {
    name,
    slug,
    parentId,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCategory = async (id: string) => {
  await deleteDoc(doc(categoriesCollection, id));
};
