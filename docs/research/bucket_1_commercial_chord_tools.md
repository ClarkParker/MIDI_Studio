# Research bucket 1 — commercial chord-progression / harmony tools

Raw research notes, 2026-09-17. Produced by a delegated web-research pass
(24 varied searches; official pages and manuals fetched for Scaler, InstaChord,
Captain Chords, Chordjam, Cthulhu, Chord Prism, ChordPotion, Chordz, Harmony
Bloom, Hookpad, RapidComposer, Sundog, Liquid Music, Odesi, LANDR Composer,
Chord Genie, the Ableton manual, Apple/Logic support, the Bitwig user guide,
Reason Studios and Steinberg help). Prices and versions are as found on that
date and will drift. Anything not confirmed is marked **(unverified)**.
Synthesis: [`../07_MARKET_ANALYSIS.md`](../07_MARKET_ANALYSIS.md).

## 1. Comparison table

| Name | Maker | Version / year | Price | Mechanism for progressions | → Parts? | Follows external chords? | Format | USP |
|---|---|---|---|---|---|---|---|---|
| Scaler 3 | Scaler Music (ex-Plugin Boutique) | 3.3, Mar 2025 | $99 (upgrade $29) | 1,000+ curated chord sets + theory rules (modal interchange, neo-Riemannian, negative harmony) | Yes: melody/bass/arp ("Motions") | Audio + MIDI (Scaler Detector) | VST/VST3/AU/AAX/standalone, iPad | Deepest theory engine + built-in detector |
| InstaChord 2 | W.A. Production | 2.0.8, May 2024 | $89 | 24-key one-finger performance mapping + AI pattern generation (from InstaComposer) | Chords + rhythm/strum patterns only | No (MIDI-in for custom chords only) | VST/VST3/AU/AAX | Fastest live-performance chord playing |
| Captain Chords (Captain Plugins Epic) | Mixed In Key | Epic suite, 2025–26 | $79 (3-pack) / $99 Epic | Cloud AI + 96,000+ hit-song presets by genre | Yes: Melody & Deep (bass) companion plugins | Key/scale detection (not full chord audio detection) | VST/VST3/AU/AAX | Largest "real hit song" preset bank |
| Chordjam | Audiomodern | 1.5 | $49 (often $19–39) | User-guided randomisation ("robot mode") from single-key input | Groove/rhythm generator only | No | VST/VST3/AU/AAX/CLAP, Mac/Win/iOS | Generative, Eurorack-style feel |
| Cthulhu | Xfer Records | 1.14 (Win) / 1.1 (Mac) | $39 | 150+ preset chord memoriser + step-sequenced arpeggiator | Arp/pattern only | MIDI import/record + sorts by circle of fifths | VST/AU/AAX | Cheapest legacy standard, no online requirement |
| Ripchord | Trackbout | — | Free (GPLv3, open source) | Pure custom note→chord mapping, no suggestion logic | No | No | VST/VST3/AU, Win/Mac | Free, open source |
| Chord Prism 2 | Mozaic Beats | 2 | $49.99 | Keyboard split: chords (left) + patented "Smart Scale" (right) | Yes: bass/melody via Smart Scale + Multi Arp | No | VST/VST3/AU/AAX | Fixed-hand-position melody/bass writing |
| Suggester 2 | Mathieu Routhier | 2 | Free + IAP **(exact tier unverified)** | Roman-numeral / harmonic-function next-chord suggestion | No | No | AUv3 (macOS/iOS), Android | Cheap, function-first indie tool |
| ChordPotion | FeelYourSound | 2.5.0, Apr 2025 | €49 / $57 | Four parallel sequencer rows transform DAW chord input into new patterns | Yes: arps, bass, melody | **Yes — reacts live to chords played into it** | VST2/VST3/AU | Downstream "chord transformer", not a picker |
| Chordz | CodeFN42 | 1.14 | Free | Single-note → multi-note trigger, 40+ templates, 50+ chord types | No | No | VST2, Windows only | Best free, deep text-file customisation |
| Harmony Bloom | Mario Nieto World (*not* Mozaic — brief's attribution corrected) | 2026 | €29 | Visual circular-grid generator, 57 "Note Collections" | Melodic pattern generation, not song structure | No | VST3/AU/standalone, iPad AUv3 | Visual/generative, not progression-first |
| Orb Producer Suite → LANDR Composer | Hexachords → LANDR | Orb 3 = end of life (LANDR confirms no more Orb updates); LANDR Composer current | From $8.25/mo (LANDR Studio) | AI generation across chords/bass/arp/melody modules; Composer adds its own synth | Yes: bass, melody, arps, sound | No | VST3/AU/AAX | Only tool that is chord generator + instrument in one |
| Odesi | Mixed In Key | Legacy (community reports de-prioritisation — **official EOL unverified**) | $49 | 138 progressions mined from Spotify/Beatport top-100s, 1986–now | Yes: melody/hook, bassline, beats | Key/scale detection | Standalone (Win/Mac), hosts VSTs | All-in-one-screen harmonic sketchpad |
| Hookpad | Hooktheory | 2.1.0 | Free tier; $7.99/mo or $199 lifetime; Aria AI +$14.99/mo | "Magic Chord": statistical lookup against 75,000+ crowd-analysed real songs (TheoryTab) | Yes: 4-voice melody, lyrics | No (browser-only, no audio/MIDI in) | Web app only, no plugin | Only corpus-scale, transparent "real songs say X" engine |
| RapidComposer | MusicDevelopments | 6.2, Sep 2026 | $199 (Light edition cheaper) | Master Track defines chords/scale; library phrases auto-adapt live to it; Neural Phrase Engine | Yes: full multi-track composition, bass/melody/guitar tab | MIDI import adapts to Master Track | Standalone (Win/Mac), hosts VSTi | Whole phrase-based composition environment |
| Sundog Song Studio | FeelYourSound | 4.0.0 | €59 / $69 | 500+ preset progressions + scale-locked input + Scale Finder | Yes: melody, bass, arps | MIDI import with scale detection (v3.6+) | Standalone, MIDI cable to DAW | Approachable "songwriter's assistant" GUI |
| Liquid Music | WaveDNA | **Store closed Mar 2026** (existing licences only) | Discontinued | Draw a contour → notes auto-fit harmonically; separate Chord Suggester/Sequencer | Yes: melody via sketch, rhythm | No | VST/AU/AAX/M4L | Unique "draw a shape" harmonic paradigm — now dead |
| Unison MIDI Chord Pack / Chord Genie / MIDI Wizard | Unison Audio | Wizard 2.0 | Pack = bundle; Genie $7 promo / $97; Wizard **(exact unverified)** | Pack = 1,200+ static MIDI files; Genie/Wizard = one-click AI, 32 genres | Yes (Wizard): melody, hybrid mode | No | Drag-drop MIDI / plugin | Cheapest AI entry point |
| Chord Composer | Intuitive Audio **(site appears inactive; unverified)** | — | £40 | Preset-populated 4-bar sequencer + guitar/strum "Chord Player" mode | Strum/guitar realism only | No | VST/AU/AAX, iLok | Strumming realism focus |
| Logic Pro (Chord Track + Chord ID) | Apple | Logic Pro 12, Jan 2026 | Included | Global Chord Track; **Chord ID** auto-transcribes chord + harmonic rhythm from audio/MIDI (~85–90 % first-pass accuracy per reviewers) | Yes: Session Players (bass/keys/synth/drummer) follow it | Audio + MIDI (Chord ID is new in v12; Logic 11's Chord Track could not detect) | DAW-native | Most automatic audio→chord pipeline |
| Cubase / Nuendo (Chord Track / Pads / Assistant) | Steinberg | Cubase 15, Nov 2025 | Pro/Artist tiers | Chord Track + Chord Pads (16-pad grid); Chord Assistant: Proximity (harmonic-distance rule) & Circle-of-Fifths modes | Yes: Pattern Sequencer inherits chords (v15) | Audio→MIDI chords since Cubase 12 (voicing/inversion not preserved) | DAW-native | Most mature theory-visual UI |
| Ableton Live (MIDI Tools) | Ableton | Live 12 (2024) / 12.2 (2026) | Standard/Suite | Generators: Seed, Rhythm, Shape, Stacks (1–4 chords from active Scale), Euclidean (M4L); scale-aware Transformations | No dedicated engine; "Expressive Chords" M4L device (12.2) triggers 52 sets from one note | No audio/MIDI chord detection in core Live | DAW-native + M4L | Generative sandbox, explicitly not a "suggest the answer" tool |
| Studio One (Chord Track / Selector) | PreSonus | 7.2, 2026 | Pro tier | Chord Selector: click root/quality/extension, play MIDI, or type "Cmaj7" | Tracks set to follow the Chord Track transpose | Audio + MIDI ("Detect Chords") | DAW-native | Most flexible manual entry; Nashville numbers (7.2) |
| FL Studio (Piano Roll chord tools) | Image-Line | 2026.1.6 | Included | Chord Stamp (Top-down / Bottom-up voice-leading modes, new 2026), Scale Highlighting, Riff Machine (8-step chain) | Riff Machine covers arps/grooves | Chord Detection panel from MIDI/typed input (max 10 notes), no audio | DAW-native | Deepest piano-roll-integrated workflow; no separate chord track |
| Bitwig Studio | Bitwig | 6.1, 2026 | Full/upgrade tiers | Project Key Signature (23 scales) + Snap/Quantize-to-Key; modular Note Grid chord builder | Via modular Note FX chaining | Harmonize device follows another MIDI track only | DAW-native + modular Grid | Only DAW exposing chord tools as a patchable device graph |
| Reason Players: Scales & Chords / Chord Sequencer | Reason Studios | Chord Sequencer 1.1.3, Apr 2025 | Scales & Chords free with Reason; Chord Sequencer $69 or Reason+ | Scales & Chords = programmatic one-finger chords; Chord Sequencer = 100+ sets (1,500+ chords) curated by musicians, colour-scored "next chord fit" | No | No | Reason Player device | Explicit split: generated vs human-curated + visually scored |
| J74 Progressive *(discovered)* | Fabrizio Poce | 4.1.7 | €18 | Diatonic scale/chord exploration + circle-of-fifths view + audio analyser | Arps, humanised timing | Yes — audio and MIDI analyser | Max for Live | Deep, cheap Ableton-native toolkit |
| AudioCipher *(discovered)* | AudioCipher Inc. | 3.0, Dec 2022 | $29.99 | Text → musical cryptogram seed melody → chords built from it | Melody (core) + chords | No | VST/AU + standalone | Only "type a word" input |
| MIDI Agent *(discovered)* | MIDI Agent | current | Subscription **(tiers unverified)** | Natural-language prompt to a connected LLM generates MIDI | Yes: melody, harmonisation, continuation | Can extend/harmonise user MIDI | VST3/AU/AAX/standalone | Only conversational LLM wrapper for MIDI |
| Fluid Chords 2 *(discovered)* | Pitch Innovations | 2 | $99 (intro $49) | Real-time "chord bending": voice-leading engine morphs any chord → any chord; one-click Intelligent Harmony Engine | Yes: built-in hybrid wavetable/MPE synth | No | VST3/AU/AAX | Only tool built entirely around continuous voice leading |
| ChordChord / AutoChords.com *(discovered)* | Independent web apps | — | Free (freemium) | Parameter-based (key/mood/style) generation | Yes: melody, drums (ChordChord) | No | Browser only, MIDI download | Zero-cost entry point |

## 2. Notes on major items

**Scaler 3** — 1,000+ chord sets plus actual audio+MIDI listening (Scaler Detector) to identify key/scale/chords from a live source; neo-Riemannian and negative-harmony substitution on top. [scalermusic.com](https://scalermusic.com/products/scaler-3/)
- Users report v3's UI regressed on v2's most-used feature: harder to see which chord you are currently playing highlighted on the keyboard; more tabs/views needed to build one progression. [Scaler forum](https://forum.scalermusic.com/t/scaler-3-where-did-half-the-features-go-sure-this-is-not-beta/20304)
- Gearspace users called the v3 launch "rushed" and less intuitive than v2 despite more features. [Gearspace](https://gearspace.com/board/new-product-alert/1441519-scaler-music-announces-scaler-3-a.html)

**InstaChord 2** — Up to 24 chords mapped across the keyboard for one-finger performance, five hold modes, strum-direction presets; Pattern Editor drags notes like a mini piano roll. [waproduction.com](https://waproduction.com/plugins/view/instachord-2)
- Positioned as speed over theory: "does less to teach users why they work or suggest where a progression might go next" vs Scaler. [AudioCipher comparison](https://www.audiocipher.com/post/scaler-2-vs-captain-chords)

**Captain Chords** — Generation is cloud-based (needs internet even to generate new sequences), drawing on 96,000+ progressions tagged by genre/hit song. [mixedinkey.com](https://mixedinkey.com/captain-plugins/captain-chords/)
- Recurring complaints: mandatory online connection, DAW-resource-heavy, thin internal sound library, "manual MIDI editing generally required after the Captain has done his thing." [KVR](https://www.kvraudio.com/forum/viewtopic.php?t=579842)

**Cthulhu** — No suggestion algorithm: a memoriser/player for 150+ factory or user-recorded chords, sorted by circle of fifths / chromatic / low note, driven through an 8-tab step-sequenced arpeggiator. [xferrecords.com](https://xferrecords.com/products/cthulhu)

**Hookpad** — The one tool whose "good progression" definition is fully transparent and corpus-based: Magic Chord ranks next-chord suggestions by frequency across 75,000+ crowd-analysed TheoryTab songs. [hooktheory.com](https://www.hooktheory.com/theorytab/about)
- Web-only, no VST/AU, no audio/MIDI listening. [Hookpad support](https://www.hooktheory.com/support/hookpad)

**RapidComposer** — Inverts the usual model: a Master Track holds the chord/scale progression and a large phrase library "intelligently matches" itself to whatever chord is active, live. [musicdevelopments.com](https://www.musicdevelopments.com/)
- "Looks like a DAW but isn't"; reviewers note it demands a workflow shift. [MusicRadar](https://www.musicradar.com/reviews/tech/musicdevelopments-rapidcomposer-543269)

**Fluid Chords 2** — Built around a voice-leading engine that "bends" from any chord to any other in real time (Strum = sequential note bending, Flow = close/spread/cross resolution), plus a one-click Intelligent Harmony Engine. [Attack Magazine](https://www.attackmagazine.com/news/pitch-innovations-fluid-chords-2/)

**Reason: Chord Sequencer vs Scales & Chords** — both mechanisms side by side: Scales & Chords generates one-finger chords programmatically; Chord Sequencer plays back 1,500+ musician-curated chords and rates each next-chord option with a green-shade "how appropriate" score. [reasonstudios.com](https://www.reasonstudios.com/shop/rack-extension/chord-sequencer/)

**Cubase Chord Assistant** — Proximity ranks suggestions by harmonic distance from an origin/tonal-centre chord (farther = more complex); Circle-of-Fifths is a geometric picker with roman-numeral labels. Audio→chord detection since Cubase 12 cannot distinguish voicings/inversions. [Steinberg help](https://archive.steinberg.help/cubase_pro_artist/v9.5/en/cubase_nuendo/topics/chord_pads/chord_pads_chord_assistant_proximity_c.html) · [Sound on Sound](https://www.soundonsound.com/techniques/cubase-12-audio-midi-chords)

**Ableton Live 12 MIDI Tools** — Deliberately not a suggestion engine: Stacks builds 1–4 chords from the clip's active Scale with root/inversion/offset controls; Ableton frames the toolset as "a musical playground". [Sound on Sound](https://www.soundonsound.com/techniques/ableton-live-12-midi-generators)

**Logic Pro 12 Chord ID** — New Jan 2026: drag in audio, MIDI or a Voice Memo and Logic transcribes chord quality + harmonic rhythm into the Chord Track (~85–90 % first pass per reviewers); Session Players follow via a per-region "Pitch Source". [MusicRadar](https://www.musicradar.com/music-tech/apple-expands-logic-pros-ai-features-with-a-synth-player-and-a-personal-music-theory-expert-that-can-generate-chord-progressions-from-any-audio-or-midi-recording-that-you-play-it) · [CDM](https://cdm.link/logic-pro-12-hands-on/)

**Studio One 7.2** — Chord Selector accepts root/quality/extension clicks, played MIDI, or typed symbols ("Cmaj7", "F#m7b5"); v7.2 added Nashville Number System notation. [MusicTech](https://musictech.com/tutorials/studio-one/how-to-compose-with-studio-one/) · [Sound on Sound](https://www.soundonsound.com/news/presonus-release-studio-one-pro-72-update)

**FL Studio** — Chord Stamp gained explicit voice-leading modes in 2026 (Top-down = melody leads; Bottom-up = FL picks the chord), plus Scale Highlighting and the 8-step Riff Machine; the toolbar Chord Detection panel reads MIDI/typed input but not audio. [image-line.com](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/pianoroll_riff_chord.htm) · [Dubspot](https://blog.dubspot.com/fl-studio-2026-whats-new)

**Liquid Music (WaveDNA)** — Effectively discontinued: store offline since March 2026; existing licences keep working. [wavedna.com](https://wavedna.com/store-update/)

**Odesi** — Community reports (not an official statement) describe the standalone app as de-prioritised in favour of in-DAW Captain Plugins — a signal that standalone sketchpad apps lose to plugin-native tools. [KVR](https://www.kvraudio.com/forum/viewtopic.php?t=531246) **(unverified as official)**

## 3. Patterns (table stakes)

- **One-finger / single-key chord triggering** across a split keyboard is near-universal (InstaChord, Cthulhu, Chordz, Chord Prism, Ripchord, Chordjam, Reason Scales & Chords).
- **Scale-locking as the baseline safety net** — every DAW-native tool and most plugins constrain notes to a key/scale before anything smarter happens.
- **Drag-and-drop MIDI export** is the universal "final mile", even for tools with their own sound engines.
- **Companion-module bundling** rather than one monolithic brain: chords/melody/bass sold as separate plugins or tabs (Captain Chords + Melody + Deep, Scaler's Motions, Orb's four plugins, ChordPotion's four rows).
- **"Mined from real hit songs" as marketing** is extremely common (Captain Chords 96k, Sundog 500+, Odesi 138, LANDR/Orb), but only Hookpad discloses the corpus and ranking method.
- **Audio-to-chord-track detection is now standard among chord-track DAWs** (Logic 12, Cubase 12+, Studio One), still rare among third-party plugins (Scaler is the exception), absent from Ableton, Bitwig, FL Studio, Reason.
- **Complexity / randomise / humanise knobs** are the default lever everywhere for nudging output away from generic.

## 4. Gaps and recurring complaints

- **True statistical "what comes next", grounded in a disclosed real-song corpus, exists in only one product (Hookpad)** — with zero DAW/plugin presence. Nobody combines corpus-scale prediction with in-DAW hosting.
- **Voice leading as the actual core mechanic is essentially one product (Fluid Chords 2).** Forums flag the gap directly: "voicing choices seem to have no solid underlying conceptual framework and don't seem to be connected to voice leading principles" (VI-Control); FL Studio's forum: "the voice leading on that dominant collapse is really bad." [VI-Control](https://vi-control.net/community/threads/most-intelligent-chord-plugins-for-actual-musicians.111167/) · [Image-Line forum](https://forum.image-line.com/viewtopic.php?t=323890)
- **Cross-instance state sync** (chords/key/complexity shared across chord + bass + melody + arp instances) is rare and sold as premium (Scaler Live Sync, Chord Prism Instance Sync).
- **Genuine natural-language control is thin**: only MIDI Agent wraps a conversational model; most other "AI" claims are opaque proprietary models with no prompt control.
- **The single most repeated complaint across price tiers:** generated chords/voicings feel "robotic" / "copy-paste" and need manual reworking — acknowledged even in vendor copy for newer tools (Chord Genie, Fluid Chords 2) that market re-voicing / humanise / bending as the fix.
- **Standalone companion apps outside the DAW** (Odesi, Sundog, RapidComposer, the dead Liquid Music) add MIDI-loopback/export friction; the market signal favours in-DAW plugins.
- **No DAW-native chord track ranks "best next chord" by any learned or statistical method** — Cubase's Proximity / Circle of Fifths are geometric rules; nothing native matches even Reason Chord Sequencer's human-curated, colour-scored fit rating.

## 5. Sources

scalermusic.com/products/scaler-3 · forum.scalermusic.com (v3 feature-loss thread) · gearspace.com (Scaler 3 announcement) · waproduction.com/plugins/view/instachord-2 · audiocipher.com/post/scaler-2-vs-captain-chords · mixedinkey.com/captain-plugins/captain-chords · kvraudio.com (Captain Chords thread) · audiomodern.com/shop/plugins/chordjam · musicradar.com (Chordjam 1.5 review) · xferrecords.com/products/cthulhu · github.com/trackbout/ripchord · trackbout.com/ripchord · pluginboutique.com (Chord Prism 2) · mathieurouthier.com/suggester2 · feelyoursound.com/chordpotion · codefn42.com/chordz · marionietoworld.com/harmony-bloom · hexachords.com/orb-composer-1-5 · landr.com/plugins/landr-composer · odesi.mixedinkey.com · kvraudio.com (Odesi thread) · hooktheory.com/support/hookpad · hooktheory.com/theorytab/about · musicdevelopments.com · musicradar.com (RapidComposer review) · feelyoursound.com/sundog · wavedna.com/liquid-music · wavedna.com/store-update · unison.audio/chord-genie · unison.audio/product/unison-midi-chord-pack · musictech.com (Chord Composer review) · support.apple.com/guide/logicpro · musicradar.com (Logic Pro 12 AI features) · cdm.link/logic-pro-12-hands-on · steinberg.help / archive.steinberg.help (Chord Assistant) · soundonsound.com (Cubase 12 audio-to-chords) · rekkerd.org (Cubase 15) · ableton.com/en/live-manual/12/midi-tools · soundonsound.com (Live 12 MIDI generators) · ableton.com/en/blog/live-12-2-is-out-now · musictech.com (Studio One compose tutorial) · soundonsound.com (Studio One 7.2) · image-line.com (Riff Machine / Chord manual) · blog.dubspot.com (FL Studio 2026) · bitwig.com/userguide/latest/note_fx · musictech.com (Bitwig Studio 6) · reasonstudios.com/devices/scales-chords · reasonstudios.com/shop/rack-extension/chord-sequencer · fabriziopoce.com/progressive.html · audiocipher.com/text-to-midi-generator · midiagent.com · pitchinnovations.com/products/fluid-chords-2 · attackmagazine.com (Fluid Chords 2) · chordchord.com · autochords.com · vi-control.net (chord plugin thread) · forum.image-line.com (voice-leading complaint thread)

**Flagged (unverified):** Suggester 2 exact price tier; Odesi's official status; Chord Composer's current product/site status; MIDI Agent's pricing; Unison MIDI Wizard's price. **Correction to the brief:** Harmony Bloom is by Mario Nieto World, not Mozaic (Mozaic Beats makes Chord Prism).
