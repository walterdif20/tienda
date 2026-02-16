import { useMemo, useState } from "react";
import { categories } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AdminProduct,
  ProductFormValues,
  SaveProductInput,
  SaveProductResult,
} from "@/components/admin/types";

type ProductManagementProps = {
  products: AdminProduct[];
  loading: boolean;
  onSaveProduct: (input: SaveProductInput) => SaveProductResult;
};

const emptyProductForm = (): ProductFormValues => ({
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "",
  categoryId: categories[0]?.id ?? "",
  badge: "",
  isActive: true,
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

export function ProductManagementSection({
  products,
  loading,
  onSaveProduct,
}: ProductManagementProps) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormValues>(emptyProductForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const visibleProducts = useMemo(() => {
    const needle = searchTerm.toLowerCase().trim();
    if (!needle) return products;
    return products.filter((product) =>
      [product.name, product.slug, product.categoryId]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [products, searchTerm]);

  const handleProductField = (
    field: keyof ProductFormValues,
    value: string,
  ) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const startEditingProduct = (product: AdminProduct) => {
    setEditingProductId(product.id);
    setFeedback(null);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId,
      badge: product.badge ?? "",
      isActive: product.isActive,
    });
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm());
  };

  const saveProduct = () => {
    const normalized: ProductFormValues = {
      ...productForm,
      slug: productForm.slug || slugify(productForm.name),
    };

    const result = onSaveProduct({
      id: editingProductId ?? undefined,
      values: normalized,
    });

    if (!result.ok) {
      setFeedback(result.message ?? "No se pudo guardar el producto.");
      return;
    }

    setFeedback(
      editingProductId ? "Producto actualizado." : "Producto creado.",
    );
    resetProductForm();
  };

  const lowStockCount = products.filter((product) => product.stock <= 3).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Catálogo y stock</h2>
          <p className="mt-1 text-sm text-slate-500">
            Alta/edición de productos, precio y control de inventario.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          Bajo stock: {lowStockCount}
        </span>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            {editingProductId ? "Editar producto" : "Cargar nuevo producto"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            value={productForm.name}
            onChange={(event) => handleProductField("name", event.target.value)}
            placeholder="Nombre"
          />
          <Input
            value={productForm.slug}
            onChange={(event) => handleProductField("slug", event.target.value)}
            placeholder="Slug (opcional)"
          />
          <Input
            value={productForm.price}
            onChange={(event) =>
              handleProductField("price", event.target.value)
            }
            placeholder="Precio"
            type="number"
            min="0"
          />
          <Input
            value={productForm.stock}
            onChange={(event) =>
              handleProductField("stock", event.target.value)
            }
            placeholder="Stock"
            type="number"
            min="0"
          />

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Categoría</span>
            <select
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
              value={productForm.categoryId}
              onChange={(event) =>
                handleProductField("categoryId", event.target.value)
              }
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <Input
            value={productForm.badge}
            onChange={(event) =>
              handleProductField("badge", event.target.value)
            }
            placeholder="Badge (opcional)"
          />

          <div className="md:col-span-2">
            <Input
              value={productForm.description}
              onChange={(event) =>
                handleProductField("description", event.target.value)
              }
              placeholder="Descripción"
            />
          </div>

          <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={productForm.isActive}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Producto activo para la tienda
          </label>

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button onClick={saveProduct}>
              {editingProductId ? "Guardar cambios" : "Agregar producto"}
            </Button>
            {editingProductId && (
              <Button variant="outline" onClick={resetProductForm}>
                Cancelar edición
              </Button>
            )}
          </div>

          {feedback && (
            <p className="md:col-span-2 text-sm text-slate-600">{feedback}</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar por nombre, slug o categoría"
        />
      </div>

      <div className="mt-4 grid gap-3">
        {loading && products.length === 0 && (
          <p className="text-sm text-slate-500">Cargando productos...</p>
        )}

        {visibleProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-500">
                  {formatPrice(product.price)} · Stock: {product.stock} · Cat:{" "}
                  {product.categoryId} ·{" "}
                  {product.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEditingProduct(product)}
              >
                Editar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
