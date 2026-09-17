# Market and technology analysis

**Status: v1, 2026-09-17.** What professionals and other makers do in the space
MIDI Studio is aiming at — quick, *good* chord progressions, then phrases,
melodies and accompaniment on top — and which existing systems we could adapt.

Method: four delegated research sweeps with varied queries (products, category
terms, reviews, forum threads, manuals, repos, papers), each verified against
official pages where reachable. The raw, sourced notes are in
[`research/`](research/); this document is the cross-bucket synthesis. Prices
and versions are as of the date above and will drift. Scores in §3 are a
reading of the notes, not hands-on testing — see §12.

| Bucket | Notes |
|---|---|
| 1 — commercial chord-progression tools, incl. DAW-native | [`research/bucket_1_commercial_chord_tools.md`](research/bucket_1_commercial_chord_tools.md) |
| 2 — phrase/melody generators and accompaniment / virtual-band systems | [`research/bucket_2_phrase_and_accompaniment.md`](research/bucket_2_phrase_and_accompaniment.md) |
| 3 — open-source systems and code | [`research/bucket_3_open_source_systems.md`](research/bucket_3_open_source_systems.md) |
| 4 — algorithms, theory formalisations and datasets for "good" progressions | [`research/bucket_4_algorithms_and_data.md`](research/bucket_4_algorithms_and_data.md) |

---

## 1. The map

Three product families, and they are converging:

| Family | What it does | Examples |
|---|---|---|
| **Chord pickers / suggesters** | help you *choose* chords | Scaler 3, InstaChord 2, Captain Chords, Hookpad, Suggester, Reason Chord Sequencer, Cubase Chord Assistant, Logic 12 Chord ID |
| **Chord → part players** | turn chords into *played parts* | ChordPotion, Phrasebox 2, Cthulhu, UJAM, NI Session, Logic Session Players, Scaler Motions, EZkeys/EZbass, arranger keyboards, Band-in-a-Box |
| **Generative sandboxes** | constrained randomness, no "answer" | Ableton Live 12 MIDI Tools, Chordjam, Riffer, Torso T-1, Squarp Hapax |

The integrated tools (Scaler 3, Captain suite, Orb/LANDR, RapidComposer,
Logic 12) span the first two families — exactly the span the maker's goal
describes.

**Where MIDI Studio v0.2 sits:** every chord→part player in the market takes
chords as *input* — a chord track, live MIDI, a chord sheet, pads. v0.2 is the
only one with the chords baked into the parts. It is a style engine without a
chord input, which is the structural version of "feels too fixed".

## 2. How the market defines a "good" progression

Four mechanisms, in order of how common they are:

1. **Curated library.** Scaler 3 (1,000+ sets), Captain Chords (96,000+
   presets), Sundog (500+), Odesi (138), Reason Chord Sequencer (1,500+ chords,
   human-scored next-chord fit). Most common. "Mined from real hits" is the
   universal marketing line; only one product discloses corpus and method.
2. **Theory rules.** Cubase Chord Assistant (proximity, circle of fifths),
   Suggester (roman-numeral functions), Scaler's modal interchange / neo-Riemannian
   / negative harmony, FL Studio 2026 voice-leading modes, Fluid Chords 2's
   voice-leading engine. Transparent, but generic.
3. **Corpus statistics.** Hookpad's Magic Chord ranks next chords by frequency
   across 75,000+ crowd-transcribed songs. **The only product with a disclosed
   corpus and method — and it is web-only, with no plugin.**
4. **Opaque AI.** Captain's cloud, Orb → LANDR Composer, Chord Genie, Lemonaide,
   Staccato, Musia. No published method for any of them.

What the evidence says (bucket 4): the best-founded way to generate good
progressions is **layered**, not any one of the above —

```
  legal-move grammar        functional T–PD–D state machine (Rohrmeier, Kostka-Payne)
  → empirical weighting     order-2 transition table mined offline from a corpus
  → colour rules            secondary dominants, tritone subs, borrowed chords, ii–V insertion
  → voice-leading resolver  minimal-movement voicing, no parallels (Tymoczko, music21)
  → optional tension gate   closed-form Tonal-Interval-Space score (ρ = 0.75 vs listeners)
```

Every layer is a fixed table or a small bounded search — i.e. it fits a
real-time, no-heap Cmajor engine. And the data to weight it is open:
**Chordonomicon** (Apache-2.0; 666,000+ songs, ~52 M chords, with verse/chorus
section labels and genre/decade), **McGill Billboard** (CC0), the iRealPro
jazz corpus (CC BY 4.0 release), cross-checked against Hooktheory's published
numbers.

## 3. Best hits compared

