import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { fetchOrdersByUser } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types";

export function AccountOrdersPage() {
  const { user, loading, signIn, signUp, signInWithGoogle, signOutUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadOrders = async () => {
      const data = await fetchOrdersByUser(user.uid);
      setOrders(data);
    };
    loadOrders();
  }, [user]);

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm text-slate-500">Cargando...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Mis órdenes</h1>
        <p className="mt-2 text-sm text-slate-500">
          Iniciá sesión o creá una cuenta para ver tus pedidos.
        </p>
        <Card className="mt-6">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {status && <p className="text-xs text-rose-500">{status}</p>}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={async () => {
                  try {
                    await signIn(email, password);
                  } catch (error) {
                    console.error(error);
                    setStatus("No pudimos iniciar sesión");
                  }
                }}
              >
                Ingresar
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await signUp(email, password);
                  } catch (error) {
                    console.error(error);
                    setStatus("No pudimos crear la cuenta");
                  }
                }}
              >
                Crear cuenta
              </Button>
              <Button variant="ghost" onClick={signInWithGoogle}>
                Continuar con Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Mis órdenes</h1>
          <p className="mt-2 text-sm text-slate-500">
            Revisa el estado de tus compras y próximos envíos.
          </p>
        </div>
        <Button variant="outline" onClick={signOutUser}>
          Cerrar sesión
        </Button>
      </div>

      <div className="mt-8 grid gap-4">
        {orders.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-slate-500">
              Aún no tenés órdenes registradas.
            </CardContent>
          </Card>
        )}
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>Orden {order.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                <strong>Estado:</strong> {order.status}
              </p>
              <p>
                <strong>Total:</strong> {formatPrice(order.total)}
              </p>
              <p>
                <strong>Entrega:</strong> {order.delivery.method === "shipping" ? "Envío" : "Retiro"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
