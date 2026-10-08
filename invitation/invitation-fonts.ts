import {
  Cinzel,
  Cormorant_Garamond,
  Great_Vibes,
  Imperial_Script,
  Lora,
  Manrope,
} from "next/font/google";

const invitationSerif = Cormorant_Garamond({
  display: "swap",
  subsets: ["latin"],
  variable: "--inv-font-serif",
});

const invitationSans = Manrope({
  display: "swap",
  subsets: ["latin"],
  variable: "--inv-font-sans",
});

const invitationClassicScript = Imperial_Script({
  display: "swap",
  preload: false,
  subsets: ["latin"],
  variable: "--inv-font-script-classic",
  weight: "400",
});

const invitationDisplay = Cinzel({
  display: "swap",
  preload: false,
  subsets: ["latin"],
  variable: "--inv-font-display",
});

const invitationLiterarySerif = Lora({
  display: "swap",
  preload: false,
  subsets: ["latin"],
  variable: "--inv-font-literary",
});

const invitationVersallesScript = Great_Vibes({
  display: "swap",
  preload: false,
  subsets: ["latin"],
  variable: "--inv-font-script-versalles",
  weight: "400",
});

export const invitationFontClassName = [
  invitationSerif.variable,
  invitationSans.variable,
  invitationClassicScript.variable,
  invitationDisplay.variable,
  invitationLiterarySerif.variable,
  invitationVersallesScript.variable,
].join(" ");
