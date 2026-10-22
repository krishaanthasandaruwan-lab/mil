# Fold Warfare - Nano Banana Asset Prompts

**117 images total:** Tier 1: 51 · Tier 2: 52 · Tier 3: 14

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

# Tier 1 - Battle (makes the game look like your concept)

## Units

### Tank - BLUE idle, facing NE (up-right)  ✅ DONE
- **Save as:** `art_raw/tank_blue_idle_ne.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** DONE - provided by you. This is the style anchor for everything else.

```text
A heavy armored sci-fi battle tank: wide caterpillar treads, thick angular armor plates, a large turret with one long main cannon, small antennas and a sensor pod.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, visor and accent stripes.
Facing: the unit faces diagonally UP-RIGHT, away from the camera - we see its back and left side, exactly like the reference tank.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Tank - BLUE idle, facing SW (down-left)
- **Save as:** `art_raw/tank_blue_idle_sw.png`
- **Type:** EDIT of `tank_blue_idle_ne.png` · **Aspect:** 1:1

```text
Edit this image. Show the SAME unit, identical design, details, colors, size and the flat green background, but turned around on the ground so it now faces diagonally DOWN-LEFT, toward the camera - we see its front and right side. Same 3/4 top-down camera height.
```

### Tank - BLUE firing, facing NE
- **Save as:** `art_raw/tank_blue_fire_ne.png`
- **Type:** EDIT of `tank_blue_idle_ne.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the tank is FIRING its cannon right now - a bright muzzle flash and a burst of smoke at the end of the barrel, slight recoil.
```

### Tank - BLUE firing, facing SW
- **Save as:** `art_raw/tank_blue_fire_sw.png`
- **Type:** EDIT of `tank_blue_idle_sw.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the tank is FIRING its cannon right now - a bright muzzle flash and a burst of smoke at the end of the barrel, slight recoil.
```

### Tank - BLUE destroyed wreck
- **Save as:** `art_raw/tank_blue_wreck.png`
- **Type:** EDIT of `tank_blue_idle_ne.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the tank is DESTROYED - burnt black armor, broken treads, turret knocked crooked, small fires and smoke rising, all lights off.
```

### Tank - RED idle, facing NE (up-right)
- **Save as:** `art_raw/tank_red_idle_ne.png`
- **Type:** EDIT of `tank_blue_idle_ne.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Tank - RED idle, facing SW (down-left)
- **Save as:** `art_raw/tank_red_idle_sw.png`
- **Type:** EDIT of `tank_blue_idle_sw.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Tank - RED firing, facing NE
- **Save as:** `art_raw/tank_red_fire_ne.png`
- **Type:** EDIT of `tank_blue_fire_ne.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Tank - RED firing, facing SW
- **Save as:** `art_raw/tank_red_fire_sw.png`
- **Type:** EDIT of `tank_blue_fire_sw.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Tank - RED destroyed wreck
- **Save as:** `art_raw/tank_red_wreck.png`
- **Type:** EDIT of `tank_blue_wreck.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Mortar Trooper - BLUE idle, facing NE (up-right)
- **Save as:** `art_raw/trooper_blue_idle_ne.png`
- **Type:** TEXT → image, attach: concept image, tank_blue_idle_ne.png · **Aspect:** 1:1
- **Note:** First image of this unit, made from text.

```text
A heavily armored sci-fi infantry soldier in full power armor with an enclosed helmet and glowing visor, carrying a chunky shoulder-mounted mortar launcher tube, standing ready in a combat stance.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, visor and accent stripes.
Facing: the unit faces diagonally UP-RIGHT, away from the camera - we see its back and left side, exactly like the reference tank.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Mortar Trooper - BLUE idle, facing SW (down-left)
- **Save as:** `art_raw/trooper_blue_idle_sw.png`
- **Type:** EDIT of `trooper_blue_idle_ne.png` · **Aspect:** 1:1

```text
Edit this image. Show the SAME unit, identical design, details, colors, size and the flat green background, but turned around on the ground so it now faces diagonally DOWN-LEFT, toward the camera - we see its front and right side. Same 3/4 top-down camera height.
```

