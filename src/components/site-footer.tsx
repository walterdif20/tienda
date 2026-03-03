import { Link } from "react-router-dom";
import { useStoreSettings } from "@/hooks/use-store-settings";

const normalizePhoneForLink = (value: string) => value.replace(/[^\d]/g, "");

export function SiteFooter() {
  const { settings } = useStoreSettings();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="store-primary-text text-base font-semibold">
            {settings.title}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Ecommerce minimalista, rápido y funcional sobre React, Firebase y
            Firestore.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700">Navegación</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            <li>
              <Link to="/products" className="hover:text-slate-900">
                Catálogo
              </Link>
            </li>
            <li>
              <Link to="/checkout" className="hover:text-slate-900">
                Checkout
              </Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-slate-900">
                Seguimiento
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700">Soporte</h4>
          <p className="mt-2 text-sm text-slate-500">hola@tiendaminimal.com</p>
          <p className="text-sm text-slate-500">{settings.whatsappNumber}</p>
          <a
            href={`https://wa.me/${normalizePhoneForLink(settings.whatsappNumber)}`}
            target="_blank"
            rel="noreferrer"
            className="store-primary-text mt-2 inline-flex text-sm font-medium hover:underline"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
