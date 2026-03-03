import { useEffect, useState } from "react";
import { OrderManagementSection } from "@/components/admin/order-management";
import { ProductManagementSection } from "@/components/admin/product-management";
import type {
  AdminOrder,
  AdminOrderStatus,
  ManualSaleInput,
  ManualSaleResult,
  SaveProductInput,
  SaveProductResult,
  StatusChangeResult,
} from "@/components/admin/types";
import { useProducts } from "@/hooks/use-products";
import {
  createManualSale,
  fetchAdminOrders,
  updateAdminOrderNote,
  updateAdminOrderStatus,
} from "@/lib/admin-orders";
import { createProduct, updateProduct } from "@/lib/products";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

export function AdminPage() {
  const { products: adminProducts, loading, reload } = useProducts();
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const reloadOrders = async () => {
    const remoteOrders = await fetchAdminOrders();
    setOrders(remoteOrders);
  };

  useEffect(() => {
    reloadOrders().catch((error) => {
      console.error(error);
    });
  }, []);

  const onSaveProduct = async ({ id, values }: SaveProductInput): SaveProductResult => {
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
      });
      reload();
      return { ok: true, message: "Producto creado con éxito." };
    } catch (error) {
      console.error(error);
      return { ok: false, message: "No se pudo guardar en Firestore." };
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
      current.map((order) => (order.id === orderId ? { ...order, note } : order)),
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

  return (
    <section className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Panel admin</h1>
        <p className="mt-2 text-sm text-slate-500">
          Gestioná catálogo, stock, órdenes y ventas manuales.
        </p>
      </div>

      <ProductManagementSection
        products={adminProducts}
        loading={loading && adminProducts.length === 0}
        onSaveProduct={onSaveProduct}
      />

      <OrderManagementSection
        orders={orders}
        products={adminProducts}
        onUpdateOrderStatus={onUpdateOrderStatus}
        onUpdateOrderNote={onUpdateOrderNote}
        onCreateManualSale={onCreateManualSale}
      />
    </section>
  );
}
