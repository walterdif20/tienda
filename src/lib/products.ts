import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Product, ProductImage, ProductInput } from "@/types";

const productsCollection = collection(db, "products");

export const fetchProducts = async (): Promise<Product[]> => {
  const snapshot = await getDocs(
    query(productsCollection, orderBy("createdAt", "desc")),
  );
  const products = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data() as Omit<Product, "id" | "images" | "stock">;
      const imagesSnapshot = await getDocs(collection(docSnap.ref, "images"));
      const images = imagesSnapshot.docs
        .map((imageDoc) => ({
          id: imageDoc.id,
          ...(imageDoc.data() as Omit<ProductImage, "id">),
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const inventoryRef = doc(db, "inventory", docSnap.id);
      const inventorySnapshot = await getDoc(inventoryRef);
      const stock = inventorySnapshot.data()?.stock ?? 0;
      return {
        id: docSnap.id,
        ...data,
        images,
        stock,
      };
    }),
  );
  return products;
};

export const fetchProductBySlug = async (
  slug: string,
): Promise<Product | null> => {
  const snapshot = await getDocs(query(productsCollection));
  const productDoc = snapshot.docs.find(
    (docSnap) => docSnap.data().slug === slug,
  );
  if (!productDoc) return null;
  const productData = productDoc.data() as Omit<
    Product,
    "id" | "images" | "stock"
  >;
  const imagesSnapshot = await getDocs(collection(productDoc.ref, "images"));
  const images = imagesSnapshot.docs
    .map((imageDoc) => ({
      id: imageDoc.id,
      ...(imageDoc.data() as Omit<ProductImage, "id">),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const inventorySnapshot = await getDoc(doc(db, "inventory", productDoc.id));
  const stock = inventorySnapshot.data()?.stock ?? 0;
  return {
    id: productDoc.id,
    ...productData,
    images,
    stock,
  };
};

export const createProduct = async (input: ProductInput) => {
  const productRef = doc(productsCollection);
  await setDoc(productRef, {
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    currency: input.currency,
    categoryId: input.categoryId,
    featured: input.featured ?? false,
    isActive: input.isActive,
    badge: input.badge ?? null,
    createdAt: Timestamp.now(),
  });

  if (input.primaryImageUrl) {
    const imageRef = doc(collection(productRef, "images"));
    await setDoc(imageRef, {
      url: input.primaryImageUrl,
      alt: input.primaryImageAlt ?? input.name,
      sortOrder: 1,
    });
  }

  await setDoc(doc(db, "inventory", productRef.id), {
    stock: input.stock,
    updatedAt: Timestamp.now(),
  });

  return productRef.id;
};

export const updateProduct = async (
  id: string,
  input: Partial<ProductInput>,
) => {
  const productRef = doc(db, "products", id);
  await updateDoc(productRef, {
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    currency: input.currency,
    categoryId: input.categoryId,
    featured: input.featured,
    isActive: input.isActive,
    badge: input.badge ?? null,
  });

  if (input.primaryImageUrl !== undefined) {
    const imagesRef = collection(productRef, "images");
    const imagesSnapshot = await getDocs(imagesRef);

    await Promise.all(imagesSnapshot.docs.map((imageDoc) => deleteDoc(imageDoc.ref)));

    const url = input.primaryImageUrl.trim();
    if (url) {
      const imageRef = doc(imagesRef);
      await setDoc(imageRef, {
        url,
        alt: input.primaryImageAlt?.trim() || input.name || "Imagen de producto",
        sortOrder: 1,
      });
    }
  }

  if (input.stock !== undefined) {
    await updateDoc(doc(db, "inventory", id), {
      stock: input.stock,
      updatedAt: Timestamp.now(),
    });
  }
};


export const deleteProduct = async (id: string) => {
  const productRef = doc(db, "products", id);
  const imagesSnapshot = await getDocs(collection(productRef, "images"));

  await Promise.all(imagesSnapshot.docs.map((imageDoc) => deleteDoc(imageDoc.ref)));
  await deleteDoc(doc(db, "inventory", id));
  await deleteDoc(productRef);
};


const sanitizeFilename = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");

export const uploadProductImageFile = async (file: File): Promise<{
  url: string;
  suggestedAlt: string;
}> => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = sanitizeFilename(file.name.replace(/\.[^.]+$/, ""));
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const imageRef = ref(storage, `products/${safeName || "producto"}/${filename}`);

  await uploadBytes(imageRef, file, {
    contentType: file.type || `image/${extension}`,
  });

  const url = await getDownloadURL(imageRef);
  return {
    url,
    suggestedAlt: file.name.replace(/\.[^.]+$/, ""),
  };
};
