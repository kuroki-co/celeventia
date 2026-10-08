"use client";

import { Music2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { WeddingInvitationContent } from "@/invitation/renderer/types";

import { suggestSong, type SuggestSongState } from "./action";

type PublicSongSuggestionFormProps = {
  config: NonNullable<WeddingInvitationContent["songSuggestions"]>;
  slug: string;
};

const initialState: SuggestSongState = {};

export function PublicSongSuggestionForm({
  config,
  slug,
}: PublicSongSuggestionFormProps) {
  const [state, formAction] = useActionState(suggestSong, initialState);

  return (
    <div className="mx-auto max-w-2xl border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)]/72 px-5 py-8 text-center shadow-[0_18px_60px_rgba(16,42,67,0.08)] sm:px-8">
      <div className="mx-auto grid size-12 place-items-center rounded-full border border-[color:var(--inv-border)] text-[color:var(--inv-secondary)]">
        <Music2 aria-hidden="true" className="size-5" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase text-[color:var(--inv-secondary)]">
        Musica
      </p>
      <h2 className="mt-3 font-serif text-[2.25rem] font-normal leading-tight text-[color:var(--inv-primary)] sm:text-[2.8rem]">
        {config.title || "Sugiere una cancion"}
      </h2>
      {config.description ? (
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--inv-muted)]">
          {config.description}
        </p>
      ) : null}

      <form action={formAction} className="mt-7 grid gap-3 text-left">
        <input name="slug" type="hidden" value={slug} />
        <TextField
          defaultValue={state.values?.songTitle ?? ""}
          label="Cancion"
          name="songTitle"
          required
        />
        <TextField
          defaultValue={state.values?.artist ?? ""}
          label="Artista"
          name="artist"
        />
        <TextField
          defaultValue={state.values?.requesterName ?? ""}
          label="Tu nombre"
          name="requesterName"
          required
        />
        <SubmitButton />
        <p
          aria-live="polite"
          className={[
            "min-h-5 text-center text-sm font-semibold",
            state.error ? "text-[#8A3A3A]" : "text-[color:var(--inv-primary)]",
          ].join(" ")}
        >
          {state.error ?? state.success ?? ""}
        </p>
      </form>
    </div>
  );
}

function TextField({
  defaultValue,
  label,
  name,
  required,
}: {
  defaultValue: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--inv-primary)]">
      {label}
      <input
        className="min-h-11 rounded-none border border-[color:var(--inv-border)] bg-[color:var(--inv-background)]/72 px-4 text-sm font-medium text-[color:var(--inv-text)] outline-none transition focus:border-[color:var(--inv-secondary)]"
        defaultValue={defaultValue}
        name={name}
        required={required}
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--inv-primary)] px-5 text-sm font-semibold text-[color:var(--inv-surface)] transition hover:opacity-90 disabled:cursor-wait disabled:opacity-55"
      disabled={pending}
      type="submit"
    >
      {pending ? "Guardando..." : "Enviar sugerencia"}
    </button>
  );
}
