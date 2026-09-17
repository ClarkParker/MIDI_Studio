# v0.3 DSP spec — the performer stage

Handover document for the DSP session. Read
[`02_CONCEPT.md`](02_CONCEPT.md) and [`03_PLATFORM_NOTES.md`](03_PLATFORM_NOTES.md)
first. **Do not start implementing before §7 (verification) has been answered** —
one language question blocks the design.

Working branch: `claude/quirky-allen-pq7tcw` in `ClarkParker/MIDI_Studio`.
Baseline: `alpha/v0.2/MIDIStudioDSP.cmajor`.

---

## 1. Scope

Insert one new stage between table lookup and note emission. Nothing else
changes.

```
   v0.2:  trigger(step) --> play()/emitNote()  -->  midiOut

   v0.3:  trigger(step) --> PERFORMER --> schedule queue --> emitNote() --> midiOut
                              ^
                              |
                   positional hash(seed, bar, step, i, layer)
```

**Non-goals for v0.3:** no chord track, no roles, no phrase length, no MIDI
input handling, no new authored content. Those are v0.4/v0.5.

## 2. Parameter contract

Parameters 1-10 are **unchanged** — same numbers, same names, same ranges, same
semantics. In this kit the parameter number is the contract; renumbering breaks
every saved preset.

Append exactly six:

```cmajor
input event float param11 [[ name: "Drift",    min: 0, max: 100, init: 0,  step: 1, unit: "%" ]];
input event float param12 [[ name: "Seed",     min: 0, max: 999, init: 1,  step: 1 ]];
input event float param13 [[ name: "Swing",    min: 50, max: 75, init: 50, step: 1, unit: "%" ]];
input event float param14 [[ name: "Humanize", min: 0, max: 100, init: 0,  step: 1, unit: "%" ]];
input event float param15 [[ name: "Density",  min: -50, max: 50, init: 0, step: 1, unit: "%" ]];
input event float param16 [[ name: "Accent",   min: 0, max: 100, init: 0,  step: 1, unit: "%" ]];
```

Every one needs an `event paramN (float v)` handler — a declared parameter
without a handler is a hard rule violation.

**The defaults matter:** `Drift 0, Swing 50, Humanize 0, Density 0, Accent 0`
must reproduce v0.2 **bit for bit**. That is the acceptance test in §6.1 and it
is not negotiable — it is what protects existing projects and makes the change
safe to ship.

Do **not** add these to the UI in this session; the UI is a separate task with
its own spec ([`05_UI_SPEC.md`](05_UI_SPEC.md)). Both sessions bind against the
table above.

## 3. The positional hash

The single most important design decision. See
[`03_PLATFORM_NOTES.md#11`](03_PLATFORM_NOTES.md) for why `std::random::RNG` is
not usable here.

**Contract:**

```
    hash01(seed, bar, step, noteIndex, layer) -> float in [0, 1)
```

- **Stateless.** A pure function of its arguments. No fields, no accumulator, no
  call-order dependency. Calling it twice with the same arguments in the same
  block, or a thousand blocks apart, or after a host seek, must give the same
  result.
- **Integer-only mixing**, `float` conversion only at the end. `unsigned`,
  `uint32_t` and `size_t` are banned tokens — work in `int` / `int64` and mask
  to stay non-negative.
- **Decorrelated across `layer`.** Omit, Displace, Add, Velocity and Octave each
  pass a different constant; they must not correlate, or every decision will fire
  on the same notes at once and the result will sound like a stutter, not a
  performance.
- **Cheap.** It runs per candidate note per step inside the audio loop. A few
  multiplies and shifts — no division, no `float` math, no branches.
- `bar` is the **absolute** bar number (from transport slot 5, see §4), not the
  position within the 4-bar loop. This is what makes bar 5 differ from bar 1.

A standard integer finaliser (splitmix/murmur-style: multiply by a large odd
constant, xor-shift, repeat) is the right shape. Verify against the compiler
before building on it (§7).

## 4. Absolute bar number

v0.2 derives bar position as `s / 16`, which is only correct in 4/4 and only
within the loop. The performer needs the **absolute** bar index so that bar 5 is
distinguishable from bar 1.

