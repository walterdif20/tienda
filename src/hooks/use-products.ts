import { useEffect, useState } from "react";
import { fetchProducts } from "@/lib/products";
import { seedProducts } from "@/data/products";
import type { Product } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const remote = await fetchProducts();
        if (mounted && remote.length > 0) {
          setProducts(remote);
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
  }, [reloadToken]);

  return { products, loading, reload: () => setReloadToken((value) => value + 1) };
}
