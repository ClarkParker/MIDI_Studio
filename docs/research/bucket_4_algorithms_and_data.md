# Research bucket 4 — algorithms, theory formalisations and datasets for "good" progressions

Raw research notes, 2026-09-17. Produced by a delegated web-research pass
(35+ varied searches; primary sources confirmed via fetch where reachable —
Hooktheory API docs and 1300-song analysis, Chordonomicon paper + GitHub,
Temperley's Kostka-Payne statistics page, Zenodo iRealPro record, the PMC tonal
tension paper, Impro-Visor). A few original PDFs (Tymoczko, Steedman, a Vassar
pop-harmony paper) were unreadable via fetch; those claims rest on multiple
convergent secondary summaries and are flagged. Anything not confirmed from a
primary source is marked **(unverified)**. Synthesis:
[`../07_MARKET_ANALYSIS.md`](../07_MARKET_ANALYSIS.md).

## 1. Datasets

| Dataset | Size | Content | Licence | Format | Compact transition table derivable? | URL |
|---|---|---|---|---|---|---|
| **Hooktheory TheoryTab / Trends (API)** | "75,000+ songs" per Hookpad copy; the TheoryTab page cites 50,000+ user transcriptions (figures vary by page) | Human-transcribed pop chords + melody; "Trends" gives next-chord and overall probability for the ~28 most common chords | Proprietary, OAuth-gated API; no redistribution / commercial-use terms stated on the docs page **(unverified)** | JSON/XML: `chord_ID`, `chord_HTML`, `probability`, `child_path`; rate-limited 10 req/10 s | **Yes** — it already *is* a probability table | hooktheory.com/api/trends/docs |
| **McGill Billboard** | 890 randomly sampled Billboard Hot 100 slots (~740 usable) | Expert chord + structure + key transcriptions, 1958–1991 US chart hits; no audio | CC0 (cite the ISMIR paper) | HTK `.lab`; mirdata loader | Yes — standard MIR benchmark | ddmal.music.mcgill.ca; kaggle.com/datasets/jacobvs/mcgill-billboard |
| **Isophonics** | 179 Beatles songs + smaller Queen/Zweieck/King sets | Chords, key, beat, segmentation | Free for research use | `.lab` text | Yes, small "gold" set | isophonics.net/datasets |
| **iRealPro Corpus of Jazz Standards** | ~1,300–1,410 tunes in shared playlists; academic conversion 1,186 tunes | Jazz-standard changes in the proprietary "irealb" encoding | App charts are community-shared (chords-only; bulk redistribution is a grey area **(unverified)**); the DCMLab/Zenodo release is CC BY 4.0 | `irealb` URL-encoded text; converted to **kern/MusicXML/JSON | Yes, for jazz / ii–V–I statistics | zenodo.org/records/3546040; github.com/DCMLab/JazzHarmonyTreebank |
| **ChoCo (Chord Corpus)** | 20,000+ annotated tracks/scores from 18 aggregated sources | Harmonised multi-genre chords + keys | Mixed, inherits per-source licences; code open | JAMS (JSON) | Yes — best single aggregation point | github.com/smashub/choco; nature.com/articles/s41597-023-02410-w |
| **Chordonomicon** | 666,000+ (679,807 v2) songs, ~52 M chords, 749 unique chord symbols | Ultimate-Guitar-scraped chords (Harte syntax) + structure labels (verse/chorus/…) + Spotify genre/decade | **Apache-2.0** | CSV + pre-tokenised pickles + per-song graph | **Yes — by far the largest**; ideal for per-genre / per-section mining | github.com/spyroskantarelis/chordonomicon; arXiv:2410.22046 |
| **Kostka-Payne corpus (Temperley statistics)** | 46 excerpts, 919 chords (classical) | Roman-numeral analyses of the Kostka & Payne workbook | Textbook-derived, widely reused (formal licence **unverified**) | Roman-numeral text | Small, clean sanity check | davidtemperley.com/kp-stats |
| **Kaggle / GitHub chord-progression sets** | Small–medium **(unverified)** | Crowd-submitted progression lists | Mostly CC/MIT | CSV/JSON | Supplementary only | kaggle.com/datasets/joebeachcapital/chord-progressions |
| **Chordify** | Not downloadable | ML-*detected* chords from audio | Proprietary | Service, not a dataset | No — inspiration only | chordify.net |

## 2. Methods

