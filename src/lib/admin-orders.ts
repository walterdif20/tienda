import {
  Timestamp,
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Transaction,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AdminOrder, AdminOrderStatus } from "@/components/admin/types";
import type { Product } from "@/types";

const orderCollection = collection(db, "orders");
const getCurrentYear = () => new Date().getUTCFullYear();

const syncOrderLoyaltyAfterStatusChange = async (
  tx: Transaction,
  orderId: string,
  orderData: Record<string, unknown>,
  nextStatus: AdminOrderStatus,
) => {
  const orderRef = doc(db, "orders", orderId);
  const userId = String(orderData.userId ?? "").trim();
  const loyalty = (orderData.loyalty ?? {}) as Record<string, unknown>;
  const loyaltyStatus = String(loyalty.status ?? "pending");
  const pointsEarned = Number(loyalty.pointsEarned ?? 0);

  if (nextStatus === "paid") {
    tx.update(orderRef, {
      status: nextStatus,
      "loyalty.pointsEarned": pointsEarned,
      "loyalty.status": loyaltyStatus === "credited" ? "credited" : "pending",
      "loyalty.paidAt": serverTimestamp(),
    });
    return;
  }

  if (nextStatus === "in_progress") {
    if (userId && pointsEarned > 0 && loyaltyStatus !== "credited") {
      const userRef = doc(db, "users", userId);
      const userSnapshot = await tx.get(userRef);
      const userData = userSnapshot.data() as Record<string, unknown> | undefined;
      const currentYear = getCurrentYear();
      const storedYear = Number(userData?.loyaltyPointsYearlyYear ?? currentYear);
      const shouldResetYearly = storedYear !== currentYear;

      tx.set(
        userRef,
        {
          loyaltyPoints: increment(pointsEarned),
          loyaltyPointsYearly: shouldResetYearly
            ? pointsEarned
            : increment(pointsEarned),
          loyaltyPointsYearlyYear: currentYear,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    tx.update(orderRef, {
      status: nextStatus,
      ...(pointsEarned > 0
        ? {
            "loyalty.pointsEarned": pointsEarned,
            "loyalty.status": "credited",
            "loyalty.creditedAt": serverTimestamp(),
          }
        : {}),
    });
    return;
  }

  tx.update(orderRef, { status: nextStatus });
};

export const fetchAdminOrders = async (): Promise<AdminOrder[]> => {
  const snapshot = await getDocs(
    query(orderCollection, orderBy("createdAt", "desc")),
  );

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

      const createdAt =
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString();

      return {
        id: orderDoc.id,
        buyer: data.buyer?.name ?? "Cliente",
        orderNumber: data.orderNumber ?? orderDoc.id,
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

    const inventoryDiscounts: Array<{
      ref: ReturnType<typeof doc>;
      stock: number;
    }> = [];

    for (const itemDoc of itemsSnapshot.docs) {
      const item = itemDoc.data() as { productId: string; qty: number };
      const inventoryRef = doc(db, "inventory", item.productId);
      const inventorySnapshot = await tx.get(inventoryRef);
      const currentStock = Number(inventorySnapshot.data()?.stock ?? 0);

      if (currentStock < item.qty) {
        throw new Error("No hay stock suficiente para avanzar la orden.");
      }

      inventoryDiscounts.push({
        ref: inventoryRef,
        stock: currentStock - item.qty,
      });
    }

    for (const discount of inventoryDiscounts) {
      tx.update(discount.ref, {
        stock: discount.stock,
        updatedAt: serverTimestamp(),
      });
    }

    tx.update(orderRef, {
      stockDiscounted: true,
      stockDiscountedAt: serverTimestamp(),
    });
  });
};

const cancelOrderEffects = async (orderId: string) => {
  const orderRef = doc(db, "orders", orderId);
  const itemsSnapshot = await getDocs(collection(orderRef, "items"));

  await runTransaction(db, async (tx) => {
    const orderSnapshot = await tx.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("No se encontró la orden.");
    }

    const orderData = orderSnapshot.data() as Record<string, unknown>;
    const userId = String(orderData.userId ?? "").trim();
    const stockDiscounted = orderData.stockDiscounted === true;
    const loyalty = (orderData.loyalty ?? {}) as Record<string, unknown>;
    const pointsEarned = Number(loyalty.pointsEarned ?? 0);
    const loyaltyStatus = String(loyalty.status ?? "pending");
    const inventoryRestocks: Array<{
      ref: ReturnType<typeof doc>;
      stock: number;
    }> = [];
    let loyaltyCompensation:
      | {
          ref: ReturnType<typeof doc>;
          update: Record<string, unknown>;
        }
      | undefined;

    if (stockDiscounted) {
      for (const itemDoc of itemsSnapshot.docs) {
        const item = itemDoc.data() as { productId: string; qty: number };
        const inventoryRef = doc(db, "inventory", item.productId);
        const inventorySnapshot = await tx.get(inventoryRef);
        const currentStock = Number(inventorySnapshot.data()?.stock ?? 0);

        inventoryRestocks.push({
          ref: inventoryRef,
          stock: currentStock + item.qty,
        });
      }
    }

    if (userId && pointsEarned > 0 && loyaltyStatus === "credited") {
      const userRef = doc(db, "users", userId);
      const userSnapshot = await tx.get(userRef);
      const userData = userSnapshot.data() as Record<string, unknown> | undefined;
      const currentYear = getCurrentYear();
      const storedYear = Number(userData?.loyaltyPointsYearlyYear ?? currentYear);

      loyaltyCompensation = {
        ref: userRef,
        update: {
          loyaltyPoints: increment(-pointsEarned),
          ...(storedYear === currentYear
            ? { loyaltyPointsYearly: increment(-pointsEarned) }
            : {}),
          loyaltyPointsYearlyYear: currentYear,
          updatedAt: serverTimestamp(),
        },
      };
    }

    for (const restock of inventoryRestocks) {
      tx.set(
        restock.ref,
        {
          stock: restock.stock,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (loyaltyCompensation) {
      tx.set(loyaltyCompensation.ref, loyaltyCompensation.update, {
        merge: true,
      });
    }

    tx.update(orderRef, {
      status: "cancelled",
      stockDiscounted: false,
      stockDiscountedAt: null,
      "loyalty.pointsEarned": 0,
      "loyalty.status": "pending",
      "loyalty.creditedAt": null,
    });
  });
};

export const updateAdminOrderStatus = async (
  orderId: string,
  status: AdminOrderStatus,
) => {
  if (status === "in_progress") {
    await discountOrderInventory(orderId);
  }

  if (status === "paid" || status === "in_progress") {
    await runTransaction(db, async (tx) => {
      const orderRef = doc(db, "orders", orderId);
      const orderSnapshot = await tx.get(orderRef);

      if (!orderSnapshot.exists()) {
        throw new Error("No se encontró la orden.");
      }

      await syncOrderLoyaltyAfterStatusChange(
        tx,
        orderId,
        orderSnapshot.data() as Record<string, unknown>,
        status,
      );
    });
    return;
  }

  if (status === "cancelled") {
    await cancelOrderEffects(orderId);
    return;
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
      loyalty: {
        pointsEarned: 0,
        status: "credited",
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