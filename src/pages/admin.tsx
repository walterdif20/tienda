import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { OrderManagementSection } from "@/components/admin/order-management";
import { ProductManagementSection } from "@/components/admin/product-management";
import { StoreSettingsManagementSection } from "@/components/admin/store-settings-management";
import { ReportsManagementSection } from "@/components/admin/reports-management";
import { UserManagementSection } from "@/components/admin/user-management";
import type {
  AdminOrder,
  AdminOrderStatus,
  ManualSaleInput,
  ManualSaleResult,
  SaveProductInput,
  DeleteProductResult,
  SaveProductResult,
  StatusChangeResult,
  UploadProductImageResult,
} from "@/components/admin/types";
import { useProducts } from "@/hooks/use-products";
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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

export function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { products: adminProducts, loading, reload } = useProducts();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "products" | "sales" | "reports" | "settings" | "users"
  >("products");

  const adminSections: Array<{
    id: "products" | "sales" | "reports" | "settings" | "users";
    label: string;
    description: string;
  }> = [
    {
      id: "products",
      label: "Productos",
      description: "Stock, altas y edición de catálogo",
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
      description: "Administradores y bloqueos",
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

    reloadOrders().catch((error) => {
      console.error(error);
    });

    reloadUsers().catch((error) => {
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

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                products={adminProducts}
                loading={loading && adminProducts.length === 0}
                onSaveProduct={onSaveProduct}
                onDeleteProduct={onDeleteProduct}
                onUploadProductImage={onUploadProductImage}
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
              <ReportsManagementSection orders={orders} products={adminProducts} />
            ) : activeSection === "settings" ? (
              <StoreSettingsManagementSection />
            ) : (
              <UserManagementSection
                users={users}
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
