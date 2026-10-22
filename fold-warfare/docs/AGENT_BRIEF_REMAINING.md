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

## This is the REMAINING list
0 images. Everything else is already done. **Red team versions are made automatically** from the blue ones, so only blue/neutral images are listed.

## Asset list
