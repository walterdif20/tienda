import { useEffect, useMemo, useState } from "react";
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

const TIMELINE_STEPS = [
  { id: "pending", label: "Pedido recibido", statuses: ["pending", "link_pending", "link_sent", "payment_in_review", "paid", "in_progress", "in_transit", "completed"] },
  { id: "paid", label: "Pago resuelto", statuses: ["paid", "in_progress", "in_transit", "completed"] },
  { id: "in_progress", label: "Preparando pedido", statuses: ["in_progress", "in_transit", "completed"] },
  { id: "in_transit", label: "En camino", statuses: ["in_transit", "completed"] },
  { id: "completed", label: "Entregado", statuses: ["completed"] },
];

const resolveStatusLabel = (status: string) => STATUS_LABELS[status] ?? status;

type TrackResult = {
  rawStatus: string;
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
      rawStatus: status,
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

  const timelineSteps = useMemo(() => {
    if (!result) return [];

    return TIMELINE_STEPS.map((step) => ({
      ...step,
      completed: step.statuses.includes(result.rawStatus),
      current:
        step.id === result.rawStatus ||
        (result.rawStatus === "link_pending" && step.id === "pending") ||
        (result.rawStatus === "link_sent" && step.id === "pending") ||
        (result.rawStatus === "payment_in_review" && step.id === "paid"),
    }));
  }, [result]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Seguimiento de pedido</h1>
      <p className="mt-2 text-sm text-slate-500">
        Ingresá el número de orden para ver el estado y una línea de tiempo simple del pedido.
      </p>

      <form className="mt-6 space-y-4 rounded-2xl border border-slate-200 p-6" onSubmit={handleSubmit}>
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
        <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm">
            <p>
              <strong>Estado actual:</strong> {result.status}
            </p>
            <p>
              <strong>Última actualización:</strong> {result.updated}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {timelineSteps.map((step) => (
              <div key={step.id} className="relative rounded-2xl border border-slate-200 p-4 text-sm">
                <div
                  className={`mb-3 h-3 w-3 rounded-full ${
                    step.completed
                      ? "bg-emerald-500"
                      : step.current
                        ? "bg-slate-900"
                        : "bg-slate-300"
                  }`}
                />
                <p className="font-medium text-slate-900">{step.label}</p>
                <p className="mt-1 text-slate-500">
                  {step.completed ? "Completado" : step.current ? "Estado actual" : "Pendiente"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
