import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

const TRANSFER_ALIAS = process.env.TRANSFER_ALIAS ?? "tienda.demo.alias";

const randomToken = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

export const createOrder = onCall(async (request) => {
  const { buyer, delivery, items } = request.data as {
    buyer: { name: string; email: string; phone: string };
    delivery: { method: "shipping" | "pickup"; address?: string };
    items: Array<{
      productId: string;
      qty: number;
    }>;
  };

  if (!buyer?.name || !buyer?.email || !buyer?.phone) {
    throw new HttpsError("invalid-argument", "Datos de comprador incompletos");
  }
  if (!items || items.length === 0) {
    throw new HttpsError("invalid-argument", "Carrito vacío");
  }

  const orderRef = db.collection("orders").doc();
  const orderId = orderRef.id;
  const publicTrackingToken = randomToken();

  const groupedQtyByProduct = new Map<string, number>();
  items.forEach((item) => {
    const productId = String(item.productId ?? "").trim();
    const qty = Math.floor(Number(item.qty ?? 0));
    if (!productId || qty <= 0) {
      return;
    }
    groupedQtyByProduct.set(productId, (groupedQtyByProduct.get(productId) ?? 0) + qty);
  });

  if (groupedQtyByProduct.size === 0) {
    throw new HttpsError("invalid-argument", "No hay ítems válidos en el carrito");
  }

  const productIds = Array.from(groupedQtyByProduct.keys());
  const productRefs = productIds.map((productId) => db.collection("products").doc(productId));
  const inventoryRefs = productIds.map((productId) =>
    db.collection("inventory").doc(productId),
  );

  const [productSnapshots, inventorySnapshots] = await Promise.all([
    db.getAll(...productRefs),
    db.getAll(...inventoryRefs),
  ]);

  const officialItems: Array<{ productId: string; name: string; price: number; qty: number }> =
    [];

  productSnapshots.forEach((productSnapshot, index) => {
    const productId = productIds[index];
    const requestedQty = groupedQtyByProduct.get(productId) ?? 0;
    const product = productSnapshot.data() as
      | { name?: unknown; price?: unknown; isActive?: unknown }
      | undefined;

    if (!productSnapshot.exists || product?.isActive !== true) {
      throw new HttpsError(
        "failed-precondition",
        "Hay productos inactivos o inexistentes en tu carrito",
      );
    }

    const name = String(product?.name ?? "").trim();
    const price = Number(product?.price ?? 0);
    if (!name || !Number.isFinite(price) || price <= 0) {
      throw new HttpsError(
        "failed-precondition",
        "Hay productos sin datos válidos para cobrar",
      );
    }

    const stock = Number(inventorySnapshots[index].data()?.stock ?? 0);
    if (!Number.isFinite(stock) || stock < requestedQty) {
      throw new HttpsError("failed-precondition", "Stock insuficiente");
    }

    officialItems.push({ productId, name, price, qty: requestedQty });
  });

  if (officialItems.length === 0) {
    throw new HttpsError("failed-precondition", "No hay ítems válidos para cobrar");
  }

  inventorySnapshots.forEach((snapshot, index) => {
    const productId = productIds[index];
    if (!snapshot.exists) {
      throw new HttpsError(
        "failed-precondition",
        `No existe inventario para el producto ${productId}`,
      );
    }
  });

  const subtotal = officialItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingCost = delivery.method === "shipping" ? 1500 : 0;
  const total = subtotal + shippingCost;

  const batch = db.batch();
  batch.set(orderRef, {
    userId: request.auth?.uid ?? null,
    buyer,
    delivery,
    status: "pending",
    subtotal,
    shippingCost,
    total,
    createdAt: FieldValue.serverTimestamp(),
    publicTrackingToken,
    stockDiscounted: false,
    payment: {
      provider: "bank_transfer",
      transferAlias: TRANSFER_ALIAS,
    },
  });

  officialItems.forEach((item) => {
    const itemRef = orderRef.collection("items").doc();
    batch.set(itemRef, {
      productId: item.productId,
      nameSnapshot: item.name,
      priceSnapshot: item.price,
      qty: item.qty,
    });
  });

  await batch.commit();

  return {
    orderId,
    publicTrackingToken,
    transferAlias: TRANSFER_ALIAS,
    total,
  };
});

export const confirmOrderTransfer = onCall(async (request) => {
  const orderId = String(request.data?.orderId ?? "").trim();
  const publicTrackingToken = String(request.data?.publicTrackingToken ?? "").trim();

  if (!orderId || !publicTrackingToken) {
    throw new HttpsError("invalid-argument", "Faltan datos para confirmar la transferencia");
  }

  const orderRef = db.collection("orders").doc(orderId);
  const snapshot = await orderRef.get();
  if (!snapshot.exists) {
    throw new HttpsError("not-found", "No encontramos el pedido");
  }

  const data = snapshot.data();
  if (String(data?.publicTrackingToken ?? "") !== publicTrackingToken) {
    throw new HttpsError("permission-denied", "Token inválido");
  }

  if (data?.status !== "pending") {
    return { ok: true, status: data?.status ?? "pending" };
  }

  await orderRef.update({
    status: "paid",
    "payment.transferConfirmedAt": FieldValue.serverTimestamp(),
  });

  return { ok: true, status: "paid" };
});

export const setUserAdminRole = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Tenés que iniciar sesión");
  }

  const callerUserSnapshot = await db.collection("users").doc(request.auth.uid).get();
  const callerData = callerUserSnapshot.data() ?? {};
  const callerIsAdmin = callerData.role === "admin" || callerData.isAdmin === true;

  if (!callerIsAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Solo un admin puede realizar esta acción",
    );
  }

  const uid = String(request.data?.uid ?? "").trim();
  if (!uid) {
    throw new HttpsError("invalid-argument", "Falta el uid del usuario");
  }

  await db.collection("users").doc(uid).set(
    {
      role: "admin",
      isAdmin: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true };
});
