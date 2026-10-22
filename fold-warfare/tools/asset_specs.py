"""
Single source of truth for every generated art asset: its Nano Banana prompt, file name,
and how tools/process_assets.py cleans it up. tools/build_prompt_pack.py turns this into
docs/ASSET_PROMPTS.md + docs/asset_prompts.html.
"""

# ---------- Shared prompt blocks ----------

STYLE = (
    "Art style: match the attached reference image exactly - dark sci-fi military, highly detailed 3D game render, "
    "premium mobile strategy game quality, realistic gunmetal and armor materials, dramatic rim lighting, "
    "glowing team-colored accent lights."
)
CAMERA = (
    "Camera: 3/4 top-down view looking down at about 60 degrees with slight perspective - "
    "the same camera angle as the reference image."
)
FRAME = (
    "Composition: exactly ONE object, centered, the entire object fully visible inside the frame "
    "with about 10% empty margin on every side. Square 1:1 image."
)
GREEN = (
    "Background: completely flat, solid pure green (#00FF00) chroma-key color filling the whole background - "
    "no gradient, no floor, no ground plane, no cast shadow, no reflections, no text, no logo, no watermark, "
    "nothing else in the image."
)
BLACK = "Background: completely solid pure black (#000000), nothing else in the image, no text, no watermark."
BLUE = "Team color: electric blue (#2E9BFF) glowing lights, visor and accent stripes."
FACING_NE = (
    "Facing: the unit faces diagonally UP-RIGHT, away from the camera - we see its back and left side, "
    "exactly like the reference tank."
)
ICON = (
    "Style: polished 3D mobile game icon, bold readable silhouette, glossy materials, soft rim light, front view, "
    "centered, fills about 80% of the frame. Square 1:1 image."
)

ANCHOR = "tank_blue_idle_ne.png"

TO_RED = (
    "Edit this image. Keep EVERYTHING exactly the same - design, pose, angle, size, position, lighting, damage, "
    "effects and the flat green background. Change only the team color: every blue glowing light, visor and "
    "accent stripe becomes bright red (#FF3B3B)."
)

TURN_AROUND = (
    "Edit this image. Show the SAME unit, identical design, details, colors, size and the flat green background, "
    "but turned around on the ground so it now faces diagonally DOWN-LEFT, toward the camera - we see its front "
    "and right side. Same 3/4 top-down camera height."
)


ROCKET_TURN_AROUND = (
    "Edit the FIRST image (the missile launcher). Rotate the vehicle 180 degrees on the ground so it faces the "
    "SAME direction as the tank in the SECOND image: the front cab and the missile tips point toward the BOTTOM-LEFT "
    "corner of the image, toward the camera. We now see the front and the right side of the launcher. Keep the "
    "launcher's design, colors, blue lights, size and the flat green background exactly the same. Do not copy the "
    "tank - only use it as a guide for the direction."
)


ROCKET_SW_FRESH = (
    "Create a NEW image of the missile launcher vehicle shown in the FIRST attached image - same design, same "
    "armor, same twin missile rack, same blue lights - but seen from the OPPOSITE side, facing the SAME direction "
    "as the tank in the SECOND attached image: its front cab and the missile tips point toward the BOTTOM-LEFT corner, "
    "toward the camera, so we see the front and right side of the launcher. Do not draw the tank.\n\n"
    f"{STYLE}\n{CAMERA}\n{FRAME}\n{GREEN}"
)


def unit(subject):
    return f"{subject}\n\n{STYLE}\n{CAMERA}\n{BLUE}\n{FACING_NE}\n{FRAME}\n{GREEN}"


def edit(change):
    return (
        "Edit this image. Keep the exact same unit, design, colors, size, position, camera angle, lighting and the "
        f"flat green background. Change only this: {change}"
    )


# ---------- Asset list ----------
# mode: key   = green chroma key -> transparent, trimmed, fit inside `size`
#       black = black background -> alpha from brightness (glows, fire, energy)
#       tile  = resize to exact size, no trim (seamless textures)
#       cover = resize + crop to exact size (full-screen art)
#       plain = resize to fit, keep background (avatars, app icon)

SPECS = []


