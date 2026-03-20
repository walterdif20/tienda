export const calculateLoyaltyPoints = (amount: number) => {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  return Math.max(0, Math.floor(normalizedAmount * 0.1));
};

export const formatLoyaltyPoints = (points: number) =>
  new Intl.NumberFormat("es-AR").format(points);

export type LoyaltyTier = {
  id: "bronce" | "plata" | "oro";
  label: string;
  minPoints: number;
  accent: string;
};

export const loyaltyTiers: LoyaltyTier[] = [
  { id: "inicial", label: "Inicial", minPoints: 0, accent: "from-amber-500 to-orange-500" },
  { id: "bronce", label: "Bronce", minPoints: 3000, accent: "from-amber-500 to-orange-500" },
  { id: "plata", label: "Plata", minPoints: 6000, accent: "from-slate-400 to-slate-600" },
  { id: "oro", label: "Oro", minPoints: 10000, accent: "from-yellow-400 to-amber-500" },
];

export const getLoyaltyTier = (points: number) => {
  const normalized = Math.max(0, points);
  return [...loyaltyTiers].reverse().find((tier) => normalized >= tier.minPoints) ?? loyaltyTiers[0];
};

export const getNextLoyaltyTier = (points: number) => {
  const normalized = Math.max(0, points);
  return loyaltyTiers.find((tier) => tier.minPoints > normalized) ?? null;
};

export const getLoyaltyProgress = (points: number) => {
  const normalized = Math.max(0, points);
  const currentTier = getLoyaltyTier(normalized);
  const nextTier = getNextLoyaltyTier(normalized);
  const base = currentTier.minPoints;
  const ceiling = nextTier?.minPoints ?? Math.max(base + 1, normalized);
  const total = Math.max(1, ceiling - base);
  const current = Math.min(total, Math.max(0, normalized - base));

  return {
    currentTier,
    nextTier,
    missingPoints: nextTier ? Math.max(0, nextTier.minPoints - normalized) : 0,
    percentage: nextTier ? Math.min(100, Math.round((current / total) * 100)) : 100,
  };
};
