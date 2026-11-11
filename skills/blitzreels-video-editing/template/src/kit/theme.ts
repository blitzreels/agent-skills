import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Easing } from "remotion";

export const { fontFamily: DISPLAY } = loadFraunces("normal", { weights: ["600"], subsets: ["latin"] });
loadFraunces("italic", { weights: ["600"], subsets: ["latin"] });
export const { fontFamily: BODY } = loadInter("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });
export const { fontFamily: MONO } = loadGeistMono("normal", { weights: ["500", "600"], subsets: ["latin"] });

export const tone = {
  white: "#FFFFFF",
  ink: "#0F0D0B",
  muted: "rgba(255,255,255,0.64)",
  faint: "rgba(255,255,255,0.38)",
  glass: "rgba(16,14,12,0.74)",
  line: "rgba(255,255,255,0.14)",
  accent: "#D97757",
  peach: "#F8BA74",
  good: "#17FFA6",
  cool: "#8EC5FF",
};

export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

export const frame = {
  gutter: 64,
  crownTop: 168,
  chestTop: 1196,
  chestBottom: 1590,
  captionBottom: 520,
  captionWidth: 900,
  captionSize: 70,
  stackPanel: 760,
  stackShift: 480,
  stackCaptionBottom: 1100,
};

export const glassCard = {
  background: tone.glass,
  border: `1px solid ${tone.line}`,
  borderRadius: 26,
  backdropFilter: "blur(18px)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
} as const;
