# Discover Editing Endpoints

The editing/motion-graphics parts of the BlitzReels API are best explored via OpenAPI.

```bash
curl -sS https://www.blitzreels.com/api/openapi.json | jq -r '.paths | keys[]'
```

Filter likely editing endpoints:

```bash
curl -sS https://www.blitzreels.com/api/openapi.json \
  | jq -r '.paths | keys[]' \
  | grep -Ei '(timeline|overlay|keyframe|template|background|caption|style)' || true
```

Once you’ve found the endpoint you need, inspect its schema:

```bash
PATH_TO_INSPECT="/projects/{id}/timeline"
curl -sS https://www.blitzreels.com/api/openapi.json \
  | jq --arg p "$PATH_TO_INSPECT" '.paths[$p]'
```
