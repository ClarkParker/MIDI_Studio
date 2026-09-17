# MIDI Studio — Concept

**Status: draft v2, 2026-09-17.** Supersedes v1. Built on the alpha analysis
([`01`](01_ALPHA_ANALYSIS.md)), the platform notes ([`03`](03_PLATFORM_NOTES.md)),
the market and technology analysis ([`07`](07_MARKET_ANALYSIS.md)) and the
maker's brief. Decisions taken so far by the beta contributors are marked
**[decided]**; everything the maker still has to confirm is in §12.

---

## 1. Purpose

Help a producer get from nothing to a **good chord progression** fast, and hear
it played by a small band — inside one plugin, editable as blocks, offline,
and transparent about *why* a suggestion is good.

## 2. What it is today, in one paragraph

MIDI Studio v0.2 is a MIDI-only plugin that plays forty authored four-bar
loops in sync with the host: ten roles × four "ideas", chords baked into every
loop, no chord input, no way to say what you want. Measured, it is a
disassembled band — all ten roles were written against one shared progression
per idea, but nothing in the plugin represents that progression, and 32 of 40
loops are one bar of rhythm repeated four times. In the market map it is the
only chord→part product whose chords are not an input
([`07`](07_MARKET_ANALYSIS.md) §1).

## 3. The foundation: the block progression **[decided]**

The central object of the plugin is an **editable chord progression made of
blocks**. Everything else derives from it and stays attached to it.

```
   Section A                              Section B
   ┌────┬────┬────┬────┬────┬────┬────┬────┐ ┌────┬────┬────┬────┬────┬────┬────┬────┐
   │ C  │ G  │ Am │ F  │ C  │ G  │ F  │ G  │ │ Am │ F  │ C  │ G  │ Am │ F  │ G  │ G  │
   │ 1  │ 1  │ 1  │ 1  │ 1  │ 1  │ ½  │ ½  │ │ 1  │ 1  │ 1  │ 1  │ 1  │ 1  │ 1  │ 1  │
   └────┴────┴────┴────┴────┴────┴────┴────┘ └────┴────┴────┴────┴────┴────┴────┴────┘
     ▲ playing now                                    bars per block
```

- A **block** is a chord: root, quality, and length (harmonic rhythm). Later:
  inversion and extension per block.
- **16 blocks in two sections of eight.** Enough for a four-chord loop, an
  eight-bar verse and an eight-bar chorus, or up to 32 bars of one chord per bar.
- **Suggestions fill blocks; roles play blocks; changing a block changes
  everything.** There is no state that can silently drift away from the
  progression — the Scaler 3 model of "everything attached to the chord track"
  ([`07`](07_MARKET_ANALYSIS.md) §3), taken as a rule rather than a feature.
- **The block that is playing is always visible.** Scaler 3 hid this in its
  redesign and its users called it the biggest regression; it does not happen
  here.
- **Harmonic rhythm is a preset, not a chore.** One chord per bar, two per bar,
  anticipated changes — chosen for the whole progression, overridable per
  block. Scaler 3 forced one bar per chord and made users drag every block edge;
  its own developer called that unsolved.

Why this is the foundation and not the band: the user's harmony is the thing
that makes the result *theirs* ([`07`](07_MARKET_ANALYSIS.md) §2, §6). A band
that plays four baked-in progressions is a demo; a band that plays *your*
progression, which you can see and reshape, is a tool.

## 4. Filling blocks — where the "good progressions" come from

In order of how the user reaches for them:

1. **Suggest.** For an empty or selected block, propose the next chord — or
   fill a whole section. This is the engine
   [`07`](07_MARKET_ANALYSIS.md) §2 describes: a functional-harmony state
   machine says which moves are legal, corpus-derived weights say which are
   *typical*, colour rules add secondary dominants, borrowed chords and
   substitutions, a voice-leading resolver picks the voicing. **Conditioned by
   genre and by song section** — chorus-typical moves differ from verse-typical
   ones, and no product found offers that distinction.
2. **Schemas.** A named library of the progressions the data says people
   actually use (I–V–vi–IV, vi–IV–I–V, doo-wop, Andalusian, 12-bar, ii–V–I
   turnarounds…), dropped into a section in one click, in the current key. The
   forty alpha loops' four progressions live here as legacy entries.
