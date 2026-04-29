import { Link, useParams } from "react-router-dom";
import { Heart, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { formatPrice } from "@/lib/format";
import { useDiscounts } from "@/hooks/use-discounts";
import { getProductPricing } from "@/lib/pricing";
import { buildProductAvailabilityWhatsAppLink } from "@/lib/whatsapp";
import { getCollectionById, getProductCollectionIds } from "@/lib/collections";
import { useCartStore } from "@/store/cartStore";
import { useProduct } from "@/hooks/use-product";
import { useProducts } from "@/hooks/use-products";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useFavorites } from "@/hooks/use-favorites";
import { incrementUserProductSlugView } from "@/lib/product-views";
import { useAuth } from "@/providers/auth-provider";

export function ProductDetailPage() {
  const { slug } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const { product, loading } = useProduct(slug);
  const { products } = useProducts();
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cartFeedback, setCartFeedback] = useState("");
  const { discounts } = useDiscounts();

  const images = useMemo(() => product?.images ?? [], [product?.images]);

  useEffect(() => {
    if (!user?.uid || !product?.slug) {
      return;
    }

    incrementUserProductSlugView(user.uid, product.slug).catch((error) => {
      console.error(error);
    });
  }, [product?.slug, user?.uid]);

  useEffect(() => {
    if (!cartFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCartFeedback("");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [cartFeedback]);

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
    images.length > 0 ? Math.min(activeImageIndex, images.length - 1) : 0;

  const activeImage = images[safeActiveImageIndex];
  const productIsFavorite = isFavorite(product.id);
  const collectionLabels = getProductCollectionIds(product)
    .flatMap((collectionId) => {
      const collection = getCollectionById(collectionId);
      return collection ? [collection] : [];
    })
    .slice(0, 3);
  const pricing = product ? getProductPricing(product, discounts) : null;

  const relatedProducts = products
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.categoryId === product.categoryId ||
          getProductCollectionIds(item).some((collectionId) =>
            getProductCollectionIds(product).includes(collectionId),
          )),
    )
    .slice(0, 3);

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

  const handleAddToCart = () => {
    addItem(product, 1, pricing?.finalPrice);
    setCartFeedback("Producto agregado al carrito.");
  };

  return (
    <div className="space-y-14 py-12">
      <section className="mx-auto max-w-6xl px-4">
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
              <div className="flex flex-wrap items-center gap-2">
                {product.badge ? <Badge>{product.badge}</Badge> : null}
                {pricing?.appliedDiscount ? <Badge className="bg-rose-600 text-white">{pricing.appliedDiscount.label}</Badge> : null}
                {collectionLabels.map((collection) => (
                  <Badge key={collection.id} className="bg-slate-100 text-slate-700">
                    {collection.shortLabel}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {product.name}
                </h1>
              </div>
              <p className="text-sm text-slate-600">{product.description}</p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="text-right">
                {pricing?.appliedDiscount ? <p className="text-sm text-slate-400 line-through">{formatPrice(pricing.originalPrice)}</p> : null}
                <p className="text-3xl font-semibold">{formatPrice(pricing?.finalPrice ?? product.price)}</p>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                {product.stock <= 5
                  ? `Últimas ${product.stock} unidades`
                  : `${product.stock} unidades disponibles`}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                <strong>Tip de compra:</strong>{" "}
                {product.stock <= 5
                  ? "si te gusta, no esperes demasiado porque el stock es acotado."
                  : "funciona perfecto como pieza diaria y también para armar un regalo rápido."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void toggleFavorite(product.id)}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${
                    productIsFavorite
                      ? "fill-rose-500 text-rose-500"
                      : "text-slate-700"
                  }`}
                />
                {productIsFavorite
                  ? "Quitar de favoritos"
                  : "Guardar en favoritos"}
              </Button>
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
                <Button size="lg" onClick={handleAddToCart}>
                  Agregar al carrito
                </Button>
              )}
            </div>
            {cartFeedback ? (
              <p
                role="status"
                aria-live="polite"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
              >
                {cartFeedback}
              </p>
            ) : null}

            <div className="border-t border-slate-200 pt-6">
              <div className="grid gap-3 md:grid-cols-3">
                <BenefitCard icon={Truck} title="Entrega simple">
                  Envío gratis a Necochea y Quequén o retiro en tienda.
                </BenefitCard>
                <BenefitCard icon={ShieldCheck} title="Compra segura">
                  Confirmación inmediata de orden y seguimiento posterior.
                </BenefitCard>
                <BenefitCard icon={Sparkles} title="Ideal para">
                  {collectionLabels[0]?.description ??
                    "Regalar, combinar o sumar un acento al look."}
                </BenefitCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Completá el look</h2>
              <p className="text-sm text-slate-500">
                Selección relacionada por categoría y ocasión para aumentar ticket sin fricción.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link to={`/products?category=${product.categoryId}`}>Ver similares</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                isFavorite={isFavorite(relatedProduct.id)}
                onToggleFavorite={(productId) => void toggleFavorite(productId)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Truck;
  title: string;
  children: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-sm text-slate-500">
      <div className="inline-flex rounded-xl bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200/80">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm leading-6">{children}</p>
    </div>
  );
}