# Assets whose own artwork is green: the keyer must not strip or neutralise that green.
KEEP_GREEN = {"icon_skill_radar", "ui_btn_green"}


def add(file, tier, group, title, mode, size, prompt=None, edit_of=None, aspect="1:1", note="", refs=None,
        done=False, derive=None, grid=None):
    if refs is None:
        unit_like = group in ("Units", "Bunker")
        refs = [] if edit_of else (["concept image", ANCHOR] if unit_like else ["concept image"])
    SPECS.append(
        dict(file=file, tier=tier, group=group, title=title, mode=mode, size=size, prompt=prompt,
             edit_of=edit_of, aspect=aspect, note=note, refs=refs, done=done, keep_green=file in KEEP_GREEN,
             derive=derive, grid=grid)
    )


# Angled units: NE (faces up-right, away) + SW (faces down-left, toward camera). The game mirrors them
# horizontally for NW / SE, so 2 images cover 4 directions.
UNITS = [
    dict(
        key="tank", name="Tank", size=320, angled=True,
        subject="A heavy armored sci-fi battle tank: wide caterpillar treads, thick angular armor plates, a large "
                "turret with one long main cannon, small antennas and a sensor pod.",
        states=[
            ("fire", "Firing", True, "the tank is FIRING its cannon right now - a bright muzzle flash and a burst of "
                                     "smoke at the end of the barrel, slight recoil."),
            ("wreck", "Destroyed wreck", False, "the tank is DESTROYED - burnt black armor, broken treads, turret "
                                                "knocked crooked, small fires and smoke rising, all lights off."),
        ],
    ),
    dict(
        key="trooper", name="Mortar Trooper", size=300, angled=True,
        subject="A heavily armored sci-fi infantry soldier in full power armor with an enclosed helmet and glowing "
                "visor, carrying a chunky shoulder-mounted mortar launcher tube, standing ready in a combat stance.",
        states=[
            ("fire", "Firing", True, "the soldier is FIRING the shoulder mortar - bright flash and smoke puff at the "
                                     "launcher muzzle, a shell just leaving the tube, slight recoil pose."),
        ],
    ),
    dict(
        key="mine", name="Mine Drone", size=260, angled=False,
        subject="A spherical hovering proximity-mine drone: dark armored metal ball with panel seams, a ring of small "
                "thrusters underneath, one glowing sensor eye and thin glowing light strips.",
        states=[
            ("armed", "Armed (about to explode)", False, "the mine is ARMED and about to explode - all lights glowing "
                                                         "intensely bright, sharp spikes extended out of the sphere, "
                                                         "crackling energy sparks around it."),
        ],
    ),
    dict(
        key="rocket", name="Rocket Launcher", size=320, angled=True,
        subject="A sci-fi tracked missile launcher vehicle: armored cab and a tilted launch rack holding 2 large "
                "missiles ready to fire, glowing lights.",
        states=[
            ("fired", "Just fired", True, "the missiles have just been LAUNCHED - the rack is now empty, bright "
                                          "exhaust flames and thick smoke blasting from the launch rails."),
        ],
    ),
]

