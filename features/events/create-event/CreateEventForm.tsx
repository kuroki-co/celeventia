"use client";

import { useActionState, useState } from "react";

import { createPersonalEvent, type CreateEventState } from "./action";

const initialState: CreateEventState = {};

export function CreateEventForm() {
  const [state, formAction, pending] = useActionState(
    createPersonalEvent,
    initialState,
  );
  const [hasDate, setHasDate] = useState("yes");

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
          Nombre visible de la primera persona
          <input
            className="min-h-12 rounded-2xl border border-midnight-navy/12 bg-white px-4 text-base font-medium outline-none transition focus:border-muted-mauve"
            name="partnerOneName"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
          Nombre visible de la segunda persona
          <input
            className="min-h-12 rounded-2xl border border-midnight-navy/12 bg-white px-4 text-base font-medium outline-none transition focus:border-muted-mauve"
            name="partnerTwoName"
            required
          />
        </label>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-midnight-navy">
          Orden de los nombres
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-midnight-navy/12 bg-white px-4 text-sm font-semibold text-midnight-navy">
            <input
              className="accent-muted-mauve"
              defaultChecked
              name="nameOrder"
              type="radio"
              value="partner_one_first"
            />
            Primera persona primero
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-midnight-navy/12 bg-white px-4 text-sm font-semibold text-midnight-navy">
            <input
              className="accent-muted-mauve"
              name="nameOrder"
              type="radio"
              value="partner_two_first"
            />
            Segunda persona primero
          </label>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
        <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
          Fecha
          <input
            className="min-h-12 rounded-2xl border border-midnight-navy/12 bg-white px-4 text-base font-medium outline-none transition focus:border-muted-mauve disabled:bg-midnight-navy/5"
            disabled={hasDate === "no"}
            name="eventDate"
            type="date"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
          Zona horaria
          <input
            className="min-h-12 rounded-2xl border border-midnight-navy/12 bg-white px-4 text-base font-medium outline-none transition focus:border-muted-mauve"
            defaultValue="America/Lima"
            name="eventTimezone"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm font-semibold text-midnight-navy">
        <input
          className="accent-muted-mauve"
          name="hasDate"
          onChange={(event) => setHasDate(event.target.checked ? "no" : "yes")}
          type="checkbox"
          value="no"
        />
        Aun no tenemos fecha
      </label>
      <input name="hasDate" type="hidden" value={hasDate} />

      <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
        Ciudad
        <input
          className="min-h-12 rounded-2xl border border-midnight-navy/12 bg-white px-4 text-base font-medium outline-none transition focus:border-muted-mauve"
          name="city"
          placeholder="Lima"
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-[#8A3A3A]/20 bg-[#8A3A3A]/5 px-4 py-3 text-sm font-semibold text-[#8A3A3A]">
          {state.error}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-muted-mauve px-5 text-sm font-semibold text-white transition hover:bg-[#7D5F78] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creando..." : "Crear nuestra invitacion"}
      </button>
    </form>
  );
}
