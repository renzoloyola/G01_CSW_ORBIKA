import { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

export function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Ingresa la información",
  description,
  label = "Motivo",
  placeholder = "Escribe aquí…",
  initialValue = "",
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  required = true,
  loading = false,
  multiline = false,
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError("");
    }
  }, [isOpen, initialValue]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (required && !trimmed) {
      setError("Este campo es obligatorio.");
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <form onSubmit={handleSubmit} className="mt-4">
        <label className="block text-xs font-semibold text-ink-soft uppercase mb-1.5">
          {label}
        </label>
        {multiline ? (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
          />
        )}
        {error && (
          <p role="alert" className="text-terra text-xs mt-1.5 font-medium">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default PromptModal;
