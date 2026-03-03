import { useMemo, useState } from "react";
import { Crown, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminUser } from "@/lib/admin-users";
import { toWhatsAppLink } from "@/lib/admin-users";

interface UserManagementSectionProps {
  users: AdminUser[];
  loading: boolean;
  onReload: () => Promise<void>;
  onMakeAdmin: (uid: string) => Promise<void>;
}

export function UserManagementSection({
  users,
  loading,
  onReload,
  onMakeAdmin,
}: UserManagementSectionProps) {
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const stats = useMemo(() => {
    const admins = users.filter((user) => user.role === "admin").length;
    return { total: users.length, admins };
  }, [users]);

  const promote = async (uid: string) => {
    setProcessingUid(uid);
    setFeedback(null);
    try {
      await onMakeAdmin(uid);
      setFeedback("Cuenta promovida a admin.");
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo cambiar el rol.");
    } finally {
      setProcessingUid(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Cuentas de usuarios</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onReload}
            disabled={loading}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Recargar
          </Button>
        </CardTitle>
        <p className="text-sm text-slate-500">
          Total: {stats.total} · Admins: {stats.admins}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{user.displayName}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="text-sm text-slate-500">
                  {user.whatsappNumber || "Sin WhatsApp cargado"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {user.whatsappNumber ? (
                  <a
                    href={toWhatsAppLink(user.whatsappNumber)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                ) : null}

                {user.role === "admin" ? (
                  <span className="inline-flex items-center gap-2 rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                    <Crown className="h-4 w-4" />
                    Admin
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => promote(user.id)}
                    disabled={processingUid === user.id}
                  >
                    <Crown className="mr-1 h-4 w-4" />
                    {processingUid === user.id
                      ? "Actualizando..."
                      : "Hacer admin"}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {!loading && users.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay cuentas registradas todavía.
            </p>
          ) : null}
        </div>

        {feedback ? (
          <p className="mt-4 text-sm text-slate-600">{feedback}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
