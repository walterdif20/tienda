import { Heart, ShoppingBag, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { useDiscounts } from "@/hooks/use-discounts";
import { getProductPricing } from "@/lib/pricing";
import { getCollectionById, getProductCollectionIds } from "@/lib/collections";
import { useCartStore } from "@/store/cartStore";
import { useCategories } from "@/hooks/use-categories";
import type { Product } from "@/types";

export function ProductQuickShop({
  product,
  isFavorite,
  onToggleFavorite,
}: {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void | Promise<void>;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const collectionLabels = getProductCollectionIds(product)
    .slice(0, 2)
    .map((collectionId) => getCollectionById(collectionId)?.shortLabel)
    .filter(Boolean);
  const heroImage = product.images[0];
  const { discounts } = useDiscounts();
  const { categories } = useCategories();
  const pricing = getProductPricing(product, discounts, categories);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Vista Rápida
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-slate-50 p-4 sm:p-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {heroImage ? (
                <img
                  src={heroImage.url}
                  alt={heroImage.alt || product.name}
                  className="aspect-square w-full object-cover"
                />
              ) : null}
            </div>
          </div>

          <div className="space-y-5 p-6">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                {product.badge ? <Badge>{product.badge}</Badge> : null}
                {collectionLabels.map((label) => (
                  <Badge key={label} className="bg-slate-100 text-slate-700">
                    {label}
                  </Badge>
                ))}
              </div>
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription>{product.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div>
                {pricing.appliedDiscount ? <p className="text-xs text-slate-400 line-through">{formatPrice(pricing.originalPrice)}</p> : null}
                <p className="text-3xl font-semibold text-slate-950">{formatPrice(pricing.finalPrice)}</p>
              </div>
              <p>
                <strong>Stock:</strong> {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
              </p>
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-600" />
                Envío gratis a Necochea y Quequén o retiro en tienda.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => addItem(product, 1, pricing.finalPrice)}
                disabled={product.stock === 0}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {product.stock === 0 ? "Sin stock" : "Agregar al carrito"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void onToggleFavorite(product.id)}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${
                    isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-700"
                  }`}
                />
                {isFavorite ? "Guardado" : "Favorito"}
              </Button>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Ideal para</p>
              <p className="mt-1">
                {collectionLabels.length > 0
                  ? `Compras ${collectionLabels.join(" + ").toLowerCase()} y regalos con decisión rápida.`
                  : "Completar un look simple y sumar una pieza protagonista."}
              </p>
            </div>

            <Button asChild variant="ghost" className="px-0 text-sm text-slate-700">
              <Link to={`/products/${product.slug}`}>Ver ficha completa</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
