# v0.3 UI spec — Seed, Roll and the performance row

Handover document for the GUI session. Read [`02_CONCEPT.md`](02_CONCEPT.md) and
[`03_PLATFORM_NOTES.md`](03_PLATFORM_NOTES.md) first.

Working branch: `claude/quirky-allen-pq7tcw` in `ClarkParker/MIDI_Studio`.
Baseline: `alpha/v0.2/MIDIStudioUI.js`.

---

## 1. Scope

Add six controls and one button. Keep the existing layout, visual language and
interaction model — this is not a redesign.

The DSP side is a separate task ([`04_DSP_SPEC.md`](04_DSP_SPEC.md)). Both
sessions bind against the parameter table in §2 and nothing else. Neither session
needs the other to be finished: at Drift 0 the new controls simply do nothing, so
the UI can ship against the v0.2 DSP and stay correct.

## 2. Parameter contract

Parameters 1-10 keep their current bindings, ranges and behaviour. Six new ones:

| ID | Label | Range | Init | Step | Unit | Control |
|---|---|---|---|---|---|---|
| `param11` | Drift | 0..100 | 0 | 1 | % | horizontal slider |
| `param12` | Seed | 0..999 | 1 | 1 | — | numeric readout + Roll button |
| `param13` | Swing | 50..75 | 50 | 1 | % | horizontal slider |
| `param14` | Humanize | 0..100 | 0 | 1 | % | horizontal slider |
| `param15` | Density | -50..+50 | 0 | 1 | % | centre-detent slider |
| `param16` | Accent | 0..100 | 0 | 1 | % | horizontal slider |

Mark every control root with **both** `data-param="paramN"` and
`data-endpoint-id="paramN"` (the latter enables the Amorph IDE's right-click AI
context), plus `data-min`, `data-max`, `data-init`, `data-step`. The kit's
`check_sync.py` cross-checks `data-min`/`data-max` against the DSP annotations,
so they must agree with the table above.

## 3. The one interaction that matters

**Seed + Roll is the headline of this release.** Everything else is a slider.

```
   ┌──────────────────────────────────────────┐
   │  Seed  412                    [ ⚄ Roll ] │
   └──────────────────────────────────────────┘
```

- **Roll** sets `param12` to a new value in 0..999 and sends it. That is the
  whole mechanism — press until something is good, then stop.
- The seed value must be **visible and readable at a glance**. It is the address
  of the current piece of music; a user who likes what they hear needs to be able
  to write it down.
- The readout should be directly editable, or at least arrow-key adjustable, so a
  noted seed can be typed back in.
- Roll must be a plain `<button>` with a real label — keyboard reachable, with
  `aria-label`, like every other control in the existing file.

Do not animate the roll, do not add a dice graphic that obscures the number, and
do not auto-roll on load — the seed must be stable across reopening the plugin.

## 4. Layout

The existing window is a vertical stack: header, instrument cards, idea row,
selector row, two sliders, monitor, footer. Insert one **Performance** section
between the existing slider block and the monitor:

```
   Performance
   ┌──────────────┬──────────────┬──────────────┐
   │ Drift    0%  │ Swing   50%  │ Density   0% │
   ├──────────────┼──────────────┼──────────────┤
   │ Humanize 0%  │ Accent   0%  │ Seed  1 [⚄]  │
   └──────────────┴──────────────┴──────────────┘
```

- A three-column grid at full width, collapsing to two columns under the existing
  `@media(max-width:680px)` breakpoint.
- Reuse the existing `.ms-slider` / `.ms-track` markup and the `ParameterControl`
  class as they are. They already handle pointer capture, double-click-to-default,
  arrow keys, Home/End and `aria-valuenow`.
- **Density needs a centre detent**: it is bipolar, so it should render its fill
  from the centre outward and snap to 0 near the middle. This is the only new
  control behaviour in the release.
- Give the section a heading so it is visually separate from the musical
  selectors above it. Drift is the most important control on the panel — it
  should read as the first item, not be buried mid-grid.

