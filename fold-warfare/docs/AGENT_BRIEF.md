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

### 1. `tank_blue_idle_ne.png` - Tank - BLUE idle, facing NE (up-right)  **DONE**
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** DONE - provided by you. This is the style anchor for everything else.
- **Prompt:**

```text
A heavy armored sci-fi battle tank: wide caterpillar treads, thick angular armor plates, a large turret with one long main cannon, small antennas and a sensor pod.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, visor and accent stripes.
Facing: the unit faces diagonally UP-RIGHT, away from the camera - we see its back and left side, exactly like the reference tank.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 2. `tank_blue_idle_sw.png` - Tank - BLUE idle, facing SW (down-left)
- **Type:** EDIT  ·  **Edit of:** `art_raw/tank_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Show the SAME unit, identical design, details, colors, size and the flat green background, but turned around on the ground so it now faces diagonally DOWN-LEFT, toward the camera - we see its front and right side. Same 3/4 top-down camera height.
```

### 3. `tank_blue_fire_ne.png` - Tank - BLUE firing, facing NE
- **Type:** EDIT  ·  **Edit of:** `art_raw/tank_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the tank is FIRING its cannon right now - a bright muzzle flash and a burst of smoke at the end of the barrel, slight recoil.
```

### 4. `tank_blue_fire_sw.png` - Tank - BLUE firing, facing SW
- **Type:** EDIT  ·  **Edit of:** `art_raw/tank_blue_idle_sw.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the tank is FIRING its cannon right now - a bright muzzle flash and a burst of smoke at the end of the barrel, slight recoil.
```

### 5. `tank_blue_wreck.png` - Tank - BLUE destroyed wreck
- **Type:** EDIT  ·  **Edit of:** `art_raw/tank_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the tank is DESTROYED - burnt black armor, broken treads, turret knocked crooked, small fires and smoke rising, all lights off.
```

### 6. `tank_red_idle_ne.png` - Tank - RED idle, facing NE (up-right)
- **Type:** EDIT  ·  **Edit of:** `art_raw/tank_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 7. `tank_red_idle_sw.png` - Tank - RED idle, facing SW (down-left)
- **Type:** EDIT  ·  **Edit of:** `art_raw/tank_blue_idle_sw.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 8. `tank_red_fire_ne.png` - Tank - RED firing, facing NE
- **Type:** EDIT  ·  **Edit of:** `art_raw/tank_blue_fire_ne.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 9. `tank_red_fire_sw.png` - Tank - RED firing, facing SW
- **Type:** EDIT  ·  **Edit of:** `art_raw/tank_blue_fire_sw.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 10. `tank_red_wreck.png` - Tank - RED destroyed wreck
- **Type:** EDIT  ·  **Edit of:** `art_raw/tank_blue_wreck.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 11. `trooper_blue_idle_ne.png` - Mortar Trooper - BLUE idle, facing NE (up-right)
- **Type:** TEXT  ·  **Attach:** concept image, tank_blue_idle_ne.png  ·  **Aspect:** 1:1
- **Note:** First image of this unit, made from text.
- **Prompt:**

