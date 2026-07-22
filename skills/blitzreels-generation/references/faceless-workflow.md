# Faceless Workflow

The public faceless workflow is revision based.
Discovery, CLI, SDK, and REST expose the same plan, preproduction, animation, and export gates.

## Operation map

| Intent | CLI | REST |
| --- | --- | --- |
| Create project | `blitzreels projects create` | `POST /projects` |
| Create immutable plan | `blitzreels faceless plans create` | `POST /projects/{projectId}/faceless/plans` |
| Read revision | `blitzreels faceless plans get` | `GET /projects/{projectId}/faceless/plans/{revisionId}` |
| Revise prompts/models | `blitzreels faceless plans revise` | `POST /projects/{projectId}/faceless/plans/{revisionId}/revise` |
| Generate anchors/keyframes | `blitzreels faceless plans approve` | `POST /projects/{projectId}/faceless/plans/{revisionId}/approve` |
| List review choices | `blitzreels faceless assets list` | Read the revision's `review_options` |
| Regenerate one asset | `blitzreels faceless assets regenerate` | `POST /projects/{projectId}/faceless/plans/{revisionId}/regenerate-assets` |
| Animate approved assets | `blitzreels faceless assets approve` | `POST /projects/{projectId}/faceless/plans/{revisionId}/approve-assets` |
| Poll work | `blitzreels jobs get` | `GET /jobs/{jobId}` |
| Inspect timeline | `blitzreels project timeline` | `GET /projects/{projectId}/context?mode=timeline` |
| Render snapshots | `blitzreels project snapshots` | `POST /projects/{projectId}/preview-frames` |
| Export | `blitzreels exports start` | `POST /projects/{projectId}/export` |
| Wait and download | `blitzreels exports wait`, then `exports download` | `GET /exports/{exportId}` |

## State gates

1. Create returns a `draft` revision with immutable narration, prompts, model ids, factual-review notes, and cost.
2. Plan approval returns a preproduction job id; poll it until the revision reaches `awaiting_asset_approval`.
3. Inspect every keyframe and character anchor before targeted revision or regeneration.
4. Asset approval returns the animation job id; poll it until the revision reaches `complete` or `failed`.
5. Inspect timeline and snapshots before starting export.

Use a new idempotency key for each logical mutation and reuse it only for an identical retry.
Treat revision ids, asset ids, and job ids from the latest receipt as authoritative.

## Topic input

The plan accepts complete authored narration.
For a topic request, write the narration and visual cues first, present them for confirmation when the user's wording or
factual claims require review, then create the immutable plan.
