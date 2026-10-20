import { forwardRef } from "react";

const VARIANTS = {
  primary: "bg-forest hover:bg-forest-deep text-white shadow-sm border border-transparent",
  secondary: "bg-paper-warm hover:bg-sage/40 text-forest-deep border border-forest/15",
  amber: "bg-amber hover:bg-amber-deep text-forest-deep hover:text-white font-semibold shadow-sm border border-transparent",
  danger: "bg-terra hover:bg-terra/90 text-white shadow-sm border border-transparent",
  outline: "bg-transparent hover:bg-forest/5 text-forest border border-forest/30 hover:border-forest",
  ghost: "bg-transparent hover:bg-forest/10 text-forest-deep border border-transparent",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 min-h-[36px]",
  md: "text-sm px-4 py-2 min-h-[42px]",
  lg: "text-base px-5 py-3 min-h-[48px]",
};

export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    disabled = false,
    icon = null,
    children,
    className = "",
    type = "button",
    ...props
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;
  const widthClass = fullWidth ? "w-full" : "";
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? "true" : undefined}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Cargando…</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
});

export default Button;
