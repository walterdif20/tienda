import { useMemo, useState } from "react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import {
  getCategoryChildren,
  getCategoryDisplayName,
  getCategoryTree,
  slugifyCategory,
} from "@/lib/categories";
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

const emptyForm = { name: "", label: "", slug: "", parentId: "" };

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

  const childrenCountByCategory = useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, category) => {
      if (!category.parentId) {
        return acc;
      }

      acc[category.parentId] = (acc[category.parentId] ?? 0) + 1;
      return acc;
    }, {});
  }, [categories]);

  const rootCategories = useMemo(
    () => getCategoryTree(categories).map(({ category }) => category),
    [categories],
  );

  const availableParents = useMemo(
    () =>
      rootCategories.filter((category) => {
        if (!editingCategoryId) {
          return true;
        }

        return category.id !== editingCategoryId;
      }),
    [editingCategoryId, rootCategories],
  );

  const categoryTree = useMemo(() => getCategoryTree(categories), [categories]);

  const startCreate = () => {
    setEditingCategoryId(null);
    setForm(emptyForm);
    setFeedback(null);
  };

  const startEdit = (category: AdminCategory) => {
    setEditingCategoryId(category.id);
    setForm({
      name: category.name,
      label: category.label,
      slug: category.slug,
      parentId: category.parentId ?? "",
    });
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
          label: form.label.trim() || form.name.trim(),
          slug: slugifyCategory(form.slug.trim() || form.name),
          parentId: form.parentId,
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
    const linkedChildren = childrenCountByCategory[category.id] ?? 0;

    if (linkedProducts > 0) {
      setFeedback(
        `No podés eliminar ${category.label} porque tiene ${linkedProducts} producto(s) asociados.`,
      );
      return;
    }

    if (linkedChildren > 0) {
      setFeedback(
        `No podés eliminar ${category.label} porque tiene ${linkedChildren} subcategoría(s) asociadas.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la categoría "${category.label}"? Esta acción no se puede deshacer.`,
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
    <Card>
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
          Creá categorías principales o subcategorías. No se pueden borrar si
          tienen productos o subcategorías asociadas.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <Input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Nombre de la categoría"
          />
          <Input
            value={form.label}
            onChange={(event) =>
              setForm((current) => ({ ...current, label: event.target.value }))
            }
            placeholder="Etiqueta visible"
          />
          <Input
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({ ...current, slug: event.target.value }))
            }
            placeholder="Slug"
          />
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Categoría padre</span>
            <select
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
              value={form.parentId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  parentId: event.target.value,
                }))
              }
            >
              <option value="">Sin categoría padre</option>
              {availableParents.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 self-end">
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
          {categoryTree.map(({ category, subcategories }) => {
            const linkedProducts = productCountByCategory[category.id] ?? 0;
            const linkedChildren = childrenCountByCategory[category.id] ?? 0;

            return (
              <div
                key={category.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {category.label}
                    </p>
                    <p className="text-sm text-slate-500">
                      Nombre interno: {category.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      ID: {category.id} · slug: {category.slug}
                    </p>
                    <p className="text-sm text-slate-500">
                      Productos asociados: {linkedProducts} · Subcategorías:{" "}
                      {linkedChildren}
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
                      {deletingId === category.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </Button>
                  </div>
                </div>

                {subcategories.length > 0 ? (
                  <div className="mt-4 space-y-3 border-l border-slate-200 pl-4">
                    {subcategories.map((subcategory) => {
                      const linkedSubcategoryProducts =
                        productCountByCategory[subcategory.id] ?? 0;

                      return (
                        <div
                          key={subcategory.id}
                          className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {subcategory.label}
                            </p>
                            <p className="text-sm text-slate-500">
                              {getCategoryDisplayName(
                                subcategory.id,
                                categories,
                              )}
                            </p>
                            <p className="text-sm text-slate-500">
                              Nombre interno: {subcategory.name} · ID:{" "}
                              {subcategory.id} · slug: {subcategory.slug}
                            </p>
                            <p className="text-sm text-slate-500">
                              Productos asociados: {linkedSubcategoryProducts}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(subcategory)}
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                void removeCategory(subcategory);
                              }}
                              disabled={deletingId !== null}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              {deletingId === subcategory.id
                                ? "Eliminando..."
                                : "Eliminar"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          {!loading && categories.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay categorías configuradas.
            </p>
          ) : null}
        </div>

        {editingCategoryId ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Editando categoría</p>
            <p className="mt-1">
              {getCategoryDisplayName(editingCategoryId, categories)}
            </p>
            {getCategoryChildren(categories, editingCategoryId).length > 0 ? (
              <p className="mt-2 text-xs text-amber-700">
                Esta categoría ya tiene subcategorías; mantenela como principal
                para evitar más de un nivel jerárquico.
              </p>
            ) : null}
          </div>
        ) : null}

        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </CardContent>
    </Card>
  );
}
