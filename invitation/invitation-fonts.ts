import { Cormorant_Garamond, Manrope } from "next/font/google";

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

export const invitationFontClassName = [
  invitationSerif.variable,
  invitationSans.variable,
].join(" ");
