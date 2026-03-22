import { useEffect, useState } from "react";
import { defaultCategories } from "@/data/products";
import { fetchCategories } from "@/lib/categories";
import type { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const remote = await fetchCategories();
        if (mounted) {
          setCategories(remote);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [reloadToken]);

  return {
    categories,
    loading,
    reload: () => setReloadToken((value) => value + 1),
  };
}
