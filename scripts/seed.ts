import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { seedProducts, categories } from "../src/data/products";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS env var");
}

initializeApp({
  credential: cert(serviceAccountPath),
});

const db = getFirestore();

const run = async () => {
  const batch = db.batch();

  categories.forEach((category) => {
    const ref = db.collection("categories").doc(category.id);
    batch.set(ref, {
      name: category.name,
      slug: category.slug,
      isActive: true,
      sortOrder: 1,
    });
  });

  seedProducts.forEach((product) => {
    const productRef = db.collection("products").doc(product.id);
    batch.set(productRef, {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      currency: product.currency,
      categoryId: product.categoryId,
      isActive: product.isActive,
      featured: product.featured ?? false,
      createdAt: FieldValue.serverTimestamp(),
    });

    const inventoryRef = db.collection("inventory").doc(product.id);
    batch.set(inventoryRef, {
      stock: product.stock,
      updatedAt: FieldValue.serverTimestamp(),
    });

    product.images.forEach((image) => {
      const imageRef = productRef.collection("images").doc(image.id);
      batch.set(imageRef, {
        url: image.url,
        alt: image.alt,
        sortOrder: image.sortOrder,
      });
    });
  });

  await batch.commit();
  console.log("Seed completado");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