```text
A heavily armored sci-fi infantry soldier in full power armor with an enclosed helmet and glowing visor, carrying a chunky shoulder-mounted mortar launcher tube, standing ready in a combat stance.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, visor and accent stripes.
Facing: the unit faces diagonally UP-RIGHT, away from the camera - we see its back and left side, exactly like the reference tank.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 12. `trooper_blue_idle_sw.png` - Mortar Trooper - BLUE idle, facing SW (down-left)
- **Type:** EDIT  ·  **Edit of:** `art_raw/trooper_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Show the SAME unit, identical design, details, colors, size and the flat green background, but turned around on the ground so it now faces diagonally DOWN-LEFT, toward the camera - we see its front and right side. Same 3/4 top-down camera height.
```

### 13. `trooper_blue_fire_ne.png` - Mortar Trooper - BLUE firing, facing NE
- **Type:** EDIT  ·  **Edit of:** `art_raw/trooper_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the soldier is FIRING the shoulder mortar - bright flash and smoke puff at the launcher muzzle, a shell just leaving the tube, slight recoil pose.
```

### 14. `trooper_blue_fire_sw.png` - Mortar Trooper - BLUE firing, facing SW
- **Type:** EDIT  ·  **Edit of:** `art_raw/trooper_blue_idle_sw.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the soldier is FIRING the shoulder mortar - bright flash and smoke puff at the launcher muzzle, a shell just leaving the tube, slight recoil pose.
```

### 15. `trooper_red_idle_ne.png` - Mortar Trooper - RED idle, facing NE (up-right)
- **Type:** EDIT  ·  **Edit of:** `art_raw/trooper_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 16. `trooper_red_idle_sw.png` - Mortar Trooper - RED idle, facing SW (down-left)
- **Type:** EDIT  ·  **Edit of:** `art_raw/trooper_blue_idle_sw.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 17. `trooper_red_fire_ne.png` - Mortar Trooper - RED firing, facing NE
- **Type:** EDIT  ·  **Edit of:** `art_raw/trooper_blue_fire_ne.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 18. `trooper_red_fire_sw.png` - Mortar Trooper - RED firing, facing SW
- **Type:** EDIT  ·  **Edit of:** `art_raw/trooper_blue_fire_sw.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 19. `mine_blue_idle.png` - Mine Drone - BLUE idle
- **Type:** TEXT  ·  **Attach:** concept image, tank_blue_idle_ne.png  ·  **Aspect:** 1:1
- **Note:** Symmetric unit - one angle is enough.
- **Prompt:**

```text
A spherical hovering proximity-mine drone: dark armored metal ball with panel seams, a ring of small thrusters underneath, one glowing sensor eye and thin glowing light strips.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, visor and accent stripes.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 20. `mine_blue_armed.png` - Mine Drone - BLUE armed (about to explode)
- **Type:** EDIT  ·  **Edit of:** `art_raw/mine_blue_idle.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the mine is ARMED and about to explode - all lights glowing intensely bright, sharp spikes extended out of the sphere, crackling energy sparks around it.
```

### 21. `mine_red_idle.png` - Mine Drone - RED idle
- **Type:** EDIT  ·  **Edit of:** `art_raw/mine_blue_idle.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 22. `mine_red_armed.png` - Mine Drone - RED armed (about to explode)
- **Type:** EDIT  ·  **Edit of:** `art_raw/mine_blue_armed.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 23. `rocket_blue_idle_ne.png` - Rocket Launcher - BLUE idle, facing NE (up-right)
- **Type:** TEXT  ·  **Attach:** concept image, tank_blue_idle_ne.png  ·  **Aspect:** 1:1
- **Note:** First image of this unit, made from text.
- **Prompt:**

```text
A sci-fi tracked missile launcher vehicle: armored cab and a tilted launch rack holding 2 large missiles ready to fire, glowing lights.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, visor and accent stripes.
Facing: the unit faces diagonally UP-RIGHT, away from the camera - we see its back and left side, exactly like the reference tank.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 24. `rocket_blue_idle_sw.png` - Rocket Launcher - BLUE idle, facing SW (down-left)
- **Type:** TEXT  ·  **Attach:** rocket_blue_idle_ne.png, tank_blue_idle_sw.png  ·  **Aspect:** 1:1
- **Note:** Edits failed 3 times (kept facing NE), so this is a NEW generation from the two references.
- **Prompt:**

```text
Create a NEW image of the missile launcher vehicle shown in the FIRST attached image - same design, same armor, same twin missile rack, same blue lights - but seen from the OPPOSITE side, facing the SAME direction as the tank in the SECOND attached image: its front cab and the missile tips point toward the BOTTOM-LEFT corner, toward the camera, so we see the front and right side of the launcher. Do not draw the tank.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 25. `rocket_blue_fired_ne.png` - Rocket Launcher - BLUE just fired, facing NE
- **Type:** EDIT  ·  **Edit of:** `art_raw/rocket_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the missiles have just been LAUNCHED - the rack is now empty, bright exhaust flames and thick smoke blasting from the launch rails.
```

