export const calculateLoyaltyPoints = (amount: number) => {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  return Math.max(0, Math.floor(normalizedAmount * 0.1));
};

export const formatLoyaltyPoints = (points: number) =>
  new Intl.NumberFormat("es-AR").format(points);
