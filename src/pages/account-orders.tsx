import { useEffect, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { fetchOrdersByUser } from "@/lib/orders";
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
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setOrders([]);
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

    return () => {
      isMounted = false;
    };
  }, [user]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (left, right) =>
          new Date(String(right.createdAt)).getTime() -
          new Date(String(left.createdAt)).getTime(),
      ),
    [orders],
  );

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

          {sortedOrders.map((order) => (
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
