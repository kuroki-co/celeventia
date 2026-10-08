"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createRecipient, type CreateRecipientState } from "./action";

const initialState: CreateRecipientState = {};

export function CreateRecipientForm() {
  const [state, formAction] = useActionState(createRecipient, initialState);
  const values = state.values;

  return (
    <form
      action={formAction}
      className="rounded-[22px] border border-midnight-navy/10 bg-white px-5 py-5 shadow-[0_12px_34px_rgba(16,42,67,0.025)] sm:px-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-mauve">
            Nuevo invitado
          </p>
          <h2 className="mt-2 font-serif text-[1.9rem] font-semibold leading-tight text-midnight-navy">
            Añadir invitado
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-5 text-midnight-navy/65">
          Crea una invitación personalizada para una persona, pareja o familia.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.9fr_160px]">
        <TextField
          defaultValue={values?.displayName ?? ""}
          error={state.fieldErrors?.displayName}
          label="Nombre de invitación"
          name="displayName"
          placeholder="Familia Pérez"
          required
        />
        <TextField
          defaultValue={values?.phone ?? ""}
          error={state.fieldErrors?.phone}
          help="Usa un celular peruano de 9 dígitos o un número internacional con +."
          inputMode="tel"
          label="Teléfono (opcional)"
          name="phone"
          placeholder="+51 987 654 321"
        />
        <TextField
          defaultValue={values?.maxGuests ?? "1"}
          error={state.fieldErrors?.maxGuests}
          label="Pases"
          max={20}
          min={1}
          name="maxGuests"
          required
          type="number"
        />
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

function TextField({
  defaultValue,
  error,
  help,
  inputMode,
  label,
  max,
  min,
  name,
  placeholder,
  required = false,
  type = "text",
}: {
  defaultValue: string;
  error?: string;
  help?: string;
  inputMode?: "tel";
  label: string;
  max?: number;
  min?: number;
  name: "displayName" | "maxGuests" | "phone";
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  const helpId = `${name}-help`;
  const errorId = `${name}-error`;
  const describedBy = [help ? helpId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="block">
      <span className="text-sm font-semibold text-midnight-navy">{label}</span>
      <input
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        className="mt-2 min-h-11 w-full rounded-2xl border border-midnight-navy/12 bg-white px-4 text-sm font-medium text-midnight-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition placeholder:text-midnight-navy/38 hover:border-midnight-navy/22 focus:border-muted-mauve focus:ring-4 focus:ring-muted-mauve/10 aria-invalid:border-[#8A3A3A]"
        defaultValue={defaultValue}
        inputMode={inputMode}
        key={`${name}-${defaultValue}`}
        max={max}
        min={min}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      {help ? (
        <span className="mt-1 block text-xs leading-5 text-midnight-navy/65" id={helpId}>
          {help}
        </span>
      ) : null}
      <FieldError id={errorId} message={error} />
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span className="mt-1 block text-xs font-semibold text-[#8A3A3A]" id={id}>
      {message}
    </span>
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
