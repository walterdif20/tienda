import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TrackPage() {
  const [orderId, setOrderId] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<null | { status: string; updated: string }>(
    null
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderId || !token) return;
    setResult({ status: "pending", updated: new Date().toLocaleString("es-AR") });
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Seguimiento guest</h1>
      <p className="mt-2 text-sm text-slate-500">
        Ingresá el ID de tu pedido y el token enviado por email para ver el estado.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label>ID de pedido</Label>
          <Input value={orderId} onChange={(event) => setOrderId(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Token público</Label>
          <Input value={token} onChange={(event) => setToken(event.target.value)} />
        </div>
        <Button type="submit">Consultar estado</Button>
      </form>

      {result && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p>
            <strong>Estado:</strong> {result.status}
          </p>
          <p>
            <strong>Última actualización:</strong> {result.updated}
          </p>
        </div>
      )}
    </section>
  );
}
