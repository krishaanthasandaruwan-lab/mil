#!/usr/bin/env python3
"""Builds docs/ASSET_PROMPTS.md and docs/asset_prompts.html from tools/asset_specs.py."""

import html
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from asset_specs import SPECS  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")

TIER_NAMES = {
    1: "Tier 1 - Battle (makes the game look like your concept)",
    2: "Tier 2 - Menus, UI, icons",
    3: "Tier 3 - Store & extras",
}

WORKFLOW = """\
## How to make the images (read once)

1. Open **Gemini → Nano Banana** (image generation).
2. **Attach your concept picture** (the ENEMY SECTOR / ALLY SECTOR image) to every *text* prompt. It's the style
   reference that keeps every asset looking like one game.
3. Prompts marked **EDIT** are not made from text. Upload the image named in "Edit of", then paste the prompt.
   This keeps the same unit identical across states and teams (blue → red, idle → firing → wreck).
4. Save each result as **PNG** with the **exact file name** shown (e.g. `tank_blue_idle.png`) into:
   `fold-warfare/art_raw/`
5. Run `npm run assets` (or ask me). The script removes the green background, trims, resizes and the game
   picks the image up automatically. Missing images keep using the built-in drawings, so you can add them
   one by one.

**Tips**
- If you see a shadow, floor or gradient behind the object, regenerate. The background must be flat green.
- Keep green out of the units. Team colors are blue and red only.
- After the first good unit (`tank_blue_idle`), attach it **as a second reference** for the other units so all
  units share the same detail level.
- Make things in this order: Tier 1 → Tier 2 → Tier 3. Tier 1 alone already makes battles look like the concept.

## Animations - what you need to make

Very little. The game animates the images in code:

| Animation | Done by |
|---|---|
| Units dropping in, idle bob, hover (mine drone), recoil when firing | Code |
| Firing | Code swaps to the `_fire` image for a moment + muzzle flash + projectile |
| Mortar shell arc, missile flight with smoke trail, tracer bolts | Code (uses `fx_shell`, `fx_missile`, `fx_laser_bolt`) |
| Explosions, sparks, smoke, debris, screen shake | Code particles + optional `fx_explosion_sheet` |
| Hide skill (shimmer/cloak), shield dome pulse, hologram range circles | Code |
| Unit death | Code swaps to `_wreck` (tank) or fades out; bunker goes intact → damaged → destroyed |
| Fold of the phone, banners, stars, coin counters | Code |

The only frame-by-frame animation is `fx_explosion_sheet` (16 frames in one image). It's optional.
"""

SKINS = """\
## Later (Phase 2): unit skins

Skins are EDITs of the finished unit images. Same file names with the skin added, e.g. `tank_blue_idle_desert.png`.

- **Desert Camo:** `Edit this image. Keep the exact same unit, pose, size, camera angle and flat green background. Repaint the armor in a sandy desert camouflage pattern; keep the glowing team lights.`
- **Arctic:** `... Repaint the armor white and pale grey with frost and ice crystals on the edges; keep the glowing team lights.`
- **Golden:** `... Repaint the armor in polished gold with black trim; keep the glowing team lights.`
- **Cyber Neon:** `... Repaint the armor glossy black with bright neon circuit lines; keep the glowing team lights.`
"""


def counts():
    by_tier = {}
    for s in SPECS:
        by_tier[s["tier"]] = by_tier.get(s["tier"], 0) + 1
    return by_tier


