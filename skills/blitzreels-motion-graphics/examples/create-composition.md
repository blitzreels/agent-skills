# Example: Create a Motion Graphics Composition

End-to-end: create a project, build a composition with animated text + shapes, update an element, and export.

## Step 1: Create a Project

```bash
PROJECT_JSON=$(bash scripts/blitzreels.sh POST /projects \
  '{"name":"Product Launch Intro","aspect_ratio":"16:9"}')
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id')
echo "Project: $PROJECT_ID"
```

## Step 2: Build the Composition Spec

Save as `spec.json`:

```json
{
  "name": "Product Launch",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "durationInFrames": 180,
  "background": "#0f0f23",
  "mode": "elements",
  "fonts": ["Inter"],
  "defaults": {
    "fontFamily": "Inter",
    "color": "#ffffff"
  },
  "elements": [
    {
      "id": "bg-gradient",
      "type": "shape",
      "shape": "rectangle",
      "from": 0,
      "durationInFrames": 180,
      "style": {
        "width": 1920,
        "height": 1080,
        "x": 0,
        "y": 0,
        "background": "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)"
      }
    },
    {
      "id": "title",
      "type": "text",
      "content": "Introducing BlitzReels",
      "from": 15,
      "durationInFrames": 150,
      "style": {
        "fontSize": 72,
        "fontWeight": "bold",
        "display": "flex",
        "justifyContent": "center",
        "alignItems": "center",
        "y": {
          "timing": {
            "type": "spring",
            "from": 50,
            "to": 0,
            "config": "snappy"
          }
        },
        "opacity": {
          "keyframes": [
            { "frame": 0, "value": 0 },
            { "frame": 20, "value": 1 }
          ]
        }
      }
    },
    {
      "id": "subtitle",
      "type": "text",
      "content": "AI-Powered Video Creation",
      "from": 45,
      "durationInFrames": 120,
      "style": {
        "fontSize": 32,
        "color": "#a0a0cc",
        "display": "flex",
        "justifyContent": "center",
        "alignItems": "center",
        "marginTop": 80,
        "opacity": {
          "keyframes": [
            { "frame": 0, "value": 0 },
            { "frame": 25, "value": 1 }
          ]
        }
      }
    },
    {
      "id": "accent-line",
      "type": "shape",
      "shape": "rectangle",
      "from": 35,
      "durationInFrames": 130,
      "style": {
        "width": {
          "keyframes": [
            { "frame": 0, "value": 0 },
            { "frame": 30, "value": 200, "easing": "easeOutCubic" }
          ]
        },
        "height": 3,
        "backgroundColor": "#6c63ff",
        "x": 860,
        "y": 570,
        "opacity": {
          "keyframes": [
            { "frame": 0, "value": 0 },
            { "frame": 10, "value": 1 }
          ]
        }
      }
    }
  ]
}
```

## Step 3: Create the Composition

```bash
bash scripts/playground.sh create "$PROJECT_ID" spec.json
# Or pipe from stdin:
cat spec.json | bash scripts/playground.sh create "$PROJECT_ID" -
```

Returns the composition with an ID:
```bash
COMP_ID=$(bash scripts/playground.sh create "$PROJECT_ID" spec.json | jq -r '.id')
```

## Step 4: Update an Element

Change the subtitle text:

```bash
bash scripts/blitzreels.sh PATCH \
  "/projects/${PROJECT_ID}/playground/compositions/${COMP_ID}/elements/subtitle" \
  '{"content":"Create Videos 10x Faster"}'
```

## Step 5: Export

```bash
bash scripts/playground.sh export "$PROJECT_ID" --resolution 1080p
```

Poll export status:
```bash
EXPORT_ID="..."  # from export response
bash scripts/blitzreels.sh GET "/exports/${EXPORT_ID}"
```
