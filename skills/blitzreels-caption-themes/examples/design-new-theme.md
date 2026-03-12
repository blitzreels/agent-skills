# Example: Design a New Caption Theme

End-to-end walkthrough of creating a custom caption theme.

## Scenario

User says: "I want bold captions like MrBeast but with blue instead of pink, and I want it as my default."

## Step 1: Parse Intent

- Create from reference (MrBeast preset as base)
- Modify: swap pink → blue
- Set as default

## Step 2: Design Settings

Start from the `mr-beast-style` recipe and change `activeWordBackgroundColor` from `#FF1493` to a bold blue:

```json
{
  "fontSize": 52,
  "fontFamily": "Bangers",
  "fontWeight": "400",
  "color": "#FFFFFF",
  "textStrokeEnabled": true,
  "textStrokeColor": "#000000",
  "textStrokeWidthPx": 4,
  "backgroundColor": "transparent",
  "position": "bottom",
  "customPositionY": 50,
  "showActiveWord": true,
  "activeWordColor": "#FFFFFF",
  "activeWordBackgroundColor": "#2563EB",
  "activeWordAnimation": "bounce",
  "wordRevealAnimation": "slam",
  "revealMode": "sequential",
  "wordsPerLineLimit": 3,
  "maxLinesPerCaption": 2,
  "textAlign": "center",
  "emphasisEnabled": true,
  "emphasisPatterns": ["numbers", "caps", "exclamations"],
  "emphasisScale": 1.2
}
```

## Step 3: Preview

```
POST /caption-themes/preview
{
  "settings": { ...above settings... },
  "sample_text": "This is INSANE you won't believe it",
  "aspect_ratio": "9:16"
}
```

Response:
```json
{
  "preview_url": "https://cdn.blitzreels.com/previews/abc123.png",
  "expires_at": "2026-03-12T13:00:00Z",
  "width": 1080,
  "height": 1920
}
```

Show preview to user: "Here's how your blue MrBeast-style captions will look: [preview_url]"

## Step 4: User Approves — Create Theme

```
POST /caption-themes
{
  "name": "Blue Beast",
  "settings": { ...above settings... }
}
```

Response:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Blue Beast",
  "settings": { ... },
  "is_default": false,
  "created_at": "2026-03-12T12:05:00Z"
}
```

## Step 5: Set as Default

```
POST /caption-themes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/set-default
```

## Step 6: Report to User

"Created **Blue Beast** theme and set it as your default. Theme ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.

All new clips will use this theme automatically. You can also reference it explicitly:
```json
{ "captions": { "style_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" } }
```"

## Using the Theme in a Clip

```
POST /clips
{
  "source": { "source_type": "youtube", "youtube_url": "https://..." },
  "captions": { "enabled": true, "style_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
}
```
