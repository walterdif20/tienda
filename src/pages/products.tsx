import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categories } from "@/data/products";
import { useProducts } from "@/hooks/use-products";
import { useFavorites } from "@/hooks/use-favorites";
import { useSearchParams } from "react-router-dom";

export function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const { products, loading } = useProducts();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const isValidCategory = categories.some(
      (category) => category.id === categoryFromUrl,
    );
    setActiveCategory(isValidCategory ? (categoryFromUrl ?? "all") : "all");
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        activeCategory === "all" || product.categoryId === activeCategory;
      const matchQuery =
        query.trim().length === 0 ||
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [activeCategory, products, query]);

  return (
    <section className="mx-auto max-w-9xl space-y-8 px-4 py-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Productos</h1>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === "all" ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setActiveCategory("all");
                setSearchParams({});
              }}
            >
              Todo
            </Button>
            {categories
              .filter(
                (category) =>
                  category.id !== "new" && category.id !== "featured",
              )
              .map((category) => (
                <Button
                  key={category.id}
                  variant={
                    activeCategory === category.id ? "secondary" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setActiveCategory(category.id);
                    setSearchParams({ category: category.id });
                  }}
                >
                  {category.name}
                </Button>
              ))}
          </div>
          <br />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o descripción"
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
          No encontramos productos con ese filtro.
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
