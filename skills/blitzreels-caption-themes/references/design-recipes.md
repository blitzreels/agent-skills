# Design Recipes

Complete JSON settings for representative presets. Use these as starting points when creating custom themes — duplicate the closest match, then modify.

## viral-center

Golden highlight, lift animation, center position. High-energy YouTube/TikTok style.

```json
{
  "fontSize": 44,
  "fontFamily": "Inter",
  "fontWeight": "800",
  "color": "#FFFFFF",
  "textStrokeEnabled": true,
  "textStrokeColor": "#000000",
  "textStrokeWidthPx": 3,
  "backgroundColor": "transparent",
  "position": "bottom",
  "customPositionY": 50,
  "showActiveWord": true,
  "activeWordColor": "#FFFFFF",
  "activeWordBackgroundColor": "#DAA520",
  "activeWordAnimation": "lift",
  "wordRevealAnimation": "pop",
  "revealMode": "sequential",
  "wordsPerLineLimit": 4,
  "maxLinesPerCaption": 2,
  "textAlign": "center"
}
```

## documentary

Dark background bar, gold active word glow. Clean, authoritative look for informational content.

```json
{
  "fontSize": 40,
  "fontFamily": "Inter",
  "fontWeight": "600",
  "color": "#FFFFFF",
  "backgroundColor": "rgba(0, 0, 0, 0.7)",
  "borderRadius": 8,
  "paddingPx": 12,
  "position": "bottom",
  "customPositionY": 80,
  "showActiveWord": true,
  "activeWordColor": "#FFD700",
  "activeWordAnimation": "glow",
  "wordRevealAnimation": "fade",
  "revealMode": "sequential",
  "wordsPerLineLimit": 5,
  "maxLinesPerCaption": 2,
  "textAlign": "center"
}
```

## mr-beast-style

Hot pink background, bounce animation, comic font. Maximum visual impact for viral shorts.

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
  "activeWordBackgroundColor": "#FF1493",
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

## hormozi-style

Bold yellow background on active word, punch animation. Direct, high-conversion style.

```json
{
  "fontSize": 48,
  "fontFamily": "Anton",
  "fontWeight": "400",
  "color": "#FFFFFF",
  "textStrokeEnabled": true,
  "textStrokeColor": "#000000",
  "textStrokeWidthPx": 3,
  "backgroundColor": "transparent",
  "position": "bottom",
  "customPositionY": 50,
  "showActiveWord": true,
  "activeWordColor": "#000000",
  "activeWordBackgroundColor": "#FFD700",
  "activeWordAnimation": "punch",
  "wordRevealAnimation": "scale",
  "revealMode": "sequential",
  "wordsPerLineLimit": 3,
  "maxLinesPerCaption": 2,
  "textAlign": "center",
  "emphasisEnabled": true,
  "emphasisPatterns": ["numbers", "caps"],
  "emphasisScale": 1.15
}
```

## single-word-focus

One word at a time, pop animation. Maximum attention per word — great for hooks and punchlines.

```json
{
  "fontSize": 56,
  "fontFamily": "Inter",
  "fontWeight": "900",
  "color": "#FFFFFF",
  "textStrokeEnabled": true,
  "textStrokeColor": "#000000",
  "textStrokeWidthPx": 4,
  "backgroundColor": "transparent",
  "position": "bottom",
  "customPositionY": 50,
  "showActiveWord": false,
  "wordRevealAnimation": "pop",
  "revealMode": "single",
  "wordsPerLineLimit": 1,
  "maxLinesPerCaption": 1,
  "textAlign": "center"
}
```

## clean-highlight

Golden background on active word, lift animation. Polished look that works across genres.

```json
{
  "fontSize": 42,
  "fontFamily": "Poppins",
  "fontWeight": "700",
  "color": "#FFFFFF",
  "textStrokeEnabled": true,
  "textStrokeColor": "#000000",
  "textStrokeWidthPx": 2,
  "backgroundColor": "transparent",
  "position": "bottom",
  "customPositionY": 65,
  "showActiveWord": true,
  "activeWordColor": "#000000",
  "activeWordBackgroundColor": "#FFD700",
  "activeWordAnimation": "lift",
  "borderRadius": 6,
  "wordRevealAnimation": "fade",
  "revealMode": "sequential",
  "wordsPerLineLimit": 4,
  "maxLinesPerCaption": 2,
  "textAlign": "center"
}
```

## gradient-style

Purple-to-pink gradient text. Modern, eye-catching without background boxes.

```json
{
  "fontSize": 46,
  "fontFamily": "Inter",
  "fontWeight": "800",
  "color": "#FFFFFF",
  "textFillStyle": "gradient",
  "textGradientFrom": "#A855F7",
  "textGradientTo": "#EC4899",
  "textGradientAngleDeg": 180,
  "textGradientColorSpace": "oklch",
  "shadowMode": "drop-shadow",
  "textStrokeEnabled": true,
  "textStrokeColor": "#000000",
  "textStrokeWidthPx": 2,
  "backgroundColor": "transparent",
  "position": "bottom",
  "customPositionY": 50,
  "showActiveWord": true,
  "activeWordAnimation": "glow",
  "wordRevealAnimation": "scale",
  "revealMode": "sequential",
  "wordsPerLineLimit": 4,
  "maxLinesPerCaption": 2,
  "textAlign": "center"
}
```

## cinema-minimal

Garamond serif, elegant film subtitle. Understated, cinematic feel.

```json
{
  "fontSize": 36,
  "fontFamily": "Garamond",
  "fontWeight": "400",
  "color": "#F5F5F5",
  "letterSpacing": 1,
  "backgroundColor": "transparent",
  "position": "bottom",
  "customPositionY": 85,
  "showActiveWord": false,
  "wordRevealAnimation": "fade",
  "revealMode": "static",
  "wordsPerLineLimit": 6,
  "maxLinesPerCaption": 2,
  "textAlign": "center",
  "textStrokeEnabled": true,
  "textStrokeColor": "rgba(0,0,0,0.6)",
  "textStrokeWidthPx": 1,
  "textStrokeBlurPx": 2
}
```
