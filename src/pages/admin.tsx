import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CategoryManagementSection } from "@/components/admin/category-management";
import { OrderManagementSection } from "@/components/admin/order-management";
import { ProductManagementSection } from "@/components/admin/product-management";
import { ReportsManagementSection } from "@/components/admin/reports-management";
import { StoreSettingsManagementSection } from "@/components/admin/store-settings-management";
import { UserManagementSection } from "@/components/admin/user-management";
import type {
  AdminOrder,
  AdminOrderStatus,
  DeleteCategoryResult,
  DeleteProductResult,
  ManualSaleInput,
  ManualSaleResult,
  SaveCategoryInput,
  SaveCategoryResult,
  SaveProductInput,
  SaveProductResult,
  StatusChangeResult,
  UploadProductImageResult,
} from "@/components/admin/types";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import {
  createCategory,
  deleteCategory,
  getCategoryChildren,
  slugifyCategory,
  updateCategory,
} from "@/lib/categories";
import {
  fetchAdminUsers,
  makeUserAdmin,
  setUserBlockedStatus,
  type AdminUser,
} from "@/lib/admin-users";
import {
  createManualSale,
  fetchAdminOrders,
  updateAdminOrderNote,
  updateAdminOrderStatus,
} from "@/lib/admin-orders";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  uploadProductImageFile,
} from "@/lib/products";
import { useAuth } from "@/providers/auth-provider";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

