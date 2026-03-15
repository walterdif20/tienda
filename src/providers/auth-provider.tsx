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
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isBlocked: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    displayName?: string;
    whatsappNumber?: string;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getUserStatusFromDoc = async (uid: string) => {
  const userSnapshot = await getDoc(doc(db, "users", uid));
  if (!userSnapshot.exists()) {
    return { isAdmin: false, isBlocked: false };
  }

  const data = userSnapshot.data() as Record<string, unknown>;
  return {
    isAdmin: data.role === "admin" || data.isAdmin === true,
    isBlocked: data.isBlocked === true,
  };
};

const upsertUserProfile = async (
  user: User,
  extras?: { displayName?: string; whatsappNumber?: string },
) => {
  await setDoc(
    doc(db, "users", user.uid),
    {
      email: user.email ?? "",
      displayName:
        extras?.displayName ?? user.displayName ?? user.email ?? "Cliente",
      whatsappNumber: extras?.whatsappNumber ?? user.phoneNumber ?? "",
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        await upsertUserProfile(nextUser);
        const status = await getUserStatusFromDoc(nextUser.uid);
        setIsAdmin(status.isAdmin);
        setIsBlocked(status.isBlocked);

        if (status.isBlocked) {
          await signOut(auth);
          setUser(null);
        }
      } else {
        setIsAdmin(false);
        setIsBlocked(false);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      isBlocked,
      loading,
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
    }),
    [user, isAdmin, isBlocked, loading],
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
