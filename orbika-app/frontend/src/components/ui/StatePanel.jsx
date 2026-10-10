import Button from "./Button";

const ICONS = {
  empty: (
    <svg
      className="w-12 h-12 text-forest/40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  error: (
    <svg
      className="w-12 h-12 text-terra"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  success: (
    <svg
      className="w-12 h-12 text-moss"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  info: (
    <svg
      className="w-12 h-12 text-amber-deep"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export function StatePanel({
  type = "empty",
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "primary",
  children,
  className = "",
}) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`bg-card border border-dashed border-sage/60 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 shadow-sm ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-paper-warm flex items-center justify-center mb-4">
        {ICONS[type] || ICONS.empty}
      </div>

      {title && (
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-forest-deep mb-2">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-ink-soft text-sm sm:text-base max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {children}

      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          onClick={onAction}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default StatePanel;
