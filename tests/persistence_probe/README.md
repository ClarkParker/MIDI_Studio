# Persistence probe

Answers the architecture question in `docs/02_CONCEPT.md` §9/§11: **does the
patch's UI JavaScript run when the plugin loads with its window closed, and
does stored state reach the DSP at that moment?** Also confirms that parameters
restore into the DSP without any UI.

Two files, no manifest: paste `PersistenceProbeDSP.cmajor` into Amorph's DSP tab
and `PersistenceProbeUI.js` into the UI tab of a **MIDI** patch (or apply via
MCP), compile.

## How it works

- The UI, whenever it connects, injects MIDI CC 118 ("hello") on channel 16, then
  requests stored state `testBlob` and, if present, injects its value as CC 119.
  MIDI is used because it is guaranteed not to be a host-persisted parameter.
- The DSP records the uptime (seconds since it started) of the first hello, the
  first blob, and the first non-init `param1`, and reports everything once per
  second to the UI, which shows it and writes a copyable log.
- As an audible witness with the window closed, the DSP plays a note every 2 s:
  channel 1 at the `param1` pitch, channel 2 at `36 + blob` once a blob arrived.

## Protocol

1. Load the patch on a MIDI track. Open the window. Set **Param Note = 72**,
   click *Send param*. Set **Blob = 99**, click *Save blob*. The log shows both.
2. Close the window. Save the project. Quit the DAW completely.
3. Reopen the DAW and the project. **Do not open the plugin window.** Wait ~30 s.
   (Optional: monitor or listen — channel 1 note 72? channel 2 note 135→127?)
4. Open the window. Click *Copy log*. Paste the result.

## Reading the result

| Observation | Meaning |
|---|---|
| `paramTimeOut` small (< 5 s), `paramValueOut = 72` | parameters restore into the DSP without a UI — expected |
| `helloTimeOut` small (< 5 s) although you opened the window at ~30 s, or `helloCountOut ≥ 2` | **the UI JS ran at plugin load, headless** |
| `helloTimeOut ≈ 30 s`, `helloCountOut = 1` | the UI JS runs only when the window is open |
| `blobTimeOut ≈ helloTimeOut` and `blobValueOut = 99` | stored state survived and reached the DSP at that moment |
| `blobTimeOut = never` | stored state did not survive, or the listener never fired |

If the hello is early, stored state can be the source of truth for the block
progression (UI as loader). If it is late, what the DSP plays must be parameters.
