# Safe Area Positioning Guide

Visual guide to normalized coordinates (`position_x`, `position_y`) for TikTok and Instagram carousels.

---

## Understanding Normalized Coordinates

**Coordinate System**: `0.0` to `1.0` (fractional positioning)

- `position_x: 0.0` = far left edge
- `position_x: 0.5` = horizontal center
- `position_x: 1.0` = far right edge

- `position_y: 0.0` = top edge
- `position_y: 0.5` = vertical center
- `position_y: 1.0` = bottom edge

**Why normalized?** Works across all resolutions (1080p, 720p, etc.) without recalculating pixel values.

---

## TikTok Photo Mode (9:16)

### Canvas Dimensions
- **Resolution**: 1080 x 1920 (portrait)
- **Aspect ratio**: 9:16

### Danger Zones (Absolute Pixels)

```
┌──────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  Top 80px (status bar)
├──────────────────────────────────┤
│                                  │
│  ✅ SAFE ZONE                    │  Top-center safe
│     (position_y: 0.15 - 0.65)    │  (position_x: 0.35-0.55)
│                                  │
│                              ▓▓▓ │  Right 120px
│                              ▓▓▓ │  (buttons)
├──────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  Bottom 450px
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  (captions, username)
└──────────────────────────────────┘
```

### Safe Positions (Normalized Coords)

**Top-Center Safe** (best for hook slides)
- `position_x: 0.45` (slightly left of center)
- `position_y: 0.18` (below status bar)
- ✅ Avoids: top bar, right UI, bottom captions

**Middle-Left Safe** (best for body text)
- `position_x: 0.35` (left third)
- `position_y: 0.5` (vertical center)
- ✅ Avoids: right UI buttons

**Bottom Safe (Max)** (use cautiously)
- `position_x: 0.45`
- `position_y: 0.65` (above caption zone)
- ⚠️ Tight fit: leaves only small margin above captions

### TikTok Positioning Examples

```bash
# Hook slide (top-center)
{
  "position_x": 0.45,
  "position_y": 0.18,
  "style": {
    "font_size": 72,
    "text_align": "center"
  }
}

# Body text (middle-left)
{
  "position_x": 0.35,
  "position_y": 0.5,
  "style": {
    "font_size": 56,
    "text_align": "left"
  }
}

# CTA (top-center, same as hook for consistency)
{
  "position_x": 0.45,
  "position_y": 0.18,
  "style": {
    "font_size": 64,
    "text_align": "center"
  }
}
```

---

## Instagram Feed (4:5)

### Canvas Dimensions
- **Resolution**: 1080 x 1350 (portrait)
- **Aspect ratio**: 4:5

### Danger Zones (Absolute Pixels)

```
┌──────────────────────────────────┐
│                                  │
│  ✅ SAFE ZONE                    │  Top-center safe
│     (position_y: 0.15 - 0.60)    │  (position_x: 0.5)
│     All text centered            │
│                                  │
├──────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  Bottom 420px
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  (username, caption,
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   like/comment/share)
└──────────────────────────────────┘
```

### Safe Positions (Normalized Coords)

**Top-Center Safe** (best for titles)
- `position_x: 0.5` (centered)
- `position_y: 0.15` (top zone)
- ✅ Avoids: bottom caption area

**Middle-Center Safe** (best for body text)
- `position_x: 0.5` (centered)
- `position_y: 0.45` (middle zone)
- ✅ Avoids: bottom caption area, balanced composition

**Bottom Safe (Max)** (use cautiously)
- `position_x: 0.5` (centered)
- `position_y: 0.6` (above caption zone)
- ⚠️ Tight fit: minimal margin before captions start

### Instagram Positioning Examples

```bash
# Hook slide (top-center)
{
  "position_x": 0.5,
  "position_y": 0.15,
  "style": {
    "font_size": 72,
    "text_align": "center"
  }
}

# Body text (middle-center)
{
  "position_x": 0.5,
  "position_y": 0.45,
  "style": {
    "font_size": 56,
    "text_align": "center"
  }
}

# CTA (top-center, consistent with hook)
{
  "position_x": 0.5,
  "position_y": 0.15,
  "style": {
    "font_size": 64,
    "text_align": "center"
  }
}
```

