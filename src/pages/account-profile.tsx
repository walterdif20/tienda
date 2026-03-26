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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setFirstName("");
      setLastName("");
      setPhone("");
      setAddress("");
      return;
    }

    const fallbackName = user.displayName?.trim() || user.email?.split("@")[0] || "";
    const [fallbackFirstName, ...fallbackLastNameParts] = fallbackName.split(/\s+/);
    const fallbackLastName = fallbackLastNameParts.join(" ");
    const fallbackPhone = user.phoneNumber ?? "";

    setFirstName(fallbackFirstName || fallbackName);
    setLastName(fallbackLastName);
    setPhone(fallbackPhone);
    setAddress("");

    const loadUserProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
          return;
        }

        const data = userSnapshot.data() as {
          firstName?: string;
          lastName?: string;
          phone?: string;
          whatsappNumber?: string;
          address?: string;
        };

        setFirstName(data.firstName?.trim() || fallbackFirstName || fallbackName);
        setLastName(data.lastName?.trim() || fallbackLastName);
        setPhone(data.phone?.trim() || data.whatsappNumber?.trim() || fallbackPhone);
        setAddress(data.address?.trim() || "");
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
        firstName,
        lastName,
        phone,
        address,
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
          Actualizá tus datos para agilizar futuras compras.
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
                <Label htmlFor="account-first-name">Nombre</Label>
                <Input
                  id="account-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-last-name">Apellido</Label>
                <Input
                  id="account-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Tu apellido"
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
                <Label htmlFor="account-phone">Teléfono</Label>
                <Input
                  id="account-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+54 9 ..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-address">Dirección</Label>
                <Input
                  id="account-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Calle 123, Ciudad"
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
