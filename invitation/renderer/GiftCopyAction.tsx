"use client";

import { useEffect, useState } from "react";

type GiftCopyActionProps = {
  label: string;
  value: string;
};

export function GiftCopyAction({ label, value }: GiftCopyActionProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setStatus("idle"), 1800);

    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <span className="inline-flex min-h-10 flex-col items-center justify-start gap-1">
      <button
        aria-label={`${label}: copiar ${value}`}
        className="inline-flex min-h-6 items-center justify-center text-sm font-semibold leading-6 text-[color:var(--inv-primary)] underline decoration-[color:var(--inv-border)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--inv-secondary)] hover:decoration-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--inv-secondary)]"
        onClick={copyValue}
        type="button"
      >
        {label} <span aria-hidden="true">→</span>
      </button>
      <span
        aria-live="polite"
        className={[
          "min-h-4 text-xs font-medium leading-4",
          status === "error"
            ? "text-[#8A3A3A]"
            : "text-[color:var(--inv-secondary)]",
        ].join(" ")}
      >
        {status === "copied"
          ? "Copiado"
          : status === "error"
            ? "No se pudo copiar"
            : ""}
      </span>
    </span>
  );
}