for u in UNITS:
    key, name, size = u["key"], u["name"], u["size"]
    blue_files = []
    if u["angled"]:
        base = f"{key}_blue_idle_ne"
        add(base, 1, "Units", f"{name} - BLUE idle, facing NE (up-right)", "key", size,
            prompt=unit(u["subject"]), done=key == "tank",
            refs=["concept image"] if key == "tank" else None,
            note="DONE - provided by you. This is the style anchor for everything else." if key == "tank"
            else "First image of this unit, made from text.")
        if key == "rocket":
            add(f"{key}_blue_idle_sw", 1, "Units", f"{name} - BLUE idle, facing SW (down-left)", "key", size,
                prompt=ROCKET_SW_FRESH, refs=["rocket_blue_idle_ne.png", "tank_blue_idle_sw.png"],
                note="Edits failed 3 times (kept facing NE), so this is a NEW generation from the two references.")
        else:
            add(f"{key}_blue_idle_sw", 1, "Units", f"{name} - BLUE idle, facing SW (down-left)", "key", size,
                prompt=TURN_AROUND, edit_of=base)
        blue_files += [base, f"{key}_blue_idle_sw"]
        for state, title, both, change in u["states"]:
            for angle in (("ne", "sw") if both else ("ne",)):
                f = f"{key}_blue_{state}_{angle}" if both else f"{key}_blue_{state}"
                add(f, 1, "Units", f"{name} - BLUE {title.lower()}" + (f", facing {angle.upper()}" if both else ""),
                    "key", size, prompt=edit(change), edit_of=f"{key}_blue_idle_{angle}")
                blue_files.append(f)
    else:
        base = f"{key}_blue_idle"
        add(base, 1, "Units", f"{name} - BLUE idle", "key", size,
            prompt=unit(u["subject"]).replace(FACING_NE + "\n", ""), note="Symmetric unit - one angle is enough.")
        blue_files.append(base)
        for state, title, _, change in u["states"]:
            f = f"{key}_blue_{state}"
            add(f, 1, "Units", f"{name} - BLUE {title.lower()}", "key", size, prompt=edit(change), edit_of=base)
            blue_files.append(f)
    for f in blue_files:
        red = f.replace("_blue_", "_red_")
        title = next(s["title"] for s in SPECS if s["file"] == f).replace("BLUE", "RED")
        add(red, 1, "Units", title, "key", size, prompt=TO_RED, edit_of=f, derive=("to_red", f),
            note="AUTO - recolored from the blue image by tools/team_swap.py. Only generate if the auto version looks wrong.")

BUNKER = (
    "A massive armored sci-fi command fortress (the MAIN BUNKER): thick concrete-and-steel walls, a heavy blast door "
    "at the front, defensive gun turrets on the corners, antennas and a glowing energy core on the roof."
)
BUNKER_FACING = "Facing: the front blast door faces the camera (bottom of the image)."
add("bunker_blue_intact", 1, "Bunker", "Main Bunker - BLUE intact", "key", 400,
    prompt=(f"{BUNKER}\n\n{STYLE}\n{CAMERA}\nTeam color: electric blue (#2E9BFF) glowing lights, energy core and "
            f"accent stripes. {BUNKER_FACING}\n{FRAME}\n{GREEN}"),
    note="Bunkers always face front - one angle only.")
add("bunker_blue_damaged", 1, "Bunker", "Main Bunker - BLUE damaged", "key", 400,
    prompt=edit("the bunker is HEAVILY DAMAGED - cracked walls, blown-off armor plates, fires burning on the roof, "
                "smoke, flickering lights."), edit_of="bunker_blue_intact")
add("bunker_blue_destroyed", 1, "Bunker", "Main Bunker - BLUE destroyed", "key", 400,
    prompt=edit("the bunker is COMPLETELY DESTROYED - collapsed into a smoking pile of rubble and twisted steel, "
                "small fires and embers, all lights dead."), edit_of="bunker_blue_intact")
for state in ("intact", "damaged", "destroyed"):
    add(f"bunker_red_{state}", 1, "Bunker", f"Main Bunker - RED {state}", "key", 400, prompt=TO_RED,
        edit_of=f"bunker_blue_{state}", derive=("to_red", f"bunker_blue_{state}"),
        note="AUTO - recolored from the blue image.")

# ---------- Battle effects ----------

add("fx_explosion_sheet", 1, "Effects", "Explosion animation (sprite sheet)", "black", 1024, prompt=(
    "A sprite sheet for a video game: a 4 by 4 grid of 16 equal square cells showing ONE big fiery explosion "
    "animation in order, read left-to-right, top-to-bottom. Frame 1 (top-left) is a tiny white-hot flash, frames 2-6 "
    "grow into a huge orange fireball with sparks, frames 7-12 turn into dark smoke with embers, frames 13-16 "
    "(bottom-right) fade to thin wisps. Viewed from above. Each frame centered in its own cell, nothing crossing cell "
    f"borders, no grid lines, no numbers. Realistic VFX style.\n{BLACK}"),
    note="If the frames come out messy, skip it - the game already has particle explosions.", grid=(4, 4))