| Method | Type | Produces | Fits a small real-time table engine? | Evidence | URL |
|---|---|---|---|---|---|
| Markov chain / n-gram over roman numerals (order 1–3) | Statistical | Next-chord sampling | **Yes** — a fixed order-1/2 table is tiny, O(1) lookup | Order-1 "wanders aimlessly"; order-3+ "rehashes" the corpus; order-2 with order-1 back-off is the practical sweet spot **(exact optimum unverified)** | Hooktheory blog; Linskens (Maastricht) thesis; NHSJS Markov-order study |
| **Rohrmeier generative grammar of tonal harmony** | Grammar: recursive phrase structure, 4 levels (phrase → function {t, d, s, tp, dp, sp, tcp} → scale degree → surface) | Full harmonic trees incl. modulation | Partial — the full grammar is more than needed, but its T/S/D **functional level** collapses into a small finite-state machine | Peer-reviewed (*J. Math. Music*, 2011); argues flat Markov tables under-fit real harmonic syntax | tandfonline.com/doi/10.1080/17459737.2011.573676 |
| **Steedman's jazz grammar (12-bar blues)** | Grammar: CFG rewrite rules | All well-formed blues variants incl. turnarounds / substitutions | **Yes** — a handful of rewrite rules ⇒ literal fixed rule table | Classic (*Music Perception*, 1984), grounded in a real jazz corpus | homepages.inf.ed.ac.uk/steedman; en.wikipedia.org/wiki/Chord_rewrite_rules |
| **Kostka-Payne / T–PD–D functional flow chart** | Rule: small directed graph | Legal "next function" moves | **Yes** — 3–6 node fixed graph, the simplest workable grammar | Corpus-backed: V→I, I→V, ii→V, I→IV dominate 919 sampled chords | davidtemperley.com/kp-stats |
| **Neo-Riemannian PLR + T/S/D relabelling** | Algebraic/rule | Smooth triad-to-triad moves | **Yes** — three fixed lookup operations over 24 triads | Well established (Lewin, Cohn); implemented in music21 | viva.pressbooks.pub (Open Music Theory); music21.org |
| **Tymoczko voice-leading geometry** | Geometric/combinatorial | Minimal-movement mapping between two chords' voices | **Yes** — tiny search space per chord pair | Peer-reviewed (*Science* 313, 2006; *A Geometry of Music*, OUP 2011) | dmitri.mycpanel.princeton.edu |
| **Chord substitution rules** (tritone sub, secondary dominants, borrowed / modal interchange, diminished passing, Neapolitan, ii–V insertion) | Rule-based lookup/replace | Reharmonisation / added colour | **Yes** — each rule is a tiny static table; matches what RapidComposer / Scaler ship | Standard jazz pedagogy; RapidComposer documents this exact rule list | musicdevelopments.com/RCUserGuide.pdf; online.berklee.edu |
| **Impro-Visor probabilistic context-free grammar** | Grammar + learned statistics | Melodic lines via chord-tone / colour-tone / approach-tone categories | Partial — the category shapes port to a fixed table; learning the grammar is offline-only | Peer-reviewed (Keller et al.); listener study: 95 % / 90 % / 85 % correct style matching (Brown / Davis / Hubbard) | cs.hmc.edu/~keller/jazz/impro-visor |
| **Tonal Interval Space tension model** (Navarro / Bernardes et al.) | Closed-form scoring heuristic | Scalar tension curve per progression | **Yes** — weighted sum of ~6 precomputable features, no runtime ML | Validated against 15 + 73 listeners: ρ = 0.75 (Lerdahl's model ρ = 0.68, MorpheuS ρ = 0.70 on the same task) | pmc.ncbi.nlm.nih.gov/articles/PMC7712964 |
| **Lerdahl TPS / Farbood parametric tension** | Cognitive / psychoacoustic model | Distance-based tension / attraction | Partial — TPS distances precompute into a lookup table; Farbood's fit is heavier | Foundational; basis for the better-correlated TIS model above | Lerdahl, *Tonal Pitch Space*; Farbood PhD 2006 |
| **ChordGAN / chord-conditioned Transformers / MelodyDiffusion / Anticipatory Music Transformer** | ML | Melody ↔ chord conditional generation | **No** at runtime; **yes** as an offline distillation source for baked-in tables | Peer-reviewed; AMT confirmed to power Hooktheory's "Aria" co-writer | johnthickstun.com (AMT pdf); hooktheory.com/blog/generative-ai-songwriting |
| **Commercial black boxes** (Soundraw, Orb Producer, Lemonaide, Staccato, Musia) | Undisclosed, likely ML/rule hybrid | Chords + melody + arrangement per mood/genre tag | No direct fit — method unpublished | No published method for any **(unverified throughout)**; Musia's marketing describes "generate chords → chord-to-note melody generator → post-process" | landr.com; lemonaide.ai; blog.staccato.ai; github.com/lachlanchen/Musia |

## 3. What the data says

**Named progressions with strong empirical support (major key, pop/rock):** I–V–vi–IV (the most-cited pop loop); I–vi–IV–V (1950s "doo-wop" schema); vi–IV–I–V (1990s "singer-songwriter" schema — same set, different downbeat); IV–V–vi–I ("hopscotch", common since ~2010); vi–ii–V–I as a pop/jazz turnaround; ii–V–I as the single most common jazz cadential cell; 12-bar blues (I–IV–I–V–IV–I with turnaround variants); in minor, the Andalusian cadence i–♭VII–♭VI–V. (Wikipedia: I–V–vi–IV progression; Open Music Theory "Four-Chord Schemas"; Wikipedia: Andalusian cadence.)

**Hooktheory's own analysis of ~1,300 songs** (transposed to C major): I, IV and V are the most-used chords, with IV and V each appearing in *more* progressions than I itself; vi is a clear fourth, then usage drops steeply; C major / A minor is by far the most common key pair. One concrete transition finding: after iii, the next chord is vi or IV 93 % of the time in their corpus.

**Kostka-Payne / Temperley corpus** (classical, 919 chords): the most frequent root motions are V→I, I→V, ii→V, I→IV — descending-fifth motion dominates ascending-fifth (308 vs 167), descending-third beats ascending-third (65 vs 32), ascending-second beats descending-second (127 vs 65). Major- vs minor-key transition distributions differ only modestly.

**Scale check:** Chordonomicon's 666,000+ songs / ~52 M chords (749 unique symbols; long-tail usage, exact exponent **unverified**) confirm that the same handful of progressions dominate by raw frequency across a much larger and more recent corpus, while real usage is far more chromatically varied once you leave the high-frequency head than the "same four chords" meme suggests.

**Hooktheory Trends / API** is literally a next-chord probability table. The often-repeated example that V follows a IV→I context ~44 % of the time comes from third-party descriptions, not the docs page — indicative, not exact **(unverified)**.

## 4. A practical recipe

Layer several evidence-backed pieces so pure Markov's known "wanders / repeats" failure (Rohrmeier's critique) is corrected without leaving fixed-table, no-heap territory:

**Layer 1 — Legal-move grammar (functional state machine).** Collapse Rohrmeier's tonic / subdominant / dominant level and the Kostka-Payne T → PD → D → T flow chart into one small fixed directed graph (6–9 states per mode). Defines which scale-degree moves are syntactically legal — matching the corpus finding that V→I, I→V, ii→V, I→IV dominate. Cost: one fixed adjacency table.

**Layer 2 — Empirical weighting (order-2 Markov, baked offline).** Among the moves Layer 1 allows, weight choices with transition probabilities mined offline from Chordonomicon (Apache-2.0) and/or McGill Billboard (CC0), cross-checked against Hooktheory's published Trends numbers. Order-2 with order-1 back-off sits between "too generic" and "over-fit". Bake the result into a static table (a few hundred values per key-mode) — no training or allocation at runtime. A rarity / "temperature" control trades safe vs surprising choices from the same table.

**Layer 3 — Colour / substitution rules (post-process).** Recolour individual chords via a small fixed rule table: secondary dominants, tritone substitution, borrowed / modal interchange, diminished passing chords, Neapolitan, ii–V insertion before a target. This is exactly what RapidComposer / Scaler ship as static rule libraries, so it is proven practical at this scale.

**Layer 4 — Voice-leading realisation.** Convert the finished sequence into voiced chords with a Tymoczko-style minimal-movement resolver: per step, search the small set of realistic voicings / inversions and keep the one minimising total voice movement while forbidding parallel fifths / octaves. A cheap bounded search, not a general optimiser.

**Optional Layer 5 — Tension-arc quality gate.** Score a few candidate progressions with a closed-form heuristic modelled on the Tonal Interval Space formula and keep whichever candidate's tension shape best matches the target section (e.g. rising into a chorus).

Every layer is either a static lookup table or a small bounded search — the closest realistic fit to a real-time, no-heap Cmajor engine — and each is separately evidenced.

## 5. Melody over chords

