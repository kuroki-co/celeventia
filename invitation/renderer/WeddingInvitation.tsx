/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import {
  ExternalLink,
  Landmark,
  Mail,
  WalletCards,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { previewWeddingDemoContent } from "../demoData";
import { GiftCopyAction } from "./GiftCopyAction";
import { InvitationGallery } from "./InvitationGallery";
import {
  getInvitationPalette,
  getInvitationTheme,
} from "../themes";
import type {
  GiftMethod,
  InvitationLocation,
  InvitationTimelineItem,
  WeddingInvitationContent,
  WeddingInvitationEvent,
} from "./types";

export type { WeddingInvitationEvent } from "./types";

type WeddingInvitationProps = {
  event: WeddingInvitationEvent;
  mode: "preview" | "public";
  recipient?: {
    displayName: string;
    maxGuests: number;
  } | null;
  children?: ReactNode;
};

export function WeddingInvitation({
  event,
  mode,
  recipient,
  children,
}: WeddingInvitationProps) {
  const theme = getInvitationTheme(event.themeId);
  const palette = getInvitationPalette(event.paletteId);
  const colors = palette.colors;
  const content =
    mode === "preview" ? mergePreviewContent(event) : normalizeContent(event);
  const locations = getLocations(event, content, mode);
  const heroImage = content.heroImage;
  const sectionClassName = getSectionClassName(theme.frame);
  const isTraditional = theme.frame === "traditional";

  return (
    <article
      className={[
        "min-h-dvh overflow-hidden",
        isTraditional
          ? "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.75),transparent_22%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.55),transparent_20%)]"
          : "",
      ].join(" ")}
      style={
        {
          "--inv-bg": colors.background,
          "--inv-surface": colors.surface,
          "--inv-primary": colors.primary,
          "--inv-secondary": colors.secondary,
          "--inv-accent": colors.accent,
          "--inv-text": colors.text,
          "--inv-muted": colors.muted,
          "--inv-border": colors.border,
          background: colors.background,
          color: colors.text,
        } as CSSProperties
      }
    >
      {recipient ? (
        <EnvelopeIntro
          dateLabel={event.dateLabel}
          isTraditional={isTraditional}
          recipient={recipient}
          title={event.coupleName}
        />
      ) : null}

      <InvitationHero
        dateLabel={event.dateLabel}
        image={heroImage}
        isTraditional={isTraditional}
        message={event.mainInvitationMessage}
        title={event.coupleName}
        tagline={content.tagline}
        themeFrame={theme.frame}
      />

      <div
        className={[
          "mx-auto px-5 py-14 sm:px-8 lg:px-10 lg:py-20",
          isTraditional ? "max-w-[920px]" : "max-w-6xl",
        ].join(" ")}
      >
        <FamilySection
          className={sectionClassName}
          content={content.family}
          isTraditional={isTraditional}
        />
        <SaveTheDateSection
          className={sectionClassName}
          content={content.saveTheDate}
          dateLabel={event.dateLabel}
          isTraditional={isTraditional}
        />
        <LocationsSection
          className={sectionClassName}
          isTraditional={isTraditional}
          locations={locations}
        />
        <TimelineSection
          className={sectionClassName}
          isTraditional={isTraditional}
          items={content.itinerary}
          title="Itinerario"
        />
        <DressCodeSection
          className={sectionClassName}
          content={content.dressCode}
          isTraditional={isTraditional}
        />
        {(children || mode === "preview") ? (
          <RsvpSection
            className={sectionClassName}
            isTraditional={isTraditional}
            recipient={recipient}
            showPreviewFallback={mode === "preview" && !children}
          >
            {children}
          </RsvpSection>
        ) : null}
        <GiftsSection
          className={sectionClassName}
          gifts={content.gifts}
          isTraditional={isTraditional}
        />
        <GallerySection
          className={sectionClassName}
          images={content.galleryImages}
          isTraditional={isTraditional}
        />
        <StorySection
          className={sectionClassName}
          isTraditional={isTraditional}
          items={content.story}
        />
        <ClosingSection
          className={sectionClassName}
          isTraditional={isTraditional}
          message={content.closingMessage}
          title={event.coupleName}
        />
      </div>
    </article>
  );
}

function EnvelopeIntro({
  dateLabel,
  isTraditional,
  recipient,
  title,
}: {
  dateLabel: string;
  isTraditional: boolean;
  recipient: NonNullable<WeddingInvitationProps["recipient"]>;
  title: string;
}) {
  return (
    <section className="grid min-h-dvh place-items-center px-5 py-10 text-center">
      <div
        className={[
          "relative w-full max-w-xl border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)] px-6 py-10 sm:px-10 sm:py-14",
          isTraditional
            ? "shadow-none outline outline-1 outline-offset-[-12px] outline-[color:var(--inv-border)]"
            : "shadow-[0_28px_100px_rgba(16,42,67,0.10)]",
        ].join(" ")}
      >
        {isTraditional ? <FloralCorner position="top-left" /> : null}
        {isTraditional ? <FloralCorner position="bottom-right" /> : null}
        <p
          className={[
            "text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--inv-secondary)]",
            isTraditional ? "font-serif normal-case tracking-[0.08em]" : "",
          ].join(" ")}
        >
          Te invitamos a
        </p>
        <h1
          className={[
            "mt-5 font-serif text-[3.4rem] font-semibold leading-none text-[color:var(--inv-primary)] sm:text-[4.4rem]",
            isTraditional ? "font-normal" : "",
          ].join(" ")}
        >
          Nuestra Boda
        </h1>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--inv-muted)]">
          Invitacion para
        </p>
        <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[color:var(--inv-text)]">
          {recipient.displayName}
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-[color:var(--inv-muted)]">
          Con mucho carino hemos reservado para ustedes
        </p>
        <p className="mt-4 text-2xl font-semibold text-[color:var(--inv-primary)]">
          {recipient.maxGuests} {recipient.maxGuests === 1 ? "pase" : "pases"}
        </p>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--inv-secondary)]">
          {formatShortDate(dateLabel)}
        </p>
        <a
          className="mt-8 inline-flex min-h-11 items-center justify-center border border-[color:var(--inv-accent)] px-5 text-sm font-semibold text-[color:var(--inv-primary)] transition-colors hover:bg-[color:var(--inv-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
          href="#invitacion"
        >
          Abrir invitacion
        </a>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[color:var(--inv-muted)]">
          {title}
        </p>
      </div>
    </section>
  );
}

