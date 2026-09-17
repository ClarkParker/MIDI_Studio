# MIDI Studio

Concept and development work on **MIDI Studio**, a MIDI-generator plugin for the
[Amorph](https://artistsindsp.com) host, contributed to the maker's beta group.

The maker shipped an alpha (v0.2) and asked the group one question:

> "it has a few compositions and variations, but still feels too fixed. i'd like
> it to become more useful for composing. what would change?"

**Our answer, in one line:** v0.2 is a disassembled band — ten roles that were
authored as one arrangement but cannot hear each other or take direction. The
direction is not more loops and not more randomness; it is **chord follow**: the
parts play the chords the user gives them, so the output becomes the user's.

Concept: [`docs/02_CONCEPT.md`](docs/02_CONCEPT.md) (draft v1, under discussion).

---

## Status

| Stage | State |
|---|---|
| Alpha v0.2 analysis | done |
| Concept | draft v1 — under discussion |
| DSP implementation | not started — follows the concept |
| UI implementation | not started — follows the concept |

## Repository layout

```
alpha/v0.2/                  the maker's alpha, as received
  MIDI_Studio_v0.2.amorph      original patch file (XML bundle)
  MIDIStudioDSP.cmajor         extracted DSP source
  MIDIStudioUI.js              extracted UI module
  NOTES.md                     provenance

docs/
  01_ALPHA_ANALYSIS.md       what v0.2 actually does, measured
  02_CONCEPT.md              the concept — read this one
  03_PLATFORM_NOTES.md       Amorph/Cmajor constraints + v0.2 compliance findings
  parked/                    an earlier Drift/Seed direction, kept for reference

tools/
  amorph_extract.py          pull DSP + UI source out of any .amorph file
  analyse_patterns.py        measure how much variety a pattern table holds
```

## Reproducing the analysis

Both tools are pure stdlib Python 3.8+, no dependencies.

```bash
# unpack a patch
python3 tools/amorph_extract.py alpha/v0.2/MIDI_Studio_v0.2.amorph -o alpha/v0.2

# measure it
python3 tools/analyse_patterns.py alpha/v0.2/MIDIStudioDSP.cmajor
python3 tools/analyse_patterns.py alpha/v0.2/MIDIStudioDSP.cmajor --grids
```

`analyse_patterns.py` decodes the four parallel lookup tables in the v0.2 DSP
(`offsets`, `degrees`, `durations`, `velocities`) and reports onset maps, chord
sizes, velocity repetition and drum-kit usage per loop. Re-run it against any
later revision to check that a change added variety rather than rows.

Current baseline:

```
advertised compositions ........... 40
distinct 4-bar onset maps ......... 32
distinct 1-bar rhythm cells ....... 39
same sixteenths fire in all 4 bars. 32/40
...and the same note count per step 28/40
loops with identical velocity/bar.. 24/40
total stored notes ................ 1337
```

## Related repositories

- **`ClarkParker/Amorph_DEV_KIt`** — the verified Amorph/Cmajor plugin dev kit
  (architecture, parameters, transport, testing, linting tools). Working rules
  for every session live in its `CLAUDE.md`.
- **`ClarkParker/amorph-for-agents`** — fork of the maker's official agent
  documentation. Authoritative on host behaviour; wins over kit captures on
  conflict.

## Credits

Alpha v0.2 by **Laurenz Fregnan** (Artists in DSP). This repository contains
analysis and proposals contributed by a beta-group member; the alpha patch is
included unmodified for reference.