add("fx_muzzle_flash", 1, "Effects", "Muzzle flash", "black", 256, prompt=(
    "A single bright gun muzzle flash burst seen from above: white-hot core with orange-yellow star-shaped flame "
    f"spikes. Realistic VFX. Square 1:1 image.\n{BLACK}"))
add("fx_missile", 1, "Effects", "Missile projectile", "key", 160, prompt=(
    "A single sci-fi missile: white body, red nose tip, small fins, glowing engine nozzle at the back. Pointing "
    f"straight UP, viewed from above.\n{STYLE}\n{FRAME}\n{GREEN}"))
add("fx_shell", 1, "Effects", "Mortar shell", "key", 96, prompt=(
    f"A single small dark metal mortar shell glowing orange-hot, viewed from above.\n{STYLE}\n{FRAME}\n{GREEN}"))
add("fx_shield_dome", 1, "Effects", "Energy shield dome", "black", 512, prompt=(
    "A glowing hemispherical energy shield dome made of a hexagon grid pattern: translucent white-cyan light, bright "
    "glowing rim at the base, empty inside, seen from 3/4 above like the reference image. Square 1:1 image.\n" + BLACK),
    note="Used for both teams - the game tints it blue or red.")
add("fx_crater", 1, "Effects", "Blast crater decal", "key", 256, prompt=(
    "A blast crater / scorch mark decal seen straight from above: blackened burnt center, cracked rock, soot spread "
    f"in a rough circle. Square 1:1 image.\n{GREEN}"))
add("fx_laser_bolt", 1, "Effects", "Tracer bolt", "black", 128, prompt=(
    "A single glowing energy tracer bolt: a thin vertical capsule with a white-hot core and a soft glow around it. "
    f"Square 1:1 image.\n{BLACK}"), note="Tinted blue/red by the game.")

# ---------- Environment ----------

add("env_ground_tile", 1, "Environment", "Battlefield ground (seamless)", "tile", 1024, prompt=(
    "A seamless, tileable top-down texture of dark rocky battlefield terrain at night: dark grey-blue cracked rock, "
    "gravel, dust, small craters and faint scorch marks, viewed straight from above, even soft lighting. No objects, "
    "no grid lines, no text. The left/right and top/bottom edges must tile perfectly. Square 1:1 image."))
add("env_rocks", 3, "Environment", "Rock cluster prop", "key", 256, prompt=(
    f"A small cluster of dark jagged rocks and gravel.\n{STYLE}\n{CAMERA}\n{FRAME}\n{GREEN}"))
add("env_wreckage", 3, "Environment", "Vehicle wreckage prop", "key", 256, prompt=(
    f"Scattered burnt wreckage of a destroyed sci-fi vehicle, twisted metal, small embers.\n{STYLE}\n{CAMERA}\n{FRAME}\n{GREEN}"))
add("env_barricade", 3, "Environment", "Barricade prop", "key", 256, prompt=(
    f"A short sci-fi steel barricade wall with hazard stripes.\n{STYLE}\n{CAMERA}\n{FRAME}\n{GREEN}"))
add("bg_menu", 2, "Environment", "Main menu background (vertical)", "cover", (1080, 1920), aspect="9:16", prompt=(
    "Epic vertical key art for a mobile strategy game main menu: a dark rocky battlefield at night. A blue army "
    "(armored soldiers, tanks, missile launchers and a glowing blue-domed bunker) at the bottom faces a red army with "
    "a red glowing fortress at the top. Laser fire crosses the middle, explosions, sparks, smoke, faint holographic "
    "grid lines on the ground. Keep the top 25% darker and simpler (space for the logo) and the bottom 35% darker "
    "(space for buttons). Same art style as the reference image. No text. Vertical 9:16 image."))
add("bg_loading", 3, "Environment", "Loading screen (vertical)", "cover", (1080, 1920), aspect="9:16", prompt=(
    "Vertical loading-screen art for the same game: a close-up of a blue armored mortar trooper and a blue heavy tank "
    "advancing through smoke on a dark rocky battlefield, red laser fire in the background, dramatic lighting. Keep "
    "the bottom 20% dark for a progress bar. Same art style as the reference image. No text. Vertical 9:16 image."))

