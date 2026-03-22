import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Crown,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { formatLoyaltyPoints, getLoyaltyTier } from "@/lib/loyalty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminUser } from "@/lib/admin-users";
import { toWhatsAppLink } from "@/lib/admin-users";
import type { Product } from "@/types";

interface UserManagementSectionProps {
  users: AdminUser[];
  products: Product[];
  loading: boolean;
  onReload: () => Promise<void>;
  onMakeAdmin: (uid: string) => Promise<void>;
  onToggleBlocked: (uid: string, blocked: boolean) => Promise<void>;
}

const formatDate = (valueMs: number) =>
  valueMs ? new Date(valueMs).toLocaleString("es-AR") : "Sin fecha";

export function UserManagementSection({
  users,
  products,
  loading,
  onReload,
  onMakeAdmin,
  onToggleBlocked,
}: UserManagementSectionProps) {
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const stats = useMemo(() => {
    const admins = users.filter((user) => user.role === "admin").length;
    const blocked = users.filter((user) => user.isBlocked).length;
    const totalPoints = users.reduce(
      (sum, user) => sum + user.loyaltyPoints,
      0,
    );
    return { total: users.length, admins, blocked, totalPoints };
  }, [users]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const productsBySlug = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products],
  );

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

  const toggleBlocked = async (uid: string, blocked: boolean) => {
    setProcessingUid(uid);
    setFeedback(null);
    try {
      await onToggleBlocked(uid, blocked);
      setFeedback(blocked ? "Cuenta bloqueada." : "Cuenta desbloqueada.");
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo actualizar el bloqueo.");
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
          Total: {stats.total} · Admins: {stats.admins} · Bloqueados:{" "}
          {stats.blocked} · Puntos acumulados:{" "}
          {formatLoyaltyPoints(stats.totalPoints)}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {users.map((user) => {
            const isExpanded = expandedUserId === user.id;
            const favoriteProducts = user.favoriteProductIds
              .map((favoriteId) => productsById.get(favoriteId))
              .filter((item): item is Product => Boolean(item));
            const loyaltyTier = getLoyaltyTier(user.loyaltyPoints);

            return (
              <div
                key={user.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {user.displayName}
                    </p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="text-sm text-slate-500">
                      {user.whatsappNumber || "Sin WhatsApp cargado"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatLoyaltyPoints(user.loyaltyPoints)} puntos · Nivel{" "}
                      {loyaltyTier.label}
                    </p>
                    {user.isBlocked ? (
                      <p className="text-sm font-medium text-rose-600">
                        Cuenta bloqueada
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setExpandedUserId((current) =>
                          current === user.id ? null : user.id,
                        )
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="mr-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="mr-1 h-4 w-4" />
                      )}
                      {isExpanded ? "Ocultar info" : "Ver info"}
                    </Button>

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

                    <Button
                      variant={user.isBlocked ? "outline" : "secondary"}
                      onClick={() => toggleBlocked(user.id, !user.isBlocked)}
                      disabled={processingUid === user.id}
                    >
                      {processingUid === user.id
                        ? "Actualizando..."
                        : user.isBlocked
                          ? "Desbloquear"
                          : "Bloquear"}
                    </Button>

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

                {isExpanded ? (
                  <div className="mt-4 space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Información del usuario
                      </p>
                      <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <p>
                          <span className="font-medium">UID:</span> {user.id}
                        </p>
                        <p>
                          <span className="font-medium">Rol:</span> {user.role}
                        </p>
                        <p>
                          <span className="font-medium">Estado:</span>{" "}
                          {user.isBlocked ? "Bloqueado" : "Activo"}
                        </p>
                        <p>
                          <span className="font-medium">Alta:</span>{" "}
                          {formatDate(user.createdAtMs)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Programa de puntos
                      </p>
                      <div className="mt-2 grid gap-3 md:grid-cols-3">
                        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Saldo actual
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">
                            {formatLoyaltyPoints(user.loyaltyPoints)}
                          </p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Nivel
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">
                            {loyaltyTier.label}
                          </p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Movimientos
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">
                            {user.loyaltyHistory.length}
                          </p>
                        </div>
                      </div>

                      {user.loyaltyHistory.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          Este usuario todavía no tiene historial de puntos.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {user.loyaltyHistory.map((entry) => (
                            <div
                              key={entry.orderId}
                              className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="font-medium text-slate-900">
                                    Orden #{entry.orderNumber}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Creada: {formatDate(entry.createdAtMs)}
                                  </p>
                                  {entry.creditedAtMs ? (
                                    <p className="text-xs text-slate-500">
                                      Acreditada:{" "}
                                      {formatDate(entry.creditedAtMs)}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="text-left md:text-right">
                                  <p className="text-xs text-slate-500">
                                    Total pedido: {formatPrice(entry.total)}
                                  </p>
                                  <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                      entry.status === "credited"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {entry.status === "credited"
                                      ? "Acreditado"
                                      : "Pendiente"}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <p>
                                  <span className="font-medium text-emerald-700">
                                    + Ganados:
                                  </span>{" "}
                                  {formatLoyaltyPoints(entry.pointsEarned)}
                                </p>
                                <p>
                                  <span className="font-medium text-rose-700">
                                    - Canjeados:
                                  </span>{" "}
                                  {formatLoyaltyPoints(entry.redeemedPoints)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Productos favoritos ({user.favoriteProductIds.length})
                      </p>

                      {user.favoriteProductIds.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          Este usuario no marcó favoritos todavía.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {favoriteProducts.map((product) => (
                            <li
                              key={product.id}
                              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            >
                              <a
                                href={`/products/${product.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-slate-900 hover:underline"
                              >
                                {product.name}
                              </a>
                              <p className="text-xs text-slate-500">
                                ID: {product.id}
                              </p>
                            </li>
                          ))}

                          {favoriteProducts.length !==
                          user.favoriteProductIds.length ? (
                            <li className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                              Algunos favoritos no están en el catálogo activo.
                            </li>
                          ) : null}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Vistas por slug ({user.productSlugViews.length})
                      </p>

                      {user.productSlugViews.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          Aún no hay vistas registradas para este usuario.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {user.productSlugViews.map((view) => {
                            const productBySlug = productsBySlug.get(view.slug);

                            return (
                              <li
                                key={view.slug}
                                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                              >
                                <a
                                  href={`/products/${view.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-slate-900 hover:underline"
                                >
                                  {productBySlug?.name ?? view.slug}
                                </a>
                                <p className="text-xs text-slate-500">
                                  slug: {view.slug}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Vistas: {view.count}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

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
