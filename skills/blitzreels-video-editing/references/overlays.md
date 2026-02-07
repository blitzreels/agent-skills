# Overlays Reference

## Text Overlays

Add styled text on top of video at specific timestamps.

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Display text content |
| `styleSettings` | object | Font, color, size, alignment, etc. |
| `position` | object | `{x, y}` as percentage (0–100) |
| `startSeconds` | number | When overlay appears |
| `durationSeconds` | number | How long overlay shows |
| `layerIndex` | number | Stacking order (default: 0) |

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/text-overlays` | Add text overlay |
| PATCH | `/projects/{id}/text-overlays/{oid}` | Update text overlay |
| DELETE | `/projects/{id}/text-overlays/{oid}` | Remove text overlay |

---

## Motion Code Overlays

Animated syntax-highlighted code blocks with step progression.

### Themes (6)
`github-dark` · `one-dark` · `dracula` · `nord` · `monokai` · `tokyo-night`

### Languages (24)
`typescript` · `javascript` · `tsx` · `jsx` · `python` · `rust` · `go` · `java` · `kotlin` · `swift` · `c` · `cpp` · `csharp` · `ruby` · `php` · `html` · `css` · `scss` · `json` · `yaml` · `markdown` · `sql` · `shell` · `dockerfile`

### Monospace Fonts (7)
`JetBrains Mono` · `Fira Code` · `SF Mono` · `Cascadia Code` · `Source Code Pro` · `IBM Plex Mono` · `Roboto Mono`

### Transitions (5)
`typewriter` · `fade` · `lineByLine` · `morph` · `diff`

### Position Presets (8)
`center` · `left` · `right` · `top-left` · `top-right` · `bottom-left` · `bottom-right` · `custom`

### Window Chrome Options
| Field | Type | Description |
|-------|------|-------------|
| `showWindowChrome` | boolean | Show macOS-style title bar |
| `windowTitle` | string | Title bar text |
| `showLineNumbers` | boolean | Display line numbers |

### Multi-Step Progression
Code blocks support evolution steps — each step shows a different code state with a transition between them.

```json
{
  "code": "const x = 1;",
  "language": "typescript",
  "theme": "github-dark",
  "steps": [
    { "code": "const x = 1;", "transition": "typewriter" },
    { "code": "const x = 1;\nconst y = 2;", "transition": "morph" },
    { "code": "const sum = x + y;", "transition": "diff" }
  ]
}
```

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/motion-code` | Add motion code overlay |
| GET | `/projects/{id}/motion-code` | List motion code items |
| PATCH | `/projects/{id}/motion-code/{cid}` | Update motion code |
| DELETE | `/projects/{id}/motion-code/{cid}` | Delete motion code |
| POST | `/projects/{id}/motion-code/{cid}/steps` | Add evolution step |

---

## Motion Graphics Overlays

Template-based animated graphics (lower-thirds, CTAs, data visualizations).

### Template Categories (6)

| Category | Use Cases |
|----------|-----------|
| `lower-third` | Name cards, speaker intros, title bars |
| `call-to-action` | Subscribe buttons, links, clickable prompts |
| `data-viz` | Stats, numbers, percentages, charts |
| `social-proof` | Reviews, testimonials, quotes |
| `decorative` | Headings, labels, visual flair |
| `transition` | Scene transitions, chapter markers |

### Style Keywords
`name` · `speaker` · `title` · `intro` · `subscribe` · `link` · `action` · `click` · `number` · `stat` · `percent` · `money` · `price` · `review` · `testimonial` · `quote` · `heading` · `label`

### Settings Schema
| Field | Type | Description |
|-------|------|-------------|
| `primaryText` | string | Main display text |
| `secondaryText` | string | Subtitle/supporting text |
| `accentColor` | string | Primary accent color |
| `backgroundColor` | string | Background color |
| `textColor` | string | Text color |
| `position` | enum | bottom-left, bottom-right, top-left, top-right, center, custom |
| `customPosition` | object | `{x, y}` when position=custom |
| `animation` | enum | fade, slide-up, slide-down, slide-left, slide-right, bounce, pop |
| `exitAnimation` | enum | fade, slide-up, slide-down, slide-left, slide-right, shrink, none |
| `easing` | string | Animation easing function |
| `startSeconds` | number | When graphic appears |
| `durationSeconds` | number | Display duration |

### Data Visualization Fields
| Field | Type | Description |
|-------|------|-------------|
| `value` | number | Numeric value to display |
| `numberFormat` | enum | number, compact, percentage, currency |
| `animateCount` | boolean | Animate counting up |

### CTA Fields
| Field | Type | Description |
|-------|------|-------------|
| `buttonText` | string | Button label |
| `buttonStyle` | enum | solid, outline, gradient |
| `buttonUrl` | string | Target URL |

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/{id}/motion-graphics/templates` | List templates & keywords |
| POST | `/projects/{id}/motion-graphics` | Add motion graphic |
| GET | `/projects/{id}/motion-graphics` | List existing overlays |
| PATCH | `/projects/{id}/motion-graphics/{gid}` | Update motion graphic |
| DELETE | `/projects/{id}/motion-graphics/{gid}` | Delete motion graphic |
