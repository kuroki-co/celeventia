/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import {
  ExternalLink,
  Landmark,
  Mail,
  WalletCards,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { invitationFontClassName } from "../invitation-fonts";
import { GiftCopyAction } from "./GiftCopyAction";
import { InvitationEntryGate } from "./InvitationEntryGate";
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
  entryPreviewKey?: number;
};

type ThemePresentation = {
  assetKey: "classic" | "terra" | "versalles" | null;
  backgroundClassName: string;
  contentClassName: string;
  envelopeCardClassName: string;
  familyPanelClassName: string;
  familyPatternClassName: string;
  familyInsetClassName: string;
  heroContentClassName: string;
  heroDateClassName: string;
  heroKickerClassName: string;
  heroMessageClassName: string;
  heroOverlayClassName: string;
  heroRuleClassName: string;
  heroSectionClassName: string;
  heroTitleClassName: string;
  heroWashClassName: string;
  imageClassName: string;
  locationDetailsClassName: string;
  ornament: "ceremonial" | "classic" | "minimal";
  sectionClassName: string;
  showFloralCorners: boolean;
  usesCeremonialLayout: boolean;
};

export function WeddingInvitation({
  entryPreviewKey = 0,
  event,
  mode,
  recipient,
  children,
}: WeddingInvitationProps) {
  const theme = getInvitationTheme(event.themeId);
  const palette = getInvitationPalette(event.paletteId);
  const colors = palette.colors;
  const content = normalizeContent(event);
  const locations = getLocations(event, content, mode);
  const heroImage = content.heroImage;
  const entryImage = resolveHeroImage(heroImage);
  const presentation = getThemePresentation(theme.frame);
  const usesCeremonialLayout = presentation.usesCeremonialLayout;
  const invitationBody = (
    <>
      <InvitationHero
        dateLabel={event.dateLabel}
        image={heroImage}
        message={event.mainInvitationMessage}
        presentation={presentation}
        title={event.coupleName}
        tagline={content.tagline}
      />

      <div
        className={[
          "mx-auto px-5 py-14 sm:px-8 lg:px-10 lg:py-20",
          presentation.contentClassName,
        ].join(" ")}
      >
        <FamilySection
          className={presentation.sectionClassName}
          content={content.family}
          isTraditional={usesCeremonialLayout}
          presentation={presentation}
        />
        <SaveTheDateSection
          className={presentation.sectionClassName}
          content={content.saveTheDate}
          dateLabel={event.dateLabel}
          isTraditional={usesCeremonialLayout}
          presentation={presentation}
        />
        <LocationsSection
          className={presentation.sectionClassName}
          locations={locations}
          presentation={presentation}
        />
        <TimelineSection
          className={presentation.sectionClassName}
          isTraditional={usesCeremonialLayout}
          items={content.itinerary}
          presentation={presentation}
          title="Itinerario"
        />
        <DressCodeSection
          className={presentation.sectionClassName}
          content={content.dressCode}
          isTraditional={usesCeremonialLayout}
          presentation={presentation}
        />
        {(children || mode === "preview") ? (
          <RsvpSection
            className={presentation.sectionClassName}
            isTraditional={usesCeremonialLayout}
            presentation={presentation}
            recipient={recipient}
            showPreviewFallback={mode === "preview" && !children}
          >
            {children}
          </RsvpSection>
        ) : null}
        <GiftsSection
          className={presentation.sectionClassName}
          gifts={content.gifts}
          isTraditional={usesCeremonialLayout}
          presentation={presentation}
        />
        <GallerySection
          className={presentation.sectionClassName}
          images={content.galleryImages}
          isTraditional={usesCeremonialLayout}
          presentation={presentation}
        />
        <StorySection
          className={presentation.sectionClassName}
          isTraditional={usesCeremonialLayout}
          items={content.story}
          presentation={presentation}
        />
        <ClosingSection
          className={presentation.sectionClassName}
          isTraditional={usesCeremonialLayout}
          message={content.closingMessage}
          presentation={presentation}
          title={event.coupleName}
        />
      </div>
    </>
  );
  return (
    <article
      className={[
        "min-h-dvh overflow-hidden",
        invitationFontClassName,
        presentation.backgroundClassName,
      ].join(" ")}
      data-theme-frame={theme.frame}
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
          "--font-manrope": "var(--inv-font-sans)",
          "--font-cormorant": "var(--inv-font-serif)",
          background: colors.background,
          color: colors.text,
        } as CSSProperties
      }
    >
      <InvitationEntryGate
        coupleName={event.coupleName}
        dateLabel={event.dateLabel}
        frame={theme.frame}
        image={entryImage}
        mode={mode}
        previewKey={entryPreviewKey}
        recipient={recipient ?? null}
      >
        {invitationBody}
      </InvitationEntryGate>
    </article>
  );
}

