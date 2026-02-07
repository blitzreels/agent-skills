# Composition Spec Reference

JSON structure for playground compositions. Use with `playground.sh create` or the `POST /projects/{id}/playground/compositions` endpoint.

## Top-Level Fields

```json
{
  "name": "My Composition",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "durationInFrames": 300,
  "background": "#000000",
  "mode": "elements",
  "elements": [],
  "fonts": ["Inter", "Roboto Mono"],
  "defaults": {
    "fontFamily": "Inter",
    "fontSize": 48,
    "color": "#ffffff",
    "springConfig": "smooth"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Composition name |
| fps | number | yes | Frames per second (typically 30) |
| width | number | yes | Canvas width in pixels |
| height | number | yes | Canvas height in pixels |
| durationInFrames | number | yes | Total duration in frames (frames = seconds × fps) |
| background | string | no | CSS color or gradient |
| mode | `"elements"` \| `"scenes"` | yes | Flat element list or scene-based |
| elements | array | if mode=elements | Top-level elements |
| scenes | array | if mode=scenes | Scene objects with transitions |
| fonts | string[] | no | Google Fonts to load |
| defaults | object | no | Default typography/animation settings |

## Modes

### Elements Mode (flat)
All elements share a single timeline. Good for simple compositions.

### Scenes Mode
Each scene has its own element list and duration. Scenes can have transitions between them.

```json
{
  "mode": "scenes",
  "scenes": [
    {
      "id": "scene-1",
      "name": "Intro",
      "durationInFrames": 90,
      "background": "#1a1a2e",
      "elements": [...],
      "transition": { "type": "fade", "durationInFrames": 15 }
    }
  ]
}
```

## Element Types

All elements share base fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | string | required | Unique element ID |
| type | string | required | Element type (see below) |
| from | number | 0 | Start frame |
| durationInFrames | number | composition duration | Element duration |
| name | string | — | Display name |
| style | object | — | Animated CSS properties (see Styling) |

### text
```json
{
  "id": "title",
  "type": "text",
  "content": "Hello World",
  "style": {
    "fontSize": 72,
    "fontWeight": "bold",
    "color": "#ffffff",
    "x": 960,
    "y": 540
  }
}
```
Extra fields: `content` (string), `typewriter` (object), `highlight` (object)

### shape
```json
{
  "id": "bg-rect",
  "type": "shape",
  "shape": "rectangle",
  "style": {
    "width": 400,
    "height": 200,
    "backgroundColor": "#3498db",
    "borderRadius": 12,
    "x": 100,
    "y": 100
  }
}
```
Shapes: `rectangle`, `circle`, `ellipse`, `line`, `arrow`, `polygon`, `star`

### image
```json
{
  "id": "photo",
  "type": "image",
  "src": "https://example.com/photo.jpg",
  "style": { "width": 800, "height": 600, "x": 0, "y": 0 }
}
```
Extra fields: `src`, `fit`, `objectFit`, `kenBurns` (pan & zoom effect)

### video
```json
{
  "id": "clip",
  "type": "video",
  "src": "https://example.com/clip.mp4",
  "volume": 0.8,
  "startFrom": 0,
  "loop": true
}
```
Extra fields: `src`, `volume`, `startFrom`, `endAt`, `loop`, `muted`, `playbackRate`

### audio
Extra fields: `src`, `volume`, `startFrom`, `endAt`, `loop`, `playbackRate`

### chart
```json
{
  "id": "bar-chart",
  "type": "chart",
  "chartType": "bar",
  "data": [
    { "label": "Q1", "value": 100, "color": "#e74c3c" },
    { "label": "Q2", "value": 150, "color": "#3498db" }
  ],
  "stagger": 5,
  "showLabels": true,
  "showValues": true
}
```
Chart types: `bar`, `pie`, `line`, `area`, `donut`

### code
```json
{
  "id": "snippet",
  "type": "code",
  "code": "console.log('Hello');",
  "language": "javascript",
  "theme": "dracula",
  "showLineNumbers": true,
  "reveal": { "type": "lines", "stagger": 8 }
}
```

### svg
Extra fields: `svg` (string), `animatePath` (`draw` | `morph`), `strokeDasharray`

### group
Container for child elements. Set `series: true` to play children sequentially.
```json
{
  "id": "container",
  "type": "group",
  "children": [...],
  "series": false
}
```

### lottie
Extra fields: `animationData` (JSON or URL), `direction`, `loop`, `playbackRate`, `renderer`

## Styling & Animation

Style properties can be static values or animated:

### Static
```json
{ "opacity": 1, "x": 100, "y": 200 }
```

### Keyframes
```json
{
  "opacity": {
    "keyframes": [
      { "frame": 0, "value": 0 },
      { "frame": 30, "value": 1, "easing": "easeInOut" }
    ]
  }
}
```

### Spring Animation
```json
{
  "x": {
    "timing": {
      "type": "spring",
      "from": -100,
      "to": 0,
      "config": "snappy"
    }
  }
}
```

### Available Style Properties

**Transform**: `x`, `y`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ`, `skewX`, `skewY`

**Visual**: `opacity`, `width`, `height`, `backgroundColor`, `color`, `borderColor`, `borderWidth`, `borderRadius`, `borderStyle`, `boxShadow`, `textShadow`

**Typography**: `fontSize`, `fontWeight`, `fontFamily`, `textAlign`, `lineHeight`, `letterSpacing`, `textTransform`

**Filter**: `blur`, `brightness`, `contrast`, `saturate`, `grayscale`, `hueRotate`

**Layout**: `display`, `flexDirection`, `justifyContent`, `alignItems`, `padding`, `margin`, `gap`

**Position**: `position`, `top`, `left`, `right`, `bottom`, `zIndex`

**Other**: `clipPath`, `overflow`

## Spring Presets

| Name | Config | Best For |
|------|--------|----------|
| smooth | damping: 200 | Subtle, professional motion |
| snappy | damping: 20, stiffness: 200 | UI interactions |
| bouncy | damping: 8 | Playful, attention-grabbing |
| heavy | damping: 15, stiffness: 80, mass: 2 | Weighty, impactful |
| gentle | damping: 30, stiffness: 50 | Slow, elegant reveals |

## Easing Options

`linear`, `easeIn`, `easeOut`, `easeInOut`, `easeInQuad`, `easeOutQuad`, `easeInCubic`, `easeOutCubic`, `easeInElastic`, `easeOutElastic`, `easeInBounce`, `easeOutBounce`

## Transitions (Scenes Mode)

| Type | Directions |
|------|-----------|
| fade | — |
| slide | from-left, from-right, from-top, from-bottom |
| wipe | from-left, from-right, from-top, from-bottom |
| flip | — |
| clockWipe | — |

```json
{
  "transition": {
    "type": "slide",
    "direction": "from-right",
    "durationInFrames": 15
  }
}
```

## Common Patterns

### Centered Title
```json
{
  "mode": "elements",
  "elements": [{
    "id": "title",
    "type": "text",
    "content": "Hello",
    "style": {
      "fontSize": 96,
      "fontWeight": "bold",
      "color": "#fff",
      "display": "flex",
      "justifyContent": "center",
      "alignItems": "center"
    }
  }]
}
```

### Fade-In Element
```json
{
  "id": "fade-item",
  "type": "text",
  "content": "Appears gradually",
  "from": 30,
  "durationInFrames": 60,
  "style": {
    "opacity": {
      "keyframes": [
        { "frame": 0, "value": 0 },
        { "frame": 20, "value": 1 }
      ]
    }
  }
}
```