# ---------- UI kit ----------

UI = (
    "Style: sci-fi military mobile game UI, dark gunmetal and glass, glowing edge lights, crisp and clean, "
    "perfectly front-facing and flat (not tilted), NO text or letters anywhere."
)
add("ui_btn_fold", 1, "UI", "FOLD & FIGHT button (no text)", "key", 900, aspect="16:9", prompt=(
    "A wide glossy capsule-shaped game button plate: hot glowing orange-red energy core inside a dark gunmetal frame, "
    f"small yellow light bars at both ends, like the button in the reference image but EMPTY.\n{UI}\n{GREEN}"),
    note="The game writes the text on top, so it works in Sinhala and English.")
add("ui_btn_fold_pressed", 1, "UI", "FOLD button pressed", "key", 900, aspect="16:9",
    prompt=edit("the button is PRESSED - slightly darker, glow dimmer, looks pushed in."), edit_of="ui_btn_fold")
for color, hexv in (("green", "#3DDC6B"), ("blue", "#2E9BFF"), ("red", "#FF3B3B"), ("gold", "#FFC83D")):
    add(f"ui_btn_{color}", 2, "UI", f"Button plate - {color}", "key", 900, aspect="16:9",
        prompt=edit(f"change the glowing energy color to {color} ({hexv}). Keep it empty with no text."),
        edit_of="ui_btn_fold")
add("ui_hinge_bar", 1, "UI", "Hinge bar", "key", 1440, aspect="21:9", prompt=(
    "A very long, thin horizontal sci-fi metal hinge bar for a foldable device: dark gunmetal with rivets and panel "
    "lines, glowing amber indicator lights near both ends and an empty socket in the middle. Perfectly horizontal and "
    f"stretching the full width of the image.\n{UI}\n{GREEN}"))
add("ui_header_bar", 1, "UI", "Sector header bar", "key", 1440, aspect="21:9", prompt=(
    "A thin wide sci-fi HUD header strip: dark translucent glass plate with a bevelled gunmetal edge and a thin "
    f"glowing white line along the bottom. Perfectly horizontal, stretching the full width.\n{UI}\n{GREEN}"),
    note="Used above each half (ENEMY SECTOR / ALLY SECTOR). Tinted per team.")
add("ui_panel", 2, "UI", "Dialog panel frame", "key", 900, aspect="3:4", prompt=(
    "An empty sci-fi game dialog panel: dark translucent navy-black glass center, bevelled gunmetal border with "
    f"glowing cyan edge lines and small corner bolts, nothing inside the panel.\n{UI}\n{GREEN}"))
add("ui_card_blue", 1, "UI", "Unit card frame - blue", "key", 384, aspect="3:4", prompt=(
    "A vertical sci-fi unit card frame (trading-card shape): dark metal border with glowing blue edges, empty dark "
    f"center, small empty badge slot in the top-right corner.\n{UI}\n{GREEN}"))
add("ui_card_gold", 1, "UI", "Unit card frame - selected (gold)", "key", 384, aspect="3:4",
    prompt=edit("change the glowing edges to bright gold (#FFC83D) and make the glow stronger."), edit_of="ui_card_blue",
    derive=("to_gold", "ui_card_blue"), note="AUTO - recolored from ui_card_blue.")
add("ui_skill_frame", 1, "UI", "Round skill button frame", "key", 192, prompt=(
    f"A round sci-fi skill button frame: thick gunmetal ring with a glowing cyan inner rim, empty dark glass center.\n{UI}\n{GREEN}"))
add("ui_banner_victory", 2, "UI", "Victory banner plate", "key", 1024, aspect="16:9", prompt=(
    "A wide golden winged victory banner plate with a ribbon and glowing light rays behind it, empty center area. "
    f"Sci-fi military style.\n{UI}\n{GREEN}"))
add("ui_banner_defeat", 2, "UI", "Defeat banner plate", "key", 1024, aspect="16:9", prompt=(
    "A wide dark broken steel banner plate with cracks, a dim red glow and drifting smoke, empty center area. "
    f"Sci-fi military style.\n{UI}\n{GREEN}"))

# ---------- Icons & currency ----------

