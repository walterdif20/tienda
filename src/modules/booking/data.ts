import type { Court } from "@/modules/booking/types";

const makeSlots = (base: string[], unavailableIndexes: number[] = []) =>
  base.map((time, index) => ({
    id: `${time}-${index}`,
    time,
    available: !unavailableIndexes.includes(index),
  }));

const baseMorning = ["08:00", "09:30", "11:00"];
const baseAfternoon = ["16:00", "17:30", "19:00", "20:30"];

export const courts: Court[] = [
  {
    id: "cancha-1",
    name: "Cancha 1",
    surface: "Césped sintético",
    zone: "Sede Norte",
    slotsByDayOffset: {
      0: makeSlots([...baseMorning, ...baseAfternoon], [1, 5]),
      1: makeSlots([...baseMorning, ...baseAfternoon], [0, 3]),
      2: makeSlots([...baseMorning, ...baseAfternoon], [2]),
      3: makeSlots([...baseMorning, ...baseAfternoon], [1, 4]),
      4: makeSlots([...baseMorning, ...baseAfternoon], [6]),
      5: makeSlots([...baseMorning, ...baseAfternoon], [0, 2, 5]),
      6: makeSlots([...baseMorning, ...baseAfternoon], [3]),
    },
  },
  {
    id: "cancha-2",
    name: "Cancha 2",
    surface: "Cemento",
    zone: "Sede Norte",
    slotsByDayOffset: {
      0: makeSlots([...baseMorning, ...baseAfternoon], [2, 4]),
      1: makeSlots([...baseMorning, ...baseAfternoon], [6]),
      2: makeSlots([...baseMorning, ...baseAfternoon], [1, 5]),
      3: makeSlots([...baseMorning, ...baseAfternoon], [0, 2]),
      4: makeSlots([...baseMorning, ...baseAfternoon], [4]),
      5: makeSlots([...baseMorning, ...baseAfternoon], [3, 6]),
      6: makeSlots([...baseMorning, ...baseAfternoon], [1]),
    },
  },
  {
    id: "cancha-3",
    name: "Cancha 3",
    surface: "Césped sintético",
    zone: "Sede Sur",
    slotsByDayOffset: {
      0: makeSlots([...baseMorning, ...baseAfternoon], [0, 6]),
      1: makeSlots([...baseMorning, ...baseAfternoon], [2, 3]),
      2: makeSlots([...baseMorning, ...baseAfternoon], [5]),
      3: makeSlots([...baseMorning, ...baseAfternoon], [1, 4]),
      4: makeSlots([...baseMorning, ...baseAfternoon], [0, 2, 6]),
      5: makeSlots([...baseMorning, ...baseAfternoon], [3]),
      6: makeSlots([...baseMorning, ...baseAfternoon], [2, 5]),
    },
  },
];
