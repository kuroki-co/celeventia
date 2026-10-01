"use client";

import { Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type CopyPublicUrlButtonProps = {
  href: string;
  publicUrl: string;
};

export function CopyPublicUrlButton({
  href,
  publicUrl,
}: CopyPublicUrlButtonProps) {
  const [message, setMessage] = useState("");

  async function copyUrl() {
    await navigator.clipboard.writeText(publicUrl);
    setMessage("URL copiada");
    window.setTimeout(() => setMessage(""), 2200);
  }

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-muted-mauve/20 px-4 text-sm font-semibold text-muted-mauve transition-colors hover:border-muted-mauve/35 hover:bg-muted-mauve/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
        onClick={copyUrl}
        type="button"
      >
        <Copy aria-hidden="true" className="size-4" />
        Copiar URL
      </button>
      <Link
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-midnight-navy/10 px-4 text-sm font-semibold text-midnight-navy/72 transition-colors hover:border-muted-mauve/25 hover:text-muted-mauve focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
        href={href}
        target="_blank"
      >
        <ExternalLink aria-hidden="true" className="size-4" />
        Ver invitacion
      </Link>
      <span aria-live="polite" className="text-sm font-semibold text-[#24523D]">
        {message}
      </span>
    </div>
  );
}
