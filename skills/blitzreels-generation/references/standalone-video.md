# Standalone spoken video

Use this branch for a paced I2V ad or other spoken clip that is not a faceless plan.

1. Read `blitzreels generate videos --options --json` (or `credits pricing --kind video --json`).
   Pick a Seedance I2V row with `supports_native_audio: true` and `parameters.source_asset_id.supported: true`.
   Read first-frame requirement from `parameters.source_asset_id.required` (optional on Seedance 2.5 reference mode).
   Ref2v is a character-sheet mode; it does not lock the opening frame.
   This step is complete when the chosen model id, `durations_seconds`, `supports_end_frame`, `parameters.source_asset_id`, `credits_per_second`, and `input_notes` are from that catalog row.
2. Time the spoken lines (~2s each). Set `--duration` to a member of that model's `durations_seconds` covering spoken seconds plus at most 1.5s for a closing card.
   This step is complete when `--duration` is in `durations_seconds` and every line fits inside it.
3. Generate or pick a **full-frame** still that matches `--aspect-ratio`. That still is the first frame of the film.
   This step is complete when `--source-image` is a full-frame plate at the output aspect, not a storyboard grid or panel crop.
4. Put a late CTA in the prompt as a smash-cut in the last second. `--end-frame` interpolates from the first frame to that still across the **full** duration on every Seedance I2V that publishes `supports_end_frame`.
   This step is complete when the CTA lives in the prompt (or is omitted) and `--end-frame` is unset for a late card.
5. Honor `input_notes` on that model only (face pre-filter, 4s probe, provider routing). I2V uses `--source-image` only; extra `--reference-asset-id` is a different input mode.
   This step is complete when every note on the chosen row is either followed or reported as a blocker.
6. Generate one clip with `blitzreels generate videos`. After it is ready, accept with `silencedetect`: fail the take if silence before the card exceeds 0.6s.
   This step is complete when speech is back-to-back through the card and the file is a single generation job output.
7. Estimate with `blitzreels media upscale --asset-id ID --target-resolution 1080p|4k --dry-run`. `eligible: false` means skip. Then the same command without `--dry-run` (waits unless `--no-wait`).
   This step is complete when the upscaled asset `processingStatus` is `completed` and the local file (if requested) comes from that asset.
