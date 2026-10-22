"""Single source of truth for game audio: which raw file feeds each in-game sound and how it is cut.

Raw files live in audio_raw/ (Pixabay downloads) and audio_raw/kenney/ (Kenney CC0 packs).
`npm run audio` (tools/process_audio.py) trims, layers, normalizes and encodes them into public/audio/
plus public/audio/manifest.json, which the game loads at boot. Any sound without a file here keeps
its synthesized fallback in src/audio/sfx.ts.

Clip fields:
  file      path relative to audio_raw/
  start/end seconds to keep (end=None keeps the rest)
  fade_in / fade_out seconds
  rate      pitch/speed multiplier (1.4 = higher and shorter)
  gain_db   level change before layering
  delay     seconds of silence before this layer (layers only)
A sound variant is either one clip or {"layers": [clip, ...]} mixed together.
"""

K = "kenney/"


def clip(file, start=0.0, end=None, fade_in=0.0, fade_out=0.0, rate=1.0, gain_db=0.0, delay=0.0):
    return {"file": file, "start": start, "end": end, "fade_in": fade_in, "fade_out": fade_out, "rate": rate, "gain_db": gain_db, "delay": delay}


def layers(*clips):
    return {"layers": list(clips)}


# volume = playback level in the mix (0..1). Variants rotate randomly with slight pitch variation in game.
SFX = {
    # ---- weapons ----
    "cannon": {"volume": 0.85, "variants": [
        clip("canon.mp3", end=1.65, fade_out=0.5),
        clip("canon2.mp3", start=0.12, end=2.6, fade_out=0.9),
    ]},
    "mortar_fire": {"volume": 0.6, "variants": [
        clip("canon2.mp3", start=0.15, end=1.4, fade_out=0.5, rate=1.45),
        clip("canon.mp3", end=1.0, fade_out=0.4, rate=1.6),
    ]},
    # Falling-shell whistles; the game plays the tail so the whistle ends right at impact.
    "mortar_whistle": {"volume": 0.45, "variants": [
        clip("mortar_whistle.mp3.mp3", start=11.55, end=15.0, fade_in=0.2, fade_out=0.05),
        clip("mortar_whistle.mp3.mp3", start=17.85, end=21.35, fade_in=0.2, fade_out=0.05),
    ]},
    "rocket": {"volume": 0.7, "variants": [
        clip("rocket_launch.mp3", start=4.15, end=6.2, fade_in=0.03, fade_out=0.7),
        clip("rocket_launch.mp3", start=4.25, end=6.0, fade_in=0.03, fade_out=0.6, rate=1.12),
    ]},
    # Bunker turret: three quick high-pitched cannon cracks.
    "turret": {"volume": 0.5, "variants": [
        layers(clip("canon.mp3", end=0.22, fade_out=0.12, rate=2.2),
               clip("canon.mp3", end=0.22, fade_out=0.12, rate=2.35, delay=0.07),
               clip("canon.mp3", end=0.3, fade_out=0.18, rate=2.1, delay=0.14)),
    ]},
    # ---- explosions ----
    "explosion_big": {"volume": 1.0, "variants": [
        clip("explosion_big.mp3", end=1.6, fade_out=0.4),
        layers(clip("explosion_big3.mp3", fade_out=0.6, gain_db=6), clip(K + "lowFrequency_explosion_000.ogg", end=1.6, fade_out=0.6, gain_db=-4)),
    ]},
    "explosion_medium": {"volume": 0.8, "variants": [
        clip("mortar_whistle.mp3.mp3", start=8.38, end=9.9, fade_out=0.6),
        clip("mortar_whistle.mp3.mp3", start=15.05, end=16.5, fade_out=0.6),
        clip("mortar_whistle.mp3.mp3", start=21.45, end=22.9, fade_out=0.6),
        clip(K + "lowFrequency_explosion_001.ogg", end=1.5, fade_out=0.5),
    ]},
    "explosion_small": {"volume": 0.7, "variants": [
        clip(K + "explosionCrunch_000.ogg"),
        clip(K + "explosionCrunch_001.ogg"),
        clip(K + "explosionCrunch_002.ogg"),
    ]},
    # ---- crash / fold ----
    "crash": {"volume": 0.8, "variants": [
        layers(clip(K + "impactMetal_heavy_000.ogg"), clip(K + "impactPlate_heavy_000.ogg", gain_db=-3)),
        layers(clip(K + "impactMetal_heavy_001.ogg"), clip(K + "impactPlate_heavy_001.ogg", gain_db=-3)),
        layers(clip(K + "impactMetal_heavy_002.ogg"), clip(K + "impactPlate_heavy_002.ogg", gain_db=-3)),
    ]},
    "slam": {"volume": 1.0, "variants": [
        layers(clip(K + "impactPunch_heavy_000.ogg"), clip(K + "lowFrequency_explosion_000.ogg", end=1.4, fade_out=0.6, gain_db=-2),
               clip("explosion_big.mp3", end=1.2, fade_out=0.6, gain_db=-12)),
    ]},
    "place": {"volume": 0.55, "variants": [
        clip(K + "impactPlate_medium_000.ogg"),
        clip(K + "impactPlate_medium_001.ogg"),
        clip(K + "impactPlate_medium_002.ogg"),
    ]},
    # ---- shields ----
    "shield_up": {"volume": 0.55, "variants": [clip(K + "forceField_000.ogg"), clip(K + "forceField_001.ogg")]},
    "shield_break": {"volume": 0.6, "variants": [
        clip(K + "impactGlass_heavy_000.ogg"), clip(K + "impactGlass_heavy_001.ogg"), clip(K + "impactGlass_heavy_002.ogg"),
    ]},
    # ---- interface ----
    "click": {"volume": 0.4, "variants": [clip(K + "click_001.ogg"), clip(K + "click_002.ogg"), clip(K + "click_003.ogg")]},
    "select": {"volume": 0.45, "variants": [clip(K + "select_002.ogg"), clip(K + "select_003.ogg")]},
    "invalid": {"volume": 0.45, "variants": [clip(K + "error_004.ogg"), clip(K + "error_005.ogg")]},
    "tick": {"volume": 0.35, "variants": [clip(K + "tick_001.ogg"), clip(K + "tick_002.ogg")]},
    "turn_start": {"volume": 0.5, "variants": [clip(K + "confirmation_001.ogg"), clip(K + "confirmation_002.ogg")]},
    # ---- announcer ----
    "voice_fire_in_the_hole": {"volume": 0.9, "variants": [clip(K + "voice_war_fire_in_the_hole.ogg")]},
    "voice_target_destroyed": {"volume": 0.9, "variants": [clip(K + "voice_war_target_destroyed.ogg")]},
    "voice_mission_completed": {"volume": 0.9, "variants": [clip(K + "voice_mission_completed.ogg")]},
    "voice_mission_failed": {"volume": 0.9, "variants": [clip(K + "voice_mission_failed.ogg")]},
    "voice_its_a_tie": {"volume": 0.9, "variants": [clip(K + "voice_its_a_tie.ogg")]},
    "voice_ready": {"volume": 0.85, "variants": [clip(K + "voice_ready.ogg")]},
    "voice_go": {"volume": 0.85, "variants": [clip(K + "voice_go.ogg")]},
    "voice_final_round": {"volume": 0.85, "variants": [clip(K + "voice_final_round.ogg")]},
}

# Loops: `xfade` seconds of the tail are blended into the head so the loop has no seam.
MUSIC = {
    "menu": {"volume": 0.32, "file": "music_menu.mp3", "start": 0.0, "end": 32.0, "xfade": 0.8},
    "placement": {"volume": 0.3, "file": "music_menu2.mp3", "start": 1.2, "end": 38.2, "xfade": 1.0},
    # Only the first ~10 s of this track is full-energy; a longer battle loop would repeat less.
    "battle": {"volume": 0.34, "file": "music_battle.mp3", "start": 0.0, "end": 10.45, "xfade": 0.45},
}

CREDITS = [
    ("Pixabay (pixabay.com, Pixabay Content License)", "canon.mp3, canon2.mp3, explosion_big.mp3, explosion_big3.mp3, mortar_whistle.mp3.mp3, rocket_launch.mp3, music_menu.mp3, music_menu2.mp3, music_battle.mp3"),
    ("Kenney (kenney.nl, CC0 1.0)", "Impact Sounds, Sci-Fi Sounds, Interface Sounds, Voiceover Pack"),
]
