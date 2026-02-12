# TikTok Entrepreneurship Carousel Example

**Topic**: "3 Mistakes Killing Your Startup"

**Format**: 3-slide TikTok carousel (9:16)

**Duration**: 9 seconds total (3s per slide)

**Marketing Structure**: Hook → Value → CTA

---

## Slide Breakdown

### Slide 1: Hook (0-3s)

**Purpose**: Stop the scroll with a bold, attention-grabbing statement

**Background**: Dark gradient (navy blue → purple)

**Text**:
```
3 Mistakes Killing
Your Startup
```

**Text Styling**:
- Font: Montserrat Bold
- Size: 72px
- Color: `#ffffff` (white)
- Stroke: 6px black (`#000000`)
- Alignment: center
- Position: `position_x: 0.45, position_y: 0.18` (top-left-of-center, avoids right UI)

**Readability Check**:
- Line 1: "3 Mistakes Killing" = 19 chars ✅
- Line 2: "Your Startup" = 12 chars ✅
- Total lines: 2 ✅ (max 4)

---

### Slide 2: Value (3-6s)

**Purpose**: Deliver core insight (numbered list format)

**Background**: White with subtle texture

**Text**:
```
1. Building without users
2. Ignoring metrics
3. Perfectionism
```

**Text Styling**:
- Font: Poppins Bold
- Size: 56px
- Color: `#1a1a2e` (dark navy)
- Stroke: 4px white (`#ffffff`)
- Alignment: left
- Position: `position_x: 0.35, position_y: 0.5` (middle-left, avoids right UI)

**Readability Check**:
- Line 1: "1. Building without users" = 25 chars ✅
- Line 2: "2. Ignoring metrics" = 19 chars ✅
- Line 3: "3. Perfectionism" = 16 chars ✅
- Total lines: 3 ✅

---

### Slide 3: CTA (6-9s)

**Purpose**: Drive engagement (save/follow)

**Background**: Bold red gradient

**Text**:
```
Save this for later ↓
Follow for more tips
```

**Text Styling**:
- Font: Montserrat Bold
- Size: 64px
- Color: `#ffffff` (white)
- Stroke: 6px black (`#000000`)
- Alignment: center
- Position: `position_x: 0.45, position_y: 0.18` (top-left-of-center)

**Readability Check**:
- Line 1: "Save this for later ↓" = 21 chars ✅
- Line 2: "Follow for more tips" = 20 chars ✅
- Total lines: 2 ✅

---

## Script Implementation

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"

bash scripts/tiktok.sh \
  --name "Startup Mistakes Carousel" \
  --slide-duration 3 \
  --images "https://example.com/slide1-dark-gradient.jpg|https://example.com/slide2-white-texture.jpg|https://example.com/slide3-red-gradient.jpg" \
  --titles "3 Mistakes Killing\nYour Startup|1. Building without users\n2. Ignoring metrics\n3. Perfectionism|Save this for later ↓\nFollow for more tips"
```

---

## Caption & Hashtags

**Caption** (125 chars max visible):
```
Which mistake do you struggle with most? 👇 (Comment 1, 2, or 3)

Building a startup is hard. Avoid these 3 common mistakes that kill most startups before they reach product-market fit.
```

**Hashtags** (first comment):
```
#entrepreneur #startup #startuptips #businessgrowth #entrepreneurship #startuplife #businessadvice #foundertips #productmarketfit #entrepreneurmindset
```

---

## TikTok-Specific Optimizations

**Posting Strategy**:
- Post time: 7-9 AM or 12-1 PM (user's timezone)
- Sound: Use trending audio or silent (text-based carousels often work silent)
- Engagement bait: "Comment 1, 2, or 3" drives comments (boosts algorithm)

**Safe Area Compliance**:
- All text offset left (`position_x: 0.45`) to avoid right-side buttons ✅
- No text in bottom 450px (caption zone) ✅
- Top positioning (`position_y: 0.18`) clears status bar ✅

**Contrast Check**:
- Slide 1: White on dark gradient = high contrast ✅
- Slide 2: Dark navy on white = high contrast ✅
- Slide 3: White on red gradient = high contrast ✅
- All slides use 6px text stroke for extra legibility ✅
