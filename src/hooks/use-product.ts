import { useEffect, useState } from "react";
import { fetchProductBySlug } from "@/lib/products";
import type { Product } from "@/types";

export function useProduct(slug?: string) {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const remote = await fetchProductBySlug(slug);
        if (mounted && remote) {
          setProduct(remote);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    if (!slug) {
      return () => {
        mounted = false;
      };
    }

    const intervalId = window.setInterval(() => {
      void load();
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [slug]);

  return { product, loading };
}
