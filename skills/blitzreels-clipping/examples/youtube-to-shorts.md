# Example: YouTube Video to Short Clip

Use this pattern when the user gives you a YouTube URL and wants one or more short vertical clips.

## Goal

- ingest the YouTube source
- confirm transcript readiness
- confirm short suggestions exist
- apply a chosen suggestion with smart crop or ROI-aware reframing
- add clip-window-aware captions
- export the short

## Example Flow

1. Import the YouTube video into workspace media.
2. Poll the asset until transcript and short suggestions are both ready.
3. Pick the strongest short suggestion based on hook quality and timing.
4. Apply the suggestion through the best available path:
   - prefer a derived vertical smart-crop asset
   - otherwise use ROI-aware reframing or camera-plan motion
   - avoid static center crop unless there is no better option
5. Insert captions only for the selected clip window.
6. Export and verify:
   - `9:16` aspect ratio
   - duration matches the chosen suggestion window
   - no overlapping captions
   - framing follows the subject instead of the center by default

## Example Output Checklist

- source asset ID
- project ID
- chosen suggestion ID and time window
- reframing path used
- caption style used
- confirmation that captions were clip-window-aware
- export ID and download URL
- any ingest or timing inconsistency
