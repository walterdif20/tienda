import {
  Timestamp,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AdminOrder, AdminOrderStatus } from "@/components/admin/types";
import type { Product } from "@/types";

const orderCollection = collection(db, "orders");

export const fetchAdminOrders = async (): Promise<AdminOrder[]> => {
  const snapshot = await getDocs(query(orderCollection, orderBy("createdAt", "desc")));

  const orders = await Promise.all(
    snapshot.docs.map(async (orderDoc) => {
      const data = orderDoc.data();
      const itemsSnapshot = await getDocs(collection(orderDoc.ref, "items"));
      const items = itemsSnapshot.docs.map((itemDoc) => {
        const item = itemDoc.data() as {
          productId: string;
          nameSnapshot?: string;
          priceSnapshot?: number;
          qty: number;
        };

        return {
          productId: item.productId,
          name: item.nameSnapshot ?? "Producto",
          qty: item.qty,
          unitPrice: item.priceSnapshot ?? 0,
        };
      });

      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();

      return {
        id: orderDoc.id,
        buyer: data.buyer?.name ?? "Cliente",
        email: data.buyer?.email ?? "",
        items,
        total: data.total ?? 0,
        status: (data.status as AdminOrderStatus) ?? "pending",
        note: data.payment?.adminNotes ?? "",
        createdAt,
        paymentMethod:
          data.payment?.provider === "bank_transfer"
            ? "bank_transfer"
            : data.payment?.provider === "mercado_pago_link"
              ? "mercado_pago_link"
              : "manual",
      } satisfies AdminOrder;
    }),
  );

  return orders;
};

const discountOrderInventory = async (orderId: string) => {
  const orderRef = doc(db, "orders", orderId);
  const itemsSnapshot = await getDocs(collection(orderRef, "items"));

  await runTransaction(db, async (tx) => {
    const orderSnapshot = await tx.get(orderRef);
    if (!orderSnapshot.exists()) {
      throw new Error("No se encontró la orden.");
    }

    const orderData = orderSnapshot.data();
    if (orderData.stockDiscounted) {
      return;
    }

    for (const itemDoc of itemsSnapshot.docs) {
      const item = itemDoc.data() as { productId: string; qty: number };
      const inventoryRef = doc(db, "inventory", item.productId);
      const inventorySnapshot = await tx.get(inventoryRef);
      const currentStock = Number(inventorySnapshot.data()?.stock ?? 0);

      if (currentStock < item.qty) {
        throw new Error("No hay stock suficiente para avanzar la orden.");
      }

      tx.update(inventoryRef, {
        stock: currentStock - item.qty,
        updatedAt: serverTimestamp(),
      });
    }

    tx.update(orderRef, {
      stockDiscounted: true,
      stockDiscountedAt: serverTimestamp(),
    });
  });
};

export const updateAdminOrderStatus = async (orderId: string, status: AdminOrderStatus) => {
  if (status === "in_progress" || status === "completed") {
    await discountOrderInventory(orderId);
  }

  await updateDoc(doc(db, "orders", orderId), {
    status,
  });
};

export const updateAdminOrderNote = async (orderId: string, note: string) => {
  await updateDoc(doc(db, "orders", orderId), {
    "payment.adminNotes": note,
  });
};

export const createManualSale = async (input: {
  buyer: string;
  email: string;
  product: Product;
  qty: number;
}) => {
  const { buyer, email, product, qty } = input;
  const orderRef = doc(orderCollection);
  const inventoryRef = doc(db, "inventory", product.id);

  await runTransaction(db, async (tx) => {
    const inventorySnapshot = await tx.get(inventoryRef);
    const currentStock = inventorySnapshot.data()?.stock ?? 0;

    if (currentStock < qty) {
      throw new Error("No hay stock suficiente.");
    }

    tx.set(orderRef, {
      userId: null,
      buyer: {
        name: buyer,
        email,
        phone: "",
      },
      delivery: {
        method: "pickup",
      },
      status: "in_progress",
      subtotal: product.price * qty,
      shippingCost: 0,
      total: product.price * qty,
      createdAt: serverTimestamp(),
      publicTrackingToken: `manual-${orderRef.id}`,
      stockDiscounted: true,
      stockDiscountedAt: serverTimestamp(),
      payment: {
        provider: "manual",
        transferConfirmedAt: serverTimestamp(),
        adminNotes: "Venta manual creada desde admin.",
      },
    });

    const itemRef = doc(collection(orderRef, "items"));
    tx.set(itemRef, {
      productId: product.id,
      nameSnapshot: product.name,
      priceSnapshot: product.price,
      qty,
    });

    tx.update(inventoryRef, {
      stock: currentStock - qty,
      updatedAt: serverTimestamp(),
    });
  });

  return orderRef.id;
};
