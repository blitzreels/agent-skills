---
name: blitzreels-caption-themes
description: Create, edit, preview, and manage custom caption themes via the BlitzReels API. Use when the task mentions caption theme, caption style, design captions, customize captions, default theme, theme preview, create a look for captions, branded captions, or any request to change how captions appear beyond picking a preset. Also use when the user says "make my captions look like…", "design a caption style", "change my default captions", or "preview this caption look".
---

# BlitzReels Caption Themes

Create, edit, preview, and manage custom caption themes. Themes are reusable caption style configurations that go beyond the 40 built-in presets — full control over typography, colors, animations, emphasis, and layout.

Custom theme IDs work anywhere a preset `style_id` is accepted, including the `/clips` resource.

## Canonical Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/caption-themes` | List user's themes (includes `is_default` flag) |
| GET | `/caption-themes/{themeId}` | Get single theme |
| POST | `/caption-themes` | Create theme |
| PATCH | `/caption-themes/{themeId}` | Update theme (partial settings) |
| DELETE | `/caption-themes/{themeId}` | Delete theme |
| POST | `/caption-themes/{themeId}/duplicate` | Duplicate an existing theme |
| POST | `/caption-themes/{themeId}/set-default` | Set as user's default theme |
| POST | `/caption-themes/preview` | Render preview frame from raw settings |

## Agent Workflow

### 1. Parse Intent

Determine what the user wants:
- **Create from scratch** — user describes a look ("bold yellow text, black background, bounce animation")
- **Create from reference** — user references a preset or genre ("like MrBeast but with blue instead of pink")
- **Edit existing** — user wants to tweak a theme they already have
- **Preview** — user wants to see what settings look like before committing
- **Set default** — user wants a theme applied to all future clips

### 2. Design the Theme

Translate the user's description into `CaptionStyleSettings`. Read `references/caption-style-settings.md` for the full property reference and `references/design-recipes.md` for starting-point recipes by genre.

Key design decisions:
- **Font choice** sets the tone (Inter = clean, Anton/Bangers = bold/viral, Garamond/Playfair = cinematic, Caveat = handwritten)
- **Active word highlighting** is the most impactful visual feature — color, background, and animation
- **Reveal mode** controls pacing: `"sequential"` (word-by-word), `"single"` (one word at a time), `"static"` (full sentence)
- **Emphasis system** auto-detects important words (numbers, caps, exclamations) and scales/colors them

### 3. Create the Theme

```json
POST /caption-themes
{
  "name": "My Custom Theme",
  "settings": {
    "fontSize": 48,
    "fontFamily": "Inter",
    "fontWeight": "800",
    "color": "#FFFFFF",
    "showActiveWord": true,
    "activeWordColor": "#000000",
    "activeWordBackgroundColor": "#FFD700",
    "activeWordAnimation": "bounce",
    "wordRevealAnimation": "pop",
    "revealMode": "sequential",
    "wordsPerLineLimit": 4,
    "maxLinesPerCaption": 2,
    "position": "bottom",
    "customPositionY": 70
  }
}
```

Response includes `id` (UUID) — this is the theme ID used everywhere.

### 4. Preview the Theme

Preview renders a single frame with sample text over a demo video background.

```json
POST /caption-themes/preview
{
  "settings": { ... },
  "sample_text": "This is how your captions will look",
  "aspect_ratio": "9:16",
  "target_width": 1080,
  "image_format": "png"
}
```

Response:
```json
{
  "preview_url": "https://...",
  "expires_at": "2026-03-12T12:00:00Z",
  "width": 1080,
  "height": 1920
}
```

- `sample_text` is optional — the API provides sensible defaults if omitted
- Always show the preview URL to the user and ask for feedback before finalizing

### 5. Iterate

If the user wants changes:
- Use `PATCH /caption-themes/{themeId}` with only the changed fields
- Re-preview with `POST /caption-themes/preview` using the updated settings
- Repeat until the user is satisfied

### 6. Set as Default

When the user wants this theme for all future clips:

```
POST /caption-themes/{themeId}/set-default
```

This makes the theme the user's default — new clips will use it when no explicit `style_id` is provided.

## Design Guidelines by Genre

### Viral / YouTube Shorts
- Bold sans-serif fonts (Anton, Bangers, Inter 800+)
- High contrast active word: bright background (yellow, pink, cyan) with dark text
- Animations: `bounce`, `punch`, `slam`
- Reveal: `"sequential"`, 3-4 words per line
- Emphasis enabled with `"numbers"`, `"caps"` patterns

### Documentary / Cinematic
- Serif fonts (Garamond, Playfair Display, Fraunces)
- Subtle active word: gold/warm color change, `glow` or `highlight` animation
- Minimal or no background color
- Reveal: `"static"` or `"sequential"` with longer word groups
- Position: lower third (`customPositionY: 80-85`)

### Podcast / Interview
- Clean sans-serif (Inter, Poppins, Space Grotesk)
- Readable active word: contrasting background pill, `lift` animation
- Semi-transparent dark background for readability
- Reveal: `"sequential"`, 4-5 words per line
- 2 lines max, centered

### Minimal / Luxury
- Light, airy fonts (Inter 400, Space Grotesk)
- Subtle or no active word — rely on `textFillStyle: "gradient"` instead
- No background, thin stroke only
- Wide letter spacing
- Reveal: `"static"`

## Integration with Clipping

Custom theme IDs work directly in the `/clips` resource:

```json
{
  "captions": {
    "enabled": true,
    "style_id": "theme-uuid-here"
  }
}
```

The clip resource resolves `style_id` by checking presets first, then custom themes. If the user has a default theme set, suggest using it.

## Duplicating & Remixing

To create a variation of an existing theme:

```
POST /caption-themes/{themeId}/duplicate
```

Returns a new theme with `"(Copy)"` appended to the name. Then `PATCH` the copy with changes.

To remix a built-in preset, create a new theme using the preset's settings as a starting point (see `references/design-recipes.md` for full JSON).

## Output Contract

Return:
- `theme_id` — UUID of the created/updated theme
- `name` — theme name
- `preview_url` — latest preview image URL (if previewed)
- `is_default` — whether this is the user's default theme
- Summary of key settings applied

## References

- Read `references/caption-style-settings.md` for the full property reference with types and valid values.
- Read `references/design-recipes.md` for complete JSON settings of representative presets to use as starting points.
- Read `examples/design-new-theme.md` for a full end-to-end walkthrough of creating a custom theme.
