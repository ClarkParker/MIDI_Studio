# Persistence probe

Answers the architecture question in `docs/02_CONCEPT.md` §9/§11: **does the
patch's UI JavaScript run when the plugin loads with its window closed, and
does stored state reach the DSP before the DAW plays?** It also confirms that
parameters restore into the DSP without any UI, and whether the DSP keeps
running while the window is closed.

Two files, no manifest: paste `PersistenceProbeDSP.cmajor` into the DSP tab and
`PersistenceProbeUI.js` into the UI tab of a **MIDI** patch, compile.

## Self-guiding

You do not need to watch anything. Open the window and follow the green
**NEXT** box. The probe keeps its own run history in stored state, detects a
project reload by itself, and ends with a plain-language **CONCLUSION**. Then
click *Copy log* and paste the result.

The one rule that matters: **after reloading the project, press Play/Stop in
the DAW before opening the window.** The DSP counts play starts, so the probe
can prove it was already running when the window opened — no clock needed.

Full sequence: open the window (step 1 is recorded automatically) → close it,
save the project, quit the DAW → start the DAW, open the project → Play ~3 s,
Stop → open the window → read the box.

## How it works

- On its first run the UI sets `param1 = 72` and chooses a random blob value,
  saves it to stored state and pushes it to the DSP as MIDI CC 119 on channel 16.
  It also sends CC 118 ("hello") every time it connects. MIDI is used because
  it is guaranteed not to be a host-persisted parameter.
- The DSP records the uptime of the first hello, the first blob, the first
  non-init `param1` and the first host Play, and reports once per second.
- The UI derives the DSP's start time from the uptime, records each run in
  stored state, and evaluates: stored state survived? parameters restored at
  start? DSP running before the window (Play before hello)? hello before the
  window (headless UI)? blob before Play?
- Witness notes with the window closed: every 2 s channel 1 at the `param1`
  pitch, channel 2 at `36 + blob` once a blob arrived.

`Reset test` clears the history and starts over.
