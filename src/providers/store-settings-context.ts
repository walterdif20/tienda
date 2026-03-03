import { createContext } from "react";
import type { StoreSettings } from "@/lib/store-settings";

export type StoreSettingsContextValue = {
  settings: StoreSettings;
  loading: boolean;
  reload: () => Promise<void>;
  save: (next: StoreSettings) => Promise<StoreSettings>;
};

export const StoreSettingsContext =
  createContext<StoreSettingsContextValue | null>(null);