Take it from transport slot 5 (`barStart`, the PPQ position of the current bar's
start — see [`03_PLATFORM_NOTES.md#12`](03_PLATFORM_NOTES.md)):

```
    barLengthPpq  = numerator * 4 / denominator        // already implemented as getBarLengthPpq()
    absoluteBar   = floorToInt(barStartPpq / max(0.0001, barLengthPpq))
```

Guard it: the kit's older capture calls slot 5 opaque, so cross-check the value
against the locally derived bar and fall back to `floorToInt(currentPpq / barLengthPpq)`
if slot 5 looks implausible (negative, or more than one bar away from
`currentPpq`). Report which one the host actually supplies — that answer goes
back into `03_PLATFORM_NOTES.md`.

## 5. The performer stage

### 5.1 Scheduling changes from step-accurate to PPQ-accurate

This is the structural change. v0.2 emits notes **on integer step boundaries**,
which makes swing and timing humanisation unrepresentable — the two things most
responsible for the mechanical feel.

Mirror the existing note-*off* mechanism, which already works this way
(`activeOffPpq[32]` with per-sample expiry). Add a pending-note queue:

```cmajor
bool[16]    pendingSlots;
int[16]     pendingNote;        // already resolved to a MIDI note number
int[16]     pendingVelocity;
float64[16] pendingOnPpq;       // target time, including swing + humanize
float[16]   pendingDuration;
```

In `main()`, alongside `stopExpiredNotes(currentPpq)`, emit any pending note
whose `pendingOnPpq <= currentPpq`. Emission still goes through `emitNote()` — it
owns the 32-slot allocator, the same-pitch retrigger close, and the note-off
bookkeeping. **Nothing may bypass it.**

16 pending slots is sized for max stored polyphony 5 plus added notes across a
two-step lookahead. Re-check it once Add is implemented; if it overflows, drop
*added* notes first and never a stored one.

### 5.2 Lookahead

Humanize and swing can push a note **earlier** than its step. A note cannot be
emitted before the engine knows about it, so scheduling must run one step ahead:
when the engine reaches step `s`, it schedules the notes belonging to step `s+1`.

Timing offsets are bounded to **±0.5 step**, which one full step of lookahead
covers with margin.

### 5.3 Displacement and the scan window

A note stored at step `t` displaced by `d` sixteenths sounds at `t + d`. With
`d ∈ {-1, 0, +1}`, the notes landing on step `s` come from source steps
`{s+1, s, s-1}`. So scheduling step `s` means scanning three source steps and
keeping those whose displacement resolves to `s`.

Displacement must be computed from the hash of the **source** step, so a note's
displacement is a property of the note, not of where it lands. Otherwise a note
can be scheduled twice or lost at the window edges.

Wrap source steps through `positiveModulo(t, 64)` — and note that a note
displaced across the loop seam belongs to the *next* absolute bar for hashing
purposes.

### 5.4 The four Drift operators

Each decides per candidate note from its own hash layer, scaled by Drift
(`0..1`). All four are inert at Drift = 0.

| Operator | Rule |
|---|---|
| **Omit** | drop if `hash01(OMIT) < drift * 0.35 * weakness`, where `weakness` rises as stored velocity falls. Quiet notes thin out first; accents survive. **Never drop a note on step 0 of a bar** — losing downbeats destroys the pulse. |
| **Displace** | `d = -1 / 0 / +1` from `hash01(DISPLACE)`, with probability `drift * 0.30`. Notes on a beat (`step % 4 == 0`) use **half** that probability — the pulse should wobble less than the subdivisions. |
| **Add** | on a step with no stored note, add one with probability `drift * 0.25`. Pitch comes from the chord tones already sounding in that bar of the stored material — never from outside the current scale. Velocity is well below the bar's mean, so additions read as ghost notes. |
| **Re-voice** | with probability `drift * 0.20`, shift a note by ±12 semitones. **Skip entirely for the drum pattern** (`pattern == 5`) — an octave-shifted kick is a different instrument. |

Drums additionally: Re-voice off, and Add should draw only from pieces already
used in that groove, not the whole GM map.

### 5.5 The three always-on controls

Independent of Drift, because they are taste rather than risk.

