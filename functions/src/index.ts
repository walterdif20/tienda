import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

initializeApp();
const db = getFirestore();

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? "",
});

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
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new HttpsError("failed-precondition", "Falta configurar Mercado Pago");
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

  const preference = new Preference(mpClient);
  const mpPreference = await preference.create({
    body: {
      items: officialItems.map((item) => ({
        id: item.productId,
        title: item.name,
        quantity: item.qty,
        unit_price: item.price,
        currency_id: "ARS",
      })),
      external_reference: orderId,
      notification_url: process.env.MP_NOTIFICATION_URL,
      metadata: {
        orderId,
        userId: request.auth?.uid ?? null,
      },
      payer: {
        name: buyer.name,
        email: buyer.email,
      },
      back_urls: {
        success: process.env.MP_SUCCESS_URL ?? "",
        failure: process.env.MP_FAILURE_URL ?? "",
      },
      auto_return: "approved",
    },
  });

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
    payment: {
      provider: "mercadopago",
      mpPreferenceId: mpPreference.id,
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
    initPoint: mpPreference.init_point,
    publicTrackingToken,
  };
});

export const mpWebhook = onRequest(async (request, response) => {
  try {
    const paymentId = request.query["data.id"] || request.body?.data?.id;
    if (!paymentId) {
      response.status(400).send("Missing payment id");
      return;
    }

    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: Number(paymentId) });

    if (payment.status !== "approved") {
      response.status(200).send("Payment not approved");
      return;
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      response.status(200).send("Missing external reference");
      return;
    }

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnapshot = await orderRef.get();
    if (!orderSnapshot.exists) {
      response.status(404).send("Order not found");
      return;
    }

    const orderData = orderSnapshot.data();
    if (orderData?.status === "paid") {
      response.status(200).send("Already paid");
      return;
    }

    const itemsSnapshot = await orderRef.collection("items").get();
    const inventoryUpdates = itemsSnapshot.docs.map((doc) => {
      const item = doc.data();
      return db.collection("inventory").doc(item.productId);
    });

    const inventorySnapshots = await db.getAll(...inventoryUpdates);
    inventorySnapshots.forEach((snapshot, index) => {
      const item = itemsSnapshot.docs[index].data();
      const stock = snapshot.data()?.stock ?? 0;
      if (stock < item.qty) {
        throw new Error("Stock insuficiente");
      }
    });

    const batch = db.batch();
    inventorySnapshots.forEach((snapshot, index) => {
      const item = itemsSnapshot.docs[index].data();
      batch.update(snapshot.ref, {
        stock: FieldValue.increment(-item.qty),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    batch.update(orderRef, {
      status: "paid",
      "payment.mpPaymentId": String(payment.id),
      "payment.mpMerchantOrderId": payment.order?.id ?? null,
      "payment.paidAt": FieldValue.serverTimestamp(),
    });

    await batch.commit();

    response.status(200).send("OK");
  } catch (error) {
    console.error(error);
    response.status(500).send("Webhook error");
  }
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
