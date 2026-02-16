import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { OrderManagementSection } from "@/components/admin/order-management";
import { ProductManagementSection } from "@/components/admin/product-management";
import type {
  AdminOrder,
  AdminOrderStatus,
  AdminProduct,
  ManualSaleInput,
  ManualSaleResult,
  ProductFormValues,
  SaveProductInput,
  SaveProductResult,
  StatusChangeResult,
} from "@/components/admin/types";

const ADMIN_PRODUCTS_KEY = "tienda.admin.products.v1";
const ADMIN_ORDERS_KEY = "tienda.admin.orders.v1";

function buildDefaultOrders(products: AdminProduct[]): AdminOrder[] {
  const first = products[0];
  const second = products[1] ?? products[0];

  if (!first) return [];

  return [
    {
      id: `ORD-${Date.now().toString().slice(-5)}`,
      buyer: "Valentina R.",
      email: "valentina@example.com",
      items: [
        {
          productId: first.id,
          name: first.name,
          qty: 1,
          unitPrice: first.price,
        },
      ],
      total: first.price,
      status: "pending",
      note: "",
      createdAt: new Date().toISOString(),
      paymentMethod: "manual",
    },
    {
      id: `ORD-${(Date.now() - 1).toString().slice(-5)}`,
      buyer: "Lucía P.",
      email: "lucia@example.com",
      items: [
        {
          productId: second.id,
          name: second.name,
          qty: 2,
          unitPrice: second.price,
        },
      ],
      total: second.price * 2,
      status: "paid",
      note: "Pago validado por transferencia.",
      createdAt: new Date().toISOString(),
      paymentMethod: "manual",
    },
  ];
}

function parseProductValues(values: ProductFormValues) {
  const price = Number(values.price);
  const stock = Number(values.stock);

  if (!values.name.trim()) return { ok: false, message: "Nombre requerido." };
  if (!values.slug.trim()) return { ok: false, message: "Slug requerido." };
  if (!Number.isFinite(price) || price < 0)
    return { ok: false, message: "Precio inválido." };
  if (!Number.isFinite(stock) || stock < 0)
    return { ok: false, message: "Stock inválido." };

  return {
    ok: true,
    payload: {
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description.trim(),
      price,
      stock,
      categoryId: values.categoryId,
      badge: values.badge.trim(),
      isActive: values.isActive,
    },
  } as const;
}

export function AdminPage() {
  const { products: remoteProducts, loading } = useProducts();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  useEffect(() => {
    if (remoteProducts.length === 0) return;

    const storedProducts = window.localStorage.getItem(ADMIN_PRODUCTS_KEY);
    const storedOrders = window.localStorage.getItem(ADMIN_ORDERS_KEY);

    if (storedProducts) {
      setProducts(JSON.parse(storedProducts) as AdminProduct[]);
    } else {
      setProducts(remoteProducts);
    }

    if (storedOrders) {
      setOrders(JSON.parse(storedOrders) as AdminOrder[]);
    } else {
      setOrders(buildDefaultOrders(remoteProducts));
    }
  }, [remoteProducts]);

  useEffect(() => {
    if (products.length > 0) {
      window.localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (orders.length > 0) {
      window.localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
    }
  }, [orders]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const onSaveProduct = ({
    id,
    values,
  }: SaveProductInput): SaveProductResult => {
    const parsed = parseProductValues(values);
    if (!parsed.ok) return { ok: false, message: parsed.message };

    if (id) {
      setProducts((current) =>
        current.map((product) =>
          product.id === id
            ? {
                ...product,
                ...parsed.payload,
                badge: parsed.payload.badge || undefined,
              }
            : product,
        ),
      );
      return { ok: true, message: "Producto actualizado correctamente." };
    }

    const newProduct: AdminProduct = {
      id: `p-${Date.now()}`,
      currency: "ARS",
      featured: false,
      images: [],
      ...parsed.payload,
      badge: parsed.payload.badge || undefined,
    };

    setProducts((current) => [newProduct, ...current]);
    return { ok: true, message: "Producto creado correctamente." };
  };

  const onUpdateOrderStatus = (
    orderId: string,
    status: AdminOrderStatus,
  ): StatusChangeResult => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return { ok: false, message: "Orden no encontrada." };

    if (order.status === status) {
      return { ok: true, message: "La orden ya tiene ese estado." };
    }

    if (status === "paid" && order.status === "pending") {
      const hasInsufficientStock = order.items.some((item) => {
        const product = productsById.get(item.productId);
        if (!product) return true;
        return product.stock < item.qty;
      });

      if (hasInsufficientStock) {
        return {
          ok: false,
          message: "Stock insuficiente para confirmar esta venta.",
        };
      }

      setProducts((current) =>
        current.map((product) => {
          const soldItem = order.items.find(
            (item) => item.productId === product.id,
          );
          if (!soldItem) return product;
          return { ...product, stock: product.stock - soldItem.qty };
        }),
      );
    }

    setOrders((current) =>
      current.map((item) => (item.id === orderId ? { ...item, status } : item)),
    );

    return { ok: true, message: `Orden ${orderId} marcada como ${status}.` };
  };

  const onUpdateOrderNote = (orderId: string, note: string) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, note } : order,
      ),
    );
  };

  const onCreateManualSale = (input: ManualSaleInput): ManualSaleResult => {
    if (!input.buyer.trim() || !input.email.trim()) {
      return { ok: false, message: "Cliente y email son obligatorios." };
    }

    if (!Number.isFinite(input.qty) || input.qty < 1) {
      return { ok: false, message: "Cantidad inválida." };
    }

    const product = productsById.get(input.productId);
    if (!product) return { ok: false, message: "Producto no encontrado." };

    const newOrder: AdminOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      buyer: input.buyer.trim(),
      email: input.email.trim(),
      items: [
        {
          productId: product.id,
          name: product.name,
          qty: input.qty,
          unitPrice: product.price,
        },
      ],
      total: product.price * input.qty,
      status: "pending",
      note: "Venta manual creada desde panel admin.",
      createdAt: new Date().toISOString(),
      paymentMethod: "manual",
    };

    setOrders((current) => [newOrder, ...current]);
    return { ok: true, message: `Venta ${newOrder.id} creada.` };
  };

  return (
    <section className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Panel admin profesional</h1>
        <p className="mt-2 text-sm text-slate-500">
          Gestión integral de catálogo, precios, stock y ventas en una sola
          herramienta operativa.
        </p>
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
