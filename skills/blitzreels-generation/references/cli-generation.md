# CLI generation

Use live CLI discovery for model limits and credit rates.

1. Run the matching pricing read before a paid generation:

   ```bash
   blitzreels credits pricing --kind video --json
   ```

   When `agent-context` does not advertise `credits pricing`, use the matching generation options read:

   ```bash
   blitzreels generate videos --options --json
   ```

   This step is complete when the selected model id, accepted limits, and exact credit unit are verified from the
   response.

2. Preserve authored line breaks in one quoted `--prompt` value:

   ```bash
   blitzreels generate videos \
     --prompt $'Opening shot: rain crosses the window.\nCamera: slow push toward the subject.' \
     --model MODEL_ID --json
   ```

   An `unsafe_input` response for line breaks identifies an older CLI release. Upgrade the CLI, then resubmit the
   same multiline prompt.

   This step is complete when the request preserves the original prompt and its line breaks.

3. When the prompt has spoken dialogue, read [`standalone-video.md`](standalone-video.md) before choosing `--duration`
   or `--end-frame`.

   This step is complete when duration matches spoken seconds and the CTA path is chosen from that file.
