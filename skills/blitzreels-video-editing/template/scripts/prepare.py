# /// script
# requires-python = ">=3.10"
# dependencies = ["faster-whisper>=1.1", "numpy"]
# ///
import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
WIDTH, HEIGHT = 1080, 1920
PAD_IN, PAD_OUT, MAX_GAP = 0.08, 0.15, 0.4
NGRAM, REACH = 3, 18
CAPTION_LEAD = 0.05


def probe(path):
    out = json.loads(
        subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
             "stream=width,height,r_frame_rate:stream_side_data=rotation:format=duration", "-of", "json", str(path)],
            capture_output=True, text=True, check=True,
        ).stdout
    )
    stream = out["streams"][0]
    width, height = stream["width"], stream["height"]
    rotation = next((abs(int(d.get("rotation", 0))) for d in stream.get("side_data_list", [])), 0)
    if rotation in (90, 270):
        width, height = height, width
    num, den = stream["r_frame_rate"].split("/")
    return width, height, round(float(num) / float(den)), float(out["format"]["duration"])


def transcribe(path, model, language, vocab):
    import numpy as np
    from faster_whisper import WhisperModel

    pcm = np.frombuffer(
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
            capture_output=True, check=True,
        ).stdout,
        dtype=np.float32,
    )
    segments, info = WhisperModel(model, device="auto", compute_type="int8").transcribe(
        pcm,
        language=language,
        word_timestamps=True,
        condition_on_previous_text=False,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 300},
        initial_prompt=vocab,
    )
    raw = [{"text": w.word, "start": w.start, "end": w.end} for segment in segments for w in segment.words]
    return tighten(join_tokens(raw), pcm), info.language


def join_tokens(raw):
    words = []
    for w in raw:
        text = w["text"].replace("«", "").replace("»", "").strip()
        if not text:
            continue
        glued = text[0] in "-'’" or (words and words[-1]["text"][-1] in "'’") or not re.search(r"\w", text)
        if words and glued:
            words[-1]["text"] += text
            words[-1]["end"] = w["end"]
        else:
            words.append({"text": text, "start": w["start"], "end": w["end"]})
    return words


def tighten(words, pcm):
    import numpy as np

    hop = 160
    frames = len(pcm) // hop
    db = 20 * np.log10(np.sqrt((pcm[: frames * hop].reshape(frames, hop) ** 2).mean(1)) + 1e-9)
    voiced = db > np.percentile(db, 20) + 12
    for w in words:
        a, b = int(w["start"] * 100), int(w["end"] * 100)
        if b - a > 60:
            hits = np.where(voiced[a:b])[0]
            if len(hits):
                w["start"], w["end"] = (a + hits[0]) / 100 - 0.02, (a + hits[-1] + 1) / 100
        w["start"], w["end"] = round(w["start"], 3), round(w["end"], 3)
    return words


def norm(text):
    return re.sub(r"[^\w']", "", text.lower())


def clause_start(words, i):
    return i == 0 or re.search(r"[.,?!…:;]$", words[i - 1]["text"]) or words[i]["start"] - words[i - 1]["end"] > 0.3


def drop_retakes(words):
    keep = [True] * len(words)
    for i in range(len(words) - NGRAM):
        if not keep[i] or not clause_start(words, i):
            continue
        head = [norm(w["text"]) for w in words[i : i + NGRAM]]
        for j in range(i + NGRAM, min(len(words) - NGRAM + 1, i + REACH)):
            if clause_start(words, j) and [norm(w["text"]) for w in words[j : j + NGRAM]] == head:
                for k in range(i, j):
                    keep[k] = False
                break
    dropped, run = [], []
    for word, kept in zip(words, keep):
        if kept and run:
            dropped.append(" ".join(run))
            run = []
        elif not kept:
            run.append(word["text"])
    if run:
        dropped.append(" ".join(run))
    return [w for w, k in zip(words, keep) if k], dropped


def keep_ranges(words, duration):
    ranges = []
    for w in words:
        a, b = max(0.0, w["start"] - PAD_IN), min(duration, w["end"] + PAD_OUT)
        if ranges and a - ranges[-1][1] < MAX_GAP:
            ranges[-1][1] = max(ranges[-1][1], b)
        else:
            ranges.append([a, b])
    return ranges


def crop_box(width, height, frame_x):
    if width / height > 9 / 16:
        cw = int(height * 9 / 16) // 2 * 2
        return cw, height, int((width - cw) * frame_x), 0
    ch = int(width * 16 / 9) // 2 * 2
    return width, ch, 0, (height - ch) // 2


