import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { buildProductAvailabilityWhatsAppLink } from "@/lib/whatsapp";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void | Promise<void>;
}

const IMAGE_ROTATION_MS = 2800;

export function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQty = useCartStore((state) => state.updateQty);
  const quantityInCart = useCartStore(
    (state) =>
      state.items.find((item) => item.productId === product.id)?.qty ?? 0,
  );
  const { settings } = useStoreSettings();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = useMemo(() => product.images ?? [], [product.images]);
  const activeImage = images[activeImageIndex] ?? images[0];

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product.id]);

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % images.length);
    }, IMAGE_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [images.length]);

  return (
    <Card className="group overflow-hidden rounded-2xl border-slate-200 shadow-sm shadow-slate-900/5 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/10">
      <div className="relative overflow-hidden">
        <img
          src={activeImage?.url}
          alt={activeImage?.alt ?? product.name}
          className="h-72 w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-white/80 px-2 py-1">
            {images.map((image, index) => (
              <span
                key={image.id}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  index === activeImageIndex ? "bg-slate-900" : "bg-slate-300"
                }`}
              />
            ))}
          </div>
        )}
        {product.badge && (
          <Badge className="absolute left-3 top-3 bg-white text-slate-800">
            {product.badge}
          </Badge>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90"
          onClick={() => void onToggleFavorite(product.id)}
          aria-label={
            isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
          }
        >
          <Heart
            className={`h-4 w-4 ${
              isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-700"
            }`}
          />
        </Button>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <Link
            to={`/products/${product.slug}`}
            className="line-clamp-1 text-base font-semibold text-slate-900 transition group-hover:text-slate-700"
          >
            {product.name}
          </Link>
          <p className="line-clamp-2 text-sm text-slate-500">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-lg font-semibold text-slate-900">
            {formatPrice(product.price)}
          </span>
          {product.stock === 0 ? (
            <Button asChild variant="outline" size="sm">
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
          ) : quantityInCart > 0 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8"
                onClick={() => {
                  if (quantityInCart === 1) {
                    removeItem(product.id);
                    return;
                  }
                  updateQty(product.id, quantityInCart - 1);
                }}
              >
                -
              </Button>
              <span className="min-w-6 text-center text-sm font-semibold text-slate-900">
                {quantityInCart}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8"
                onClick={() => addItem(product, 1)}
                disabled={quantityInCart >= product.stock}
              >
                +
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addItem(product, 1)}
            >
              {quantityInCart > 0 ? `Agregar (${quantityInCart})` : "Agregar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