ICONS = [
    ("icon_coin", "Coin", "A thick gold coin with an embossed military star emblem and a bevelled rim."),
    ("icon_gem", "Gem (premium currency)", "A faceted glowing purple-pink crystal gem."),
    ("icon_trophy", "Trophy", "A golden trophy cup with a star on the front and a dark base."),
    ("icon_star", "Star (earned)", "A chunky glossy gold star with a thick dark outline."),
    ("icon_star_empty", "Star (empty slot)", "A chunky star shape in dark matte gunmetal with a thick outline, unlit."),
    ("icon_skill_hide", "Skill: Hide / Cloak", "A glowing purple eye crossed by a diagonal line, stealth-cloak symbol."),
    ("icon_skill_boost", "Skill: Overcharge", "A glowing yellow-orange lightning bolt bursting with energy."),
    ("icon_skill_radar", "Skill: Radar Scan", "A round green radar screen with a sweeping beam and one red blip."),
    ("icon_skill_shield", "Skill: Bunker Shield", "A glowing cyan energy shield with hexagon pattern."),
    ("icon_skill_foldpreview", "Skill: Fold Preview", "A glowing hologram sheet of paper folding in half along a bright orange crease, small red and blue target dots shining through it."),
    ("icon_lock", "Lock", "A heavy steel padlock with a glowing red keyhole."),
    ("icon_timer", "Turn timer", "A sci-fi stopwatch with a glowing amber ring."),
    ("icon_sound_on", "Sound on", "A metallic speaker with glowing sound waves."),
    ("icon_sound_off", "Sound off", "A metallic speaker with a red X."),
    ("icon_settings", "Settings", "A metallic gear cog with a glowing cyan center."),
]
for file, title, subject in ICONS:
    refs = ["icon_skill_shield.png", "icon_skill_radar.png"] if file == "icon_skill_foldpreview" else None
    add(file, 2, "Icons", title, "key", 192, prompt=f"{subject}\n{ICON}\n{GREEN}", refs=refs,
        note="Attach the two existing skill icons so it matches the set." if refs else "")

LEAGUES = [
    ("bronze", "bronze metal, simple design"),
    ("silver", "polished silver metal"),
    ("gold", "shiny gold with small rubies"),
    ("crystal", "glowing purple crystal and silver"),
    ("master", "cyan energy-glowing dark steel"),
    ("champion", "fiery orange-red glowing metal with flames"),
    ("legend", "black obsidian with glowing magenta light and a small crown on top"),
]
for name, material in LEAGUES:
    add(f"league_{name}", 2, "Icons", f"League badge - {name.title()}", "key", 256, prompt=(
        f"A military rank emblem badge for the {name.upper()} league: shield shape with wings and a star, made of "
        f"{material}. Higher leagues look more epic. No text.\n{ICON}\n{GREEN}"),
        note="Generate Bronze first, then attach it as a reference for the others so they match.")

# ---------- Commanders (avatars) ----------

AVATAR = (
    "Square game avatar portrait, head and shoulders, of a sci-fi army commander in power armor, confident "
    "expression, cinematic lighting, same art style as the reference image, solid dark navy background (#0B1220). "
    "No text. Square 1:1 image."
)
COMMANDERS = [
    ("avatar_player", "You (player)", "blue-accented armor, helmet off, short hair, friendly but tough"),
    ("avatar_viper", "General Viper", "red-accented armor, snake insignia, scarred face, cold stare"),
    ("avatar_blitz", "Captain Blitz", "red-accented armor, lightning bolt helmet decal, wild grin"),
    ("avatar_kobra", "Major Kobra", "red-accented armor, hood-shaped helmet, glowing red visor"),
    ("avatar_boomer", "Sgt. Boomer", "red-accented heavy armor, big beard, cigar, explosives belt"),
    ("avatar_bruno", "Tanker Bruno", "red-accented armor, tank-crew headset, huge muscular build"),
    ("avatar_mango", "Colonel Mango", "red-accented armor, orange beret, mustache, medals"),
    ("avatar_fizz", "Lt. Fizz", "red-accented light armor, goggles on forehead, young and cocky"),
]
for file, title, look in COMMANDERS:
    add(file, 2, "Commanders", f"Avatar - {title}", "plain", 256, prompt=f"{AVATAR}\nCharacter: {look}.",
        refs=["concept image", "avatar_viper.png"] if file not in ("avatar_player", "avatar_viper") else None,
        note="Attach avatar_viper.png so the portrait style, framing and background match." if file not in ("avatar_player", "avatar_viper") else "")