function InvitationHero({
  dateLabel,
  image,
  message,
  presentation,
  tagline,
  title,
}: {
  dateLabel: string;
  image?: WeddingInvitationContent["heroImage"];
  message?: string | null;
  presentation: ThemePresentation;
  tagline?: string | null;
  title: string;
}) {
  const heroImage = resolveHeroImage(image);

  return (
    <section
      className={presentation.heroSectionClassName}
      id="invitacion"
    >
      {heroImage.src ? (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          src={heroImage.src}
          style={getHeroImageStyle(heroImage)}
        />
      ) : (
        <div className="absolute inset-0 bg-[color:var(--inv-primary)]" />
      )}
      <div className={presentation.heroOverlayClassName} />
      <div className={presentation.heroWashClassName} />
      <ThemeHeroDecorations presentation={presentation} />
      <div className={presentation.heroContentClassName}>
        <p className={presentation.heroKickerClassName}>
          Nos casamos
        </p>
        <h1 className={presentation.heroTitleClassName}>
          <HeroTitle title={title} />
        </h1>
        <div
          aria-hidden="true"
          className={presentation.heroRuleClassName}
        />
        <p className={presentation.heroDateClassName}>
          {dateLabel}
        </p>
        {tagline || message ? (
          <p className={presentation.heroMessageClassName}>
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
      cropZoom: 1,
      objectPosition: "center center",
      src: null,
    };
  }

  if (typeof image === "string") {
    return {
      cropZoom: 1,
      objectPosition: "center center",
      src: image,
    };
  }

  const cropZoom = clampCropZoom(image.cropZoom);
  const focalX = clampFocalPoint(image.focalX);
  const focalY = clampFocalPoint(image.focalY);

  return {
    cropZoom,
    objectPosition: `${focalX}% ${focalY}%`,
    src: image.url ?? null,
  };
}

function getHeroImageStyle(image: {
  cropZoom: number;
  objectPosition: string;
}): CSSProperties {
  const transformOrigin = image.objectPosition;

  return {
    objectPosition: image.objectPosition,
    transform: image.cropZoom > 1 ? `scale(${image.cropZoom})` : undefined,
    transformOrigin,
  };
}

function clampCropZoom(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.min(3, Math.max(1, value));
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
  presentation,
}: {
  className: string;
  content: WeddingInvitationContent["family"];
  isTraditional: boolean;
  presentation: ThemePresentation;
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
        <div className={presentation.familyPanelClassName}>
          <div
            aria-hidden="true"
            className={presentation.familyPatternClassName}
          />
          <div
            aria-hidden="true"
            className={presentation.familyInsetClassName}
          />
          {presentation.showFloralCorners ? (
            <>
              <CeremonialFloralCorner
                assetKey={presentation.assetKey}
                position="top-left"
              />
              <CeremonialFloralCorner
                assetKey={presentation.assetKey}
                position="top-right"
              />
              <CeremonialFloralCorner
                assetKey={presentation.assetKey}
                position="bottom-left"
              />
              <CeremonialFloralCorner
                assetKey={presentation.assetKey}
                position="bottom-right"
              />
            </>
          ) : null}
          <div className="relative mx-auto max-w-[40rem]">
            <p className="font-serif text-[1.05rem] italic leading-7 text-[color:var(--inv-secondary)] sm:text-[1.2rem]">
              Con la bendición de Dios
            </p>
            <h2 className="mx-auto mt-4 max-w-xl text-balance font-serif text-[2.25rem] font-normal leading-[1.03] text-[color:var(--inv-primary)] sm:text-[3rem]">
              y el amor de nuestros padres
            </h2>
            <ThemeOrnament presentation={presentation} />
            <TraditionalFamilyGroups groups={groups} />
            <ThemeOrnament compact presentation={presentation} />
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
  presentation,
}: {
  className: string;
  content: WeddingInvitationContent["saveTheDate"];
  dateLabel: string;
  isTraditional: boolean;
  presentation: ThemePresentation;
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
            <ThemeOrnament compact presentation={presentation} />
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
  locations,
  presentation,
}: {
  className: string;
  locations: InvitationLocation[];
  presentation: ThemePresentation;
}) {
  if (!locations.length) {
    return null;
  }

  return (
    <section className={className}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--inv-secondary)]">
          Lugares
        </p>
        <h2 className="mt-4 font-serif text-[2.7rem] font-semibold leading-none text-[color:var(--inv-primary)] sm:text-[4rem]">
          Donde celebraremos
        </h2>
        <ThemeOrnament compact presentation={presentation} />
        <p className="mx-auto mt-5 max-w-2xl font-sans text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
          Cada momento tiene un lugar especial preparado para recibirlos.
        </p>
      </div>
      <div className="mx-auto mt-11 grid max-w-3xl gap-14 sm:mt-12 sm:gap-16">
        {locations.map((location) => {
          const mapUrl = getUsableMapUrl(location.mapUrl);

          return (
            <article
              className="text-center"
              key={`${location.kind}-${location.name}`}
            >
              {location.image ? (
                <img
                  alt=""
                  className={[
                    "h-64 w-full object-cover sm:h-80",
                    presentation.imageClassName,
                  ].join(" ")}
                  src={location.image}
                />
              ) : null}
              <div className={presentation.locationDetailsClassName}>
                <p className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[color:var(--inv-secondary)]">
                  {location.kind}
                </p>
                <h3 className="mx-auto mt-4 max-w-xl font-serif text-[2rem] font-normal leading-tight text-[color:var(--inv-primary)] sm:text-[2.55rem]">
                  {location.name}
                </h3>
                <p className="mt-4 font-sans text-sm font-normal text-[color:var(--inv-text)]/78">
                  {[location.date, location.time].filter(Boolean).join(" - ")}
                </p>
                {location.address ? (
                  <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-6 text-[color:var(--inv-muted)]">
                    {location.address}
                  </p>
                ) : null}
                {mapUrl ? (
                  <a
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 border border-[color:var(--inv-accent)]/65 bg-transparent px-5 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--inv-primary)] transition-colors hover:border-[color:var(--inv-secondary)] hover:text-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
                    href={mapUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ver ubicación
                    <span aria-hidden="true">-&gt;</span>
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getUsableMapUrl(mapUrl?: string | null) {
  const normalizedMapUrl = mapUrl?.trim();

  if (!normalizedMapUrl) {
    return null;
  }

  const genericMapUrls = new Set([
    "https://maps.google.com",
    "https://maps.google.com/",
    "https://www.google.com/maps",
    "https://www.google.com/maps/",
  ]);

  return genericMapUrls.has(normalizedMapUrl) ? null : normalizedMapUrl;
}

function TimelineSection({
  className,
  isTraditional,
  items,
  presentation,
  title,
}: {
  className: string;
  isTraditional: boolean;
  items?: InvitationTimelineItem[];
  presentation: ThemePresentation;
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
          presentation={presentation}
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
        presentation={presentation}
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
  presentation,
}: {
  className: string;
  content: WeddingInvitationContent["dressCode"];
  isTraditional: boolean;
  presentation: ThemePresentation;
}) {
  if (!content) {
    return null;
  }

  const entries = [
    ["Recomendaciones", content.general],
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
          <ThemeOrnament compact presentation={presentation} />
        </div>

        <div className="mx-auto mt-9 grid max-w-4xl gap-9 md:grid-cols-2 md:gap-12">
          {content.men ? (
            <DressCodeFigure
              assetKey={presentation.assetKey}
              description={content.men}
              illustration="men"
              title="Ellos"
            />
          ) : null}
          {content.women ? (
            <DressCodeFigure
              assetKey={presentation.assetKey}
              description={content.women}
              illustration="women"
              title="Ellas"
            />
          ) : null}
        </div>

        {content.children ? (
          <div className="mx-auto mt-10 max-w-xl text-center">
            <ThemeOrnament compact presentation={presentation} />
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
  assetKey,
  description,
  illustration,
  title,
}: {
  assetKey: ThemePresentation["assetKey"];
  description: string;
  illustration: "men" | "women";
  title: string;
}) {
  const image =
    assetKey === "versalles" && illustration === "men"
      ? {
          alt: "Referencia de vestimenta formal masculina",
          height: 300,
          src: "/wedding-themes/versalles/icons/dress-code-man.png",
          width: 200,
        }
      : assetKey === "versalles" && illustration === "women"
        ? {
            alt: "Referencia de vestimenta formal femenina",
            height: 300,
            src: "/wedding-themes/versalles/icons/dress-code-woman.png",
            width: 200,
          }
        : illustration === "men"
      ? {
          alt: "Referencia de vestimenta formal masculina Celeventia",
          height: 1448,
          src: "/images/celeventia-man.png",
          width: 1086,
        }
      : {
          alt: "Referencia de vestimenta formal femenina Celeventia",
          height: 1448,
          src: "/images/celeventia-woman.png",
          width: 1086,
        };

  return (
    <article className="text-center">
      <div className="mx-auto flex min-h-72 items-end justify-center pb-3">
        <Image
          alt={image.alt}
          className="h-64 w-auto object-contain"
          height={image.height}
          priority={false}
          sizes="(min-width: 768px) 220px, 180px"
          src={image.src}
          width={image.width}
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
  presentation,
  recipient,
  showPreviewFallback,
}: {
  children?: ReactNode;
  className: string;
  isTraditional: boolean;
  presentation: ThemePresentation;
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
        {isTraditional ? (
          <ThemeOrnament compact presentation={presentation} />
        ) : null}
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
          <div className="mx-auto mt-7 max-w-2xl border border-[color:var(--inv-border)]/70 bg-[color:var(--inv-primary)]/[0.04] p-4 sm:p-5">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--inv-muted)]">
              Vista de ejemplo del formulario
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
            <button className="inline-flex min-h-12 items-center justify-center gap-2 border border-[color:var(--inv-secondary)] bg-[color:var(--inv-secondary)]/10 px-5 text-sm font-semibold text-[color:var(--inv-primary)]">
              <span
                aria-hidden="true"
                className="text-[color:var(--inv-secondary)]"
              >
                ✓
              </span>
              Sí, asistiremos
            </button>
            <button className="min-h-12 border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)]/45 px-5 text-sm font-semibold text-[color:var(--inv-muted)]">
              No podremos asistir
            </button>
            </div>
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
  presentation,
}: {
  className: string;
  gifts?: WeddingInvitationContent["gifts"];
  isTraditional: boolean;
  presentation: ThemePresentation;
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
          <ThemeOrnament compact presentation={presentation} />
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
            <GiftMethodDetails gift={gift} />
            <div className="mt-5 flex min-h-10 flex-col items-center justify-start gap-2">
              {getGiftCopyActions(gift).map((action) => (
                <GiftCopyAction
                  key={action.label}
                  label={action.label}
                  value={action.value}
                />
              ))}
              {gift.kind === "externalRegistry" && gift.url ? (
                <a
                  className="inline-flex min-h-10 items-center justify-center text-sm font-semibold text-[color:var(--inv-primary)] underline decoration-[color:var(--inv-border)] underline-offset-4 transition-colors hover:text-[color:var(--inv-secondary)] hover:decoration-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--inv-secondary)]"
                  href={gift.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {gift.linkLabel ?? "Ver lista de regalos"} →
                </a>
              ) : null}
            </div>
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
  presentation,
}: {
  className: string;
  images?: WeddingInvitationContent["galleryImages"];
  isTraditional: boolean;
  presentation: ThemePresentation;
}) {
  if (!images?.length) {
    return null;
  }

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Fotos"
        presentation={presentation}
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
  presentation,
}: {
  className: string;
  isTraditional: boolean;
  items?: WeddingInvitationContent["story"];
  presentation: ThemePresentation;
}) {
  const storyItems = getStoryItems(items);

  if (!storyItems.length) {
    return null;
  }

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Historia"
        presentation={presentation}
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
                      presentation.imageClassName,
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
  presentation,
  title,
}: {
  className: string;
  isTraditional: boolean;
  message?: string | null;
  presentation: ThemePresentation;
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
          {isTraditional ? (
            <ThemeOrnament compact presentation={presentation} />
          ) : (
            <Ornament compact />
          )}
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
  presentation,
  text,
  title,
}: {
  eyebrow: string;
  isTraditional?: boolean;
  presentation?: ThemePresentation;
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
      {isTraditional || presentation ? (
        <ThemeOrnament
          compact
          presentation={presentation ?? getThemePresentation("traditional")}
        />
      ) : null}
      {text ? (
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[color:var(--inv-muted)] sm:text-base">
          {text}
        </p>
      ) : null}
    </div>
  );
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
    return content.locations.filter((location) => location.enabled !== false);
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

  if (frame === "classic" || frame === "minimal") {
    return `${rhythm} border-b border-[color:var(--inv-border)]/38`;
  }

  if (frame === "organic") {
    return `${rhythm} border-b border-[color:var(--inv-border)]/45`;
  }

  if (frame === "ornate") {
    return `${rhythm} border-b border-[color:var(--inv-border)]/55`;
  }

  return `${rhythm} border-b border-[color:var(--inv-border)]/55`;
}

function getThemePresentation(frame: string): ThemePresentation {
  const base: ThemePresentation = {
    assetKey: null,
    backgroundClassName:
      "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.75),transparent_22%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.55),transparent_20%)]",
    contentClassName: "max-w-[920px]",
    envelopeCardClassName:
      "shadow-none outline outline-1 outline-offset-[-12px] outline-[color:var(--inv-border)]",
    familyPanelClassName:
      "relative mx-auto max-w-[760px] overflow-hidden border border-[color:var(--inv-border)]/65 bg-[linear-gradient(180deg,rgba(255,253,248,0.94),rgba(250,244,236,0.9)),radial-gradient(circle_at_50%_-8%,rgba(255,255,255,0.92),transparent_38%),radial-gradient(circle_at_50%_108%,color-mix(in_srgb,var(--inv-accent)_13%,transparent),transparent_34%)] px-6 py-12 text-center shadow-[0_30px_90px_rgba(16,42,67,0.08)] outline outline-1 outline-offset-[-14px] outline-[color:var(--inv-border)]/45 sm:px-12 sm:py-14 lg:px-16 lg:py-16",
    familyPatternClassName:
      "absolute inset-0 opacity-[0.1] [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_srgb,var(--inv-muted)_20%,transparent)_1px,transparent_0)] [background-size:22px_22px]",
    familyInsetClassName:
      "absolute inset-4 border border-[color:var(--inv-border)]/35 sm:inset-5",
    heroContentClassName:
      "relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[56rem] flex-col items-center justify-center text-white",
    heroDateClassName:
      "mt-9 font-sans text-[0.92rem] font-semibold uppercase tracking-[0.22em] text-[#FFF8EA]/88 drop-shadow-[0_2px_10px_rgba(0,0,0,0.24)] sm:text-[1rem]",
    heroKickerClassName:
      "text-[0.66rem] font-semibold uppercase tracking-[0.42em] text-[#FFF8EA]/84 drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)] sm:text-[0.72rem]",
    heroMessageClassName:
      "mx-auto mt-4 max-w-[34rem] font-serif text-[0.98rem] font-normal italic leading-7 text-[#FFF8EA]/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)] sm:text-[1.08rem] sm:leading-8",
    heroOverlayClassName:
      "absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.34),rgba(0,0,0,0.13)_56%,rgba(0,0,0,0.2)_100%)]",
    heroRuleClassName: "mt-8 h-px w-16 bg-[#FFF8EA]/46 sm:w-20",
    heroSectionClassName:
      "relative grid min-h-[100svh] place-items-center overflow-hidden px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] text-center lg:min-h-screen sm:px-8",
    heroTitleClassName:
      "mx-auto mt-8 max-w-[52rem] text-balance font-serif text-[clamp(3.35rem,8vw,6.35rem)] font-normal leading-[0.92] text-[#FFF8EA] drop-shadow-[0_3px_14px_rgba(0,0,0,0.24)] sm:leading-[0.94]",
    heroWashClassName:
      "absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent_24%,transparent_68%,rgba(0,0,0,0.26))]",
    imageClassName: "",
    locationDetailsClassName:
      "mx-auto border-x border-b border-[color:var(--inv-border)]/65 px-5 py-7 sm:px-10 sm:py-8",
    ornament: "ceremonial",
    sectionClassName: getSectionClassName(frame),
    showFloralCorners: true,
    usesCeremonialLayout: true,
  };

  if (frame === "ornate") {
    return {
      ...base,
      assetKey: "versalles",
      backgroundClassName:
        "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.82),transparent_23%),radial-gradient(circle_at_82%_20%,color-mix(in_srgb,var(--inv-accent)_18%,transparent),transparent_24%),radial-gradient(circle_at_50%_100%,color-mix(in_srgb,var(--inv-secondary)_10%,transparent),transparent_35%)]",
      contentClassName: "max-w-[980px]",
      envelopeCardClassName:
        "shadow-[0_30px_90px_rgba(16,42,67,0.12)] outline outline-1 outline-offset-[-16px] outline-[color:var(--inv-accent)]/55",
      familyPanelClassName:
        "relative mx-auto max-w-[820px] overflow-hidden border border-[color:var(--inv-accent)]/55 bg-[linear-gradient(180deg,rgba(255,253,248,0.96),rgba(250,244,236,0.9)),radial-gradient(circle_at_50%_-8%,color-mix(in_srgb,var(--inv-accent)_18%,transparent),transparent_38%),radial-gradient(circle_at_50%_108%,color-mix(in_srgb,var(--inv-secondary)_11%,transparent),transparent_34%)] px-6 py-12 text-center shadow-[0_34px_100px_rgba(16,42,67,0.12)] outline outline-1 outline-offset-[-18px] outline-[color:var(--inv-border)]/55 sm:px-12 sm:py-14 lg:px-16 lg:py-16",
      heroOverlayClassName:
        "absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.42),rgba(0,0,0,0.16)_52%,rgba(0,0,0,0.32)_100%)]",
      heroTitleClassName:
        "mx-auto mt-8 max-w-[54rem] text-balance font-serif text-[clamp(3.65rem,8.4vw,6.85rem)] font-normal leading-[0.9] text-[#FFF8EA] drop-shadow-[0_3px_14px_rgba(0,0,0,0.24)] sm:leading-[0.92]",
      heroRuleClassName: "mt-9 h-px w-28 bg-[#FFF8EA]/58 sm:w-36",
      heroWashClassName:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),transparent_25%,transparent_64%,rgba(0,0,0,0.35))]",
      imageClassName: "p-2 shadow-[0_26px_70px_rgba(16,42,67,0.10)]",
      locationDetailsClassName:
        "mx-auto border-x border-b border-[color:var(--inv-accent)]/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.36))] px-5 py-8 shadow-[0_18px_60px_rgba(16,42,67,0.08)] sm:px-10 sm:py-9",
    };
  }

  if (frame === "classic") {
    return {
      ...base,
      assetKey: "classic",
      backgroundClassName:
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent_30%,transparent_70%,rgba(255,255,255,0.38))]",
      contentClassName: "max-w-[860px]",
      envelopeCardClassName:
        "shadow-none outline outline-1 outline-offset-[-10px] outline-[color:var(--inv-border)]/70",
      familyPanelClassName:
        "relative mx-auto max-w-[720px] overflow-hidden border border-[color:var(--inv-border)]/70 bg-[color:var(--inv-surface)] px-6 py-12 text-center shadow-none outline outline-1 outline-offset-[-12px] outline-[color:var(--inv-border)]/30 sm:px-12 sm:py-14 lg:px-16 lg:py-16",
      familyPatternClassName: "absolute inset-0 opacity-0",
      heroContentClassName:
        "relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[46rem] flex-col items-center justify-end pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-16 text-center text-white sm:pb-20",
      heroDateClassName:
        "mt-6 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-[#FFF8EA]/82 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] sm:text-[0.92rem]",
      heroKickerClassName:
        "font-sans text-[0.64rem] font-semibold uppercase tracking-[0.34em] text-[#FFF8EA]/76 drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)] sm:text-[0.7rem]",
      heroMessageClassName:
        "mx-auto mt-4 max-w-[34rem] font-sans text-sm font-medium leading-7 text-[#FFF8EA]/78 drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)] sm:text-[0.96rem]",
      heroOverlayClassName:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.12)_44%,rgba(0,0,0,0.68)_100%)]",
      heroRuleClassName: "mt-6 h-px w-20 bg-[#FFF8EA]/50 sm:w-28",
      heroTitleClassName:
        "mx-auto mt-5 max-w-[42rem] text-balance font-serif text-[clamp(2.75rem,6.2vw,4.85rem)] font-normal leading-[0.94] text-[#FFF8EA] drop-shadow-[0_3px_16px_rgba(0,0,0,0.34)]",
      heroWashClassName:
        "absolute inset-x-0 bottom-0 h-[52%] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.34)_58%,rgba(0,0,0,0.18))]",
      imageClassName: "grayscale-[12%]",
      locationDetailsClassName:
        "mx-auto border-x border-b border-[color:var(--inv-border)]/65 bg-[color:var(--inv-surface)]/45 px-5 py-7 sm:px-10 sm:py-8",
      ornament: "classic",
      showFloralCorners: false,
      usesCeremonialLayout: false,
    };
  }

  if (frame === "organic") {
    return {
      ...base,
      assetKey: "terra",
      backgroundClassName:
        "bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.72),transparent_24%),radial-gradient(circle_at_84%_18%,color-mix(in_srgb,var(--inv-primary)_10%,transparent),transparent_23%),radial-gradient(circle_at_50%_100%,color-mix(in_srgb,var(--inv-accent)_16%,transparent),transparent_36%)]",
      contentClassName: "max-w-[940px]",
      envelopeCardClassName:
        "rounded-t-[44px] shadow-[0_26px_80px_rgba(16,42,67,0.10)] outline outline-1 outline-offset-[-14px] outline-[color:var(--inv-border)]/55",
      familyPanelClassName:
        "relative mx-auto max-w-[780px] overflow-hidden rounded-t-[56px] border border-[color:var(--inv-border)]/60 bg-[linear-gradient(180deg,rgba(255,253,248,0.94),rgba(250,247,238,0.9)),radial-gradient(circle_at_16%_0%,color-mix(in_srgb,var(--inv-primary)_10%,transparent),transparent_30%),radial-gradient(circle_at_82%_105%,color-mix(in_srgb,var(--inv-accent)_16%,transparent),transparent_34%)] px-6 py-12 text-center shadow-[0_28px_80px_rgba(16,42,67,0.09)] sm:px-12 sm:py-14 lg:px-16 lg:py-16",
      familyInsetClassName:
        "absolute inset-4 rounded-t-[44px] border border-[color:var(--inv-border)]/28 sm:inset-5",
      heroContentClassName:
        "relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[44rem] flex-col items-center justify-end pb-[max(6rem,env(safe-area-inset-bottom))] pt-16 text-center text-white sm:pb-24",
      heroDateClassName:
        "mt-6 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-[#FFF8EA]/82 drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)] sm:text-[0.92rem]",
      heroKickerClassName:
        "font-sans text-[0.64rem] font-semibold uppercase tracking-[0.34em] text-[#FFF8EA]/76 drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)] sm:text-[0.7rem]",
      heroMessageClassName:
        "mx-auto mt-4 max-w-[31rem] font-sans text-sm font-medium leading-7 text-[#FFF8EA]/78 drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)] sm:text-[0.96rem]",
      heroOverlayClassName:
        "absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(44,33,29,0.08),transparent_34%),linear-gradient(180deg,rgba(26,23,18,0.04)_0%,rgba(38,31,26,0.1)_42%,rgba(38,31,26,0.68)_100%)]",
      heroRuleClassName: "mt-6 h-px w-16 bg-[#FFF8EA]/42 sm:w-24",
      heroTitleClassName:
        "mx-auto mt-5 max-w-[40rem] text-balance font-serif text-[clamp(2.8rem,6.4vw,5rem)] font-normal leading-[0.94] text-[#FFF8EA] drop-shadow-[0_3px_16px_rgba(0,0,0,0.34)]",
      heroWashClassName:
        "absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(180deg,transparent,rgba(37,30,24,0.32)_58%,rgba(37,30,24,0.16))]",
      imageClassName: "rounded-t-[32px]",
      locationDetailsClassName:
        "mx-auto rounded-b-[32px] border-x border-b border-[color:var(--inv-border)]/55 bg-[color:var(--inv-surface)]/35 px-5 py-7 sm:px-10 sm:py-8",
      ornament: "classic",
      showFloralCorners: false,
      usesCeremonialLayout: false,
    };
  }

  if (frame === "minimal") {
    return {
      ...base,
      backgroundClassName:
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.62),transparent_32%,transparent_72%,rgba(255,255,255,0.42))]",
      contentClassName: "max-w-[840px]",
      envelopeCardClassName:
        "shadow-none outline outline-1 outline-offset-[-8px] outline-[color:var(--inv-border)]/38",
      familyPanelClassName:
        "relative mx-auto max-w-[700px] overflow-hidden border-y border-[color:var(--inv-border)]/55 bg-transparent px-4 py-12 text-center shadow-none sm:px-8 sm:py-14 lg:px-10 lg:py-16",
      familyPatternClassName: "absolute inset-0 opacity-0",
      familyInsetClassName: "absolute inset-0 border-0",
      heroContentClassName:
        "relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[64rem] flex-col items-center justify-end pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-16 text-center text-white sm:items-start sm:pb-20 sm:text-left",
      heroDateClassName:
        "mt-6 font-sans text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-[#FFF8EA]/78 drop-shadow-[0_2px_10px_rgba(0,0,0,0.26)] sm:text-[0.9rem]",
      heroKickerClassName:
        "font-sans text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-[#FFF8EA]/72 drop-shadow-[0_2px_10px_rgba(0,0,0,0.24)] sm:text-[0.68rem]",
      heroMessageClassName:
        "mt-4 max-w-[31rem] font-sans text-sm font-medium leading-7 text-[#FFF8EA]/72 drop-shadow-[0_2px_10px_rgba(0,0,0,0.24)] sm:text-[0.96rem]",
      heroOverlayClassName:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.1)_48%,rgba(0,0,0,0.6)_100%)]",
      heroRuleClassName: "mt-6 h-px w-12 bg-[#FFF8EA]/38",
      heroTitleClassName:
        "mt-5 max-w-[38rem] text-balance font-serif text-[clamp(2.7rem,5.8vw,4.65rem)] font-normal leading-[0.98] text-[#FFF8EA] drop-shadow-[0_3px_14px_rgba(0,0,0,0.28)]",
      heroWashClassName:
        "absolute inset-x-0 bottom-0 h-[50%] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.28)_62%,rgba(0,0,0,0.12))]",
      imageClassName: "p-0",
      locationDetailsClassName:
        "mx-auto border-b border-[color:var(--inv-border)]/55 px-4 py-7 sm:px-8 sm:py-8",
      ornament: "minimal",
      showFloralCorners: false,
    };
  }

  return base;
}