### Mortar Trooper - BLUE firing, facing NE
- **Save as:** `art_raw/trooper_blue_fire_ne.png`
- **Type:** EDIT of `trooper_blue_idle_ne.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the soldier is FIRING the shoulder mortar - bright flash and smoke puff at the launcher muzzle, a shell just leaving the tube, slight recoil pose.
```

### Mortar Trooper - BLUE firing, facing SW
- **Save as:** `art_raw/trooper_blue_fire_sw.png`
- **Type:** EDIT of `trooper_blue_idle_sw.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the soldier is FIRING the shoulder mortar - bright flash and smoke puff at the launcher muzzle, a shell just leaving the tube, slight recoil pose.
```

### Mortar Trooper - RED idle, facing NE (up-right)
- **Save as:** `art_raw/trooper_red_idle_ne.png`
- **Type:** EDIT of `trooper_blue_idle_ne.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Mortar Trooper - RED idle, facing SW (down-left)
- **Save as:** `art_raw/trooper_red_idle_sw.png`
- **Type:** EDIT of `trooper_blue_idle_sw.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Mortar Trooper - RED firing, facing NE
- **Save as:** `art_raw/trooper_red_fire_ne.png`
- **Type:** EDIT of `trooper_blue_fire_ne.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Mortar Trooper - RED firing, facing SW
- **Save as:** `art_raw/trooper_red_fire_sw.png`
- **Type:** EDIT of `trooper_blue_fire_sw.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Mine Drone - BLUE idle
- **Save as:** `art_raw/mine_blue_idle.png`
- **Type:** TEXT → image, attach: concept image, tank_blue_idle_ne.png · **Aspect:** 1:1
- **Note:** Symmetric unit - one angle is enough.

```text
A spherical hovering proximity-mine drone: dark armored metal ball with panel seams, a ring of small thrusters underneath, one glowing sensor eye and thin glowing light strips.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, visor and accent stripes.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Mine Drone - BLUE armed (about to explode)
- **Save as:** `art_raw/mine_blue_armed.png`
- **Type:** EDIT of `mine_blue_idle.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the mine is ARMED and about to explode - all lights glowing intensely bright, sharp spikes extended out of the sphere, crackling energy sparks around it.
```

### Mine Drone - RED idle
- **Save as:** `art_raw/mine_red_idle.png`
- **Type:** EDIT of `mine_blue_idle.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Mine Drone - RED armed (about to explode)
- **Save as:** `art_raw/mine_red_armed.png`
- **Type:** EDIT of `mine_blue_armed.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Rocket Launcher - BLUE idle, facing NE (up-right)
- **Save as:** `art_raw/rocket_blue_idle_ne.png`
- **Type:** TEXT → image, attach: concept image, tank_blue_idle_ne.png · **Aspect:** 1:1
- **Note:** First image of this unit, made from text.

```text
A sci-fi tracked missile launcher vehicle: armored cab and a tilted launch rack holding 2 large missiles ready to fire, glowing lights.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, visor and accent stripes.
Facing: the unit faces diagonally UP-RIGHT, away from the camera - we see its back and left side, exactly like the reference tank.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Rocket Launcher - BLUE idle, facing SW (down-left)
- **Save as:** `art_raw/rocket_blue_idle_sw.png`
- **Type:** TEXT → image, attach: rocket_blue_idle_ne.png, tank_blue_idle_sw.png · **Aspect:** 1:1
- **Note:** Edits failed 3 times (kept facing NE), so this is a NEW generation from the two references.

