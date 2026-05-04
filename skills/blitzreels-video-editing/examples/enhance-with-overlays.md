# Example: Enhance with Overlays

Add graphics, code blocks, and backgrounds to an existing project.

## 1. Check Current State

```bash
bash scripts/editor.sh context proj_abc123 timeline
# → See existing clips, timing, and layers
```

## 2. Add Title Card (Text Overlay)

```bash
bash scripts/blitzreels.sh POST /projects/proj_abc123/text-overlays '{
  "text": "5 Tips for Better Code",
  "styleSettings": {
    "fontSize": 64,
    "fontFamily": "Inter",
    "fontWeight": "800",
    "color": "#FFFFFF"
  },
  "position": {"x": 50, "y": 40},
  "startSeconds": 0,
  "durationSeconds": 3
}'
```

## 3. Add Code Snippet (Motion Code)

```bash
bash scripts/blitzreels.sh POST /projects/proj_abc123/motion-code '{
  "code": "const greet = (name: string) => {\n  return `Hello, ${name}!`;\n};",
  "language": "typescript",
  "theme": "github-dark",
  "font": "JetBrains Mono",
  "position": "center",
  "showWindowChrome": true,
  "windowTitle": "greeting.ts",
  "showLineNumbers": true,
  "startSeconds": 5,
  "durationSeconds": 8,
  "transition": "typewriter"
}'
```

## 4. Add Lower-Third Name Card (Motion Graphic)

```bash
bash scripts/blitzreels.sh POST /projects/proj_abc123/motion-graphics '{
  "template": "lower-third",
  "primaryText": "Jane Smith",
  "secondaryText": "Senior Developer",
  "accentColor": "#6366F1",
  "position": "bottom-left",
  "animation": "slide-left",
  "exitAnimation": "fade",
  "startSeconds": 2,
  "durationSeconds": 5
}'
```

## 5. Add Cinematic Background

```bash
bash scripts/blitzreels.sh POST /projects/proj_abc123/backgrounds '{
  "style_keyword": "film",
  "span_full_video": true
}'
```

Or use a custom gradient:

```bash
bash scripts/blitzreels.sh POST /projects/proj_abc123/backgrounds '{
  "color": "#0a1628",
  "gradient_enabled": true,
  "vignette_intensity": 0.3,
  "film_grain_style": "subtle",
  "span_full_video": true
}'
```

## 6. Export

```bash
bash scripts/editor.sh export proj_abc123 --resolution 1080p
```
