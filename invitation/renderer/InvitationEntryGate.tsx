"use client";

/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type EntryFrame = "traditional" | "ornate" | "classic" | "organic" | "minimal";

type EntryRecipient = {
  displayName: string;
  maxGuests: number;
} | null;

type InvitationEntryGateProps = {
  children: ReactNode;
  coupleName: string;
  dateLabel: string;
  frame: EntryFrame;
  mode: "preview" | "public";
  recipient?: EntryRecipient;
};

type EntryVariant = {
  actionLabel: string;
  backdropClassName: string;
  bodyClassName: string;
  cardClassName: string;
  descriptionClassName: string;
  detailClassName: string;
  envelopeClassName: string;
  flapClassName: string;
  footClassName: string;
  hasFloralCorners?: boolean;
  hasClassicSeal?: boolean;
  hasTerraFold?: boolean;
  hasVersallesFlowers?: boolean;
  kicker: string;
  titleClassName: string;
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
  mode,
  recipient = null,
}: InvitationEntryGateProps) {
  const [state, setState] = useState<"closed" | "opening" | "open">("closed");
  const contentRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const variant = getEntryVariant(frame);
  const isVisible = state !== "open";
  const entryCopy = useMemo(
    () => getEntryCopy({ coupleName, dateLabel, recipient }),
    [coupleName, dateLabel, recipient],
  );

  useEffect(() => {
    const contentElement = contentRef.current;

    if (contentElement && "inert" in contentElement) {
      contentElement.inert = isVisible;
    }

    if (!isVisible) {
      return () => {
        if (contentElement && "inert" in contentElement) {
          contentElement.inert = false;
        }
      };
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    overlayRef.current
      ?.querySelector<HTMLElement>(focusableSelector)
      ?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
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

      if (contentElement && "inert" in contentElement) {
        contentElement.inert = false;
      }
    };
  }, [isVisible]);

  function revealInvitation() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setState("open");
      focusInvitation();
      return;
    }

    setState("opening");
    window.setTimeout(() => {
      setState("open");
      focusInvitation();
    }, 620);
  }

  function focusInvitation() {
    window.setTimeout(() => {
      const hero = document.getElementById("invitacion");
      hero?.setAttribute("tabindex", "-1");
      hero?.focus({ preventScroll: true });
      hero?.scrollIntoView({ block: "start" });
    }, 0);
  }

  function closePreviewEntry() {
    setState("open");
    window.setTimeout(() => {
      document.getElementById("invitacion")?.scrollIntoView({ block: "start" });
    }, 0);
  }

  return (
    <>
      <div ref={contentRef}>{children}</div>

      {isVisible ? (
        <div
          aria-labelledby="invitation-entry-title"
          aria-modal="true"
          className={[
            "fixed inset-0 z-50 grid min-h-dvh place-items-center overflow-y-auto px-5 py-[max(1.5rem,env(safe-area-inset-top))] text-center transition-opacity duration-500 motion-reduce:transition-none sm:px-8",
            variant.backdropClassName,
            state === "opening" ? "pointer-events-none opacity-0" : "opacity-100",
          ].join(" ")}
          ref={overlayRef}
          role="dialog"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,color-mix(in_srgb,var(--inv-surface)_72%,transparent),transparent_34%),linear-gradient(180deg,color-mix(in_srgb,var(--inv-bg)_92%,var(--inv-surface)),color-mix(in_srgb,var(--inv-primary)_14%,var(--inv-bg)))]" />
          <div className={variant.cardClassName}>
            {variant.hasVersallesFlowers ? <VersallesEntryFlowers /> : null}
            {variant.hasFloralCorners ? <CeremonialEntryCorners /> : null}

            <div
              aria-hidden="true"
              className={[
                variant.envelopeClassName,
                state === "opening" ? "scale-[1.04] opacity-0" : "",
              ].join(" ")}
            >
              <div className={variant.flapClassName} />
              {variant.hasTerraFold ? <TerraEnvelopeFolds /> : null}
              <div className="absolute inset-x-[8%] bottom-[8%] top-[20%] border border-[color:var(--inv-border)]/60 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-surface)_96%,var(--inv-bg)),color-mix(in_srgb,var(--inv-accent)_12%,var(--inv-surface)))] shadow-[0_24px_60px_rgba(16,42,67,0.16)]" />
              <div className="absolute left-1/2 top-[48%] z-20 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--inv-accent)]/70 bg-[color:var(--inv-surface)] text-[color:var(--inv-primary)] shadow-[0_12px_34px_rgba(16,42,67,0.18)] sm:size-20">
                <span className="font-serif text-2xl font-normal sm:text-3xl">
                  {getEntryInitials(coupleName)}
                </span>
              </div>
              {variant.hasClassicSeal ? (
                <img
                  alt=""
                  className="absolute left-1/2 top-[74%] z-20 h-4 w-40 -translate-x-1/2 opacity-80"
                  src="/wedding-themes/classic/ornaments/line-divider-top.svg"
                />
              ) : null}
            </div>

            <div className={variant.bodyClassName}>
              <p className={variant.detailClassName}>{variant.kicker}</p>
              <h2 className={variant.titleClassName} id="invitation-entry-title">
                {entryCopy.title}
              </h2>
              <p className={variant.descriptionClassName}>
                {entryCopy.description}
              </p>
              {recipient ? (
                <p className={variant.footClassName}>
                  {recipient.maxGuests}{" "}
                  {recipient.maxGuests === 1 ? "pase" : "pases"} reservados
                </p>
              ) : (
                <p className={variant.footClassName}>{dateLabel}</p>
              )}

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  className="inline-flex min-h-11 min-w-44 items-center justify-center border border-[color:var(--inv-accent)] bg-[color:var(--inv-primary)] px-6 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(16,42,67,0.18)] transition-colors hover:bg-[color:var(--inv-primary)]/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
                  onClick={revealInvitation}
                  type="button"
                >
                  {variant.actionLabel}
                </button>
                {mode === "preview" ? (
                  <button
                    className="inline-flex min-h-11 items-center justify-center border border-[color:var(--inv-border)]/70 bg-[color:var(--inv-surface)]/76 px-5 text-sm font-semibold text-[color:var(--inv-primary)] transition-colors hover:bg-[color:var(--inv-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
                    onClick={closePreviewEntry}
                    type="button"
                  >
                    Volver a la invitacion
                  </button>
                ) : null}
              </div>
              <noscript>
                <a
                  className="mt-5 inline-flex text-sm font-semibold text-[color:var(--inv-primary)] underline underline-offset-4"
                  href="#invitacion"
                >
                  Ir a la invitacion
                </a>
              </noscript>
            </div>
          </div>
        </div>
      ) : null}
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
}) {
  if (recipient) {
    return {
      description: `Con mucho carino hemos reservado esta invitacion para ${recipient.displayName}.`,
      title: recipient.displayName,
    };
  }

  return {
    description: `Te damos la bienvenida a la invitacion de ${coupleName}.`,
    title: dateLabel,
  };
}

