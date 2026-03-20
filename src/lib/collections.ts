import type { Product, ProductCollectionId } from "@/types";

export type ProductCollection = {
  id: ProductCollectionId;
  label: string;
  shortLabel: string;
  description: string;
  heroDescription: string;
};

export const productCollections: ProductCollection[] = [
  {
    id: "gift",
    label: "Regalos listos para sorprender",
    shortLabel: "Regalos",
    description: "Selección fácil de elegir y con impacto visual inmediato.",
    heroDescription: "Ideas que resuelven rápido un regalo con estilo.",
  },
  {
    id: "daily",
    label: "Básicos para todos los días",
    shortLabel: "Diario",
    description: "Piezas nobles, versátiles y simples de combinar.",
    heroDescription: "Tus esenciales para usar todos los días.",
  },
  {
    id: "premium",
    label: "Looks con más presencia",
    shortLabel: "Premium",
    description: "Productos protagonistas para levantar cualquier outfit.",
    heroDescription: "Elegidos para regalarte una pieza protagonista.",
  },
  {
    id: "last-units",
    label: "Últimas unidades",
    shortLabel: "Últimas",
    description: "Productos con stock bajo para acelerar la decisión.",
    heroDescription: "Lo más buscado, con pocas unidades disponibles.",
  },
  {
    id: "layering",
    label: "Ideal para combinar",
    shortLabel: "Combinar",
    description: "Accesorios que funcionan perfecto para sumar capas.",
    heroDescription: "Para armar sets y completar tu look.",
  },
  {
    id: "trending",
    label: "En tendencia",
    shortLabel: "Tendencia",
    description: "Favoritos visuales y productos destacados del catálogo.",
    heroDescription: "Lo más fuerte de la tienda en este momento.",
  },
];

export const getCollectionById = (collectionId?: string | null) =>
  productCollections.find((collection) => collection.id === collectionId);

export const getProductCollectionIds = (product: Product) => {
  if (product.collectionIds !== undefined) {
    return [...new Set(product.collectionIds)].filter((collectionId) =>
      productCollections.some((collection) => collection.id === collectionId),
    );
  }

  const normalizedText = `${product.name} ${product.description} ${product.badge ?? ""}`.toLowerCase();
  const collections = new Set<ProductCollectionId>();

  if (
    product.featured ||
    product.badge ||
    product.price >= 13000 ||
    normalizedText.includes("perla")
  ) {
    collections.add("gift");
    collections.add("trending");
  }

  if (product.price <= 10000 || ["bracelets", "rings"].includes(product.categoryId)) {
    collections.add("daily");
  }

  if (product.price >= 13500 || normalizedText.includes("oro") || normalizedText.includes("premium")) {
    collections.add("premium");
  }

  if (product.stock <= 5) {
    collections.add("last-units");
  }

  if (["bracelets", "necklaces", "rings"].includes(product.categoryId)) {
    collections.add("layering");
  }

  if (product.featured || product.badge || product.stock <= 8) {
    collections.add("trending");
  }

  if (collections.size === 0) {
    collections.add("daily");
  }

  return [...collections];
};

export const productMatchesCollection = (
  product: Product,
  collectionId?: string | null,
) => {
  if (!collectionId) return true;
  return getProductCollectionIds(product).includes(collectionId as ProductCollectionId);
};
