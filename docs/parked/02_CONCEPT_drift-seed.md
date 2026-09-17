# MIDI Studio v0.3 — Concept

**One direction, as asked for: stop shipping results, start shipping a performer.**

> v0.2 has 40 fixed results.
> v0.3 should have 40 *starting points* and a dice with a memory.

---

## 1. The diagnosis in one line

The patch does not feel fixed because it has too few compositions. It feels fixed
because **the rhythm never moves**: 32 of its 40 loops are one bar of rhythm
repeated four times, 24 of 40 replay an identical velocity sequence every bar,
and every onset sits exactly on a sixteenth. See
[`01_ALPHA_ANALYSIS.md`](../01_ALPHA_ANALYSIS.md) for the measurements.

So the answer to *"better rhythm or harmony?"* is **rhythm, clearly**. The
harmony is already fine — the stored degrees trace real progressions and move
every bar. It is the rhythmic mask on top that is frozen.

## 2. The core move

Today a "composition" is one welded row in a table: **when**, **what** and **how
loud** are baked together and cannot be touched independently. Nothing in the
engine can decide anything.

The concept is to split that into two layers:

```
   MATERIAL  (keep!)          PERFORMANCE  (new)
   the 40 authored loops  ->  a seeded per-bar re-interpretation  ->  MIDI out
   = "what to play"           = "how to play it this time round"
```

The 40 authored loops are good content and stay exactly as they are. They stop
being the output and become the **input** to a performer that decides, for each
bar, which notes survive, which shift, which are added, and how hard they are
played.

## 3. The pivot: Seed + Drift

Two parameters carry the whole idea.

**Drift (0-100%)** — how far a bar may depart from the stored cell.

- At **Drift = 0 the output is bit-identical to v0.2.** Nothing anyone has
  already made breaks, and there is no "new version sounds different" problem.
- At 20-40% it is the same piece, played by a human who does not repeat
  themselves.
- At 100% the material is a suggestion.

**Seed (0-999)** — reproducible randomness.

This one is not optional. *Surprise without recall is just noise.* A generator
that cannot reproduce the take it just played is not a composing tool — the user
hears something great, touches a knob, and it is gone forever. With a seed, every
result has an address. "Seed 412, Drift 35%" is a piece of music you can write
down, send to someone, and get back.

The UI pairing is a **Roll** button next to a seed readout: press until something
is good, then stop. That is the entire interaction, and it is the thing v0.2 is
missing.

## 4. Why this also solves the content problem

The randomness must be a **pure function of position, not a running state**:

```
    value = hash(seed, absoluteBar, step, layer)     // no state, no accumulator
```

That has one consequence that changes the product: **bar 5 is not bar 1**. The
same 64-step table, read at different absolute bar numbers, produces a different
performance every time — deterministically. A **Phrase Length** control
(4 / 8 / 16 / 32 bars) then turns the existing 40 loops into 16- and 32-bar
phrases that develop and *then* repeat.

That is variation without any new data. It matters, because the current growth
path is closed: **the four lookup tables are 77% of the DSP source file.** Every
new composition costs source size linearly and still ships a fixed result. Adding
presets is the most expensive axis with the smallest return — and there are
already 8 rhythmic duplicates among the 40.

Position-based hashing also keeps the engine's best property intact: the host can
seek anywhere and the engine still produces the correct note for that bar,
because nothing depends on how it got there. A bounced take equals the live take.

## 5. What Drift actually does to a bar

Four independent operators, each scaled by Drift, each deciding per note from the
positional hash:

| Operator | At Drift = 0 | At Drift = 100% |
|---|---|---|
| **Omit** | every stored note plays | up to ~35% of notes drop out (weakest first) |
| **Displace** | onsets exactly on the grid | a note may move +-1 sixteenth, never across a beat |
| **Add** | nothing added | ghost notes / passing tones on empty steps, from the current chord |
| **Re-voice** | stored octave | a note may jump an octave or take a different chord tone |

Plus three always-on performance controls that are independent of Drift, because
they are taste, not risk:

- **Swing (50-75%)** — delays every second sixteenth. The engine already
  schedules in fractional PPQ, so this is nearly free.