### 26. `rocket_blue_fired_sw.png` - Rocket Launcher - BLUE just fired, facing SW
- **Type:** EDIT  ·  **Edit of:** `art_raw/rocket_blue_idle_sw.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the missiles have just been LAUNCHED - the rack is now empty, bright exhaust flames and thick smoke blasting from the launch rails.
```

### 27. `rocket_red_idle_ne.png` - Rocket Launcher - RED idle, facing NE (up-right)
- **Type:** EDIT  ·  **Edit of:** `art_raw/rocket_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 28. `rocket_red_idle_sw.png` - Rocket Launcher - RED idle, facing SW (down-left)
- **Type:** EDIT  ·  **Edit of:** `art_raw/rocket_blue_idle_sw.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 29. `rocket_red_fired_ne.png` - Rocket Launcher - RED just fired, facing NE
- **Type:** EDIT  ·  **Edit of:** `art_raw/rocket_blue_fired_ne.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 30. `rocket_red_fired_sw.png` - Rocket Launcher - RED just fired, facing SW
- **Type:** EDIT  ·  **Edit of:** `art_raw/rocket_blue_fired_sw.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 31. `bunker_blue_intact.png` - Main Bunker - BLUE intact
- **Type:** TEXT  ·  **Attach:** concept image, tank_blue_idle_ne.png  ·  **Aspect:** 1:1
- **Note:** Bunkers always face front - one angle only.
- **Prompt:**

```text
A massive armored sci-fi command fortress (the MAIN BUNKER): thick concrete-and-steel walls, a heavy blast door at the front, defensive gun turrets on the corners, antennas and a glowing energy core on the roof.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, energy core and accent stripes. Facing: the front blast door faces the camera (bottom of the image).
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 32. `bunker_blue_damaged.png` - Main Bunker - BLUE damaged
- **Type:** EDIT  ·  **Edit of:** `art_raw/bunker_blue_intact.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the bunker is HEAVILY DAMAGED - cracked walls, blown-off armor plates, fires burning on the roof, smoke, flickering lights.
```

### 33. `bunker_blue_destroyed.png` - Main Bunker - BLUE destroyed
- **Type:** EDIT  ·  **Edit of:** `art_raw/bunker_blue_intact.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the bunker is COMPLETELY DESTROYED - collapsed into a smoking pile of rubble and twisted steel, small fires and embers, all lights dead.
```

### 34. `bunker_red_intact.png` - Main Bunker - RED intact
- **Type:** EDIT  ·  **Edit of:** `art_raw/bunker_blue_intact.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 35. `bunker_red_damaged.png` - Main Bunker - RED damaged
- **Type:** EDIT  ·  **Edit of:** `art_raw/bunker_blue_damaged.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 36. `bunker_red_destroyed.png` - Main Bunker - RED destroyed
- **Type:** EDIT  ·  **Edit of:** `art_raw/bunker_blue_destroyed.png`  ·  **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 37. `fx_explosion_sheet.png` - Explosion animation (sprite sheet)
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** If the frames come out messy, skip it - the game already has particle explosions.
- **Prompt:**

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 equal square cells showing ONE big fiery explosion animation in order, read left-to-right, top-to-bottom. Frame 1 (top-left) is a tiny white-hot flash, frames 2-6 grow into a huge orange fireball with sparks, frames 7-12 turn into dark smoke with embers, frames 13-16 (bottom-right) fade to thin wisps. Viewed from above. Each frame centered in its own cell, nothing crossing cell borders, no grid lines, no numbers. Realistic VFX style.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 38. `fx_muzzle_flash.png` - Muzzle flash
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A single bright gun muzzle flash burst seen from above: white-hot core with orange-yellow star-shaped flame spikes. Realistic VFX. Square 1:1 image.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 39. `fx_missile.png` - Missile projectile
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A single sci-fi missile: white body, red nose tip, small fins, glowing engine nozzle at the back. Pointing straight UP, viewed from above.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 40. `fx_shell.png` - Mortar shell
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A single small dark metal mortar shell glowing orange-hot, viewed from above.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 41. `fx_shield_dome.png` - Energy shield dome
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** Used for both teams - the game tints it blue or red.
- **Prompt:**

```text
A glowing hemispherical energy shield dome made of a hexagon grid pattern: translucent white-cyan light, bright glowing rim at the base, empty inside, seen from 3/4 above like the reference image. Square 1:1 image.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 42. `fx_crater.png` - Blast crater decal
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A blast crater / scorch mark decal seen straight from above: blackened burnt center, cracked rock, soot spread in a rough circle. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 43. `fx_laser_bolt.png` - Tracer bolt
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** Tinted blue/red by the game.
- **Prompt:**

