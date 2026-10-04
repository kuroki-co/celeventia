import type {
  InvitationPaletteId,
  InvitationThemeId,
} from "@/invitation/themes";
import {
  getInvitationPalette,
  getInvitationTheme,
} from "@/invitation/themes";

type InvitationThemeThumbnailProps = {
  paletteId: InvitationPaletteId;
  themeId: InvitationThemeId;
};

export function InvitationThemeThumbnail({
  paletteId,
  themeId,
}: InvitationThemeThumbnailProps) {
  const theme = getInvitationTheme(themeId);
  const palette = getInvitationPalette(paletteId);
  const colors = palette.colors;

  if (theme.frame === "organic") {
    return (
      <div
        aria-hidden="true"
        className="relative h-28 overflow-hidden rounded-[18px] border"
        style={{
          background: colors.background,
          borderColor: colors.border,
        }}
      >
        <span
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "url('/wedding-themes/shared/ornaments/gold-floral-scroll.png')",
            backgroundPosition: "right 0.65rem top 0.4rem",
            backgroundRepeat: "no-repeat",
            backgroundSize: "3.1rem auto",
          }}
        />
        <span
          className="absolute inset-x-5 top-4 h-16 rounded-t-[38px] border"
          style={{
            background: colors.surface,
            borderColor: colors.border,
          }}
        />
        <span
          className="absolute left-7 top-7 h-11 w-16 rounded-t-[28px]"
          style={{ background: colors.primary }}
        />
        <span
          className="absolute right-7 top-9 h-px w-16"
          style={{ background: colors.border }}
        />
        <span
          className="absolute right-10 top-14 h-px w-11"
          style={{ background: colors.accent }}
        />
        <span
          className="absolute bottom-4 left-8 h-6 w-20 rounded-full border"
          style={{ borderColor: colors.border }}
        />
        <span
          className="absolute -right-5 -top-4 h-16 w-16 rounded-full border"
          style={{ borderColor: colors.accent }}
        />
      </div>
    );
  }

  if (theme.frame === "classic") {
    return (
      <div
        aria-hidden="true"
        className="relative h-28 overflow-hidden rounded-[18px] border"
        style={{
          background: colors.surface,
          borderColor: colors.border,
        }}
      >
        <span
          className="absolute inset-x-7 top-4 h-11 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/wedding-themes/shared/photos/couple-session-steps.jpg')",
          }}
        />
        <span
          className="absolute inset-x-7 top-4 h-11"
          style={{ background: `${colors.primary}66` }}
        />
        <span
          className="absolute left-1/2 top-14 h-px w-20 -translate-x-1/2"
          style={{ background: colors.border }}
        />
        <span
          className="absolute left-1/2 top-[4.25rem] h-px w-14 -translate-x-1/2"
          style={{ background: colors.accent }}
        />
        <span
          className="absolute bottom-4 left-1/2 h-5 w-24 -translate-x-1/2 border"
          style={{ borderColor: colors.border }}
        />
      </div>
    );
  }

  if (theme.frame === "ornate") {
    return (
      <div
        aria-hidden="true"
        className="relative h-28 overflow-hidden rounded-[18px] border"
        style={{
          background: `linear-gradient(180deg, ${colors.surface}, ${colors.background})`,
          borderColor: colors.border,
        }}
      >
        <span
          className="absolute -top-1 left-2 h-10 w-20 bg-contain bg-left-top bg-no-repeat opacity-90"
          style={{
            backgroundImage:
              "url('/wedding-themes/versalles/ornaments/pastel-floral-corner-top.png')",
          }}
        />
        <span
          className="absolute -bottom-2 right-1 h-12 w-20 bg-contain bg-right-bottom bg-no-repeat opacity-90"
          style={{
            backgroundImage:
              "url('/wedding-themes/versalles/ornaments/pastel-floral-corner-bottom.png')",
          }}
        />
        <span
          className="absolute inset-4 border"
          style={{ borderColor: colors.accent }}
        />
        <span
          className="absolute left-1/2 top-5 h-12 w-24 -translate-x-1/2 border"
          style={{ borderColor: colors.border }}
        />
        <span
          className="absolute left-1/2 top-10 h-px w-16 -translate-x-1/2"
          style={{ background: colors.accent }}
        />
        <span
          className="absolute bottom-5 left-1/2 h-4 w-28 -translate-x-1/2"
          style={{ background: colors.primary }}
        />
        <span
          className="absolute -left-5 -top-5 h-14 w-14 rounded-full border"
          style={{ borderColor: colors.accent }}
        />
        <span
          className="absolute -bottom-5 -right-5 h-14 w-14 rounded-full border"
          style={{ borderColor: colors.accent }}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="relative h-28 overflow-hidden rounded-[18px] border"
      style={{
        background: colors.background,
        borderColor: colors.border,
      }}
    >
      <span
        className="absolute inset-x-8 top-6 h-10 border"
        style={{
          background: colors.surface,
          borderColor: colors.border,
        }}
      />
      <span
        className="absolute bottom-6 left-1/2 h-px w-24 -translate-x-1/2"
        style={{ background: colors.primary }}
      />
    </div>
  );
}
