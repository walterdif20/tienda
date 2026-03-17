import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "@/providers/auth-provider";
import { db } from "@/lib/firebase";

const FAVORITES_STORAGE_KEY = "tienda-favorites";

const uniqueIds = (ids: string[]) => [...new Set(ids.filter(Boolean))];

const readFavoritesFromLocalStorage = (): string[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return uniqueIds(
      parsed.filter((item): item is string => typeof item === "string"),
    );
  } catch {
    return [];
  }
};

const writeFavoritesToLocalStorage = (ids: string[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify(uniqueIds(ids)),
  );
};

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncFavorites = async () => {
      if (!user) {
        setFavoriteIds(readFavoritesFromLocalStorage());
        setLoading(false);
        return;
      }

      setLoading(true);
      const localFavorites = readFavoritesFromLocalStorage();
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
      const data = userSnapshot.data() as
        | { favoriteProductIds?: unknown }
        | undefined;
      const remoteFavorites = Array.isArray(data?.favoriteProductIds)
        ? data.favoriteProductIds.filter(
            (item): item is string => typeof item === "string",
          )
        : [];

      const mergedFavorites = uniqueIds([
        ...remoteFavorites,
        ...localFavorites,
      ]);

      if (
        mergedFavorites.length !== remoteFavorites.length ||
        mergedFavorites.some((id, index) => id !== remoteFavorites[index])
      ) {
        await setDoc(
          userRef,
          {
            favoriteProductIds: mergedFavorites,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
      setFavoriteIds(mergedFavorites);
      setLoading(false);
    };

    void syncFavorites();
  }, [user]);

  const setFavorites = useCallback(
    async (nextFavorites: string[]) => {
      const normalized = uniqueIds(nextFavorites);
      setFavoriteIds(normalized);

      if (!user) {
        writeFavoritesToLocalStorage(normalized);
        return;
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          favoriteProductIds: normalized,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
    [user],
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!productId) {
        return;
      }

      const nextFavorites = favoriteIds.includes(productId)
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId];

      await setFavorites(nextFavorites);
    },
    [favoriteIds, setFavorites],
  );

  return useMemo(
    () => ({
      favoriteIds,
      loading,
      isFavorite: (productId: string) => favoriteIds.includes(productId),
      toggleFavorite,
    }),
    [favoriteIds, loading, toggleFavorite],
  );
}
