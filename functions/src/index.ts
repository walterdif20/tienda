import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

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
