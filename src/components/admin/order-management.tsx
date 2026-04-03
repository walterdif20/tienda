import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AdminOrder,
  AdminOrderStatus,
  AdminProduct,
  ManualSaleInput,
  ManualSaleResult,
  StatusChangeResult,
} from "@/components/admin/types";

type OrderManagementProps = {
  orders: AdminOrder[];
  products: AdminProduct[];
  onUpdateOrderStatus: (
    orderId: string,
    status: AdminOrderStatus,
  ) => StatusChangeResult;
  onUpdateOrderNote: (orderId: string, note: string) => void;
  onCreateManualSale: (input: ManualSaleInput) => ManualSaleResult;
};

const statusLabel: Record<AdminOrderStatus, string> = {
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

const statusClassName: Record<AdminOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  link_pending: "bg-orange-100 text-orange-700",
  link_sent: "bg-indigo-100 text-indigo-700",
  paid: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-sky-100 text-sky-700",
  in_transit: "bg-cyan-100 text-cyan-700",
  payment_in_review: "bg-violet-100 text-violet-700",
  completed: "bg-teal-100 text-teal-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const statusConfirmationMessage: Partial<Record<AdminOrderStatus, string>> = {
  payment_in_review:
    "¿Seguro que querés marcar esta orden como pago en revisión?",
  cancelled: "¿Seguro que querés cancelar esta orden?",
  completed: "¿Seguro que querés marcar esta orden como completada?",
  in_progress: "¿Seguro que querés mover esta orden a en curso?",
  in_transit: "¿Seguro que querés marcar esta orden como en viaje?",
  link_sent: "¿Seguro que querés marcar el link como enviado?",
  paid: "¿Seguro que querés marcar el pago como acreditado?",
};

