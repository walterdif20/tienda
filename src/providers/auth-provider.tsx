import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const upsertUserProfile = async (user: User, isAdmin: boolean) => {
  await setDoc(
    doc(db, "users", user.uid),
    {
      email: user.email ?? "",
      displayName: user.displayName ?? user.email ?? "Cliente",
      whatsappNumber: user.phoneNumber ?? "",
      role: isAdmin ? "admin" : "customer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        const token = await nextUser.getIdTokenResult(true);
        const admin = Boolean(token.claims.role === "admin");
        setIsAdmin(admin);
        await upsertUserProfile(nextUser, admin);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      loading,
      signIn: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      },
      signOutUser: async () => {
        await signOut(auth);
      },
    }),
    [user, isAdmin, loading],
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
