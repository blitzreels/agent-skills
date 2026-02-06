# Browse The BlitzReels API (OpenAPI)

The BlitzReels API is public and described by OpenAPI:

- `https://blitzreels.com/api/openapi.json`

## List All Endpoints

```bash
curl -sS https://blitzreels.com/api/openapi.json | jq -r '.paths | keys[]'
```

## List Methods + Paths + Summaries

```bash
curl -sS https://blitzreels.com/api/openapi.json | jq -r '
  .paths
  | to_entries[]
  | .key as $path
  | .value
  | to_entries[]
  | select(.key | test("^(get|post|put|patch|delete)$"))
  | "\(.key|ascii_upcase) \($path) - \(.value.summary // .value.operationId // "")"
'
```

## Find The Right Endpoint

```bash
curl -sS https://blitzreels.com/api/openapi.json \
  | jq -r '.paths | keys[]' \
  | grep -iE 'faceless|caption|export|timeline|overlay|template|webhook|job' || true
```

## Inspect A Specific Operation Schema

```bash
PATH_TO_INSPECT="/projects/{id}/faceless"
curl -sS https://blitzreels.com/api/openapi.json \
  | jq --arg p "$PATH_TO_INSPECT" '.paths[$p]'
```

