import { useCurrentFrame, useVideoConfig } from "remotion";
import { type BeatProps, ChestZone, CrownZone, Footage, PanelSwap, TitleHook, TopPanel } from "../kit/blocks";
import { Caret, Check, Glass, Rise, Sheen, Sticker, useSpringAt, useTyped } from "../kit/primitives";
import { BODY, MONO, tone } from "../kit/theme";

export function HookTitle({ start }: BeatProps) {
  const r = (t: number) => t - start;
  return (
    <CrownZone>
      <TitleHook
        size={92}
        lines={[
          { text: "First line", paper: tone.white, ink: tone.ink, at: 0 },
          { text: "second line", paper: tone.white, ink: tone.ink, at: 0.1 },
          { text: "punchline", paper: tone.accent, ink: tone.white, at: r(2.0) },
        ]}
      />
    </CrownZone>
  );
}

export function FootagePanel(_: BeatProps) {
  return (
    <TopPanel>
      <Footage src="footage/demo.mp4" frames={120} objectPosition="50% 50%" pushTo={1.1} />
      <div style={{ position: "absolute", left: 52, top: 56 }}>
        <Sticker at={0.4} text="Label" paper={tone.white} color={tone.ink} size={66} tilt={-3} />
      </div>
    </TopPanel>
  );
}

const prompt = [
  { text: "First instruction,", from: 1.0, until: 2.0 },
  { text: "second instruction.", from: 2.2, until: 3.4 },
];

export function TerminalPanel({ start }: BeatProps) {
  const r = (t: number) => t - start;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps + start;
  const active = prompt.reduce((index, line, i) => (seconds >= line.from ? i : index), -1);
  return (
    <TopPanel>
      <PanelSwap at={0}>
        <div style={{ position: "absolute", inset: 0, background: "#0E0D0C" }} />
        <div style={{ position: "absolute", left: 40, right: 40, top: 40, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ padding: "20px 26px", border: `3px solid ${tone.accent}`, borderRadius: 18, fontFamily: MONO, fontWeight: 600, fontSize: 42, color: tone.white }}>
            Terminal title
          </div>
          <div style={{ border: `3px solid ${tone.accent}`, borderRadius: 20, padding: "16px 26px", fontFamily: MONO, fontSize: 39, lineHeight: 1.45, minHeight: 58 * 4 }}>
            {prompt.map((line, i) => (i <= active ? <TypedLine key={line.text} {...line} from={r(line.from)} until={r(line.until)} active={i === active} /> : null))}
          </div>
        </div>
      </PanelSwap>
    </TopPanel>
  );
}

function TypedLine({ text, from, until, active }: { text: string; from: number; until: number; active: boolean }) {
  const typed = useTyped({ text, from, until });
  return (
    <div style={{ minHeight: 58, color: active ? tone.white : tone.muted }}>
      {text.slice(0, typed)}
      {active ? <Caret on color={tone.accent} height={42} /> : null}
    </div>
  );
}

export function StatusPill(_: BeatProps) {
  return (
    <CrownZone>
      <Rise at={0.05} distance={-30} style={{}}>
        <Glass style={{ padding: "18px 30px 18px 18px", borderRadius: 999, display: "flex", alignItems: "center", gap: 18 }}>
          <Sheen at={0.6} />
          <Check at={0.5} size={62} color={tone.good} />
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 48, color: tone.white }}>Status text</span>
        </Glass>
      </Rise>
    </CrownZone>
  );
}

export function CallToAction(_: BeatProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrow = useSpringAt({ at: 1.2 });
  const bounce = Math.abs(Math.sin((frame / fps) * Math.PI * 2.2)) * 22;
  return (
    <ChestZone>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <TitleHook
          size={84}
          lines={[
            { text: "First line", paper: tone.white, ink: tone.ink, at: 0.3 },
            { text: "second line", paper: tone.accent, ink: tone.white, at: 0.8 },
          ]}
        />
        <div style={{ scale: String(arrow), translate: `0 ${bounce * arrow}px` }}>
          <svg width={86} height={86} viewBox="0 0 24 24">
            <path d="M12 3v15m0 0l-6.5-6.5M12 18l6.5-6.5" stroke={tone.white} strokeWidth={3.2} fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </ChestZone>
  );
}