export function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { products: adminProducts, loading, reload } = useProducts();
  const {
    categories,
    loading: categoriesLoading,
    reload: reloadCategories,
  } = useCategories();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "products" | "categories" | "sales" | "reports" | "settings" | "users"
  >("products");

  const adminSections: Array<{
    id:
      | "products"
      | "categories"
      | "sales"
      | "reports"
      | "settings"
      | "users";
    label: string;
    description: string;
  }> = [
    {
      id: "products",
      label: "Productos",
      description: "Stock, altas y edición de catálogo",
    },
    {
      id: "categories",
      label: "Categorías",
      description: "Estructura del catálogo y subcategorías",
    },
    {
      id: "sales",
      label: "Órdenes y ventas",
      description: "Seguimiento de pedidos activos",
    },
    {
      id: "reports",
      label: "Reportes",
      description: "Métricas de rendimiento",
    },
    {
      id: "settings",
      label: "Configuración",
      description: "Datos de la tienda y operación",
    },
    {
      id: "users",
      label: "Cuentas",
      description: "Administradores, bloqueos y puntos",
    },
  ];

  const reloadOrders = async () => {
    const remoteOrders = await fetchAdminOrders();
    setOrders(remoteOrders);
  };

  const reloadUsers = async () => {
    setLoadingUsers(true);
    try {
      const remoteUsers = await fetchAdminUsers();
      setUsers(remoteUsers);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    void reloadOrders().catch((error) => {
      console.error(error);
    });

    void reloadUsers().catch((error) => {
      console.error(error);
    });
  }, [isAdmin]);

  if (authLoading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-slate-500">Validando permisos...</p>
      </section>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const visibleOrders = orders.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled",
  );
  const onSaveProduct = async ({
    id,
    values,
  }: SaveProductInput): SaveProductResult => {
    if (!values.name.trim()) {
      return { ok: false, message: "El nombre es obligatorio." };
    }

    if (!values.categoryId.trim()) {
      return { ok: false, message: "Seleccioná una categoría." };
    }

    const price = Number(values.price);
    const stock = Number(values.stock);

    if (!Number.isFinite(price) || price < 0) {
      return { ok: false, message: "El precio es inválido." };
    }

    if (!Number.isFinite(stock) || stock < 0) {
      return { ok: false, message: "El stock es inválido." };
    }

    for (const image of values.images) {
      try {
        new URL(image.url.trim());
      } catch {
        return { ok: false, message: "Una URL de imagen no es válida." };
      }
    }

    try {
      if (id) {
        await updateProduct(id, {
          name: values.name.trim(),
          slug: values.slug || slugify(values.name),
          description: values.description,
          price,
          currency: "ARS",
          categoryId: values.categoryId,
          collectionIds: values.collectionIds,
          badge: values.badge || undefined,
          isActive: values.isActive,
          stock,
          images: values.images.map((image) => ({
            url: image.url.trim(),
            alt: image.alt.trim() || values.name.trim(),
          })),
        });
        reload();
        return { ok: true, message: "Producto actualizado con éxito." };
      }

      await createProduct({
        name: values.name.trim(),
        slug: values.slug || slugify(values.name),
        description: values.description,
        price,
        currency: "ARS",
        categoryId: values.categoryId,
        collectionIds: values.collectionIds,
        featured: false,
        isActive: values.isActive,
        badge: values.badge || undefined,
        stock,
        images: values.images.map((image) => ({
          url: image.url.trim(),
          alt: image.alt.trim() || values.name.trim(),
        })),
      });
      reload();
      return { ok: true, message: "Producto creado con éxito." };
    } catch (error) {
      console.error(error);
      return { ok: false, message: "No se pudo guardar en Firestore." };
    }
  };

  const onSaveCategory = async ({
    id,
    values,
  }: SaveCategoryInput): SaveCategoryResult => {
    if (!values.name.trim()) {
      return { ok: false, message: "El nombre es obligatorio." };
    }

    if (!values.label.trim()) {
      return { ok: false, message: "La etiqueta visible es obligatoria." };
    }

    const normalizedSlug = slugifyCategory(values.slug || values.name);
    const normalizedParentId = values.parentId.trim() || null;

    if (!normalizedSlug) {
      return { ok: false, message: "El slug es inválido." };
    }

    if (normalizedParentId && normalizedParentId === id) {
      return {
        ok: false,
        message: "Una categoría no puede ser subcategoría de sí misma.",
      };
    }

    const duplicated = categories.find(
      (category) =>
        (category.slug === normalizedSlug || category.id === normalizedSlug) &&
        category.id !== id,
    );

    if (duplicated) {
      return { ok: false, message: "Ya existe una categoría con ese slug." };
    }

    if (normalizedParentId) {
      const parentCategory = categories.find(
        (category) => category.id === normalizedParentId,
      );

      if (!parentCategory) {
        return { ok: false, message: "La categoría padre no existe." };
      }

      if (parentCategory.parentId) {
        return {
          ok: false,
          message: "Solo se permite un nivel de subcategorías.",
        };
      }
    }

    if (
      id &&
      normalizedParentId &&
      getCategoryChildren(categories, id).length > 0
    ) {
      return {
        ok: false,
        message:
          "Esta categoría ya tiene subcategorías. Quitalas o mantenela como principal.",
      };
    }

    try {
      if (id) {
        await updateCategory(id, {
          name: values.name,
          label: values.label,
          slug: normalizedSlug,
          parentId: normalizedParentId,
        });
        reloadCategories();
        return { ok: true, message: "Categoría actualizada." };
      }

      await createCategory({
        id: normalizedSlug,
        name: values.name,
        label: values.label,
        slug: normalizedSlug,
        parentId: normalizedParentId,
      });
      reloadCategories();
      return { ok: true, message: "Categoría creada." };
    } catch (error) {
      console.error(error);
      return { ok: false, message: "No se pudo guardar la categoría." };
    }
  };

  const onDeleteCategory = async (categoryId: string): DeleteCategoryResult => {
    const linkedProducts = adminProducts.filter(
      (product) => product.categoryId === categoryId,
    ).length;
    const linkedSubcategories = categories.filter(
      (category) => category.parentId === categoryId,
    ).length;

    if (linkedProducts > 0) {
      return {
        ok: false,
        message: "No se puede eliminar una categoría con productos asociados.",
      };
    }

    if (linkedSubcategories > 0) {
      return {
        ok: false,
        message:
          "No se puede eliminar una categoría con subcategorías asociadas.",
      };
    }

    try {
      await deleteCategory(categoryId);
      reloadCategories();
      return { ok: true, message: "Categoría eliminada con éxito." };
    } catch (error) {
      console.error(error);
      return { ok: false, message: "No se pudo eliminar la categoría." };
    }
  };

  const onUploadProductImage = async (file: File): UploadProductImageResult => {
    if (!file.type.startsWith("image/")) {
      return {
        ok: false,
        message: "El archivo seleccionado no es una imagen.",
      };
    }

    try {
      const uploaded = await uploadProductImageFile(file);
      return {
        ok: true,
        url: uploaded.url,
        suggestedAlt: uploaded.suggestedAlt,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        message: "No se pudo subir la imagen a Firebase Storage.",
      };
    }
  };

  const onDeleteProduct = async (productId: string): DeleteProductResult => {
    try {
      await deleteProduct(productId);
      reload();
      return { ok: true, message: "Producto eliminado con éxito." };
    } catch (error) {
      console.error(error);
      return { ok: false, message: "No se pudo eliminar el producto." };
    }
  };

  const onUpdateOrderStatus = async (
    orderId: string,
    status: AdminOrderStatus,
  ): StatusChangeResult => {
    const existing = orders.find((order) => order.id === orderId);
    if (!existing) {
      return { ok: false, message: "No se encontró la orden." };
    }

    try {
      await updateAdminOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
      await reloadUsers();
      return { ok: true, message: `Estado actualizado a ${status}.` };
    } catch (error) {
      console.error(error);
      return { ok: false, message: "No se pudo actualizar el estado." };
    }
  };

  const onUpdateOrderNote = async (orderId: string, note: string) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, note } : order,
      ),
    );

    try {
      await updateAdminOrderNote(orderId, note);
    } catch (error) {
      console.error(error);
    }
  };

  const onCreateManualSale = async ({
    buyer,
    email,
    productId,
    qty,
  }: ManualSaleInput): ManualSaleResult => {
    if (!buyer.trim() || !email.trim()) {
      return { ok: false, message: "Completá cliente y email." };
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return { ok: false, message: "Cantidad inválida." };
    }

    const product = adminProducts.find((item) => item.id === productId);

    if (!product) {
      return { ok: false, message: "Producto no encontrado." };
    }

    if (product.stock < qty) {
      return { ok: false, message: "No hay stock suficiente." };
    }

    try {
      await createManualSale({
        buyer: buyer.trim(),
        email: email.trim(),
        product,
        qty,
      });
      await Promise.all([reloadOrders(), Promise.resolve(reload())]);
      return { ok: true, message: "Venta manual registrada." };
    } catch (error) {
      console.error(error);
      return { ok: false, message: "No se pudo registrar la venta." };
    }
  };

  const onMakeUserAdmin = async (uid: string) => {
    await makeUserAdmin(uid);
    await reloadUsers();
  };

  const onToggleUserBlocked = async (uid: string, blocked: boolean) => {
    await setUserBlockedStatus(uid, blocked);
    await reloadUsers();
  };

  const activeSectionInfo =
    adminSections.find((section) => section.id === activeSection) ??
    adminSections[0];

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:py-10">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <h1 className="text-3xl font-semibold">Panel admin</h1>
        <p className="mt-2 text-sm text-slate-500">
          Organización más clara por áreas para acelerar tareas diarias.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Órdenes activas
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {visibleOrders.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Productos cargados
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {adminProducts.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Categorías activas
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {categories.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Cuentas registradas
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {users.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Navegación
          </p>
          <nav className="mt-3 space-y-1">
            {adminSections.map((section) => {
              const isActive = section.id === activeSection;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-sm font-medium">{section.label}</p>
                  <p
                    className={`text-xs ${
                      isActive ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {section.description}
                  </p>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sección activa
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {activeSectionInfo.label}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeSectionInfo.description}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {activeSection === "products" ? (
              <ProductManagementSection
                categories={categories}
                products={adminProducts}
                loading={loading && adminProducts.length === 0}
                onSaveProduct={onSaveProduct}
                onDeleteProduct={onDeleteProduct}
                onUploadProductImage={onUploadProductImage}
              />
            ) : activeSection === "categories" ? (
              <CategoryManagementSection
                categories={categories}
                products={adminProducts}
                loading={categoriesLoading}
                onReload={reloadCategories}
                onSaveCategory={onSaveCategory}
                onDeleteCategory={onDeleteCategory}
              />
            ) : activeSection === "sales" ? (
              <OrderManagementSection
                orders={visibleOrders}
                products={adminProducts}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onUpdateOrderNote={onUpdateOrderNote}
                onCreateManualSale={onCreateManualSale}
              />
            ) : activeSection === "reports" ? (
              <ReportsManagementSection
                orders={orders}
                products={adminProducts}
              />
            ) : activeSection === "settings" ? (
              <StoreSettingsManagementSection />
            ) : (
              <UserManagementSection
                users={users}
                products={adminProducts}
                loading={loadingUsers}
                onReload={reloadUsers}
                onMakeAdmin={onMakeUserAdmin}
                onToggleBlocked={onToggleUserBlocked}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
