import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { categories } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";

export function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { products: allProducts } = useProducts();

  const products = useMemo(() => {
    if (activeCategory === "all") return allProducts;
    return allProducts.filter((product) => product.categoryId === activeCategory);
  }, [activeCategory, allProducts]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Catálogo</h1>
          <p className="text-sm text-slate-500">
            Accesorios livianos con stock controlado y envío flexible.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCategory === "all" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
          >
            Todo
          </Button>
          {categories
            .filter((category) => category.id !== "new" && category.id !== "featured")
            .map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
        </div>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
