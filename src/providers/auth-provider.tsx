/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isBlocked: boolean;
  loading: boolean;
  loyaltyPoints: number;
  loyaltyPointsYearly: number;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    displayName?: string;
    whatsappNumber?: string;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateAccountProfile: (input: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const upsertUserProfile = async (
  user: User,
  extras?: { displayName?: string; whatsappNumber?: string },
) => {
  const fallbackDisplayName =
    extras?.displayName ?? user.displayName ?? user.email ?? "Cliente";
  const normalizedPhone = extras?.whatsappNumber ?? user.phoneNumber ?? "";
  const [firstName, ...lastNameParts] = fallbackDisplayName.trim().split(/\s+/);
  const lastName = lastNameParts.join(" ");

  await setDoc(
    doc(db, "users", user.uid),
    {
      email: user.email ?? "",
      displayName: fallbackDisplayName,
      firstName: firstName || fallbackDisplayName,
      lastName,
      phone: normalizedPhone,
      whatsappNumber: normalizedPhone,
      address: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyPointsYearly, setLoyaltyPointsYearly] = useState(0);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      unsubscribeUserDoc?.();
      unsubscribeUserDoc = undefined;
      setUser(nextUser);

      if (nextUser) {
        await upsertUserProfile(nextUser);

        unsubscribeUserDoc = onSnapshot(
          doc(db, "users", nextUser.uid),
          (userSnapshot) => {
            if (!userSnapshot.exists()) {
              setIsAdmin(false);
              setIsBlocked(false);
              setLoyaltyPoints(0);
              setLoyaltyPointsYearly(0);
              setLoading(false);
              return;
            }

            const data = userSnapshot.data() as Record<string, unknown>;
            const nextIsBlocked = data.isBlocked === true;
            const currentYear = new Date().getUTCFullYear();
            const yearlyPointsYear = Number(
              data.loyaltyPointsYearlyYear ?? currentYear,
            );

            setIsAdmin(data.role === "admin" || data.isAdmin === true);
            setIsBlocked(nextIsBlocked);
            setLoyaltyPoints(Number(data.loyaltyPoints ?? 0));
            setLoyaltyPointsYearly(
              yearlyPointsYear === currentYear
                ? Number(data.loyaltyPointsYearly ?? 0)
                : 0,
            );
            setLoading(false);

            if (nextIsBlocked) {
              void signOut(auth);
              setUser(null);
            }
          },
        );
      } else {
        setIsAdmin(false);
        setIsBlocked(false);
        setLoyaltyPoints(0);
        setLoyaltyPointsYearly(0);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeUserDoc?.();
      unsub();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      isBlocked,
      loading,
      loyaltyPoints,
      loyaltyPointsYearly,
      signIn: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async ({
        email,
        password,
        displayName,
        whatsappNumber,
      }: {
        email: string;
        password: string;
        displayName?: string;
        whatsappNumber?: string;
      }) => {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }

        await upsertUserProfile(credential.user, {
          displayName,
          whatsappNumber,
        });
      },
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      },
      signOutUser: async () => {
        await signOut(auth);
      },
      updateAccountProfile: async ({
        firstName,
        lastName,
        phone,
        address,
      }: {
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
      }) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error("Tenés que iniciar sesión para actualizar tus datos.");
        }

        const normalizedFirstName = firstName.trim();
        const normalizedLastName = lastName.trim();
        const normalizedPhone = phone.trim();
        const normalizedAddress = address.trim();
        const normalizedDisplayName =
          `${normalizedFirstName} ${normalizedLastName}`.trim() ||
          currentUser.email ||
          "Cliente";

        if (normalizedDisplayName && normalizedDisplayName !== currentUser.displayName) {
          await updateProfile(currentUser, { displayName: normalizedDisplayName });
        }

        await updateDoc(doc(db, "users", currentUser.uid), {
          displayName: normalizedDisplayName,
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          phone: normalizedPhone,
          whatsappNumber: normalizedPhone,
          address: normalizedAddress,
          updatedAt: serverTimestamp(),
        });
      },
    }),
    [user, isAdmin, isBlocked, loading, loyaltyPoints, loyaltyPointsYearly],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
