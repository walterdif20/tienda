import { useEffect, useMemo, useState } from "react";
import { Gift, ShieldCheck } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { fetchOrdersByUser } from "@/lib/orders";
import { formatLoyaltyPoints, getLoyaltyProgress } from "@/lib/loyalty";
import { useAuth } from "@/providers/auth-provider";
import type { Order } from "@/types";

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pendiente de pago",
  link_pending: "Envío de link pendiente",
  link_sent: "Link enviado",
  paid: "Pagada",
  in_progress: "En curso",
  in_transit: "En viaje",
  payment_in_review: "Pago en revisión",
  completed: "Completada",
  cancelled: "Cancelada",
};

const getOrderTime = (createdAt: unknown) => {
  if (createdAt instanceof Timestamp) {
    return createdAt.toMillis();
  }

  if (typeof createdAt === "string" || typeof createdAt === "number") {
    const parsedDate = new Date(createdAt);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.getTime();
    }
  }

  return 0;
};

const formatOrderDate = (createdAt: unknown) => {
  if (createdAt instanceof Timestamp) {
    return createdAt.toDate().toLocaleString("es-AR");
  }

  if (typeof createdAt === "string" || typeof createdAt === "number") {
    const parsedDate = new Date(createdAt);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleString("es-AR");
    }
  }

  return "Fecha no disponible";
};

export function AccountOrdersPage() {
  const { loyaltyPoints, loyaltyPointsYearly, user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState("");
  const [showAllOrders, setShowAllOrders] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setShowAllOrders(false);
      return;
    }

    let isMounted = true;

    const loadOrders = async () => {
      setIsLoadingOrders(true);
      setError("");

      try {
        const userOrders = await fetchOrdersByUser(user.uid);

        if (!isMounted) {
          return;
        }

        setOrders(userOrders);
      } catch {
        if (isMounted) {
          setError("No pudimos cargar tus compras. Intentá nuevamente.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingOrders(false);
        }
      }
    };

    void loadOrders();

    const intervalId = window.setInterval(() => {
      void loadOrders();
    }, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [user]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (left, right) =>
          getOrderTime(right.createdAt) - getOrderTime(left.createdAt),
      ),
    [orders],
  );

  const visibleOrders = useMemo(
    () => (showAllOrders ? sortedOrders : sortedOrders.slice(0, 3)),
    [showAllOrders, sortedOrders],
  );

  const hasPreviousOrders = sortedOrders.length > 3;
  const loyaltyProgress = getLoyaltyProgress(loyaltyPointsYearly);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Mis compras</h1>
      <p className="mt-2 text-sm text-slate-500">
        Revisá el estado y el detalle de todas las compras hechas con tu cuenta.
      </p>

      {loading ? (
        <Card className="mt-8">
          <CardContent className="p-6 text-sm text-slate-600">
            Cargando cuenta...
          </CardContent>
        </Card>
      ) : null}

      {!loading && !user ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Ingresá a tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Para ver tus compras, iniciá sesión o registrate con tu email.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/login">Ingresar</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/registro">Crear cuenta</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!loading && user ? (
        <div className="mt-8 grid gap-4">
          <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_0.85fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Club de fidelización</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Nivel {loyaltyProgress.currentTier.label}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Tenés {formatLoyaltyPoints(loyaltyPoints)} puntos canjeables y {formatLoyaltyPoints(loyaltyPointsYearly)} puntos históricos en {new Date().getUTCFullYear()}.
                  {loyaltyProgress.nextTier
                    ? ` Te faltan ${formatLoyaltyPoints(loyaltyProgress.missingPoints)} para subir a ${loyaltyProgress.nextTier.label}.`
                    : " Ya alcanzaste el nivel más alto del club."}
                </p>
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Gift className="h-4 w-4 text-amber-500" />
                  Recompra con beneficios
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: `${loyaltyProgress.percentage}%` }} />
                </div>
                <p className="text-sm text-slate-600">
                  Usá tus puntos en carrito/checkout y seguí el estado de tus órdenes desde tu cuenta.
                </p>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Tus puntos se acreditan cuando comenzamos a preparar el pedido.
                </div>
              </div>
            </CardContent>
          </Card>
          {isLoadingOrders ? (
            <Card>
              <CardContent className="p-6 text-sm text-slate-600">
                Cargando tus compras...
              </CardContent>
            </Card>
          ) : null}

          {error ? (
            <Card>
              <CardContent className="p-6 text-sm text-rose-700">
                {error}
              </CardContent>
            </Card>
          ) : null}

          {!isLoadingOrders && !error && sortedOrders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-slate-600">
                Todavía no registrás compras con esta cuenta.
              </CardContent>
            </Card>
          ) : null}

          {visibleOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">
                  Compra #{order.orderNumber ?? order.id}
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Realizada el {formatOrderDate(order.createdAt)}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>
                  <strong>Estado:</strong> {STATUS_LABELS[order.status]}
                </p>
                <p>
                  <strong>Total:</strong> {formatPrice(order.total)}
                </p>
                <p>
                  <strong>Entrega:</strong>{" "}
                  {order.delivery.method === "shipping"
                    ? `Envío a ${order.delivery.address ?? "domicilio"}`
                    : "Retiro en tienda"}
                </p>
                {order.loyalty?.redeemedPoints ? (
                  <p>
                    <strong>Puntos usados:</strong>{" "}
                    {order.loyalty.redeemedPoints}
                  </p>
                ) : null}
                {order.loyalty?.pointsEarned ? (
                  <p>
                    <strong>Puntos ganados:</strong>{" "}
                    {order.loyalty.pointsEarned} ·{" "}
                    {order.loyalty.status === "credited"
                      ? "Ya acreditados en tu cuenta."
                      : "Se acreditarán cuando comencemos a preparar tu pedido."}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}

          {!isLoadingOrders && !error && hasPreviousOrders && !showAllOrders ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowAllOrders(true)}>
                Mostrar anteriores
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
