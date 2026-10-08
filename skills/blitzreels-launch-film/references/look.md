# Look

Three tested presets (`src/engine/looks.js`), each coloured with the product's brand colour as the only accent. Choose one in `film.config.json` (`look`), or derive a fourth from the references (write it down in `rubric.md` with measured values).

## Presets

**Void** (default for dev tools; the BlitzClean film)
- Near-black stage `#060607`, a hairline perspective floor grid that drifts slowly, a 2 px accent horizon line at y ≈ 74 % of the frame.
- Cards: translucent fill with backdrop blur, 1 px light rim on top, hairline border, tight contact shadow. Never a large black drop shadow.
- Light: horizon line, sharp rays at hits, specular sweeps across cards. No soft blobs.
- Reflections: blurred, faint glow of objects standing on the horizon.

**Paper** (consumer, editorial, also the light act inside Void films)
- Off-white `#f7f8f6` with a pale floor and a darker accent horizon; deep ink `#0b0f0d` type.
- Cards: white with a hairline border and a soft, short neutral shadow (shadows read on light grounds).
- The light act of a Void film uses Paper, entered by an iris from a hero point and left by contracting into the next hero object.

**Glass** (premium, "liquid glass" look)
- A lit backdrop (`shaders.lightField` in the accent, or blurred product footage) is mandatory: glass over black reads as grey plastic.
- Glass panels: refraction of the lit field (`shaders.glass`), frost, a bevel highlight, a specular sweep once per appearance.

## Colour

- The accent is the product's brand colour. Find candidates with `scripts/brand-colors.mjs` (app icon, logo, site theme-color and CSS variables), then let the user pick with AskUserQuestion. Never ship the template's demo colour or another product's colour.
- Check contrast: the accent should reach ≥ 3:1 against the stage (the script prints it for void and paper). A brand colour too dark for Void (navy, deep purple) means Paper, or lifting the accent's lightness for light elements only while keeping the hue.
- If the brand has its own background or ink colours, set them in `film.config.json` `palette`, so the stage feels like the brand rather than a generic black.

- One accent hue per frame. Whites, greys and the product's own UI colours inside rebuilt screens don't count.
- Semantic colours (red alarm, amber warning) only where the product itself uses them, and only briefly.
- Grade is hue-preserving: whites stay white, the accent stays saturated.

## Type

- Default display and UI family: Geist (600–700 for display, 500–600 for UI), Geist Mono for paths and code. Use the product's own font if it has a distinctive one and the licence allows.
- Display tracking −0.03 to −0.045 em; tabular figures for numbers.
- Size floor at 1080p: headline cap height ≥ 60 px; UI labels inside rebuilt screens can be small because the camera pushes in.

## Rebuilt product UI

- Measure the real screenshot (positions, radii, colours with a picker) and rebuild in the same coordinate space, then scale the whole component.
- Verify by overlay: render the rebuild over the screenshot at 50 % opacity and report the max offset; aim for ≤ 2 px at native size.
- Replace private data with plausible real-looking values the user approved in `assets.md`.
- Real third-party icons (from `/Applications/*.app` or official press kits), never emoji or generic glyphs.

## Banding and compression

- Post runs in float with dither, so gradients render clean. Video compression still crushes near-black detail: keep important detail above ~8 % luminance and avoid huge slow gradients over most of the frame.
- Check a dark crop of a still at 4× zoom before calling the look done.
