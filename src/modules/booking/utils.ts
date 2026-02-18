export const nextSevenDays = Array.from({ length: 7 }, (_, offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return {
    offset,
    label:
      offset === 0
        ? "Hoy"
        : offset === 1
          ? "Mañana"
          : date.toLocaleDateString("es-AR", {
              weekday: "short",
            }),
    fullDate: date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    }),
  };
});
