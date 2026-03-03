import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { categories } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AdminProduct,
  ProductFormValues,
  DeleteProductResult,
  SaveProductInput,
  SaveProductResult,
  UploadProductImageResult,
} from "@/components/admin/types";

type ProductManagementProps = {
  products: AdminProduct[];
  loading: boolean;
  onSaveProduct: (input: SaveProductInput) => SaveProductResult;
  onDeleteProduct: (productId: string) => DeleteProductResult;
  onUploadProductImage: (file: File) => UploadProductImageResult;
};

const emptyProductForm = (): ProductFormValues => ({
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "",
  categoryId: categories[0]?.id ?? "",
  badge: "",
  primaryImageUrl: "",
  primaryImageAlt: "",
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
  onDeleteProduct,
  onUploadProductImage,
}: ProductManagementProps) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormValues>(emptyProductForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      primaryImageUrl: product.images[0]?.url ?? "",
      primaryImageAlt: product.images[0]?.alt ?? "",
      isActive: product.isActive,
    });
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm());
  };

  const onSelectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setUploadingImage(true);
    setFeedback("Subiendo imagen...");

    const uploadResult = await onUploadProductImage(selectedFile);

    if (!uploadResult.ok || !uploadResult.url) {
      setFeedback(uploadResult.message ?? "No se pudo subir la imagen.");
      setUploadingImage(false);
      event.target.value = "";
      return;
    }

    setProductForm((current) => ({
      ...current,
      primaryImageUrl: uploadResult.url ?? "",
      primaryImageAlt:
        current.primaryImageAlt || uploadResult.suggestedAlt || current.name,
    }));
    setFeedback("Imagen cargada correctamente.");
    setUploadingImage(false);
    event.target.value = "";
  };

  const saveProduct = async () => {
    if (savingProduct) {
      return;
    }

    setSavingProduct(true);
    const normalized: ProductFormValues = {
      ...productForm,
      slug: productForm.slug || slugify(productForm.name),
    };

    try {
      const result = await onSaveProduct({
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
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: AdminProduct) => {
    if (deletingProductId) {
      return;
    }

    const shouldDelete = window.confirm(
      `¿Seguro que querés eliminar "${product.name}"? Esta acción no se puede deshacer.`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingProductId(product.id);
    const result = await onDeleteProduct(product.id);
    if (!result.ok) {
      setFeedback(result.message ?? "No se pudo eliminar el producto.");
      setDeletingProductId(null);
      return;
    }

    if (editingProductId === product.id) {
      resetProductForm();
    }

    setFeedback(result.message ?? "Producto eliminado.");
    setDeletingProductId(null);
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

          <div className="rounded-md border border-slate-200 p-3 md:col-span-2">
            <p className="text-sm font-medium text-slate-700">Imagen principal</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onSelectImage}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? "Subiendo..." : "Cargar imagen"}
              </Button>

              {productForm.primaryImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    handleProductField("primaryImageUrl", "");
                    handleProductField("primaryImageAlt", "");
                  }}
                >
                  Quitar imagen
                </Button>
              )}
            </div>

            <Input
              value={productForm.primaryImageUrl}
              onChange={(event) =>
                handleProductField("primaryImageUrl", event.target.value)
              }
              placeholder="URL de imagen generada automáticamente"
              readOnly
              className="mt-3"
            />
          </div>

          <Input
            value={productForm.primaryImageAlt}
            onChange={(event) =>
              handleProductField("primaryImageAlt", event.target.value)
            }
            placeholder="Texto alternativo imagen (opcional)"
            className="md:col-span-2"
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
            <Button onClick={saveProduct} disabled={uploadingImage || savingProduct}>
              {savingProduct
                ? "Guardando..."
                : editingProductId
                  ? "Guardar cambios"
                  : "Agregar producto"}
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
                  {product.categoryId} · {" "}
                  {product.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEditingProduct(product)}
                  disabled={deletingProductId === product.id}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    handleDeleteProduct(product).catch((error) => {
                      console.error(error);
                      setFeedback("No se pudo eliminar el producto.");
                      setDeletingProductId(null);
                    });
                  }}
                  disabled={deletingProductId !== null}
                >
                  {deletingProductId === product.id ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
