"use client";

import Link from "next/link";
import { Check, MailOpen, Palette, RotateCcw, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { InvitationThemeThumbnail } from "@/invitation/renderer/InvitationThemeThumbnail";
import { WeddingInvitation } from "@/invitation/renderer/WeddingInvitation";
import {
  getInvitationPalette,
  getInvitationTheme,
  invitationPalettes,
  invitationThemes,
  type InvitationPaletteId,
  type InvitationThemeId,
} from "@/invitation/themes";
import { changeInvitationDesign } from "../change-design/action";
import type { PersonalInvitationEvent } from "../get-personal-invitation/data";

type InvitationPreviewPageProps = {
  event: PersonalInvitationEvent;
};

type DesignSelection = {
  themeId: InvitationThemeId;
  paletteId: InvitationPaletteId;
};

type SaveStatus = "saved" | "pending" | "saving" | "error";

export function InvitationPreviewPage({ event }: InvitationPreviewPageProps) {
  const [themeId, setThemeId] = useState<InvitationThemeId>(event.themeId);
  const [paletteId, setPaletteId] = useState<InvitationPaletteId>(
    event.paletteId,
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [entryPreviewKey, setEntryPreviewKey] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [message, setMessage] = useState("Guardado");
  const lastScrollYRef = useRef(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const desiredDesignRef = useRef<DesignSelection>({
    paletteId: event.paletteId,
    themeId: event.themeId,
  });
  const savedDesignRef = useRef<DesignSelection>({
    paletteId: event.paletteId,
    themeId: event.themeId,
  });
  const isSavingRef = useRef(false);
  const currentTheme = getInvitationTheme(themeId);
  const currentPalette = getInvitationPalette(paletteId);
  const showFloatingControls = isPanelOpen || isControlsVisible;
  const previewEvent = useMemo(
    () => ({ ...event, ...event.content, themeId, paletteId }),
    [event, paletteId, themeId],
  );

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function handleScroll() {
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollYRef.current;

      if (Math.abs(scrollDelta) < 10) {
        return;
      }

      if (nextScrollY < 80 || scrollDelta < 0) {
        setIsControlsVisible(true);
      } else if (nextScrollY > 120 && scrollDelta > 0) {
        setIsControlsVisible(false);
      }

      lastScrollYRef.current = nextScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";

    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      focusableSelector,
    );
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsPanelOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const elements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.offsetParent !== null);

      if (!elements.length) {
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [isPanelOpen]);

  function selectDesign(nextDesign: DesignSelection) {
    setThemeId(nextDesign.themeId);
    setPaletteId(nextDesign.paletteId);
    desiredDesignRef.current = nextDesign;

    if (!isSameDesign(nextDesign, savedDesignRef.current)) {
      setSaveStatus(isSavingRef.current ? "pending" : "pending");
      setMessage(isSavingRef.current ? "Cambio pendiente" : "Pendiente");
    }

    void flushDesignSave();
  }

  async function flushDesignSave() {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;

    try {
      while (!isSameDesign(desiredDesignRef.current, savedDesignRef.current)) {
        const submittedDesign = desiredDesignRef.current;

        setSaveStatus("saving");
        setMessage("Guardando...");

        const result = await changeInvitationDesign({
          eventId: event.id,
          paletteId: submittedDesign.paletteId,
          themeId: submittedDesign.themeId,
        });

        if (!isSameDesign(submittedDesign, desiredDesignRef.current)) {
          if (!result.error) {
            savedDesignRef.current = submittedDesign;
          }

          continue;
        }

        if (result.error) {
          setSaveStatus("error");
          setMessage(result.error);
          return;
        }

        savedDesignRef.current = submittedDesign;
        setSaveStatus("saved");
        setMessage(result.success ?? "Guardado");
      }
    } finally {
      isSavingRef.current = false;
    }

    if (!isSameDesign(desiredDesignRef.current, savedDesignRef.current)) {
      void flushDesignSave();
    }
  }

  function retrySave() {
    if (saveStatus === "error") {
      setSaveStatus("pending");
      setMessage("Reintentando...");
      void flushDesignSave();
    }
  }

  return (
    <div className="min-h-dvh bg-porcelain text-near-black">
      <WeddingInvitation
        entryPreviewKey={entryPreviewKey}
        event={previewEvent}
        mode="preview"
      />

      <div
        className={[
          "pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 transition-all duration-300 ease-out sm:bottom-6",
          showFloatingControls
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0",
        ].join(" ")}
      >
        <div
          className={[
            "flex w-full max-w-xl flex-col gap-3 rounded-[22px] border border-white/75 bg-white/95 p-3 shadow-[0_22px_80px_rgba(16,42,67,0.18)] backdrop-blur sm:flex-row sm:items-center sm:justify-between",
            showFloatingControls ? "pointer-events-auto" : "pointer-events-none",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="size-8 shrink-0 rounded-full border"
              style={{
                background: currentPalette.colors.primary,
                borderColor: currentPalette.colors.border,
              }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-midnight-navy">
                Vista previa · borrador
              </p>
              <p
                aria-live="polite"
                className="text-xs font-medium text-midnight-navy/52"
              >
                {currentTheme.name} · {currentPalette.name} ·{" "}
                {saveStatus === "saving" ? "Guardando..." : message}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-midnight-navy/10 bg-white px-4 text-sm font-semibold text-midnight-navy transition-colors hover:border-muted-mauve/30 hover:text-muted-mauve focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
              href="/admin/personal/invitacion/datos"
            >
              Volver a editar
            </Link>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-midnight-navy/10 bg-white px-4 text-sm font-semibold text-midnight-navy transition-colors hover:border-muted-mauve/30 hover:text-muted-mauve focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
              id="entry-preview-trigger"
              onClick={() => setEntryPreviewKey((current) => current + 1)}
              type="button"
            >
              <MailOpen aria-hidden="true" className="size-4" />
              Ver entrada
            </button>
            <button
              ref={triggerRef}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-muted-mauve px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7D5F78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
              onClick={() => setIsPanelOpen(true)}
              type="button"
            >
              <Palette aria-hidden="true" className="size-4" />
              Diseno
            </button>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-muted-mauve px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7D5F78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
              href="/admin/personal/invitacion/publicar"
            >
              <Send aria-hidden="true" className="size-4" />
              Revisar
            </Link>
          </div>
        </div>
      </div>

      {isPanelOpen ? (
        <div
          aria-labelledby="design-panel-title"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end bg-midnight-navy/38 px-3 pb-3 pt-12 sm:items-center sm:justify-center sm:p-6"
          role="dialog"
        >
          <div
            ref={panelRef}
            className="max-h-[88dvh] w-full max-w-3xl overflow-y-auto rounded-t-[26px] border border-midnight-navy/10 bg-white p-5 shadow-[0_30px_100px_rgba(16,42,67,0.24)] sm:rounded-[26px] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-mauve">
                  Diseno
                </p>
                <h2
                  className="mt-2 font-serif text-[2.35rem] font-semibold leading-none text-midnight-navy"
                  id="design-panel-title"
                >
                  Cambiar diseno
                </h2>
              </div>
              <button
                aria-label="Cerrar"
                className="inline-flex size-10 items-center justify-center rounded-full border border-midnight-navy/10 text-midnight-navy/62 transition-colors hover:text-muted-mauve focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
                onClick={() => setIsPanelOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>

            <section className="mt-7">
              <h3 className="text-xs font-semibold uppercase text-midnight-navy/45">
                Tema
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {invitationThemes.map((theme) => (
                  <button
                    aria-pressed={theme.id === themeId}
                    className={[
                      "grid min-h-20 gap-3 rounded-[18px] border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve",
                      theme.id === themeId
                        ? "border-muted-mauve bg-muted-mauve/8 text-muted-mauve"
                        : "border-midnight-navy/10 bg-white text-midnight-navy hover:border-muted-mauve/25",
                    ].join(" ")}
                    key={theme.id}
                    onClick={() =>
                      selectDesign({ paletteId, themeId: theme.id })
                    }
                    type="button"
                  >
                    <InvitationThemeThumbnail
                      paletteId={paletteId}
                      themeId={theme.id}
                    />
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block text-sm font-semibold">
                          {theme.name}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-midnight-navy/52">
                          {theme.description}
                        </span>
                      </span>
                      {theme.id === themeId ? (
                        <Check aria-hidden="true" className="mt-1 size-4" />
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-7">
              <h3 className="text-xs font-semibold uppercase text-midnight-navy/45">
                Paleta
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {invitationPalettes.map((palette) => (
                  <button
                    aria-pressed={palette.id === paletteId}
                    className={[
                      "flex min-h-14 items-center justify-between rounded-[18px] border px-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve",
                      palette.id === paletteId
                        ? "border-muted-mauve bg-muted-mauve/8"
                        : "border-midnight-navy/10 bg-white hover:border-muted-mauve/25",
                    ].join(" ")}
                    key={palette.id}
                    onClick={() =>
                      selectDesign({ paletteId: palette.id, themeId })
                    }
                    type="button"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="size-6 rounded-full border"
                        style={{
                          background: palette.colors.primary,
                          borderColor: palette.colors.border,
                        }}
                      />
                      <span className="text-sm font-semibold text-midnight-navy">
                        {palette.name}
                      </span>
                    </span>
                    {palette.id === paletteId ? (
                      <Check
                        aria-hidden="true"
                        className="size-4 text-muted-mauve"
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            </section>

            {saveStatus === "error" ? (
              <div className="mt-6 flex flex-col gap-3 rounded-[18px] border border-[#8A3A3A]/20 bg-[#8A3A3A]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-[#8A3A3A]">
                  {message}
                </p>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#8A3A3A]/25 px-4 text-sm font-semibold text-[#8A3A3A] transition-colors hover:bg-[#8A3A3A]/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A3A3A]"
                  onClick={retrySave}
                  type="button"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Reintentar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isSameDesign(first: DesignSelection, second: DesignSelection) {
  return first.themeId === second.themeId && first.paletteId === second.paletteId;
}