function ThemeHeroDecorations({
  presentation,
}: {
  presentation: ThemePresentation;
}) {
  if (presentation.assetKey === "versalles") {
    return (
      <>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-5 z-[1] border border-[#FFF8EA]/42 sm:inset-8"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-8 z-[1] hidden border border-[#FFF8EA]/20 sm:block"
        />
        <Image
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 z-[2] h-24 w-32 object-contain opacity-82 sm:left-6 sm:top-6 sm:h-32 sm:w-44"
          height={187}
          priority={false}
          src="/wedding-themes/versalles/ornaments/pastel-floral-corner-top.png"
          width={256}
        />
        <Image
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 z-[2] h-24 w-32 -scale-x-100 object-contain opacity-76 sm:right-6 sm:top-6 sm:h-32 sm:w-44"
          height={187}
          priority={false}
          src="/wedding-themes/versalles/ornaments/pastel-floral-corner-top.png"
          width={256}
        />
        <Image
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 right-3 z-[2] hidden h-28 w-36 object-contain opacity-72 sm:right-6 sm:block"
          height={235}
          priority={false}
          src="/wedding-themes/versalles/ornaments/pastel-floral-corner-bottom.png"
          width={256}
        />
      </>
    );
  }

  if (presentation.assetKey === "terra") {
    return (
      <>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute bottom-20 right-3 z-[1] h-40 w-28 text-[#FFF8EA]/36 sm:bottom-24 sm:right-8 sm:h-52 sm:w-36"
          fill="none"
          viewBox="0 0 120 170"
        >
          <path
            d="M22 154c31-33 38-72 42-132"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.4"
          />
          <path
            d="M55 62c18-6 29-18 36-36-18 4-31 16-36 36Z"
            fill="currentColor"
            opacity="0.42"
          />
          <path
            d="M45 98c20-4 35-14 45-31-20 1-35 11-45 31Z"
            fill="currentColor"
            opacity="0.34"
          />
          <path
            d="M35 128c-17-7-27-20-32-39 17 5 29 19 32 39Z"
            fill="currentColor"
            opacity="0.32"
          />
        </svg>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute bottom-24 left-2 z-[1] h-32 w-24 -scale-x-100 text-[#FFF8EA]/24 sm:bottom-28 sm:left-8 sm:h-44 sm:w-32"
          fill="none"
          viewBox="0 0 120 170"
        >
          <path
            d="M22 154c31-33 38-72 42-132"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.4"
          />
          <path
            d="M55 62c18-6 29-18 36-36-18 4-31 16-36 36Z"
            fill="currentColor"
            opacity="0.4"
          />
          <path
            d="M45 98c20-4 35-14 45-31-20 1-35 11-45 31Z"
            fill="currentColor"
            opacity="0.32"
          />
        </svg>
      </>
    );
  }

  if (presentation.assetKey === "classic") {
    return null;
  }

  return null;
}

function ThemeOrnament({
  compact = false,
  presentation,
}: {
  compact?: boolean;
  presentation: ThemePresentation;
}) {
  if (presentation.ornament === "minimal") {
    return <MinimalOrnament compact={compact} />;
  }

  if (presentation.ornament === "classic") {
    if (presentation.assetKey === "classic") {
      return <ClassicDivider compact={compact} />;
    }

    if (presentation.assetKey === "terra") {
      return <TerraDivider compact={compact} />;
    }

    return <Ornament compact={compact} />;
  }

  return <CeremonialOrnament compact={compact} />;
}

function ClassicDivider({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={["mx-auto flex justify-center", compact ? "my-4" : "my-7"].join(
        " ",
      )}
    >
      <img
        alt=""
        className="h-4 w-40 object-contain opacity-80"
        src="/wedding-themes/classic/ornaments/line-divider-top.svg"
      />
    </div>
  );
}

function TerraDivider({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "mx-auto flex items-center justify-center gap-4 text-[color:var(--inv-accent)]",
        compact ? "my-4" : "my-7",
      ].join(" ")}
    >
      <span className="h-px w-12 bg-[color:var(--inv-border)]/80" />
      <Image
        alt=""
        className="h-12 w-8 object-contain opacity-75"
        height={150}
        priority={false}
        src="/wedding-themes/shared/ornaments/gold-floral-scroll.png"
        width={96}
      />
      <span className="h-px w-12 bg-[color:var(--inv-border)]/80" />
    </div>
  );
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

function MinimalOrnament({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "mx-auto flex items-center justify-center",
        compact ? "my-5" : "my-7",
      ].join(" ")}
    >
      <span className="h-px w-20 bg-[color:var(--inv-border)]/75" />
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
  assetKey,
  position,
}: {
  assetKey?: ThemePresentation["assetKey"];
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  if (assetKey === "versalles") {
    const isTop = position.startsWith("top");
    const isLeft = position.endsWith("left");

    return (
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute z-0 h-20 w-28 opacity-70 sm:h-24 sm:w-36 md:h-28 md:w-40",
          isTop ? "top-0" : "bottom-0",
          isLeft ? "left-0" : "right-0",
          isLeft ? "" : "-scale-x-100",
        ].join(" ")}
      >
        <Image
          alt=""
          className="h-full w-full object-contain"
          height={isTop ? 187 : 235}
          sizes="(min-width: 768px) 160px, (min-width: 640px) 144px, 112px"
          src={
            isTop
              ? "/wedding-themes/versalles/ornaments/pastel-floral-corner-top.png"
              : "/wedding-themes/versalles/ornaments/pastel-floral-corner-bottom.png"
          }
          width={256}
        />
      </div>
    );
  }

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

