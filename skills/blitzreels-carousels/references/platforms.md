# Platform reference

Per-platform settings + readability rules. For pixel-perfect safe-area diagrams and copy-paste position configs, read `safe-areas.md` in this directory.

## TikTok (Photo Mode)
- Aspect ratio: `9:16`
- Safe area preset: `tiktok_9_16`
- Danger zones: top 80px (status bar), right 120px (like/share buttons), bottom 450px (captions/username)
- Safe text zone: `position_x: 0.35–0.55`, `position_y: 0.15–0.65` (left-offset, because right UI eats the right 11% of the frame)
- Optimal slide count: 3–5

## Instagram Feed
- Aspect ratio: `4:5` (portrait) or `1:1` (square)
- Safe area preset: `instagram_4_5` or `instagram_1_1`
- Danger zones: bottom 420px on 4:5, bottom 380px on 1:1 (captions/buttons)
- Safe text zone: `position_x: 0.5` (always centered), `position_y: 0.15–0.60`
- Optimal slide count: 3–5 (max 10, engagement drops after 5)

## Readability rules (apply to all platforms)

Every rule below comes from a mobile-scroll constraint — the viewer has ~0.5s to parse each slide.

- **Max 40 chars/line** — anything longer can't be read at thumb-scroll speed
- **Max 4 lines/slide** — if you need more text, add more slides; denser slides get skipped
- **Min font size: 48px** — smaller than this is illegible on a phone held at arm's length
- **Titles**: 64–80px. **Body**: 48–64px.
- **Enable text stroke** (6px black on white or vice versa) — backgrounds are unpredictable; without a stroke, text vanishes against any area that happens to match the text color
- **Bold sans-serif fonts**: Inter, Montserrat, Poppins. Serifs render thin at small sizes on mobile.
- **WCAG AA contrast**: 4.5:1 minimum (text vs background) — anything lower fails legibility on sunlight-washed phone screens
