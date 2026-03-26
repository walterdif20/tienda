import {
  ChevronDown,
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCategories } from "@/hooks/use-categories";
import { getCategoryLabel, getCategoryTree } from "@/lib/categories";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useAuth } from "@/providers/auth-provider";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatLoyaltyPoints, getLoyaltyProgress } from "@/lib/loyalty";

const baseLinks = [
  { to: "/", label: "Inicio" },
  { to: "/products", label: "Productos" },
  { to: "/track", label: "Seguimiento" },
];

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const { categories } = useCategories();
  const { isAdmin, loyaltyPoints, loyaltyPointsYearly, user, signOutUser } =
    useAuth();
  const displayName =
    user?.displayName?.trim() || user?.email?.split("@")[0] || "Cliente";
  const userInitial = displayName.charAt(0).toUpperCase();
  const count = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.qty, 0),
  );
  const userMenuRef = useRef<HTMLDivElement>(null);
  const productsMenuRef = useRef<HTMLDivElement>(null);
  const loyaltyProgress = getLoyaltyProgress(loyaltyPointsYearly);

  useEffect(() => {
    if (!isUserMenuOpen && !isProductsMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!userMenuRef.current?.contains(target)) {
        setIsUserMenuOpen(false);
      }

      if (!productsMenuRef.current?.contains(target)) {
        setIsProductsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProductsMenuOpen, isUserMenuOpen]);

  const links = [
    ...baseLinks,
    ...(user ? [{ to: "/mis-compras", label: "Mis compras" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const productCategories = getCategoryTree(categories);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((open) => {
      if (open) setIsMobileProductsOpen(false);
      return !open;
    });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileProductsOpen(false);
    setIsProductsMenuOpen(false);
  };

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "rounded-full bg-slate-100 px-3 py-1.5 text-slate-900"
      : "rounded-full px-3 py-1.5 transition hover:bg-slate-100/80 hover:text-slate-900";

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitized = searchQuery.trim();
    navigate(
      sanitized
        ? `/products?query=${encodeURIComponent(sanitized)}`
        : "/products",
    );
    closeMobileMenu();
  };

  return (
    <header className="relative sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900"
          onClick={closeMobileMenu}
        >
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={`${settings.title} logo`}
              className="logo border border-slate-200 bg-white object-contain"
            />
          ) : (
            <span>{settings.title}</span>
          )}
        </Link>

        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden max-w-sm flex-1 md:block"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar regalos, básicos o productos..."
            className="rounded-full border-slate-200 pl-9"
          />
        </form>

        <nav className="hidden items-center gap-3 text-sm font-medium text-slate-600 xl:flex">
          {links.map((link) =>
            link.to === "/products" ? (
              <div
                key={link.to}
                ref={productsMenuRef}
                className="static"
                onMouseEnter={() => setIsProductsMenuOpen(true)}
              >
                <NavLink
                  to={link.to}
                  onClick={() => setIsProductsMenuOpen(false)}
                  className={({ isActive }) =>
                    isActive
                      ? "store-primary-text inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5"
                      : "inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-slate-100/80 hover:text-slate-900"
                  }
                >
                  {link.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isProductsMenuOpen ? "rotate-180" : ""}`}
                  />
                </NavLink>

                <div
                  className={`absolute left-1/2 top-[calc(100%-0.25rem)] z-50 w-screen -translate-x-1/2 pt-3 transition duration-200 ${
                    isProductsMenuOpen
                      ? "visible opacity-100"
                      : "invisible opacity-0"
                  }`}
                >
                  <div className="w-screen border-b border-slate-200 bg-white text-slate-900 shadow-lg">
                    <div className="w-full px-6 py-6 lg:px-8 xl:px-10">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Catálogo
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Explorá todos nuestros productos desde un solo lugar.
                          </p>
                        </div>
                        <NavLink
                          to="/products"
                          onClick={() => setIsProductsMenuOpen(false)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        >
                          Ver todos los productos
                        </NavLink>
                      </div>

                      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                        {productCategories.map(({ category, subcategories }) => (
                          <div key={category.id} className="space-y-3">
                            <NavLink
                              to={`/products?category=${category.id}`}
                              onClick={() => setIsProductsMenuOpen(false)}
                              className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-900 transition hover:text-slate-600"
                            >
                              {getCategoryLabel(category)}
                            </NavLink>

                            <div className="space-y-2">
                              {subcategories.length > 0 ? (
                                subcategories.map((subcategory) => (
                                  <NavLink
                                    key={subcategory.id}
                                    to={`/products?category=${category.id}&subcategory=${subcategory.id}`}
                                    onClick={() => setIsProductsMenuOpen(false)}
                                    className="block text-[15px] text-slate-600 transition hover:text-slate-900"
                                  >
                                    {getCategoryLabel(subcategory)}
                                  </NavLink>
                                ))
                              ) : (
                                <NavLink
                                  to={`/products?category=${category.id}`}
                                  onClick={() => setIsProductsMenuOpen(false)}
                                  className="block text-[15px] text-slate-600 transition hover:text-slate-900"
                                >
                                  Ver categoría
                                </NavLink>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <NavLink key={link.to} to={link.to} className={navLinkClassName}>
                {link.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 xl:hidden"
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
              className="hidden items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 sm:inline-flex"
            >
              Login / Registro
            </Link>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 transition hover:border-slate-300"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
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
              </button>

              {isUserMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Mi cuenta
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div>
                      <p className="text-xs text-slate-400">Nombre</p>
                      <p className="font-medium text-slate-900">
                        {displayName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Email</p>
                      <p className="break-all font-medium text-slate-900">
                        {user.email ?? "No disponible"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Club</p>
                      <p className="font-medium text-slate-900">
                        {formatLoyaltyPoints(loyaltyPoints)} canjeables · Nivel{" "}
                        {loyaltyProgress.currentTier.label}
                      </p>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900 transition-all"
                          style={{ width: `${loyaltyProgress.percentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {loyaltyProgress.nextTier
                          ? `Histórico ${new Date().getUTCFullYear()}: ${formatLoyaltyPoints(loyaltyPointsYearly)}. Te faltan ${formatLoyaltyPoints(loyaltyProgress.missingPoints)} puntos para ${loyaltyProgress.nextTier.label}.`
                          : "Ya estás en el nivel más alto del club."}
                      </p>
                    </div>
                  </div>
                  <br />
                  <hr />
                  <Button asChild variant="outline" className="mt-4 w-full justify-center">
                    <Link
                      to="/mi-cuenta"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                      }}
                    >
                      Editar datos
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="mt-2 w-full justify-center"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      void signOutUser();
                    }}
                  >
                    Salir
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          <Link
            to="/favoritos"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Favoritos</span>
          </Link>

          <Link
            to="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Carrito</span>
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
          className="border-t border-slate-200 px-4 py-3 xl:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-medium text-slate-600">
            <form onSubmit={handleSearchSubmit} className="relative pb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar productos..."
                className="pl-9"
              />
            </form>
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
                      {productCategories.map(({ category, subcategories }) => (
                        <div key={category.id} className="space-y-2">
                          <NavLink
                            to={`/products?category=${category.id}`}
                            onClick={closeMobileMenu}
                            className="font-medium text-slate-700 transition hover:text-slate-900"
                          >
                            {getCategoryLabel(category)}
                          </NavLink>
                          {subcategories.length > 0 ? (
                            <div className="ml-3 flex flex-col gap-2 border-l border-slate-200 pl-3">
                              {subcategories.map((subcategory) => (
                                <NavLink
                                  key={subcategory.id}
                                  to={`/products?category=${category.id}&subcategory=${subcategory.id}`}
                                  onClick={closeMobileMenu}
                                  className="text-slate-500 transition hover:text-slate-900"
                                >
                                  {getCategoryLabel(subcategory)}
                                </NavLink>
                              ))}
                            </div>
                          ) : null}
                        </div>
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
