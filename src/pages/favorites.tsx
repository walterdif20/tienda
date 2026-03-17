import { Link } from "react-router-dom";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { useProducts } from "@/hooks/use-products";

export function FavoritesPage() {
  const { products, loading } = useProducts();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();

  const favoriteProducts = products.filter((product) =>
    favoriteIds.includes(product.id),
  );

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Favoritos</h1>
        <div className="mt-6 rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Cargando favoritos...
        </div>
      </section>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">Todavía no tenés favoritos</h1>
        <p className="mt-2 text-slate-500">
          Guardá productos con el corazón para encontrarlos rápido acá.
        </p>
        <Button asChild className="mt-6">
          <Link to="/products">Explorar productos</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Favoritos</h1>
        <p className="text-sm text-slate-500">
          {favoriteProducts.length} producto
          {favoriteProducts.length === 1 ? "" : "s"} guardado
          {favoriteProducts.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-3">
        {favoriteProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFavorite={isFavorite(product.id)}
            onToggleFavorite={(productId) => void toggleFavorite(productId)}
          />
        ))}
      </div>
    </section>
  );
}
