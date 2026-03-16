import { useMemo } from "react";
import { formatPrice } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminOrder, AdminProduct } from "@/components/admin/types";

type ReportsManagementProps = {
  orders: AdminOrder[];
  products: AdminProduct[];
};

type MonthlySale = {
  month: string;
  total: number;
};

const INCLUDED_STATUSES = new Set([
  "paid",
  "in_progress",
  "in_transit",
  "payment_in_review",
  "completed",
]);
const PIE_COLORS = [
  "#0f172a",
  "#334155",
  "#475569",
  "#64748b",
  "#94a3b8",
  "#cbd5e1",
];

export function ReportsManagementSection({
  orders,
  products,
}: ReportsManagementProps) {
  const validOrders = useMemo(
    () => orders.filter((order) => INCLUDED_STATUSES.has(order.status)),
    [orders],
  );

  const monthlySales = useMemo<MonthlySale[]>(() => {
    const byMonth = new Map<string, number>();

    for (const order of validOrders) {
      const date = new Date(order.createdAt);
      const key = Number.isNaN(date.getTime())
        ? "Sin fecha"
        : date.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
      byMonth.set(key, (byMonth.get(key) ?? 0) + order.total);
    }

    return Array.from(byMonth.entries()).map(([month, total]) => ({
      month,
      total,
    }));
  }, [validOrders]);

  const categoryTotals = useMemo(() => {
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const totals = new Map<string, number>();

    for (const order of validOrders) {
      for (const item of order.items) {
        const product = productsById.get(item.productId);
        const category = product?.categoryId || "Sin categoría";
        totals.set(
          category,
          (totals.get(category) ?? 0) + item.qty * item.unitPrice,
        );
      }
    }

    return Array.from(totals.entries())
      .map(([category, total], index) => ({
        category,
        total,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.total - a.total);
  }, [products, validOrders]);

  const topClients = useMemo(() => {
    const totals = new Map<string, number>();

    for (const order of validOrders) {
      const key = order.email.trim().toLowerCase() || order.buyer;
      totals.set(key, (totals.get(key) ?? 0) + order.total);
    }

    return Array.from(totals.entries())
      .map(([customer, total]) => ({ customer, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [validOrders]);

  const globalTotal = validOrders.reduce((sum, order) => sum + order.total, 0);
  const maxMonthly = Math.max(...monthlySales.map((item) => item.total), 1);

  const categoryTotalAmount = categoryTotals.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const pieStops = categoryTotals.reduce(
    (acc, item) => {
      const pct =
        categoryTotalAmount > 0 ? (item.total / categoryTotalAmount) * 100 : 0;
      const start = acc.current;
      const end = acc.current + pct;
      acc.current = end;
      acc.stops.push(`${item.color} ${start}% ${end}%`);
      return acc;
    },
    { current: 0, stops: [] as string[] },
  ).stops;

  const pieBackground = pieStops.length
    ? `conic-gradient(${pieStops.join(", ")})`
    : "conic-gradient(#e2e8f0 0% 100%)";

  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold">Reportes</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ventas netas (sin órdenes canceladas), comportamiento mensual y
          principales segmentos.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-slate-500">Ventas netas</p>
            <p className="text-2xl font-semibold">{formatPrice(globalTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-slate-500">
              Órdenes consideradas
            </p>
            <p className="text-2xl font-semibold">{validOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-slate-500">Ticket promedio</p>
            <p className="text-2xl font-semibold">
              {formatPrice(
                validOrders.length === 0 ? 0 : globalTotal / validOrders.length,
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ventas por mes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {monthlySales.length === 0 ? (
            <p className="text-sm text-slate-500">
              Todavía no hay ventas para graficar.
            </p>
          ) : (
            monthlySales.map((item) => (
              <div key={item.month}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.month}</span>
                  <span className="font-medium">{formatPrice(item.total)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{
                      width: `${Math.max((item.total / maxMonthly) * 100, 4)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas por categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {categoryTotals.length === 0 ? (
              <p className="text-slate-500">Sin datos de categorías todavía.</p>
            ) : (
              <>
                <div className="flex justify-center">
                  <div
                    className="h-44 w-44 rounded-full border border-slate-200"
                    style={{ background: pieBackground }}
                    aria-label="Gráfico de torta de ventas por categoría"
                    role="img"
                  />
                </div>
                <div className="space-y-2">
                  {categoryTotals.map((item) => {
                    const pct =
                      categoryTotalAmount > 0
                        ? (item.total / categoryTotalAmount) * 100
                        : 0;
                    return (
                      <div
                        key={item.category}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-600">
                            {item.category}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatPrice(item.total)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topClients.length === 0 ? (
              <p className="text-slate-500">
                Sin clientes con compras registradas.
              </p>
            ) : (
              topClients.map((item) => (
                <div
                  key={item.customer}
                  className="flex items-center justify-between"
                >
                  <span className="text-slate-600">{item.customer}</span>
                  <span className="font-medium">{formatPrice(item.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