function getEntryVariant(frame: EntryFrame): EntryVariant {
  const base: EntryVariant = {
    actionLabel: "Abrir invitacion",
    backdropClassName: "text-[color:var(--inv-text)]",
    bodyClassName:
      "relative z-10 mx-auto -mt-8 w-full max-w-md border border-[color:var(--inv-border)]/65 bg-[color:var(--inv-surface)]/94 px-6 py-7 shadow-[0_28px_80px_rgba(16,42,67,0.16)] sm:px-9 sm:py-9",
    cardClassName: "relative z-10 w-full max-w-xl",
    descriptionClassName:
      "mx-auto mt-4 max-w-sm text-sm leading-6 text-[color:var(--inv-muted)]",
    detailClassName:
      "text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--inv-secondary)]",
    envelopeClassName:
      "relative mx-auto aspect-[1.22] w-full max-w-[30rem] transition-all duration-700 ease-out motion-reduce:transition-none",
    flapClassName:
      "absolute inset-x-[8%] top-[12%] z-10 h-[45%] origin-top border border-[color:var(--inv-border)]/55 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-accent)_20%,var(--inv-surface)),var(--inv-surface))] [clip-path:polygon(0_0,100%_0,50%_100%)]",
    footClassName:
      "mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--inv-secondary)]",
    kicker: "Invitacion para",
    titleClassName:
      "mt-3 text-balance font-serif text-[2.7rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[3.3rem]",
  };

  if (frame === "ornate") {
    return {
      ...base,
      bodyClassName:
        "relative z-10 mx-auto -mt-10 w-full max-w-md border border-[color:var(--inv-accent)]/55 bg-[color:var(--inv-surface)]/94 px-6 py-8 shadow-[0_30px_90px_rgba(16,42,67,0.18)] outline outline-1 outline-offset-[-14px] outline-[color:var(--inv-border)]/42 sm:px-10 sm:py-10",
      cardClassName: "relative z-10 w-full max-w-[36rem]",
      envelopeClassName:
        "relative mx-auto aspect-[1.18] w-full max-w-[32rem] transition-all duration-700 ease-out motion-reduce:transition-none",
      hasVersallesFlowers: true,
      titleClassName:
        "mt-3 text-balance font-serif text-[3rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[3.85rem]",
    };
  }

  if (frame === "classic") {
    return {
      ...base,
      bodyClassName:
        "relative z-10 mx-auto -mt-6 w-full max-w-md border-y border-[color:var(--inv-border)] bg-[color:var(--inv-surface)]/92 px-6 py-7 shadow-[0_24px_70px_rgba(16,42,67,0.12)] sm:px-9",
      flapClassName:
        "absolute inset-x-[8%] top-[14%] z-10 h-[42%] origin-top border border-[color:var(--inv-border)]/60 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-primary)_8%,var(--inv-surface)),var(--inv-surface))] [clip-path:polygon(0_0,100%_0,50%_100%)]",
      hasClassicSeal: true,
      titleClassName:
        "mt-3 text-balance font-serif text-[2.35rem] font-semibold leading-tight text-[color:var(--inv-primary)] sm:text-[2.9rem]",
    };
  }

  if (frame === "organic") {
    return {
      ...base,
      actionLabel: "Abrir sobre",
      bodyClassName:
        "relative z-10 mx-auto -mt-8 w-full max-w-md rounded-t-[34px] border border-[color:var(--inv-border)]/60 bg-[color:var(--inv-surface)]/94 px-6 py-7 shadow-[0_28px_80px_rgba(44,33,29,0.16)] sm:px-9 sm:py-9",
      envelopeClassName:
        "relative mx-auto aspect-[1.12] w-full max-w-[31rem] transition-all duration-700 ease-out motion-reduce:transition-none",
      flapClassName:
        "absolute inset-x-[7%] top-[11%] z-10 h-[47%] origin-top border border-[color:var(--inv-border)]/55 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--inv-primary)_22%,var(--inv-surface)),var(--inv-surface))] [clip-path:polygon(0_0,100%_0,50%_100%)]",
      hasTerraFold: true,
      titleClassName:
        "mt-3 text-balance font-serif text-[2.55rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[3.25rem]",
    };
  }

  if (frame === "minimal") {
    return {
      ...base,
      bodyClassName:
        "relative z-10 mx-auto -mt-4 w-full max-w-md border-b border-t border-[color:var(--inv-border)]/55 bg-[color:var(--inv-bg)]/90 px-5 py-7 shadow-none sm:px-8",
      cardClassName: "relative z-10 w-full max-w-lg",
      envelopeClassName:
        "relative mx-auto aspect-[1.3] w-full max-w-[28rem] transition-all duration-700 ease-out motion-reduce:transition-none",
      titleClassName:
        "mt-3 text-balance font-serif text-[2.25rem] font-normal leading-tight text-[color:var(--inv-primary)] sm:text-[2.85rem]",
    };
  }

  return {
    ...base,
    hasFloralCorners: true,
  };
}

