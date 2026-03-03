import { ShoppingBag } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useAuth } from "@/providers/auth-provider";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";

const baseLinks = [
  { to: "/", label: "Inicio" },
  { to: "/products", label: "Catálogo" },
  { to: "/track", label: "Seguimiento" },
];

export function SiteHeader() {
  const { settings } = useStoreSettings();
  const { isAdmin, user, signOutUser } = useAuth();
  const count = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.qty, 0),
  );

  const links = isAdmin
    ? [...baseLinks, { to: "/admin", label: "Admin" }]
    : baseLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900"
        >
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={`${settings.title} logo`}
              className="h-9 w-9 rounded-full border border-slate-200 object-cover"
            />
          ) : null}
          <span>{settings.title}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? "store-primary-text"
                  : "transition hover:text-slate-900"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!user ? (
            <Link
              to="/registro"
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Login / Registro
            </Link>
          ) : (
            <Button variant="ghost" className="px-3" onClick={() => void signOutUser()}>
              Salir
            </Button>
          )}

          <Link
            to="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ShoppingBag className="h-4 w-4" />
            Carrito
            {count > 0 && (
              <span className="store-primary-bg rounded-full px-2 py-0.5 text-xs text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
