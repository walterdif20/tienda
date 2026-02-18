import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";

const links = [
  { to: "/products", label: "Productos" },
  { to: "/cart", label: "Carrito" },
  { to: "/track", label: "Seguimiento" },
  { to: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const items = useCartStore((state) => state.items);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          Aura Accesorios
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "text-slate-900" : "hover:text-slate-900"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/account/orders" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden text-sm md:inline">Mi cuenta</span>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/cart" className="relative flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm">Carrito</span>
              {totalQty > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
                  {totalQty}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
