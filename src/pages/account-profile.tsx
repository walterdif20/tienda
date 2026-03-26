import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { db } from "@/lib/firebase";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No pudimos actualizar tus datos. Intentá nuevamente.";
};

export function AccountProfilePage() {
  const { user, loading, updateAccountProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setDisplayName("");
      setWhatsappNumber("");
      return;
    }

    const fallbackName = user.displayName?.trim() || user.email?.split("@")[0] || "";
    const fallbackWhatsapp = user.phoneNumber ?? "";

    setDisplayName(fallbackName);
    setWhatsappNumber(fallbackWhatsapp);

    const loadUserProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
          return;
        }

        const data = userSnapshot.data() as {
          displayName?: string;
          whatsappNumber?: string;
        };

        setDisplayName(data.displayName?.trim() || fallbackName);
        setWhatsappNumber(data.whatsappNumber?.trim() || fallbackWhatsapp);
      } catch (nextError) {
        console.warn("No se pudo cargar el perfil de usuario", nextError);
      }
    };

    void loadUserProfile();
  }, [user]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSubmitting(true);
    setNotice("");
    setError("");

    try {
      await updateAccountProfile({
        displayName,
        whatsappNumber,
      });
      setNotice("Tus datos fueron actualizados correctamente.");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-xl space-y-4 px-4 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Mi cuenta
        </h1>
        <p className="text-sm text-slate-500">
          Actualizá tu nombre y WhatsApp para agilizar futuras compras.
        </p>
      </div>

      {loading ? (
        <Card className="rounded-3xl border-slate-200">
          <CardContent className="py-10 text-sm text-slate-500">
            Cargando datos de tu cuenta...
          </CardContent>
        </Card>
      ) : null}

      {!loading && !user ? (
        <Card className="rounded-3xl border-slate-200">
          <CardHeader>
            <CardTitle>Ingresá a tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Necesitás iniciar sesión para modificar tus datos.</p>
            <Button asChild>
              <Link to="/registro">Ir a login / registro</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && user ? (
        <Card className="rounded-3xl border-slate-200">
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="account-display-name">Nombre</Label>
                <Input
                  id="account-display-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  value={user.email ?? ""}
                  disabled
                  readOnly
                />
                <p className="text-xs text-slate-500">
                  El email no se puede editar desde esta pantalla.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-whatsapp">WhatsApp</Label>
                <Input
                  id="account-whatsapp"
                  value={whatsappNumber}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                  placeholder="+54 9 ..."
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </form>

            {notice ? <p className="mt-4 text-sm text-emerald-700">{notice}</p> : null}
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
