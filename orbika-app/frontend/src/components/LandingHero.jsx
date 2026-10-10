import { Link } from "react-router-dom";
import { Button, Badge } from "./ui";

export default function LandingHero({ onExplorarClick }) {
  return (
    <section className="bg-forest text-paper border-b border-forest-deep relative overflow-hidden">
      {/* Fondo orgánico con textura y círculos de luz ambiental */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#C9D6BE_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-moss/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-amber/15 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 lg:pt-16 lg:pb-24 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Columna Izquierda: Mensaje y llamadas a la acción */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
              Alimentos que merecen llegar a tu mesa, <span className="italic text-amber">no al olvido</span>.
            </h1>

            <p className="text-sage-pale/90 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              Conectamos panaderías, huertos y tiendas de barrio en Tacna con familias conscientes. Compra alimentos de calidad próximos a vencer con <strong>precios reducidos</strong> y dile adiós al desperdicio.
            </p>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center gap-2 font-semibold bg-amber hover:bg-amber-deep text-forest-deep hover:text-white px-6 py-3.5 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus:outline-none"
              >
                <span>Explorar alimentos disponibles</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>

              <Link
                to="/registrarse"
                className="inline-flex items-center justify-center gap-2 font-medium bg-forest-deep/60 hover:bg-forest-deep text-paper/90 hover:text-white border border-sage/30 px-5 py-3.5 rounded-2xl transition-all text-center focus-visible:ring-2 focus-visible:ring-amber focus:outline-none"
              >
                <span>Vender excedentes de mi negocio</span>
                <svg className="w-4 h-4 opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>

            {/* Sellos de garantía */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-sage-pale/80 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-moss/40 text-sage-pale flex items-center justify-center font-bold">
                  ✓
                </span>
                <span>Comercios locales de Tacna</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-moss/40 text-sage-pale flex items-center justify-center font-bold">
                  ✓
                </span>
                <span>Precios transparentes sin costo extra</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Escaparate interactivo flotante (Live Rescue Showcase) */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Tarjeta flotante simulada con animación artesanal */}
            <div className="w-full max-w-sm bg-card text-ink border border-sage/50 rounded-3xl p-5 shadow-2xl animate-float-soft relative select-none">
              {/* Badge superior animado */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-amber/20 text-amber-deep font-semibold text-[11px] px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber animate-ping" />
                  Ejemplo de oferta · Pocollay
                </span>
                <span className="text-[11px] text-ink-soft/60 font-mono">
                  Ilustración
                </span>
              </div>

              {/* Imagen artística del alimento */}
              <div className="aspect-[4/3] rounded-2xl bg-paper-warm overflow-hidden relative border border-gray-200 shadow-inner group">
                <div className="w-full h-full bg-gradient-to-tr from-forest-deep/20 via-paper-warm to-amber/10 flex items-center justify-center p-6 text-center">
                  <div className="space-y-2 flex flex-col items-center">
                    <span className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-3xl">
                      🥖
                    </span>
                    <span className="font-serif font-bold text-forest-deep text-sm">
                      Panadería Artesanal Don Manuel
                    </span>
                    <span className="text-[11px] text-ink-soft">
                      Bolsa surtida de pan ciabatta y campesino
                    </span>
                  </div>
                </div>

                {/* Sello de timbre de descuento */}
                <div className="absolute top-3 right-3 bg-terra text-white px-3 py-1.5 rounded-full font-bold text-xs tracking-tight shadow-lg -rotate-6">
                  -50% OFF
                </div>

                {/* Indicador de stock */}
                <div className="absolute bottom-3 left-3 bg-forest-deep/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                  ¡Últimas 2 bolsas del día!
                </div>
              </div>

              {/* Detalle de precios */}
              <div className="mt-4 pt-2 flex items-baseline justify-between border-t border-sage/20">
                <div>
                  <span className="text-[11px] text-ink-soft block font-medium">
                    Precio rescatado
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-bold text-forest-deep">
                      S/ 4.50
                    </span>
                    <span className="text-xs text-ink-soft/50 line-through">
                      S/ 9.00
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-moss font-semibold block">
                    Ahorro directo
                  </span>
                  <span className="text-xs font-bold text-moss bg-moss/10 px-2 py-0.5 rounded-md">
                    S/ 4.50 menos
                  </span>
                </div>
              </div>

              {/* Mensaje de impacto ecológico */}
              <div className="mt-3.5 bg-paper-warm rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-forest-deep">
                <span className="text-sm">🌱</span>
                <span>
                  Coordina el recojo y el pago directamente con el negocio.
                </span>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
}
