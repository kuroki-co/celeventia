"use client";

/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type EntryFrame = "traditional" | "ornate" | "classic" | "organic" | "minimal";

type EntryRecipient = {
  displayName: string;
  maxGuests: number;
} | null;

type EntryImage = {
  objectPosition: string;
  src: string | null;
};

type InvitationEntryGateProps = {
  children: ReactNode;
  coupleName: string;
  dateLabel: string;
  frame: EntryFrame;
  image: EntryImage;
  mode: "preview" | "public";
  previewKey?: number;
  recipient?: EntryRecipient;
};

type EntryCopy = {
  description: string;
  detail: string;
  foot: string;
  headline: string;
  title: string;
};

type EntryOverlayProps = {
  coupleName: string;
  dateLabel: string;
  frame: EntryFrame;
  image: EntryImage;
  mode: "preview" | "public";
  onDismissEntry: () => void;
  previewTrigger: number;
  recipient: EntryRecipient;
};

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function InvitationEntryGate({
  children,
  coupleName,
  dateLabel,
  frame,
  image,
  mode,
  previewKey = 0,
  recipient = null,
}: InvitationEntryGateProps) {
  const [dismissedPreviewKey, setDismissedPreviewKey] = useState(0);
  const [hasEnteredPublicInvitation, setHasEnteredPublicInvitation] =
    useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isPreviewRequested = mode === "preview" && previewKey > dismissedPreviewKey;
  const isVisible =
    mode === "public" ? !hasEnteredPublicInvitation : isPreviewRequested;
  const dismissEntry = useCallback(() => {
    if (mode === "preview") {
      setDismissedPreviewKey(previewKey);
      return;
    }

    setHasEnteredPublicInvitation(true);
  }, [mode, previewKey]);

  useEffect(() => {
    const contentElement = contentRef.current;

    if (contentElement && "inert" in contentElement) {
      contentElement.inert = isVisible;
    }

    return () => {
      if (contentElement && "inert" in contentElement) {
        contentElement.inert = false;
      }
    };
  }, [isVisible]);

  return (
    <>
      <div ref={contentRef}>{children}</div>
      {isVisible ? (
        <EntryOverlay
          coupleName={coupleName}
          dateLabel={dateLabel}
          frame={frame}
          image={image}
          key={`${frame}-${previewKey}`}
          mode={mode}
          onDismissEntry={dismissEntry}
          previewTrigger={previewKey}
          recipient={recipient}
        />
      ) : null}
    </>
  );
}