def render(source, ranges, size, fps, frame_x, out):
    cw, ch, x, y = crop_box(*size, frame_x)
    parts, labels = [], []
    for i, (a, b) in enumerate(ranges):
        fade = max(0.0, b - a - 0.012)
        parts.append(f"[0:v]trim=start={a:.3f}:end={b:.3f},setpts=PTS-STARTPTS[v{i}]")
        parts.append(
            f"[0:a]atrim=start={a:.3f}:end={b:.3f},asetpts=PTS-STARTPTS,"
            f"afade=t=in:d=0.012,afade=t=out:st={fade:.3f}:d=0.012[a{i}]"
        )
        labels.append(f"[v{i}][a{i}]")
    parts.append(f"{''.join(labels)}concat=n={len(ranges)}:v=1:a=1[cv][ca]")
    parts.append(f"[cv]crop={cw}:{ch}:{x}:{y},scale={WIDTH}:{HEIGHT},fps={fps},format=yuv420p[vout]")
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as graph:
        graph.write(";\n".join(parts))
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(source), "-/filter_complex", graph.name, "-map", "[vout]", "-map", "[ca]",
         "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", str(out)],
        check=True,
    )


def retime(words, ranges):
    offsets, acc = [], 0.0
    for a, b in ranges:
        offsets.append(acc)
        acc += b - a
    timed = []
    for w in words:
        for (a, b), offset in zip(ranges, offsets):
            if a <= w["start"] < b:
                start = max(0.0, offset + w["start"] - a - CAPTION_LEAD)
                end = max(start + 0.06, offset + min(w["end"], b) - a - CAPTION_LEAD)
                timed.append({"text": w["text"], "start": round(start, 2), "end": round(end, 2)})
                break
    return timed, [round(o, 3) for o in offsets[1:]], acc


def write_transcript(words, dropped, path):
    lines, current, start = [], [], None
    for word in words:
        start = word["start"] if start is None else start
        current.append(word["text"])
        if re.search(r"[.?!]$", word["text"]) or len(current) >= 16:
            lines.append(f"[{start:7.2f}] {' '.join(current)}")
            current, start = [], None
    if current:
        lines.append(f"[{start:7.2f}] {' '.join(current)}")
    removed = "\n".join(f"- {d}" for d in dropped) or "- none"
    path.write_text(f"# Edited transcript\n\n{chr(10).join(lines)}\n\n## Removed as retakes\n\n{removed}\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--model", default="small")
    parser.add_argument("--language", default=None)
    parser.add_argument("--frame-x", type=float, default=0.5)
    parser.add_argument("--keep-takes", action="store_true")
    parser.add_argument("--vocab", default=None)
    args = parser.parse_args()

    source = Path(args.video).expanduser().resolve()
    width, height, fps, duration = probe(source)
    PUBLIC.mkdir(exist_ok=True)
    words, language = transcribe(source, args.model, args.language, args.vocab)
    kept, dropped = (words, []) if args.keep_takes else drop_retakes(words)
    ranges = keep_ranges(kept, duration)
    render(source, ranges, (width, height), fps, args.frame_x, PUBLIC / "talk.mp4")
    timed, cuts, total = retime(kept, ranges)

    timeline = {"fps": fps, "width": WIDTH, "height": HEIGHT, "durationSeconds": round(total, 2), "cuts": cuts, "words": timed}
    (ROOT / "src/edit/timeline.json").write_text(json.dumps(timeline, ensure_ascii=False))
    (PUBLIC / "words-raw.json").write_text(json.dumps(words, ensure_ascii=False))
    write_transcript(timed, dropped, PUBLIC / "transcript.md")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(PUBLIC / "talk.mp4"), "-vf",
         f"fps=1/2,scale=216:384,tile=10x{max(1, -(-int(total // 2 + 1) // 10))}:padding=4", "-frames:v", "1",
         str(PUBLIC / "contact-sheet.jpg")],
        check=True,
    )
    print(f"language {language}, {len(words)} words heard, {len(dropped)} retakes removed")
    print(f"{duration:.1f}s raw -> {total:.1f}s edit in {len(ranges)} pieces at {fps} fps, crop x {args.frame_x}")
    print("wrote public/talk.mp4, src/edit/timeline.json, public/transcript.md, public/contact-sheet.jpg")


if __name__ == "__main__":
    main()
