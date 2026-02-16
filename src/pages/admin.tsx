import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { categories } from "@/data/products";
import { useProducts } from "@/hooks/use-products";
import type { Product } from "@/types";

type AdminStatus = "pending" | "paid" | "shipped" | "cancelled";

type AdminOrder = {
  id: string;
  buyer: string;
  total: string;
  status: AdminStatus;
  note: string;
};

type ProductFormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  badge: string;
};

const initialOrders: AdminOrder[] = [
  {
    id: "ORD-1024",
    buyer: "Valentina R.",
    total: "ARS 28.700",
    status: "pending",
    note: "",
  },
  {
    id: "ORD-1025",
    buyer: "Lucía P.",
    total: "ARS 19.200",
    status: "paid",
    note: "Pago validado por transferencia.",
  },
];

const statusLabel: Record<AdminStatus, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  shipped: "Enviada",
  cancelled: "Cancelada",
};

const statusClassName: Record<AdminStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  shipped: "bg-sky-100 text-sky-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const emptyProductForm: ProductFormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "",
  categoryId: categories[0]?.id ?? "",
  badge: "",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

export function AdminPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [activeFilter, setActiveFilter] = useState<"all" | AdminStatus>("all");
  const { products, loading } = useProducts();
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm);

  useEffect(() => {
    if (products.length > 0) {
      setAdminProducts(products);
    }
  }, [products]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return orders;
    return orders.filter((order) => order.status === activeFilter);
  }, [activeFilter, orders]);

  const updateOrder = (id: string, patch: Partial<AdminOrder>) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === id ? { ...order, ...patch } : order,
      ),
    );
  };

  const handleProductField = (field: keyof ProductFormState, value: string) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const startEditingProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId,
      badge: product.badge ?? "",
    });
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
  };

  const saveProduct = () => {
    if (!productForm.name || !productForm.price || !productForm.stock) return;

    const parsedPrice = Number(productForm.price);
    const parsedStock = Number(productForm.stock);

    if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedStock)) return;

    if (editingProductId) {
      setAdminProducts((current) =>
        current.map((product) =>
          product.id === editingProductId
            ? {
                ...product,
                name: productForm.name,
                slug: productForm.slug || slugify(productForm.name),
                description: productForm.description,
                price: parsedPrice,
                stock: parsedStock,
                categoryId: productForm.categoryId,
                badge: productForm.badge || undefined,
              }
            : product,
        ),
      );
      resetProductForm();
      return;
    }

    const newProduct: Product = {
      id: `p-${Date.now()}`,
      name: productForm.name,
      slug: productForm.slug || slugify(productForm.name),
      description: productForm.description,
      price: parsedPrice,
      currency: "ARS",
      categoryId: productForm.categoryId,
      featured: false,
      isActive: true,
      badge: productForm.badge || undefined,
      stock: parsedStock,
      images: [],
    };

    setAdminProducts((current) => [newProduct, ...current]);
    resetProductForm();
  };

  return (
    <section className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Panel admin</h1>
        <p className="mt-2 text-sm text-slate-500">
          Gestioná órdenes pendientes y confirmaciones manuales.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Órdenes</h2>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeFilter === "all" ? "secondary" : "outline"}
            onClick={() => setActiveFilter("all")}
          >
            Todas
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "pending" ? "secondary" : "outline"}
            onClick={() => setActiveFilter("pending")}
          >
            Pendientes
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "paid" ? "secondary" : "outline"}
            onClick={() => setActiveFilter("paid")}
          >
            Pagadas
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "shipped" ? "secondary" : "outline"}
            onClick={() => setActiveFilter("shipped")}
          >
            Enviadas
          </Button>
        </div>

        <div className="mt-8 grid gap-4">
          {filteredOrders.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-slate-500">
                No hay órdenes para este filtro.
              </CardContent>
            </Card>
          )}

          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>{order.id}</CardTitle>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName[order.status]}`}
                >
                  {statusLabel[order.status]}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  <strong>Comprador:</strong> {order.buyer}
                </p>
                <p>
                  <strong>Total:</strong> {order.total}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateOrder(order.id, { status: "paid" })}
                  >
                    Marcar como pagada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateOrder(order.id, { status: "shipped" })}
                  >
                    Marcar como enviada
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateOrder(order.id, { status: "cancelled" })
                    }
                  >
                    Cancelar
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    value={order.note}
                    onChange={(event) =>
                      updateOrder(order.id, { note: event.target.value })
                    }
                    placeholder="Nota admin"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Productos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Podés crear y editar productos directamente desde este panel.
        </p>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              {editingProductId ? "Editar producto" : "Agregar producto"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input
              value={productForm.name}
              onChange={(event) =>
                handleProductField("name", event.target.value)
              }
              placeholder="Nombre"
            />
            <Input
              value={productForm.slug}
              onChange={(event) =>
                handleProductField("slug", event.target.value)
              }
              placeholder="Slug (opcional)"
            />
            <Input
              value={productForm.price}
              onChange={(event) =>
                handleProductField("price", event.target.value)
              }
              placeholder="Precio"
            />
            <Input
              value={productForm.stock}
              onChange={(event) =>
                handleProductField("stock", event.target.value)
              }
              placeholder="Stock"
            />
            <Input
              value={productForm.categoryId}
              onChange={(event) =>
                handleProductField("categoryId", event.target.value)
              }
              placeholder="Categoría"
            />
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
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-3">
          {loading && adminProducts.length === 0 && (
            <p className="text-sm text-slate-500">Cargando productos...</p>
          )}

          {adminProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatPrice(product.price)} · Stock: {product.stock} · Cat:{" "}
                    {product.categoryId}
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

      <ProductManagementSection
        products={products}
        loading={loading && products.length === 0}
        onSaveProduct={onSaveProduct}
      />

      <OrderManagementSection
        orders={orders}
        products={products}
        onUpdateOrderStatus={onUpdateOrderStatus}
        onUpdateOrderNote={onUpdateOrderNote}
        onCreateManualSale={onCreateManualSale}
      />
    </section>
  );
}
