import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Landing" },
  { to: "/registro", label: "Registro" },
  { to: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          Club Turnos
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
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
      </div>
    </header>
  );
}