```text
A single glowing energy tracer bolt: a thin vertical capsule with a white-hot core and a soft glow around it. Square 1:1 image.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 44. `env_ground_tile.png` - Battlefield ground (seamless)
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A seamless, tileable top-down texture of dark rocky battlefield terrain at night: dark grey-blue cracked rock, gravel, dust, small craters and faint scorch marks, viewed straight from above, even soft lighting. No objects, no grid lines, no text. The left/right and top/bottom edges must tile perfectly. Square 1:1 image.
```

### 45. `env_rocks.png` - Rock cluster prop
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A small cluster of dark jagged rocks and gravel.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 46. `env_wreckage.png` - Vehicle wreckage prop
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
Scattered burnt wreckage of a destroyed sci-fi vehicle, twisted metal, small embers.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 47. `env_barricade.png` - Barricade prop
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A short sci-fi steel barricade wall with hazard stripes.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 48. `bg_menu.png` - Main menu background (vertical)
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 9:16
- **Prompt:**

```text
Epic vertical key art for a mobile strategy game main menu: a dark rocky battlefield at night. A blue army (armored soldiers, tanks, missile launchers and a glowing blue-domed bunker) at the bottom faces a red army with a red glowing fortress at the top. Laser fire crosses the middle, explosions, sparks, smoke, faint holographic grid lines on the ground. Keep the top 25% darker and simpler (space for the logo) and the bottom 35% darker (space for buttons). Same art style as the reference image. No text. Vertical 9:16 image.
```

### 49. `bg_loading.png` - Loading screen (vertical)
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 9:16
- **Prompt:**

```text
Vertical loading-screen art for the same game: a close-up of a blue armored mortar trooper and a blue heavy tank advancing through smoke on a dark rocky battlefield, red laser fire in the background, dramatic lighting. Keep the bottom 20% dark for a progress bar. Same art style as the reference image. No text. Vertical 9:16 image.
```

### 50. `ui_btn_fold.png` - FOLD & FIGHT button (no text)
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 16:9
- **Note:** The game writes the text on top, so it works in Sinhala and English.
- **Prompt:**

```text
A wide glossy capsule-shaped game button plate: hot glowing orange-red energy core inside a dark gunmetal frame, small yellow light bars at both ends, like the button in the reference image but EMPTY.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 51. `ui_btn_fold_pressed.png` - FOLD button pressed
- **Type:** EDIT  ·  **Edit of:** `art_raw/ui_btn_fold.png`  ·  **Aspect:** 16:9
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the button is PRESSED - slightly darker, glow dimmer, looks pushed in.
```