1. **Chord-tone / non-chord-tone taxonomy** — the mechanism behind Hookpad's harmonic note entry: chord tones on strong beats; weak beats filled with passing tones (stepwise between chord tones), neighbour tones (return to the same chord tone) or suspensions (held from the prior chord, resolved down by step). Table-encodable: a fixed {chord tones / colour tones / avoid notes} list per chord quality, plus a small metric-strength table deciding which category is allowed where.
2. **Impro-Visor's three-way role split + small PCFG:** every note is a chord tone, colour tone (other scale tones, e.g. 9th / 13th) or approach tone (chromatic, resolves by half step into the next chord tone); a small probabilistic grammar governs rhythm and role sequencing. The categories generalise to a fixed table; only corpus learning stays offline. Listener-validated (95 / 90 / 85 % style matching).
3. **Constraint + priority colouring, as shipped by Hookpad and Captain Melody:** notes are checked live against the current chord + scale and tagged by role (Captain Melody: blue = stable, green = interesting, yellow = tense, red = off-scale); a "Follow Chords" mode re-weights scale-degree probabilities to the underlying chord in real time. Fully compatible with a fixed per-chord-quality lookup table.
4. **Cheap motif development:** state a short 3–5 note motif at phrase start, then reuse it across the progression via deterministic low-cost transforms — transpose to the new chord root, invert, fragment, sequence up/down a step per chord — instead of generating every note independently. Keeps melodies recognisable at the cost of a few precomputed transform tables.

## 6. Sources

- Hooktheory Trends API docs — hooktheory.com/api/trends/docs
- Hooktheory, "I analyzed the chords of 1300 popular songs…" — hooktheory.com/blog/i-analyzed-the-chords-of-1300-popular-songs-for-patterns-this-is-what-i-found
- Hooktheory Hookpad / Magic Chord & Aria — hooktheory.com/blog/generative-ai-songwriting; hooktheory.com/hookpad/aria
- Hooktheory Book I / TheoryTab — hooktheory.com/books/one; hooktheory.com/theorytab/about
- McGill Billboard Project — ddmal.music.mcgill.ca; kaggle.com/datasets/jacobvs/mcgill-billboard
- Isophonics — isophonics.net/datasets
- iRealPro Corpus of Jazz Standards (Zenodo) — zenodo.org/records/3546040; Jazz Harmony Treebank — github.com/DCMLab/JazzHarmonyTreebank
- ChoCo (Scientific Data, 2023) — nature.com/articles/s41597-023-02410-w; github.com/smashub/choco
- Chordonomicon — github.com/spyroskantarelis/chordonomicon; arXiv:2410.22046; huggingface.co/datasets/ailsntua/Chordonomicon
- Kostka-Payne corpus statistics (Temperley) — davidtemperley.com/kp-stats
- Rohrmeier, "Towards a generative syntax of tonal harmony" (2011) — tandfonline.com/doi/10.1080/17459737.2011.573676
- Steedman, "A Generative Grammar for Jazz Chord Sequences" (1984) — homepages.inf.ed.ac.uk/steedman/papers/music/40285282.pdf; en.wikipedia.org/wiki/Chord_rewrite_rules
- Neo-Riemannian / PLR — viva.pressbooks.pub/openmusictheory; music21.org/music21docs/moduleReference/moduleAnalysisNeoRiemannian.html
- Tymoczko, "The Geometry of Musical Chords" (*Science*, 2006); *A Geometry of Music* (OUP, 2011) — dmitri.mycpanel.princeton.edu
- RapidComposer user guide — musicdevelopments.com/RCUserGuide.pdf
- Berklee Online, "Chord Substitution and Reharmonization" — online.berklee.edu/takenote/reharmonization-simple-substitution
- Impro-Visor — cs.hmc.edu/~keller/jazz/impro-visor
- Navarro, Bernardes et al., tonal tension in the Tonal Interval Space — pmc.ncbi.nlm.nih.gov/articles/PMC7712964
- Lerdahl, *Tonal Pitch Space* (OUP); Farbood, "A Quantitative, Parametric Model of Musical Tension" (PhD, 2006)
- Huron, *Sweet Anticipation* (MIT Press)
- Chordify algorithm explainer — chordify.net/pages/technology-algorithm-explained
- MusicLang — github.com/MusicLang/musiclang
- Anticipatory Music Transformer (Thickstun et al.) — johnthickstun.com/assets/pdf/anticipatory-music-transformer.pdf
- ChordGAN — semanticscholar.org/paper/ChordGAN; MelodyDiffusion — mdpi.com/2227-7390/11/8/1915
- Commercial (method undisclosed): Soundraw, Orb Producer — landr.com; Lemonaide — lemonaide.ai; Staccato — blog.staccato.ai; Musia — github.com/lachlanchen/Musia
- Mixed In Key Captain Melody — mixedinkey.com/captain-melody
- Wikipedia: I–V–vi–IV progression; Andalusian cadence; Nonchord tone
