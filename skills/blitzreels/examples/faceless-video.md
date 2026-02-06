# Faceless Video Example

This example creates a project, generates a faceless video, polls the job, and exports.

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"

# 1) Create project
PROJECT=$(curl -sS -X POST https://blitzreels.com/api/v1/projects \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Morning Routine Tips","aspect_ratio":"9:16"}')

PROJECT_ID=$(echo "$PROJECT" | jq -r '.id')

# 2) Generate faceless video
JOB=$(curl -sS -X POST "https://blitzreels.com/api/v1/projects/${PROJECT_ID}/faceless" \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"topic":"5 morning routine tips","duration_seconds":30,"visual_style":"cinematic"}')

JOB_ID=$(echo "$JOB" | jq -r '.job_id')

# 3) Poll job status
curl -sS "https://blitzreels.com/api/v1/jobs/${JOB_ID}" \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"

# 4) Export
EXPORT=$(curl -sS -X POST "https://blitzreels.com/api/v1/projects/${PROJECT_ID}/export" \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"resolution":"1080p"}')

EXPORT_ID=$(echo "$EXPORT" | jq -r '.export_id')

# 5) Get download URL
curl -sS "https://blitzreels.com/api/v1/exports/${EXPORT_ID}" \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```