# ---------- Store ----------

STORE = [
    ("store_coins_s", "Coins - small pack", "A small neat stack of gold coins with a military star emblem."),
    ("store_coins_m", "Coins - medium pack", "A canvas army sack overflowing with gold coins."),
    ("store_coins_l", "Coins - large pack", "An open armored supply crate overflowing with gold coins, glowing."),
    ("store_gems_s", "Gems - small pack", "A small pile of glowing purple-pink crystal gems."),
    ("store_gems_m", "Gems - medium pack", "A metal tray full of glowing purple-pink crystal gems."),
    ("store_gems_l", "Gems - large pack", "An open sci-fi vault case packed with glowing purple-pink gems, light beams."),
    ("store_chest_closed", "Supply chest - closed", "A locked sci-fi military supply chest with glowing blue seams."),
    ("store_chest_open", "Supply chest - open", "The same sci-fi supply chest, lid open, bright golden light and sparks bursting out."),
    ("store_full_unlock", "Full game unlock", "A golden commander badge with wings and a glowing key in the middle, premium and epic."),
]
for file, title, subject in STORE:
    if file == "store_chest_closed":
        add(file, 3, "Store", title, "key", 384, edit_of="store_chest_open",
            prompt=edit("the chest LID IS CLOSED and locked - no light or sparks coming out, the blue seams still glow "
                        "softly."), note="Made from the open chest you already have.")
        continue
    if file == "store_chest_open":
        add(file, 3, "Store", title, "key", 384, prompt=f"{subject}\n{ICON}\n{GREEN}", refs=["store_coins_l.png"])
        continue
    refs = ["concept image", "store_gems_l.png"] if file.startswith("store_gems") else None
    add(file, 3, "Store", title, "key", 384, prompt=f"{subject}\n{ICON}\n{GREEN}", refs=refs,
        note=("Match the look of the attached store image." if refs else ""))

# ---------- Branding ----------

add("logo", 2, "Branding", "Game logo", "key", 1024, aspect="16:9", prompt=(
    "Game logo with the exact text 'FOLD WARFARE' (spelled exactly like that, two words). 'FOLD' on top in heavy "
    "chiselled glowing orange-gold hot metal letters, 'WARFARE' below in brushed steel letters with a blue edge glow. "
    "Sci-fi military style, strong 3D bevel, a few sparks. Nothing else.\n" + GREEN))
add("app_icon", 3, "Branding", "App icon", "plain", 1024, prompt=(
    "Mobile app icon: a blue armored tank and a red armored tank facing each other across a glowing orange fold "
    "line in the middle, dark rocky battlefield, dramatic lighting, rounded-square composition, same art style as "
    "the reference image. No text. Square 1:1 image."))

# ---------- Animations ----------
# Extra STATE images (edits, blue only - red is automatic) + 4x4 effect SPRITE SHEETS.
# Unit motion itself (bob, recoil, lunge, hover, drop-in) is done in code; AI sprite sheets of walking
# characters come out inconsistent frame-to-frame, so they are deliberately not used.

SHEET = (
    "A sprite sheet for a video game: a 4 by 4 grid of 16 EQUAL square cells, one animation in order, read "
    "left-to-right, top-to-bottom. Each frame centered in its own cell, nothing crossing cell borders, the same "
    "scale and position in every cell so the frames line up. No grid lines, no numbers, no text."
)


def sheet(file, title, motion, bg=BLACK, mode="black", note="", grid=(4, 4)):
    add(file, 2, "Animations", title, mode, 1024, prompt=f"{SHEET}\nAnimation: {motion}\n{bg}", grid=grid, refs=[],
        note=note or "Team-neutral: the game tints it blue or red.")


