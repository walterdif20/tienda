import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export type StoreFontFamily = "inter" | "poppins" | "montserrat" | "lora";

export type StoreSettings = {
  title: string;
  logoUrl: string;
  faviconUrl: string;
  heroImages: string[];
  primaryColor: string;
  secondaryColor: string;
  fontFamily: StoreFontFamily;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  instagramUrl: string;
};

const SETTINGS_DOC = doc(db, "storeSettings", "main");

export const defaultStoreSettings: StoreSettings = {
  title: "Tienda Minimal",
  logoUrl: "",
  faviconUrl: "",
  heroImages: [],
  primaryColor: "#0f172a",
  secondaryColor: "#e2e8f0",
  fontFamily: "inter",
  whatsappNumber: "+5491100000000",
  contactPhone: "+54 9 11 1234-5678",
  contactEmail: "hola@tiendaminimal.com",
  instagramUrl: "https://instagram.com/tiendaminimal",
};

const sanitizeHexColor = (value: string, fallback: string) => {
  const trimmed = value.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : fallback;
};

const sanitizeHeroImages = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const sanitizeFont = (value: string): StoreFontFamily => {
  if (value === "poppins" || value === "montserrat" || value === "lora") {
    return value;
  }

  return "inter";
};

export const normalizeStoreSettings = (
  value: Partial<StoreSettings> | undefined,
): StoreSettings => ({
  title: value?.title?.trim() || defaultStoreSettings.title,
  logoUrl: value?.logoUrl?.trim() || "",
  faviconUrl: value?.faviconUrl?.trim() || "",
  heroImages: sanitizeHeroImages(value?.heroImages),
  primaryColor: sanitizeHexColor(
    value?.primaryColor ?? "",
    defaultStoreSettings.primaryColor,
  ),
  secondaryColor: sanitizeHexColor(
    value?.secondaryColor ?? "",
    defaultStoreSettings.secondaryColor,
  ),
  fontFamily: sanitizeFont(value?.fontFamily ?? ""),
  whatsappNumber:
    value?.whatsappNumber?.trim() || defaultStoreSettings.whatsappNumber,
  contactPhone:
    value?.contactPhone?.trim() || defaultStoreSettings.contactPhone,
  contactEmail:
    value?.contactEmail?.trim() || defaultStoreSettings.contactEmail,
  instagramUrl: value?.instagramUrl?.trim() || defaultStoreSettings.instagramUrl,
});

export const fetchStoreSettings = async () => {
  const snapshot = await getDoc(SETTINGS_DOC);
  if (!snapshot.exists()) {
    return defaultStoreSettings;
  }

  return normalizeStoreSettings(snapshot.data() as Partial<StoreSettings>);
};

export const saveStoreSettings = async (input: StoreSettings) => {
  const payload = normalizeStoreSettings(input);

  await setDoc(
    SETTINGS_DOC,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return payload;
};

const uploadStoreImage = async (folder: string, file: File) => {
  const fileRef = ref(
    storage,
    `store-settings/${folder}-${Date.now()}-${file.name}`,
  );
  const uploaded = await uploadBytes(fileRef, file);
  return getDownloadURL(uploaded.ref);
};

export const uploadStoreLogo = async (file: File) =>
  uploadStoreImage("logo", file);

export const uploadStoreFavicon = async (file: File) =>
  uploadStoreImage("favicon", file);

export const uploadStoreHeroImage = async (file: File) =>
  uploadStoreImage("hero", file);
