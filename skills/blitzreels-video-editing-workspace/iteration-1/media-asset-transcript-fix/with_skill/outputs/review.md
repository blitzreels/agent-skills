# Expected With-Skill Behavior

The agent should use `/workspace/media/assets/{assetId}` for direct asset lookup. If it needs to list assets, it should page with `limit <= 100`.

For `"Cloud Code" -> "Claude Code"`, it should not submit a multi-word replacement. It should either replace `Cloud -> Claude` only after checking the transcript for false positives, or use precise word IDs if `GET /projects/{id}/captions/words` is healthy.