add("trooper_blue_dead", 2, "Animations", "Mortar Trooper - BLUE defeated (lying down)", "key", 300,
    prompt=edit("the soldier is DEFEATED - lying flat on the ground on his back, armor scorched, visor dark, the "
                "mortar tube dropped beside him, a thin wisp of smoke."), edit_of="trooper_blue_idle_sw",
    note="Shown where a trooper dies. Red version is automatic.")
add("trooper_red_dead", 2, "Animations", "Mortar Trooper - RED defeated", "key", 300, prompt=TO_RED,
    edit_of="trooper_blue_dead", derive=("to_red", "trooper_blue_dead"), note="AUTO.")
add("rocket_blue_wreck", 2, "Animations", "Rocket Launcher - BLUE destroyed wreck", "key", 320,
    prompt=edit("the launcher is DESTROYED - burnt black armor, launch rack torn off and lying crooked, broken "
                "treads, small fires and smoke, all lights off."), edit_of="rocket_blue_idle_ne")
add("rocket_red_wreck", 2, "Animations", "Rocket Launcher - RED destroyed wreck", "key", 320, prompt=TO_RED,
    edit_of="rocket_blue_wreck", derive=("to_red", "rocket_blue_wreck"), note="AUTO.")
add("bunker_blue_firing", 2, "Animations", "Main Bunker - BLUE turrets firing", "key", 400,
    prompt=edit("all corner gun turrets are FIRING at once - bright muzzle flashes and small smoke puffs at "
                "every turret barrel."), edit_of="bunker_blue_intact",
    note="Flashed for a moment when the bunker turret shoots.")
add("bunker_red_firing", 2, "Animations", "Main Bunker - RED turrets firing", "key", 400, prompt=TO_RED,
    edit_of="bunker_blue_firing", derive=("to_red", "bunker_blue_firing"), note="AUTO.")

sheet("fx_deploy_sheet", "Unit deploy / teleport-in beam (16 frames)",
      "a holographic DEPLOY effect seen from 3/4 above: frame 1 a tiny spark on the ground, frames 2-5 a bright "
      "white-cyan beam of light strikes down from the sky, frames 6-10 a glowing hexagon hologram ring expands "
      "on the ground with sparks, frames 11-16 the beam thins out and the ring fades away.",
      note="Plays every time a unit is placed. Tinted per team.")
sheet("fx_smoke_sheet", "Smoke puff (16 frames)",
      "a puff of thick grey smoke seen from above: starts small and dense, billows outward and rises, then thins "
      "and fades to nothing by the last frame.", note="Used after hits and on wrecks.")
sheet("fx_spark_sheet", "Electric spark / EMP burst (16 frames)",
      "an electric EMP burst seen from above: crackling white-cyan lightning arcs explode outward from the center, "
      "flicker brightly, then fizzle out into small sparks.", note="Mine arming, shield breaking, radar ping.")
sheet("fx_fire_loop_sheet", "Burning fire loop (16 frames)",
      "a small cluster of realistic orange-yellow flames burning on the ground, seen from 3/4 above. This is a "
      "LOOP: frame 16 must flow smoothly back into frame 1, the flames flicker but stay the same size.",
      note="Loops on wrecks and damaged bunkers.")
sheet("fx_shield_hit_sheet", "Shield impact ripple (16 frames)",
      "an impact hitting a hexagon energy shield: a bright white flash at the center, a ring of glowing hexagon "
      "cells ripples outward, then fades back to nothing.", note="Plays when a shielded bunker is hit.")
sheet("fx_shockwave_sheet", "Ground shockwave (16 frames)",
      "a ground-level blast shockwave seen from 3/4 above: a bright ring of dust and light expands outward from "
      "the center and fades, small debris flying out.", note="Under big explosions and the fold slam.")
sheet("fx_coin_spin_sheet", "Gold coin spinning (16 frames)",
      "ONE thick gold coin with a military star emblem spinning a full turn around its vertical axis: frame 1 "
      "facing front, the thin edge at frame 5, the back at frame 9, the edge again at frame 13, almost front again "
      "at frame 16 so it loops smoothly.",
      bg=GREEN, mode="key_sheet", note="Coins flying to the counter after a win.")