def build_markdown():
    lines = ["# Fold Warfare - Nano Banana Asset Prompts", ""]
    c = counts()
    lines.append(
        f"**{len(SPECS)} images total:** " + " · ".join(f"Tier {t}: {n}" for t, n in sorted(c.items())) + "\n"
    )
    lines.append(WORKFLOW)
    for tier in sorted(TIER_NAMES):
        lines += [f"# {TIER_NAMES[tier]}", ""]
        group = None
        for s in [s for s in SPECS if s["tier"] == tier]:
            if s["group"] != group:
                group = s["group"]
                lines += [f"## {group}", ""]
            kind = f"EDIT of `{s['edit_of']}.png`" if s["edit_of"] else "TEXT → image, attach: " + ", ".join(s["refs"])
            lines.append(f"### {s['title']}" + ("  ✅ DONE" if s["done"] else ""))
            lines.append(f"- **Save as:** `art_raw/{s['file']}.png`")
            lines.append(f"- **Type:** {kind} · **Aspect:** {s['aspect']}")
            if s["note"]:
                lines.append(f"- **Note:** {s['note']}")
            lines += ["", "```text", s["prompt"], "```", ""]
    lines.append(SKINS)
    return "\n".join(lines)


def build_html():
    data = json.dumps([dict(s, done=s["done"] or bool(s.get("derive")) or present(s["file"])) for s in SPECS])
    tiers = json.dumps({str(k): v for k, v in TIER_NAMES.items()})
    workflow = html.escape(WORKFLOW)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fold Warfare Prompts</title>
