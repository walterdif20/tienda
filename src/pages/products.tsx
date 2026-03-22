import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useFavorites } from "@/hooks/use-favorites";
import {
  getCategoryChildren,
  getCategoryTree,
  resolveCategoryFilter,
} from "@/lib/categories";
import {
  getCollectionById,
  productCollections,
  productMatchesCollection,
} from "@/lib/collections";

export function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState("all");
  const [activeCollection, setActiveCollection] = useState("all");
  const [query, setQuery] = useState("");
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const subcategoryFromUrl = searchParams.get("subcategory");
    const queryFromUrl = searchParams.get("query") ?? "";
    const collectionFromUrl = searchParams.get("collection");
    const isValidCollection = productCollections.some(
      (collection) => collection.id === collectionFromUrl,
    );
    const resolvedFilter = resolveCategoryFilter(
      categories,
      categoryFromUrl,
      subcategoryFromUrl,
    );

    setActiveCategory(resolvedFilter.activeCategory);
    setActiveSubcategory(resolvedFilter.activeSubcategory);
    setActiveCollection(
      isValidCollection ? (collectionFromUrl ?? "all") : "all",
    );
    setQuery(queryFromUrl);
  }, [categories, searchParams]);

  const categoryTree = useMemo(() => getCategoryTree(categories), [categories]);

  const visibleSubcategories = useMemo(() => {
    if (activeCategory === "all") {
      return [];
    }

    return getCategoryChildren(categories, activeCategory);
  }, [activeCategory, categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        activeCategory === "all"
          ? true
          : activeSubcategory !== "all"
            ? product.categoryId === activeSubcategory
            : product.categoryId === activeCategory ||
              visibleSubcategories.some(
                (subcategory) => subcategory.id === product.categoryId,
              );
      const matchCollection =
        activeCollection === "all" ||
        productMatchesCollection(product, activeCollection);
      const matchQuery =
        query.trim().length === 0 ||
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchCategory && matchCollection && matchQuery;
    });
  }, [
    activeCategory,
    activeCollection,
    activeSubcategory,
    products,
    query,
    visibleSubcategories,
  ]);

  const activeCollectionData = getCollectionById(
    activeCollection === "all" ? null : activeCollection,
  );

  const updateParams = ({
    nextCategory = activeCategory,
    nextSubcategory = activeSubcategory,
    nextCollection = activeCollection,
    nextQuery = query,
  }: {
    nextCategory?: string;
    nextSubcategory?: string;
    nextCollection?: string;
    nextQuery?: string;
  }) => {
    const nextParams = new URLSearchParams();

    if (nextCategory !== "all") {
      nextParams.set("category", nextCategory);
    }

    if (nextCategory !== "all" && nextSubcategory !== "all") {
      nextParams.set("subcategory", nextSubcategory);
    }

    if (nextCollection !== "all") {
      nextParams.set("collection", nextCollection);
    }

    if (nextQuery.trim()) {
      nextParams.set("query", nextQuery.trim());
    }

    setSearchParams(nextParams);
  };

  return (
    <section className="mx-auto max-w-9xl space-y-8 px-4 py-12">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Productos</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Explorá por categoría o subcategoría para encontrar ideas de
              regalo, básicos diarios o piezas protagonistas más rápido.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">
              {filteredProducts.length} resultados
            </p>
            <p>
              {activeCollectionData
                ? activeCollectionData.heroDescription
                : "Catálogo completo con navegación editorial."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <Sparkles className="h-4 w-4" />
            Comprar por ocasión
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant={activeCollection === "all" ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setActiveCollection("all");
                updateParams({ nextCollection: "all" });
              }}
            >
              Todo
            </Button>
            {productCollections.map((collection) => (
              <Button
                key={collection.id}
                variant={
                  activeCollection === collection.id ? "secondary" : "outline"
                }
                size="sm"
                onClick={() => {
                  setActiveCollection(collection.id);
                  updateParams({ nextCollection: collection.id });
                }}
              >
                {collection.shortLabel}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === "all" ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveCategory("all");
                  setActiveSubcategory("all");
                  updateParams({ nextCategory: "all", nextSubcategory: "all" });
                }}
              >
                Todo
              </Button>
              {categoryTree.map(({ category }) => (
                <Button
                  key={category.id}
                  variant={
                    activeCategory === category.id ? "secondary" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setActiveCategory(category.id);
                    setActiveSubcategory("all");
                    updateParams({
                      nextCategory: category.id,
                      nextSubcategory: "all",
                    });
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {visibleSubcategories.length > 0 ? (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <Button
                  variant={
                    activeSubcategory === "all" ? "secondary" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setActiveSubcategory("all");
                    updateParams({ nextSubcategory: "all" });
                  }}
                >
                  Todas en{" "}
                  {
                    categoryTree.find(
                      ({ category }) => category.id === activeCategory,
                    )?.category.name
                  }
                </Button>
                {visibleSubcategories.map((subcategory) => (
                  <Button
                    key={subcategory.id}
                    variant={
                      activeSubcategory === subcategory.id
                        ? "secondary"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setActiveSubcategory(subcategory.id);
                      updateParams({
                        nextCategory: activeCategory,
                        nextSubcategory: subcategory.id,
                      });
                    }}
                  >
                    {subcategory.name}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                updateParams({ nextQuery });
              }}
              placeholder="Buscar por nombre, idea o descripción"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Cargando productos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          No encontramos productos con ese filtro. Probá cambiar la categoría,
          subcategoría, ocasión o la búsqueda.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={(productId) => void toggleFavorite(productId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