---

## Instagram Square (1:1)

### Canvas Dimensions
- **Resolution**: 1080 x 1080 (square)
- **Aspect ratio**: 1:1

### Danger Zones (Absolute Pixels)

```
┌──────────────────────────────────┐
│                                  │
│  ✅ SAFE ZONE                    │  Center safe
│     (position_y: 0.15 - 0.60)    │  (position_x: 0.5)
│     All text centered            │
│                                  │
├──────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  Bottom 380px
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  (captions)
└──────────────────────────────────┘
```

### Safe Positions

Same as Instagram 4:5, but with more vertical breathing room due to square format.

---

## Position Presets (Quick Reference)

Instead of manually setting `position_x` and `position_y`, you can use position presets:

```bash
# Available presets
"position": "top"          # Top-center (safe for all platforms)
"position": "center"       # True center (⚠️ may conflict with captions)
"position": "bottom"       # Bottom-center (⚠️ DANGER: overlaps captions)
"position": "top-left"     # Top-left corner
"position": "top-right"    # Top-right corner (⚠️ TikTok right UI conflict)
```

**Recommendation**: For carousels, use **custom normalized coords** for precise safe area compliance rather than presets.

---

## Testing Safe Areas

### Visual Testing Checklist

1. **Export test carousel** with max text positioning (near edges)
2. **View on mobile device** (not desktop)
3. **Check TikTok app**:
   - Right-side buttons overlap? → Move text left
   - Bottom caption overlap? → Move text up
   - Status bar overlap? → Move text down
4. **Check Instagram app**:
   - Caption preview overlap? → Move text up
   - Username/profile overlap? → Move text up

### Safe Area Simulator

To preview safe areas before export, use these visual overlays:

**TikTok (9:16):**
- Top danger zone: 0-80px (4% of height)
- Right danger zone: 960-1080px (11% of width)
- Bottom danger zone: 1470-1920px (23% of height)

**Instagram (4:5):**
- Bottom danger zone: 930-1350px (31% of height)

---

## Common Mistakes

❌ **Centering text vertically** (`position_y: 0.5`) on TikTok
   - May overlap with right-side buttons
   - ✅ Fix: Use `position_x: 0.35` (left-offset)

❌ **Using `position: "bottom"` preset**
   - ALWAYS overlaps with captions
   - ✅ Fix: Use `position_y: 0.65` max

❌ **Forgetting text stroke on low-contrast backgrounds**
   - Text becomes illegible
   - ✅ Fix: Always enable 6px stroke

❌ **Hardcoding pixel positions** (e.g., `position_x: 540`)
   - Breaks on different resolutions
   - ✅ Fix: Use normalized coords (0-1)

---

## Quick Copy-Paste Configs

### TikTok Hook Slide
```json
{
  "position_x": 0.45,
  "position_y": 0.18,
  "style": {
    "font_size": 72,
    "font_weight": "700",
    "text_align": "center",
    "color": "#ffffff",
    "text_stroke_enabled": true,
    "text_stroke_color": "#000000",
    "text_stroke_width_px": 6
  }
}
```

### Instagram Title Slide
```json
{
  "position_x": 0.5,
  "position_y": 0.15,
  "style": {
    "font_size": 72,
    "font_weight": "700",
    "text_align": "center",
    "color": "#ffffff",
    "text_stroke_enabled": true,
    "text_stroke_color": "#000000",
    "text_stroke_width_px": 6
  }
}
```

### Body Text (All Platforms)
```json
{
  "position_x": 0.5,
  "position_y": 0.45,
  "style": {
    "font_size": 56,
    "font_weight": "600",
    "text_align": "center",
    "color": "#1a1a2e",
    "text_stroke_enabled": true,
    "text_stroke_color": "#ffffff",
    "text_stroke_width_px": 4
  }
}
```
