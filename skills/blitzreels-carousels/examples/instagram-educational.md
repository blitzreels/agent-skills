# Instagram Educational Carousel Example

**Topic**: "How Photosynthesis Works (Explained)"

**Format**: 5-slide Instagram feed carousel (4:5)

**Duration**: 15 seconds total (3s per slide)

**Marketing Structure**: Hook → 3 Key Points → Recap/CTA

---

## Slide Breakdown

### Slide 1: Hook (0-3s)

**Purpose**: Introduce topic with clear, appealing title

**Background**: Gradient (light green → teal) with leaf illustration

**Text**:
```
How Photosynthesis
Works (Explained)
```

**Text Styling**:
- Font: Inter Bold
- Size: 72px
- Color: `#ffffff` (white)
- Stroke: 6px dark green (`#1a5f3a`)
- Alignment: center
- Position: `position_x: 0.5, position_y: 0.15` (top-center)

**Readability Check**:
- Line 1: "How Photosynthesis" = 18 chars ✅
- Line 2: "Works (Explained)" = 17 chars ✅
- Total lines: 2 ✅

---

### Slide 2: Key Point 1 (3-6s)

**Purpose**: Explain step 1 (light absorption)

**Background**: White with subtle green accent bar at top

**Text**:
```
Step 1: Light Absorption
Chloroplasts capture
sunlight energy
```

**Text Styling**:
- Font: Poppins SemiBold
- Size: 56px (title), 48px (body)
- Color: `#2d5f3a` (dark green)
- Stroke: 4px white (`#ffffff`)
- Alignment: center
- Position: `position_x: 0.5, position_y: 0.35` (upper-middle)

**Readability Check**:
- Line 1: "Step 1: Light Absorption" = 24 chars ✅
- Line 2: "Chloroplasts capture" = 20 chars ✅
- Line 3: "sunlight energy" = 15 chars ✅
- Total lines: 3 ✅

---

### Slide 3: Key Point 2 (6-9s)

**Purpose**: Explain step 2 (water splitting)

**Background**: White with blue accent bar

**Text**:
```
Step 2: Water Splitting
H2O breaks into
H + O2 (oxygen!)
```

**Text Styling**:
- Font: Poppins SemiBold
- Size: 56px (title), 48px (body)
- Color: `#1a4d7a` (dark blue)
- Stroke: 4px white
- Alignment: center
- Position: `position_x: 0.5, position_y: 0.35`

**Readability Check**:
- Line 1: "Step 2: Water Splitting" = 23 chars ✅
- Line 2: "H2O breaks into" = 15 chars ✅
- Line 3: "H + O2 (oxygen!)" = 15 chars ✅
- Total lines: 3 ✅

---

### Slide 4: Key Point 3 (9-12s)

**Purpose**: Explain step 3 (sugar formation)

**Background**: White with orange accent bar

**Text**:
```
Step 3: Sugar Formation
CO2 + H combine to
make glucose (food!)
```

**Text Styling**:
- Font: Poppins SemiBold
- Size: 56px (title), 48px (body)
- Color: `#c75000` (dark orange)
- Stroke: 4px white
- Alignment: center
- Position: `position_x: 0.5, position_y: 0.35`

**Readability Check**:
- Line 1: "Step 3: Sugar Formation" = 23 chars ✅
- Line 2: "CO2 + H combine to" = 18 chars ✅
- Line 3: "make glucose (food!)" = 20 chars ✅
- Total lines: 3 ✅

---

### Slide 5: Recap/CTA (12-15s)

**Purpose**: Summarize + drive engagement

**Background**: Dark green gradient

**Text**:
```
Light → Water → Sugar
📌 Save for biology!
Follow @YourBrand
```

**Text Styling**:
- Font: Inter Bold
- Size: 64px (line 1), 56px (lines 2-3)
- Color: `#ffffff` (white)
- Stroke: 6px black
- Alignment: center
- Position: `position_x: 0.5, position_y: 0.3`

**Readability Check**:
- Line 1: "Light → Water → Sugar" = 21 chars ✅
- Line 2: "📌 Save for biology!" = 20 chars ✅
- Line 3: "Follow @YourBrand" = 17 chars ✅
- Total lines: 3 ✅

---

## Script Implementation

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"

bash scripts/instagram.sh \
  --aspect 4:5 \
  --name "Photosynthesis Explained" \
  --slide-duration 3 \
  --images "https://example.com/slide1-green-gradient.jpg|https://example.com/slide2-white-green.jpg|https://example.com/slide3-white-blue.jpg|https://example.com/slide4-white-orange.jpg|https://example.com/slide5-dark-green.jpg" \
  --titles "How Photosynthesis\nWorks (Explained)|Step 1: Light Absorption\nChloroplasts capture\nsunlight energy|Step 2: Water Splitting\nH2O breaks into\nH + O2 (oxygen!)|Step 3: Sugar Formation\nCO2 + H combine to\nmake glucose (food!)|Light → Water → Sugar\n📌 Save for biology!\nFollow @YourBrand"
```

---

## Caption & Hashtags

**Caption** (front-load value):
```
Swipe to learn how photosynthesis works in 3 simple steps →

This is the process plants use to make their own food. Perfect cheat sheet for biology students!

📌 Save this post for later
👉 Follow @YourBrand for more science explainers
```

**Hashtags** (first comment):
```
#photosynthesis #biology #scienceeducation #biologystudent #stem #studytips #learnontiktok #scienceexplained #plantscience #biologyclass
```

---

## Instagram-Specific Optimizations

**Posting Strategy**:
- Post time: 11 AM - 1 PM or 7-9 PM (peak engagement)
- Feed post (NOT Reel) — carousels get more swipes in feed
- Tag location if relevant (e.g., "Biology Classroom")

**Safe Area Compliance**:
- All text centered (`position_x: 0.5`) — Instagram's feed is symmetrical ✅
- Consistent vertical positioning across slides (`position_y: 0.35` for steps) ✅
- No text in bottom 420px (caption zone) ✅

**Visual Consistency**:
- Slides 2-4 use same layout (white bg + colored accent bar) ✅
- Slide 1 & 5 use gradient backgrounds (visual bookends) ✅
- Color-coded by topic (green=light, blue=water, orange=sugar) ✅

**Contrast Check**:
- Slide 1: White on green gradient = high contrast ✅
- Slides 2-4: Dark text on white = high contrast ✅
- Slide 5: White on dark green = high contrast ✅
- All slides use text stroke for legibility ✅