function InvitationHero({
  dateLabel,
  image,
  isTraditional,
  message,
  tagline,
  themeFrame,
  title,
}: {
  dateLabel: string;
  image?: WeddingInvitationContent["heroImage"];
  isTraditional: boolean;
  message?: string | null;
  tagline?: string | null;
  themeFrame: string;
  title: string;
}) {
  const heroImage = resolveHeroImage(image);

  if (isTraditional) {
    return (
      <section
        className="relative grid min-h-[100svh] place-items-center overflow-hidden px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] text-center lg:min-h-screen sm:px-8"
        id="invitacion"
      >
        {heroImage.src ? (
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            src={heroImage.src}
            style={{ objectPosition: heroImage.objectPosition }}
          />
        ) : (
          <div className="absolute inset-0 bg-[color:var(--inv-primary)]" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.34),rgba(0,0,0,0.13)_56%,rgba(0,0,0,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent_24%,transparent_68%,rgba(0,0,0,0.26))]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[56rem] flex-col items-center justify-center text-white">
          <p className="text-[0.66rem] font-normal uppercase tracking-[0.42em] text-[#FFF8EA]/84 sm:text-[0.72rem]">
            Nos casamos
          </p>
          <h1 className="mx-auto mt-8 max-w-[52rem] text-balance font-serif text-[clamp(3.35rem,8vw,6.35rem)] font-normal leading-[0.92] text-[#FFF8EA] drop-shadow-[0_3px_14px_rgba(0,0,0,0.24)] sm:leading-[0.94]">
            <HeroTitle title={title} />
          </h1>
          <div
            aria-hidden="true"
            className="mt-8 h-px w-16 bg-[#FFF8EA]/46 sm:w-20"
          />
          <p className="mt-11 font-serif text-[1.05rem] font-normal text-[#FFF8EA]/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)] sm:text-xl">
            {dateLabel}
          </p>
          {tagline || message ? (
            <p className="mx-auto mt-4 max-w-[34rem] font-serif text-[0.98rem] font-normal italic leading-7 text-[#FFF8EA]/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)] sm:text-[1.08rem] sm:leading-8">
              {tagline ?? message}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative grid min-h-dvh place-items-end overflow-hidden px-5 py-8 sm:px-8 lg:px-12"
      id="invitacion"
    >
      {heroImage.src ? (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          src={heroImage.src}
          style={{ objectPosition: heroImage.objectPosition }}
        />
      ) : (
        <div className="absolute inset-0 bg-[color:var(--inv-surface)]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.08),rgba(17,17,17,0.68))]" />
      <div
        className={[
          "relative mx-auto w-full max-w-5xl border border-white/35 bg-white/90 px-5 py-8 text-center shadow-[0_28px_100px_rgba(16,42,67,0.16)] sm:px-10 sm:py-12 lg:mb-8",
          themeFrame === "minimal" ? "rounded-none" : "rounded-[28px]",
        ].join(" ")}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--inv-secondary)]">
          Nos casamos
        </p>
        <h1 className="mx-auto mt-5 max-w-4xl font-serif text-[4rem] font-semibold leading-[0.88] text-[color:var(--inv-primary)] sm:text-[6rem] lg:text-[7.5rem]">
          {title}
        </h1>
        <p className="mt-6 text-base font-semibold text-[color:var(--inv-muted)] sm:text-lg">
          {dateLabel}
        </p>
        {tagline || message ? (
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[color:var(--inv-text)] sm:text-lg">
            {tagline ?? message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function HeroTitle({ title }: { title: string }) {
  const titleParts = title.split("&").map((part) => part.trim());

  if (titleParts.length !== 2 || !titleParts[0] || !titleParts[1]) {
    return title;
  }

  return (
    <>
      <span className="hidden sm:inline">{title}</span>
      <span className="sm:hidden">
        <span className="block">{titleParts[0]}</span>
        <span className="block">&amp;</span>
        <span className="block">{titleParts[1]}</span>
      </span>
    </>
  );
}

function resolveHeroImage(image?: WeddingInvitationContent["heroImage"]) {
  if (!image) {
    return {
      objectPosition: "center center",
      src: null,
    };
  }

  if (typeof image === "string") {
    return {
      objectPosition: "center center",
      src: image,
    };
  }

  const focalX = clampFocalPoint(image.focalX);
  const focalY = clampFocalPoint(image.focalY);

  return {
    objectPosition: `${focalX}% ${focalY}%`,
    src: image.url,
  };
}

function clampFocalPoint(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, value));
}

function FamilySection({
  className,
  content,
  isTraditional,
}: {
  className: string;
  content: WeddingInvitationContent["family"];
  isTraditional: boolean;
}) {
  if (!content) {
    return null;
  }

  const groups = [
    ["Padres del novio", content.groomParents],
    ["Padres de la novia", content.brideParents],
    ["Padrinos de boda", content.godparents],
    ["Testigos de boda civil", content.witnesses],
  ].filter((group): group is [string, string[]] => Boolean(group[1]?.length));

  if (!groups.length) {
    return null;
  }

  return (
    <section className={className}>
      {isTraditional ? (
        <div className="relative mx-auto max-w-[760px] overflow-hidden border border-[color:var(--inv-border)]/65 bg-[linear-gradient(180deg,rgba(255,253,248,0.94),rgba(250,244,236,0.9)),radial-gradient(circle_at_50%_-8%,rgba(255,255,255,0.92),transparent_38%),radial-gradient(circle_at_50%_108%,color-mix(in_srgb,var(--inv-accent)_13%,transparent),transparent_34%)] px-6 py-12 text-center shadow-[0_30px_90px_rgba(16,42,67,0.08)] outline outline-1 outline-offset-[-14px] outline-[color:var(--inv-border)]/45 sm:px-12 sm:py-14 lg:px-16 lg:py-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_srgb,var(--inv-muted)_20%,transparent)_1px,transparent_0)] [background-size:22px_22px]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-4 border border-[color:var(--inv-border)]/35 sm:inset-5"
          />
          <CeremonialFloralCorner position="top-left" />
          <CeremonialFloralCorner position="top-right" />
          <CeremonialFloralCorner position="bottom-left" />
          <CeremonialFloralCorner position="bottom-right" />
          <div className="relative mx-auto max-w-[40rem]">
            <p className="font-serif text-[1.05rem] italic leading-7 text-[color:var(--inv-secondary)] sm:text-[1.2rem]">
              Con la bendición de Dios
            </p>
            <h2 className="mx-auto mt-4 max-w-xl text-balance font-serif text-[2.25rem] font-normal leading-[1.03] text-[color:var(--inv-primary)] sm:text-[3rem]">
              y el amor de nuestros padres
            </h2>
            <CeremonialOrnament />
            <TraditionalFamilyGroups groups={groups} />
            <CeremonialOrnament compact />
            <p className="mx-auto mt-6 max-w-md font-serif text-[1.16rem] font-normal italic leading-8 text-[color:var(--inv-muted)] sm:text-[1.32rem]">
              Nos complace invitarte a ser parte de este gran día.
            </p>
          </div>
        </div>
      ) : (
        <>
          <SectionHeader
            eyebrow="Familias"
            title={content.intro ?? "Con la bendicion de nuestras familias"}
          />
          <FamilyGroups groups={groups} />
        </>
      )}
    </section>
  );
}

function TraditionalFamilyGroups({
  groups,
}: {
  groups: Array<[string, string[]]>;
}) {
  const parents = groups.filter(([label]) =>
    ["Padres del novio", "Padres de la novia"].includes(label),
  );
  const witnesses = groups.filter(([label]) =>
    ["Padrinos de boda", "Testigos de boda civil"].includes(label),
  );

  return (
    <div className="mx-auto mt-9 max-w-[40rem]">
      {parents.length ? <TraditionalFamilyPair groups={parents} /> : null}
      {parents.length && witnesses.length ? (
        <div className="my-9 sm:my-10">
          <div className="mx-auto flex items-center justify-center gap-3 text-[color:var(--inv-accent)]/70">
            <span className="h-px w-12 bg-[color:var(--inv-border)]/80" />
            <span
              aria-hidden="true"
              className="size-1.5 rotate-45 border border-[color:var(--inv-accent)]"
            />
            <span className="h-px w-12 bg-[color:var(--inv-border)]/80" />
          </div>
        </div>
      ) : null}
      {witnesses.length ? <TraditionalFamilyPair groups={witnesses} /> : null}
    </div>
  );
}

function TraditionalFamilyPair({
  groups,
}: {
  groups: Array<[string, string[]]>;
}) {
  return (
    <div
      className={[
        "grid gap-9",
        groups.length > 1 ? "sm:grid-cols-2 sm:gap-12" : "",
      ].join(" ")}
    >
      {groups.map(([label, names]) => (
        <TraditionalFamilyGroup key={label} label={label} names={names} />
      ))}
    </div>
  );
}

function TraditionalFamilyGroup({
  label,
  names,
}: {
  label: string;
  names: string[];
}) {
  return (
    <div className="text-center">
      <h3 className="text-[0.68rem] font-medium uppercase leading-5 tracking-[0.28em] text-[color:var(--inv-secondary)]">
        {label}
      </h3>
      <div className="mt-4 space-y-1.5 font-serif text-[1.55rem] font-normal leading-tight text-[color:var(--inv-primary)] sm:text-[1.78rem]">
        {names.map((name) => (
          <p key={name}>{name}</p>
        ))}
      </div>
    </div>
  );
}

function FamilyGroups({
  groups,
  isTraditional = false,
}: {
  groups: Array<[string, string[]]>;
  isTraditional?: boolean;
}) {
  return (
      <div
        className={[
          "grid",
          isTraditional ? "mx-auto mt-7 max-w-2xl gap-3" : "mt-10 gap-5 md:grid-cols-2",
        ].join(" ")}
      >
        {groups.map(([label, names]) => (
          <div
            className={[
              "text-center",
              isTraditional
                ? "border-0 bg-transparent px-4 py-3"
                : "border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)] px-5 py-6",
            ].join(" ")}
            key={label}
          >
            <p
              className={[
                "text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--inv-secondary)]",
                isTraditional ? "font-serif text-[1.05rem] font-normal italic normal-case tracking-[0.02em]" : "",
              ].join(" ")}
            >
              {label}
            </p>
            <div
              className={[
                "font-serif leading-tight text-[color:var(--inv-primary)]",
                isTraditional
                  ? "mt-3 space-y-1.5 text-[1.7rem] font-normal sm:text-[1.95rem]"
                  : "mt-4 space-y-2 text-2xl font-semibold",
              ].join(" ")}
            >
              {names.map((name) => (
                <p key={name}>{name}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
  );
}

function SaveTheDateSection({
  className,
  content,
  dateLabel,
  isTraditional,
}: {
  className: string;
  content: WeddingInvitationContent["saveTheDate"];
  dateLabel: string;
  isTraditional: boolean;
}) {
  if (!content) {
    return null;
  }

  if (isTraditional) {
    return (
      <section className={className}>
        <div className="mx-auto grid max-w-2xl gap-7 text-center">
          <div className="mx-auto w-full max-w-[19rem] px-4">
            <div className="mx-auto h-px w-24 bg-[color:var(--inv-border)]" />
            <div className="relative py-6">
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[color:var(--inv-accent)] bg-[color:var(--inv-bg)]"
              />
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[color:var(--inv-secondary)]">
                {content.month}
              </p>
              <p className="mt-3 font-serif text-[4.85rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[5.35rem]">
                {content.day}
              </p>
              <p className="mt-3 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[color:var(--inv-muted)]">
                {content.weekday}
              </p>
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-1/2 rotate-45 border border-[color:var(--inv-accent)] bg-[color:var(--inv-bg)]"
              />
            </div>
            <div className="mx-auto h-px w-24 bg-[color:var(--inv-border)]" />
          </div>
          <div className="mx-auto max-w-2xl">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.3em] text-[color:var(--inv-secondary)]">
              Save the Date
            </p>
            <h2 className="mt-4 font-serif text-[2.35rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[3.2rem]">
              El gran dia
            </h2>
            <CeremonialOrnament compact />
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
              {content.message ?? dateLabel}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="mx-auto w-full max-w-sm border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)] p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--inv-secondary)]">
            {content.month}
          </p>
          <p className="mt-4 font-serif text-[6rem] font-semibold leading-none text-[color:var(--inv-primary)]">
            {content.day}
          </p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--inv-muted)]">
            {content.weekday}
          </p>
        </div>
        <div>
          <SectionHeader
            eyebrow="Save the Date"
            title="El gran dia"
          />
          <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-8 text-[color:var(--inv-muted)]">
            {content.message ?? dateLabel}
          </p>
        </div>
      </div>
    </section>
  );
}

function LocationsSection({
  className,
  isTraditional,
  locations,
}: {
  className: string;
  isTraditional: boolean;
  locations: InvitationLocation[];
}) {
  if (!locations.length) {
    return null;
  }

  if (isTraditional) {
    return (
      <section className={className}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-[color:var(--inv-secondary)]">
            Lugares
          </p>
          <h2 className="mt-4 font-serif text-[2.35rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[3.25rem]">
            Donde celebraremos
          </h2>
          <CeremonialOrnament compact />
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
            Cada momento tiene un lugar especial preparado para recibirlos.
          </p>
        </div>
        <div className="mx-auto mt-11 grid max-w-3xl gap-14 sm:mt-12 sm:gap-16">
          {locations.map((location) => (
            <article
              className="text-center"
              key={`${location.kind}-${location.name}`}
            >
              {location.image ? (
                <img
                  alt=""
                  className="h-64 w-full object-cover sm:h-80"
                  src={location.image}
                />
              ) : null}
              <div className="mx-auto border-x border-b border-[color:var(--inv-border)]/65 px-5 py-7 sm:px-10 sm:py-8">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[color:var(--inv-secondary)]">
                  {location.kind}
                </p>
                <h3 className="mx-auto mt-4 max-w-xl font-serif text-[2rem] font-normal leading-tight text-[color:var(--inv-primary)] sm:text-[2.55rem]">
                  {location.name}
                </h3>
                <p className="mt-4 text-sm font-normal text-[color:var(--inv-text)]/78">
                  {[location.date, location.time].filter(Boolean).join(" - ")}
                </p>
                {location.address ? (
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[color:var(--inv-muted)]">
                    {location.address}
                  </p>
                ) : null}
                {location.mapUrl ? (
                  <a
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 border border-[color:var(--inv-accent)]/65 bg-transparent px-5 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--inv-primary)] transition-colors hover:border-[color:var(--inv-secondary)] hover:text-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
                    href={location.mapUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ver ubicacion
                    <span aria-hidden="true">-&gt;</span>
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Lugares"
        isTraditional={isTraditional}
        title="Donde celebraremos"
        text="Cada momento tiene un lugar especial preparado para recibirlos."
      />
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {locations.map((location) => (
          <article
            className="overflow-hidden border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)]"
            key={`${location.kind}-${location.name}`}
          >
            {location.image ? (
              <img
                alt=""
                className="h-56 w-full object-cover"
                src={location.image}
              />
            ) : null}
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--inv-secondary)]">
                {location.kind}
              </p>
              <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[color:var(--inv-primary)]">
                {location.name}
              </h3>
              <p className="mt-3 text-sm font-semibold text-[color:var(--inv-text)]">
                {[location.date, location.time].filter(Boolean).join(" - ")}
              </p>
              {location.address ? (
                <p className="mt-2 text-sm leading-6 text-[color:var(--inv-muted)]">
                  {location.address}
                </p>
              ) : null}
              {location.mapUrl ? (
                <a
                  className="mt-5 inline-flex min-h-10 items-center justify-center border border-[color:var(--inv-accent)] px-4 text-sm font-semibold text-[color:var(--inv-primary)] transition-colors hover:bg-[color:var(--inv-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
                  href={location.mapUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver mapa
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TimelineSection({
  className,
  isTraditional,
  items,
  title,
}: {
  className: string;
  isTraditional: boolean;
  items?: InvitationTimelineItem[];
  title: string;
}) {
  if (!items?.length) {
    return null;
  }

  if (isTraditional) {
    return (
      <section className={className}>
        <SectionHeader
          eyebrow="Celebracion"
          isTraditional={isTraditional}
          title={title}
        />
        <div className="relative mx-auto mt-8 max-w-2xl sm:mt-9">
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 bg-[color:var(--inv-border)]/70"
          />
          <ol className="relative space-y-7 text-center sm:space-y-8">
            {items.map((item) => (
              <li
                className="relative mx-auto max-w-md bg-[color:var(--inv-bg)] px-4"
                key={`${item.time ?? item.date}-${item.title}`}
              >
                <span
                  aria-hidden="true"
                  className="mx-auto mb-3 block size-3 rotate-45 border border-[color:var(--inv-accent)] bg-[color:var(--inv-bg)] shadow-[0_0_0_5px_var(--inv-bg)]"
                />
                <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[color:var(--inv-secondary)] sm:text-xs">
                  {item.time ?? item.date}
                </p>
                <h3 className="mt-2 font-serif text-[2rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[2.45rem]">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-[color:var(--inv-muted)] sm:text-[0.95rem]">
                    {item.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Celebracion"
        isTraditional={isTraditional}
        title={title}
      />
      <div className="mt-10 grid gap-4">
        {items.map((item) => (
          <div
            className="grid gap-3 border-t border-[color:var(--inv-border)] pt-5 sm:grid-cols-[140px_minmax(0,1fr)]"
            key={`${item.time ?? item.date}-${item.title}`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--inv-secondary)]">
              {item.time ?? item.date}
            </p>
            <div>
              <h3 className="font-serif text-3xl font-semibold leading-tight text-[color:var(--inv-primary)]">
                {item.title}
              </h3>
              {item.description ? (
                <p className="mt-2 text-sm leading-7 text-[color:var(--inv-muted)]">
                  {item.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DressCodeSection({
  className,
  content,
  isTraditional,
}: {
  className: string;
  content: WeddingInvitationContent["dressCode"];
  isTraditional: boolean;
}) {
  if (!content) {
    return null;
  }

  const entries = [
    ["Ellos", content.men],
    ["Ellas", content.women],
    ["Niños", content.children],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  if (!content.style && !entries.length && !content.avoidColors?.length) {
    return null;
  }

  if (isTraditional) {
    return (
      <section className={className}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-[color:var(--inv-secondary)]">
            Dress Code
          </p>
          <h2 className="mt-4 font-serif text-[2.35rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[3.2rem]">
            {content.style ?? "Vestimenta"}
          </h2>
          <CeremonialOrnament compact />
        </div>

        <div className="mx-auto mt-9 grid max-w-4xl gap-9 md:grid-cols-2 md:gap-12">
          {content.men ? (
            <DressCodeFigure
              description={content.men}
              illustration="men"
              title="Ellos"
            />
          ) : null}
          {content.women ? (
            <DressCodeFigure
              description={content.women}
              illustration="women"
              title="Ellas"
            />
          ) : null}
        </div>

        {content.children ? (
          <div className="mx-auto mt-10 max-w-xl text-center">
            <CeremonialOrnament compact />
            <h3 className="font-serif text-[1.85rem] font-normal leading-tight text-[color:var(--inv-primary)]">
              Niños
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--inv-muted)]">
              {content.children}
            </p>
          </div>
        ) : null}

        {content.avoidColors?.length ? (
          <div className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[color:var(--inv-secondary)]">
              Colores a evitar
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-4 sm:gap-6">
              {content.avoidColors.map((colorName) => (
                <div
                  className="flex min-w-20 flex-col items-center gap-2 text-center"
                  key={getAvoidColorName(colorName)}
                >
                  <span
                    aria-hidden="true"
                    className="size-8 rounded-full border border-[color:var(--inv-border)]"
                    style={{ background: getAvoidColorSwatch(colorName) }}
                  />
                  <span className="text-xs leading-5 text-[color:var(--inv-muted)]">
                    {getAvoidColorName(colorName)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Dress Code"
        title={content.style ?? "Vestimenta"}
      />
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {entries.map(([label, text]) => (
          <div
            className="border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)] p-5"
            key={label}
          >
            <h3 className="font-serif text-3xl font-semibold text-[color:var(--inv-primary)]">
              {label}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--inv-muted)]">
              {text}
            </p>
          </div>
        ))}
      </div>
      {content.avoidColors?.length ? (
        <p className="mt-6 text-sm leading-7 text-[color:var(--inv-muted)]">
          Colores a evitar:{" "}
          <span className="font-semibold text-[color:var(--inv-text)]">
            {formatAvoidColors(content.avoidColors)}
          </span>
        </p>
      ) : null}
    </section>
  );
}

function DressCodeFigure({
  description,
  illustration,
  title,
}: {
  description: string;
  illustration: "men" | "women";
  title: string;
}) {
  const image =
    illustration === "men"
      ? {
          alt: "Referencia de vestimenta formal masculina Celeventia",
          src: "/images/celeventia-man.png",
        }
      : {
          alt: "Referencia de vestimenta formal femenina Celeventia",
          src: "/images/celeventia-woman.png",
        };

  return (
    <article className="text-center">
      <div className="mx-auto flex min-h-72 items-end justify-center pb-3">
        <Image
          alt={image.alt}
          className="h-64 w-auto object-contain"
          height={1448}
          priority={false}
          sizes="(min-width: 768px) 220px, 180px"
          src={image.src}
          width={1086}
        />
      </div>
      <div className="mx-auto h-px w-24 bg-[color:var(--inv-border)]/70" />
      <h3 className="mt-4 font-serif text-[1.9rem] font-normal leading-tight text-[color:var(--inv-primary)]">
        {title}
      </h3>
      <p className="mx-auto mt-2.5 max-w-xs text-sm leading-7 text-[color:var(--inv-muted)]">
        {description}
      </p>
    </article>
  );
}

function getAvoidColorName(color: string | { name: string; value: string }) {
  return typeof color === "string" ? color : color.name;
}

function getAvoidColorSwatch(color: string | { name: string; value: string }) {
  if (typeof color !== "string") {
    return color.value;
  }

  const colorName = color;
  const normalized = colorName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("blanco")) {
    return "#FFFFFF";
  }

  if (normalized.includes("marfil")) {
    return "#F6EEDC";
  }

  if (normalized.includes("rojo")) {
    return "#8F1D2C";
  }

  return "var(--inv-surface)";
}

function formatAvoidColors(
  colors: NonNullable<WeddingInvitationContent["dressCode"]>["avoidColors"],
) {
  return colors?.map(getAvoidColorName).join(", ") ?? "";
}

function RsvpSection({
  children,
  className,
  isTraditional,
  recipient,
  showPreviewFallback,
}: {
  children?: ReactNode;
  className: string;
  isTraditional: boolean;
  recipient?: WeddingInvitationProps["recipient"];
  showPreviewFallback: boolean;
}) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-3xl text-center">
        <p
          className={[
            "text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--inv-secondary)]",
            isTraditional
              ? "font-serif text-base font-normal normal-case tracking-[0.06em]"
              : "",
          ].join(" ")}
        >
          RSVP
        </p>
        <h2 className="mt-3 font-serif text-[2.35rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[3.25rem]">
          Confirma tu asistencia
        </h2>
        {isTraditional ? <Ornament compact /> : null}
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
          Tu presencia es el regalo que más esperamos.
        </p>
        {recipient ? (
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--inv-muted)]">
            {recipient.displayName} - {recipient.maxGuests}{" "}
            {recipient.maxGuests === 1 ? "pase" : "pases"}
          </p>
        ) : null}
        {children}
        {showPreviewFallback ? (
          <div className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-2">
            <button className="inline-flex min-h-12 items-center justify-center gap-2 border border-[color:var(--inv-secondary)] bg-[color:var(--inv-secondary)]/10 px-5 text-sm font-semibold text-[color:var(--inv-primary)]">
              <span
                aria-hidden="true"
                className="text-[color:var(--inv-secondary)]"
              >
                ✓
              </span>
              Sí, asistiremos
            </button>
            <button className="min-h-12 border border-[color:var(--inv-border)] bg-transparent px-5 text-sm font-semibold text-[color:var(--inv-muted)]">
              No podremos asistir
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function GiftsSection({
  className,
  gifts,
  isTraditional,
}: {
  className: string;
  gifts?: WeddingInvitationContent["gifts"];
  isTraditional: boolean;
}) {
  if (!gifts?.length) {
    return null;
  }

  if (isTraditional) {
    const giftOptions = getGiftOptions(gifts);

    if (!giftOptions.length) {
      return null;
    }

    const envelope = giftOptions.find((gift) => gift.kind === "envelope");
    const financialGifts = giftOptions.filter(
      (gift) =>
        gift.kind === "yape" ||
        gift.kind === "bankTransfer" ||
        gift.kind === "externalRegistry",
    );

    return (
      <section className={className}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--inv-secondary)]">
            Regalos
          </p>
          <h2 className="mt-4 font-serif text-[2.45rem] font-normal leading-none text-[color:var(--inv-primary)] sm:text-[3.5rem]">
            Mesa de regalos
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
            Gracias por acompañarnos con tanto cariño.
          </p>
          <CeremonialOrnament compact />
        </div>

        <div className="mx-auto mt-8 max-w-4xl">
          {envelope ? <EnvelopeGift gift={envelope} /> : null}

          {financialGifts.length ? (
            <div
              className={[
                "mx-auto grid max-w-3xl items-stretch gap-10",
                envelope ? "mt-11" : "",
                financialGifts.length === 1
                  ? "md:max-w-md"
                  : "md:grid-cols-2 md:gap-14",
              ].join(" ")}
            >
              {financialGifts.map((gift) => (
                <EditorialGiftMethod gift={gift} key={gift.title} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Regalos"
        isTraditional={isTraditional}
        title="Mesa de regalos"
        text="Gracias por acompanarnos con tanto carino."
      />
      <div className={["mt-8 grid gap-4", isTraditional ? "" : "md:grid-cols-3"].join(" ")}>
        {gifts.map((gift) => (
          <div
            className="border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)] p-5"
            key={gift.title}
          >
            <h3 className="font-serif text-3xl font-semibold text-[color:var(--inv-primary)]">
              {gift.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--inv-muted)]">
              {gift.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EnvelopeGift({ gift }: { gift: GiftMethod }) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto flex size-10 items-center justify-center text-[color:var(--inv-secondary)]">
        <Mail aria-hidden="true" size={28} strokeWidth={1.35} />
      </div>
      <h3 className="mt-4 font-serif text-[2rem] font-normal leading-tight text-[color:var(--inv-primary)]">
        {gift.title}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
        {gift.description}
      </p>
    </div>
  );
}

function EditorialGiftMethod({ gift }: { gift: GiftMethod }) {
  const iconClassName =
    "mx-auto flex size-11 items-center justify-center text-[color:var(--inv-secondary)]";
  const copyActions = getGiftCopyActions(gift);

  return (
    <article className="flex h-full flex-col items-center text-center">
      <div className={iconClassName}>
        {gift.kind === "bankTransfer" ? (
          <Landmark aria-hidden="true" size={27} strokeWidth={1.35} />
        ) : gift.kind === "externalRegistry" ? (
          <ExternalLink aria-hidden="true" size={27} strokeWidth={1.35} />
        ) : (
          <WalletCards aria-hidden="true" size={27} strokeWidth={1.35} />
        )}
      </div>
      <h3 className="mt-4 font-serif text-[1.95rem] font-normal leading-tight text-[color:var(--inv-primary)]">
        {gift.title}
      </h3>
      <GiftMethodDetails gift={gift} />
      {copyActions.length ? (
        <div className="mt-5 flex min-h-10 flex-col items-center justify-start gap-2">
          {copyActions.map((action) => (
            <GiftCopyAction
              key={action.label}
              label={action.label}
              value={action.value}
            />
          ))}
        </div>
      ) : gift.kind === "externalRegistry" && gift.url ? (
        <a
          className="mt-5 inline-flex min-h-10 items-center justify-center text-sm font-semibold text-[color:var(--inv-primary)] underline decoration-[color:var(--inv-border)] underline-offset-4 transition-colors hover:text-[color:var(--inv-secondary)] hover:decoration-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--inv-secondary)]"
          href={gift.url}
          rel="noreferrer"
          target="_blank"
        >
          {gift.linkLabel ?? "Ver lista de regalos"} →
        </a>
      ) : null}
    </article>
  );
}

function GiftMethodDetails({ gift }: { gift: GiftMethod }) {
  if (gift.kind === "yape") {
    return (
      <div className="mt-3 min-h-[4.75rem] text-sm leading-7 text-[color:var(--inv-muted)]">
        {gift.owner ? (
          <p className="font-semibold text-[color:var(--inv-text)]">
            {gift.owner}
          </p>
        ) : null}
        {gift.phone ? <p>{gift.phone}</p> : <p>{gift.description}</p>}
      </div>
    );
  }

  if (gift.kind === "bankTransfer") {
    return (
      <div className="mt-3 min-h-[4.75rem] text-sm leading-7 text-[color:var(--inv-muted)]">
        {gift.bank ? (
          <p className="font-semibold text-[color:var(--inv-text)]">
            {gift.bank}
          </p>
        ) : null}
        {formatBankAccountLabel(gift) ? (
          <p>{formatBankAccountLabel(gift)}</p>
        ) : null}
        {gift.accountNumber ? <p>{gift.accountNumber}</p> : null}
        {!gift.bank && !gift.accountType && !gift.accountNumber ? (
          <p>{gift.description}</p>
        ) : null}
      </div>
    );
  }

  return (
    <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-[color:var(--inv-muted)]">
      {gift.description}
    </p>
  );
}

function getGiftOptions(gifts: GiftMethod[]) {
  return gifts
    .filter((gift) => gift.enabled !== false)
    .map(normalizeGiftMethod);
}

function normalizeGiftMethod(gift: GiftMethod): GiftMethod {
  const kind = gift.kind ?? inferGiftKind(gift.title);

  if (kind === "yape") {
    const parsed = parseGiftDescription(gift.description);

    return {
      ...gift,
      kind,
      owner: gift.owner ?? parsed.first,
      phone: gift.phone ?? parsed.second,
    };
  }

  if (kind === "bankTransfer") {
    const parsed = parseGiftDescription(gift.description);
    const details: Pick<
      GiftMethod,
      "accountNumber" | "accountType" | "currency"
    > = parsed.second ? parseBankDetails(parsed.second) : {};

    return {
      ...gift,
      kind,
      bank: gift.bank ?? parsed.first,
      accountType: gift.accountType ?? details.accountType,
      currency: gift.currency ?? details.currency,
      accountNumber: gift.accountNumber ?? details.accountNumber,
    };
  }

  return {
    ...gift,
    kind,
  };
}

function inferGiftKind(title: string): NonNullable<GiftMethod["kind"]> {
  const normalized = normalizeText(title);

  if (normalized.includes("yape")) {
    return "yape";
  }

  if (
    normalized.includes("transferencia") ||
    normalized.includes("banco") ||
    normalized.includes("cuenta")
  ) {
    return "bankTransfer";
  }

  if (
    normalized.includes("lista") ||
    normalized.includes("registry") ||
    normalized.includes("regalos")
  ) {
    return "externalRegistry";
  }

  return "envelope";
}

function parseGiftDescription(description: string) {
  const [first, ...rest] = description.split(" - ");

  return {
    first: first?.trim(),
    second: rest.join(" - ").trim() || undefined,
  };
}

function parseBankDetails(value: string) {
  const accountNumberMatch = value.match(/[0-9][0-9\s-]{5,}[0-9]/);
  const accountNumber = accountNumberMatch?.[0]?.trim();
  const detailText = accountNumber
    ? value.replace(accountNumber, "").replace(/\s+-\s*$/, "").trim()
    : value;
  const normalizedDetail = normalizeText(detailText)
    .replace(/\s+/g, " ")
    .trim();
  const isSavingsSoles =
    normalizedDetail.includes("cuenta de ahorros") &&
    normalizedDetail.includes("soles");
  const detailParts = detailText
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    accountNumber,
    accountType: isSavingsSoles
      ? "Cuenta de ahorros en soles"
      : detailParts[0],
    currency: isSavingsSoles ? undefined : detailParts[1],
  };
}

function getGiftCopyActions(gift: GiftMethod) {
  if (gift.kind === "yape" && gift.phone) {
    return [{ label: "Copiar número", value: gift.phone }];
  }

  if (gift.kind === "bankTransfer") {
    return [
      gift.accountNumber
        ? { label: "Copiar cuenta", value: gift.accountNumber }
        : null,
      gift.cci ? { label: "Copiar CCI", value: gift.cci } : null,
    ].filter((action): action is { label: string; value: string } =>
      Boolean(action),
    );
  }

  return [];
}

function formatBankAccountLabel(gift: GiftMethod) {
  if (!gift.accountType) {
    return "";
  }

  if (!gift.currency || normalizeText(gift.accountType).includes("soles")) {
    return gift.accountType;
  }

  return `${gift.accountType} en ${gift.currency.toLowerCase()}`;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function GallerySection({
  className,
  images,
  isTraditional,
}: {
  className: string;
  images?: WeddingInvitationContent["galleryImages"];
  isTraditional: boolean;
}) {
  if (!images?.length) {
    return null;
  }

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Fotos"
        isTraditional={isTraditional}
        title="Nuestra sesión"
        text="Una pequeña colección de momentos que queremos compartir."
      />
      <InvitationGallery images={images} isTraditional={isTraditional} />
    </section>
  );
}

function StorySection({
  className,
  isTraditional,
  items,
}: {
  className: string;
  isTraditional: boolean;
  items?: WeddingInvitationContent["story"];
}) {
  const storyItems = getStoryItems(items);

  if (!storyItems.length) {
    return null;
  }

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Historia"
        isTraditional={isTraditional}
        title="Nuestra historia"
        text="Los momentos que nos trajeron hasta este dia."
      />
      <div className="relative mx-auto mt-12 max-w-5xl">
        {storyItems.length > 1 ? (
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-8 hidden h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-[color:var(--inv-accent)]/30 md:block"
          />
        ) : null}

        <div className={storyItems.length === 1 ? "mx-auto max-w-3xl" : ""}>
          {storyItems.map((item, index) => {
            const image = getStoryImage(item);

            return (
              <article
                className={[
                  "relative grid gap-5 py-8 pl-8 md:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] md:items-center md:gap-6 md:py-11 md:pl-0",
                  storyItems.length === 1 ? "md:block md:text-center" : "",
                ].join(" ")}
                key={`${getStoryDateLabel(item)}-${item.title}`}
              >
                {storyItems.length > 1 ? (
                  <div
                    aria-hidden="true"
                    className="absolute left-0 top-10 flex h-full flex-col items-center md:hidden"
                  >
                    <span className="size-2 rotate-45 border border-[color:var(--inv-secondary)] bg-[color:var(--inv-background)]" />
                    {index < storyItems.length - 1 ? (
                      <span className="mt-3 h-full w-px bg-[color:var(--inv-accent)]/25" />
                    ) : null}
                  </div>
                ) : null}

                {storyItems.length > 1 ? (
                  <div
                    aria-hidden="true"
                    className="relative z-10 order-2 hidden items-center justify-center md:col-start-2 md:row-start-1 md:flex"
                  >
                    <span className="size-3 rotate-45 border border-[color:var(--inv-secondary)] bg-[color:var(--inv-background)]" />
                  </div>
                ) : null}

                {image ? (
                  <figure
                    className={[
                      "order-2 overflow-hidden border border-[color:var(--inv-border)] bg-[color:var(--inv-background)] p-2 md:row-start-1",
                      index % 2 ? "md:col-start-3" : "md:col-start-1",
                      storyItems.length === 1
                        ? "md:mx-auto md:mt-6 md:max-w-2xl"
                        : "",
                    ].join(" ")}
                  >
                    <img
                      alt={item.imageAlt ?? item.title}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                      src={image}
                    />
                  </figure>
                ) : null}

                <div
                  className={[
                    "order-3 md:row-start-1 md:pt-7",
                    index % 2
                      ? "md:col-start-1 md:text-right"
                      : "md:col-start-3 md:text-left",
                    storyItems.length === 1
                      ? "md:mx-auto md:max-w-xl md:text-center"
                      : "",
                  ].join(" ")}
                >
                  <p className="text-[0.68rem] font-medium uppercase leading-5 tracking-[0.3em] text-[color:var(--inv-secondary)]/75 sm:text-[0.72rem]">
                    {getStoryDateLabel(item)}
                  </p>
                  <h3 className="mt-5 font-serif text-[2rem] font-medium leading-tight text-[color:var(--inv-primary)] sm:text-[2.45rem]">
                    {item.title}
                  </h3>
                  {item.description ? (
                    <p className="mt-4 text-sm leading-7 text-[color:var(--inv-muted)]">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getStoryItems(items?: WeddingInvitationContent["story"]) {
  return [...(items ?? [])]
    .sort((first, second) => getStoryOrder(first) - getStoryOrder(second))
    .slice(0, 5);
}

function getStoryOrder(
  item: NonNullable<WeddingInvitationContent["story"]>[number],
) {
  if (typeof item.order === "number") {
    return item.order;
  }

  const year = Number.parseInt(String(item.year ?? item.date ?? ""), 10);

  return Number.isFinite(year) ? year : Number.MAX_SAFE_INTEGER;
}

function getStoryDateLabel(
  item: NonNullable<WeddingInvitationContent["story"]>[number],
) {
  return item.year ?? item.date ?? item.time ?? "";
}

function getStoryImage(
  item: NonNullable<WeddingInvitationContent["story"]>[number],
) {
  return item.imageUrl ?? item.image;
}

function ClosingSection({
  className,
  isTraditional,
  message,
  title,
}: {
  className: string;
  isTraditional: boolean;
  message?: string | null;
  title: string;
}) {
  if (!message) {
    return null;
  }

  const messageLines = getClosingMessageLines(message);

  return (
    <section className={[className, "py-16 sm:py-20 lg:py-24"].join(" ")}>
      <div className="mx-auto max-w-3xl px-2 text-center">
        <div className="mx-auto h-px w-full max-w-md bg-[color:var(--inv-border)]/35" />
        <div className="mx-auto py-12 sm:py-14">
          {isTraditional ? <CeremonialOrnament compact /> : <Ornament compact />}
          <p className="mx-auto mt-6 max-w-2xl text-balance font-serif text-[2.15rem] font-normal leading-[1.28] text-[color:var(--inv-primary)] sm:text-[2.7rem] sm:leading-[1.22]">
            {messageLines.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </p>
          <p className="mt-11 text-[0.72rem] font-medium uppercase leading-6 tracking-[0.34em] text-[color:var(--inv-secondary)] sm:tracking-[0.42em]">
            {title.toUpperCase()}
          </p>
        </div>
        <div className="mx-auto h-px w-full max-w-sm bg-[color:var(--inv-border)]/25" />
      </div>
    </section>
  );
}

function getClosingMessageLines(message: string) {
  const normalized = normalizeText(message);

  if (
    normalized.includes("gracias por ser parte de esta historia") &&
    normalized.includes("su presencia hara que este dia") &&
    normalized.includes("sea aun mas nuestro")
  ) {
    return [
      "Gracias por ser parte de esta historia.",
      "Su presencia hará que este día",
      "sea aún más nuestro.",
    ];
  }

  const lines = message
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length) {
    return lines;
  }

  return [message.trim()];
}

function SectionHeader({
  eyebrow,
  isTraditional = false,
  text,
  title,
}: {
  eyebrow: string;
  isTraditional?: boolean;
  text?: string;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p
        className={[
          "text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--inv-secondary)]",
          isTraditional ? "font-serif text-base normal-case tracking-[0.06em]" : "",
        ].join(" ")}
      >
        {eyebrow}
      </p>
      <h2
        className={[
          "mt-4 font-serif text-[2.7rem] font-semibold leading-none text-[color:var(--inv-primary)] sm:text-[4rem]",
          isTraditional ? "font-normal" : "",
        ].join(" ")}
      >
        {title}
      </h2>
      {isTraditional ? <Ornament compact /> : null}
      {text ? (
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function mergePreviewContent(event: WeddingInvitationEvent) {
  return {
    ...previewWeddingDemoContent,
    ...normalizeContent(event),
    family: event.family ?? previewWeddingDemoContent.family,
    saveTheDate: event.saveTheDate ?? previewWeddingDemoContent.saveTheDate,
    locations: event.locations?.length
      ? event.locations
      : previewWeddingDemoContent.locations,
    itinerary: event.itinerary?.length
      ? event.itinerary
      : previewWeddingDemoContent.itinerary,
    dressCode: event.dressCode ?? previewWeddingDemoContent.dressCode,
    gifts: event.gifts?.length ? event.gifts : previewWeddingDemoContent.gifts,
    galleryImages: event.galleryImages?.length
      ? event.galleryImages
      : previewWeddingDemoContent.galleryImages,
    story: event.story?.length ? event.story : previewWeddingDemoContent.story,
    closingMessage:
      event.closingMessage ?? previewWeddingDemoContent.closingMessage,
  };
}

function normalizeContent(event: WeddingInvitationEvent) {
  return event as WeddingInvitationContent;
}

function getLocations(
  event: WeddingInvitationEvent,
  content: WeddingInvitationContent,
  mode: "preview" | "public",
) {
  if (content.locations?.length) {
    return content.locations;
  }

  if (
    event.mainLocationName &&
    (event.mainLocationTime || event.dateLabel || mode === "preview")
  ) {
    return [
      {
        kind: "Lugar principal",
        name: event.mainLocationName,
        date: event.dateLabel,
        time: event.mainLocationTime ?? undefined,
      },
    ];
  }

  return [];
}

function getSectionClassName(frame: string) {
  const rhythm = "py-12 sm:py-16 lg:py-20";

  if (frame === "traditional") {
    return `${rhythm} border-b border-[color:var(--inv-border)]/55`;
  }

  if (frame === "minimal") {
    return rhythm;
  }

  if (frame === "organic") {
    return `${rhythm} rounded-[34px]`;
  }

  return rhythm;
}

function Ornament({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "mx-auto flex items-center justify-center gap-3 text-[color:var(--inv-accent)]",
        compact ? "my-4" : "my-7",
      ].join(" ")}
    >
      <span className="h-px w-12 bg-[color:var(--inv-border)]" />
      <span className="size-1.5 rotate-45 border border-[color:var(--inv-accent)]" />
      <span className="h-px w-12 bg-[color:var(--inv-border)]" />
    </div>
  );
}

function CeremonialOrnament({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "mx-auto flex items-center justify-center text-[color:var(--inv-accent)]",
        compact ? "my-5" : "my-6 sm:my-7",
      ].join(" ")}
    >
      <span className="h-px w-9 bg-[color:var(--inv-border)] sm:w-12" />
      <span className="relative mx-3 flex h-5 w-10 items-center justify-center">
        <span className="absolute h-px w-10 bg-[color:var(--inv-accent)]/55" />
        <span className="absolute left-2 size-2.5 rounded-full border border-[color:var(--inv-accent)]/65" />
        <span className="absolute right-2 size-2.5 rounded-full border border-[color:var(--inv-accent)]/65" />
        <span className="size-1.5 rounded-full bg-[color:var(--inv-accent)]/65" />
      </span>
      <span className="h-px w-9 bg-[color:var(--inv-border)] sm:w-12" />
    </div>
  );
}

function CeremonialFloralCorner({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const corner = {
    "top-left": {
      className: "left-2 top-2 sm:left-4 sm:top-4",
      src: "/images/ornamento-superior-izquierdo.png",
    },
    "top-right": {
      className: "right-2 top-2 sm:right-4 sm:top-4",
      src: "/images/ornamento-superior-derecho.png",
    },
    "bottom-left": {
      className: "bottom-2 left-2 sm:bottom-4 sm:left-4",
      src: "/images/ornamento-inferior-izquierdo.png",
    },
    "bottom-right": {
      className: "bottom-2 right-2 sm:bottom-4 sm:right-4",
      src: "/images/ornamento-inferior-derecho.png",
    },
  }[position];

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute z-0 h-20 w-20 opacity-[0.22] mix-blend-multiply sm:h-28 sm:w-28 md:h-32 md:w-32",
        corner.className,
      ].join(" ")}
    >
      <Image
        alt=""
        className="h-full w-full object-contain"
        height={320}
        sizes="(min-width: 768px) 128px, (min-width: 640px) 112px, 80px"
        src={corner.src}
        width={320}
      />
    </div>
  );
}

function FloralCorner({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const corner = {
    "top-left": {
      className: "left-3 top-3",
      src: "/images/ornamento-superior-izquierdo.png",
    },
    "top-right": {
      className: "right-3 top-3",
      src: "/images/ornamento-superior-derecho.png",
    },
    "bottom-left": {
      className: "bottom-3 left-3",
      src: "/images/ornamento-inferior-izquierdo.png",
    },
    "bottom-right": {
      className: "bottom-3 right-3",
      src: "/images/ornamento-inferior-derecho.png",
    },
  }[position];

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute hidden h-24 w-24 opacity-25 mix-blend-multiply sm:block",
        corner.className,
      ].join(" ")}
    >
      <Image
        alt=""
        className="h-full w-full object-contain"
        height={240}
        sizes="96px"
        src={corner.src}
        width={240}
      />
    </div>
  );
}

function formatShortDate(value: string) {
  const digits = value.match(/\d+/g);

  if (digits && digits.length >= 3) {
    return digits.slice(0, 3).join(".");
  }

  return value;
}
