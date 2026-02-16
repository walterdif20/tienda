import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminStatus = "pending" | "paid" | "shipped" | "cancelled";

type AdminOrder = {
  id: string;
  buyer: string;
  total: string;
  status: AdminStatus;
  note: string;
};

const initialOrders: AdminOrder[] = [
  {
    id: "ORD-1024",
    buyer: "Valentina R.",
    total: "ARS 28.700",
    status: "pending",
    note: "",
  },
  {
    id: "ORD-1025",
    buyer: "Lucía P.",
    total: "ARS 19.200",
    status: "paid",
    note: "Pago validado por transferencia.",
  },
];

const statusLabel: Record<AdminStatus, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  shipped: "Enviada",
  cancelled: "Cancelada",
};

const statusClassName: Record<AdminStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  shipped: "bg-sky-100 text-sky-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export function AdminPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [activeFilter, setActiveFilter] = useState<"all" | AdminStatus>("all");

  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return orders;
    return orders.filter((order) => order.status === activeFilter);
  }, [activeFilter, orders]);

  const updateOrder = (id: string, patch: Partial<AdminOrder>) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === id ? { ...order, ...patch } : order,
      ),
    );
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Panel admin</h1>
      <p className="mt-2 text-sm text-slate-500">
        Gestioná órdenes pendientes y confirmaciones manuales.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeFilter === "all" ? "secondary" : "outline"}
          onClick={() => setActiveFilter("all")}
        >
          Todas
        </Button>
        <Button
          size="sm"
          variant={activeFilter === "pending" ? "secondary" : "outline"}
          onClick={() => setActiveFilter("pending")}
        >
          Pendientes
        </Button>
        <Button
          size="sm"
          variant={activeFilter === "paid" ? "secondary" : "outline"}
          onClick={() => setActiveFilter("paid")}
        >
          Pagadas
        </Button>
        <Button
          size="sm"
          variant={activeFilter === "shipped" ? "secondary" : "outline"}
          onClick={() => setActiveFilter("shipped")}
        >
          Enviadas
        </Button>
      </div>

      <div className="mt-8 grid gap-4">
        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-slate-500">
              No hay órdenes para este filtro.
            </CardContent>
          </Card>
        )}

        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{order.id}</CardTitle>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName[order.status]}`}
              >
                {statusLabel[order.status]}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                <strong>Comprador:</strong> {order.buyer}
              </p>
              <p>
                <strong>Total:</strong> {order.total}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateOrder(order.id, { status: "paid" })}
                >
                  Marcar como pagada
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateOrder(order.id, { status: "shipped" })}
                >
                  Marcar como enviada
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateOrder(order.id, { status: "cancelled" })}
                >
                  Cancelar
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  value={order.note}
                  onChange={(event) =>
                    updateOrder(order.id, { note: event.target.value })
                  }
                  placeholder="Nota admin"
                />
                <p className="text-xs text-slate-500">
                  Nota guardada localmente para esta sesión.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
