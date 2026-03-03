import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { OrderManagementSection } from "@/components/admin/order-management";
import { ProductManagementSection } from "@/components/admin/product-management";
import { StoreSettingsManagementSection } from "@/components/admin/store-settings-management";
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
    "products" | "sales" | "settings" | "users"
  >("products");

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

    if (values.primaryImageUrl.trim()) {
      try {
        new URL(values.primaryImageUrl.trim());
      } catch {
        return { ok: false, message: "La URL de la imagen no es válida." };
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
          primaryImageUrl: values.primaryImageUrl.trim() || undefined,
          primaryImageAlt: values.primaryImageAlt.trim() || undefined,
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
        primaryImageUrl: values.primaryImageUrl.trim() || undefined,
        primaryImageAlt: values.primaryImageAlt.trim() || undefined,
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

  return (
    <section className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Panel admin</h1>
        <p className="mt-2 text-sm text-slate-500">
          Elegí un área para trabajar productos, ventas, configuración o
          cuentas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeSection === "products"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          onClick={() => setActiveSection("products")}
        >
          Gestión de productos y stock
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeSection === "sales"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          onClick={() => setActiveSection("sales")}
        >
          Gestión de órdenes y ventas
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeSection === "settings"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          onClick={() => setActiveSection("settings")}
        >
          Configuración de la tienda
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeSection === "users"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          onClick={() => setActiveSection("users")}
        >
          Cuentas
        </button>
      </div>

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
          orders={orders}
          products={adminProducts}
          onUpdateOrderStatus={onUpdateOrderStatus}
          onUpdateOrderNote={onUpdateOrderNote}
          onCreateManualSale={onCreateManualSale}
        />
      ) : activeSection === "settings" ? (
        <StoreSettingsManagementSection />
      ) : (
        <UserManagementSection
          users={users}
          loading={loadingUsers}
          onReload={reloadUsers}
          onMakeAdmin={onMakeUserAdmin}
        />
      )}
    </section>
  );
}
