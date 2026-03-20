import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  defaultStoreSettings,
  fetchStoreSettings,
  saveStoreSettings,
  type StoreSettings,
} from "@/lib/store-settings";
import { StoreSettingsContext } from "@/providers/store-settings-context";

const fontMap: Record<StoreSettings["fontFamily"], string> = {
  inter: '"Inter", system-ui, sans-serif',
  poppins: '"Poppins", system-ui, sans-serif',
  montserrat: '"Montserrat", system-ui, sans-serif',
  lora: '"Lora", Georgia, serif',
};

const FAVICON_SELECTOR = "link[rel~='icon']";
const DEFAULT_FAVICON = "/vite.svg";

const applySettingsToDocument = (settings: StoreSettings) => {
  const root = document.documentElement;
  root.style.setProperty("--store-primary", settings.primaryColor);
  root.style.setProperty("--store-secondary", settings.secondaryColor);
  root.style.setProperty("--store-font", fontMap[settings.fontFamily]);

  let favicon = document.head.querySelector<HTMLLinkElement>(FAVICON_SELECTOR);

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  favicon.href = settings.faviconUrl || DEFAULT_FAVICON;

  if (settings.faviconUrl) {
    favicon.removeAttribute("type");
  } else {
    favicon.type = "image/svg+xml";
  }
};

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const remote = await fetchStoreSettings();
      setSettings(remote);
      applySettingsToDocument(remote);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload().catch((error) => {
      console.error(error);
      applySettingsToDocument(defaultStoreSettings);
      setLoading(false);
    });
  }, []);

  const save = async (next: StoreSettings) => {
    const saved = await saveStoreSettings(next);
    setSettings(saved);
    applySettingsToDocument(saved);
    return saved;
  };

  const value = useMemo(
    () => ({ settings, loading, reload, save }),
    [settings, loading],
  );

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}