● full · ◐ partial · ○ none · — not applicable. Scored from the bucket notes.

| System | Suggests progressions | Transparent "why" | Chords → parts | Follows external chords | Multi-instrument coherence | Voice leading as mechanic | Intent controls | In-DAW plugin | Offline / no subscription | User-editable generator |
|---|---|---|---|---|---|---|---|---|---|---|
| **MIDI Studio v0.2** | ○ | ○ | ● | ○ | ◐ hidden | ◐ authored only | ○ | ● (Amorph) | ● | ◐ code-level |
| Scaler 3 | ● library + rules | ◐ | ● Motions | ● audio + MIDI | ● timeline, Live Sync | ◐ | ● | ● | ● | ◐ own chord sets |
| Captain Plugins Epic | ● cloud + presets | ○ | ● Melody, Deep | ◐ key only | ● suite-wide | ○ | ● | ● | ○ cloud required | ○ |
| Hookpad | ● corpus | ● | ◐ melody only | ○ | ◐ | ○ | ○ | ○ web | ○ | ○ |
| RapidComposer 6 | ● rules + phrases | ◐ documented rules | ● full arrangement | ◐ MIDI import | ● Master Track | ◐ | ◐ | ○ standalone | ● | ◐ own phrases |
| ChordPotion | ○ | — | ● arp + bass + rhythm | ● live MIDI | ◐ MIDI-thru | ○ | ◐ | ● | ● | ◐ own patterns |
| Fluid Chords 2 | ◐ one-click | ○ | ○ | ○ | ○ | ● core | ◐ | ● | ● | ○ |
| Reason Chord Sequencer | ● curated, scored | ◐ visible score | ○ | ○ | ◐ rack chaining | ○ | ○ | ● Reason only | ● | ○ |
| Logic Pro 12 (Chord Track + Session Players) | ◐ Chord ID | ○ | ● ML players | ● global chord track | ● | ◐ | ● complexity, intensity | ● Logic only | ● | ○ |
| Cubase 15 (Chord Track, Pads, Assistant) | ● proximity, circle of fifths | ● | ◐ pads, patterns | ● audio + track | ● | ◐ Adaptive Voicing | ◐ | ● Cubase only | ● | ◐ any loop as pattern |
| Band-in-a-Box 2026 | ◐ | ○ | ● RealTracks | ● chord sheet | ● reference | ◐ | ◐ substyles | ◐ | ● | ◐ StyleMaker |
| Toontrack EZ line (Bandmate) | ◐ suggest chords | ○ | ● recorded | ● | ● same reference | ○ | ● | ● | ● | ○ |
| UJAM Virtual line | ○ | — | ● phrases | ◐ Studio One only | ○ | ◐ automatic | ● intensity | ● | ● | ○ |
| Orb → LANDR Composer | ● AI | ○ | ● | ○ | ● shared chord object | ○ | ● | ● | ○ subscription | ○ |
| Yamaha Genos2 (arranger reference) | ○ | — | ● Style files | ● chord recognition | ● | ◐ NTT rules | ● Main A–D | ○ hardware | ● | ◐ Style Creator |
| MMA (open source) | ○ | — | ● grooves | ● chord text | ● | ◐ voicing modes | ◐ | ○ offline tool | ● | ● text grooves |
| Impro-Visor (open source) | ◐ | ◐ | ● styles + grammar | ● lead sheet | ● | ◐ | ◐ | ○ | ● | ● text styles, grammars |

Two columns stand out. **Transparent "why"** has one full mark in the plugin
market (Cubase's rules) and one outside it (Hookpad's corpus). **Voice leading
as mechanic** has one full mark (Fluid Chords 2) and it does not generate parts.

## 4. How the market turns chords into parts

Two technical camps — and this split matters more than "AI vs not":

- **Recorded phrase libraries**: UJAM, NI Session, Scaler Motions, EZkeys/EZbass,
  Band-in-a-Box RealTracks. Realism from real players; finite library, so the
  "sounds generic" risk is structural; needs large sample/MIDI corpora. Not a
  fit for a Cmajor patch.
- **Rule / pattern engines**: arranger Style files (Yamaha CASM with NTR/NTT
  rules, Korg), MMA grooves, Impro-Visor `.sty`, ChordPotion lanes, Phrasebox
  rows, Cthulhu patterns, Reason Bassline Generator's 64 + 64 banks. Compact,
  table-driven, decades-proven. **MIDI Studio is already in this camp** — its
  four tables are a primitive style file.