### 52. `ui_btn_green.png` - Button plate - green
- **Type:** EDIT  ·  **Edit of:** `art_raw/ui_btn_fold.png`  ·  **Aspect:** 16:9
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing energy color to green (#3DDC6B). Keep it empty with no text.
```

### 53. `ui_btn_blue.png` - Button plate - blue
- **Type:** EDIT  ·  **Edit of:** `art_raw/ui_btn_fold.png`  ·  **Aspect:** 16:9
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing energy color to blue (#2E9BFF). Keep it empty with no text.
```

### 54. `ui_btn_red.png` - Button plate - red
- **Type:** EDIT  ·  **Edit of:** `art_raw/ui_btn_fold.png`  ·  **Aspect:** 16:9
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing energy color to red (#FF3B3B). Keep it empty with no text.
```

### 55. `ui_btn_gold.png` - Button plate - gold
- **Type:** EDIT  ·  **Edit of:** `art_raw/ui_btn_fold.png`  ·  **Aspect:** 16:9
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing energy color to gold (#FFC83D). Keep it empty with no text.
```

### 56. `ui_hinge_bar.png` - Hinge bar
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 21:9
- **Prompt:**

```text
A very long, thin horizontal sci-fi metal hinge bar for a foldable device: dark gunmetal with rivets and panel lines, glowing amber indicator lights near both ends and an empty socket in the middle. Perfectly horizontal and stretching the full width of the image.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 57. `ui_header_bar.png` - Sector header bar
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 21:9
- **Note:** Used above each half (ENEMY SECTOR / ALLY SECTOR). Tinted per team.
- **Prompt:**

```text
A thin wide sci-fi HUD header strip: dark translucent glass plate with a bevelled gunmetal edge and a thin glowing white line along the bottom. Perfectly horizontal, stretching the full width.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 58. `ui_panel.png` - Dialog panel frame
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 3:4
- **Prompt:**

```text
An empty sci-fi game dialog panel: dark translucent navy-black glass center, bevelled gunmetal border with glowing cyan edge lines and small corner bolts, nothing inside the panel.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 59. `ui_card_blue.png` - Unit card frame - blue
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 3:4
- **Prompt:**

```text
A vertical sci-fi unit card frame (trading-card shape): dark metal border with glowing blue edges, empty dark center, small empty badge slot in the top-right corner.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 60. `ui_card_gold.png` - Unit card frame - selected (gold)
- **Type:** EDIT  ·  **Edit of:** `art_raw/ui_card_blue.png`  ·  **Aspect:** 3:4
- **Note:** AUTO - recolored from ui_card_blue.
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing edges to bright gold (#FFC83D) and make the glow stronger.
```

### 61. `ui_skill_frame.png` - Round skill button frame
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A round sci-fi skill button frame: thick gunmetal ring with a glowing cyan inner rim, empty dark glass center.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 62. `ui_banner_victory.png` - Victory banner plate
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 16:9
- **Prompt:**

```text
A wide golden winged victory banner plate with a ribbon and glowing light rays behind it, empty center area. Sci-fi military style.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 63. `ui_banner_defeat.png` - Defeat banner plate
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 16:9
- **Prompt:**

```text
A wide dark broken steel banner plate with cracks, a dim red glow and drifting smoke, empty center area. Sci-fi military style.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 64. `icon_coin.png` - Coin
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A thick gold coin with an embossed military star emblem and a bevelled rim.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 65. `icon_gem.png` - Gem (premium currency)
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A faceted glowing purple-pink crystal gem.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 66. `icon_trophy.png` - Trophy
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A golden trophy cup with a star on the front and a dark base.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 67. `icon_star.png` - Star (earned)
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A chunky glossy gold star with a thick dark outline.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 68. `icon_star_empty.png` - Star (empty slot)
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A chunky star shape in dark matte gunmetal with a thick outline, unlit.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 69. `icon_skill_hide.png` - Skill: Hide / Cloak
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A glowing purple eye crossed by a diagonal line, stealth-cloak symbol.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 70. `icon_skill_boost.png` - Skill: Overcharge
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A glowing yellow-orange lightning bolt bursting with energy.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 71. `icon_skill_radar.png` - Skill: Radar Scan
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A round green radar screen with a sweeping beam and one red blip.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 72. `icon_skill_shield.png` - Skill: Bunker Shield
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A glowing cyan energy shield with hexagon pattern.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 73. `icon_skill_foldpreview.png` - Skill: Fold Preview
- **Type:** TEXT  ·  **Attach:** icon_skill_shield.png, icon_skill_radar.png  ·  **Aspect:** 1:1
- **Note:** Attach the two existing skill icons so it matches the set.
- **Prompt:**

```text
A glowing hologram sheet of paper folding in half along a bright orange crease, small red and blue target dots shining through it.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 74. `icon_lock.png` - Lock
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A heavy steel padlock with a glowing red keyhole.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 75. `icon_timer.png` - Turn timer
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A sci-fi stopwatch with a glowing amber ring.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 76. `icon_sound_on.png` - Sound on
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A metallic speaker with glowing sound waves.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 77. `icon_sound_off.png` - Sound off
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A metallic speaker with a red X.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 78. `icon_settings.png` - Settings
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A metallic gear cog with a glowing cyan center.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 79. `league_bronze.png` - League badge - Bronze
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.
- **Prompt:**

```text
A military rank emblem badge for the BRONZE league: shield shape with wings and a star, made of bronze metal, simple design. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 80. `league_silver.png` - League badge - Silver
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.
- **Prompt:**

```text
A military rank emblem badge for the SILVER league: shield shape with wings and a star, made of polished silver metal. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 81. `league_gold.png` - League badge - Gold
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.
- **Prompt:**

```text
A military rank emblem badge for the GOLD league: shield shape with wings and a star, made of shiny gold with small rubies. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 82. `league_crystal.png` - League badge - Crystal
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.
- **Prompt:**

```text
A military rank emblem badge for the CRYSTAL league: shield shape with wings and a star, made of glowing purple crystal and silver. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 83. `league_master.png` - League badge - Master
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.
- **Prompt:**

```text
A military rank emblem badge for the MASTER league: shield shape with wings and a star, made of cyan energy-glowing dark steel. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 84. `league_champion.png` - League badge - Champion
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.
- **Prompt:**

```text
A military rank emblem badge for the CHAMPION league: shield shape with wings and a star, made of fiery orange-red glowing metal with flames. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 85. `league_legend.png` - League badge - Legend
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.
- **Prompt:**

```text
A military rank emblem badge for the LEGEND league: shield shape with wings and a star, made of black obsidian with glowing magenta light and a small crown on top. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 86. `avatar_player.png` - Avatar - You (player)
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: blue-accented armor, helmet off, short hair, friendly but tough.
```

### 87. `avatar_viper.png` - Avatar - General Viper
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, snake insignia, scarred face, cold stare.
```

### 88. `avatar_blitz.png` - Avatar - Captain Blitz
- **Type:** TEXT  ·  **Attach:** concept image, avatar_viper.png  ·  **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.
- **Prompt:**

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, lightning bolt helmet decal, wild grin.
```

### 89. `avatar_kobra.png` - Avatar - Major Kobra
- **Type:** TEXT  ·  **Attach:** concept image, avatar_viper.png  ·  **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.
- **Prompt:**

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, hood-shaped helmet, glowing red visor.
```

### 90. `avatar_boomer.png` - Avatar - Sgt. Boomer
- **Type:** TEXT  ·  **Attach:** concept image, avatar_viper.png  ·  **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.
- **Prompt:**

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented heavy armor, big beard, cigar, explosives belt.
```

### 91. `avatar_bruno.png` - Avatar - Tanker Bruno
- **Type:** TEXT  ·  **Attach:** concept image, avatar_viper.png  ·  **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.
- **Prompt:**

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, tank-crew headset, huge muscular build.
```

### 92. `avatar_mango.png` - Avatar - Colonel Mango
- **Type:** TEXT  ·  **Attach:** concept image, avatar_viper.png  ·  **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.
- **Prompt:**

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, orange beret, mustache, medals.
```

### 93. `avatar_fizz.png` - Avatar - Lt. Fizz
- **Type:** TEXT  ·  **Attach:** concept image, avatar_viper.png  ·  **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.
- **Prompt:**

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented light armor, goggles on forehead, young and cocky.
```

### 94. `store_coins_s.png` - Coins - small pack
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A small neat stack of gold coins with a military star emblem.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 95. `store_coins_m.png` - Coins - medium pack
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A canvas army sack overflowing with gold coins.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 96. `store_coins_l.png` - Coins - large pack
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
An open armored supply crate overflowing with gold coins, glowing.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 97. `store_gems_s.png` - Gems - small pack
- **Type:** TEXT  ·  **Attach:** concept image, store_gems_l.png  ·  **Aspect:** 1:1
- **Note:** Match the look of the attached store image.
- **Prompt:**

```text
A small pile of glowing purple-pink crystal gems.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 98. `store_gems_m.png` - Gems - medium pack
- **Type:** TEXT  ·  **Attach:** concept image, store_gems_l.png  ·  **Aspect:** 1:1
- **Note:** Match the look of the attached store image.
- **Prompt:**

```text
A metal tray full of glowing purple-pink crystal gems.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 99. `store_gems_l.png` - Gems - large pack
- **Type:** TEXT  ·  **Attach:** concept image, store_gems_l.png  ·  **Aspect:** 1:1
- **Note:** Match the look of the attached store image.
- **Prompt:**

```text
An open sci-fi vault case packed with glowing purple-pink gems, light beams.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 100. `store_chest_closed.png` - Supply chest - closed
- **Type:** EDIT  ·  **Edit of:** `art_raw/store_chest_open.png`  ·  **Aspect:** 1:1
- **Note:** Made from the open chest you already have.
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the chest LID IS CLOSED and locked - no light or sparks coming out, the blue seams still glow softly.
```

### 101. `store_chest_open.png` - Supply chest - open
- **Type:** TEXT  ·  **Attach:** store_coins_l.png  ·  **Aspect:** 1:1
- **Prompt:**

```text
The same sci-fi supply chest, lid open, bright golden light and sparks bursting out.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 102. `store_full_unlock.png` - Full game unlock
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
A golden commander badge with wings and a glowing key in the middle, premium and epic.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 103. `logo.png` - Game logo
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 16:9
- **Prompt:**

```text
Game logo with the exact text 'FOLD WARFARE' (spelled exactly like that, two words). 'FOLD' on top in heavy chiselled glowing orange-gold hot metal letters, 'WARFARE' below in brushed steel letters with a blue edge glow. Sci-fi military style, strong 3D bevel, a few sparks. Nothing else.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### 104. `app_icon.png` - App icon
- **Type:** TEXT  ·  **Attach:** concept image  ·  **Aspect:** 1:1
- **Prompt:**

```text
Mobile app icon: a blue armored tank and a red armored tank facing each other across a glowing orange fold line in the middle, dark rocky battlefield, dramatic lighting, rounded-square composition, same art style as the reference image. No text. Square 1:1 image.
```

### 105. `trooper_blue_dead.png` - Mortar Trooper - BLUE defeated (lying down)
- **Type:** EDIT  ·  **Edit of:** `art_raw/trooper_blue_idle_sw.png`  ·  **Aspect:** 1:1
- **Note:** Shown where a trooper dies. Red version is automatic.
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the soldier is DEFEATED - lying flat on the ground on his back, armor scorched, visor dark, the mortar tube dropped beside him, a thin wisp of smoke.
```

### 106. `trooper_red_dead.png` - Mortar Trooper - RED defeated
- **Type:** EDIT  ·  **Edit of:** `art_raw/trooper_blue_dead.png`  ·  **Aspect:** 1:1
- **Note:** AUTO.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 107. `rocket_blue_wreck.png` - Rocket Launcher - BLUE destroyed wreck
- **Type:** EDIT  ·  **Edit of:** `art_raw/rocket_blue_idle_ne.png`  ·  **Aspect:** 1:1
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the launcher is DESTROYED - burnt black armor, launch rack torn off and lying crooked, broken treads, small fires and smoke, all lights off.
```

### 108. `rocket_red_wreck.png` - Rocket Launcher - RED destroyed wreck
- **Type:** EDIT  ·  **Edit of:** `art_raw/rocket_blue_wreck.png`  ·  **Aspect:** 1:1
- **Note:** AUTO.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 109. `bunker_blue_firing.png` - Main Bunker - BLUE turrets firing
- **Type:** EDIT  ·  **Edit of:** `art_raw/bunker_blue_intact.png`  ·  **Aspect:** 1:1
- **Note:** Flashed for a moment when the bunker turret shoots.
- **Prompt:**

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: all corner gun turrets are FIRING at once - bright muzzle flashes and small smoke puffs at every turret barrel.
```

### 110. `bunker_red_firing.png` - Main Bunker - RED turrets firing
- **Type:** EDIT  ·  **Edit of:** `art_raw/bunker_blue_firing.png`  ·  **Aspect:** 1:1
- **Note:** AUTO.
- **Prompt:**

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### 111. `fx_deploy_sheet.png` - Unit deploy / teleport-in beam (16 frames)
- **Type:** TEXT  ·  **Attach:**   ·  **Aspect:** 1:1
- **Note:** Plays every time a unit is placed. Tinted per team.
- **Prompt:**

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: a holographic DEPLOY effect seen from 3/4 above: frame 1 a tiny spark on the ground, frames 2-5 a bright white-cyan beam of light strikes down from the sky, frames 6-10 a glowing hexagon hologram ring expands on the ground with sparks, frames 11-16 the beam thins out and the ring fades away.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 112. `fx_smoke_sheet.png` - Smoke puff (16 frames)
- **Type:** TEXT  ·  **Attach:**   ·  **Aspect:** 1:1
- **Note:** Used after hits and on wrecks.
- **Prompt:**

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: a puff of thick grey smoke seen from above: starts small and dense, billows outward and rises, then thins and fades to nothing by the last frame.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 113. `fx_spark_sheet.png` - Electric spark / EMP burst (16 frames)
- **Type:** TEXT  ·  **Attach:**   ·  **Aspect:** 1:1
- **Note:** Mine arming, shield breaking, radar ping.
- **Prompt:**

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: an electric EMP burst seen from above: crackling white-cyan lightning arcs explode outward from the center, flicker brightly, then fizzle out into small sparks.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 114. `fx_fire_loop_sheet.png` - Burning fire loop (16 frames)
- **Type:** TEXT  ·  **Attach:**   ·  **Aspect:** 1:1
- **Note:** Loops on wrecks and damaged bunkers.
- **Prompt:**

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: a small cluster of realistic orange-yellow flames burning on the ground, seen from 3/4 above. This is a LOOP: frame 16 must flow smoothly back into frame 1, the flames flicker but stay the same size.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 115. `fx_shield_hit_sheet.png` - Shield impact ripple (16 frames)
- **Type:** TEXT  ·  **Attach:**   ·  **Aspect:** 1:1
- **Note:** Plays when a shielded bunker is hit.
- **Prompt:**

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: an impact hitting a hexagon energy shield: a bright white flash at the center, a ring of glowing hexagon cells ripples outward, then fades back to nothing.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 116. `fx_shockwave_sheet.png` - Ground shockwave (16 frames)
- **Type:** TEXT  ·  **Attach:**   ·  **Aspect:** 1:1
- **Note:** Under big explosions and the fold slam.
- **Prompt:**

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: a ground-level blast shockwave seen from 3/4 above: a bright ring of dust and light expands outward from the center and fades, small debris flying out.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### 117. `fx_coin_spin_sheet.png` - Gold coin spinning (16 frames)
- **Type:** TEXT  ·  **Attach:**   ·  **Aspect:** 1:1
- **Note:** Coins flying to the counter after a win.
- **Prompt:**

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: ONE thick gold coin with a military star emblem spinning a full turn around its vertical axis: frame 1 facing front, the thin edge at frame 5, the back at frame 9, the edge again at frame 13, almost front again at frame 16 so it loops smoothly.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```
