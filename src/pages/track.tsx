import { useState } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagada",
  in_progress: "En preparación",
  payment_in_review: "Pago en revisión",
  cancelled: "Cancelada",
};

const resolveStatusLabel = (status: string) => STATUS_LABELS[status] ?? status;

type TrackResult = {
  status: string;
  updated: string;
};

const formatDate = (createdAt: unknown) => {
  if (createdAt instanceof Timestamp) {
    return createdAt.toDate().toLocaleString("es-AR");
  }

  if (typeof createdAt === "string" || typeof createdAt === "number") {
    const date = new Date(createdAt);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("es-AR");
    }
  }

  return "Sin actualización";
};

export function TrackPage() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const sanitizedOrderId = orderId.trim();

    if (!sanitizedOrderId) {
      setError("Ingresá un ID de pedido válido.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const orderSnapshot = await getDoc(doc(db, "orders", sanitizedOrderId));

      if (!orderSnapshot.exists()) {
        setError("No encontramos un pedido con ese ID.");
        return;
      }

      const data = orderSnapshot.data() as { status?: string; createdAt?: unknown };
      const status = String(data.status ?? "pending");

      setResult({
        status: resolveStatusLabel(status),
        updated: formatDate(data.createdAt),
      });
    } catch {
      setError("No pudimos consultar el estado del pedido. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Seguimiento guest</h1>
      <p className="mt-2 text-sm text-slate-500">
        Ingresá el número de orden para ver el estado de tu pedido.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label>ID de pedido</Label>
          <Input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Consultando..." : "Consultar estado"}
        </Button>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

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