```text
Create a NEW image of the missile launcher vehicle shown in the FIRST attached image - same design, same armor, same twin missile rack, same blue lights - but seen from the OPPOSITE side, facing the SAME direction as the tank in the SECOND attached image: its front cab and the missile tips point toward the BOTTOM-LEFT corner, toward the camera, so we see the front and right side of the launcher. Do not draw the tank.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Rocket Launcher - BLUE just fired, facing NE
- **Save as:** `art_raw/rocket_blue_fired_ne.png`
- **Type:** EDIT of `rocket_blue_idle_ne.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the missiles have just been LAUNCHED - the rack is now empty, bright exhaust flames and thick smoke blasting from the launch rails.
```

### Rocket Launcher - BLUE just fired, facing SW
- **Save as:** `art_raw/rocket_blue_fired_sw.png`
- **Type:** EDIT of `rocket_blue_idle_sw.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the missiles have just been LAUNCHED - the rack is now empty, bright exhaust flames and thick smoke blasting from the launch rails.
```

### Rocket Launcher - RED idle, facing NE (up-right)
- **Save as:** `art_raw/rocket_red_idle_ne.png`
- **Type:** EDIT of `rocket_blue_idle_ne.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Rocket Launcher - RED idle, facing SW (down-left)
- **Save as:** `art_raw/rocket_red_idle_sw.png`
- **Type:** EDIT of `rocket_blue_idle_sw.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Rocket Launcher - RED just fired, facing NE
- **Save as:** `art_raw/rocket_red_fired_ne.png`
- **Type:** EDIT of `rocket_blue_fired_ne.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Rocket Launcher - RED just fired, facing SW
- **Save as:** `art_raw/rocket_red_fired_sw.png`
- **Type:** EDIT of `rocket_blue_fired_sw.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

## Bunker

### Main Bunker - BLUE intact
- **Save as:** `art_raw/bunker_blue_intact.png`
- **Type:** TEXT → image, attach: concept image, tank_blue_idle_ne.png · **Aspect:** 1:1
- **Note:** Bunkers always face front - one angle only.

```text
A massive armored sci-fi command fortress (the MAIN BUNKER): thick concrete-and-steel walls, a heavy blast door at the front, defensive gun turrets on the corners, antennas and a glowing energy core on the roof.

Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Team color: electric blue (#2E9BFF) glowing lights, energy core and accent stripes. Facing: the front blast door faces the camera (bottom of the image).
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Main Bunker - BLUE damaged
- **Save as:** `art_raw/bunker_blue_damaged.png`
- **Type:** EDIT of `bunker_blue_intact.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the bunker is HEAVILY DAMAGED - cracked walls, blown-off armor plates, fires burning on the roof, smoke, flickering lights.
```

### Main Bunker - BLUE destroyed
- **Save as:** `art_raw/bunker_blue_destroyed.png`
- **Type:** EDIT of `bunker_blue_intact.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the bunker is COMPLETELY DESTROYED - collapsed into a smoking pile of rubble and twisted steel, small fires and embers, all lights dead.
```

### Main Bunker - RED intact
- **Save as:** `art_raw/bunker_red_intact.png`
- **Type:** EDIT of `bunker_blue_intact.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Main Bunker - RED damaged
- **Save as:** `art_raw/bunker_red_damaged.png`
- **Type:** EDIT of `bunker_blue_damaged.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Main Bunker - RED destroyed
- **Save as:** `art_raw/bunker_red_destroyed.png`
- **Type:** EDIT of `bunker_blue_destroyed.png` · **Aspect:** 1:1
- **Note:** AUTO - recolored from the blue image.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

## Effects

### Explosion animation (sprite sheet)
- **Save as:** `art_raw/fx_explosion_sheet.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** If the frames come out messy, skip it - the game already has particle explosions.

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 equal square cells showing ONE big fiery explosion animation in order, read left-to-right, top-to-bottom. Frame 1 (top-left) is a tiny white-hot flash, frames 2-6 grow into a huge orange fireball with sparks, frames 7-12 turn into dark smoke with embers, frames 13-16 (bottom-right) fade to thin wisps. Viewed from above. Each frame centered in its own cell, nothing crossing cell borders, no grid lines, no numbers. Realistic VFX style.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### Muzzle flash
- **Save as:** `art_raw/fx_muzzle_flash.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A single bright gun muzzle flash burst seen from above: white-hot core with orange-yellow star-shaped flame spikes. Realistic VFX. Square 1:1 image.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### Missile projectile
- **Save as:** `art_raw/fx_missile.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A single sci-fi missile: white body, red nose tip, small fins, glowing engine nozzle at the back. Pointing straight UP, viewed from above.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Mortar shell
- **Save as:** `art_raw/fx_shell.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A single small dark metal mortar shell glowing orange-hot, viewed from above.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Energy shield dome
- **Save as:** `art_raw/fx_shield_dome.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** Used for both teams - the game tints it blue or red.

```text
A glowing hemispherical energy shield dome made of a hexagon grid pattern: translucent white-cyan light, bright glowing rim at the base, empty inside, seen from 3/4 above like the reference image. Square 1:1 image.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### Blast crater decal
- **Save as:** `art_raw/fx_crater.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A blast crater / scorch mark decal seen straight from above: blackened burnt center, cracked rock, soot spread in a rough circle. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Tracer bolt
- **Save as:** `art_raw/fx_laser_bolt.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** Tinted blue/red by the game.

```text
A single glowing energy tracer bolt: a thin vertical capsule with a white-hot core and a soft glow around it. Square 1:1 image.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

## Environment

### Battlefield ground (seamless)
- **Save as:** `art_raw/env_ground_tile.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A seamless, tileable top-down texture of dark rocky battlefield terrain at night: dark grey-blue cracked rock, gravel, dust, small craters and faint scorch marks, viewed straight from above, even soft lighting. No objects, no grid lines, no text. The left/right and top/bottom edges must tile perfectly. Square 1:1 image.
```

## UI

### FOLD & FIGHT button (no text)
- **Save as:** `art_raw/ui_btn_fold.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 16:9
- **Note:** The game writes the text on top, so it works in Sinhala and English.

```text
A wide glossy capsule-shaped game button plate: hot glowing orange-red energy core inside a dark gunmetal frame, small yellow light bars at both ends, like the button in the reference image but EMPTY.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### FOLD button pressed
- **Save as:** `art_raw/ui_btn_fold_pressed.png`
- **Type:** EDIT of `ui_btn_fold.png` · **Aspect:** 16:9

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the button is PRESSED - slightly darker, glow dimmer, looks pushed in.
```

### Hinge bar
- **Save as:** `art_raw/ui_hinge_bar.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 21:9

```text
A very long, thin horizontal sci-fi metal hinge bar for a foldable device: dark gunmetal with rivets and panel lines, glowing amber indicator lights near both ends and an empty socket in the middle. Perfectly horizontal and stretching the full width of the image.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Sector header bar
- **Save as:** `art_raw/ui_header_bar.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 21:9
- **Note:** Used above each half (ENEMY SECTOR / ALLY SECTOR). Tinted per team.

```text
A thin wide sci-fi HUD header strip: dark translucent glass plate with a bevelled gunmetal edge and a thin glowing white line along the bottom. Perfectly horizontal, stretching the full width.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Unit card frame - blue
- **Save as:** `art_raw/ui_card_blue.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 3:4

```text
A vertical sci-fi unit card frame (trading-card shape): dark metal border with glowing blue edges, empty dark center, small empty badge slot in the top-right corner.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Unit card frame - selected (gold)
- **Save as:** `art_raw/ui_card_gold.png`
- **Type:** EDIT of `ui_card_blue.png` · **Aspect:** 3:4
- **Note:** AUTO - recolored from ui_card_blue.

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing edges to bright gold (#FFC83D) and make the glow stronger.
```

### Round skill button frame
- **Save as:** `art_raw/ui_skill_frame.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A round sci-fi skill button frame: thick gunmetal ring with a glowing cyan inner rim, empty dark glass center.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

# Tier 2 - Menus, UI, icons

## Environment

### Main menu background (vertical)
- **Save as:** `art_raw/bg_menu.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 9:16

```text
Epic vertical key art for a mobile strategy game main menu: a dark rocky battlefield at night. A blue army (armored soldiers, tanks, missile launchers and a glowing blue-domed bunker) at the bottom faces a red army with a red glowing fortress at the top. Laser fire crosses the middle, explosions, sparks, smoke, faint holographic grid lines on the ground. Keep the top 25% darker and simpler (space for the logo) and the bottom 35% darker (space for buttons). Same art style as the reference image. No text. Vertical 9:16 image.
```

## UI

### Button plate - green
- **Save as:** `art_raw/ui_btn_green.png`
- **Type:** EDIT of `ui_btn_fold.png` · **Aspect:** 16:9

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing energy color to green (#3DDC6B). Keep it empty with no text.
```

### Button plate - blue
- **Save as:** `art_raw/ui_btn_blue.png`
- **Type:** EDIT of `ui_btn_fold.png` · **Aspect:** 16:9

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing energy color to blue (#2E9BFF). Keep it empty with no text.
```

### Button plate - red
- **Save as:** `art_raw/ui_btn_red.png`
- **Type:** EDIT of `ui_btn_fold.png` · **Aspect:** 16:9

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing energy color to red (#FF3B3B). Keep it empty with no text.
```

### Button plate - gold
- **Save as:** `art_raw/ui_btn_gold.png`
- **Type:** EDIT of `ui_btn_fold.png` · **Aspect:** 16:9

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: change the glowing energy color to gold (#FFC83D). Keep it empty with no text.
```

### Dialog panel frame
- **Save as:** `art_raw/ui_panel.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 3:4

```text
An empty sci-fi game dialog panel: dark translucent navy-black glass center, bevelled gunmetal border with glowing cyan edge lines and small corner bolts, nothing inside the panel.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Victory banner plate
- **Save as:** `art_raw/ui_banner_victory.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 16:9

```text
A wide golden winged victory banner plate with a ribbon and glowing light rays behind it, empty center area. Sci-fi military style.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Defeat banner plate
- **Save as:** `art_raw/ui_banner_defeat.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 16:9

```text
A wide dark broken steel banner plate with cracks, a dim red glow and drifting smoke, empty center area. Sci-fi military style.
Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, perfectly front-facing and flat (not tilted), NO text or letters anywhere.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

## Icons

### Coin
- **Save as:** `art_raw/icon_coin.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A thick gold coin with an embossed military star emblem and a bevelled rim.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Gem (premium currency)
- **Save as:** `art_raw/icon_gem.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A faceted glowing purple-pink crystal gem.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Trophy
- **Save as:** `art_raw/icon_trophy.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A golden trophy cup with a star on the front and a dark base.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Star (earned)
- **Save as:** `art_raw/icon_star.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A chunky glossy gold star with a thick dark outline.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Star (empty slot)
- **Save as:** `art_raw/icon_star_empty.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A chunky star shape in dark matte gunmetal with a thick outline, unlit.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Skill: Hide / Cloak
- **Save as:** `art_raw/icon_skill_hide.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A glowing purple eye crossed by a diagonal line, stealth-cloak symbol.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Skill: Overcharge
- **Save as:** `art_raw/icon_skill_boost.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A glowing yellow-orange lightning bolt bursting with energy.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Skill: Radar Scan
- **Save as:** `art_raw/icon_skill_radar.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A round green radar screen with a sweeping beam and one red blip.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Skill: Bunker Shield
- **Save as:** `art_raw/icon_skill_shield.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A glowing cyan energy shield with hexagon pattern.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Skill: Fold Preview
- **Save as:** `art_raw/icon_skill_foldpreview.png`
- **Type:** TEXT → image, attach: icon_skill_shield.png, icon_skill_radar.png · **Aspect:** 1:1
- **Note:** Attach the two existing skill icons so it matches the set.

```text
A glowing hologram sheet of paper folding in half along a bright orange crease, small red and blue target dots shining through it.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Lock
- **Save as:** `art_raw/icon_lock.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A heavy steel padlock with a glowing red keyhole.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Turn timer
- **Save as:** `art_raw/icon_timer.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A sci-fi stopwatch with a glowing amber ring.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Sound on
- **Save as:** `art_raw/icon_sound_on.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A metallic speaker with glowing sound waves.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Sound off
- **Save as:** `art_raw/icon_sound_off.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A metallic speaker with a red X.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Settings
- **Save as:** `art_raw/icon_settings.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A metallic gear cog with a glowing cyan center.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### League badge - Bronze
- **Save as:** `art_raw/league_bronze.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.

```text
A military rank emblem badge for the BRONZE league: shield shape with wings and a star, made of bronze metal, simple design. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### League badge - Silver
- **Save as:** `art_raw/league_silver.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.

```text
A military rank emblem badge for the SILVER league: shield shape with wings and a star, made of polished silver metal. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### League badge - Gold
- **Save as:** `art_raw/league_gold.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.

```text
A military rank emblem badge for the GOLD league: shield shape with wings and a star, made of shiny gold with small rubies. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### League badge - Crystal
- **Save as:** `art_raw/league_crystal.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.

```text
A military rank emblem badge for the CRYSTAL league: shield shape with wings and a star, made of glowing purple crystal and silver. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### League badge - Master
- **Save as:** `art_raw/league_master.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.

```text
A military rank emblem badge for the MASTER league: shield shape with wings and a star, made of cyan energy-glowing dark steel. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### League badge - Champion
- **Save as:** `art_raw/league_champion.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.

```text
A military rank emblem badge for the CHAMPION league: shield shape with wings and a star, made of fiery orange-red glowing metal with flames. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### League badge - Legend
- **Save as:** `art_raw/league_legend.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1
- **Note:** Generate Bronze first, then attach it as a reference for the others so they match.

```text
A military rank emblem badge for the LEGEND league: shield shape with wings and a star, made of black obsidian with glowing magenta light and a small crown on top. Higher leagues look more epic. No text.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

## Commanders

### Avatar - You (player)
- **Save as:** `art_raw/avatar_player.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: blue-accented armor, helmet off, short hair, friendly but tough.
```

### Avatar - General Viper
- **Save as:** `art_raw/avatar_viper.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, snake insignia, scarred face, cold stare.
```

### Avatar - Captain Blitz
- **Save as:** `art_raw/avatar_blitz.png`
- **Type:** TEXT → image, attach: concept image, avatar_viper.png · **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, lightning bolt helmet decal, wild grin.
```

### Avatar - Major Kobra
- **Save as:** `art_raw/avatar_kobra.png`
- **Type:** TEXT → image, attach: concept image, avatar_viper.png · **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, hood-shaped helmet, glowing red visor.
```

### Avatar - Sgt. Boomer
- **Save as:** `art_raw/avatar_boomer.png`
- **Type:** TEXT → image, attach: concept image, avatar_viper.png · **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented heavy armor, big beard, cigar, explosives belt.
```

### Avatar - Tanker Bruno
- **Save as:** `art_raw/avatar_bruno.png`
- **Type:** TEXT → image, attach: concept image, avatar_viper.png · **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, tank-crew headset, huge muscular build.
```

### Avatar - Colonel Mango
- **Save as:** `art_raw/avatar_mango.png`
- **Type:** TEXT → image, attach: concept image, avatar_viper.png · **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented armor, orange beret, mustache, medals.
```

### Avatar - Lt. Fizz
- **Save as:** `art_raw/avatar_fizz.png`
- **Type:** TEXT → image, attach: concept image, avatar_viper.png · **Aspect:** 1:1
- **Note:** Attach avatar_viper.png so the portrait style, framing and background match.

```text
Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). No text. Square 1:1 image.
Character: red-accented light armor, goggles on forehead, young and cocky.
```

## Branding

### Game logo
- **Save as:** `art_raw/logo.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 16:9

```text
Game logo with the exact text 'FOLD WARFARE' (spelled exactly like that, two words). 'FOLD' on top in heavy chiselled glowing orange-gold hot metal letters, 'WARFARE' below in brushed steel letters with a blue edge glow. Sci-fi military style, strong 3D bevel, a few sparks. Nothing else.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

## Animations

### Mortar Trooper - BLUE defeated (lying down)
- **Save as:** `art_raw/trooper_blue_dead.png`
- **Type:** EDIT of `trooper_blue_idle_sw.png` · **Aspect:** 1:1
- **Note:** Shown where a trooper dies. Red version is automatic.

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the soldier is DEFEATED - lying flat on the ground on his back, armor scorched, visor dark, the mortar tube dropped beside him, a thin wisp of smoke.
```

### Mortar Trooper - RED defeated
- **Save as:** `art_raw/trooper_red_dead.png`
- **Type:** EDIT of `trooper_blue_dead.png` · **Aspect:** 1:1
- **Note:** AUTO.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Rocket Launcher - BLUE destroyed wreck
- **Save as:** `art_raw/rocket_blue_wreck.png`
- **Type:** EDIT of `rocket_blue_idle_ne.png` · **Aspect:** 1:1

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the launcher is DESTROYED - burnt black armor, launch rack torn off and lying crooked, broken treads, small fires and smoke, all lights off.
```

### Rocket Launcher - RED destroyed wreck
- **Save as:** `art_raw/rocket_red_wreck.png`
- **Type:** EDIT of `rocket_blue_wreck.png` · **Aspect:** 1:1
- **Note:** AUTO.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Main Bunker - BLUE turrets firing
- **Save as:** `art_raw/bunker_blue_firing.png`
- **Type:** EDIT of `bunker_blue_intact.png` · **Aspect:** 1:1
- **Note:** Flashed for a moment when the bunker turret shoots.

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: all corner gun turrets are FIRING at once - bright muzzle flashes and small smoke puffs at every turret barrel.
```

### Main Bunker - RED turrets firing
- **Save as:** `art_raw/bunker_red_firing.png`
- **Type:** EDIT of `bunker_blue_firing.png` · **Aspect:** 1:1
- **Note:** AUTO.

```text
Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, effects and the flat green background. Change only the team color: every blue glowing light, visor and accent stripe becomes bright red (#FF3B3B).
```

### Unit deploy / teleport-in beam (16 frames)
- **Save as:** `art_raw/fx_deploy_sheet.png`
- **Type:** TEXT → image, attach:  · **Aspect:** 1:1
- **Note:** Plays every time a unit is placed. Tinted per team.

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: a holographic DEPLOY effect seen from 3/4 above: frame 1 a tiny spark on the ground, frames 2-5 a bright white-cyan beam of light strikes down from the sky, frames 6-10 a glowing hexagon hologram ring expands on the ground with sparks, frames 11-16 the beam thins out and the ring fades away.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### Smoke puff (16 frames)
- **Save as:** `art_raw/fx_smoke_sheet.png`
- **Type:** TEXT → image, attach:  · **Aspect:** 1:1
- **Note:** Used after hits and on wrecks.

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: a puff of thick grey smoke seen from above: starts small and dense, billows outward and rises, then thins and fades to nothing by the last frame.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### Electric spark / EMP burst (16 frames)
- **Save as:** `art_raw/fx_spark_sheet.png`
- **Type:** TEXT → image, attach:  · **Aspect:** 1:1
- **Note:** Mine arming, shield breaking, radar ping.

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: an electric EMP burst seen from above: crackling white-cyan lightning arcs explode outward from the center, flicker brightly, then fizzle out into small sparks.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### Burning fire loop (16 frames)
- **Save as:** `art_raw/fx_fire_loop_sheet.png`
- **Type:** TEXT → image, attach:  · **Aspect:** 1:1
- **Note:** Loops on wrecks and damaged bunkers.

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: a small cluster of realistic orange-yellow flames burning on the ground, seen from 3/4 above. This is a LOOP: frame 16 must flow smoothly back into frame 1, the flames flicker but stay the same size.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### Shield impact ripple (16 frames)
- **Save as:** `art_raw/fx_shield_hit_sheet.png`
- **Type:** TEXT → image, attach:  · **Aspect:** 1:1
- **Note:** Plays when a shielded bunker is hit.

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: an impact hitting a hexagon energy shield: a bright white flash at the center, a ring of glowing hexagon cells ripples outward, then fades back to nothing.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### Ground shockwave (16 frames)
- **Save as:** `art_raw/fx_shockwave_sheet.png`
- **Type:** TEXT → image, attach:  · **Aspect:** 1:1
- **Note:** Under big explosions and the fold slam.

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: a ground-level blast shockwave seen from 3/4 above: a bright ring of dust and light expands outward from the center and fades, small debris flying out.
Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark.
```

### Gold coin spinning (16 frames)
- **Save as:** `art_raw/fx_coin_spin_sheet.png`
- **Type:** TEXT → image, attach:  · **Aspect:** 1:1
- **Note:** Coins flying to the counter after a win.

```text
A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same scale and position in every cell so the frames line up. No grid lines, no numbers, no text.
Animation: ONE thick gold coin with a military star emblem spinning a full turn around its vertical axis: frame 1 facing front, the thin edge at frame 5, the back at frame 9, the edge again at frame 13, almost front again at frame 16 so it loops smoothly.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

# Tier 3 - Store & extras

## Environment

### Rock cluster prop
- **Save as:** `art_raw/env_rocks.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A small cluster of dark jagged rocks and gravel.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Vehicle wreckage prop
- **Save as:** `art_raw/env_wreckage.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
Scattered burnt wreckage of a destroyed sci-fi vehicle, twisted metal, small embers.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Barricade prop
- **Save as:** `art_raw/env_barricade.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A short sci-fi steel barricade wall with hazard stripes.
Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, glowing team-colored accent lights.
Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - the same camera angle as the reference image.
Composition: exactly ONE object, centered, the entire object fully visible inside the frame with about 10% empty margin on every side. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Loading screen (vertical)
- **Save as:** `art_raw/bg_loading.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 9:16

```text
Vertical loading-screen art for the same game: a close-up of a blue armored mortar trooper and a blue heavy tank advancing through smoke on a dark rocky battlefield, red laser fire in the background, dramatic lighting. Keep the bottom 20% dark for a progress bar. Same art style as the reference image. No text. Vertical 9:16 image.
```

## Store

### Coins - small pack
- **Save as:** `art_raw/store_coins_s.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A small neat stack of gold coins with a military star emblem.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Coins - medium pack
- **Save as:** `art_raw/store_coins_m.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A canvas army sack overflowing with gold coins.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Coins - large pack
- **Save as:** `art_raw/store_coins_l.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
An open armored supply crate overflowing with gold coins, glowing.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Gems - small pack
- **Save as:** `art_raw/store_gems_s.png`
- **Type:** TEXT → image, attach: concept image, store_gems_l.png · **Aspect:** 1:1
- **Note:** Match the look of the attached store image.

```text
A small pile of glowing purple-pink crystal gems.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Gems - medium pack
- **Save as:** `art_raw/store_gems_m.png`
- **Type:** TEXT → image, attach: concept image, store_gems_l.png · **Aspect:** 1:1
- **Note:** Match the look of the attached store image.

```text
A metal tray full of glowing purple-pink crystal gems.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Gems - large pack
- **Save as:** `art_raw/store_gems_l.png`
- **Type:** TEXT → image, attach: concept image, store_gems_l.png · **Aspect:** 1:1
- **Note:** Match the look of the attached store image.

```text
An open sci-fi vault case packed with glowing purple-pink gems, light beams.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Supply chest - closed
- **Save as:** `art_raw/store_chest_closed.png`
- **Type:** EDIT of `store_chest_open.png` · **Aspect:** 1:1
- **Note:** Made from the open chest you already have.

```text
Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the flat green background. Change only this: the chest LID IS CLOSED and locked - no light or sparks coming out, the blue seams still glow softly.
```

### Supply chest - open
- **Save as:** `art_raw/store_chest_open.png`
- **Type:** TEXT → image, attach: store_coins_l.png · **Aspect:** 1:1

```text
The same sci-fi supply chest, lid open, bright golden light and sparks bursting out.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

### Full game unlock
- **Save as:** `art_raw/store_full_unlock.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
A golden commander badge with wings and a glowing key in the middle, premium and epic.
Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, centered, fills about 80% of the frame. Square 1:1 image.
Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, nothing else in the image.
```

## Branding

### App icon
- **Save as:** `art_raw/app_icon.png`
- **Type:** TEXT → image, attach: concept image · **Aspect:** 1:1

```text
Mobile app icon: a blue armored tank and a red armored tank facing each other across a glowing orange fold line in the middle, dark rocky battlefield, dramatic lighting, rounded-square composition, same art style as the reference image. No text. Square 1:1 image.
```

## Later (Phase 2): unit skins

Skins are EDITs of the finished unit images. Same file names with the skin added, e.g. `tank_blue_idle_desert.png`.

- **Desert Camo:** `Edit this image. Keep the exact same unit, pose, size, camera angle and flat green background. Repaint the armor in a sandy desert camouflage pattern; keep the glowing team lights.`
- **Arctic:** `... Repaint the armor white and pale grey with frost and ice crystals on the edges; keep the glowing team lights.`
- **Golden:** `... Repaint the armor in polished gold with black trim; keep the glowing team lights.`
- **Cyber Neon:** `... Repaint the armor glossy black with bright neon circuit lines; keep the glowing team lights.`
