import { useContext } from "react";
import { StoreSettingsContext } from "@/providers/store-settings-context";

export const useStoreSettings = () => {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error(
      "useStoreSettings debe usarse dentro de StoreSettingsProvider",
    );
  }

  return ctx;
};
