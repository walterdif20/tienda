import { useEffect, useState } from "react";
import { fetchProductBySlug } from "@/lib/products";
import { seedProducts } from "@/data/products";
import type { Product } from "@/types";

export function useProduct(slug?: string) {
  const [product, setProduct] = useState<Product | undefined>(() =>
    seedProducts.find((item) => item.slug === slug)
  );
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
    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  return { product, loading };
}
