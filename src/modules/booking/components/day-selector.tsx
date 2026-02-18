import { nextSevenDays } from "@/modules/booking/utils";
import { Button } from "@/components/ui/button";

type DaySelectorProps = {
  selectedDay: number;
  onSelect: (offset: number) => void;
};

export function DaySelector({ selectedDay, onSelect }: DaySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {nextSevenDays.map((day) => (
        <Button
          key={day.offset}
          variant={selectedDay === day.offset ? "default" : "outline"}
          className="h-auto min-w-28 flex-col py-2"
          onClick={() => onSelect(day.offset)}
        >
          <span>{day.label}</span>
          <span className="text-xs font-normal opacity-80">{day.fullDate}</span>
        </Button>
      ))}
    </div>
  );
}
