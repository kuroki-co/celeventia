"use client";

import { useEffect, useState } from "react";

type GiftCopyActionProps = {
  label: string;
  value: string;
};

export function GiftCopyAction({ label, value }: GiftCopyActionProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1600);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
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
        className="min-h-4 text-xs font-medium leading-4 text-[color:var(--inv-secondary)]"
      >
        {copied ? "Copiado" : ""}
      </span>
    </span>
  );
}
