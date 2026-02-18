import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold">Club Turnos</h3>
          <p className="mt-2 text-sm text-slate-500">
            Reservas online de canchas para jugadores y administradores.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          <h4 className="text-sm font-semibold text-slate-700">Navegación</h4>
          <ul className="mt-2 space-y-1">
            <li>
              <Link className="hover:text-slate-900" to="/">
                Landing
              </Link>
            </li>
            <li>
              <Link className="hover:text-slate-900" to="/registro">
                Registro
              </Link>
            </li>
            <li>
              <Link className="hover:text-slate-900" to="/admin">
                Admin
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm text-slate-500">
          <h4 className="text-sm font-semibold text-slate-700">Contacto</h4>
          <p className="mt-2">turnos@club.com</p>
          <p>WhatsApp: +54 9 11 0000-0000</p>
        </div>
      </div>
    </footer>
  );
}
