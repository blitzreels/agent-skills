# Expected With-Skill Behavior

The agent should use documented public routes, not guessed paths. It should copy project caption style through `GET /projects/{previousProjectId}/captions/style` and `PATCH /projects/{targetProjectId}/captions/style`, then use registered timeline item update routes for overlay placement.

It should explicitly say that custom caption themes, project rename, and background audio replication are not currently available through the public API unless routes have been added.
