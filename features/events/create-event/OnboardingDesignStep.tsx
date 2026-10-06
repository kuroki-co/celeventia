"use client";

import { Check } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import { InvitationThemeThumbnail } from "@/invitation/renderer/InvitationThemeThumbnail";
import {
  invitationPalettes,
  invitationThemes,
  type InvitationPaletteId,
  type InvitationThemeId,
} from "@/invitation/themes";
import { changeInvitationDesign } from "@/features/invitations/change-design/action";
import type { PersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";

import { completeOnboarding, type CompleteOnboardingState } from "./action";

type OnboardingDesignStepProps = {
  event: PersonalInvitationEvent;
};

const initialCompleteState: CompleteOnboardingState = {};

export function OnboardingDesignStep({ event }: OnboardingDesignStepProps) {
  const [themeId, setThemeId] = useState<InvitationThemeId>(event.themeId);
  const [paletteId, setPaletteId] = useState<InvitationPaletteId>(
    event.paletteId,
  );
  const [message, setMessage] = useState("Elige una combinacion para empezar.");
  const [isPending, startTransition] = useTransition();
  const [completeState, completeAction, isCompleting] = useActionState(
    completeOnboarding,
    initialCompleteState,
  );

  function saveDesign(next: {
    themeId: InvitationThemeId;
    paletteId: InvitationPaletteId;
  }) {
    setThemeId(next.themeId);
    setPaletteId(next.paletteId);
    setMessage("Guardando...");
    startTransition(async () => {
      const result = await changeInvitationDesign({
        eventId: event.id,
        paletteId: next.paletteId,
        themeId: next.themeId,
      });

      setMessage(result.error ?? result.success ?? "Diseno guardado.");
    });
  }

  return (
    <div className="mt-8 grid gap-7">
      <div className="grid gap-3 sm:grid-cols-2">
        {invitationThemes.map((theme) => (
          <button
            aria-pressed={theme.id === themeId}
            className={[
              "grid gap-3 rounded-[18px] border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve",
              theme.id === themeId
                ? "border-muted-mauve bg-muted-mauve/8"
                : "border-midnight-navy/10 bg-white hover:border-muted-mauve/25",
            ].join(" ")}
            key={theme.id}
            onClick={() => saveDesign({ paletteId, themeId: theme.id })}
            type="button"
          >
            <InvitationThemeThumbnail
              paletteId={paletteId}
              themeId={theme.id}
            />
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-midnight-navy">
                  {theme.name}
                </span>
                <span className="mt-1 block text-xs leading-5 text-midnight-navy/55">
                  {theme.description}
                </span>
              </span>
              {theme.id === themeId ? (
                <Check aria-hidden="true" className="mt-1 size-4 text-muted-mauve" />
              ) : null}
            </span>
          </button>
        ))}
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase text-midnight-navy/45">
          Paleta
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {invitationPalettes.map((palette) => (
            <button
              aria-pressed={palette.id === paletteId}
              className={[
                "flex min-h-14 items-center justify-between rounded-[18px] border px-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve",
                palette.id === paletteId
                  ? "border-muted-mauve bg-muted-mauve/8"
                  : "border-midnight-navy/10 bg-white hover:border-muted-mauve/25",
              ].join(" ")}
              key={palette.id}
              onClick={() => saveDesign({ paletteId: palette.id, themeId })}
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
                <Check aria-hidden="true" className="size-4 text-muted-mauve" />
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <p aria-live="polite" className="text-sm font-semibold text-midnight-navy/58">
        {isPending ? "Guardando..." : message}
      </p>

      <form action={completeAction}>
        <input name="eventId" type="hidden" value={event.id} />
        {completeState.error ? (
          <p className="mb-3 rounded-2xl border border-[#8A3A3A]/20 bg-[#8A3A3A]/5 px-4 py-3 text-sm font-semibold text-[#8A3A3A]">
            {completeState.error}
          </p>
        ) : null}
        <button
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-muted-mauve px-5 text-sm font-semibold text-white transition hover:bg-[#7D5F78] disabled:cursor-wait disabled:bg-muted-mauve/55 sm:w-auto"
          disabled={isPending || isCompleting}
          type="submit"
        >
          {isCompleting ? "Finalizando..." : "Ver nuestra invitacion"}
        </button>
      </form>
    </div>
  );
}