- **Humanize (0-100%)** — small timing and velocity jitter. Removes the
  machine-gun hats without touching the composition.
- **Accent (0-100%)** — velocity shaped by metric position (downbeat, backbeat,
  offbeat), replacing the frozen per-note velocities. This alone fixes the
  `[53, 72]` hat problem in all four grooves.

## 6. Answering the four options directly

| The maker asked | Answer |
|---|---|
| more control? | **Yes — but six knobs, not sixty.** They must be *performance* controls (Drift, Seed, Swing, Humanize, Density, Accent), not more selectors over fixed content. |
| more surprising ideas? | **Yes — but only with a seed.** Un-reproducible surprise is unusable in composing. |
| better rhythm or harmony? | **Rhythm.** By the numbers, the harmony already moves and the rhythm does not. |
| another direction? | **This is it:** loop player → performer. It subsumes the first three. |
| more compositions? | **No.** 77% of the source is already tables, 8 of 40 are rhythmic duplicates, and a 41st fixed loop is still fixed. |

## 7. What stays untouched

Everything that is already right, and there is a lot of it:

- The six-slot `transportIn` handling, discontinuity detection against the raw
  previous packet, backwards-jump and forward-seek resets.
- 32-slot note tracking, same-pitch retrigger handling, per-sample note-off
  expiry, CC123 on stop. No stuck notes — this must not regress.
- Parameters 1-10 keep their numbers and meanings. In this kit **the parameter
  number is the contract**; new controls append at 11+.
- The 40 authored loops, byte for byte.
- The UI's shell: `createPatchView` default export, paired connect/disconnect,
  listener teardown, keyboard access, ARIA roles.

## 8. Staging

Deliberately small first step — this is the "one direction this week" the maker
asked for.

**v0.3 — the performer** (the whole concept above)
Params 11-16: Drift, Seed, Swing, Humanize, Density, Accent. Plus a Roll button
and a seed readout in the UI. One new engine stage between table lookup and
`emitNote`. Backwards compatible at Drift = 0.

**v0.4 — the arranger**
Lift harmony out of the tables into an explicit chord track (root + quality per
bar), so Key/Scale stop being a global transpose. Add Phrase Length (4/8/16/32)
and a Fill control. Introduce *roles* (Bass / Chords / Arp / Lead / Pad / Drums)
so the instrument selector stops being ten hard-coded special cases.

**v0.5 — the instrument**
Make `midiIn` do something: chord-follow (play a chord, the generator follows it),
keyboard transpose, and trigger/latch. This is what turns it from a generator you
listen to into one you play. Plus a capture path so a good take can leave the
plugin.

## 9. Open questions for the maker

1. **Is Drift = 0 backwards compatibility a requirement?** We think yes, and the
   design assumes it. It costs nothing and it protects existing projects.
2. **How many parameters is too many?** We propose six new ones. If the ceiling
   is lower, Drift + Seed + Swing alone already deliver most of the effect.
3. **Should the seed be per-instrument or global?** Global is simpler and keeps
   multiple instances in sync; per-instrument lets one part be re-rolled without
   disturbing the others. We lean global for v0.3.
4. **Is a MIDI-input direction (v0.5) wanted at all**, or should MIDI Studio stay
   a pure generator? This changes the product category, so it is the maker's call,
   not ours.

## 10. Risks we can see

- **Drift must never break the note bookkeeping.** Displaced and added notes go
  through the same 32-slot allocator and the same expiry path; nothing may bypass
  `emitNote`. Stuck notes would be a far worse regression than boredom.
- **Displacement across a step boundary needs care**, because the scheduler fires
  on integer step transitions. A note moved *later* must be scheduled by the step
  it lands on, not the step it came from.
- **32 voices may not be enough** once Add is at full Drift on a 5-voice Strings
  pattern. The slot count should be re-checked, not assumed.
- **The hash must be cheap.** It runs per note per step inside the audio loop.
  Integer-only, no division, no floats.
- **Density and Drift overlap.** They may need to be one control. To be settled
  when the DSP prototype exists, not before.
