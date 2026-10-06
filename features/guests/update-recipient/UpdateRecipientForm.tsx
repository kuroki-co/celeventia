"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { InvitationRecipient } from "../list-recipients/types";
import { updateRecipient, type UpdateRecipientState } from "./action";

const initialState: UpdateRecipientState = {};

export function UpdateRecipientForm({
  recipient,
}: {
  recipient: InvitationRecipient;
}) {
  const [state, formAction] = useActionState(updateRecipient, initialState);

  return (
    <details className="mt-4 rounded-2xl border border-midnight-navy/10 bg-porcelain p-3">
      <summary className="cursor-pointer text-sm font-semibold text-muted-mauve">
        Editar invitado
      </summary>
      <form action={formAction} className="mt-4 grid gap-3">
        <input name="recipientId" type="hidden" value={recipient.id} />
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.9fr_120px]">
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Nombre del invitado o familia
            <input
              className={inputClassName}
              defaultValue={recipient.displayName}
              name="displayName"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Telefono opcional
            <input
              className={inputClassName}
              defaultValue={recipient.phone ?? ""}
              inputMode="tel"
              name="phone"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Pases
            <input
              className={inputClassName}
              defaultValue={recipient.maxGuests}
              max={20}
              min={1}
              name="maxGuests"
              required
              type="number"
            />
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className={[
              "text-sm font-semibold",
              state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
            ].join(" ")}
          >
            {state.error ?? state.success ?? ""}
          </p>
          <SubmitButton />
        </div>
      </form>
    </details>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-muted-mauve/25 px-4 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5 disabled:cursor-wait disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

const inputClassName =
  "min-h-10 rounded-2xl border border-midnight-navy/10 bg-white px-3 text-sm text-midnight-navy outline-none transition-colors focus:border-muted-mauve";