function EntryOverlay({
  coupleName,
  dateLabel,
  frame,
  image,
  mode,
  onDismissEntry,
  previewTrigger,
  recipient,
}: EntryOverlayProps) {
  const [stage, setStage] = useState<"closed" | "card" | "opening">("closed");
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const copy = useMemo(
    () => getEntryCopy({ coupleName, dateLabel, recipient }),
    [coupleName, dateLabel, recipient],
  );
  const initials = getEntryInitials(coupleName);

  const focusInvitation = useCallback(() => {
    window.setTimeout(() => {
      const hero = document.getElementById("invitacion");
      hero?.setAttribute("tabindex", "-1");
      hero?.focus({ preventScroll: true });
      hero?.scrollIntoView({ block: "start" });
    }, 0);
  }, []);

  const closePreviewEntry = useCallback(() => {
    onDismissEntry();
    window.setTimeout(() => {
      document.getElementById("entry-preview-trigger")?.focus();
    }, 0);
  }, [onDismissEntry]);

  const enterInvitation = useCallback(() => {
    onDismissEntry();
    focusInvitation();
  }, [focusInvitation, onDismissEntry]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    overlayRef.current
      ?.querySelector<HTMLElement>(focusableSelector)
      ?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && mode === "preview") {
        event.preventDefault();
        closePreviewEntry();
        return;
      }

      if (event.key !== "Tab" || !overlayRef.current) {
        return;
      }

      const focusable = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.offsetParent !== null);

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

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

      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
    };
  }, [closePreviewEntry, mode]);

  function beginOpening() {
    if (stage === "opening") {
      return;
    }

    if (stage === "closed") {
      setStage("card");
      return;
    }

    revealInvitation();
  }

  function revealInvitation() {
    if (stage === "opening") {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    setStage("opening");

    if (prefersReducedMotion) {
      finishOpening();
      return;
    }

    revealTimerRef.current = window.setTimeout(finishOpening, 620);
  }

  function finishOpening() {
    enterInvitation();
  }

  return (
    <div
      aria-labelledby="invitation-entry-title"
      aria-modal="true"
      className={[
        "fixed inset-0 z-50 min-h-dvh overflow-y-auto transition-opacity duration-500 motion-reduce:transition-none",
        stage === "opening" ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
      ref={overlayRef}
      role="dialog"
    >
      <button
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-[color:var(--inv-surface)] focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[color:var(--inv-primary)]"
        onClick={enterInvitation}
        type="button"
      >
        Saltar a la invitacion
      </button>
      {frame === "classic" ? (
        <ClassicEntry
          copy={copy}
          image={image}
          mode={mode}
          onClosePreview={closePreviewEntry}
          onOpen={beginOpening}
          onReveal={revealInvitation}
          stage={stage}
        />
      ) : null}
      {frame === "ornate" ? (
        <VersallesEntry
          copy={copy}
          initials={initials}
          mode={mode}
          onClosePreview={closePreviewEntry}
          onOpen={beginOpening}
          onReveal={revealInvitation}
          stage={stage}
        />
      ) : null}
      {frame === "organic" ? (
        <TerraEntry
          copy={copy}
          image={image}
          initials={initials}
          mode={mode}
          onClosePreview={closePreviewEntry}
          onOpen={beginOpening}
          onReveal={revealInvitation}
          previewTrigger={previewTrigger}
          stage={stage}
        />
      ) : null}
      {frame === "traditional" ? (
        <TraditionalEntry
          copy={copy}
          initials={initials}
          mode={mode}
          onClosePreview={closePreviewEntry}
          onOpen={beginOpening}
          onReveal={revealInvitation}
          stage={stage}
        />
      ) : null}
      {frame === "minimal" ? (
        <MinimalEntry
          copy={copy}
          initials={initials}
          mode={mode}
          onClosePreview={closePreviewEntry}
          onOpen={beginOpening}
          onReveal={revealInvitation}
          stage={stage}
        />
      ) : null}
    </div>
  );
}

function ClassicEntry({
  copy,
  image,
  mode,
  onClosePreview,
  onOpen,
  onReveal,
  stage,
}: {
  copy: EntryCopy;
  image: EntryImage;
  mode: "preview" | "public";
  onClosePreview: () => void;
  onOpen: () => void;
  onReveal: () => void;
  stage: "closed" | "card" | "opening";
}) {
  const isCardVisible = stage === "card";

  return (
    <section className="relative grid min-h-dvh place-items-center overflow-hidden bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-bg)_92%,var(--inv-surface)),color-mix(in_srgb,var(--inv-accent)_12%,var(--inv-bg)))] px-5 py-[max(1.5rem,env(safe-area-inset-top))] text-center sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--inv-surface)_70%,transparent),transparent_36%)]" />
      <div className="relative z-10 flex min-h-[calc(100dvh-5rem)] w-full max-w-2xl flex-col items-center justify-center pt-8">
        <p className="font-serif text-[2.55rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[3.8rem]">
          Nuestra boda
        </p>
        <h2
          className="mt-4 max-w-[40rem] text-balance font-serif text-[clamp(2.45rem,7vw,5rem)] font-normal leading-[0.92] text-[color:var(--inv-primary)]"
          id="invitation-entry-title"
        >
          {copy.title}
        </h2>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--inv-secondary)]">
          {copy.foot}
        </p>
        <div className="relative mt-8 w-full max-w-[34rem]">
          <PaperLetter
            copy={copy}
            image={image}
            isVisible={isCardVisible}
            variant="classic"
          />
          <button
            aria-label={isCardVisible ? "Sobre abierto" : "Abrir sobre"}
            className="relative z-20 mx-auto block aspect-[1.62] w-full max-w-[32rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--inv-secondary)]"
            disabled={isCardVisible}
            onClick={onOpen}
            type="button"
          >
            <SimpleEnvelope initials={copy.headline} isOpen={isCardVisible} />
          </button>
        </div>
        <EntryActions
          mode={mode}
          onClosePreview={onClosePreview}
          onOpen={isCardVisible ? onReveal : onOpen}
          primaryLabel={isCardVisible ? "Ver invitacion" : "Abrir sobre"}
        />
      </div>
    </section>
  );
}

