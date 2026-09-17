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

Sequence: open the window (step 1 is recorded automatically) → quick check:
close it for at least 20 s, open it → the real test: close it, save the
project, quit the DAW, start the DAW, open the project, wait 20 s, open the
window → read the box.

The quick check needs no Play: the UI writes a checkpoint (DSP clock + wall
clock) to stored state every 2 s, so on reopening it can compare how long the
window was closed with how far the DSP clock advanced. Clock advanced ≈ closed
time → the DSP ran; ≈ 0 → the host did not process the plugin (in Cubase:
Preferences → VST → Plug-ins → "Suspend VST 3 plug-in processing when no audio
signals are received"); clock went backwards → the DSP was restarted. A
watchdog also flags gaps in DSP reports while the window is open.

The number of UI connects is kept in `param1` itself (60 + n), because
parameters are the one thing proven to survive a reload; if stored state comes
back empty after that, the probe says "stored state LOST" explicitly.

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
