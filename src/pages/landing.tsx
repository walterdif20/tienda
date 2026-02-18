import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courts } from "@/modules/booking/data";
import { DaySelector } from "@/modules/booking/components/day-selector";
import { CourtAvailabilityCard } from "@/modules/booking/components/court-availability-card";

export function LandingPage() {
  const [selectedDay, setSelectedDay] = useState(0);

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Reserva de canchas
        </p>
        <h1 className="text-4xl font-semibold">Turnos disponibles por cancha</h1>
        <p className="text-slate-600">
          Consultá disponibilidad para los próximos siete días y registrate para
          reservar en segundos.
        </p>
        <Button asChild>
          <Link to="/registro" className="inline-flex items-center gap-2">
            Ir al registro <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Elegí un día</h2>
        <DaySelector selectedDay={selectedDay} onSelect={setSelectedDay} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courts.map((court) => (
          <CourtAvailabilityCard
            key={court.id}
            court={court}
            dayOffset={selectedDay}
          />
        ))}
      </div>
    </section>
  );
}
