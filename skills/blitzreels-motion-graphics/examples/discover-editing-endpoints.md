# Discover Editing Endpoints

The editing/motion-graphics parts of the BlitzReels API are best explored via OpenAPI.

```bash
curl -sS https://blitzreels.com/api/openapi.json | jq -r '.paths | keys[]'
```

Filter likely editing endpoints:

```bash
curl -sS https://blitzreels.com/api/openapi.json \\\n+  | jq -r '.paths | keys[]' \\\n+  | grep -Ei '(timeline|overlay|keyframe|template|background|caption|style)' || true
```

Once you’ve found the endpoint you need, inspect its schema:

```bash
PATH_TO_INSPECT="/projects/{id}/timeline"
curl -sS https://blitzreels.com/api/openapi.json \\\n+  | jq --arg p \"$PATH_TO_INSPECT\" '.paths[$p]' 
```

