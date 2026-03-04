import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { buildProductAvailabilityWhatsAppLink } from "@/lib/whatsapp";
import { useCartStore } from "@/store/cartStore";
import { useProduct } from "@/hooks/use-product";
import { useStoreSettings } from "@/hooks/use-store-settings";

export function ProductDetailPage() {
  const { slug } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const { product, loading } = useProduct(slug);
  const { settings } = useStoreSettings();

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-slate-500">
        Cargando producto...
      </section>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
        <Button asChild className="mt-5">
          <Link to="/products">Volver al catálogo</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-4">
          {product.images.map((image) => (
            <img
              key={image.id}
              src={image.url}
              alt={image.alt}
              className="h-80 w-full rounded-2xl border border-slate-200 object-cover"
            />
          ))}
        </div>

        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
              {product.badge && <Badge>{product.badge}</Badge>}
            </div>
            <p className="text-sm text-slate-600">{product.description}</p>
          </div>

          <p className="text-3xl font-semibold">{formatPrice(product.price)}</p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              <strong>Stock disponible:</strong> {product.stock}
            </p>
            <p>
              <strong>Entrega:</strong> envío a domicilio o retiro en tienda.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {product.stock === 0 ? (
              <Button asChild size="lg">
                <a
                  href={buildProductAvailabilityWhatsAppLink(
                    settings.whatsappNumber,
                    product.name,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Consultar WhatsApp
                </a>
              </Button>
            ) : (
              <Button size="lg" onClick={() => addItem(product, 1)}>
                Agregar al carrito
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link to="/cart">Ir al carrito</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
