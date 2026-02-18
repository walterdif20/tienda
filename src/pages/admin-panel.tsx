import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { courts } from "@/modules/booking/data";

export function AdminPanelPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Panel de administración</h1>
        <p className="text-sm text-slate-500">
          Vista rápida de canchas, estados y acciones de gestión.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courts.map((court) => {
          const availableToday = (court.slotsByDayOffset[0] ?? []).filter(
            (slot) => slot.available,
          ).length;

          return (
            <Card key={court.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{court.name}</span>
                  <Badge variant="secondary">{court.zone}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>Superficie: {court.surface}</p>
                <p>Turnos disponibles hoy: {availableToday}</p>
                <p className="text-amber-700">Acción pendiente: validar cobros.</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
