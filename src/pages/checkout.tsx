import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cartStore";
import { confirmOrderTransfer, createOrder } from "@/lib/checkout";

const schema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  email: z.string().email("Ingresa un email válido"),
  phone: z.string().min(6, "Ingresa un teléfono válido"),
  deliveryMethod: z.enum(["shipping", "pickup"]),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type CreatedOrderData = {
  orderId: string;
  publicTrackingToken: string;
  transferAlias: string;
  total: number;
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
  const [step, setStep] = useState<"buyer" | "payment">("buyer");
  const [loading, setLoading] = useState(false);
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderData | null>(null);
  const [copiedAlias, setCopiedAlias] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryMethod: "shipping",
    },
  });

  const deliveryMethod = form.watch("deliveryMethod");

  const onSubmit = async (values: FormValues) => {
    if (items.length === 0 || createdOrder) return;
    setLoading(true);
    try {
      const order = await createOrder({
        buyer: {
          name: values.name,
          email: values.email,
          phone: values.phone,
        },
        delivery: {
          method: values.deliveryMethod,
          address:
            values.deliveryMethod === "shipping" ? values.address : undefined,
        },
        items: items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
        })),
      });
      setCreatedOrder(order);
      clear();
    } catch (error) {
      console.error(error);
      navigate("/success?status=error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAlias = async () => {
    if (!createdOrder) return;
    await navigator.clipboard.writeText(createdOrder.transferAlias);
    setCopiedAlias(true);
  };

  const handleConfirmTransfer = async () => {
    if (!createdOrder) return;
    setConfirmingTransfer(true);
    try {
      await confirmOrderTransfer({
        orderId: createdOrder.orderId,
        publicTrackingToken: createdOrder.publicTrackingToken,
      });
      navigate("/success?status=transfer-confirmed");
    } catch (error) {
      console.error(error);
      navigate("/success?status=error");
    } finally {
      setConfirmingTransfer(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          className="space-y-6 rounded-2xl border border-slate-200 p-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex gap-3">
            <Button
              type="button"
              variant={step === "buyer" ? "secondary" : "outline"}
              onClick={() => setStep("buyer")}
              disabled={Boolean(createdOrder)}
            >
              1. Datos
            </Button>
            <Button
              type="button"
              variant={step === "payment" ? "secondary" : "outline"}
              onClick={() => setStep("payment")}
            >
              2. Pago
            </Button>
          </div>

          {step === "buyer" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input {...form.register("name")} placeholder="Tu nombre" />
                {form.formState.errors.name && (
                  <p className="text-xs text-rose-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...form.register("email")} placeholder="tu@email.com" />
                {form.formState.errors.email && (
                  <p className="text-xs text-rose-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input {...form.register("phone")} placeholder="+54 11 ..." />
                {form.formState.errors.phone && (
                  <p className="text-xs text-rose-500">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Método de entrega</Label>
                <Select
                  value={deliveryMethod}
                  onValueChange={(value) =>
                    form.setValue(
                      "deliveryMethod",
                      value as "shipping" | "pickup",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipping">Envío a domicilio</SelectItem>
                    <SelectItem value="pickup">Retiro en tienda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {deliveryMethod === "shipping" && (
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    {...form.register("address")}
                    placeholder="Calle 123, CABA"
                  />
                </div>
              )}
              <Button type="button" onClick={() => setStep("payment")}>
                Continuar al pago
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              {!createdOrder ? (
                <>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p>
                      Al continuar, generamos tu orden con estado <strong>PENDIENTE</strong>.
                      Luego te mostraremos el alias para transferir y confirmar tu pago.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading || items.length === 0}
                  >
                    {loading ? "Generando orden..." : "Generar pago por transferencia"}
                  </Button>
                </>
              ) : (
                <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <p>
                    <strong>Orden:</strong> {createdOrder.orderId}
                  </p>
                  <p>
                    <strong>Total a transferir:</strong> {formatPrice(createdOrder.total)}
                  </p>
                  <p>
                    <strong>Alias:</strong> {createdOrder.transferAlias}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={handleCopyAlias}>
                      {copiedAlias ? "Alias copiado" : "Copiar alias"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConfirmTransfer}
                      disabled={confirmingTransfer}
                    >
                      {confirmingTransfer
                        ? "Confirmando..."
                        : "Ya transferí, confirmar pago"}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600">
                    Cuando confirmes, la orden pasará a <strong>PAGADA</strong> y quedará
                    pendiente de revisión del administrador.
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold">Resumen</h2>
          {(createdOrder ? [] : items).map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between text-sm"
            >
              <span>
                {item.name} x {item.qty}
              </span>
              <span>{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm">
            <span>Envío</span>
            <span>A definir</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(createdOrder?.total ?? subtotal)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