<style>
:root {{ --bg:#0b1018; --card:#131b27; --line:#24324a; --text:#e6edf7; --muted:#8fa3bf; --blue:#2e9bff; --red:#ff3b3b; --gold:#ffc83d; }}
* {{ box-sizing:border-box; }}
body {{ margin:0; background:var(--bg); color:var(--text); font:15px/1.5 -apple-system, system-ui, sans-serif; }}
header {{ position:sticky; top:0; background:#0b1018ee; backdrop-filter:blur(6px); border-bottom:1px solid var(--line); padding:12px 16px; z-index:2; }}
h1 {{ margin:0; font-size:20px; }} .bar {{ height:8px; background:var(--line); border-radius:4px; margin-top:8px; overflow:hidden; }}
.bar i {{ display:block; height:100%; background:linear-gradient(90deg,var(--blue),var(--gold)); width:0; transition:width .3s; }}
main {{ max-width:900px; margin:0 auto; padding:16px; }}
details.how {{ background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px 16px; margin-bottom:16px; white-space:pre-wrap; }}
h2 {{ margin:28px 0 8px; color:var(--gold); }} h3 {{ margin:18px 0 8px; color:var(--muted); font-size:14px; text-transform:uppercase; letter-spacing:.08em; }}
.card {{ background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px 14px; margin:10px 0; }}
.card.done {{ opacity:.45; }} .row {{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }}
.title {{ font-weight:700; flex:1; min-width:200px; }} code {{ background:#0b1018; padding:2px 6px; border-radius:6px; color:var(--gold); }}
.tag {{ font-size:12px; padding:2px 8px; border-radius:99px; border:1px solid var(--line); color:var(--muted); }}
.tag.edit {{ border-color:var(--blue); color:var(--blue); }}
pre {{ white-space:pre-wrap; background:#0b1018; border:1px solid var(--line); border-radius:8px; padding:10px; margin:10px 0 6px; font-size:13px; }}
button {{ background:var(--blue); color:#fff; border:0; border-radius:8px; padding:8px 14px; font-weight:700; cursor:pointer; }}
button.copied {{ background:#3ddc6b; }} label {{ color:var(--muted); font-size:13px; }}
.note {{ color:var(--muted); font-size:13px; }}
</style></head><body>
<header><h1>Fold Warfare · Nano Banana prompts</h1><div class="note" id="count"></div><div class="bar"><i id="prog"></i></div></header>
<main>
<details class="how"><summary><b>How to use (open me first)</b></summary>{workflow}</details>
<div id="list"></div>
</main>
<script>
const SPECS = {data}; const TIERS = {tiers};
const key = 'fw-prompts-done'; let done = {{}};
try {{ done = JSON.parse(localStorage.getItem(key) || '{{}}'); }} catch (e) {{}}
const save = () => {{ try {{ localStorage.setItem(key, JSON.stringify(done)); }} catch (e) {{}} }};
const list = document.getElementById('list');
const update = () => {{
  const n = SPECS.filter(s => done[s.file]).length;
  document.getElementById('count').textContent = n + ' / ' + SPECS.length + ' images done';
  document.getElementById('prog').style.width = (100 * n / SPECS.length) + '%';
}};
let tier = null, group = null;
SPECS.forEach(s => {{
  if (s.tier !== tier) {{ tier = s.tier; group = null; const h = document.createElement('h2'); h.textContent = TIERS[tier]; list.appendChild(h); }}
  if (s.group !== group) {{ group = s.group; const h = document.createElement('h3'); h.textContent = group; list.appendChild(h); }}
  const c = document.createElement('div'); c.className = 'card' + (done[s.file] ? ' done' : '');
  const kind = s.edit_of ? '<span class="tag edit">EDIT of ' + s.edit_of + '.png</span>' : '<span class="tag">TEXT + concept ref</span>';
  c.innerHTML = '<div class="row"><span class="title"></span>' + kind + '<span class="tag">' + s.aspect + '</span></div>'
    + '<div class="note">Save as <code>art_raw/' + s.file + '.png</code></div>'
    + (s.note ? '<div class="note">' + s.note + '</div>' : '')
    + '<pre></pre><div class="row"><button>Copy prompt</button><label><input type="checkbox"> done</label></div>';
  c.querySelector('.title').textContent = s.title;
  c.querySelector('pre').textContent = s.prompt;
  const btn = c.querySelector('button');
  btn.onclick = async () => {{ try {{ await navigator.clipboard.writeText(s.prompt); }} catch (e) {{ const r = document.createRange(); r.selectNode(c.querySelector('pre')); getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand('copy'); }}
    btn.textContent = 'Copied!'; btn.classList.add('copied'); setTimeout(() => {{ btn.textContent = 'Copy prompt'; btn.classList.remove('copied'); }}, 1200); }};
  if (s.done && done[s.file] === undefined) {{ done[s.file] = true; c.classList.add('done'); }}
  const cb = c.querySelector('input'); cb.checked = !!done[s.file];
  cb.onchange = () => {{ done[s.file] = cb.checked; c.classList.toggle('done', cb.checked); save(); update(); }};
  list.appendChild(c);
}});
update();
</script></body></html>
"""


AGENT_RULES = """\
# Fold Warfare - Image Generation Brief (for an AI agent)

You are generating game art with **Nano Banana (Gemini image generation)** for a mobile strategy game.
Work through the asset list below **in order, top to bottom**. Later items depend on earlier ones.

## Inputs you are given
- `concept image`: the user's style reference (dark sci-fi battlefield, red ENEMY SECTOR on top, blue ALLY SECTOR
  below). Attach it wherever an item lists it under **Attach**.
- `art_raw/tank_blue_idle_ne.png`: the finished blue tank, the **style anchor**. Attach it wherever listed.

## For every item
1. Skip items marked **DONE**.
2. **TEXT** items: start a new generation, attach every file under **Attach**, paste the **Prompt** exactly.
3. **EDIT** items: upload the already-generated file named in **Edit of** (from `art_raw/`), paste the **Prompt**
   exactly. Do NOT generate from scratch, because the edit keeps the unit identical.
4. Use the **Aspect** ratio given.
5. Save the result as PNG with the **exact file name** into `art_raw/`. Lowercase, no spaces, no extra suffixes.

## Check every image before saving. Regenerate (max 3 tries) if any check fails
- Background is flat solid green #00FF00 (or solid black when the prompt says black). No floor, shadow,
  gradient, frame or border.
- Exactly one object, fully inside the frame, not cut off at any edge.
- No text, letters, numbers, watermark or logo (except the `logo` item, which must read exactly FOLD WARFARE).
- Units: facing direction matches the prompt (NE = up-right, away from the camera; SW = down-left, toward the
  camera). Team color is blue or red exactly as asked, with no green on the unit.
- RED versions: identical to the blue source except the light colors.
- Style matches the concept image and the anchor tank (realistic 3D render, gunmetal, glowing accents).

## When finished
Reply with: files created, files that failed after 3 tries (and why), and anything that looked off.

## Asset list
"""


def build_agent_brief():
    lines = [AGENT_RULES]
    order = 0
    for s in SPECS:
        order += 1
        lines.append(f"### {order}. `{s['file']}.png` - {s['title']}" + ("  **DONE**" if s["done"] else ""))
        if s["edit_of"]:
            lines.append(f"- **Type:** EDIT  ·  **Edit of:** `art_raw/{s['edit_of']}.png`  ·  **Aspect:** {s['aspect']}")
        else:
            lines.append(f"- **Type:** TEXT  ·  **Attach:** {', '.join(s['refs'])}  ·  **Aspect:** {s['aspect']}")
        if s["note"]:
            lines.append(f"- **Note:** {s['note']}")
        lines += ["- **Prompt:**", "", "```text", s["prompt"], "```", ""]
    return "\n".join(lines)


RAW_DIR = os.path.join(ROOT, "art_raw")

RETRY_NOTES = {
    "tank_blue_fire_sw": "Skipped in BOTH previous batches - please do this one. Upload tank_blue_idle_sw.png (tank facing down-left).",
    "rocket_blue_idle_sw": "Failed 3 times as an EDIT (always kept facing up-right). Now a NEW generation: attach rocket_blue_idle_ne.png FIRST (design) and tank_blue_idle_sw.png SECOND (direction). Reject any result where the missiles point up-right.",
    "rocket_blue_fired_sw": "Needs rocket_blue_idle_sw.png first. Must face down-left like it.",
    "rocket_blue_wreck": "Skipped in the last 2 batches - please do this one.",
    "fx_spark_sheet": "Skipped in the last batch.",
    "fx_shockwave_sheet": "Skipped in the last batch.",
}


def present(stem):
    return any(os.path.exists(os.path.join(RAW_DIR, stem + ext)) for ext in (".png", ".jpg", ".jpeg", ".webp"))


# Nano Banana could not turn the rocket launcher around (4 attempts); the game mirrors the NE art instead.
DROPPED = {"rocket_blue_idle_sw", "rocket_blue_fired_sw", "rocket_red_idle_sw", "rocket_red_fired_sw"}


def remaining_specs():
    return [s for s in SPECS if not s["done"] and not s.get("derive") and not present(s["file"]) and s["file"] not in DROPPED]


def build_remaining_brief():
    todo = remaining_specs()
    intro = AGENT_RULES.replace(
        "## Asset list",
        "## This is the REMAINING list\n"
        f"{len(todo)} images. Everything else is already done. **Red team versions are made automatically** from "
        "the blue ones, so only blue/neutral images are listed.\n\n## Asset list",
    )
    lines = [intro]
    for n, s in enumerate(todo, 1):
        lines.append(f"### {n}. `{s['file']}.png` - {s['title']}")
        if s["edit_of"]:
            lines.append(f"- **Type:** EDIT  ·  **Edit of:** `art_raw/{s['edit_of']}.png`  ·  **Aspect:** {s['aspect']}")
        else:
            lines.append(f"- **Type:** TEXT  ·  **Attach:** {', '.join(s['refs'])}  ·  **Aspect:** {s['aspect']}")
        if s.get("grid"):
            lines.append(f"- **Sprite sheet:** {s['grid'][0]} columns × {s['grid'][1]} rows")
        if s["file"] in RETRY_NOTES:
            lines.append(f"- **Retry note:** {RETRY_NOTES[s['file']]}")
        if s["note"]:
            lines.append(f"- **Note:** {s['note']}")
        lines += ["- **Prompt:**", "", "```text", s["prompt"], "```", ""]
    return "\n".join(lines), todo


def build_remaining_json():
    rows = []
    for i, s in enumerate(remaining_specs(), 1):
        r = {"order": i, "file": f"art_raw/{s['file']}.png", "title": s["title"],
             "type": "edit" if s["edit_of"] else "text",
             "edit_of": f"art_raw/{s['edit_of']}.png" if s["edit_of"] else None,
             "attach": s["refs"], "aspect": s["aspect"]}
        if s.get("grid"):
            r["sprite_sheet_grid"] = {"columns": s["grid"][0], "rows": s["grid"][1]}
        if s["file"] in RETRY_NOTES:
            r["retry_note"] = RETRY_NOTES[s["file"]]
        if s["note"] and "AUTO" not in s["note"]:
            r["note"] = s["note"]
        r["prompt"] = s["prompt"]
        rows.append(r)
    return json.dumps({"project": "Fold Warfare", "instructions": [
        "Generate images with Nano Banana (Gemini image generation), in order.",
        "type=text: new generation, attach every file in 'attach' ('concept image' = the user's style reference; other names are files in art_raw/). An empty 'attach' list means attach NOTHING. Paste 'prompt' exactly.",
        "type=edit: upload the file in 'edit_of' FIRST, then any files in 'attach' as extra references, and paste 'prompt' exactly. Never generate edits from scratch.",
        "Use the given aspect ratio. Save as PNG with the exact 'file' name.",
        "Checks (regenerate up to 3 times): flat solid #00FF00 background (or solid black when the prompt says so), one object fully in frame, no text/watermark, correct facing (NE = up-right away from camera, SW = down-left toward camera), blue team lights only, style matches the concept image.",
        "Sprite sheets: frames must be in an even grid with identical size/position per cell.",
        "Red team versions are NOT needed - they are made automatically.",
        "Do EVERY item in the list - previous batches skipped some. When finished, report files created and any that failed.",
    ], "assets": rows}, indent=2, ensure_ascii=False) + "\n"


def build_json():
    rows = []
    for i, s in enumerate(SPECS, 1):
        rows.append({
            "order": i,
            "file": f"art_raw/{s['file']}.png",
            "title": s["title"],
            "tier": s["tier"],
            "type": "edit" if s["edit_of"] else "text",
            "edit_of": f"art_raw/{s['edit_of']}.png" if s["edit_of"] else None,
            "attach": s["refs"],
            "aspect": s["aspect"],
            "done": s["done"],
            "prompt": s["prompt"],
        })
    return json.dumps(rows, indent=2, ensure_ascii=False)


def main():
    os.makedirs(DOCS, exist_ok=True)
    with open(os.path.join(DOCS, "AGENT_BRIEF.md"), "w", encoding="utf-8") as f:
        f.write(build_agent_brief())
    with open(os.path.join(DOCS, "asset_prompts.json"), "w", encoding="utf-8") as f:
        f.write(build_json())
    with open(os.path.join(DOCS, "asset_prompts_remaining.json"), "w", encoding="utf-8") as f:
        f.write(build_remaining_json())
    text, todo = build_remaining_brief()
    with open(os.path.join(DOCS, "AGENT_BRIEF_REMAINING.md"), "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Remaining for the agent: {len(todo)} -> docs/AGENT_BRIEF_REMAINING.md")
    with open(os.path.join(DOCS, "ASSET_PROMPTS.md"), "w", encoding="utf-8") as f:
        f.write(build_markdown())
    with open(os.path.join(DOCS, "asset_prompts.html"), "w", encoding="utf-8") as f:
        f.write(build_html())
    print(f"Wrote {len(SPECS)} prompts: docs/AGENT_BRIEF.md, docs/asset_prompts.json, docs/ASSET_PROMPTS.md, docs/asset_prompts.html")


if __name__ == "__main__":
    main()
