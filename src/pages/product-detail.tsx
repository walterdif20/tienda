import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = useMemo(() => product?.images ?? [], [product?.images]);

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

  const safeActiveImageIndex =
    images.length > 0
      ? Math.min(activeImageIndex, images.length - 1)
      : 0;

  const activeImage = images[safeActiveImageIndex];

  const goToPrevImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  const goToNextImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {activeImage ? (
              <img
                src={activeImage.url}
                alt={activeImage.alt}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Sin imagen
              </div>
            )}

            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full p-0"
                  onClick={goToPrevImage}
                >
                  ‹
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full p-0"
                  onClick={goToNextImage}
                >
                  ›
                </Button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-xl border transition ${
                    index === safeActiveImageIndex
                      ? "border-slate-900"
                      : "border-slate-200"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
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
                  Sin Stock - Consultar
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