function VersallesEntry({
  copy,
  initials,
  mode,
  onClosePreview,
  onOpen,
  onReveal,
  stage,
}: {
  copy: EntryCopy;
  initials: string;
  mode: "preview" | "public";
  onClosePreview: () => void;
  onOpen: () => void;
  onReveal: () => void;
  stage: "closed" | "card" | "opening";
}) {
  const isCardVisible = stage === "card";

  return (
    <section className="relative grid min-h-dvh place-items-center overflow-hidden bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-bg)_90%,var(--inv-surface)),color-mix(in_srgb,var(--inv-primary)_10%,var(--inv-bg)))] px-5 py-[max(1.5rem,env(safe-area-inset-top))] text-center text-[color:var(--inv-text)] sm:px-8">
      <VersallesBotanicalCorners />
      <div className="relative z-10 flex min-h-[calc(100dvh-5rem)] w-full max-w-[44rem] flex-col items-center justify-center pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--inv-secondary)]">
          Nuestra boda
        </p>
        <h2
          className="mt-4 max-w-[38rem] text-balance font-serif text-[clamp(2.65rem,7vw,5.25rem)] font-normal leading-[0.92] text-[color:var(--inv-primary)]"
          id="invitation-entry-title"
        >
          {copy.title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
          {copy.description}
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--inv-secondary)]">
          {copy.foot}
        </p>
        <div
          aria-hidden="true"
          className="relative mt-7 aspect-[818/501] w-full max-w-[34rem]"
        >
          <PaperLetter
            copy={copy}
            image={{ objectPosition: "center center", src: null }}
            isVisible={isCardVisible}
            variant="ornate"
          />
          <img
            alt=""
            className="relative z-20 h-full w-full object-contain drop-shadow-[0_28px_70px_rgba(16,42,67,0.18)]"
            src="/wedding-themes/shared/envelopes/ivory-envelope-with-gold-seal.png"
          />
          <span className="absolute left-1/2 top-[42%] z-30 -translate-x-1/2 -translate-y-1/2 font-serif text-[clamp(2rem,8vw,4.8rem)] font-normal text-[color:var(--inv-primary)]">
            {initials}
          </span>
        </div>
        <EntryActions
          mode={mode}
          onClosePreview={onClosePreview}
          onOpen={isCardVisible ? onReveal : onOpen}
          primaryLabel={isCardVisible ? "Ver invitacion" : "Abrir sobre"}
        />
      </div>
    </section>
  );
}

