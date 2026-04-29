import { useEffect, useState } from "react";
import { fetchDiscountRules, type DiscountRule } from "@/lib/discounts";

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const remote = await fetchDiscountRules();
        if (mounted) {
          setDiscounts(remote.filter((item) => item.isActive));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    const intervalId = window.setInterval(() => {
      void load();
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return { discounts, loading };
}
