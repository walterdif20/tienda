import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cartStore";
import { useProduct } from "@/hooks/use-product";

export function ProductDetailPage() {
  const { slug } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const { product } = useProduct(slug);

  if (!product) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
        <Button asChild className="mt-4">
          <Link to="/products">Volver al catálogo</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          {product.images.length > 0 ? (
            product.images.map((image) => (
              <img
                key={image.id}
                src={image.url}
                alt={image.alt}
                className="h-80 w-full rounded-2xl object-cover"
              />
            ))
          ) : (
            <img
              src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"
              alt={product.name}
              className="h-80 w-full rounded-2xl object-cover"
            />
          )}
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold">{product.name}</h1>
              {product.badge && <Badge>{product.badge}</Badge>}
            </div>
            <p className="text-sm text-slate-500">{product.description}</p>
          </div>
          <div className="text-3xl font-semibold">{formatPrice(product.price)}</div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              <strong>Stock:</strong> {product.stock} unidades disponibles
            </p>
            <p>
              <strong>Envío:</strong> despacho en 24-48hs o retiro en Palermo.
            </p>
            <p>
              <strong>Cambios:</strong> aceptamos cambios dentro de 10 días.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? "Sin stock" : "Agregar al carrito"}
          </Button>
        </div>
      </div>
    </section>
  );
}