function TerraEntry({
  copy,
  image,
  initials,
  mode,
  onClosePreview,
  onOpen,
  onReveal,
  previewTrigger,
  stage,
}: {
  copy: EntryCopy;
  image: EntryImage;
  initials: string;
  mode: "preview" | "public";
  onClosePreview: () => void;
  onOpen: () => void;
  onReveal: () => void;
  previewTrigger: number;
  stage: "closed" | "card" | "opening";
}) {
  const isCardVisible = stage === "card";

  return (
    <section className="relative grid min-h-dvh place-items-center overflow-hidden bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-bg)_88%,var(--inv-surface)),color-mix(in_srgb,var(--inv-primary)_16%,var(--inv-bg)))] px-5 py-[max(1.5rem,env(safe-area-inset-top))] text-center text-[color:var(--inv-text)] sm:px-8">
      <TerraBotanicalCorners />
      <div className="relative z-10 flex min-h-[calc(100dvh-5rem)] w-full max-w-[42rem] flex-col items-center justify-center pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--inv-secondary)]">
          Nuestra boda
        </p>
        <h2
          className="mt-4 max-w-[36rem] text-balance font-serif text-[clamp(2.55rem,7vw,5rem)] font-normal leading-[0.92] text-[color:var(--inv-primary)]"
          id="invitation-entry-title"
        >
          {copy.title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
          {copy.description}
        </p>
        <div className="relative mt-8 w-full max-w-[35rem]">
          <button
            aria-label={isCardVisible ? "Sobre abierto" : "Abrir sobre"}
            className={[
              "relative mx-auto block aspect-[1.72] w-full max-w-[33rem] text-left transition-transform duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--inv-secondary)] motion-reduce:transition-none",
              isCardVisible ? "-translate-y-6" : "",
            ].join(" ")}
            disabled={isCardVisible}
            onClick={onOpen}
            type="button"
          >
            <TerraEnvelope initials={initials} isOpen={isCardVisible} />
          </button>
          <div
            className={[
              "pointer-events-none absolute left-1/2 top-[12%] z-20 grid w-[78%] max-w-[24rem] -translate-x-1/2 gap-3 transition-all duration-500 motion-reduce:transition-none sm:grid-cols-[0.95fr_1fr] sm:items-center",
              isCardVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
            ].join(" ")}
          >
            <div className="rotate-[-2deg] border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)] p-2 shadow-[0_16px_34px_rgba(44,33,29,0.16)]">
              {image.src ? (
                <img
                  alt=""
                  className="aspect-[4/5] w-full object-cover"
                  src={image.src}
                  style={{ objectPosition: image.objectPosition }}
                />
              ) : (
                <div className="grid aspect-[4/5] place-items-center bg-[color:var(--inv-bg)] font-serif text-4xl text-[color:var(--inv-primary)]">
                  {initials}
                </div>
              )}
            </div>
            <div className="rotate-[1.5deg] border border-[color:var(--inv-border)]/70 bg-[color:var(--inv-surface)] px-4 py-5 text-center shadow-[0_16px_34px_rgba(44,33,29,0.14)]">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--inv-secondary)]">
                Invitacion
              </p>
              <p className="mt-2 text-balance font-serif text-3xl font-normal leading-none text-[color:var(--inv-primary)]">
                {copy.headline}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--inv-muted)]">
                {copy.foot}
              </p>
            </div>
          </div>
        </div>
        <EntryActions
          mode={mode}
          onClosePreview={onClosePreview}
          onOpen={isCardVisible ? onReveal : onOpen}
          primaryLabel={isCardVisible ? "Ver invitacion" : "Abrir sobre"}
          seed={previewTrigger}
        />
      </div>
    </section>
  );
}

function TraditionalEntry({
  copy,
  initials,
  mode,
  onClosePreview,
  onOpen,
  onReveal,
  stage,
}: {
  copy: EntryCopy;
  initials: string;
  mode: "preview" | "public";
  onClosePreview: () => void;
  onOpen: () => void;
  onReveal: () => void;
  stage: "closed" | "card" | "opening";
}) {
  const isCardVisible = stage === "card";

  return (
    <section className="relative grid min-h-dvh place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--inv-accent)_18%,transparent),transparent_34%),linear-gradient(180deg,var(--inv-bg),color-mix(in_srgb,var(--inv-primary)_9%,var(--inv-bg)))] px-5 py-[max(1.5rem,env(safe-area-inset-top))] text-center">
      <div className="absolute inset-6 border border-[color:var(--inv-border)]/60 sm:inset-10" />
      <CeremonialEntryCorners />
      <div className="relative z-10 w-full max-w-xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--inv-secondary)]">
          Nuestra boda
        </p>
        <h2
          className="mt-4 text-balance font-serif text-[clamp(2.65rem,8vw,5.4rem)] font-normal leading-[0.92] text-[color:var(--inv-primary)]"
          id="invitation-entry-title"
        >
          {copy.title}
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-[color:var(--inv-muted)]">
          {copy.description}
        </p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--inv-secondary)]">
          {copy.foot}
        </p>
        <div className="relative mx-auto mt-8 w-full max-w-[31rem]">
          <PaperLetter
            copy={copy}
            image={{ objectPosition: "center center", src: null }}
            isVisible={isCardVisible}
            variant="traditional"
          />
          <button
            aria-label={isCardVisible ? "Sobre abierto" : "Abrir sobre"}
            className="relative z-20 mx-auto block aspect-[1.58] w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--inv-secondary)]"
            disabled={isCardVisible}
            onClick={onOpen}
            type="button"
          >
            <SimpleEnvelope initials={initials} isOpen={isCardVisible} />
          </button>
        </div>
        <EntryActions
          mode={mode}
          onClosePreview={onClosePreview}
          onOpen={isCardVisible ? onReveal : onOpen}
          primaryLabel={isCardVisible ? "Ver invitacion" : "Abrir sobre"}
        />
      </div>
    </section>
  );
}

