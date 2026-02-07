# Example: Generate a Faceless Video

## Using `faceless.sh` (Recommended)

### From a topic
```bash
# Dry run to preview the plan
bash scripts/faceless.sh \
  --topic "5 morning routine tips for productivity" \
  --duration 30 \
  --voice rachel \
  --style cinematic \
  --dry-run

# Execute after user approval
bash scripts/faceless.sh \
  --topic "5 morning routine tips for productivity" \
  --duration 30 \
  --voice rachel \
  --style cinematic
```

### From a user-provided script
```bash
bash scripts/faceless.sh \
  --script "The first productivity tip is to wake up at the same time every day. Consistency trains your body clock.\n\nSecond, avoid checking your phone for the first 30 minutes. This protects your focus.\n\nThird, move your body. Even 10 minutes of stretching boosts energy for hours." \
  --duration 45 \
  --voice liam \
  --style realism
```

## Using `blitzreels.sh` (Manual Steps)

For more control over individual steps:

```bash
# 1) Create project
PROJECT_JSON=$(bash scripts/blitzreels.sh POST /projects \
  '{"name":"Morning Routine Tips","aspect_ratio":"9:16"}')
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id')

# 2) Start faceless generation (requires BLITZREELS_ALLOW_EXPENSIVE=1)
export BLITZREELS_ALLOW_EXPENSIVE=1
JOB_JSON=$(bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/faceless" \
  '{"topic":"5 morning routine tips","duration_seconds":30,"visual_style":"cinematic","voice_id":"21m00Tcm4TlvDq8ikWAM"}')
JOB_ID=$(echo "$JOB_JSON" | jq -r '.job_id')

# 3) Poll until complete
bash scripts/blitzreels.sh GET "/jobs/${JOB_ID}"

# 4) Inspect the generated timeline
bash scripts/blitzreels.sh GET "/projects/${PROJECT_ID}/context?mode=timeline"

# 5) Export
EXPORT_JSON=$(bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/export" \
  '{"resolution":"1080p"}')
EXPORT_ID=$(echo "$EXPORT_JSON" | jq -r '.export_id')

# 6) Get download URL
bash scripts/blitzreels.sh GET "/exports/${EXPORT_ID}"
```
