# Story: brief, assets, beats

A film that looks stunning but says nothing fails rule A. These three files come first, and the user approves them before any visual work. They live in the studio root and every agent reads them.

Without them the model fills each missing decision with its safest default: centered text on a gradient, everything fading in, a logo at the end. The job of this phase is to remove the missing decisions.

## How to fill them

1. **Read the product.** Repo README, docs, site, app store page, changelog, real screenshots, the user's own words. Collect facts with their source.
2. **Interview the user, briefly.** Only what you can't find: the audience, the one takeaway, what would make them hate the film, which numbers they're happy to show, the CTA. One round of questions, with your recommended answer for each.
3. **Write the three files**, then show them to the user as one message and wait for approval (gate 1).

## brief.md

```markdown
# Brief: <Product>

**Logline:** <Product> <does what> so <who> <gets what>.
**Takeaway:** the one sentence a viewer must remember. (≤ 8 words; it becomes the biggest type in the film)
**Audience:** who watches this, where (X feed muted, launch page, Product Hunt), what they already know.
**Length / grid:** 15 s · 128 BPM · 8 bars (or 10–30 s; bars × 4 × 60 / BPM)
**Formats:** 16:9 hero + 9:16 recomposed
**Look:** void | paper | glass · accent #xxxxxx (brand colour) · font
**Sound:** synthesised in <key> | supplied track assets/<file> (analysed: <bpm>, <key>)

## Product facts (true, sourced)
- <fact> — source: <url/file/user>
- <number> — source: <...>  (numbers shown on screen must be here)

## Must use (real)
- logo, app icon, the 1–3 screens the film is built around

## Unacceptable
- e.g. invented metrics, a fake UI, a competitor's name, stock music, "revolutionize"-style copy

## References (optional)
- <file/link> — take: <pacing, type, transitions>; don't take: <subject, palette>
```

## assets.md

One line per asset the film uses. Status is `have`, `need` or `rebuild`.

```markdown
| Asset | Used in beat | Source | Status | Notes |
| --- | --- | --- | --- | --- |
| App icon 1024 | 1, 9 | /Applications/X.app icns → png | have | |
| Menu bar panel | 2–3 | screenshot assets/tray.png | rebuild | rebuild as code, diff ≤ 2 px |
| "251 GB removed" | 6 | user's removal log, 2026-10-06 | have | real number |
| Third-party app icons | 1 | /Applications/*.app | have | real icons, not emoji |
```

- A `need` blocks the run. Ask the user or fetch it from the real source. Never draw a convincing fake.
- Screens are `rebuild`: the screenshot is the reference; the film draws the screen as code so it is crisp at any zoom and can build on. Verify the rebuild by overlaying it on the screenshot.
- Strip private data from anything real (names, emails, file paths with usernames).

## beats.md

The beat sheet is a contract. Each row is on the grid, and each row says what the viewer knows after it.

```markdown
| # | Beats | Viewer knows after | Enters from | Exits into (carried object) | On screen (≤ 5 words) | Real asset | Sound | Why it exists |
| - | ----- | ------------------ | ----------- | --------------------------- | --------------------- | ---------- | ----- | ------------- |
| 1 | 0–3.5 | "my Mac is overloaded" | frame 0 in motion: app icons crashing onto a status pill | pill flies up into the menu bar | Your Mac is choking. | real app icons, status pill | thuds climbing down the chord, alarm | the problem, felt in 1.6 s |
| 2 | 3.5–8 | "there's a menu bar app that shows it" | pill lands in the menu bar | panel's threads card becomes the next shot | BlitzClean. In your menu bar. | rebuilt tray panel | latch, click, drop-down | the product, in context |
```

Rules for the sheet:

- **Viewer knows after** is a state of knowledge, not a description of pixels. "Card slides in" is not a state; "they know it ranks AI agents by RAM" is.
- **Exits into** names the object that carries the eye across the cut and how (it becomes, it opens into, it shrinks into). Every row has one; the lockup's is the end frame.
- **Why it exists:** if the honest answer is "it looks cool", merge or cut the beat. Looking cool is the job of every beat, not the reason for one.
- The default arc for 15 s (8 bars at 128 BPM):

| Bars | Act | Job |
| --- | --- | --- |
| 1 | Hook | the problem, felt; moving from frame 0 |
| 2 | Product | it lives here, it looks like this |
| 3–4 | Proof | the product doing the job on real data; build to the drop |
| 5 (drop at 50 %) | Payoff | the outcome, with visible causality |
| 6 | Light act | why trust it / what makes it different |
| 7 | Action | how to get it (repo, download, site) |
| 8 | Lockup | logo, wordmark, line, CTA |

- Write the sheet in beats, not seconds, and give each beat a cue id that also goes in `grid.json`.

## Taste notes

- Lead with the feeling the viewer already has, in their words ("Your Mac is choking."), not a product name.
- Show the product doing one thing end to end before listing more.
- One proof number beats three. Real beats round.
- The trust beat names the honest constraint ("You approve every removal", "Personal files go to Trash") rather than a superlative.
- Avoid launch-video clichés in copy: "Introducing", "Revolutionize", "Supercharge", "Meet X", "The future of". Plain verbs.
