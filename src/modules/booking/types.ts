export type TimeSlot = {
  id: string;
  time: string;
  available: boolean;
};

export type Court = {
  id: string;
  name: string;
  surface: string;
  zone: string;
  slotsByDayOffset: Record<number, TimeSlot[]>;
};
