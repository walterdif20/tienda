import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";

const STATUS_LABELS: Record<string, string> = {
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

  const fetchOrderStatus = async (orderNumber: string) => {
    const ordersSnapshot = await getDocs(
      query(collection(db, "orders"), where("orderNumber", "==", orderNumber)),
    );

    if (ordersSnapshot.empty) {
      setError("No encontramos un pedido con ese número.");
      setResult(null);
      return;
    }

    const data = ordersSnapshot.docs[0]?.data() as {
      status?: string;
      createdAt?: unknown;
    };
    const status = String(data.status ?? "pending");

    setResult({
      status: resolveStatusLabel(status),
      updated: formatDate(data.createdAt),
    });
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const sanitizedOrderId = orderId.trim();

    if (!/^\d{6}$/.test(sanitizedOrderId)) {
      setError("Ingresá un número de orden válido de 6 dígitos.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      await fetchOrderStatus(sanitizedOrderId);
    } catch {
      setError(
        "No pudimos consultar el estado del pedido. Intentá nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!/^\d{6}$/.test(orderId.trim()) || !result) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchOrderStatus(orderId.trim()).catch(() => {
        setError(
          "No pudimos consultar el estado del pedido. Intentá nuevamente.",
        );
      });
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [orderId, result]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Seguimiento guest</h1>
      <p className="mt-2 text-sm text-slate-500">
        Ingresá el número de orden para ver el estado de tu pedido.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label>Número de orden (6 dígitos)</Label>
          <Input
            value={orderId}
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event) =>
              setOrderId(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
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
