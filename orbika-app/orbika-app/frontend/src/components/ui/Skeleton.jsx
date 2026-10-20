export function SkeletonBase({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-sage/30 rounded-xl ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      role="status"
      aria-label="Cargando producto…"
      className="bg-card border border-sage/30 rounded-2xl overflow-hidden shadow-card p-0 flex flex-col"
    >
      <span className="sr-only">Cargando producto…</span>
      {/* Imagen falsa */}
      <SkeletonBase className="aspect-[4/3] w-full rounded-none" />

      {/* Contenido */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <SkeletonBase className="h-4 w-20 rounded-full" />
            <SkeletonBase className="h-4 w-14 rounded-full" />
          </div>
          <SkeletonBase className="h-5 w-4/5 mb-1" />
          <SkeletonBase className="h-4 w-2/3" />
        </div>

        <div className="pt-2 border-t border-sage/20 space-y-2">
          <div className="flex items-baseline gap-2">
            <SkeletonBase className="h-6 w-24" />
            <SkeletonBase className="h-4 w-16" />
          </div>
          <SkeletonBase className="h-3 w-36" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div
      role="status"
      aria-label="Cargando detalle del producto…"
      className="max-w-4xl mx-auto px-4 py-8 grid sm:grid-cols-2 gap-8"
    >
      <span className="sr-only">Cargando detalle del producto…</span>
      <SkeletonBase className="aspect-square w-full rounded-3xl" />
      <div className="space-y-4">
        <SkeletonBase className="h-4 w-24 rounded-full" />
        <SkeletonBase className="h-8 w-3/4" />
        <SkeletonBase className="h-6 w-1/3" />
        <SkeletonBase className="h-12 w-full rounded-xl" />
        <div className="space-y-2 pt-4">
          <SkeletonBase className="h-4 w-full" />
          <SkeletonBase className="h-4 w-5/6" />
          <SkeletonBase className="h-4 w-2/3" />
        </div>
        <div className="pt-6 space-y-3">
          <SkeletonBase className="h-12 w-full rounded-xl" />
          <SkeletonBase className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonOrder() {
  return (
    <div
      role="status"
      aria-label="Cargando pedido…"
      className="bg-card border border-sage/30 rounded-2xl p-5 shadow-card space-y-3"
    >
      <span className="sr-only">Cargando pedido…</span>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBase className="h-5 w-48" />
          <SkeletonBase className="h-4 w-32" />
        </div>
        <SkeletonBase className="h-6 w-24 rounded-full" />
      </div>
      <div className="pt-3 border-t border-sage/20 flex gap-2">
        <SkeletonBase className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div
      role="status"
      aria-label="Cargando catálogo…"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      <span className="sr-only">Cargando productos…</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default SkeletonBase;
