import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const mockOrders = [
  {
    id: "ORD-1024",
    buyer: "Valentina R.",
    total: "ARS 28.700",
    status: "pending",
  },
  {
    id: "ORD-1025",
    buyer: "Lucía P.",
    total: "ARS 19.200",
    status: "paid",
  },
];

export function AdminPage() {
  const [note, setNote] = useState("");

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Panel admin</h1>
      <p className="mt-2 text-sm text-slate-500">
        Gestioná órdenes pendientes y confirmaciones manuales.
      </p>

      <div className="mt-8 grid gap-4">
        {mockOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{order.id}</CardTitle>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {order.status}
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
                <Button size="sm">Marcar como pagada</Button>
                <Button size="sm" variant="outline">
                  Marcar como enviada
                </Button>
                <Button size="sm" variant="ghost">
                  Cancelar
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Nota admin"
                />
                <Button size="sm" variant="outline">
                  Guardar nota
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
