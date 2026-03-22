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
  CreditCard,
  Gift,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";
import { useFavorites } from "@/hooks/use-favorites";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useCategories } from "@/hooks/use-categories";
import { getCategoryLabel, getCategoryTree } from "@/lib/categories";
import {
  getCollectionById,
  productCollections,
  productMatchesCollection,
} from "@/lib/collections";

const heroFallbackImages = [
  "https://firebasestorage.googleapis.com/v0/b/madd-tienda.firebasestorage.app/o/store-settings%2Fhero-1773631266344-ChatGPT%20Image%2015%20mar%202026%2C%2011_36_25%20p.m..png?alt=media&token=5ad1a120-5517-42e0-a72c-d209beb39ba3",
  "https://firebasestorage.googleapis.com/v0/b/madd-tienda.firebasestorage.app/o/store-settings%2Fhero-1773631257462-ChatGPT%20Image%2015%20mar%202026%2C%2011_37_33%20p.m..png?alt=media&token=8adfd549-508a-4fdf-841a-51b5f4dff683",
];

export function HomePage() {
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const { settings } = useStoreSettings();
  const { isFavorite, toggleFavorite } = useFavorites();

  const latest = products.slice(0, 4);
  const trending = products
    .filter((product) => productMatchesCollection(product, "trending"))
    .slice(0, 4);

  const categoryTiles = useMemo(() => {
    return getCategoryTree(categories)
      .map(({ category, subcategories }) => {
        const firstProduct = products.find(
          (product) =>
            (product.categoryId === category.id ||
              subcategories.some(
                (subcategory) => subcategory.id === product.categoryId,
              )) &&
            product.images.length > 0,
        );

        if (!firstProduct?.images[0]) {
          return null;
        }

        return {
          id: category.id,
          name: getCategoryLabel(category),
          imageUrl: firstProduct.images[0].url,
          imageAlt: firstProduct.images[0].alt || getCategoryLabel(category),
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
  }, [categories, products]);

  const occasionCards = useMemo(
    () =>
      productCollections.slice(0, 4).map((collection) => ({
        ...collection,
        coverImage:
          products.find((product) =>
            productMatchesCollection(product, collection.id),
          )?.images[0]?.url ?? heroFallbackImages[0],
      })),
    [products],
  );

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
          <div className="absolute inset-0 bg-slate-950/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(167,139,250,0.28),transparent_34%)]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <p className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur">
              {settings.title}
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Una tienda que te ayuda a elegir, comprar rápido y volver.
            </h1>
            <p className="max-w-xl text-base text-white/80 md:text-lg">
              Colecciones por ocasión, stock actualizado, quick shop y una
              compra simple de principio a fin.
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
                <Link
                  to="/products?collection=gift"
                  className="inline-flex items-center gap-2"
                >
                  Comprar por ocasión <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-white/90 md:text-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                {products.length}+ productos activos
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                {categoryTiles.length} categorías para explorar
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                10% OFF pagando por transferencia
              </span>
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

          <HeroDetails />
        </div>
      </section>

      <section className="mx-auto grid max-w-9xl gap-4 px-4 md:grid-cols-3">
        <HighlightCard icon={Gift} title="Comprar por ocasión">
          Curaduría para regalos, básicos diarios, looks con presencia y últimas
          unidades.
        </HighlightCard>
        <HighlightCard icon={Clock3} title="Checkout más claro">
          Resumen visible de ahorro, puntos y beneficios antes de confirmar tu
          compra.
        </HighlightCard>
        <HighlightCard icon={Sparkles} title="Postcompra cuidada">
          Seguimiento visual y club de puntos para que volver tenga sentido.
        </HighlightCard>
      </section>

      <CollectionSection occasionCards={occasionCards} />

      <CategorySection categoryTiles={categoryTiles} loading={loading} />

      <Section
        title="En tendencia"
        description="Una selección editorial con productos protagonistas, regalos e ideas rápidas para decidir mejor."
        loading={loading}
        ctaHref="/products?collection=trending"
      >
        {trending.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFavorite={isFavorite(product.id)}
            onToggleFavorite={(productId) => void toggleFavorite(productId)}
          />
        ))}
      </Section>

      <Section
        title="Novedades"
        description="Ingresos recientes sincronizados desde la base de datos."
        loading={loading}
        ctaHref="/products"
      >
        {latest.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFavorite={isFavorite(product.id)}
            onToggleFavorite={(productId) => void toggleFavorite(productId)}
          />
        ))}
      </Section>
    </div>
  );
}

function HeroDetails() {
  return (
    <aside className="hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur md:block">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
        ¿Por qué comprar acá?
      </p>
      <ul className="mt-4 space-y-4">
        <HeroFeature icon={Truck} title="Envíos rápidos">
          Despachamos tu pedido en 24/48 hs hábiles.
        </HeroFeature>
        <HeroFeature icon={ShieldCheck} title="Pago seguro">
          Checkout protegido y confirmación inmediata.
        </HeroFeature>
        <HeroFeature icon={CreditCard} title="Ahorro visible">
          Transferencia con 10% OFF y programa de puntos desde el carrito.
        </HeroFeature>
      </ul>
    </aside>
  );
}

function HeroFeature({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-white/20 bg-slate-950/25 p-4">
      <div className="inline-flex rounded-xl bg-white/10 p-2 text-white">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
      <p className="text-sm text-white/75">{children}</p>
    </li>
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

function CollectionSection({
  occasionCards,
}: {
  occasionCards: Array<{
    id: string;
    label: string;
    description: string;
    heroDescription: string;
    coverImage: string;
  }>;
}) {
  return (
    <section className="mx-auto max-w-9xl px-4">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Comprar por ocasión
          </h2>
          <p className="text-sm text-slate-500">
            Una capa editorial sobre el catálogo para decidir más rápido sin
            tener que saber exactamente qué buscar.
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/products">Ver catálogo completo</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {occasionCards.map((collection) => (
          <Link
            key={collection.id}
            to={`/products?collection=${collection.id}`}
            className="group relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white"
          >
            <img
              src={collection.coverImage}
              alt={collection.label}
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" />
            <div className="relative flex min-h-72 flex-col justify-end p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                {getCollectionById(collection.id)?.shortLabel}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{collection.label}</h3>
              <p className="mt-2 text-sm text-white/75">
                {collection.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white">
                Explorar ahora <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
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
    <section className="mx-auto max-w-9xl px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Categorías</h2>
        <p className="text-sm text-slate-500">
          Explorá por tipo de producto desde una vista rápida visual.
        </p>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CategorySkeleton key={`category-skeleton-${index}`} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryTiles.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="group relative block h-56 overflow-hidden rounded-2xl md:h-64"
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

function CategorySkeleton() {
  return (
    <article className="h-56 animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 md:h-64">
      <div className="h-full w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100" />
    </article>
  );
}

function ProductSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-72 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
      </div>
    </article>
  );
}

function Section({
  title,
  description,
  children,
  loading,
  ctaHref,
}: {
  title: string;
  description: string;
  children: ReactNode;
  loading: boolean;
  ctaHref: string;
}) {
  return (
    <section className="mx-auto max-w-9xl px-4">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <Button variant="ghost" asChild>
          <Link to={ctaHref}>Ver todo</Link>
        </Button>
      </div>
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductSkeleton key={`product-skeleton-${index}`} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {children}
        </div>
      )}
    </section>
  );
}