function MinimalEntry({
  copy,
  initials,
  mode,
  onClosePreview,
  onOpen,
  onReveal,
  stage,
}: {
  copy: EntryCopy;
  initials: string;
  mode: "preview" | "public";
  onClosePreview: () => void;
  onOpen: () => void;
  onReveal: () => void;
  stage: "closed" | "card" | "opening";
}) {
  const isCardVisible = stage === "card";

  return (
    <section className="relative grid min-h-dvh place-items-center overflow-hidden bg-[color:var(--inv-bg)] px-5 py-[max(1.5rem,env(safe-area-inset-top))] text-center sm:px-8">
      <div className="absolute inset-x-8 top-10 h-px bg-[color:var(--inv-border)]/70" />
      <div className="absolute inset-x-8 bottom-10 h-px bg-[color:var(--inv-border)]/70" />
      <div className="relative z-10 w-full max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--inv-secondary)]">
          Nuestra boda
        </p>
        <h2
          className="mt-5 text-balance font-serif text-[clamp(2.5rem,7vw,4.6rem)] font-normal leading-[0.98] text-[color:var(--inv-primary)]"
          id="invitation-entry-title"
        >
          {copy.title}
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-[color:var(--inv-muted)]">
          {copy.description}
        </p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--inv-secondary)]">
          {copy.foot}
        </p>
        <div className="relative mx-auto mt-8 w-full max-w-[30rem]">
          <PaperLetter
            copy={copy}
            image={{ objectPosition: "center center", src: null }}
            isVisible={isCardVisible}
            variant="minimal"
          />
          <button
            aria-label={isCardVisible ? "Sobre abierto" : "Abrir sobre"}
            className="relative z-20 mx-auto block aspect-[1.72] w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--inv-secondary)]"
            disabled={isCardVisible}
            onClick={onOpen}
            type="button"
          >
            <SimpleEnvelope initials={initials} isOpen={isCardVisible} minimal />
          </button>
        </div>
        <EntryActions
          mode={mode}
          onClosePreview={onClosePreview}
          onOpen={isCardVisible ? onReveal : onOpen}
          primaryLabel={isCardVisible ? "Ver invitacion" : "Abrir sobre"}
        />
      </div>
    </section>
  );
}

function PaperLetter({
  copy,
  image,
  isVisible,
  variant,
}: {
  copy: EntryCopy;
  image: EntryImage;
  isVisible: boolean;
  variant: "classic" | "minimal" | "ornate" | "traditional";
}) {
  const hasPhoto = variant === "classic" && image.src;

  return (
    <div
      aria-hidden={!isVisible}
      className={[
        "absolute left-1/2 z-10 w-[76%] max-w-[22rem] -translate-x-1/2 border bg-[color:var(--inv-surface)] text-center shadow-[0_18px_44px_rgba(16,42,67,0.16)] transition-all duration-500 motion-reduce:transition-none",
        variant === "minimal"
          ? "border-[color:var(--inv-border)]/60 px-5 py-6"
          : "border-[color:var(--inv-border)]/70 px-5 py-6 outline outline-1 outline-offset-[-10px] outline-[color:var(--inv-border)]/28",
        variant === "ornate"
          ? "top-[-18%]"
          : variant === "traditional"
            ? "top-[-16%]"
            : "top-[-20%]",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0",
      ].join(" ")}
    >
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--inv-secondary)]">
        {copy.detail}
      </p>
      <p className="mt-2 text-balance font-serif text-[2rem] font-normal leading-none text-[color:var(--inv-primary)]">
        {copy.headline}
      </p>
      {hasPhoto ? (
        <img
          alt=""
          className="mx-auto mt-4 aspect-[5/4] w-full max-w-[12rem] object-cover"
          src={image.src ?? ""}
          style={{ objectPosition: image.objectPosition }}
        />
      ) : null}
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--inv-muted)]">
        {copy.foot}
      </p>
    </div>
  );
}

