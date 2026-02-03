import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { seedProducts } from "@/data/products";

const featured = seedProducts.filter((product) => product.featured).slice(0, 4);
const newItems = seedProducts.slice(0, 4);
const bracelets = seedProducts.filter((product) => product.categoryId === "bracelets").slice(0, 4);
const necklaces = seedProducts.filter((product) => product.categoryId === "necklaces").slice(0, 4);

export function HomePage() {
  return (
    <div>
      <section className="bg-grid">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Accesorios delicados
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Una tienda minimalista para tus combinaciones favoritas.
            </h1>
            <p className="text-base text-slate-600">
              Cadenitas, pulseras y anillos pensados para acompañarte todos los días.
              Compra en minutos, con o sin cuenta.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link to="/products">Explorar catálogo</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link to="/checkout">Comprar rápido</Link>
              </Button>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Compra simple</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>✔️ Checkout invitado con seguimiento por token</li>
              <li>✔️ Pagos con Mercado Pago Checkout Pro</li>
              <li>✔️ Envío a domicilio o retiro coordinado</li>
              <li>✔️ Catálogo actualizado con stock real</li>
            </ul>
            <Button variant="secondary" asChild>
              <Link to="/track" className="flex items-center gap-2">
                Seguir pedido <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Section title="Nuevos" description="Lo último que sumamos a la colección.">
        {newItems.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Section>

      <Section title="Destacados" description="Favoritos de la comunidad.">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Section>

      <Section title="Pulseras" description="Detalles livianos para todos los días.">
        {bracelets.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Section>

      <Section title="Cadenitas" description="Capas delicadas para tus looks favoritos.">
        {necklaces.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Section>
    </div>
  );
}

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/products" className="flex items-center gap-2 text-sm">
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}