3. **Play it in.** Hold a chord on a MIDI keyboard; the selected block takes it.
   One-finger entry from a mapped keyboard as well.
4. **Type or click it.** Root and quality pickers per block.

Every suggestion carries its **why**: the functional move, and the corpus
frequency it rests on ("follows IV in 41 % of choruses in this genre" — from
the baked table, so it is honest). Colour-coded fit, as Reason's Chord
Sequencer and Captain Melody do it, without their opacity.

**Suggestion is an editing-time action, so it lives in the UI.** The
transition tables, schema library and voice-leading search are JavaScript in
the patch's UI module; the result is written into the block parameters.
Playback is real-time, so it lives in the DSP. Both halves are source inside
the one `.amorph` (§9).

## 5. The band: one instance, roles on channels **[decided]**

One plugin instance plays the whole progression as a band. Each **role** —
Bass, Chords, Pad, Arp, Lead, Drums — has its own MIDI channel on `midiOut`,
and the DAW routes channels to instrument tracks. The alpha's ten
"instruments" collapse into roles plus a register.

Why one instance: the progression lives inside the plugin, so every role must
know it; duplicating it across instances is exactly the friction users complain
about ([`07`](07_MARKET_ANALYSIS.md) §6). Scaler 3 reached the same conclusion
and became one plugin with several instrument lanes. Logic's MIDI-FX slot
feeds only one instrument; that limitation is **[decided]** not a design
constraint — Logic users can still run one instance per role.

The playback model is the settled one across arrangers, Band-in-a-Box, UJAM
and Toontrack ([`07`](07_MARKET_ANALYSIS.md) §4):

```
   Style   ×   Variation ladder   ×   Intensity      +   section events
   (how a role     (A–D, rising          (per role,          (fill at a section
    plays chords)   density)              live)               boundary; ending on stop)
```

Per role: on/off, channel, style, intensity, register. Global: variation A–D,
swing, humanise, key. Few controls, all of them *performance* controls.

## 6. How a role plays a block — the engine

The alpha's transport core stays: absolute-PPQ phase lock, discontinuity
detection against the raw previous packet, 32-slot note bookkeeping, CC 123 on
stop — the part of v0.2 that is already right.

What changes is what the tables mean. Today a table row is *"play scale degree
7 at step 12"*. In the concept a style pattern row is *"play chord tone 3, one
octave up, at step 12, this loud"* — **relative to the current block's chord**.
This is the arranger-keyboard model (Yamaha CASM: source chord, transposition
rule, note-transposition table, register limits, retrigger rule on chord
change — [`07`](07_MARKET_ANALYSIS.md) §4, §8), re-implemented as enum-driven
table lookups. The existing forty loops convert into the first styles.

**Voice leading is a mechanic, not polish.** The Chords and Pad roles pick
each block's voicing by minimal movement from the previous one, forbidding
parallels — a small bounded search that runs once per block change. The
universal complaint about chord tools is "robotic", and voice leading is the
named cause; one competitor makes it the core and generates no parts
([`07`](07_MARKET_ANALYSIS.md) §6, §9).

Styles are **few and rule-driven**, not a library. Uniqueness comes from the
engine, because in Amorph content is source (§9).

## 7. The experience

1. Open the plugin on one track. Route its channels to your instruments (or a
   multitimbral one).
2. Pick a genre and a key. Drop a schema into Section A, or press Suggest until
   it is good, or play the chords in. Set the harmonic rhythm.
3. Press play in the DAW. The band plays the blocks. The current block lights
   up.
4. Change a chord. Everyone follows. Push the bass intensity up for the chorus,
   switch the variation to C, let the fill land on the section boundary.
5. When it is right, arm the instrument tracks and record. Edit in the DAW.
   The plugin has done its job.

## 8. What it is not

- **Not a sequencer or piano roll.** Notes are edited in the DAW after
  recording.
- **Not a sound source.** Pure MIDI stays pure MIDI.
- **Not an arranger keyboard** with hundreds of styles, and not a phrase
  library. A handful of good, rule-driven styles per role.