function SimpleEnvelope({
  initials,
  isOpen,
  minimal = false,
}: {
  initials: string;
  isOpen: boolean;
  minimal?: boolean;
}) {
  return (
    <div className="absolute inset-0 drop-shadow-[0_24px_60px_rgba(16,42,67,0.16)]">
      <div
        className={[
          "absolute inset-x-[5%] bottom-[8%] top-[22%] overflow-hidden border bg-[color:var(--inv-surface)]",
          minimal
            ? "border-[color:var(--inv-border)]/70"
            : "border-[color:var(--inv-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-surface)_94%,var(--inv-bg)),color-mix(in_srgb,var(--inv-accent)_12%,var(--inv-surface)))]",
        ].join(" ")}
      >
        <div className="absolute inset-0 bg-[linear-gradient(145deg,transparent_49%,color-mix(in_srgb,var(--inv-primary)_10%,var(--inv-surface))_50%),linear-gradient(215deg,transparent_49%,color-mix(in_srgb,var(--inv-accent)_18%,var(--inv-surface))_50%)]" />
      </div>
      <div
        className={[
          "absolute inset-x-[5%] top-[10%] z-10 h-[48%] origin-top border border-[color:var(--inv-border)]/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-accent)_16%,var(--inv-surface)),var(--inv-surface))] transition-transform duration-500 [clip-path:polygon(0_0,100%_0,50%_100%)] motion-reduce:transition-none",
          isOpen ? "[transform:rotateX(-48deg)_scaleY(0.78)] opacity-90" : "",
        ].join(" ")}
      />
      <div className="absolute left-1/2 top-[57%] z-20 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[color:var(--inv-accent)]/70 bg-[color:var(--inv-surface)] text-[color:var(--inv-primary)] shadow-[0_12px_30px_rgba(16,42,67,0.14)]">
        <span className="font-serif text-2xl">
          {getEntryInitials(initials)}
        </span>
      </div>
    </div>
  );
}

function EntryActions({
  mode,
  onClosePreview,
  onOpen,
  primaryLabel,
  seed,
  tone = "default",
}: {
  mode: "preview" | "public";
  onClosePreview: () => void;
  onOpen: () => void;
  primaryLabel: string;
  seed?: number;
  tone?: "default" | "light";
}) {
  return (
    <div
      className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"
      data-entry-seed={seed}
    >
      <button
        className={[
          "inline-flex min-h-11 min-w-44 items-center justify-center border px-6 text-sm font-semibold shadow-[0_14px_34px_rgba(16,42,67,0.14)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]",
          tone === "light"
            ? "border-[#FFF8EA]/46 bg-[#FFF8EA]/12 text-[#FFF8EA] hover:bg-[#FFF8EA]/18"
            : "border-[color:var(--inv-accent)] bg-[color:var(--inv-primary)] text-white hover:bg-[color:var(--inv-primary)]/92",
        ].join(" ")}
        onClick={onOpen}
        type="button"
      >
        {primaryLabel}
      </button>
      {mode === "preview" ? (
        <button
          className={[
            "inline-flex min-h-11 items-center justify-center border px-5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]",
            tone === "light"
              ? "border-[#FFF8EA]/30 bg-black/10 text-[#FFF8EA] hover:bg-black/18"
              : "border-[color:var(--inv-border)]/70 bg-[color:var(--inv-surface)]/76 text-[color:var(--inv-primary)] hover:bg-[color:var(--inv-surface)]",
          ].join(" ")}
          onClick={onClosePreview}
          type="button"
        >
          Volver a la invitacion
        </button>
      ) : null}
    </div>
  );
}

