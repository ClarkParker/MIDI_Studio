# MIDI Studio — Concept

**Status: draft v1, for discussion.** Written to answer the one question the
maker put to the beta group: *what would make this more useful for composing?*

Facts about the alpha come from [`01_ALPHA_ANALYSIS.md`](01_ALPHA_ANALYSIS.md).
Everything marked *assumed* is ours and needs the maker's confirmation (§11).

---

## 1. What it is today

MIDI Studio v0.2 is a MIDI-only plugin — it makes no sound of its own — that
plays authored four-bar loops in sync with the host. Ten "instruments", which
are really ten **roles** (bass register, chord figuration, lead line, drum
groove…), each with four "ideas". Pick a role, pick an idea, set the key, press
play in the DAW, route the MIDI to a sound.

Measured:

- 40 loops in total — that is the plugin's entire output space
- rhythm is frozen: 32 of 40 loops are one bar repeated four times, every note on
  the sixteenth grid, velocities replayed verbatim
- the harmony does move — and for a given idea it is the **same progression
  across all ten roles**. The four ideas are, in effect, four complete
  arrangements cut into ten single parts
- one instance = one role = one MIDI channel; instances know nothing of each other
- `midiIn` is unused: nothing the user plays reaches the engine

So v0.2 is a **disassembled band**: ten musicians who each know four pieces,
cannot hear each other, take no direction, and play their four bars until muted.

## 2. What "too fixed" actually means

Not "it repeats" — every loop repeats. The problem is **ownership**.

The plugin has 40 outputs and every user gets the same 40. Whatever you make
with it sounds like one of them, in your key. Material picked from a menu is not
yours, and for a composing tool that is the whole game.

Material becomes the user's when:

1. the **harmony** is theirs — their chords, not one of four progressions
2. the **character** is theirs — they shaped how it is played
3. the parts **fit together** by design, not by luck
4. it **develops** over the length of a song

v0.2 offers (1) only as key transposition, (2) nothing, (3) hidden and fragile —
set two instances to different ideas and two progressions collide without
warning — and (4) nothing.

## 3. Goal

**From loop player to accompanist.**

MIDI Studio becomes a small band that plays *the user's* harmony in a chosen
style and takes simple direction. The output is the user's; the plugin
contributes the playing.

In one sentence for the maker: *the parts should follow the chords the user
gives them.*

## 4. Who it is for

*Assumed.*

**Primary:** a producer or musician working in a DAW who can play or program a
chord progression and wants a band to play it — a starting point that already
fits their track. Not a notation composer; not a complete beginner.

**Secondary:** someone who cannot supply chords. For them the stored
progressions stay as built-in fallbacks — which is exactly what v0.2 is today.
Nothing is taken away from anyone.

## 5. Core idea

Separate two things v0.2 welds together:

| | v0.2 | Concept |
|---|---|---|
| **Harmony** — which chords | baked into each loop | from the user: chords played or drawn on one MIDI track, sent to every instance |
| **Style** — how the role plays them | baked into each loop | what the "ideas" become: a playing pattern that works over any chord |

Consequences:

- **The user's chord track is the conductor.** Every instance follows the same
  chords, so the parts fit by construction. No inter-instance communication is
  needed — the DAW already does the routing.
- **Change one chord and the whole band follows.** This is the moment that sells
  it, and the one to demo.
- **The stored content survives.** The tables hold scale degrees, not pitches,
  and the engine already resolves degrees against a root. The material can be
  re-expressed relative to a chord rather than rewritten. Ideas become styles;
  the four baked-in progressions become the fallback when no chords arrive.
- **More content becomes cheap and meaningful.** A new style is a playing
  pattern, not a song. Today a new "composition" costs a 77%-tables source file
  and still ships a fixed result.

## 6. The experience

1. One instance per instrument track, as today. Choose a role and a style.
2. One MIDI track carries the chords — played live or drawn as a clip — and is
   routed to all instances.
3. Press play. The band plays your chords in the chosen styles, in sync with the
   host.
4. Direct it: thinner in the verse, fuller in the chorus, a different style for
   the bridge. A few intent controls per role, not many.
5. When it is right, record the MIDI onto the instrument tracks and keep editing
   in the DAW. The plugin has done its job.

No chords on the input → the role falls back to its built-in progression,
exactly as v0.2 behaves now.

## 7. What it is not

- **Not a sequencer or piano roll.** Editing happens in the DAW.
- **Not a sound source.** Pure MIDI stays pure MIDI.
- **Not an arranger keyboard** with hundreds of styles and auto-intros. A small
  band, a handful of styles per role, simple direction.
- **Not a random-idea generator.** Variety comes from the user's harmony and
  direction, not from dice. Seeded variation may return later as polish *inside*
  a style; it is not the direction. (An earlier pass proposed exactly that —
  see `parked/`.)

## 8. The one direction for the maker

He asked for one. **Chord follow.**

In a week, concretely:

- read the notes held on `midiIn`; derive root and quality — major/minor is
  enough to start
- play the current style's figuration over that chord instead of the baked-in bar
- nothing held → use the stored progression as today

Backward compatible, uses an endpoint that already exists, and the dev kit's
`03_MidiChord` example already shows held-note handling in Amorph. Everything
else in this concept builds on it, and nothing else is needed before it.

## 9. What comes after — in order

1. **Chord follow** (§8).
2. **Direction.** Two or three intent controls per role: density or energy,
   register, feel (swing, humanise). This is also where the frozen-rhythm finding
   gets fixed — as part of *how a style plays*, not as a separate feature.
3. **Form helpers.** A fill when the chord track hits a section boundary,
   stop/restart behaviour, and style phrases of 2–4 bars with real rhythmic
   development instead of one bar repeated.
4. **More styles per role**, now that a style is cheap to author.

## 10. Implications for the two workstreams

Not specifications — only what each side has to be true to.

**DSP.** The engine's job changes from *"look up bar N"* to *"play style S over
chord C"*. Held-note tracking lives in the `midiIn` handler (Amorph rule: that
handler owns held-note bookkeeping); chord → root and quality; style content
resolved against the current chord instead of the key. Transport handling and
note bookkeeping stay exactly as they are — they are the good part of v0.2.

**UI.** Show the chord the engine is following right now — this feedback loop is
what makes it feel alive — plus role and style choice and the few direction
controls. The chord readout replaces today's static progression hint.

## 11. Assumptions and open questions for the maker

1. **Target user.** §4 is assumed. Is the primary user someone who supplies
   chords, or someone who wants a result without playing anything?
2. **Routing.** One MIDI track feeding several plugin instances is easy in some
   DAWs and clumsy in others. Is one-role-per-instance the intended model, or is a
   single-instance "whole band" mode (multi-channel output) wanted eventually?
3. **Chord vocabulary.** Root plus major/minor first, or are sevenths and
   suspensions expected from day one?
4. **The four ideas.** With harmony external, some roles' ideas collapse —
   Guitar's and Strings' four ideas differ essentially only in progression. Reduce
   them, or re-author as distinct styles?
