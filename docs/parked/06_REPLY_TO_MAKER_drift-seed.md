# Short version — ready to post to the beta group

Draft reply to the maker's question. Trim to taste; the numbers are the part
worth keeping.

---

Hey! Really enjoyed digging into this one. We pulled the patch apart and measured
the note tables rather than just listening, and the result surprised us a bit —
so here is one direction, plus the evidence for why we would pick it.

**Short answer to "better rhythm or harmony": rhythm, and it is not close.**

The harmony is already doing its job. The stored degrees trace real progressions
and they move every bar. What does not move is the rhythm:

- **32 of the 40 loops are one bar of rhythm repeated four times.** Only Electric
  Keys and Drums vary at all, and only in bars 2 and 4.
- **24 of 40 replay an identical velocity sequence every bar.** The closed hats
  in all four grooves alternate between exactly two values, 53 and 72, for all 32
  hits.
- Every onset sits exactly on a sixteenth — there is no swing, no timing
  deviation, no probability anywhere in the engine.
- Of the 40 compositions, only 32 have a distinct onset map, so 8 are already
  rhythmic duplicates of another loop.

So "feels too fixed" is precise, and it is not a content problem. That is also
why we would **not** add more compositions: the four lookup tables are already
**77% of the DSP source file**, so every new one costs source size linearly and
still ships a fixed result.

**The direction we would take: keep all 40 loops, but stop treating them as the
output. Treat them as the input to a performer.**

Two parameters carry the whole idea:

- **Drift (0-100%)** — how far each bar may depart from the stored cell: notes
  omitted, displaced by a sixteenth, ghost notes added, octaves re-voiced. At
  **Drift = 0 the output is bit-identical to v0.2**, so nothing anyone has already
  made breaks.
- **Seed (0-999)** with a **Roll** button — reproducible randomness.

The seed is the part we would argue hardest for. Surprise without recall is not
usable in composing: the user hears something great, touches a knob, and it is
gone. With a seed, every result has an address — "seed 412, drift 35%" is
something you can write down and send to someone. Press Roll until it is good,
then stop.

One implementation detail that makes this much better than it sounds: if the
randomness is a **pure function of (seed, absolute bar, step)** rather than a
running RNG, then **bar 5 is not bar 1**. The same 64-step table read at
different bar numbers gives a different performance every time, deterministically
— so a phrase-length control (4/8/16/32 bars) turns the existing tables into
16- and 32-bar phrases that develop. Variation without any new data. It also
means a seek to bar 33 gives exactly what playing there would have given, and a
bounced take equals the live take.

Three more controls we would add alongside: **Swing**, **Humanize** (small timing
and velocity jitter — this alone fixes the machine-gun hats) and **Accent**
(velocity from metric position instead of the frozen stored values).

Six knobs total. We would deliberately stop there.

**What we would keep untouched:** the transport handling is the strong part of
this patch. Detecting discontinuity against the previous raw packet rather than
the extrapolated position, the backwards-jump and seek resets, the 32-slot note
tracking, closing a prior copy of the same pitch before retriggering, CC123 on
stop — that is all correct and it is why the thing never gets stuck. Whatever
changes, that should not.

**Two further ideas, if this direction lands:** lift the harmony out of the
tables into an actual chord track (so Key/Scale stop being a global transpose),
and give `midiIn` something to do — right now it only listens for all-notes-off,
so you cannot play a chord into it or transpose it from a keyboard. That second
one is probably what turns it from a generator you listen to into one you play,
but it changes the product category, so that is your call rather than ours.

Happy to go deeper on any of it, and glad to prototype the Drift/Seed stage if
that is useful.

---

*Full analysis, the measurement script, and implementation specs:*
*https://github.com/ClarkParker/MIDI_Studio*
