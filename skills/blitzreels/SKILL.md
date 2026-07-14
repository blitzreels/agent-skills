---
name: blitzreels
description: Integrate or debug the BlitzReels REST API. Use for auth, discovery, request failures, or API code.
---

# BlitzReels API

Use live contracts for fields and routes.
Keep this skill focused on choosing and verifying the workflow.

## Workflow

1. Choose the surface.
   - Use `blitzreels-editing` to inspect or edit an existing project through CLI or REST.
   - Use REST for application integrations or when the user requests API calls.
   - Use a specialized skill when the outcome is clipping, generation, caption themes, or carousels.
2. Discover the operation.
   - Start with `https://www.blitzreels.com/api/capabilities.json`.
   - Load only the needed operation from `https://www.blitzreels.com/api/openapi.json`.
   - Use `https://www.blitzreels.com/api/docs.md` when narrative context is needed.
3. Inspect the request and response schemas before writing code.
   Never infer fields from a similar endpoint.
4. Authenticate with `Authorization: Bearer $BLITZREELS_API_KEY` against
   `https://www.blitzreels.com/api/v1`.
5. For retryable creates, send an `Idempotency-Key` and retain the mutation receipt.
6. Execute the narrowest operation, then read the affected resource.
7. Report stable IDs, the mutation receipt, warnings, and the request ID on failure.

## Failure branch

- A local validation error means fix the request before retrying.
- A conflict means read current state before choosing a new mutation.
- A rate limit or transient provider error may be retried with backoff.
- An unknown route or field means refresh OpenAPI; old examples are not evidence of the current contract.

## Key handling

- Keep API keys in the runtime environment.
- Redact keys from logs, reports, fixtures, and handoff files.
- Recommend rotation when a key appears in shared output.

## Completion

The task is complete when the intended resource state is confirmed by a read, or when the failure is reported with
its request ID, error code, retryability, and next factual recovery step.
