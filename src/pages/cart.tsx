import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cartStore";

export function CartPage() {
  const { items, updateQty, removeItem } = useCartStore();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">Tu carrito está vacío</h1>
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
      <h1 className="text-3xl font-semibold">Tu carrito</h1>
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
                <p className="text-sm text-slate-500">{formatPrice(item.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.qty}
                    onChange={(event) => updateQty(item.productId, Number(event.target.value))}
                    className="w-20"
                  />
                  <Button variant="ghost" onClick={() => removeItem(item.productId)}>
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
            <span>Calculado en checkout</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total estimado</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link to="/checkout">Continuar al checkout</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
