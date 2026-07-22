---
name: blitzreels-generation
description: Generate AI media with BlitzReels. Use for faceless videos, images, clips, voiceovers, music, SFX, or authored briefs.
---

# BlitzReels Generation

Route generation requests through the current public contract.
Full faceless video generation is public; standalone AI Studio media may still require the dashboard.

## Workflow

1. Load `https://www.blitzreels.com/api/capabilities.json` and identify the requested generation branch.
   This step is complete when the public operation or exact dashboard fallback is known.
2. Inspect only the matching OpenAPI operations and read their current models, limits, and cost guidance.
   This step is complete when every planned request field is accepted by the current schema.
3. For a full faceless video, read [`references/faceless-workflow.md`](references/faceless-workflow.md) and
   [`references/faceless-prompting.md`](references/faceless-prompting.md) before creating the plan.
   This step is complete when the accepted script and every public operation needed for the run are known.
4. For a topic, draft the complete narration first; for supplied narration, retain the user's wording.
   This step is complete when the narration and visual cues are ready for immutable planning.
5. Create the project with a caller-generated idempotency key, then create its faceless production plan.
   This step is complete when the project id, revision id, immutable narration, scene prompts, and cost estimate exist.
6. Present the plan, factual-review notes, and cost before paid generation.
   After approval, generate character anchors and keyframes, then poll the returned job to a terminal state.
7. Inspect every generated asset against its atomic shot contract.
   Revise prompts or regenerate targeted assets until every keyframe is approved or its exact mismatch is reported.
8. After approval for animation cost, animate the approved assets and poll the job to a terminal state.
   Inspect the project timeline, narration joins, generated clip endings, warnings, and media processing state.
9. After approval for export cost, export and verify the downloadable output.
   Completion requires preview evidence for every scene plus the final export status.

## Branches

- Full video from a topic, script, or production brief: use the faceless plan and asset-approval workflow.
- Standalone media: use a public operation when discovery exposes it.
  Otherwise return `/dashboard/ai-studio` and name the missing public capability.
- Carousel: use `blitzreels-carousels`.
- Long-form source repurposing: use `blitzreels-clipping`.

## Generation rules

- Preserve explicit prompts and authored narration; improve derived visual prompts only when requested.
- Read model ids, durations, aspect ratios, voices, and styles from the current schema.
- Use the actual narration duration as timing truth when the brief marks duration as provisional.
- Treat generated assets as pending until both job and media processing states are terminal.
- On an ambiguous timeout, inspect the project and jobs before retrying.

## Completion

Return the public operations used, project and job ids, revision id, warnings, cost approvals, preview evidence, and
export status.
An unsupported instruction is complete only when its exact public capability gap is stated.
