import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SuccessPage() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const isError = status === "error";

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">
        {isError ? "No pudimos procesar el pago" : "¡Gracias por tu compra!"}
      </h1>
      <p className="mt-4 text-slate-500">
        {isError
          ? "Podés intentar nuevamente o contactarnos para asistencia."
          : "Te enviamos un email con el detalle y el tracking de tu pedido."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/products">Seguir comprando</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/track">Ver seguimiento</Link>
        </Button>
      </div>
    </section>
  );
}
