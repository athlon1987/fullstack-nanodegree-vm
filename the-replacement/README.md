# The Replacement

A 7-minute animated short film (sci-fi thriller / human drama), produced entirely in code.

> *The world found a better version of him. But his family didn't need a better man.*

There are two finished versions in `film/`, both 1080p H.264 + AAC with the same story, timing
and soundtrack:

- `the-replacement.mp4` — the original: every character is a silhouette, read by outline,
  posture and light.
- `the-replacement-lit.mp4` — the same film with the characters drawn in colour: skin,
  clothing, faces, and directional light and shadow that follow each scene, plus lens bloom.
  It reads as a stylized animated feature rather than live-action footage.

Each file carries two audio tracks: the full mix, and a music-and-effects track with no
voices. Dialogue is subtitled in the picture.

Nothing in it is filmed, sampled or downloaded at render time:

- **Picture** — every frame is drawn on an HTML canvas as a pure function of time
  (`src/`), rendered frame by frame in headless Chromium and encoded with ffmpeg.
- **Voices** — synthesized locally with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx)
  (Apache-2.0). The recordings are committed in `audio/vo/`.
- **Score and sound** — an original score and all sound effects are synthesized in Python
  (`audio/`).

## Story

Adam, 44, is failing at everything, most of all at being a father. A government programme
replaces him with a better version of himself, and everyone prefers the replacement. When he
goes home to say goodbye, the one thing the replacement cannot explain is a note his daughter
once hid in his lunchbox. She chooses her real father; the replacement restores his life and
shuts down. A week later Adam learns that the original Adam died eighteen months ago, and that
he is Replacement Version 2.

The ending follows the note at the bottom of the treatment: the final messages say only *"You
are Replacement Version 2." / "Version 1 has been retired." / "You were selected."* — with no
explanation that Version 1 was built to teach him anything. The treatment's original wording
is one string away, in `src/acts/ui_phone.js` (shot `a7_08_v2`).

## Rebuilding the film

Requirements: Node 20+, [Playwright](https://playwright.dev) with Chromium, ffmpeg, and
Python 3.10+ with `numpy scipy soundfile`.

```bash
cd the-replacement
node tools/export-timeline.mjs            # validate the timeline, write build/timeline.json

python3 audio/score.py                    # music            -> audio/out/music.wav
python3 audio/sfx.py                      # ambience + foley -> audio/out/sfx.wav
python3 audio/mix.py                      # dialogue + mix   -> audio/out/mix.wav, mix_me.wav

node tools/render.mjs --audio none --master build/master.mkv --out build/picture.mp4
tools/package.sh                          # -> film/the-replacement.mp4

# the lit-character version: the same shots drawn with the rig's "lit" style
node tools/render.mjs --style lit --audio none --master build/master-lit.mkv --out build/picture-lit.mp4
MASTER=build/master-lit.mkv OUT=film/the-replacement-lit.mp4 tools/package.sh
```

The picture render takes roughly ten minutes on four cores (about fifteen for the lit style). To re-voice the dialogue, edit
`audio/dialogue.json`, download the two Kokoro model files named at the top of `audio/tts.py`
into `.cache/kokoro/`, `pip install kokoro-onnx`, and run `python3 audio/tts.py`; that also
regenerates the line durations the timeline is built around.

Looking at work in progress:

```bash
node tools/still.mjs --list                                        # every shot with its timing
node tools/still.mjs --sheet --act 5 --step 3 --out build/act5.png # contact sheet of an act
node tools/still.mjs --shot a5_05_note --at 0.6 --out build/note.png
node tools/still.mjs --style lit --sheet --act 6 --step 3 --out build/act6-lit.png   # any tool takes --style lit
node tools/render.mjs --act 6 --scale 0.5 --out build/act6.mp4     # quick half-size preview
```

## Layout

| Path | What it is |
|---|---|
| `src/timeline.js` | The master timeline: every shot, its duration, direction notes, sync events and dialogue cues. Picture and sound both key off it. |
| `src/engine.js` | The runtime: timeline, camera, letterbox, grain, subtitles, drawing helpers. |
| `src/rig.js` | The character rig: side-view puppets with poses and IK, in two styles — silhouette (default) and lit. |
| `src/sets/` | Locations (kitchen, bedroom and corridor, office, government hall, school, street, night bench). |
| `src/props.js`, `src/ui.js` | The lunchbox, the note and other props; the phone and screen-graphics kit. |
| `src/acts/` | The shots themselves, one function per shot. |
| `audio/` | Dialogue synthesis, the synth engine, score, sound effects and mix. |
| `tools/` | Stills and contact sheets, benchmark, renderer, packaging. |
| `STYLE.md` | The house style every shot follows. |

## Credits and licences

- Voices: Kokoro TTS, Apache-2.0.
- Fonts (in `assets/fonts/`, SIL Open Font License 1.1, licence texts alongside): Inter,
  IBM Plex Mono, Cormorant Garamond, Gloria Hallelujah, Patrick Hand.
