import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { calculateLoyaltyPoints, formatLoyaltyPoints } from "@/lib/loyalty";
import { useAuth } from "@/providers/auth-provider";
import { useCartStore } from "@/store/cartStore";

export function CartPage() {
  const { loyaltyPoints, user } = useAuth();
  const { items, appliedPoints, removeItem, setAppliedPoints, updateQty } =
    useCartStore();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const maxUsablePoints = Math.min(loyaltyPoints, subtotal);
  const effectiveAppliedPoints = Math.min(appliedPoints, maxUsablePoints);
  const totalAfterPoints = Math.max(0, subtotal - effectiveAppliedPoints);
  const estimatedPoints = calculateLoyaltyPoints(totalAfterPoints);
  const freeShippingTag = (
    <Badge className="gap-2 bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
      <Truck className="h-4 w-4" />
      Envío gratis a Necochea y Quequén
    </Badge>
  );

  useEffect(() => {
    if (appliedPoints !== effectiveAppliedPoints) {
      setAppliedPoints(effectiveAppliedPoints);
    }
  }, [appliedPoints, effectiveAppliedPoints, setAppliedPoints]);

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">Tu carrito está vacío</h1>
        <div className="mt-4 flex justify-center">{freeShippingTag}</div>
        <p className="mt-2 text-slate-500">
          Explora nuestros accesorios y vuelve para finalizar tu compra.
        </p>
        <Button asChild className="mt-6">
          <Link to="/products">Ir al catálogo</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">Tu carrito</h1>
        {freeShippingTag}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 rounded-xl border border-slate-200 p-4"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-24 w-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-sm text-slate-500">
                  {formatPrice(item.price)}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.qty}
                    onChange={(event) =>
                      updateQty(item.productId, Number(event.target.value))
                    }
                    className="w-20"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => removeItem(item.productId)}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
              <div className="text-right text-sm font-semibold">
                {formatPrice(item.price * item.qty)}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold">Resumen</h2>
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Envío</span>
            <span>Gratis a Necochea y Quequén</span>
          </div>

          {user ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">Usar puntos</p>
                  <p className="text-slate-500">
                    Tenés {formatLoyaltyPoints(loyaltyPoints)} puntos
                    disponibles. Cada punto descuenta $1.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAppliedPoints(maxUsablePoints)}
                  disabled={maxUsablePoints === 0}
                >
                  Usar todos
                </Button>
              </div>
              <Input
                type="number"
                min={0}
                max={maxUsablePoints}
                value={effectiveAppliedPoints}
                onChange={(event) =>
                  setAppliedPoints(
                    Math.min(maxUsablePoints, Number(event.target.value) || 0),
                  )
                }
                placeholder="0"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              Iniciá sesión para usar tus puntos y descontarlos del total.
            </div>
          )}

          {effectiveAppliedPoints > 0 ? (
            <div className="flex items-center justify-between text-sm text-emerald-700">
              <span>Canje de puntos</span>
              <span>-{formatPrice(effectiveAppliedPoints)}</span>
            </div>
          ) : null}

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {effectiveAppliedPoints > 0 ? (
              <>
                Después de usar tus puntos, sumás{" "}
                <strong>{formatLoyaltyPoints(estimatedPoints)} puntos</strong>{" "}
                con esta compra.
              </>
            ) : (
              <>
                Sumás{" "}
                <strong>{formatLoyaltyPoints(estimatedPoints)} puntos</strong>{" "}
                con esta compra.
              </>
            )}{" "}
            Se acreditarán una vez que comencemos a preparar tu pedido.
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total estimado</span>
            <span>{formatPrice(totalAfterPoints)}</span>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link to="/checkout">Continuar al checkout</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
