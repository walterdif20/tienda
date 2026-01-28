import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/data/products";
import { useAuth } from "@/providers/auth-provider";
import { createProduct, updateProduct } from "@/lib/products";
import { useProducts } from "@/hooks/use-products";
import type { Product, ProductInput } from "@/types";

const emptyForm: ProductInput = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  currency: "ARS",
  categoryId: "bracelets",
  featured: false,
  isActive: true,
  badge: "",
  primaryImageUrl: "",
  primaryImageAlt: "",
  stock: 0,
};

export function AdminPage() {
  const { user, isAdmin, loading, signIn, signInWithGoogle, signOutUser } = useAuth();
  const { products, reload } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isEditing = Boolean(selectedProduct);

  const resetForm = () => {
    setSelectedProduct(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    try {
      if (isEditing && selectedProduct) {
        await updateProduct(selectedProduct.id, form);
        setStatus("Producto actualizado");
      } else {
        await createProduct(form);
        setStatus("Producto creado");
      }
      reload();
      resetForm();
    } catch (error) {
      console.error(error);
      setStatus("No pudimos guardar el producto");
    }
  };

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      currency: product.currency,
      categoryId: product.categoryId,
      featured: product.featured ?? false,
      isActive: product.isActive,
      badge: product.badge ?? "",
      primaryImageUrl: product.images[0]?.url ?? "",
      primaryImageAlt: product.images[0]?.alt ?? "",
      stock: product.stock,
    });
  };

  const categoryOptions = useMemo(
    () => categories.filter((category) => !["new", "featured"].includes(category.id)),
    []
  );

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm text-slate-500">Cargando sesión...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Panel admin</h1>
        <p className="mt-2 text-sm text-slate-500">
          Ingresá con tu cuenta para gestionar productos y órdenes.
        </p>
        <Card className="mt-6">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => signIn(email, password)}>Ingresar</Button>
              <Button variant="outline" onClick={signInWithGoogle}>
                Ingresar con Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Panel admin</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tu cuenta no tiene permisos de administrador.
        </p>
        <Button className="mt-4" onClick={signOutUser}>
          Cerrar sesión
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Panel admin</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gestioná productos, stock e imágenes desde Firestore.
          </p>
        </div>
        <Button variant="outline" onClick={signOutUser}>
          Cerrar sesión
        </Button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.slug}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleSelect(product)}>
                  Editar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Editar producto" : "Nuevo producto"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(event) => setForm({ ...form, slug: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(event) =>
                      setForm({ ...form, stock: Number(event.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => setForm({ ...form, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Imagen principal</Label>
                  <Input
                    value={form.primaryImageUrl}
                    onChange={(event) =>
                      setForm({ ...form, primaryImageUrl: event.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alt imagen</Label>
                  <Input
                    value={form.primaryImageAlt}
                    onChange={(event) =>
                      setForm({ ...form, primaryImageAlt: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Badge</Label>
                  <Input
                    value={form.badge}
                    onChange={(event) => setForm({ ...form, badge: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Activo</Label>
                  <Select
                    value={form.isActive ? "true" : "false"}
                    onValueChange={(value) =>
                      setForm({ ...form, isActive: value === "true" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">{isEditing ? "Guardar cambios" : "Crear"}</Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
              {status && <p className="text-xs text-slate-500">{status}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
