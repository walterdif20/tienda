import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Gift, ShieldCheck, Wallet } from "lucide-react";
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
import {
  calculateLoyaltyPoints,
  formatLoyaltyPoints,
  getLoyaltyProgress,
} from "@/lib/loyalty";
import { useCartStore } from "@/store/cartStore";
import { doc, getDoc } from "firebase/firestore";
import { confirmOrderTransfer, createOrder } from "@/lib/checkout";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";

const schema = z
  .object({
    name: z.string().min(2, "Ingresa tu nombre"),
    email: z.string().email("Ingresa un email válido"),
    phone: z.string().min(6, "Ingresa un teléfono válido"),
    deliveryMethod: z.enum(["shipping", "pickup"]),
    paymentMethod: z.enum(["mercado_pago_link", "bank_transfer"]),
    address: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (values.deliveryMethod === "shipping" && !values.address?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Ingresa una dirección para el envío",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const resolveNameFromEmail = (email: string) => {
  const [localPart] = email.split("@");
  if (!localPart) return "";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

type CreatedOrderData = {
  orderId: string;
  orderNumber: string;
  publicTrackingToken: string;
  transferAlias?: string;
  total: number;
  loyaltyPoints: number;
  redeemedPoints: number;
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { loyaltyPoints, loyaltyPointsYearly, user } = useAuth();
  const { appliedPoints, clear, items, setAppliedPoints } = useCartStore();
  const [step, setStep] = useState<"buyer" | "payment">("buyer");
  const [loading, setLoading] = useState(false);
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderData | null>(
    null,
  );
  const [copiedAlias, setCopiedAlias] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryMethod: "shipping",
      paymentMethod: "mercado_pago_link",
    },
  });

  useEffect(() => {
    const autofillLoggedUserData = async () => {
      if (!user) return;

      const fallbackName =
        user.displayName?.trim() ||
        (user.email ? resolveNameFromEmail(user.email) : "");
      const fallbackEmail = user.email ?? "";
      const fallbackPhone = user.phoneNumber ?? "";
      const fallbackAddress = "";

      let profilePhone = "";
      let profileAddress = "";
      let profileName = "";
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as {
            firstName?: string;
            lastName?: string;
            phone?: string;
            whatsappNumber?: string;
            address?: string;
          };
          const firstName = data.firstName?.trim() ?? "";
          const lastName = data.lastName?.trim() ?? "";
          profileName = `${firstName} ${lastName}`.trim();
          profilePhone = data.phone?.trim() || data.whatsappNumber?.trim() || "";
          profileAddress = data.address?.trim() ?? "";
        }
      } catch (error) {
        console.error(
          "No se pudo cargar el perfil del usuario para autocompletar el checkout",
          error,
        );
      }

      const currentName = form.getValues("name")?.trim();
      const currentEmail = form.getValues("email")?.trim();
      const currentPhone = form.getValues("phone")?.trim();
      const currentAddress = form.getValues("address")?.trim();

      const nextName = profileName || fallbackName;
      if (!currentName && nextName) {
        form.setValue("name", nextName, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }

      if (!currentEmail && fallbackEmail) {
        form.setValue("email", fallbackEmail, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }

      const nextPhone = profilePhone || fallbackPhone;
      if (!currentPhone && nextPhone) {
        form.setValue("phone", nextPhone, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }

      const nextAddress = profileAddress || fallbackAddress;
      if (!currentAddress && nextAddress) {
        form.setValue("address", nextAddress, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    };

    void autofillLoggedUserData();
  }, [form, user]);

  const deliveryMethod = form.watch("deliveryMethod");
  const paymentMethod = form.watch("paymentMethod");
  const transferDiscount =
    paymentMethod === "bank_transfer" ? subtotal * 0.1 : 0;
  const maxRedeemablePoints = Math.max(
    0,
    Math.min(loyaltyPoints, Math.floor(subtotal - transferDiscount)),
  );
  const redeemedPoints = Math.min(appliedPoints, maxRedeemablePoints);
  const totalPreview = Math.max(
    0,
    subtotal - transferDiscount - redeemedPoints,
  );
  const estimatedPoints = useMemo(
    () => calculateLoyaltyPoints(totalPreview),
    [totalPreview],
  );
  const loyaltyProgress = getLoyaltyProgress(
    loyaltyPointsYearly + estimatedPoints,
  );

  useEffect(() => {
    if (appliedPoints !== redeemedPoints) {
      setAppliedPoints(redeemedPoints);
    }
  }, [appliedPoints, redeemedPoints, setAppliedPoints]);

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
        paymentMethod: values.paymentMethod,
        redeemedPoints,
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

  const onInvalidSubmit = () => {
    setStep("buyer");
  };

  const goToPaymentStep = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      setStep("buyer");
      return;
    }
    setStep("payment");
  };

  const handleCopyAlias = async () => {
    if (!createdOrder) return;
    if (!createdOrder.transferAlias) return;
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
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <p className="mt-2 text-sm text-slate-500">
        Hicimos el cierre de compra más claro: beneficios visibles, ahorro comparado y fidelización sin sorpresas.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          className="space-y-6 rounded-2xl border border-slate-200 p-6"
          onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
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
              onClick={goToPaymentStep}
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
                    <SelectItem value="shipping">
                      Envío a domicilio (gratis en Necochea y Quequén)
                    </SelectItem>
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
                  {form.formState.errors.address && (
                    <p className="text-xs text-rose-500">
                      {form.formState.errors.address.message}
                    </p>
                  )}
                </div>
              )}
              <Button type="button" onClick={goToPaymentStep}>
                Continuar al pago
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              {!createdOrder ? (
                <>
                  <div className="space-y-3">
                    <Label>Opciones de pago</Label>
                    <button
                      type="button"
                      className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                        paymentMethod === "mercado_pago_link"
                          ? "border-slate-900 bg-slate-100"
                          : "border-slate-200"
                      }`}
                      onClick={() =>
                        form.setValue("paymentMethod", "mercado_pago_link", {
                          shouldDirty: true,
                        })
                      }
                    >
                      <p className="font-semibold">Link de pago (Mercado Pago)</p>
                      <p className="text-slate-600">
                        Te enviaremos un link de pago por WhatsApp en las próximas horas.
                      </p>
                    </button>
                    <button
                      type="button"
                      className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                        paymentMethod === "bank_transfer"
                          ? "border-slate-900 bg-slate-100"
                          : "border-slate-200"
                      }`}
                      onClick={() =>
                        form.setValue("paymentMethod", "bank_transfer", {
                          shouldDirty: true,
                        })
                      }
                    >
                      <p className="font-semibold">
                        Transferencia bancaria (10% de descuento)
                      </p>
                      <p className="text-slate-600">
                        Confirmá el pago y activamos revisión y aprobación de la orden.
                      </p>
                    </button>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Esta compra suma <strong>{formatLoyaltyPoints(estimatedPoints)} puntos</strong>. Tus puntos se acreditarán una vez que comencemos a preparar el pedido.
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading || items.length === 0}
                  >
                    {loading
                      ? "Generando orden..."
                      : paymentMethod === "mercado_pago_link"
                        ? "Generar orden con link de pago"
                        : "Generar pago por transferencia"}
                  </Button>
                </>
              ) : paymentMethod === "mercado_pago_link" ? (
                <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <p>
                    <strong>Orden:</strong> {createdOrder.orderNumber}
                  </p>
                  <p>
                    <strong>Total:</strong> {formatPrice(createdOrder.total)}
                  </p>
                  {createdOrder.redeemedPoints > 0 ? (
                    <p>
                      <strong>Puntos usados:</strong>{" "}
                      {formatLoyaltyPoints(createdOrder.redeemedPoints)}
                    </p>
                  ) : null}
                  <p className="text-slate-700">
                    En las próximas horas te enviaremos un link de pago por WhatsApp. Cuando el pago quede acreditado, se reservarán <strong>{formatLoyaltyPoints(createdOrder.loyaltyPoints)} puntos</strong> para tu cuenta y se acreditarán cuando comencemos a preparar tu pedido.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <p>
                    <strong>Orden:</strong> {createdOrder.orderNumber}
                  </p>
                  <p>
                    <strong>Total a transferir:</strong>{" "}
                    {formatPrice(createdOrder.total)}
                  </p>
                  {createdOrder.redeemedPoints > 0 ? (
                    <p>
                      <strong>Puntos usados:</strong>{" "}
                      {formatLoyaltyPoints(createdOrder.redeemedPoints)}
                    </p>
                  ) : null}
                  <p>
                    <strong>Alias:</strong> {createdOrder.transferAlias}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyAlias}
                    >
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
                    Cuando confirmes, la orden pasará a <strong>PAGADA</strong> y sumará <strong>{formatLoyaltyPoints(createdOrder.loyaltyPoints)} puntos</strong> pendientes. Los acreditaremos cuando comencemos a preparar tu pedido.
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold">Resumen</h2>
            <div className="grid gap-3">
              <ValueCard label="Subtotal" value={formatPrice(subtotal)} />
              <ValueCard
                label="Ahorro por transferencia"
                value={`-${formatPrice(transferDiscount)}`}
                highlight={paymentMethod === "bank_transfer" && transferDiscount > 0}
              />
              <ValueCard
                label="Puntos usados"
                value={`-${formatPrice(redeemedPoints)}`}
                highlight={redeemedPoints > 0}
              />
              <ValueCard
                label="Total estimado"
                value={formatPrice(createdOrder?.total ?? totalPreview)}
                emphasis
              />
            </div>

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

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-4 w-4 text-slate-700" />
                <div>
                  <p className="font-medium text-slate-900">Lo que conviene ahora</p>
                  <p>
                    {paymentMethod === "bank_transfer"
                      ? `Ya estás viendo el ahorro del 10%: ${formatPrice(transferDiscount)} menos sobre el subtotal.`
                      : "Si elegís transferencia, el resumen te muestra el 10% de descuento en tiempo real."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <Gift className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">Club de puntos</p>
                  <p>
                    Esta compra te deja con <strong>{formatLoyaltyPoints(loyaltyPointsYearly + estimatedPoints)} puntos históricos {new Date().getUTCFullYear()}</strong>. {loyaltyProgress.nextTier
                      ? `Te faltarían ${formatLoyaltyPoints(loyaltyProgress.missingPoints)} para subir a ${loyaltyProgress.nextTier.label}.`
                      : "Ya estás en el nivel más alto."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <p className="font-medium text-slate-900">Envío y seguridad</p>
                  <p>
                    Envío gratis a Necochea y Quequén, retiro en tienda y confirmación clara del estado de tu orden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
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
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
