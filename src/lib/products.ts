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
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import type { Product, ProductImage, ProductInput } from "@/types";

const productsCollection = collection(db, "products");

const deleteImageFromStorageIfManaged = async (url: string) => {
  const imageUrl = url.trim();
  if (!imageUrl) return;

  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch {
    // Ignoramos URLs externas o archivos ya eliminados en Storage.
  }
};

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

  const inputImages = input.images?.filter((image) => image.url.trim()) ?? [];
  const imagesToSave =
    inputImages.length > 0
      ? inputImages
      : input.primaryImageUrl
        ? [{ url: input.primaryImageUrl, alt: input.primaryImageAlt ?? input.name }]
        : [];

  for (const [index, image] of imagesToSave.entries()) {
    const imageRef = doc(collection(productRef, "images"));
    await setDoc(imageRef, {
      url: image.url.trim(),
      alt: image.alt?.trim() || input.name,
      sortOrder: index + 1,
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
  const productUpdate: Record<string, unknown> = {};

  if (input.name !== undefined) productUpdate.name = input.name;
  if (input.slug !== undefined) productUpdate.slug = input.slug;
  if (input.description !== undefined) productUpdate.description = input.description;
  if (input.price !== undefined) productUpdate.price = input.price;
  if (input.currency !== undefined) productUpdate.currency = input.currency;
  if (input.categoryId !== undefined) productUpdate.categoryId = input.categoryId;
  if (input.featured !== undefined) productUpdate.featured = input.featured;
  if (input.isActive !== undefined) productUpdate.isActive = input.isActive;
  if ("badge" in input) productUpdate.badge = input.badge ?? null;

  if (Object.keys(productUpdate).length > 0) {
    await updateDoc(productRef, productUpdate);
  }

  if (input.images !== undefined || input.primaryImageUrl !== undefined) {
    const imagesRef = collection(productRef, "images");
    const imagesSnapshot = await getDocs(imagesRef);

    await Promise.all(
      imagesSnapshot.docs.map((imageDoc) => {
        const imageData = imageDoc.data() as Omit<ProductImage, "id">;
        return deleteImageFromStorageIfManaged(imageData.url);
      }),
    );

    await Promise.all(imagesSnapshot.docs.map((imageDoc) => deleteDoc(imageDoc.ref)));

    const inputImages = input.images?.filter((image) => image.url.trim()) ?? [];
    const imagesToSave =
      inputImages.length > 0
        ? inputImages
        : input.primaryImageUrl?.trim()
          ? [
              {
                url: input.primaryImageUrl.trim(),
                alt:
                  input.primaryImageAlt?.trim() ||
                  input.name ||
                  "Imagen de producto",
              },
            ]
          : [];

    for (const [index, image] of imagesToSave.entries()) {
      const imageRef = doc(imagesRef);
      await setDoc(imageRef, {
        url: image.url.trim(),
        alt: image.alt?.trim() || input.name || "Imagen de producto",
        sortOrder: index + 1,
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

  await Promise.all(
    imagesSnapshot.docs.map((imageDoc) => {
      const imageData = imageDoc.data() as Omit<ProductImage, "id">;
      return deleteImageFromStorageIfManaged(imageData.url);
    }),
  );

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
