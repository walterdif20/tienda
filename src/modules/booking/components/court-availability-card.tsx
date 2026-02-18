import type { Court } from "@/modules/booking/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type CourtAvailabilityCardProps = {
  court: Court;
  dayOffset: number;
};

export function CourtAvailabilityCard({
  court,
  dayOffset,
}: CourtAvailabilityCardProps) {
  const slots = court.slotsByDayOffset[dayOffset] ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{court.name}</span>
          <Badge variant="secondary">{court.surface}</Badge>
        </CardTitle>
        <p className="text-sm text-slate-500">{court.zone}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <Badge
              key={slot.id}
              variant={slot.available ? "default" : "outline"}
              className={slot.available ? "bg-emerald-600" : "opacity-60"}
            >
              {slot.time} · {slot.available ? "Disponible" : "Ocupado"}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
