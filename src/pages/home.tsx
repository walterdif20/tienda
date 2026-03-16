import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";
import { useStoreSettings } from "@/hooks/use-store-settings";

const heroFallbackImages = [
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
];

export function HomePage() {
  const { products, loading } = useProducts();
  const { settings } = useStoreSettings();

  const featured = products.filter((product) => product.featured).slice(0, 4);
  const latest = products.slice(0, 4);

  const heroImages = useMemo(() => {
    const configured = settings.heroImages
      .map((image) => image.trim())
      .filter(Boolean);

    return configured.length > 0 ? configured : heroFallbackImages;
  }, [settings.heroImages]);

  const [activeHeroImage, setActiveHeroImage] = useState(0);

  useEffect(() => {
    setActiveHeroImage(0);
  }, [heroImages]);

  useEffect(() => {
    if (heroImages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveHeroImage((current) => (current + 1) % heroImages.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [heroImages]);

  return (
    <div className="space-y-16 pb-16">
      <section className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Tienda online
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Nueva experiencia de compra moderna y minimalista.
            </h1>
            <p className="max-w-xl text-base text-slate-600">
              Rediseñamos la tienda desde cero para que puedas descubrir,
              comprar y seguir tus pedidos en menos pasos, manteniendo el mismo
              stack y la misma base de datos.
            </p>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
              Envío gratis a Necochea y Quequén.
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/products">Ver productos</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/track" className="inline-flex items-center gap-2">
                  Seguir pedido <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative h-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
              {heroImages.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt={`Imagen destacada ${index + 1}`}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                    index === activeHeroImage ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
            {heroImages.length > 1 && (
              <div className="flex justify-center gap-2">
                {heroImages.map((image, index) => (
                  <button
                    key={`${image}-dot-${index}`}
                    type="button"
                    onClick={() => setActiveHeroImage(index)}
                    aria-label={`Ir a imagen ${index + 1}`}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      index === activeHeroImage
                        ? "bg-slate-900"
                        : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            )}
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Feature icon={Sparkles} title="Catálogo limpio">
                Diseño sobrio con foco en producto, precio y stock real.
              </Feature>
              <Feature icon={Truck} title="Checkout unificado">
                Flujo rápido con envío gratis a Necochea y Quequén o retiro en
                tienda.
              </Feature>
              <Feature icon={ShieldCheck} title="Estado y gestión">
                Seguimiento público para clientes y panel admin para
                operaciones.
              </Feature>
            </div>
          </div>
        </div>
      </section>

      <Section
        title="Destacados"
        description="Selección curada con los productos más elegidos."
        loading={loading}
      >
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Section>

      <Section
        title="Novedades"
        description="Ingresos recientes sincronizados desde la base de datos."
        loading={loading}
      >
        {latest.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-slate-700 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{children}</p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
  loading,
}: {
  title: string;
  description: string;
  children: ReactNode;
  loading: boolean;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/products">Ver todo</Link>
        </Button>
      </div>
      {loading ? (
        <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Cargando productos...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {children}
        </div>
      )}
    </section>
  );
}
