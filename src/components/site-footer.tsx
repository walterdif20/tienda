import { Link } from "react-router-dom";
import {
  Instagram,
  Mail,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { normalizePhoneForWhatsAppLink } from "@/lib/whatsapp";

function WhatsAppLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M19.11 4.89A10.88 10.88 0 0 0 12.01 2c-6.03 0-10.93 4.9-10.93 10.93 0 1.92.5 3.8 1.46 5.46L1 23l4.74-1.52a10.88 10.88 0 0 0 6.27 1.95h.01c6.03 0 10.93-4.9 10.93-10.93 0-2.92-1.14-5.66-3.84-7.61ZM12.01 21.3a8.82 8.82 0 0 1-4.5-1.23l-.32-.19-2.81.9.91-2.74-.2-.34a8.8 8.8 0 0 1-1.35-4.73c0-4.87 3.96-8.83 8.83-8.83 2.36 0 4.58.92 6.25 2.59a8.78 8.78 0 0 1 2.58 6.24c0 4.87-3.96 8.83-8.82 8.83Zm4.84-6.62c-.26-.13-1.53-.76-1.77-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.02-.15.17-.3.19-.56.06-.26-.13-1.08-.4-2.06-1.27-.76-.68-1.28-1.52-1.43-1.77-.15-.26-.02-.4.11-.53.11-.11.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.07-.13-.58-1.4-.8-1.91-.21-.5-.43-.43-.58-.44h-.5c-.17 0-.45.07-.69.32-.24.26-.91.89-.91 2.16s.93 2.5 1.06 2.67c.13.17 1.82 2.78 4.41 3.89.62.27 1.1.43 1.47.55.62.2 1.19.17 1.64.1.5-.07 1.53-.62 1.75-1.22.22-.6.22-1.11.15-1.22-.06-.11-.24-.17-.5-.3Z" />
    </svg>
  );
}

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
      icon: WhatsAppLogoIcon,
    },
    {
      key: "instagram",
      href: normalizedInstagram,
      external: true,
      label: "madd.accesorios_",
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
           Accesorios que potencian tus outfits.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
              <Truck className="h-3.5 w-3.5" /> Envíos gratis a Necochea y Quequén
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Protegemos tu compra y tus datos
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
