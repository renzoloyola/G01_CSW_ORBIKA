import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg className="w-5 h-5 text-moss shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-terra shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-amber-deep shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const BORDERS = {
  success: "border-moss/40 bg-card text-forest-deep",
  error: "border-terra/40 bg-card text-forest-deep",
  info: "border-amber/40 bg-card text-forest-deep",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const newToast = { id, type, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, dur) => addToast("success", msg, dur),
    error: (msg, dur) => addToast("error", msg, dur),
    info: (msg, dur) => addToast("info", msg, dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Región de Toasts flotantes */}
      <div
        aria-live="polite"
        role="region"
        aria-label="Notificaciones del sistema"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl transition-all duration-300 transform animate-in slide-in-from-top-3 fade-in ${
              BORDERS[t.type] || BORDERS.info
            }`}
          >
            {ICONS[t.type] || ICONS.info}
            <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
              {t.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Cerrar notificación"
              className="text-ink-soft/50 hover:text-forest-deep p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-moss focus:outline-none"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de un ToastProvider");
  }
  return context;
}

export default ToastContext;
