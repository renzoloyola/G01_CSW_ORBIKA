const VARIANTS = {
  success: {
    badge: "bg-moss/15 text-forest border-moss/25",
    dot: "bg-moss",
  },
  warning: {
    badge: "bg-amber/20 text-amber-deep border-amber/35",
    dot: "bg-amber",
  },
  danger: {
    badge: "bg-terra-pale text-terra border-terra/30",
    dot: "bg-terra",
  },
  info: {
    badge: "bg-sage-pale text-forest-deep border-sage",
    dot: "bg-moss-light",
  },
  brand: {
    badge: "bg-forest text-paper border-forest-deep",
    dot: "bg-amber",
  },
  neutral: {
    badge: "bg-card text-ink-soft border-gray-200",
    dot: "bg-gray-400",
  },
};

export function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  className = "",
  ...props
}) {
  const config = VARIANTS[variant] || VARIANTS.neutral;
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.badge} ${sizeClass} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
