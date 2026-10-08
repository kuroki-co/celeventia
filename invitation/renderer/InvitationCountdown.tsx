"use client";

import { CalendarPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  buildGoogleCalendarUrl,
  buildIcsFile,
  getCountdownParts,
  type CountdownParts,
} from "../calendar";

type InvitationCountdownProps = {
  dateLabel: string;
  description?: string | null;
  location?: string | null;
  startIso: string;
  title: string;
};

export function InvitationCountdown({
  dateLabel,
  description,
  location,
  startIso,
  title,
}: InvitationCountdownProps) {
  const [parts, setParts] = useState<CountdownParts | null>(null);
  const calendarUrl = useMemo(
    () =>
      buildGoogleCalendarUrl({
        date: startIso.slice(0, 10),
        description,
        location,
        startTime: startIso.slice(11, 16),
        summary: title,
        timeZone: "America/Lima",
      }),
    [description, location, startIso, title],
  );

  useEffect(() => {
    function update() {
      setParts(getCountdownParts(startIso));
    }

    update();

    const interval = window.setInterval(update, 1000);

    function handleVisibilityChange() {
      if (!document.hidden) {
        update();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startIso]);

  function downloadIcs() {
    const ics = buildIcsFile({
      date: startIso.slice(0, 10),
      description,
      location,
      startTime: startIso.slice(11, 16),
      summary: title,
      timeZone: "America/Lima",
    });

    if (!ics) {
      return;
    }

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "celeventia-guardar-fecha.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  const statusText =
    parts?.state === "past"
      ? "Gracias por acompanarnos"
      : parts?.state === "today"
        ? "Hoy celebramos"
        : "Faltan";
  const values = parts ?? {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    state: "future" as const,
  };

  return (
    <div className="mx-auto mt-7 grid max-w-2xl gap-5">
      <p className="sr-only">
        La fecha del evento es {dateLabel}. El contador se actualiza visualmente
        cada segundo.
      </p>
      <div className="rounded-[22px] border border-[color:var(--inv-border)]/70 bg-[color:var(--inv-surface)]/62 px-4 py-5 text-center shadow-[0_18px_50px_rgba(16,42,67,0.07)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--inv-secondary)]">
          {statusText}
        </p>
        {values.state === "future" ? (
          <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
            <CountdownCell label="Dias" value={values.days} />
            <CountdownCell label="Horas" value={values.hours} />
            <CountdownCell label="Min" value={values.minutes} />
            <CountdownCell label="Seg" value={values.seconds} />
          </div>
        ) : (
          <p className="mt-3 font-serif text-[2rem] leading-tight text-[color:var(--inv-primary)]">
            {values.state === "today"
              ? "El gran dia llego"
              : "Gracias por ser parte de nuestra historia"}
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--inv-primary)] px-5 text-sm font-semibold text-white transition hover:opacity-92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-accent)]"
          onClick={downloadIcs}
          type="button"
        >
          <CalendarPlus aria-hidden="true" className="size-4" />
          Guardar la fecha
        </button>
        {calendarUrl ? (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)]/70 px-5 text-sm font-semibold text-[color:var(--inv-primary)] transition hover:bg-[color:var(--inv-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-accent)]"
            href={calendarUrl}
            rel="noreferrer"
            target="_blank"
          >
            Google Calendar
          </a>
        ) : null}
      </div>
    </div>
  );
}

function CountdownCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[color:var(--inv-border)]/55 bg-[color:var(--inv-bg)]/60 px-2 py-3">
      <p className="font-sans text-[clamp(1.35rem,8vw,2.35rem)] font-semibold leading-none tabular-nums text-[color:var(--inv-primary)]">
        {value}
      </p>
      <p className="mt-2 truncate text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--inv-muted)] sm:text-[0.68rem]">
        {label}
      </p>
    </div>
  );
}
