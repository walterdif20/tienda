import { useEffect, useState } from "react";
import { fetchProducts } from "@/lib/products";
import type { Product } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const remote = await fetchProducts();
        if (mounted) {
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReloadToken((value) => value + 1);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return {
    products,
    loading,
    reload: () => setReloadToken((value) => value + 1),
  };
}
