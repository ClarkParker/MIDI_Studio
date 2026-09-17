# What MIDI Studio v0.2 actually does

Measured, not guessed. Every number below is reproduced by:

```bash
python3 tools/amorph_extract.py alpha/v0.2/MIDI_Studio_v0.2.amorph -o alpha/v0.2
python3 tools/analyse_patterns.py alpha/v0.2/MIDIStudioDSP.cmajor --grids
```

---

## 1. The engine in one paragraph

`MIDIStudio` is a **transport-locked table playback engine**. It takes the host's
PPQ position from the six-slot `transportIn` packet, converts it to a step index
(`step = floor(ppq / tickPpq)`), wraps that into a 64-step window
(`s = step mod 64` — four bars of sixteenths), and plays back whatever notes are
stored at that slot. It never decides anything; it looks everything up.

All musical content lives in four parallel `let` tables:

| Table | Size | Meaning |
|---|---|---|
| `offsets` | 2561 | CSR index — notes for step `s` are `[offsets[s], offsets[s+1])` |
| `degrees` | 1337 | scale degree (raw GM note number for the drum pattern) |
| `durations` | 1337 | length in ticks |
| `velocities` | 1337 | 1..127 |

`slot = (pattern * 4 + variation) * 64 + step`, giving
**10 patterns x 4 variations x 64 steps = 40 four-bar loops, 1337 notes total.**

Pitched patterns go through `play()` → `scaleOffset()`, which maps a scale degree
onto major/minor and adds key root, octave shift and the per-instrument base note
(`bases[10]`). The drum pattern (index 5) bypasses that and emits raw GM notes.

## 2. What the ten parameters really control

| # | Name | What it changes |
|---|---|---|
| 1 | Instrument | which of the 10 tables to read, and the base octave |
| 2 | Key | a constant added to every note |
| 3 | Scale | major vs minor lookup row in `scaleOffset` |
| 4 | Octave Shift | a constant added to every note |
| 5 | Speed | tick size: 1/8, 1/16 or 1/32 (`0.5 / 0.25 / 0.125` PPQ) |
| 6 | Length | note-off distance, as a fraction of the stored duration |
| 7 | Velocity | scales every stored velocity by `v / 96` |
| 8 | MIDI Channel | output channel |
| 9 | Enabled | mute |
| 10 | Variation | which of the 4 tables for this instrument to read |

**Nine of the ten are global constants applied to a fixed result.** Only
parameters 1 and 10 change the notes, and they do so by swapping one frozen table
for another. There is no parameter anywhere that changes *how* a phrase is built.

## 3. Why it "feels too fixed" — the measurement

This is the core finding. The complaint is precise and it is about **rhythm, not
harmony**.

```
advertised compositions ........... 40
distinct 4-bar onset maps ......... 32
distinct 1-bar rhythm cells ....... 39
same sixteenths fire in all 4 bars. 32/40
...and the same note count per step 28/40
loops with identical velocity/bar.. 24/40
total stored notes ................ 1337
```

**32 of the 40 loops are a one-bar rhythm repeated four times.** Only Electric
Keys and Drums vary at all, and only in bars 2 and 4 (one extra note; a closing
fill). The harmony does move — bar-by-bar degrees trace real progressions
(`I vi IV V`, `i VI iv v`, ...) — but it moves *underneath an unchanging rhythmic
mask*. Guitar is the clearest case: all four of its ideas are literally bar 1
transposed diatonically by `[-2,-4,-3]` and friends, with the same eight
sixteenth-note onsets in every bar of every idea.

The grid makes it visible (`--grids`), e.g. Guitar idea 1:

```
x.x.x.x.x.x.x.x.|x.x.x.x.x.x.x.x.|x.x.x.x.x.x.x.x.|x.x.x.x.x.x.x.x.
```

Velocity is just as frozen. **24 of 40 loops replay an identical velocity
sequence every bar**, and the drum hats alternate between exactly two values for
all 32 hits of every groove:

```
closed-hat velocities used: [53, 72]
```

Add to that: every onset sits exactly on a sixteenth. There is no swing, no
timing deviation, no probability, no humanisation anywhere in the engine — the
scheduler emits on integer step boundaries and nothing else is representable.

## 4. The four "ideas" are not variations

`param10` does not vary a phrase; it selects a different stored phrase. There is
no relationship between idea 1 and idea 2 of the same instrument beyond both
being authored for the same instrument. So the user cannot ask for "this, but a
bit different" — only "this" or "that other thing". Of the 40 advertised
compositions, **32 have a distinct onset map, so 8 are rhythmic duplicates** of
another loop.

## 5. Structural limits that block growth

- **Fixed 4 bars, fixed 4/4.** The loop window is hard-coded to 64 sixteenths.
  `transportIn` slots 2 and 3 *do* read the host time signature, but the only
  thing they do with it is `resetScheduler()`. The source comment is explicit:
  `// Packet terminator; loops are fixed 4/4 phrases.`
- **Content does not scale.** The four tables are **31841 of the 41491 characters
  in the DSP file — 77% of the source**. Doubling the library doubles the source.
  Adding presets is the axis that costs the most and returns the least.
- **No input.** `midiIn` handles exactly one thing: all-notes-off / all-sound-off
  → reset. You cannot play a chord into it, transpose it from a keyboard, or
  drive it from a clip. For a tool meant "for composing", this is the biggest
  single gap.
- **Nothing is addressable after the fact.** The MIDI output itself is not the
  problem — it goes to the host like any MIDI generator's and can be armed and
  recorded onto a track. What is missing is a *name* for what you just heard:
  the plugin has no seed, no state to freeze, no way to say "keep that one". If
  the user nudges a parameter, the previous result is not recoverable, because
  nothing ever identified it.
- **Drums ignore key/scale/octave** (correct), but the UI disables those controls
  by index (`v.param1===5`) — the special case is wired into both layers by hand.

## 6. What is already good and must be kept

The transport handling is the strong part of this patch and should survive any
rewrite intact:

- Every valid host packet is authoritative; discontinuity is detected against the
  **previous raw packet**, never the extrapolated position, so block re-anchors
  cannot double-fire.
- Backwards jumps and forward seeks both reset cleanly.
- `emitNote` closes a prior copy of the same pitch/channel before retriggering —
  correct handling of MIDI 1.0's inability to identify overlapping same-pitch
  notes.
- 32 tracked note slots with per-sample expiry, plus an all-notes-off CC123 on
  stop. No stuck notes.
- Phase-locking to absolute PPQ means the loop always lines up with the host's
  bar grid, including after a seek.

The UI is likewise sound as a shell: correct `createPatchView` default export,
paired `connectedCallback` / `disconnectedCallback`, listeners removed on
teardown, keyboard-accessible controls, `aria-pressed` / `role="slider"` set
throughout.

**The problem is not the engineering. The problem is that the engine has nothing
to decide.**