The accompaniment model is settled across arrangers, Band-in-a-Box, iReal Pro,
UJAM and the EZ line: **Style × Variation × Intensity**, driven by one shared
chord source, with Intro / Fill / Ending as section events. Measured against
that model, v0.2 has Style ("Idea"), no Variation ladder (A–D of rising
density), no Intensity axis, no section events, and no chord source.

The reference implementation of the chord→part rule engine is the Yamaha
CASM model: per part, a *source chord* the pattern was written in, a
*transposition rule* (root-transpose vs root-fixed vs guitar), one of eleven
*note-transposition tables* (melody, chord, bass, minor variants…), register
limits, and a *retrigger rule* for notes still sounding when the chord changes.
It is re-implemented open-source in JJazzLab (LGPL) and documented in the
reverse-engineered CASM spec. Ensembles (open arranger) shows the 80/20
version: transpose by `(root, major/minor)` only.

## 5. Coherence across instruments

In every system, coherence means **one shared chord source** — Logic's Chord
Track feeding Session Players, Cubase Chord Pads feeding tracks, ReChord's
Scanner broadcasting to Transposers, Orb Chords feeding modules, one chord sheet
in Band-in-a-Box. Cross-instance sync inside a plugin family exists but is sold
as premium (Scaler Live Sync, Chord Prism Instance Sync). Nobody has arrangement
intelligence: nothing thins a pad because a fill is coming, or lightens the bass
because the keys got busier.

Two consequences. The concept's "chord track as conductor" is the proven,
standard mechanism, and Amorph's lack of inter-instance communication is no
handicap — the DAW does the routing. And arrangement intelligence is unclaimed
territory, but expensive; a long-term note, not a v1 promise.

## 6. What users complain about

Cross-bucket, the same things recur regardless of price:

1. **"Robotic / copy-paste / needs manual rework"** — the single most repeated
   complaint (Captain Chords, Chord Genie, UJAM, arranger styles "hotel lobby").
   Newer tools market re-voicing, humanise and chord "bending" as the fix.
2. **Voice leading, named specifically** — "voicing choices seem to have no
   solid underlying conceptual framework and don't seem to be connected to voice
   leading principles" (VI-Control); "the voice leading on that dominant collapse
   is really bad" (Image-Line forum, about FL's new modes).
3. **Cannot see what is happening** — Scaler 3 users lost the "which chord am I
   on" highlight and called the UI regression the biggest loss.
4. **Friction getting material in and out** — UJAM users want to drag in a whole
   progression instead of transposing chord by chord; standalone apps need MIDI
   loopback; cloud tools need a connection.
5. **Speed vs understanding** — InstaChord is praised for speed and criticised for
   teaching nothing about *why* a progression works or where it could go next.

## 7. Market signals

- **Standalone sketchpads are dying.** Liquid Music's store closed (Mar 2026);
  Odesi is reported de-prioritised in favour of in-DAW Captain plugins;
  RapidComposer is respected but "demands a workflow shift". In-DAW wins.
- **DAWs are absorbing the basics.** Logic 12 ships Chord ID (audio → chord
  track) and Session Players (chord-following bass/keys/drums) for free; Cubase,
  Studio One and FL Studio all added chord detection and voice-leading modes.
  **Chord follow alone is table stakes and, on Mac/Logic, free.**
- **AI is moving to cloud and subscription.** Orb became LANDR Composer
  (subscription); Captain generates in the cloud. Offline, local, one-time is
  becoming a differentiator rather than the default.
- **Hardware validates the model.** Genos2, Pa5X, Roland J-6, MPC Pad Perform —
  the Style × Variation × chord-input design sells at every price from $299 to
  $6,499.

## 8. What we can adapt — ranked, with licence position

Ideas, mechanisms and rule *shapes* are not copyrightable and can be
re-implemented regardless of source licence. Concrete GPL *data* (grooves,
style files, tables) must be re-authored, not copied. MIT/BSD/Apache material
can be ported with attribution. Full notes in bucket 3 and 4.

