"use client";

import { Check, Palette, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

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

export function InvitationPreviewPage({ event }: InvitationPreviewPageProps) {
  const [themeId, setThemeId] = useState<InvitationThemeId>(event.themeId);
  const [paletteId, setPaletteId] = useState<InvitationPaletteId>(
    event.paletteId,
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [message, setMessage] = useState("Guardado");
  const [isPending, startTransition] = useTransition();
  const lastScrollYRef = useRef(0);
  const currentTheme = getInvitationTheme(themeId);
  const currentPalette = getInvitationPalette(paletteId);
  const showFloatingControls = isPanelOpen || isControlsVisible;
  const previewEvent = useMemo(
    () => ({ ...event, themeId, paletteId }),
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

  function persistDesign(
    nextThemeId: InvitationThemeId,
    nextPaletteId: InvitationPaletteId,
  ) {
    setThemeId(nextThemeId);
    setPaletteId(nextPaletteId);
    setMessage("Guardando...");

    startTransition(async () => {
      const result = await changeInvitationDesign({
        eventId: event.id,
        themeId: nextThemeId,
        paletteId: nextPaletteId,
      });

      setMessage(result.error ?? result.success ?? "Guardado");
    });
  }

  return (
    <div className="min-h-dvh bg-porcelain text-near-black">
      <Link
        className="fixed left-4 top-4 z-30 inline-flex min-h-10 items-center rounded-2xl border border-white/70 bg-white/90 px-4 text-sm font-semibold text-midnight-navy shadow-[0_16px_44px_rgba(16,42,67,0.12)] transition-colors hover:text-muted-mauve focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
        href="/admin/personal"
      >
        Volver
      </Link>

      <WeddingInvitation event={previewEvent} mode="preview" />

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
                {currentTheme.name} · {currentPalette.name}
              </p>
              <p
                aria-live="polite"
                className="text-xs font-medium text-midnight-navy/52"
              >
                {isPending ? "Guardando..." : message}
              </p>
            </div>
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-muted-mauve px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7D5F78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
            onClick={() => setIsPanelOpen(true)}
            type="button"
          >
            <Palette aria-hidden="true" className="size-4" />
            Cambiar
          </button>
        </div>
      </div>

      {isPanelOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end bg-midnight-navy/38 px-3 pb-3 pt-12 sm:items-center sm:justify-center sm:p-6"
          role="dialog"
        >
          <div className="max-h-[88dvh] w-full max-w-3xl overflow-y-auto rounded-t-[26px] border border-midnight-navy/10 bg-white p-5 shadow-[0_30px_100px_rgba(16,42,67,0.24)] sm:rounded-[26px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-mauve">
                  Personalizacion
                </p>
                <h2 className="mt-2 font-serif text-[2.35rem] font-semibold leading-none text-midnight-navy">
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
                    className={[
                      "flex min-h-20 items-center justify-between rounded-[18px] border px-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve",
                      theme.id === themeId
                        ? "border-muted-mauve bg-muted-mauve/8 text-muted-mauve"
                        : "border-midnight-navy/10 bg-white text-midnight-navy hover:border-muted-mauve/25",
                    ].join(" ")}
                    key={theme.id}
                    onClick={() => persistDesign(theme.id, paletteId)}
                    type="button"
                  >
                    <span>
                      <span className="block text-sm font-semibold">
                        {theme.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-midnight-navy/52">
                        {theme.description}
                      </span>
                    </span>
                    {theme.id === themeId ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : null}
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
                    className={[
                      "flex min-h-14 items-center justify-between rounded-[18px] border px-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve",
                      palette.id === paletteId
                        ? "border-muted-mauve bg-muted-mauve/8"
                        : "border-midnight-navy/10 bg-white hover:border-muted-mauve/25",
                    ].join(" ")}
                    key={palette.id}
                    onClick={() => persistDesign(themeId, palette.id)}
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
