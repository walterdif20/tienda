import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <Card className="group overflow-hidden">
      <div className="relative">
        <img
          src={product.images[0]?.url ?? "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"}
          alt={product.images[0]?.alt ?? product.name}
          className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge && (
          <Badge className="absolute left-3 top-3">{product.badge}</Badge>
        )}
      </div>
      <CardContent className="space-y-3">
        <div>
          <Link
            to={`/products/${product.slug}`}
            className="text-base font-semibold text-slate-900"
          >
            {product.name}
          </Link>
          <p className="text-sm text-slate-500">{product.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {formatPrice(product.price)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addItem(product, 1)}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? "Sin stock" : "Agregar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
