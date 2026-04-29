import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminCategory, AdminProduct } from "@/components/admin/types";
import type { DiscountRule, DiscountTargetType, DiscountType } from "@/lib/discounts";

type DiscountManagementProps = {
  discounts: DiscountRule[];
  products: AdminProduct[];
  categories: AdminCategory[];
  loading: boolean;
  onCreate: (input: Omit<DiscountRule, "id">) => Promise<{ ok: boolean; message?: string }>;
  onToggle: (id: string, isActive: boolean) => Promise<{ ok: boolean; message?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>;
};

export function DiscountManagementSection({ discounts, products, categories, loading, onCreate, onToggle, onDelete }: DiscountManagementProps) {
  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState<DiscountTargetType>("product");
  const [targetId, setTargetId] = useState("");
  const [type, setType] = useState<DiscountType>("percentage");
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const targetOptions = useMemo(
    () => (targetType === "product" ? products.map((item) => ({ id: item.id, label: item.name })) : categories.map((item) => ({ id: item.id, label: item.label }))),
    [categories, products, targetType],
  );

  const submit = async () => {
    const numericValue = Number(value);
    const response = await onCreate({ name, targetType, targetId, type, value: numericValue, isActive: true });
    setFeedback(response.message ?? (response.ok ? "Descuento creado." : "No se pudo crear."));
    if (response.ok) {
      setName("");
      setTargetId("");
      setValue("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear descuento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Nombre interno" value={name} onChange={(event) => setName(event.target.value)} />
          <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={targetType} onChange={(event) => { setTargetType(event.target.value as DiscountTargetType); setTargetId(""); }}>
            <option value="product">Producto</option>
            <option value="category">Categoría</option>
          </select>
          <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
            <option value="">Seleccionar objetivo</option>
            {targetOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <div className="flex gap-2">
            <select className="h-10 w-40 rounded-md border border-slate-200 px-3 text-sm" value={type} onChange={(event) => setType(event.target.value as DiscountType)}>
              <option value="percentage">Porcentaje %</option>
              <option value="fixed">Monto fijo $</option>
            </select>
            <Input placeholder="Valor" value={value} onChange={(event) => setValue(event.target.value)} type="number" min="0" />
          </div>
          <Button onClick={() => void submit()} disabled={loading}>Guardar descuento</Button>
          {feedback ? <p className="text-sm text-slate-500">{feedback}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Descuentos activos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {discounts.map((discount) => (
            <div key={discount.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium">{discount.name}</p>
                <p className="text-xs text-slate-500">{discount.targetType === "product" ? "Producto" : "Categoría"}: {discount.targetId} · {discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void onToggle(discount.id, !discount.isActive)}>{discount.isActive ? "Desactivar" : "Activar"}</Button>
                <Button variant="outline" size="sm" onClick={() => void onDelete(discount.id)}>Eliminar</Button>
              </div>
            </div>
          ))}
          {discounts.length === 0 ? <p className="text-sm text-slate-500">No hay descuentos.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
