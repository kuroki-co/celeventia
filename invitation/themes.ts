export const invitationThemes = [
  {
    id: "traditional",
    name: "Tradicional",
    description: "Clasico, ceremonial y romantico.",
    frame: "traditional",
  },
  {
    id: "versalles",
    name: "Versalles",
    description: "Editorial, elegante y ceremonial.",
    frame: "ornate",
  },
  {
    id: "classic",
    name: "Clasico",
    description: "Sobrio, centrado y atemporal.",
    frame: "classic",
  },
  {
    id: "terra",
    name: "Terra",
    description: "Calido, natural y cercano.",
    frame: "organic",
  },
  {
    id: "elegant",
    name: "Elegante",
    description: "Minimalista, aireado y formal.",
    frame: "minimal",
  },
] as const;

export const invitationPalettes = [
  {
    id: "verde_esmeralda",
    name: "Verde Esmeralda",
    colors: {
      background: "#F8F6F2",
      surface: "#FFFFFF",
      primary: "#173F35",
      secondary: "#8E6C88",
      accent: "#C8A46B",
      text: "#102A43",
      muted: "#657487",
      border: "#D9B8A7",
    },
  },
  {
    id: "dorado_elegante",
    name: "Dorado Elegante",
    colors: {
      background: "#F8F6F2",
      surface: "#FFFDF8",
      primary: "#47351F",
      secondary: "#9A7A42",
      accent: "#C8A46B",
      text: "#221D18",
      muted: "#74685D",
      border: "#D8C29A",
    },
  },
  {
    id: "azul_navy",
    name: "Azul Navy",
    colors: {
      background: "#F5F7FA",
      surface: "#FFFFFF",
      primary: "#102A43",
      secondary: "#6D7F98",
      accent: "#B8A06A",
      text: "#111111",
      muted: "#607086",
      border: "#B9C5D2",
    },
  },
  {
    id: "verde_olivo",
    name: "Verde Olivo",
    colors: {
      background: "#F7F6EF",
      surface: "#FFFFFF",
      primary: "#49543B",
      secondary: "#8E6C88",
      accent: "#BBA36F",
      text: "#20251D",
      muted: "#6F765F",
      border: "#C8C1A2",
    },
  },
  {
    id: "celeste",
    name: "Celeste",
    colors: {
      background: "#F5FAFB",
      surface: "#FFFFFF",
      primary: "#315E6F",
      secondary: "#7A8EA0",
      accent: "#D9B8A7",
      text: "#173140",
      muted: "#657A88",
      border: "#BDD8DF",
    },
  },
  {
    id: "terracota",
    name: "Terracota",
    colors: {
      background: "#FBF5F0",
      surface: "#FFFFFF",
      primary: "#844C3C",
      secondary: "#8E6C88",
      accent: "#C8906B",
      text: "#2C211D",
      muted: "#7A655F",
      border: "#D8B29F",
    },
  },
  {
    id: "rojo_clasico",
    name: "Rojo Clasico",
    colors: {
      background: "#F9F4F3",
      surface: "#FFFFFF",
      primary: "#7D2E34",
      secondary: "#8E6C88",
      accent: "#C8A46B",
      text: "#241B1D",
      muted: "#755F63",
      border: "#D8AFB2",
    },
  },
  {
    id: "rosado",
    name: "Rosado",
    colors: {
      background: "#FBF6F7",
      surface: "#FFFFFF",
      primary: "#9B6174",
      secondary: "#8E6C88",
      accent: "#D9B8A7",
      text: "#2E2228",
      muted: "#7B6570",
      border: "#E2C3CC",
    },
  },
] as const;

export type InvitationThemeId = (typeof invitationThemes)[number]["id"];
export type InvitationPaletteId = (typeof invitationPalettes)[number]["id"];

export function isInvitationThemeId(value: string): value is InvitationThemeId {
  return invitationThemes.some((theme) => theme.id === value);
}

export function isInvitationPaletteId(
  value: string,
): value is InvitationPaletteId {
  return invitationPalettes.some((palette) => palette.id === value);
}

export function getInvitationTheme(id: string) {
  return (
    invitationThemes.find((theme) => theme.id === id) ?? invitationThemes[0]
  );
}

export function getInvitationPalette(id: string) {
  return (
    invitationPalettes.find((palette) => palette.id === id) ??
    invitationPalettes[0]
  );
}