## 5. Window size

Current state is inconsistent and should be fixed in this pass:

- UI line 1 says `WINDOW SIZE: 760x530`
- the patch's `PresentationConfig` says `presentationWidth="952" presentationHeight="585"`

Pick one and make both agree. The new section needs roughly 90-110px of extra
height; `952x680` is a reasonable target if the wider layout is the intended one.
Put the comment on **line 2, by itself**, per the kit convention:

```javascript
// MIDI Studio — performance controls
// WINDOW SIZE: 952x680
```

## 6. Contract rules to keep

The v0.2 file already gets most of this right. Do not regress it.

| Rule | Status in v0.2 |
|---|---|
| Single self-contained file — no `import`, `require`, CDN or remote assets | ✅ keep |
| `export default function createPatchView(pc)` | ✅ keep |
| Guarded `customElements.define` | ✅ keep |
| No `attachShadow()` — light DOM only | ✅ keep |
| Paired `connectedCallback` / `disconnectedCallback`, every listener removed | ✅ keep |
| `requestParameterValue` for every ID **after** listeners are registered | ✅ keep |
| `addAllParameterListener` callback takes **one object** `{ endpointID, value }` | ✅ keep |
| Element listeners + `setPointerCapture`, never `window` pointermove/pointerup | ✅ keep |
| No `ResizeObserver`, no `backdrop-filter`, no `vw`/`vh` units | ✅ keep |
| Controls paint immediately with their default; no hardcoded numbers in markup | ✅ keep |

Three things to **fix** while the file is open (see
[`03_PLATFORM_NOTES.md#3`](03_PLATFORM_NOTES.md)):

1. Move `export default function createPatchView` to be the **first declaration**
   in the file, before the classes. Function declarations hoist, so this is safe;
   the upstream linter expects factory-first.
2. End the file with `// END_AMORPH_UI`.
3. Put `// WINDOW SIZE: WxH` on line 2 by itself (see §5).

## 7. File size — read this before writing markup

Upstream's UI contract budgets **8000 visible characters** for a file. The
current one is already **13355** (CSS is 4263 of that, so ~9100 even excluding
styles). Six more controls written as bespoke markup would push it past 15000.

So: **generate the performance row from a data table, not by hand.**

```javascript
const PERF = [
  ['param11', 'Drift',    0,   100, 0,  '%'],
  ['param13', 'Swing',    50,   75, 50, '%'],
  ['param15', 'Density', -50,   50, 0,  '%'],
  ['param14', 'Humanize', 0,   100, 0,  '%'],
  ['param16', 'Accent',   0,   100, 0,  '%'],
];
```

One `.map()` over that emits all five sliders and keeps the addition to a few
hundred characters. The existing `select()` helper in the file is the same
pattern — follow it.

If total size is still a concern afterwards, the cheapest reductions are the
per-instrument description strings in `scenes` and the repeated colour literals
in the CSS. Do not strip accessibility attributes to save characters.

## 8. What not to build yet

- No pattern/step editor. The engine has no per-step addressing for it.
- No chord display beyond the existing `.ms-hint` line — the chord track is v0.4.
- No MIDI keyboard or input visualisation — `midiIn` does nothing until v0.5.
- No preset browser.
- No `window.__amorphProcessMidiOut` note visualisation. It is tempting and it is
  genuinely useful, but it is a separate feature with its own teardown
  requirements, and it is not needed to evaluate the concept.

## 9. Acceptance

- All six new controls move their parameter and reflect host-driven changes.
- Roll produces a new visible seed and sends it exactly once per press.
- Defaults (`Drift 0, Swing 50, Humanize 0, Density 0, Accent 0`) load correctly
  from the DSP, so an existing project opens unchanged.
- No console errors on load, reload, or plugin close/reopen.
- Keyboard-only operation of every new control, including Roll.
- `python3 tools/ui_lint.py` and `python3 tools/check_sync.py` from the DEV kit
  both pass against the new DSP.
