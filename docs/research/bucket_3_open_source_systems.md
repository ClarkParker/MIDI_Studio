# Research bucket 3 — open-source / freely available systems

Raw research notes, 2026-09-17. Produced by a delegated web-research pass
(30+ varied searches; READMEs, docs, raw source files, the Yamaha CASM spec
pages, an Impro-Visor `.sty` file and license files fetched directly).
Claims are only as verified as the cited source; anything not confirmed from a
primary source is marked **(unverified)**. The synthesis lives in
[`../07_MARKET_ANALYSIS.md`](../07_MARKET_ANALYSIS.md).

Constraint that framed the search: the target engine is Cmajor — real-time, no
strings, no heap, no file/network I/O, fixed-size arrays. What can be adapted is
therefore **algorithms, rule sets, state machines and data tables**, never
libraries as-is.

## 1. Comparison table

| Name | License | Language | Maturity | Scope | Core mechanism | Adaptable to a real-time table/rule engine? | URL |
|---|---|---|---|---|---|---|---|
| MMA (Musical MIDI Accompaniment) | GPL-2.0 | Python | Active — v25.05.2 (2025) | chords, accompaniment, style/"groove" format | Text `.mma`/groove files define per-track patterns as beat-offset/duration/volume strings; a chord parser resolves `Dm7` etc. to scale-degree/chord-tone indices the pattern references; `SeqRnd` layers randomised variant selection | Yes — pattern = fixed list of (beat, chord-tone-index, duration, velocity) | [mellowood.ca/mma](https://www.mellowood.ca/mma/), [github.com/infojunkie/mma](https://github.com/infojunkie/mma) |
| Impro-Visor | GPL-2.0-or-later | Java | Dormant since v10.2 (2019) | melody grammar + accompaniment styles | `.sty` files are S-expressions: `(bass-pattern (rules B8/3 R8/3 …)(weight 46.0))` — token alphabet B (bass/root), C (chord tone), R (rest), X (chord hit), duration suffix, several weighted alternatives per section; melody "grammars" are probabilistic context-free grammars, learnable from a corpus of transcribed solos | Yes — weighted-rule table maps almost directly to fixed arrays; grammar = small weighted state machine | [github.com/Impro-Visor/Impro-Visor](https://github.com/Impro-Visor/Impro-Visor) |
| music21 | BSD-3 | Python | Active | harmony analysis, roman numerals, figured-bass realisation | `roman`/`harmony` analyse rather than generate; `figuredBass.realizer` is a real constraint solver: `voiceCrossing()`, `parallelFifths/Octaves()`, `partMovementsWithinLimits()` boolean checks filter/rank all valid four-part "possibilities" | Partial — the voice-leading boolean-rule functions port directly to fixed-size chord arrays | [github.com/cuthbertLab/music21](https://github.com/cuthbertLab/music21) |
| mingus | GPL-3.0 | Python | Low activity | chords, scales, progressions, substitution | `numerals=[I..VII]`, `numeral_intervals=[0,2,4,5,7,9,11]` parallel arrays; harmonic substitution via a tiny fixed pair table `(I,III)(I,VI)(IV,II)(IV,VI)(V,VII)` plus "skip-2"/"skip-5" transforms | Yes — the substitution table is literally a five-entry constant array | [github.com/bspaans/python-mingus](https://github.com/bspaans/python-mingus) |
| tonal.js | MIT | JS/TS | Active | chords, scales, roman numerals, progression, voice leading | Pure, stateless functions over constant tables (`@tonaljs/progression`, `@tonaljs/voice-leading` picks the minimal-movement voicing between two chord shapes) | Yes — stateless table lookups port cleanly | [github.com/tonaljs/tonal](https://github.com/tonaljs/tonal) |
| teoria.js | MIT | JS | Dormant ~2015 | chords/scales/intervals object model | Semitone/interval arithmetic tables; no progression generation | Ideas only | [github.com/saebekassebil/teoria](https://github.com/saebekassebil/teoria) |
| Magenta: Coconet / Improv RNN / Studio | Apache-2.0 | Python+TF / TF.js | Active (Magenta.js/Studio maintained) | Coconet: four-voice Bach harmonisation. Improv RNN: melody over chords. Studio: offline Ableton plugin | Coconet = convolutional orderless-NADE + Gibbs-sampling inpainting on a four-voice piano roll. Improv RNN chord conditioning = fixed 36-int vector (12 root one-hot + 12 pitch-class presence + 12 bass one-hot) per step. Studio ships weights and runs fully offline in TF.js | No for the networks (tensors/heap); **yes** for the 36-slot chord-encoding scheme itself | [magenta.tensorflow.org/coconet](https://magenta.tensorflow.org/coconet), [improv_rnn](https://github.com/magenta/magenta/tree/main/magenta/models/improv_rnn), [studio](https://magenta.tensorflow.org/studio) |
| DeepBach | MIT | Python/PyTorch (+music21) | Dormant (2017 code) | four-voice chorale harmonisation | Two LSTMs (past/future context) + a "now" feed-forward net; generation via pseudo-Gibbs sampling with user-pinned constraints | No (network); the "resample masked slots with pinned constraints" control idea is reusable | [github.com/Ghadjeres/DeepBach](https://github.com/Ghadjeres/DeepBach) |
| Schwarzonator | Freeware, no OSS licence found **(unverified)** | Max for Live (.amxd) | Legacy, v2 still distributed | real-time one-finger harmoniser | User-authored "Chord Sets" (explicit chord lists); the degree you play selects a chord from the current set, scale-locked | Idea only — "named chord set selected by scale degree"; do not copy the patch | [maxforlive.com/library/device/625](https://maxforlive.com/library/device/625/schwarzonator) |
| Yamaha SFF (CASM / NTR / NTT) | Proprietary format; the reverse-engineered **documentation** is freely published | Binary spec, docs in HTML/PDF | Legacy but still the industry reference; docs maintained | style sections + chord-transposition rule engine | See §4 | [jososoft.dk casm_1](http://www.jososoft.dk/yamaha/articles/casm_1.htm), [casm_2](http://www.jososoft.dk/yamaha/articles/casm_2.htm) |
| JJazzLab / YamJJazz | LGPL-2.1 | Java | Active — v5.1 (2026) | full Band-in-a-Box-style arranger; the YamJJazz engine reads **real** Yamaha `.sty/.prs/.bcs/.sst` (SFF1+SFF2) | Open-source, working re-implementation of the Yamaha NTR/NTT rule engine, plus its own extended style format | Yes — a licence-clear reference implementation to study and diff against | [github.com/jjazzboss/JJazzLab](https://github.com/jjazzboss/JJazzLab) |
| Sonic Pi | MIT | Ruby/SuperCollider | Active — v5 (2026) | live-coding chords/progressions | `chord`/`scale` return fixed-length circular "rings"; progressions are rings of rings advanced by `tick` | Yes — the ring (fixed-size circular buffer + wrap index) is a trivial Cmajor-friendly primitive | [github.com/sonic-pi-net/sonic-pi](https://github.com/sonic-pi-net/sonic-pi) |
| Euterpea / HSoM | BSD-3 | Haskell | Dormant ~2019 | algorithmic-composition DSL | Music = recursive algebraic tree; chords = parallel-composition combinator | Concept only | [euterpea.com](https://www.euterpea.com/) |
| OpenMusic | GPL-3.0 | Common Lisp | Active — v8.0 (2026) | visual CAC; "Situation" lib does constraint-based harmony | Visual dataflow over Lisp lists; constraint-satisfaction search for chord sequences | Concept only (declare rules, then search) | [github.com/openmusic-project/openmusic](https://github.com/openmusic-project/openmusic) |
| Bol Processor BP3 | BSD-style | C (+WASM/PHP) | Active fork 2025–26 | generative grammars (tabla-derived) for rhythm/melody | Context-sensitive production-rule grammars with "remote context" + homomorphic pattern transforms | Yes — rewrite rules over a fixed alphabet fit a compact interpreter | [github.com/bolprocessor/bolprocessor](https://github.com/bolprocessor/bolprocessor) |
| abjad | GPL-3.0 | Python | Active — v3.31 (2025) | Python→LilyPond notation API | Object tree for notation output; no theory/generation engine | No | [github.com/Abjad/abjad](https://github.com/Abjad/abjad) |
| pretty_midi | MIT | Python | Mature, low activity | MIDI utility | `Instrument → [Note(start,end,pitch,velocity)]`; no chord/theory logic | No algorithm; the flat Note struct is a fine reference | [github.com/craffel/pretty-midi](https://github.com/craffel/pretty-midi) |
| CoreaChord (representative of many "markov chord generator" repos) | None stated **(unverified)** | Python | Inactive (student project) | chord progression generator | Fixed 48×48 Markov transition matrix (12 roots × 4 qualities), **hand-tuned, not trained**, plus a "brightness" bias and cumulative-distribution sampling | Yes — exactly a fixed transition-probability table | [github.com/wchen777/CoreaChord](https://github.com/wchen777/CoreaChord) |
| cmajor-lang/cmajor (gap check) | MIT | Cmajor/C++ | Active | DSP language + examples | **No arpeggiator/chord/generator example exists today** — only `HelloWorldMidi`, `MidiEcho`, `ValueEcho` show `std::midi::Message` with `isNoteOn/Off`, `getNoteNumber`, `getVelocity`, plus typed MPE event structs | N/A — this is the gap to fill ourselves | [examples/patches](https://github.com/cmajor-lang/cmajor/tree/main/examples/patches) |

## 2. Notes on the major items

**MMA** — GPL, Python, versioned by date (25.05.2). Track types include BASS / CHORD / ARPEGGIO / SCALE / DRUM / WALK / MELODY / SOLO; a `Groove` bundles a whole set of per-track pattern/volume/octave/articulation settings under one name, recalled with `Groove <name>`. `SeqRnd` injects randomised pattern-variant choice per repeat, mimicking a live player (exact probability formula unverified). Sources: [MMA groove essay](https://www.mellowood.ca/music/essays/mma/mma-groove.html), [online docs](https://www.mellowood.ca/mma/online-docs/html/ref/node6.html).

**Impro-Visor** — confirmed from a live style file (`rhumba-3.sty`): global header (bass range, chord range, voicing open/close, swing, comp-swing) + several weighted pattern alternatives per track (bass/chord/drum), chosen by weighted random pick at render time. Melody grammars use terminals for relative pitch and can be **learned from a corpus** of lead-sheet transcriptions — the most directly transferable "melody over chords" mechanism found. Source: [rhumba-3.sty](https://github.com/Impro-Visor/Impro-Visor/blob/master/styles/rhumba-3.sty).

**music21** — no progression *generator*, but `figuredBass` is a genuine rule-based voice-leading engine (parallel fifths/octaves, voice crossing/overlap, spacing; resolves augmented-sixth and diminished-seventh chords specially) that enumerates all rule-satisfying realisations. Closest thing to a ready-made voice-leading rule set in the whole search. Source: [figuredBass.realizer](https://music21.org/music21docs/moduleReference/moduleFiguredBassRealizer.html).

**mingus / tonal.js** — both are thin wrappers over the same textbook data (scale-degree semitone tables, standard substitution pairs). tonal.js (MIT) is safe to port in spirit; mingus (GPL-3) should be re-derived from theory, not copied.

**Yamaha SFF / CASM** — see §4; the single most load-bearing find for a Cmajor accompaniment engine.

**JJazzLab / YamJJazz** — actively maintained, licence-documented (LGPL-2.1) Java engine that parses real `.sty/.prs/.bcs/.sst` files and reproduces Yamaha's NTR/NTT behaviour; useful as a **behavioural oracle** to validate a re-implementation against without Yamaha's proprietary spec. Source: [YamJJazz Yamaha-styles doc](https://jjazzlab.gitbook.io/user-guide/rhythm-engines/yamjjazz-rhythm-engine/yamaha-styles).

**Magenta** — Coconet / DeepBach / Improv RNN are neural, unusable inside Cmajor directly (heap, tensors, float32 matrices), but Magenta Studio proves such models *can* run fully offline (weights shipped, TF.js) — relevant only if the surrounding host ever wants an "AI suggest" panel outside the real-time engine.

**Other notable GitHub finds:** [AccoMontage2](https://github.com/billyblu2000/AccoMontage2) (MIT) — melody→chords→accompaniment via a note matrix `[start,end,pitch,velocity]` + a per-bar root-label matrix, phrase-selected from a 5,000-song corpus (retrieval not real-time-safe; the matrix representation is clean). [Ensembles](https://github.com/ensemblesaw/ensembles-app/blob/master/data/Styles/README.md) — an active FluidSynth arranger with its **own, much simpler** style format: plain Standard MIDI + text markers, transposed per pattern by `(root, chord type 0=major/1=minor)` only — an "80% of the value at 10% of the complexity" alternative to full Yamaha NTT. [music-accompaniment-generator](https://github.com/IVIosab/music-accompaniment-generator) — genetic algorithm whose fitness (in-key triad validity + melodic proximity + "reward exactly two repeated chords, punish more") reduces to cheap real-time scoring rules even though the search is not real-time. [Chords-Progressions-Transformer](https://github.com/asigalov61/Chords-Progressions-Transformer) (Apache-2.0) — transformer; same "needs a runtime" caveat as Magenta.

## 3. Best candidates to adapt (ranked)

1. **Yamaha CASM/NTR/NTT rule model** (the concept, not the binary format) — a real-time, integer-only, table-driven chord-transposition engine, battle-tested since the 1990s in embedded arranger keyboards. "Source chord + selectable transposition rule + selectable interval table, keyed by part role" is a functional technique, not protectable expression; JJazzLab (LGPL) shows it is independently re-implementable.
2. **MMA's groove/pattern format** — a fixed per-track pattern of (beat, duration, velocity, chord-tone reference). GPL: re-author our own pattern tables rather than importing MMA's library files.
3. **Impro-Visor's weighted `.sty` pattern rules + probabilistic grammar** — best fit for the phrase/melody half of the brief; a weighted-random small state machine over a short token alphabet is trivial in Cmajor. GPL-2, same re-authoring caveat.
4. **mingus / tonal.js roman-numeral and substitution tables** — tiny, standard music theory; tonal.js is MIT.
5. **Improv RNN's 36-slot chord-vector encoding + a CoreaChord-style N×N Markov table** — Apache-2.0 encoding idea as the internal "current chord" representation, driving a hand-tuned, baked-in transition table (CoreaChord's *architecture*, not its unlicensed weights).

**Licence framework used:** ideas, mechanisms and rule *shapes* are not copyrightable and are safe to re-implement regardless of source licence. Concrete GPL *data* (MMA grooves, Impro-Visor `.sty` files, mingus tables) must be re-authored, not copied, if the plugin is to stay unencumbered. MIT/BSD/Apache material (tonal.js, teoria.js, music21, DeepBach, Magenta, pretty_midi, AccoMontage2) can be ported with attribution. Yamaha's own byte-level tables were never fully published even in the reverse-engineered docs, so there is nothing of theirs *to* copy — only the rule concept.

## 4. Data models worth copying

**A. Yamaha CASM `Ctab`/NTT rule set (per channel/part):** Source Chord = root (0–11) + type (default `CM7`) — the key the pattern was recorded in; **NTR** ∈ {Root Trans, Root Fixed, Guitar} selects the transposition *strategy* (Root Trans preserves interval shape — C3/E3/G3 → F3/A3/C4 going to F; Root Fixed keeps notes close to the previous register — C3/E3/G3 → C3/F3/A3); **NTT** picks one of eleven interval-remap tables (Bypass, Melody, Chord, Bass, Melodic Minor, Harmonic Minor, Natural Minor, Dorian — several with a "5th variation" — plus Guitar-only All-Purpose/Stroke/Arpeggio); **High Key** + **Note Low/High Limit** clamp/octave-wrap the result; **Retrigger Rule** ∈ {Stop, PitchShift[+ToRoot], Retrigger[+ToRoot], NoteGenerator} governs notes still sounding when the chord changes. A complete, closed rule set — an enum-driven table lookup, ideal for Cmajor.

**B. Impro-Visor `.sty` weighted pattern rule:** `(bass-pattern (rules B8/3 R8/3 B8/3 …) (weight 46.0))` — small alphabet (B = root/bass tone, C = chord tone, R = rest, X = chord hit) with duration suffixes, several weighted alternatives per section (bass/chord/drum), chosen by weighted random draw each time the section repeats. Maps to a `struct { tokenType; durationTicks; weight; }[N]` table per style section.

**C. mingus / tonal.js roman-numeral tables:** `numerals=[I,II,III,IV,V,VI,VII]` ↔ `intervals=[0,2,4,5,7,9,11]`, plus a fixed substitution pair table `[(I,III),(I,VI),(IV,II),(IV,VI),(V,VII)]` — a seven-entry and a five-entry constant array; standard functional-harmony theory, not anyone's IP.

## 5. Weakest-verified items

Schwarzonator's internal decision logic (marketing pages only; no patch source read); Ensembles' exact licence file (org convention suggests GPL-3.0; not opened directly); CoreaChord and music-accompaniment-generator both state no licence — treat any reuse of their literal weights/code as unsafe; only their architecture is described here.

## 6. Sources

- [mellowood.ca/mma](https://www.mellowood.ca/mma/), [MMA groove essay](https://www.mellowood.ca/music/essays/mma/mma-groove.html), [github.com/infojunkie/mma](https://github.com/infojunkie/mma)
- [Impro-Visor (HMC)](https://www.cs.hmc.edu/~keller/jazz/improvisor/), [github.com/Impro-Visor/Impro-Visor](https://github.com/Impro-Visor/Impro-Visor), [rhumba-3.sty](https://github.com/Impro-Visor/Impro-Visor/blob/master/styles/rhumba-3.sty)
- [music21](https://github.com/cuthbertLab/music21), [figuredBass.realizer](https://music21.org/music21docs/moduleReference/moduleFiguredBassRealizer.html), [roman](https://music21.org/music21docs/moduleReference/moduleRoman.html)
- [python-mingus](https://github.com/bspaans/python-mingus), [progressions.py](https://github.com/bspaans/python-mingus/blob/master/mingus/core/progressions.py)
- [tonal.js](https://github.com/tonaljs/tonal), [@tonaljs/progression](https://github.com/tonaljs/tonal/tree/main/packages/progression)
- [teoria.js](https://github.com/saebekassebil/teoria)
- [Magenta Coconet](https://magenta.tensorflow.org/coconet), [Improv RNN](https://github.com/magenta/magenta/tree/main/magenta/models/improv_rnn), [Magenta Studio](https://magenta.tensorflow.org/studio)
- [DeepBach](https://github.com/Ghadjeres/DeepBach), [paper](https://proceedings.mlr.press/v70/hadjeres17a/hadjeres17a.pdf)
- [Schwarzonator](https://maxforlive.com/library/device/625/schwarzonator)
- [Yamaha CASM pt. 1](http://www.jososoft.dk/yamaha/articles/casm_1.htm), [pt. 2](http://www.jososoft.dk/yamaha/articles/casm_2.htm)
- [JJazzLab](https://github.com/jjazzboss/JJazzLab), [YamJJazz Yamaha-styles doc](https://jjazzlab.gitbook.io/user-guide/rhythm-engines/yamjjazz-rhythm-engine/yamaha-styles)
- [Sonic Pi](https://github.com/sonic-pi-net/sonic-pi)
- [Euterpea](https://www.euterpea.com/), [Euterpea2](https://github.com/Euterpea/Euterpea2)
- [OpenMusic](https://github.com/openmusic-project/openmusic)
- [Bol Processor](https://github.com/bolprocessor/bolprocessor), [grammars](https://bolprocessor.org/bol-processor-grammars/)
- [abjad](https://github.com/Abjad/abjad)
- [pretty_midi](https://github.com/craffel/pretty-midi)
- [CoreaChord](https://github.com/wchen777/CoreaChord)
- [cmajor-lang/cmajor](https://github.com/cmajor-lang/cmajor), [examples/patches](https://github.com/cmajor-lang/cmajor/tree/main/examples/patches), [std_library_midi.cmajor](https://raw.githubusercontent.com/cmajor-lang/cmajor/main/standard_library/std_library_midi.cmajor)
- [AccoMontage2](https://github.com/billyblu2000/AccoMontage2)
- [Ensembles arranger](https://github.com/ensemblesaw/ensembles-app), [Styles README](https://github.com/ensemblesaw/ensembles-app/blob/master/data/Styles/README.md)
- [music-accompaniment-generator](https://github.com/IVIosab/music-accompaniment-generator)
- [Chords-Progressions-Transformer](https://github.com/asigalov61/Chords-Progressions-Transformer)
