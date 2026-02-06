# Faceless Video Example

This example creates a project, starts faceless generation, polls the job, and exports.

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"
export BLITZREELS_API_BASE_URL="https://blitzreels.com/api/v1"

cd skills/blitzreels-faceless

# 1) Create project
PROJECT_JSON=$(bash scripts/blitzreels.sh POST /projects '{"name":"Morning Routine Tips","aspect_ratio":"9:16"}')
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id')

# 2) Generate faceless video
JOB_JSON=$(bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/faceless" '{"topic":"5 morning routine tips","duration_seconds":30,"visual_style":"cinematic"}')
JOB_ID=$(echo "$JOB_JSON" | jq -r '.job_id')

# 3) Poll job status
bash scripts/blitzreels.sh GET "/jobs/${JOB_ID}"

# 4) Export
EXPORT_JSON=$(bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/export" '{"resolution":"1080p"}')
EXPORT_ID=$(echo "$EXPORT_JSON" | jq -r '.export_id')

# 5) Get download URL
bash scripts/blitzreels.sh GET "/exports/${EXPORT_ID}"
```

