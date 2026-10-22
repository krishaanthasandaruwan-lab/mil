"""Builds public/audio/ from audio_raw/ using tools/audio_specs.py (run with `npm run audio`).

Per sound variant: trim, pitch, fade and layer the clips, peak-normalize to -1 dBFS, encode a small mono MP3.
Music: cut the loop region, blend the tail into the head for a seamless loop, loudness-normalize, stereo MP3.
Writes public/audio/manifest.json for the game and docs/AUDIO_CREDITS.md.
"""

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from audio_specs import CREDITS, MUSIC, SFX  # noqa: E402

RAW = ROOT / "audio_raw"
OUT = ROOT / "public" / "audio"
RATE = 44100
PEAK_DB = -1.0


def run(args):
    res = subprocess.run(args, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"{' '.join(map(str, args))}\n{res.stderr[-1500:]}")
    return res.stderr


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return float(out.stdout.strip())


def clip_chain(index, c, channels):
    src = RAW / c["file"]
    if not src.exists():
        raise FileNotFoundError(src)
    end = c["end"] if c["end"] is not None else duration(src)
    length = (end - c["start"]) / c["rate"]
    f = [f"[{index}:a]aformat=sample_rates={RATE}:channel_layouts={channels}", f"atrim={c['start']}:{end}", "asetpts=PTS-STARTPTS"]
    if c["rate"] != 1.0:
        f += [f"asetrate={RATE * c['rate']:.0f}", f"aresample={RATE}"]
    if c["fade_in"]:
        f.append(f"afade=t=in:d={c['fade_in']}")
    if c["fade_out"]:
        f.append(f"afade=t=out:st={max(0.0, length - c['fade_out']):.3f}:d={c['fade_out']}")
    if c["gain_db"]:
        f.append(f"volume={c['gain_db']}dB")
    if c["delay"]:
        f.append(f"adelay={int(c['delay'] * 1000)}:all=1")
    return ",".join(f) + f"[l{index}]"


def render_variant(variant, wav):
    clips = variant["layers"] if "layers" in variant else [variant]
    args = ["ffmpeg", "-v", "error", "-y"]
    for c in clips:
        args += ["-i", str(RAW / c["file"])]
    chains = [clip_chain(i, c, "mono") for i, c in enumerate(clips)]
    labels = "".join(f"[l{i}]" for i in range(len(clips)))
    graph = ";".join(chains) + f";{labels}amix=inputs={len(clips)}:normalize=0:duration=longest,areverse,afade=t=in:d=0.015,areverse[out]"
    run(args + ["-filter_complex", graph, "-map", "[out]", str(wav)])


def peak_db(path):
    log = run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"])
    m = re.search(r"max_volume: (-?[\d.]+) dB", log)
    return float(m.group(1)) if m else 0.0


def encode_sfx(wav, mp3):
    gain = PEAK_DB - peak_db(wav)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-af", f"volume={gain:.2f}dB", "-ac", "1", "-ar", str(RATE), "-codec:a", "libmp3lame", "-b:a", "128k", str(mp3)])


def render_loop(spec, mp3):
    src = RAW / spec["file"]
    if not src.exists():
        raise FileNotFoundError(src)
    start, end, x = spec["start"], spec["end"], spec["xfade"]
    length = end - start
    graph = (
        f"[0:a]aformat=sample_rates={RATE}:channel_layouts=stereo,atrim={start}:{end},asetpts=PTS-STARTPTS,asplit[a][b];"
        f"[a]atrim={x}:{length},asetpts=PTS-STARTPTS,afade=t=out:st={length - 2 * x:.3f}:d={x}[body];"
        f"[b]atrim=0:{x},asetpts=PTS-STARTPTS,afade=t=in:d={x},adelay={int((length - 2 * x) * 1000)}:all=1[head];"
        f"[body][head]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11,aresample={RATE}[out]"
    )
    run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-filter_complex", graph, "-map", "[out]", "-codec:a", "libmp3lame", "-b:a", "160k", str(mp3)])


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "sfx").mkdir(parents=True)
    (OUT / "music").mkdir(parents=True)
    manifest = {"sfx": {}, "music": {}}
    missing = []

    with tempfile.TemporaryDirectory() as tmp:
        for key, spec in SFX.items():
            files = []
            for n, variant in enumerate(spec["variants"], 1):
                wav = Path(tmp) / f"{key}_{n}.wav"
                try:
                    render_variant(variant, wav)
                except FileNotFoundError as e:
                    missing.append(f"{key}: {e}")
                    continue
                name = f"sfx/{key}_{n}.mp3"
                encode_sfx(wav, OUT / name)
                files.append(name)
            if files:
                manifest["sfx"][key] = {"volume": spec["volume"], "files": files}
                print(f"  sfx   {key:<26} {len(files)} variant(s)")

    for key, spec in MUSIC.items():
        name = f"music/{key}.mp3"
        try:
            render_loop(spec, OUT / name)
        except FileNotFoundError as e:
            missing.append(f"music {key}: {e}")
            continue
        manifest["music"][key] = {"volume": spec["volume"], "file": name}
        print(f"  music {key:<26} {duration(OUT / name):.1f}s loop")

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    credits = ["# Audio credits", "", "All sounds are licensed for commercial use in this game.", ""]
    credits += [f"- **{source}**: {what}" for source, what in CREDITS]
    credits += ["", "Keep the original download links for the Pixabay files in audio_raw/credits.txt."]
    (ROOT / "docs" / "AUDIO_CREDITS.md").write_text("\n".join(credits) + "\n")

    size = sum(p.stat().st_size for p in OUT.rglob("*.mp3"))
    print(f"Wrote {len(manifest['sfx'])} sounds + {len(manifest['music'])} music loops ({size / 1024:.0f} KB) to public/audio/")
    for m in missing:
        print("  MISSING", m)


if __name__ == "__main__":
    main()