export function OrderManagementSection({
  orders,
  products,
  onUpdateOrderStatus,
  onUpdateOrderNote,
  onCreateManualSale,
}: OrderManagementProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | AdminOrderStatus>(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saleForm, setSaleForm] = useState({
    buyer: "",
    email: "",
    productId: products[0]?.id ?? "",
    qty: "1",
  });

  const filteredOrders = useMemo(() => {
    const byStatus =
      activeFilter === "all"
        ? orders
        : orders.filter((order) => order.status === activeFilter);

    const needle = searchTerm.toLowerCase().trim();
    if (!needle) return byStatus;

    return byStatus.filter((order) =>
      [order.id, order.buyer, order.email]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [activeFilter, orders, searchTerm]);

  const totals = useMemo(() => {
    const netSales = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0);

    return {
      pending: orders.filter((order) => order.status === "pending").length,
      netSales,
      inProgress: orders.filter((order) => order.status === "in_progress")
        .length,
    };
  }, [orders]);

  const handleStatusChange = async (
    orderId: string,
    status: AdminOrderStatus,
  ) => {
    const confirmationMessage = statusConfirmationMessage[status];
    if (confirmationMessage && !window.confirm(confirmationMessage)) {
      return;
    }

    const result = await onUpdateOrderStatus(orderId, status);
    setFeedback(result.message ?? null);
  };

  const handleManualSale = async () => {
    const qty = Number(saleForm.qty);

    const result = await onCreateManualSale({
      buyer: saleForm.buyer,
      email: saleForm.email,
      productId: saleForm.productId,
      qty,
    });

    setFeedback(result.message ?? null);

    if (result.ok) {
      setSaleForm({
        buyer: "",
        email: "",
        productId: products[0]?.id ?? "",
        qty: "1",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Ventas y órdenes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Controlá estados de venta, notas y generación manual de pedidos.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-slate-500">Pendientes</p>
            <p className="text-2xl font-semibold">{totals.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-slate-500">Ventas netas</p>
            <p className="text-2xl font-semibold">
              {formatPrice(totals.netSales)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-slate-500">En curso</p>
            <p className="text-2xl font-semibold">{totals.inProgress}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Registrar venta manual</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Cliente"
            value={saleForm.buyer}
            onChange={(event) =>
              setSaleForm((current) => ({
                ...current,
                buyer: event.target.value,
              }))
            }
          />
          <Input
            placeholder="Email"
            value={saleForm.email}
            onChange={(event) =>
              setSaleForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Producto</span>
            <select
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
              value={saleForm.productId}
              onChange={(event) =>
                setSaleForm((current) => ({
                  ...current,
                  productId: event.target.value,
                }))
              }
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              placeholder="Cantidad"
              value={saleForm.qty}
              onChange={(event) =>
                setSaleForm((current) => ({
                  ...current,
                  qty: event.target.value,
                }))
              }
            />
            <Button onClick={handleManualSale}>Crear</Button>
          </div>
        </CardContent>
      </Card>

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
          variant={activeFilter === "link_pending" ? "secondary" : "outline"}
          onClick={() => setActiveFilter("link_pending")}
        >
          Link pendiente
        </Button>
        <Button
          size="sm"
          variant={activeFilter === "link_sent" ? "secondary" : "outline"}
          onClick={() => setActiveFilter("link_sent")}
        >
          Link enviado
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
          variant={activeFilter === "in_progress" ? "secondary" : "outline"}
          onClick={() => setActiveFilter("in_progress")}
        >
          En curso
        </Button>
        <Button
          size="sm"
          variant={activeFilter === "in_transit" ? "secondary" : "outline"}
          onClick={() => setActiveFilter("in_transit")}
        >
          En viaje
        </Button>
        <Button
          size="sm"
          variant={
            activeFilter === "payment_in_review" ? "secondary" : "outline"
          }
          onClick={() => setActiveFilter("payment_in_review")}
        >
          Pago en revisión
        </Button>
        <div className="min-w-[240px] flex-1">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por orden, cliente o email"
          />
        </div>
      </div>

      {feedback && <p className="mt-3 text-sm text-slate-600">{feedback}</p>}

      <div className="mt-6 grid gap-4">
        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-slate-500">
              No hay ventas para este filtro.
            </CardContent>
          </Card>
        )}

        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Orden #{order.orderNumber ?? order.id}</CardTitle>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName[order.status]}`}
              >
                {statusLabel[order.status]}
              </span>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>
                <strong>Cliente:</strong> {order.buyer} · {order.email}
              </p>
              <p>
                <strong>Total:</strong> {formatPrice(order.total)} ·
                <strong> Método:</strong>{" "}
                {order.paymentMethod === "bank_transfer"
                  ? "Transferencia"
                  : order.paymentMethod === "mercado_pago_link"
                    ? "Link de Mercado Pago"
                    : "Manual"}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.name} · {item.qty} x {formatPrice(item.unitPrice)}
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acciones principales
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(order.paymentMethod === "bank_transfer" &&
                    (order.status === "pending" ||
                      order.status === "payment_in_review")) ||
                  (order.paymentMethod === "mercado_pago_link" &&
                    order.status === "payment_in_review") ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "paid")}
                    >
                      Marcar pago acreditado
                    </Button>
                  ) : null}
                  {order.paymentMethod === "mercado_pago_link" &&
                  order.status === "link_pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "link_sent")}
                    >
                      Marcar link enviado
                    </Button>
                  ) : null}
                  {order.paymentMethod === "mercado_pago_link" &&
                  order.status === "link_sent" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "paid")}
                    >
                      Marcar pago acreditado
                    </Button>
                  ) : null}
                  {order.status === "paid" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "in_progress")}
                    >
                      Comenzar preparación
                    </Button>
                  ) : null}
                  {order.paymentMethod === "manual" &&
                  order.status !== "paid" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "in_progress")}
                    >
                      Aprobar pago (En curso)
                    </Button>
                  ) : null}
                  {order.status === "in_progress" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "in_transit")}
                    >
                      Marcar en viaje
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStatusChange(order.id, "completed")}
                  >
                    Marcar como completada
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Acciones sensibles
                    </p>
                    <p className="mt-1 text-xs text-amber-700/80">
                      Reubicamos revisión de pago y cancelación para evitar errores.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button
                      size="sm"
                      className="bg-violet-600 text-white hover:bg-violet-700"
                      onClick={() =>
                        handleStatusChange(order.id, "payment_in_review")
                      }
                    >
                      Marcar pago en revisión
                    </Button>
                    <Button
                      size="sm"
                      className="bg-rose-600 text-white hover:bg-rose-700"
                      onClick={() => handleStatusChange(order.id, "cancelled")}
                    >
                      Cancelar orden
                    </Button>
                  </div>
                </div>
              </div>
              <Input
                value={order.note}
                onChange={(event) =>
                  onUpdateOrderNote(order.id, event.target.value)
                }
                placeholder="Nota interna de la venta"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
