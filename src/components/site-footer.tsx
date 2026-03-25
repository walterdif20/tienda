import { Link } from "react-router-dom";
import {
  Instagram,
  Mail,
  MessageCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { normalizePhoneForWhatsAppLink } from "@/lib/whatsapp";

export function SiteFooter() {
  const { settings } = useStoreSettings();
  const normalizedEmail = settings.contactEmail.trim();
  const normalizedInstagram = settings.instagramUrl.trim();
  const whatsappLink = `https://wa.me/${normalizePhoneForWhatsAppLink(settings.whatsappNumber)}`;
  const contactLinks = [
    {
      key: "whatsapp",
      href: whatsappLink,
      external: true,
      label: settings.whatsappNumber,
      icon: MessageCircle,
    },
    {
      key: "instagram",
      href: normalizedInstagram,
      external: true,
      label: "Instagram",
      icon: Instagram,
    },
    {
      key: "email",
      href: `mailto:${normalizedEmail}`,
      external: false,
      label: normalizedEmail,
      icon: Mail,
    },
  ];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="store-primary-text text-base font-semibold">
            {settings.title}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Ecommerce minimalista, rápido y funcional sobre React, Firebase y
            Firestore.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
              <Truck className="h-3.5 w-3.5" /> Envíos a todo el país
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Compra segura
            </span>
          </div>
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
          <h4 className="text-sm font-semibold text-slate-700">Contacto</h4>
          <div className="mt-2 space-y-2">
            {contactLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
