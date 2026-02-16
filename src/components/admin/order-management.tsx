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
  pending: "Pendiente",
  paid: "Pagada",
  shipped: "Enviada",
  cancelled: "Cancelada",
};

const statusClassName: Record<AdminOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  shipped: "bg-sky-100 text-sky-700",
  cancelled: "bg-rose-100 text-rose-700",
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
    const paid = orders
      .filter((order) => order.status === "paid" || order.status === "shipped")
      .reduce((sum, order) => sum + order.total, 0);

    return {
      pending: orders.filter((order) => order.status === "pending").length,
      paid,
      shipped: orders.filter((order) => order.status === "shipped").length,
    };
  }, [orders]);

  const handleStatusChange = (orderId: string, status: AdminOrderStatus) => {
    const result = onUpdateOrderStatus(orderId, status);
    setFeedback(result.message ?? null);
  };

  const handleManualSale = () => {
    const qty = Number(saleForm.qty);

    const result = onCreateManualSale({
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
            <p className="text-xs uppercase text-slate-500">Ventas cobradas</p>
            <p className="text-2xl font-semibold">{formatPrice(totals.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-slate-500">Enviadas</p>
            <p className="text-2xl font-semibold">{totals.shipped}</p>
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
              <CardTitle>{order.id}</CardTitle>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName[order.status]}`}
              >
                {statusLabel[order.status]}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                <strong>Cliente:</strong> {order.buyer} · {order.email}
              </p>
              <p>
                <strong>Total:</strong> {formatPrice(order.total)} ·
                <strong> Método:</strong> {order.paymentMethod}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.name} · {item.qty} x {formatPrice(item.unitPrice)}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(order.id, "paid")}
                >
                  Marcar pagada
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(order.id, "shipped")}
                >
                  Marcar enviada
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStatusChange(order.id, "cancelled")}
                >
                  Cancelar
                </Button>
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
