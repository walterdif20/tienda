import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  Clock3,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { categories } from "@/data/products";

const heroFallbackImages = [
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
];

export function HomePage() {
  const { products, loading } = useProducts();
  const { settings } = useStoreSettings();

  const latest = products.slice(0, 4);

  const categoryTiles = useMemo(() => {
    return categories
      .map((category) => {
        const firstProduct = products.find(
          (product) =>
            product.categoryId === category.id && product.images.length > 0,
        );

        if (!firstProduct?.images[0]) {
          return null;
        }

        return {
          id: category.id,
          name: category.name,
          imageUrl: firstProduct.images[0].url,
          imageAlt: firstProduct.images[0].alt || category.name,
        };
      })
      .filter(
        (
          item,
        ): item is {
          id: string;
          name: string;
          imageUrl: string;
          imageAlt: string;
        } => item !== null,
      );
  }, [products]);

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
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroImages]);

  return (
    <div className="space-y-16 pb-16">
      <section className="relative isolate min-h-[78vh] overflow-hidden border-b border-slate-200/30 bg-slate-950 text-white">
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`Imagen de portada ${index + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                index === activeHeroImage ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-slate-950/65" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(167,139,250,0.28),transparent_34%)]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <p className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur">
              {settings.title}
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Un inicio visual, premium y pensado para convertir más.
            </h1>
            <p className="max-w-xl text-base text-white/80 md:text-lg">
              La portada ahora usa las imágenes configuradas desde Admin para
              crear una experiencia inmersiva desde el primer segundo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-white text-slate-950 hover:bg-white/90"
              >
                <Link to="/products">Explorar catálogo</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/track" className="inline-flex items-center gap-2">
                  Seguir pedido <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {heroImages.length > 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {heroImages.map((image, index) => (
                  <button
                    key={`${image}-dot-${index}`}
                    type="button"
                    onClick={() => setActiveHeroImage(index)}
                    aria-label={`Ir a imagen ${index + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === activeHeroImage
                        ? "w-10 bg-white"
                        : "w-2.5 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <GlassFeature icon={Sparkles} title="Diseño impactante">
              Hero full-screen con transición automática y enfoque editorial.
            </GlassFeature>
            <GlassFeature icon={Truck} title="Envío local gratis">
              Entregas sin costo en Necochea y Quequén + retiro en tienda.
            </GlassFeature>
            <GlassFeature icon={ShieldCheck} title="Compra con confianza">
              Seguimiento de pedidos y gestión centralizada para tu operación.
            </GlassFeature>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-3">
        <HighlightCard icon={Star} title="Selección destacada">
          Productos protagonistas con stock actualizado en tiempo real.
        </HighlightCard>
        <HighlightCard icon={Clock3} title="Checkout más ágil">
          Menos pasos para cerrar la compra y confirmar el pedido.
        </HighlightCard>
        <HighlightCard icon={Sparkles} title="Experiencia renovada">
          Estética moderna con foco en contenido, navegación y conversión.
        </HighlightCard>
      </section>

      <CategorySection categoryTiles={categoryTiles} loading={loading} />

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

function GlassFeature({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
      <div className="mb-2 inline-flex rounded-xl bg-white/20 p-2 text-white">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-white/80">{children}</p>
    </div>
  );
}

function HighlightCard({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{children}</p>
    </article>
  );
}

function CategorySection({
  categoryTiles,
  loading,
}: {
  categoryTiles: Array<{
    id: string;
    name: string;
    imageUrl: string;
    imageAlt: string;
  }>;
  loading: boolean;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Categorías</h2>
        <p className="text-sm text-slate-500">
          Explorá por tipo de producto desde una vista rápida visual.
        </p>
      </div>
      {loading ? (
        <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Cargando categorías...
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryTiles.map((category) => (
            <Link
              key={category.id}
              to="/products"
              className="group relative block h-44 overflow-hidden rounded-2xl"
            >
              <img
                src={category.imageUrl}
                alt={category.imageAlt}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
              <p className="absolute bottom-3 left-3 text-sm font-semibold text-white">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{children}</div>
      )}
    </section>
  );
}