function TerraEnvelopeFolds() {
  return (
    <>
      <div className="absolute inset-x-[8%] bottom-[8%] z-10 h-[55%] bg-[linear-gradient(140deg,transparent_49%,color-mix(in_srgb,var(--inv-primary)_15%,var(--inv-surface))_50%),linear-gradient(220deg,transparent_49%,color-mix(in_srgb,var(--inv-accent)_24%,var(--inv-surface))_50%)]" />
      <svg
        aria-hidden="true"
        className="absolute bottom-[18%] right-[15%] z-20 h-24 w-16 rotate-12 text-[color:var(--inv-primary)]/28"
        fill="none"
        viewBox="0 0 80 130"
      >
        <path
          d="M16 118c20-24 25-52 28-102"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M38 50c14-5 24-15 29-30-15 3-25 13-29 30Z"
          fill="currentColor"
          opacity="0.38"
        />
        <path
          d="M31 78c15-3 27-11 35-24-16 1-28 9-35 24Z"
          fill="currentColor"
          opacity="0.32"
        />
      </svg>
    </>
  );
}

function VersallesEntryFlowers() {
  return (
    <>
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-2 z-20 h-24 w-32 object-contain opacity-88 sm:-left-2 sm:h-32 sm:w-44"
        src="/wedding-themes/versalles/ornaments/pastel-floral-corner-top.png"
      />
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-2 z-20 h-24 w-32 -scale-x-100 object-contain opacity-78 sm:-right-2 sm:h-32 sm:w-44"
        src="/wedding-themes/versalles/ornaments/pastel-floral-corner-top.png"
      />
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-28 right-1 z-20 hidden h-28 w-36 object-contain opacity-74 sm:block"
        src="/wedding-themes/versalles/ornaments/pastel-floral-corner-bottom.png"
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
        className="pointer-events-none absolute left-2 top-8 z-20 h-20 w-28 object-contain opacity-70"
        src="/wedding-themes/versalles/ornaments/pastel-floral-corner-top.png"
      />
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-32 right-2 z-20 h-24 w-28 object-contain opacity-62"
        src="/wedding-themes/versalles/ornaments/pastel-floral-corner-bottom.png"
      />
    </>
  );
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
