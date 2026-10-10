import { Link } from "react-router-dom";

export default function Testimonials() {
  const experiencias = [
    {
      id: 1,
      nombre: "Patricia Valdivia",
      rol: "Compradora frecuente",
      zona: "Pocollay",
      avatarBg: "bg-moss text-white",
      cita: "Encontré panes artesanales y yogures de excelente calidad a mitad de precio en Pocollay. Ahorramos bastante en los desayunos de la semana y da una satisfacción enorme saber que evitamos que comida tan rica termine en la basura.",
      ahorroPromedio: "S/ 140 ahorrados al mes",
    },
    {
      id: 2,
      nombre: "Manuel Quispe",
      rol: "Dueño de Panadería San Martín",
      zona: "Tacna Cercado",
      avatarBg: "bg-amber text-forest-deep",
      cita: "Siempre nos quedaban 15 o 20 piezas frescas al cierre del día. Con ÓrbiKa las publico en 2 minutos desde el celular y los vecinos de la cuadra las reservan de inmediato. Recuperamos costos y cerramos el día con desperdicio cero.",
      ahorroPromedio: "+80 bolsas rescatadas",
    },
    {
      id: 3,
      nombre: "Diego Ramos",
      rol: "Estudiante de la UNJBG",
      zona: "Cono Sur",
      avatarBg: "bg-terra text-white",
      cita: "Viviendo solo en Tacna con presupuesto ajustado, ÓrbiKa es una bendición. Poder comprar fruta fresca y viandas de los minimarkets cercanos a S/ 4 o S/ 5 me ayuda a comer sano sin desbalancear mis gastos del mes.",
      ahorroPromedio: "50% de ahorro semanal",
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-paper-warm/50 border-b border-sage/40">
      <div className="max-w-6xl mx-auto px-4">
        {/* Encabezado editorial */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-semibold text-moss uppercase tracking-wider">
            Ejemplos de demostración
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest-deep mt-1.5">
            Historias ilustrativas en Tacna
          </h2>
          <p className="text-ink-soft text-sm sm:text-base mt-2">
            Personajes y cifras ficticios para ilustrar el uso de la plataforma.
          </p>
        </div>

        {/* Rejilla de testimonios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {experiencias.map((item) => (
            <article
              key={item.id}
              className="bg-card border border-sage/40 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Estrellas de calificación */}
                <div className="flex items-center gap-1 text-amber mb-4" aria-label="5 de 5 estrellas">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>

                {/* Cita */}
                <p className="font-serif italic text-forest-deep text-base sm:text-lg leading-relaxed mb-6">
                  “{item.cita}”
                </p>
              </div>

              <div className="pt-4 border-t border-sage/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${item.avatarBg}`}
                  >
                    {item.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest-deep text-sm leading-tight">
                      {item.nombre}
                    </h3>
                    <p className="text-[11px] text-ink-soft mt-0.5">
                      {item.rol} · <span className="font-medium text-forest">{item.zona}</span>
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-moss bg-moss/10 px-2 py-1 rounded-md shrink-0">
                  {item.ahorroPromedio}
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Franja de invitación comunitaria */}
        <div className="mt-12 bg-forest text-paper rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-forest-deep">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              ¿Tienes un negocio de alimentos en Tacna?
            </h3>
            <p className="text-xs sm:text-sm text-sage-pale/90 max-w-xl">
              Súmate a la red de comercios responsables. Recupera ingresos de tus mermas y conecta con miles de clientes locales.
            </p>
          </div>

          <Link
            to="/registrarse"
            className="shrink-0 bg-amber hover:bg-amber-deep text-forest-deep hover:text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-white focus:outline-none"
          >
            Registrar mi negocio gratis
          </Link>
        </div>
      </div>
    </section>
  );
}