function TerraEnvelope({
  initials,
  isOpen,
}: {
  initials: string;
  isOpen: boolean;
}) {
  return (
    <div className="absolute inset-0 drop-shadow-[0_28px_70px_rgba(44,33,29,0.2)]">
      <div className="absolute inset-x-[4%] bottom-[6%] top-[20%] overflow-hidden border border-[color:var(--inv-border)]/70 bg-[color:var(--inv-primary)]">
        <div className="absolute inset-0 bg-[linear-gradient(145deg,transparent_49%,color-mix(in_srgb,var(--inv-accent)_34%,var(--inv-primary))_50%),linear-gradient(215deg,transparent_49%,color-mix(in_srgb,var(--inv-surface)_36%,var(--inv-primary))_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[52%] bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--inv-primary)_72%,black))]" />
      </div>
      <div
        className={[
          "absolute inset-x-[4%] top-[7%] z-10 h-[48%] origin-top border border-[color:var(--inv-border)]/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-surface)_24%,var(--inv-primary)),var(--inv-primary))] transition-transform duration-500 [clip-path:polygon(0_0,100%_0,50%_100%)] motion-reduce:transition-none",
          isOpen ? "[transform:rotateX(-46deg)_scaleY(0.78)] opacity-88" : "",
        ].join(" ")}
      />
      <img
        alt=""
        className="absolute left-1/2 top-[56%] z-20 size-20 -translate-x-1/2 -translate-y-1/2 object-contain sm:size-24"
        src="/wedding-themes/shared/seals/gold-wax-seal.png"
      />
      <span className="absolute left-1/2 top-[56%] z-30 -translate-x-1/2 -translate-y-1/2 font-serif text-2xl text-[color:var(--inv-primary)] sm:text-3xl">
        {initials}
      </span>
    </div>
  );
}

function VersallesBotanicalCorners() {
  return (
    <>
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-0 h-32 w-44 object-contain opacity-90 sm:h-44 sm:w-60"
        src="/wedding-themes/versalles/ornaments/emerald-floral-corner-top.png"
      />
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 z-0 h-40 w-48 object-contain opacity-80 sm:h-56 sm:w-64"
        src="/wedding-themes/versalles/ornaments/emerald-botanical-corner-bottom.png"
      />
    </>
  );
}

function TerraBotanicalCorners() {
  return (
    <>
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 h-36 w-44 object-contain opacity-84 sm:h-52 sm:w-60"
        src="/wedding-themes/terra/ornaments/sage-floral-corner-top.png"
      />
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-44 w-48 object-contain opacity-70 sm:h-60 sm:w-64"
        src="/wedding-themes/terra/ornaments/sage-botanical-corner-bottom.png"
      />
    </>
  );
}

function CeremonialEntryCorners() {
  return (
    <>
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-8 z-0 h-20 w-28 object-contain opacity-55"
        src="/wedding-themes/versalles/ornaments/pastel-floral-corner-top.png"
      />
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 right-2 z-0 h-24 w-28 object-contain opacity-48"
        src="/wedding-themes/versalles/ornaments/pastel-floral-corner-bottom.png"
      />
    </>
  );
}

function getEntryCopy({
  coupleName,
  dateLabel,
  recipient,
}: {
  coupleName: string;
  dateLabel: string;
  recipient: EntryRecipient;
}): EntryCopy {
  if (recipient) {
    const passLabel = recipient.maxGuests === 1 ? "1 pase" : `${recipient.maxGuests} pases`;

    return {
      description: `Con mucho carino hemos reservado esta invitacion para ${recipient.displayName}.`,
      detail: "Invitacion para",
      foot: passLabel,
      headline: recipient.displayName,
      title: recipient.displayName,
    };
  }

  return {
    description: `Te damos la bienvenida a la invitacion de ${coupleName}.`,
    detail: "Bienvenida",
    foot: dateLabel,
    headline: coupleName,
    title: coupleName,
  };
}

function getEntryInitials(title: string) {
  const parts = title
    .split("&")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return title.slice(0, 2).toUpperCase();
}
