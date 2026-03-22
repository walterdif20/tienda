import { useMemo, useState } from "react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { slugifyCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AdminCategory,
  AdminProduct,
  DeleteCategoryResult,
  SaveCategoryInput,
  SaveCategoryResult,
} from "@/components/admin/types";

const emptyForm = { name: "", slug: "" };

type CategoryManagementSectionProps = {
  categories: AdminCategory[];
  products: AdminProduct[];
  loading: boolean;
  onReload: () => void;
  onSaveCategory: (input: SaveCategoryInput) => SaveCategoryResult;
  onDeleteCategory: (categoryId: string) => DeleteCategoryResult;
};

export function CategoryManagementSection({
  categories,
  products,
  loading,
  onReload,
  onSaveCategory,
  onDeleteCategory,
}: CategoryManagementSectionProps) {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const productCountByCategory = useMemo(() => {
    return products.reduce<Record<string, number>>((acc, product) => {
      acc[product.categoryId] = (acc[product.categoryId] ?? 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const startCreate = () => {
    setEditingCategoryId(null);
    setForm(emptyForm);
    setFeedback(null);
  };

  const startEdit = (category: AdminCategory) => {
    setEditingCategoryId(category.id);
    setForm({ name: category.name, slug: category.slug });
    setFeedback(null);
  };

  const saveCategory = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const result = await onSaveCategory({
        id: editingCategoryId ?? undefined,
        values: {
          name: form.name.trim(),
          slug: slugifyCategory(form.slug.trim() || form.name),
        },
      });

      if (!result.ok) {
        setFeedback(result.message ?? "No se pudo guardar la categoría.");
        return;
      }

      startCreate();
      setFeedback(result.message ?? "Categoría guardada.");
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category: AdminCategory) => {
    const linkedProducts = productCountByCategory[category.id] ?? 0;

    if (linkedProducts > 0) {
      setFeedback(
        `No podés eliminar ${category.name} porque tiene ${linkedProducts} producto(s) asociados.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);
    setFeedback(null);

    try {
      const result = await onDeleteCategory(category.id);
      if (editingCategoryId === category.id) {
        startCreate();
      }
      setFeedback(result.message ?? "Categoría eliminada.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Gestor de categorías</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onReload}
            disabled={loading}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Recargar
          </Button>
        </CardTitle>
        <p className="text-sm text-slate-500">
          Creá, editá y limpiá categorías del catálogo. No se pueden borrar si
          tienen productos asociados.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Nombre de la categoría"
          />
          <Input
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({ ...current, slug: event.target.value }))
            }
            placeholder="Slug"
          />
          <div className="flex gap-2">
            <Button onClick={saveCategory} disabled={saving}>
              {saving
                ? "Guardando..."
                : editingCategoryId
                  ? "Guardar"
                  : "Crear"}
            </Button>
            <Button variant="outline" onClick={startCreate}>
              Limpiar
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          {categories.map((category) => {
            const linkedProducts = productCountByCategory[category.id] ?? 0;

            return (
              <div
                key={category.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{category.name}</p>
                  <p className="text-sm text-slate-500">
                    ID: {category.id} · slug: {category.slug}
                  </p>
                  <p className="text-sm text-slate-500">
                    Productos asociados: {linkedProducts}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(category)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void removeCategory(category);
                    }}
                    disabled={deletingId !== null}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {deletingId === category.id ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </div>
            );
          })}

          {!loading && categories.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay categorías configuradas.
            </p>
          ) : null}
        </div>

        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </CardContent>
    </Card>
  );
}
