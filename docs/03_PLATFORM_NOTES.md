# Platform notes — what Amorph lets a MIDI plugin do

Constraints that actually shape the v0.3 design, plus where v0.2 already deviates
from the current upstream rules.

Sources, in precedence order (per the DEV kit's `CLAUDE.md` rule 9 — **upstream
wins over kit captures**):

1. `Artists-in-DSP/amorph-for-agents` — `context-src/v1/dsp/midi.md`,
   `context-src/v1/shared/host-transport.md`, `context-src/v1/shared/core-ui-contract.md`,
   `CMAJOR_QUICKREF.md`
2. `Amorph_DEV_KIt` — `STATUS.md` verification log
3. Point-in-time captures in `ai/amorph_official/` and `reference/amorph/`

---

## 1. The three constraints that decide the architecture

### 1.1 `std::random::RNG` is the wrong tool for Seed

Amorph does provide a stateful RNG as a processor field (`rng.seed(int64)`,
`rng.getUnipolar()`, `getBipolar()`, `getFloat(max)`). **We must not use it for
the Drift engine.**

A stateful RNG advances every time it is read, so its output depends on *how many
notes were played before* — which means the result depends on where the user
pressed play, whether the host looped, and whether a seek happened. Bar 9 would
sound different depending on the route taken to reach it. That breaks the one
property the v0.2 engine gets right: absolute-PPQ phase locking, where the host
can seek anywhere and the correct material still plays.

So the v0.3 engine uses a **stateless positional hash** instead:

```
    value = hash(seed, absoluteBar, stepInBar, noteIndex, layer)
```

Pure function, no accumulator, integer-only. Same input → same output, forever,
from any entry point. This is what makes "render equals live take" true, and it
is the technical heart of the concept.

### 1.2 Transport slot 5 is `barStart`, not a terminator

v0.2 reads the six-slot `transportIn` packet and discards slot 5:

```cmajor
else if (transportSlot == 5)
{
    // Packet terminator; loops are fixed 4/4 phrases.
}
```

Per upstream `context-src/v1/shared/host-transport.md`, the packet is
**play, bpm, numerator, denominator, ppq, barStart** — slot 5 carries the PPQ
position of the current bar's start. (The kit's older capture calls it "opaque,
do not build logic on it"; upstream is newer and wins.)

This is free and it is exactly what v0.3 and v0.4 need: bar-accurate phrase
boundaries without deriving them from the time signature. **Absolute bar number**
— the input to the positional hash — comes from it directly, instead of being
inferred from `step / 16`, which is only correct in 4/4.

Practical caution: it should still be treated as advisory and cross-checked
against `numerator`/`denominator`, since the kit's capture disagrees about it.

### 1.3 The hash must be integer-only and cheap

It runs per note, per step, inside the audio loop. Constraints that apply:

- **Floating-point `%` does not compile** — `fmod()` / `remainder()` only.
  Integer `%` is fine, which is what the hash uses.
- **Every divisor must be provably non-zero.** Amorph's lint is syntax-based and
  will not infer safety from an enclosing branch. Write `% max(1, n)`, never
  `% n`.
- `select(mask, a, b)` is **vector-only** — scalar use is a compile error. Use
  the ternary `cond ? a : b`.
- No `double`; `float64` for phase accumulators only, `float` for everything else.

## 2. Rules the v0.3 DSP must not break

Collected from `context-src/v1/dsp/midi.md` and `host-transport.md`:

| Rule | Consequence for v0.3 |
|---|---|
| Pure MIDI: `midiIn` + `midiOut` events, **no `output stream`** | unchanged from v0.2 |
| Endpoints in one contiguous block at processor start | new params 11-16 go with the others |
| `param1..paramN` sequential; **descriptive IDs are invalid for Amorph** | new controls are `param11`..`param16` |
| Never renumber or reuse a parameter number | params 1-10 keep their meanings exactly |
| Every declared `paramN` needs an `event paramN (float v)` handler | six new handlers |
| `text:` enum needs explicit int `min`/`max`/`init` **and** `step: 1` | applies to any new selector |
| No trailing comma before `]]` | — |
| **Zero `let` in generated source**; typed locals only | see §3 — v0.2 violates this |
| No `auto`, `unsigned`, `uint32_t`, `size_t`, `constexpr`, `static` | hash must use `int` / `int64` |
| Arrays: fixed size, `.at(i)` access, no `.set()`/`.get()` | — |
| No struct field initialisers — declare, then init in code | if a `NoteState` struct is introduced |
| `currentPpq += float64(hostBpm) / 60.0 / processor.frequency` is the **only** legal advance | v0.2 already does this |
| Never cast `processor.frequency` to `float` in PPQ math | v0.2 already complies |
| Received PPQ **only replaces** `currentPpq` — no deadbands, no `max(local, host)` | v0.2 already complies |
| `main()` may drive a host-synced note clock (E.6 exception), but `midiIn` owns held-note bookkeeping | matters from v0.5 on |
| Transport stop may clear the generated schedule, never held input notes | matters from v0.5 on |
| Determinism audit: identical output at 31, 64, 257 and 511 frame buffers | **the positional hash makes this trivially true** |

## 3. Where v0.2 already deviates from current upstream

Not bugs — the patch works — but worth knowing before editing it, because a
regeneration through Amorph's own Copy-Prompt path would rewrite them.

| # | Deviation | Detail |
|---|---|---|
| 1 | **`let` used for the four data tables** | `let offsets = int[2561] (...)` etc. Upstream's generation policy is *"the required count is zero"* for the token `let`. It compiles and is correct — the tables are genuinely constant — but a regeneration would convert them. If we keep the tables, keep them as they are and note the exception deliberately. |
| 2 | **UI file exceeds the size budget** | `UICode` is 13355 characters; upstream's contract says *"New files must stay below 8000 visible characters."* v0.3 adds controls, so this gets worse before it gets better. |
| 3 | **Window size mismatch** | UI line 1 says `WINDOW SIZE: 760x530`; the patch's `PresentationConfig` says `presentationWidth="952" presentationHeight="585"`. These should agree. Also, the kit convention puts `// WINDOW SIZE: WxH` on **line 2** by itself, not appended to the title comment on line 1. |
| 4 | **No `// END_AMORPH_UI` token** | Upstream `core-ui-contract.md` requires the UI file to end with it. |
| 5 | **Factory position** | v0.2 puts `export default function createPatchView` at the end of the file (kit convention). Upstream wants it as the **first declaration**, before every class. Function declarations hoist, so both work — but the upstream linter expects factory-first. |
| 6 | **Slot 5 discarded** | See §1.2. Not wrong, just leaving a useful value on the floor. |
| 7 | **`paramCount="0"` in the manifest** | The patch declares 10 parameters. Harmless (the host derives the real list from the endpoints) but misleading when reading the file. |

None of these block v0.3. Items 2-5 are cheap to fix while the UI is being
reworked anyway, and doing so keeps the patch regenerable through Amorph's own
tooling.

## 4. Headroom

- **128 parameter slots** are available (`PRODUCT_GUIDE.md`); typical patches use
  6-16. v0.2 uses 10, v0.3 would use 16. There is no pressure here — the reason
  to keep the control count low is musical, not technical.
- `transportIn` consumes **no** parameter number.
- MIDI plugins may optionally also output audio (kit `docs/10_PLUGIN_TYPES.md`,
  field-tested), but the prompt contract says pure MIDI. **Stay pure MIDI.**

## 5. Handover mechanics

The Amorph MCP write→live order is mandatory and easy to get wrong:

```
read → edit_lines → fix compile errors
     → task_complete → apply_draft → get_error (expect: none)
```

Edits stay in the working copy until `apply_draft` commits them to live audio.
A change is only live once `apply_draft` returns OK **and** `get_error` returns
`none`. If `apply_draft` reports that live audio compiled but the saved patch was
not updated, call `apply_draft` again — never hand-write project files and never
use `reload_from_disk` as a workaround.

A `dsp.cmajor` starting with `Cmaj0001` is a locked binary patch and cannot be
edited.