**Swing** (50-75%): delays odd-numbered sixteenths. At 50% the offset is zero, at
`p` percent the offset is `(p - 50) / 50 * 0.5` of a step. Applies to the
scheduled PPQ target only; note length is unchanged.

**Humanize** (0-100%): two independent hash layers.
- timing: `±0.12 * humanize` of a step
- velocity: `±18 * humanize` MIDI units, clamped 1..127

Small numbers on purpose. This exists to break the machine-gun repetition, not to
be an effect.

**Accent** (0-100%): crossfades the stored per-note velocity toward a metric
accent curve — strong on the downbeat, medium on the backbeat, weak on offbeats.
At 100% the stored velocities are replaced entirely. This is what fixes the
`[53, 72]` hat alternation in all four drum grooves.

**Density** (-50..+50%): biases Omit (negative) and Add (positive) on top of what
Drift allows. At Drift = 0, Density must still do nothing — Drift is the master
switch for anything that changes the note set. Revisit whether Density and Drift
should merge into one control once both exist and can be played
([`02_CONCEPT.md#10`](02_CONCEPT.md)).

### 5.6 Order of operations

Fixed, because changing it changes the sound:

```
1. read stored notes for the source-step window
2. Omit          (drops notes)
3. Add           (introduces notes)
4. Re-voice      (changes pitch)
5. Accent        (replaces velocity baseline)
6. Humanize vel  (perturbs velocity)
7. Displace      (integer step offset)
8. Swing         (fractional offset)
9. Humanize time (fractional offset)
10. clamp, resolve to MIDI note, push to pending queue
```

## 6. Acceptance tests

### 6.1 Null test — the release gate

With `Drift 0, Swing 50, Humanize 0, Density 0, Accent 0`, v0.3 must emit
**byte-identical MIDI** to v0.2 for all 40 loops, in every key, scale, octave and
speed. If this fails, nothing else matters.

### 6.2 Determinism

- Same seed + same bar → same notes, every repetition.
- Playing from bar 1 to bar 8 and seeking directly to bar 8 produce the same bar 8.
- Identical output at buffer sizes **31, 64, 257 and 511 frames**. This is an
  upstream audit requirement, and the stateless hash should make it true by
  construction — verify it anyway.
- Loop wrap, tempo change while playing, and stop/restart from the same position
  all keep phase.

### 6.3 No stuck notes

The v0.2 note bookkeeping is the strongest part of the patch and must not
regress:

- Every emitted note gets a note-off, including displaced and added ones.
- Transport stop, parameter change and seek all clear pending **and** active
  notes.
- CC123 still fires on stop.
- 32-voice allocator never overflows silently — if it would, drop the *new* note
  rather than orphaning an old one.

Worst case to test: Strings (max polyphony 5), Drift 100%, Density +50%, Speed
Double.

### 6.4 Musical smoke test

Re-run the analyser against captured output and confirm the numbers move:

```bash
python3 tools/analyse_patterns.py alpha/v0.2/MIDIStudioDSP.cmajor
```

At Drift 30% the "same sixteenths fire in all 4 bars" count should collapse from
32/40 toward 0/40. If it does not, Drift is not doing its job.

## 7. Verify before building

Answer these against the compiler first — they change the implementation:

1. **Integer ops.** Are hex literals, `int64`, `<<`, `>>`, `^`, `&` and wrapping
   multiplication all available and well-defined? Is right-shift on a negative
   `int` arithmetic or logical? The hash design depends on the answer; if 64-bit
   mixing is unavailable, fall back to 32-bit with masking to 31 bits.
2. **Table storage.** v0.2 uses `let` for the four data tables, which the current
   upstream generation policy forbids (`03_PLATFORM_NOTES.md#3`). Confirm whether
   `const int[2561]` compiles as a processor-scope constant. If it does, migrate;
   if not, keep `let` and record the exception.
3. **Transport slot 5.** Does the running Amorph build actually supply `barStart`
   there, as upstream documents, or the opaque value the kit capture describes?
   Log it from a live session. §4 depends on this.
4. **Cost.** 16 pending slots + 32 active slots scanned per sample, plus the hash
   per candidate note per step. Measure before assuming it is free.

Report the answers back into `03_PLATFORM_NOTES.md` — they are useful to the UI
session and to the maker regardless of what we build.
