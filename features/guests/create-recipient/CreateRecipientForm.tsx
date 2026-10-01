"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createRecipient, type CreateRecipientState } from "./action";

const initialState: CreateRecipientState = {};

export function CreateRecipientForm() {
  const [state, formAction] = useActionState(createRecipient, initialState);

  return (
    <form
      action={formAction}
      className="rounded-[22px] border border-midnight-navy/10 bg-white px-5 py-5 shadow-[0_12px_34px_rgba(16,42,67,0.025)] sm:px-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-mauve">
            Nuevo destinatario
          </p>
          <h2 className="mt-2 font-serif text-[1.9rem] font-semibold leading-tight text-midnight-navy">
            Añadir invitado
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-5 text-midnight-navy/62">
          Crea una invitación personalizada para una persona, pareja o familia.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.9fr_160px]">
        <label className="block">
          <span className="text-sm font-semibold text-midnight-navy">
            Nombre de invitación
          </span>
          <input
            className="mt-2 min-h-11 w-full rounded-2xl border border-midnight-navy/10 bg-porcelain px-4 text-sm text-midnight-navy outline-none transition-colors placeholder:text-midnight-navy/35 focus:border-muted-mauve"
            name="displayName"
            placeholder="Familia Pérez"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-midnight-navy">
            Teléfono
          </span>
          <input
            className="mt-2 min-h-11 w-full rounded-2xl border border-midnight-navy/10 bg-porcelain px-4 text-sm text-midnight-navy outline-none transition-colors placeholder:text-midnight-navy/35 focus:border-muted-mauve"
            inputMode="tel"
            name="phone"
            placeholder="+51 987 654 321"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-midnight-navy">
            Pases
          </span>
          <input
            className="mt-2 min-h-11 w-full rounded-2xl border border-midnight-navy/10 bg-porcelain px-4 text-sm text-midnight-navy outline-none transition-colors focus:border-muted-mauve"
            defaultValue={1}
            min={1}
            max={20}
            name="maxGuests"
            required
            type="number"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={[
            "text-sm font-medium",
            state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
          ].join(" ")}
        >
          {state.error ?? state.success ?? ""}
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-muted-mauve px-5 text-sm font-semibold text-white transition-colors hover:bg-[#7D5F78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve disabled:cursor-not-allowed disabled:bg-muted-mauve/45"
      disabled={pending}
      type="submit"
    >
      {pending ? "Creando..." : "Añadir invitado"}
    </button>
  );
}
