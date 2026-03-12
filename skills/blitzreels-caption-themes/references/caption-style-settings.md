# CaptionStyleSettings Property Reference

Full property reference for caption theme settings. All fields are optional — omitted fields use defaults.

## Typography

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fontSize` | number | 44 | Font size in pixels (38–56 typical) |
| `fontFamily` | string | "Inter" | Font name (Inter, Anton, Bangers, Poppins, Garamond, Playfair Display, Space Grotesk, Fraunces, Caveat, Oswald, Orbitron, IBM Plex Mono) |
| `fontWeight` | string | "700" | Weight: "400" (regular), "500" (medium), "600" (semibold), "700" (bold), "800" (extrabold), "900" (black) |
| `color` | string | "#FFFFFF" | Text color (hex or rgba) |
| `letterSpacing` | number | 0 | Letter spacing in px (0–4 typical, up to 8 for wide styles) |
| `wordSpacingPx` | number | 0 | Space between words in px |
| `lineHeight` | number | 1.2 | Line height multiplier |
| `textAlign` | string | "center" | Text alignment: "center", "left", "right" |

## Text Fill & Gradient

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `textFillStyle` | string | "solid" | "solid" or "gradient" |
| `textGradientFrom` | string | — | Start color for gradient text (requires `textFillStyle: "gradient"`) |
| `textGradientTo` | string | — | End color for gradient text |
| `textGradientAngleDeg` | number | 180 | Gradient angle in degrees |
| `textGradientColorSpace` | string | "oklch" | Color space for smooth gradients |
| `shadowMode` | string | null | null or "drop-shadow" (required for gradient text shadows) |

## Stroke

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `textStrokeEnabled` | boolean | false | Enable text outline |
| `textStrokeColor` | string | "#000000" | Stroke color |
| `textStrokeWidthPx` | number | 2 | Stroke width in px (1–5 typical) |
| `textStrokeBlurPx` | number | 0 | Stroke blur radius |

## Background & Position

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `backgroundColor` | string | "transparent" | Caption box background color |
| `borderRadius` | number | 0 | Corner rounding in px |
| `border` | string | — | CSS border (e.g., "3px solid #000") |
| `position` | string | "bottom" | Vertical zone: "top" or "bottom" |
| `customPositionY` | number | 70 | Y position as % of frame height (50=center, 75=lower third, 85=bottom) |
| `paddingPx` | number | 8 | Padding inside caption box |
| `backgroundGlowColor` | string | — | Glow color behind caption box |
| `backgroundGlowBlurPx` | number | 0 | Glow blur radius |

## Active Word Highlighting

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `showActiveWord` | boolean | true | Enable active word highlight |
| `activeWordColor` | string | — | Text color of the currently spoken word |
| `activeWordBackgroundColor` | string | — | Background color of active word |
| `activeWordAnimation` | enum | "highlight" | Animation on active word: `highlight`, `scale`, `glow`, `lift`, `bounce`, `punch`, `slam`, `elastic`, `shake`, `none` |
| `activeWordHoldMs` | number | 100 | Hold duration in ms after word ends |

## Reveal & Layout

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `wordRevealAnimation` | enum | "none" | How words appear: `none`, `fade`, `scale`, `slide-up`, `pop`, `drop`, `slam`, `typewriter`, `glitch`, `mask-reveal`, `bounce-up`, `split-reveal` |
| `revealMode` | string | "sequential" | Word display mode: "sequential" (word-by-word build-up), "single" (one word at a time), "static" (full sentence) |
| `wordsPerLineLimit` | number | 4 | Max words per line (1–6) |
| `maxLinesPerCaption` | number | 2 | Max lines shown at once (1–2) |
| `pageCombineMs` | number | — | Group words within this time window into one page |

## Emphasis System

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `emphasisEnabled` | boolean | false | Enable auto-emphasis on detected words |
| `autoEmphasisDetection` | boolean | true | Auto-detect emphasis-worthy words |
| `emphasisPatterns` | string[] | [] | Detection patterns: "numbers", "caps", "exclamations" |
| `emphasisScale` | number | 1.15 | Scale multiplier for emphasis words (1.1–1.3) |
| `emphasisColor` | string | — | Override text color for emphasis words |
| `emphasisFontWeight` | string | — | Override font weight for emphasis words |
| `emphasisRotationDeg` | number | 0 | Slight rotation in degrees for emphasis words |
| `emphasisBackgroundColor` | string | — | Override background for emphasis words |

## Caption Engine (Advanced)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `captionEngine` | string | "default" | Caption rendering engine |
| `motionPreset` | string | — | Motion preset name |
| `motionIntensity` | number | — | Motion intensity multiplier |