- **Not a song generator.** Amorph's own scope statement excludes full song
  generation and preset libraries; this is a harmony and accompaniment tool.
- **Not a random-idea generator.** Variety comes from the user's harmony and
  direction. Seeded variation may return as polish inside a style
  (`parked/`).
- **Not cloud, not subscription.** Everything runs inside the patch.

## 9. The monolith — what Amorph makes true

An Amorph patch is exactly two source texts, `dsp.cmajor` and `index.js`,
inside one `.amorph` file. Nothing is loaded at runtime: no data files, no
style folders, no models, no network. Consequences the concept is built on:

| Fact | Consequence |
|---|---|
| Styles, transition tables and schemas are **constant arrays in source** | content costs source size and compile time (v0.2 is already 77 % tables); keep it small and rule-driven; the engine, not the library, carries the value |
| The host's AI can **rewrite the source and recompile** (`edit_lines → apply_draft`) | "make me a bossa style" is a real capability: a new style is a new table. This is the open generator no competitor can copy — a *regenerating* instrument, not a preset browser |
| **Parameters** are restored by the host into the DSP, with the editor closed, and are preset-recalled | the block progression and role settings are **parameters** — the truth the DSP plays from. 16 blocks × 3 values plus role and global controls fit comfortably in the 128 slots |
| **Stored state** round-trips with project and presets but only the UI sees it | UI-only extras (alternative sketches, labels, view state) live there; never anything the DSP needs |
| The UI is the only place with editing-time freedom (JavaScript, no real-time limits) | the harmony brain (suggest, schemas, voice-leading search, the *why*) lives in the UI and writes blocks; the DSP is clock and performer |
| The UI receives input MIDI at ~60 Hz via the host's MIDI hook | chord recognition for "play it in" can happen in the UI without touching the DSP |

## 10. Staging — foundation first

**v0.3 — the foundation.** Block editor (16 blocks, two sections, harmonic
rhythm presets) as parameters; schema library and typed/clicked entry; one
instance playing three roles (Bass, Chords, Drums) on separate channels, with
the alpha's patterns converted to chord-relative styles. No suggestion engine
yet. This is the smallest build that proves the object.

**v0.4 — the brain.** Suggest, with genre and section conditioning and the
*why*; voice-leading resolver for Chords and Pad; play-it-in entry.

**v0.5 — the band.** Remaining roles, variation ladder A–D, intensity, section
events (fill, ending), swing and humanise.

**v0.6 — the open generator.** Style authoring through the host's AI as a
documented, first-class workflow; a live chord-follow mode from `midiIn` as an
alternative to blocks.

## 11. Open points to verify before v0.3 is built

1. **DSP without UI.** Confirm in a DAW that with the editor closed the DSP
   plays the block progression from restored parameters alone. (Standard plugin
   behaviour, and the reason blocks are parameters — verify anyway.)
2. **Multi-channel routing.** Test how the Amorph MIDI plugin's `midiOut`
   channels reach separate instrument tracks in Live, Reaper, Bitwig, Cubase and
   Studio One.
3. **UI size.** Upstream's UI contract budgets 8000 characters for generated
   files; the harmony brain will exceed it. Establish with the maker whether a
   hand-maintained patch may.
4. **Input MIDI in the UI.** Confirm `window.__amorphProcessMidi` delivers
   `midiIn` in the MIDI plugin variant, as the kit documents.
5. **Parameter compatibility with the alpha.** The kit rule is append, never
   renumber. Whether v0.3 keeps the alpha's parameters 1–10 with compatible
   meanings, or starts a new parameter contract, is the maker's call.

## 12. What the maker has to confirm

1. **Target user.** Assumed: a producer in a DAW who wants a good progression
   fast and a band to play it — not a notation composer, not a complete
   beginner. Correct?
2. **One instance = the band, roles on channels** — agreed, or is one role per
   instance the intended model?
3. **Chord vocabulary for v0.3.** Root plus major, minor, dominant 7, minor 7,
   major 7, diminished, sus — or fewer?
4. **Sixteen blocks in two sections** — enough?
5. **Genres for the suggestion tables.** Which six to eight matter to the
   intended users? This decides what the offline tooling distils first.