| # | Adapt | For | Source / licence | How |
|---|---|---|---|---|
| 1 | **Yamaha CASM / NTR / NTT rule model** | chord → part engine | concept from reverse-engineered docs; JJazzLab (LGPL-2.1) as behavioural oracle | re-implement the rule set as enum-driven table lookups; validate against JJazzLab's output |
| 2 | **Layered progression recipe** (§2) with **Chordonomicon** weights | "good progressions" engine | Rohrmeier / Kostka-Payne (published theory); Chordonomicon (Apache-2.0); McGill (CC0) | offline Python tooling in this repo distils per-genre, per-section transition tables → baked into the patch |
| 3 | **Impro-Visor weighted pattern alternatives + note-role taxonomy** (chord / colour / approach tone) | phrases and melody | GPL-2 — re-author own rules | weighted-random pick over a short token alphabet; role table per chord quality; metric-strength gate |
| 4 | **MMA groove format** | pattern data model | GPL-2 — re-author own grooves | pattern = fixed list of (beat, chord-tone index, duration, velocity) per track; `SeqRnd`-style variant choice |
| 5 | **music21 figured-bass rule checks + Tymoczko minimal movement** | voice-leading resolver | BSD-3 / published theory | bounded search over realistic voicings; forbid parallels, crossing, overlap |
| 6 | **tonal.js roman-numeral and substitution tables** | harmony vocabulary | MIT | port the constant arrays |
| 7 | **Magenta improv_rnn 36-slot chord vector** | internal chord representation | Apache-2.0 | root one-hot + pitch-class presence + bass one-hot |
| 8 | **Ensembles' `(root, major/minor)` transposition** | MVP fallback | GPL-3 (convention, unverified) — trivial idea | first milestone before full NTT |
| 9 | **UI patterns** | feedback and trust | — | Captain Melody's tension colouring; Reason Chord Sequencer's colour-scored next chord; Cubase proximity; Hookpad's "songs that use this"; Logic's Regenerate button; Genos Main A–D buttons |

Not adaptable at runtime: any neural model (Magenta, DeepBach, transformers) —
usable only offline, as a source to distil tables from.

## 9. Whitespace — what nobody does, and what only Amorph can do

1. **Corpus-grounded, transparent progression suggestion inside the DAW.**
   Hookpad has the data but no plugin; every plugin has a plugin but an opaque
   library. Bucket 4's recipe plus Chordonomicon makes this buildable as fixed
   tables. **Conditioning by genre *and* song section (verse-typical vs
   chorus-typical moves) is offered by no product found.**
2. **Voice leading as a first-class mechanic in a part generator.** One
   competitor makes it the core (Fluid Chords 2) and it generates no parts; the
   complaint is universal; the algorithms are cheap.
3. **The open generator.** Amorph's platform promise is that the user — or an AI
   in the host — can read and rewrite the plugin. Styles, rule tables and
   progression weights as readable, editable data turn "make me a bossa style"
   into something the plugin can actually do. The nearest analogues (Ableton
   Stacks JSON banks, Chordz text templates, MMA grooves, Ripchord being open
   source) are all far from "describe a style, get a style". **No competitor
   can copy this; it is structural to the host.**
4. **Offline, local, one-time, cross-DAW** — against the cloud/subscription
   drift of the AI tools and the DAW-lock-in of Logic/Cubase.

Whitespace we should *not* chase: full song generation (out of Amorph's own
scope), recorded-phrase realism (needs sample libraries), audio chord detection
(DAWs do it; a MIDI plugin's sidechain input makes it conceivable later, not now).

## 10. Consequences for the concept

Deltas to [`02_CONCEPT.md`](02_CONCEPT.md), to be folded into v2 of it:

- **Core value moves to harmony generation.** The maker's intention and the
  market gap point the same way: *good progressions first*. Chord follow stays
  as an input mode (table stakes) but is not the differentiator — Logic 12
  gives it away.
- **Adopt the settled accompaniment model.** Style × Variation ladder (A–D,
  rising density) × Intensity, with section events (fill, break, ending). This is
  what "Idea 1–4" should become.
- **Voice leading becomes a stated core mechanic**, not polish.
- **"Open styles and rules" becomes the Amorph-native differentiator** and
  shapes the data model: everything a style *is* must be data the host can show
  and rewrite.
- **Positioning:** offline, in-DAW, transparent about *why*, editable — against
  cloud black boxes and DAW lock-in.
- **Do not compete on** song generation, recorded realism, or audio detection.

## 11. Suggested reading order for the maker

1. §1 (the map) and §3 (matrix) — ten minutes.
2. §9 (whitespace) — the decision.
3. Bucket 4 §4 (the recipe) — what "good progressions" can concretely mean in a
   Cmajor engine.
4. Bucket 3 §4 (data models) — what a style should look like as data.

## 12. Caveats

- Prices, versions and availability drift; treat them as a snapshot.
- Items marked *(unverified)* in the bucket notes could not be confirmed from a
  primary source; none of the conclusions above rest on one of them alone.
- The matrix is a reading of documentation and reviews. Before the concept is
  finalised, three or four tools should be tried hands-on: Scaler 3 and
  ChordPotion (plugin baselines), Logic 12 Session Players (the free baseline),
  Hookpad (the transparency baseline).
- Bucket 1 corrected one attribution in the brief: Harmony Bloom is by Mario
  Nieto World, not Mozaic (Mozaic Beats makes Chord Prism).
