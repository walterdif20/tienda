import { useEffect, useMemo, useState } from "react";
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
}

const IMAGE_ROTATION_MS = 2800;

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
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
    <Card className="group overflow-hidden rounded-2xl border-slate-200 shadow-none transition hover:border-slate-300">
      <div className="relative overflow-hidden">
        <img
          src={activeImage?.url}
          alt={activeImage?.alt ?? product.name}
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
        />
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
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <Link
            to={`/products/${product.slug}`}
            className="line-clamp-1 text-base font-semibold text-slate-900"
          >
            {product.name}
          </Link>
          <p className="line-clamp-2 text-sm text-slate-500">{product.description}</p>
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
          ) : (
            <Button variant="secondary" size="sm" onClick={() => addItem(product, 1)}>
              Agregar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
