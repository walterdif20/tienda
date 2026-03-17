import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadStoreHeroImage,
  uploadStoreLogo,
  type StoreSettings,
} from "@/lib/store-settings";
import { useStoreSettings } from "@/hooks/use-store-settings";

const fontOptions: Array<{
  value: StoreSettings["fontFamily"];
  label: string;
}> = [
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "montserrat", label: "Montserrat" },
  { value: "lora", label: "Lora" },
];

export function StoreSettingsManagementSection() {
  const { settings, save } = useStoreSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const onSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await save(form);
      setFeedback("Configuración guardada con éxito.");
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const onUploadLogo = async (file?: File) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback("Seleccioná una imagen válida para el logo.");
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const logoUrl = await uploadStoreLogo(file);
      setForm((current) => ({ ...current, logoUrl }));
      setFeedback("Logo cargado. Recordá guardar los cambios.");
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo subir el logo.");
    } finally {
      setUploading(false);
    }
  };

  const onUploadHeroImage = async (file?: File) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback("Seleccioná una imagen válida para el carrusel.");
      return;
    }

    setUploadingHero(true);
    setFeedback(null);

    try {
      const imageUrl = await uploadStoreHeroImage(file);
      setForm((current) => ({
        ...current,
        heroImages: [...current.heroImages, imageUrl],
      }));
      setFeedback("Imagen destacada cargada. Recordá guardar los cambios.");
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo subir la imagen destacada.");
    } finally {
      setUploadingHero(false);
    }
  };

  const removeHeroImage = (index: number) => {
    setForm((current) => ({
      ...current,
      heroImages: current.heroImages.filter(
        (_, imageIndex) => imageIndex !== index,
      ),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de la tienda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="store-title">Título de la tienda</Label>
            <Input
              id="store-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Ej: Tienda Minimal"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="store-logo">Logo</Label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                {uploading ? "Subiendo..." : "Subir logo"}
                <input
                  id="store-logo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => onUploadLogo(event.target.files?.[0])}
                />
              </label>
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Preview logo"
                  className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <span className="text-sm text-slate-500">
                  Sin logo cargado.
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Imágenes del carrusel principal</Label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />
                {uploadingHero ? "Subiendo..." : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploadingHero}
                  onChange={(event) =>
                    onUploadHeroImage(event.target.files?.[0])
                  }
                />
              </label>
            </div>

            {form.heroImages.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                Subí imágenes para mostrar en la sección principal.
              </p>
            ) : (
              <div className="space-y-2">
                {form.heroImages.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="flex items-start gap-3 rounded-md border border-slate-200 p-2"
                  >
                    <img
                      src={image}
                      alt={`Vista previa carrusel ${index + 1}`}
                      className="h-20 w-32 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">
                        Vista previa {index + 1}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        Imagen cargada en el carrusel
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => removeHeroImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-font">Tipografía</Label>
            <Select
              value={form.fontFamily}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  fontFamily: value as StoreSettings["fontFamily"],
                }))
              }
            >
              <SelectTrigger id="store-font">
                <SelectValue placeholder="Seleccionar tipografía" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-whatsapp">WhatsApp de contacto</Label>
            <Input
              id="store-whatsapp"
              value={form.whatsappNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  whatsappNumber: event.target.value,
                }))
              }
              placeholder="Ej: +54 9 11 1234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-primary">Color principal</Label>
            <Input
              id="store-primary"
              type="color"
              value={form.primaryColor}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  primaryColor: event.target.value,
                }))
              }
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-secondary">Color secundario</Label>
            <Input
              id="store-secondary"
              type="color"
              value={form.secondaryColor}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  secondaryColor: event.target.value,
                }))
              }
              className="h-11"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">
            Estos cambios impactan en encabezado, pie y estilo global.
          </p>
          <Button
            onClick={onSave}
            disabled={saving || uploading || uploadingHero}
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>

        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </CardContent>
    </Card>
  );
}
