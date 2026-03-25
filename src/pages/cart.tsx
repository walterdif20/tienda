import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Gift, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import {
  calculateLoyaltyPoints,
  formatLoyaltyPoints,
  getLoyaltyProgress,
} from "@/lib/loyalty";
import { useAuth } from "@/providers/auth-provider";
import { useCartStore } from "@/store/cartStore";

export function CartPage() {
  const { loyaltyPoints, loyaltyPointsYearly, user } = useAuth();
  const { items, appliedPoints, removeItem, setAppliedPoints, updateQty } =
    useCartStore();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const maxUsablePoints = Math.min(loyaltyPoints, subtotal);
  const effectiveAppliedPoints = Math.min(appliedPoints, maxUsablePoints);
  const totalAfterPoints = Math.max(0, subtotal - effectiveAppliedPoints);
  const estimatedPoints = calculateLoyaltyPoints(totalAfterPoints);
  const loyaltyProgress = getLoyaltyProgress(
    loyaltyPointsYearly + estimatedPoints,
  );
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
          Explorá nuestros accesorios y vuelve para finalizar tu compra.
        </p>
        <Button asChild className="mt-6">
          <Link to="/products">Ir al catálogo</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">Tu carrito</h1>
        {freeShippingTag}
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Armamos un resumen más claro para que veas tu ahorro, tus puntos y el próximo beneficio antes de pagar.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row"
            >
              <div className="flex gap-4 sm:flex-1">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-24 w-24 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="text-sm text-slate-500">{formatPrice(item.price)}</p>
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
              </div>
              <div className="text-left text-sm font-semibold sm:text-right">
                {formatPrice(item.price * item.qty)}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold">Resumen</h2>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <ValueCard label="Subtotal" value={formatPrice(subtotal)} />
              <ValueCard label="Puntos que usás" value={`-${formatPrice(effectiveAppliedPoints)}`} highlight={effectiveAppliedPoints > 0} />
              <ValueCard label="Total estimado" value={formatPrice(totalAfterPoints)} emphasis />
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
                      Tenés {formatLoyaltyPoints(loyaltyPoints)} puntos disponibles. Cada punto descuenta $1.
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

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <Gift className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">Club de recompensas</p>
                  <p>
                    Esta compra suma <strong>{formatLoyaltyPoints(estimatedPoints)} puntos</strong>. {loyaltyProgress.nextTier
                      ? `Te dejaría a ${formatLoyaltyPoints(loyaltyProgress.missingPoints)} puntos del nivel ${loyaltyProgress.nextTier.label}.`
                      : "Ya estás en el nivel más alto del club."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Compra cuidada
              </div>
              <p className="mt-2">
                Vas al checkout con resumen claro, beneficios visibles y posibilidad de combinar ahorro por puntos + fidelización.
              </p>
            </div>

            <Button asChild size="lg" className="w-full">
              <Link to="/checkout">Continuar al checkout</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueCard({
  label,
  value,
  highlight = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        emphasis
          ? "border-slate-900 bg-slate-900 text-white"
          : highlight
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 break-words text-lg font-semibold sm:text-xl">{value}</p>
    </div>
  );
}
