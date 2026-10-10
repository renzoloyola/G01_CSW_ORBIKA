export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      tag: "Comercio local",
      title: "Comercios publican sus excedentes",
      desc: "Panaderías, verdulerías y minimarkets de Tacna registran alimentos en perfecto estado que no se vendieron en el turno o están próximos a su fecha declarada.",
      icon: (
        <svg className="w-6 h-6 text-forest-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      num: "02",
      tag: "Tu oportunidad",
      title: "Tú eliges y ahorras hasta 70%",
      desc: "Navegas los productos disponibles cerca de tu casa o trabajo. Reservas con un par de clics a una fracción de su precio regular de mercado.",
      icon: (
        <svg className="w-6 h-6 text-forest-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 18V6" />
        </svg>
      ),
    },
    {
      num: "03",
      tag: "Impacto real",
      title: "Recoges y cierras el círculo",
      desc: "Retiras tu paquete en el local comercial o coordinas entrega rápida. Disfrutas alimentos frescos, ahorras dinero y previenes la pérdida de alimentos.",
      icon: (
        <svg className="w-6 h-6 text-forest-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21c-4-2-7-6-7-10a7 7 0 0 1 14 0c0 4-3 8-7 10Z" />
          <path d="M12 11v6" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-paper border-b border-sage/40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-semibold text-moss uppercase tracking-wider">
            Consumo consciente en 3 pasos
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest-deep mt-1.5">
            ¿Cómo funciona el rescate circular?
          </h2>
          <p className="text-ink-soft text-sm sm:text-base mt-2">
            Una solución sencilla donde ganan tu bolsillo, el comerciante tacneño y el medio ambiente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.num}
              className="bg-card border border-sage/50 hover:border-moss/40 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-card transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif text-2xl font-bold text-amber">
                    {s.num}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-paper-warm group-hover:bg-sage/30 flex items-center justify-center transition-colors">
                    {s.icon}
                  </div>
                </div>

                <span className="text-[11px] font-bold uppercase tracking-wider text-moss block mb-1">
                  {s.tag}
                </span>

                <h3 className="font-serif text-xl font-bold text-forest-deep mb-2">
                  {s.title}
                </h3>

                <p className="text-ink-soft text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-sage/20 text-xs text-forest font-medium flex items-center gap-1">
                <span>Comunidad responsable</span>
                <span aria-hidden="true">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
