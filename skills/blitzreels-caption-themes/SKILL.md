---
name: blitzreels-caption-themes
description: Design reusable BlitzReels caption themes. Use for branded looks, previews, duplication, or defaults.
---

# BlitzReels Caption Themes

Create a reusable theme only when the user wants a look that should outlive one project.
Use a built-in caption look when it already satisfies the request.

## Workflow

1. List built-in caption looks and custom themes.
2. If the user references an existing look, read its current settings before changing anything.
3. Load the caption-theme and preview schemas from OpenAPI.
   Do not carry forward settings from an old recipe unless the current schema accepts them.
4. Translate the request into a small set of design decisions:
   typography, contrast, active-word treatment, reveal behavior, line limits, and placement.
5. Render a preview from raw settings before creating or updating the reusable theme.
6. Check readability, safe-area placement, and contrast in the returned image.
7. Create, patch, duplicate, or set the default only as requested.
8. Read the theme again and, when relevant, apply it to a test project for a rendered-frame check.

## Design rules

- Optimize for legibility before animation.
- Keep important text away from platform UI and faces.
- Use supported fonts and enumerated values from the current schema.
- Patch only changed settings.
- Preserve the original theme when the user asks for a variation; duplicate first.

## Completion

Return the theme ID, name, whether it is the default, the changed settings, and the latest preview.
The task is complete when the persisted theme matches the previewed settings and any requested default is confirmed.
