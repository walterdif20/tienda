import { ChevronDown, ChevronRight, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { categories } from "@/data/products";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useAuth } from "@/providers/auth-provider";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";

const baseLinks = [
  { to: "/", label: "Inicio" },
  { to: "/products", label: "Productos" },
  { to: "/track", label: "Seguimiento" },
];

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const { settings } = useStoreSettings();
  const { isAdmin, user, signOutUser } = useAuth();
  const displayName = user?.displayName?.trim() || user?.email?.split("@")[0] || "Cliente";
  const userInitial = displayName.charAt(0).toUpperCase();
  const count = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.qty, 0),
  );

  const links = [
    ...baseLinks,
    ...(user ? [{ to: "/mis-compras", label: "Mis compras" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const productCategories = categories.filter(
    (category) => category.id !== "new" && category.id !== "featured",
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((open) => {
      if (open) setIsMobileProductsOpen(false);
      return !open;
    });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileProductsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900"
          onClick={closeMobileMenu}
        >
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={`${settings.title} logo`}
              className="logo rounded-full border border-slate-200 object-cover"
            />
          ) : null}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) =>
            link.to === "/products" ? (
              <div key={link.to} className="group relative">
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive
                      ? "store-primary-text inline-flex items-center gap-1"
                      : "inline-flex items-center gap-1 transition hover:text-slate-900"
                  }
                >
                  {link.label}
                  <ChevronDown className="h-4 w-4" />
                </NavLink>

                <div className="invisible absolute left-0 top-full z-50 min-w-48 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                  <NavLink
                    to="/products"
                    className={({ isActive }) =>
                      isActive
                        ? "store-primary-text block rounded-md px-3 py-2"
                        : "block rounded-md px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    }
                  >
                    Ver todos
                  </NavLink>
                  {productCategories.map((category) => (
                    <NavLink
                      key={category.id}
                      to={`/products?category=${category.id}`}
                      className="block rounded-md px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      {category.name}
                    </NavLink>
                  ))}
                </div>
                </div>
              </div>
            ) : (
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
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 md:hidden"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {!user ? (
            <Link
              to="/registro"
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Login / Registro
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 sm:block">
                  {displayName}
                </span>
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.secondaryColor} 100%)`,
                  }}
                  aria-hidden="true"
                >
                  {userInitial}
                </span>
              </div>

              <Button
                variant="ghost"
                className="px-3"
                onClick={() => void signOutUser()}
              >
                Salir
              </Button>
            </div>
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

      {isMobileMenuOpen ? (
        <nav
          id="mobile-menu"
          className="border-t border-slate-200 px-4 py-3 md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm font-medium text-slate-600">
            {links.map((link) =>
              link.to === "/products" ? (
                <div key={link.to} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileProductsOpen((open) => !open)}
                    className="flex w-full items-center justify-between text-left transition hover:text-slate-900"
                    aria-expanded={isMobileProductsOpen}
                    aria-controls="mobile-product-categories"
                  >
                    <span>{link.label}</span>
                    {isMobileProductsOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {isMobileProductsOpen ? (
                    <div
                      id="mobile-product-categories"
                      className="ml-3 flex flex-col gap-2 border-l border-slate-200 pl-3"
                    >
                      <NavLink
                        to="/products"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          isActive
                            ? "store-primary-text"
                            : "text-slate-500 transition hover:text-slate-900"
                        }
                      >
                        Ver todos
                      </NavLink>
                      {productCategories.map((category) => (
                        <NavLink
                          key={category.id}
                          to={`/products?category=${category.id}`}
                          onClick={closeMobileMenu}
                          className="text-slate-500 transition hover:text-slate-900"
                        >
                          {category.name}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? "store-primary-text"
                      : "transition hover:text-slate-900"
                  }
                >
                  {link.label}
                </NavLink>
              ),
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
