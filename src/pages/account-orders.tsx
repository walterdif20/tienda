import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountOrdersPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Mis órdenes</h1>
      <p className="mt-2 text-sm text-slate-500">
        Accedé a tus pedidos y descargas desde tu cuenta.
      </p>
      <div className="mt-8 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ingresá a tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Para ver tus pedidos anteriores iniciá sesión o registrate con tu
              email.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Ingresar</Button>
              <Button variant="outline">Crear cuenta</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
