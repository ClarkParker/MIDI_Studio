// Persistence Probe UI v5 — self-guiding test; follow the NEXT box, then Copy log
// WINDOW SIZE: 600x700

export default function createPatchView (patchConnection) {
  const TAG = 'persistence-probe-ui';
  if (!customElements.get(TAG)) customElements.define(TAG, PersistenceProbeUI);
  const view = new (customElements.get(TAG))();
  view.patchConnection = patchConnection;
  return view;
}

const VERSION = 'probe UI v5';
const CH16 = 0xBF;                                   // control change on MIDI channel 16
const cc = (n, v) => (CH16 << 16) | (n << 8) | (v & 127);
const num = v => Number(v?.value ?? v);
const FIELDS = ['uptimeOut', 'paramValueOut', 'paramTimeOut', 'helloCountOut', 'helloTimeOut',
  'blobValueOut', 'blobTimeOut', 'blobCountOut', 'playCountOut', 'playTimeOut'];
const PARAM_BASE = 60;                               // param1 init; 60 + n = number of UI connects so far (survives reload)
const hhmmss = d => d ? new Date(d).toTimeString().slice(0, 8) : '?';
const CLOSE20 = 'Close this window and leave it closed for at least 20 seconds (do nothing else). Then open it again.';
const RELOAD = 'Close this window. Save the project. QUIT Cubase completely. Start Cubase, open the project, wait 20 seconds, then open this window.';
const SUSPEND_HINT = 'In Cubase: Preferences → VST → Plug-ins → turn OFF "Suspend VST 3 plug-in processing when no audio signals are received", then repeat.';

class PersistenceProbeUI extends HTMLElement {
  constructor () {
    super();
    this._mounted = false; this._dsp = {}; this._handlers = {};
    this._store = null; this._storeKnown = false; this._paramKnown = false; this._setupDone = false;
    this._lastReportWall = 0; this._gapNoted = false; this._gaps = [];
  }

  connectedCallback () {
    if (this._mounted) return;
    this._mounted = true;
    const pc = this.patchConnection;
    this.innerHTML = this._html();
    this._log = this.querySelector('textarea');
    this._cells = {};
    FIELDS.forEach(f => { this._cells[f] = this.querySelector(`[data-field="${f}"]`); });
    this.querySelector('[data-copy]').addEventListener('click', () => this._copy());
    this.querySelector('[data-reset]').addEventListener('click', () => {
      pc.sendStoredStateValue('probe', null); pc.sendEventOrValue('param1', PARAM_BASE);
      this._line('TEST RESET: history cleared, param1 back to 60. Close and reopen this window to start again.');
    });

    FIELDS.forEach(f => { this._handlers[f] = v => this._onDsp(f, num(v)); pc.addEndpointListener(f, this._handlers[f]); });
    this._onParam = ({ endpointID, value }) => {
      if (endpointID !== 'param1' || this._paramKnown) return;
      this._paramKnown = true; this._paramAtConnect = Math.round(Number(value));
      this._line(`param1 at connect = ${this._paramAtConnect} (= ${PARAM_BASE} + ${this._paramAtConnect - PARAM_BASE} earlier connects)`);
      this._afterInputs();
    };
    pc.addAllParameterListener(this._onParam);
    this._onState = msg => {
      if (msg?.key !== 'probe' || this._storeKnown) return;          // first reply only; ignore echoes of our own writes
      const raw = msg.value;
      this._store = (raw && typeof raw === 'object' && Array.isArray(raw.runs)) ? raw : null;
      this._line(this._store ? `stored state found: ${this._store.runs.length} earlier run(s), blob ${this._store.blob}, checkpoint ${this._store.cp ? hhmmss(this._store.cp.wall) + ' @ uptime ' + this._store.cp.uptime.toFixed(1) + ' s' : 'none'}`
                             : `stored state EMPTY (raw=${JSON.stringify(raw)})`);
      this._storeKnown = true;
      this._afterInputs();
    };
    pc.addStoredStateValueListener(this._onState);
    this._onVis = () => this._line(`window ${document.visibilityState}`);
    document.addEventListener('visibilitychange', this._onVis);

    this._uiStart = new Date();
    this._line(`${VERSION} — UI connected (${this._uiStart.toISOString()})`);
    pc.sendMIDIInputEvent('midiIn', cc(118, 1));
    this._line('hello sent to DSP (CC118 ch16)');
    pc.requestParameterValue('param1');
    pc.requestStoredStateValue('probe');
    this._timer = setTimeout(() => {
      if (!this._storeKnown) { this._storeKnown = true; this._line('stored state: no reply within 1.5 s, treating as EMPTY'); }
      if (!this._paramKnown) { this._paramKnown = true; this._paramAtConnect = PARAM_BASE; this._line('param1: no reply within 1.5 s, assuming 60'); }
      this._afterInputs();
    }, 1500);
    // Watchdog: the DSP reports once per DSP-second. Silence while the window is open
    // means the host is not processing the plugin.
    this._watch = setInterval(() => {
      if (!this._lastReportWall) return;
      const gap = (Date.now() - this._lastReportWall) / 1000;
      if (gap > 3 && !this._gapNoted) { this._gapNoted = true; this._gapStart = this._lastReportWall; this._line(`no DSP report for ${gap.toFixed(0)} s while the window is open: host is NOT processing the plugin (suspended?)`); this._render(); }
    }, 1000);
  }

  disconnectedCallback () {
    if (!this._mounted) return;
    const pc = this.patchConnection;
    clearTimeout(this._timer); clearInterval(this._watch);
    FIELDS.forEach(f => pc.removeEndpointListener(f, this._handlers[f]));
    pc.removeAllParameterListener(this._onParam);
    pc.removeStoredStateValueListener(this._onState);
    document.removeEventListener('visibilitychange', this._onVis);
    this._mounted = false;
  }

  // Runs once param1, stored state (or their timeouts) and the first uptime report are in.
  _afterInputs () {
    if (this._setupDone || !this._storeKnown || !this._paramKnown || !this._dspStart) return;
    this._setupDone = true;
    const pc = this.patchConnection;
    this._earlierConnects = Math.max(0, this._paramAtConnect - PARAM_BASE);
    this._storeLost = this._earlierConnects >= 1 && !this._store;
    this._prevCp = this._store?.cp ?? null;
    if (!this._store) this._store = { blob: 1 + Math.floor(Math.random() * 126), runs: [] };
    pc.sendEventOrValue('param1', Math.min(127, PARAM_BASE + this._earlierConnects + 1));
    pc.sendMIDIInputEvent('midiIn', cc(119, this._store.blob));
    this._line(`blob ${this._store.blob} pushed to DSP (CC119 ch16); param1 set to ${PARAM_BASE + this._earlierConnects + 1}`);
    this._thisRun = { dspStartedAt: this._dspStart.getTime(), uiConnectedAt: this._uiStart.getTime(), uptimeAtConnect: this._uptimeAtConnect };
    this._store.runs.push(this._thisRun);
    this._checkpoint();
    this._line(`run recorded (connect #${this._earlierConnects + 1} by parameter count, #${this._store.runs.length} by stored state)`);
    this._render();
  }

  // Every 2 s: remember where the DSP clock stands and what time it is, so the next
  // connect can compare "how long was the window closed" with "how far did the DSP run".
  _checkpoint () {
    if (!this._store) return;
    this._store.cp = { uptime: this._dsp.uptimeOut ?? this._uptimeAtConnect, wall: Date.now() };
    this.patchConnection.sendStoredStateValue('probe', this._store);
  }

  _onDsp (f, v) {
    const prev = this._dsp[f];
    this._dsp[f] = v;
    const isTime = f.endsWith('TimeOut');
    this._cells[f].textContent = f === 'uptimeOut' ? `${v.toFixed(1)} s` : isTime ? (v < 0 ? 'never' : `${v.toFixed(1)} s`) : String(v);
    if (f === 'uptimeOut') {
      const now = Date.now();
      if (this._gapNoted) { const g = (now - this._gapStart) / 1000; this._gaps.push(g); this._line(`DSP reports resumed after ${g.toFixed(0)} s`); this._gapNoted = false; }
      this._lastReportWall = now;
      if (!this._dspStart) {
        this._uptimeAtConnect = v;
        this._dspStart = new Date(now - v * 1000);
        this._line(`DSP clock at connect: ${v.toFixed(1)} s of processing so far`);
        this._afterInputs();
      } else if (this._setupDone && Math.round(v) % 2 === 0) this._checkpoint();
      return;
    }
    if (prev !== v) this._line(`DSP ${f} = ${isTime && v >= 0 ? v.toFixed(1) + ' s uptime' : v}`);
    this._render();
  }

  // ---- verdict ----------------------------------------------------------------
  _analyse () {
    const d = this._dsp, run = this._thisRun;
    if (!run) return { next: 'Waiting for the DSP, param1 and stored state (about two seconds)…', findings: [], code: 'WAIT' };
    const F = [];
    const yes = (t, why) => F.push(`✓ ${t} — ${why}`), no = (t, why) => F.push(`✗ ${t} — ${why}`), info = t => F.push(`• ${t}`);
    const n = this._earlierConnects, up = run.uptimeAtConnect;

    if (this._gaps.length) no('Host processes the plugin continuously while the window is open', `${this._gaps.length} gap(s) in DSP reports, longest ${Math.max(...this._gaps).toFixed(0)} s. ${SUSPEND_HINT}`);
    if (this._gapNoted) no('Host processes the plugin right now', `no DSP report for ${((Date.now() - this._gapStart) / 1000).toFixed(0)} s. ${SUSPEND_HINT}`);

    if (n === 0) return { next: `Step 1 done: baseline recorded (blob ${this._store.blob}). NEXT: ${CLOSE20}`, findings: F, code: 'STEP1' };

    yes('Parameters survived and reached the DSP at start, without any UI', `param1 was ${this._paramAtConnect} at connect, first set at uptime ${d.paramTimeOut} s`);

    if (this._storeLost) {
      no('Stored state survived', `EMPTY although ${n} earlier connect(s) had saved it. This can only happen across a project reload (or after Reset).`);
      info(`DSP clock at this connect: ${up.toFixed(1)} s`);
      return { next: 'TEST COMPLETE after a project reload. CONCLUSION: parameters survive, stored state does NOT — what the DSP plays MUST be parameters. Click "Copy log" and paste the result.', findings: F, code: 'PARAMS_ONLY_STORE_LOST' };
    }
    yes('Stored state survived', `${this._store.runs.length - 1} earlier run(s) came back`);

    const cp = this._prevCp;
    if (!cp) return { next: `No checkpoint from the previous run found. NEXT: ${CLOSE20}`, findings: F, code: 'NO_CP' };
    const dWall = (run.uiConnectedAt - cp.wall) / 1000, dUp = up - cp.uptime;
    info(`window was closed for about ${dWall.toFixed(0)} s; in that time the DSP clock advanced ${dUp.toFixed(1)} s`);
    if (dWall < 8) return { next: `The window was closed for only ${dWall.toFixed(0)} s — too short to judge. NEXT: ${CLOSE20}`, findings: F, code: 'TOO_SHORT' };

    let code;
    if (dUp < -1) { no('DSP kept running while the window was closed', `the DSP clock went BACKWARDS (${cp.uptime.toFixed(1)} → ${up.toFixed(1)} s): the DSP was restarted when the window opened`); code = 'DSP_RESTARTED'; }
    else if (dUp >= dWall - 4) { yes('DSP kept running while the window was closed', `clock advanced ${dUp.toFixed(1)} s over ${dWall.toFixed(0)} s`); code = 'DSP_RAN'; }
    else if (dUp < 3) { no('DSP kept running while the window was closed', `clock advanced only ${dUp.toFixed(1)} s over ${dWall.toFixed(0)} s: the host did not process the plugin while the window was closed. ${SUSPEND_HINT}`); code = 'DSP_SUSPENDED'; }
    else { no('DSP ran the whole time the window was closed', `clock advanced ${dUp.toFixed(1)} s over ${dWall.toFixed(0)} s (partly suspended?)`); code = 'DSP_PARTIAL'; }

    if (d.playCountOut >= 1) info(`host Play seen: ${d.playCountOut}×, first at uptime ${d.playTimeOut.toFixed(1)} s`);
    const headless = d.helloCountOut >= 2 || d.helloTimeOut < up - 2;
    if (headless) yes('UI JavaScript ran while the window was closed / at load', `first hello at ${d.helloTimeOut.toFixed(1)} s, hellos = ${d.helloCountOut}`);
    else no('UI JavaScript ran while the window was closed', `the only hello is this window's (${d.helloTimeOut.toFixed(1)} s)`);

    return { next: `Quick check done (${code}). NEXT (the reload test): ${RELOAD}`, findings: F, code };
  }

  _render () {
    const a = this._analyse();
    this.querySelector('[data-next]').textContent = a.next;
    this.querySelector('[data-findings]').innerHTML = a.findings.map(f => `<li>${f}</li>`).join('') || '<li>—</li>';
    const rows = (this._store?.runs ?? []).map((r, i) => `<tr><td>${i + 1}</td><td>${hhmmss(r.uiConnectedAt)}</td><td>${r.uptimeAtConnect.toFixed(1)} s</td></tr>`).join('');
    this.querySelector('[data-runs]').innerHTML = rows || '<tr><td colspan="3">—</td></tr>';
    this._code = a.code;
  }

  // ---- log ----------------------------------------------------------------------
  _line (t) {
    const ts = new Date().toTimeString().slice(0, 8);
    this._log.value += `[${ts}] ${t}\n`;
    this._log.scrollTop = this._log.scrollHeight;
  }
  _summary () {
    const a = this._analyse();
    return `RESULT ${VERSION} code=${a.code} ` + FIELDS.map(f => `${f}=${this._dsp[f] ?? '?'}`).join(' ')
      + ` paramAtConnect=${this._paramAtConnect ?? '?'} uiConnectedAt=${hhmmss(this._uiStart)} storeRuns=${this._store?.runs?.length ?? '?'} storeLost=${!!this._storeLost} gaps=${this._gaps.length}\n`
      + a.findings.map(f => `  ${f}`).join('\n') + '\n';
  }
  _copy () {
    const text = this._summary() + this._log.value;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => this._line('copied to clipboard'), () => this._select());
    else this._select();
  }
  _select () { this._log.focus(); this._log.select(); this._line('clipboard blocked: text is selected, press Cmd/Ctrl+C'); }

  _html () { return `<style>
persistence-probe-ui{display:block;width:100%;height:100%;overflow:hidden;background:#141414;color:#eee;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;user-select:text}
persistence-probe-ui *{box-sizing:border-box}
:host{display:block;width:100%;height:100%;overflow:hidden}
.pp{padding:14px 16px;display:flex;flex-direction:column;gap:10px;height:100%}
.pp h1{font-size:15px;margin:0}.pp h1 small{color:#777;font-weight:400;margin-left:8px}
.pp .next{background:#1e2a1e;border:1px solid #4a7a4a;border-radius:6px;padding:10px 12px;font-size:13px;line-height:1.5}
.pp .next b{color:#c8f0b0}
.pp ul{margin:0;padding-left:18px;font-size:12px;line-height:1.5}
.pp table{border-collapse:collapse;font-size:12px}
.pp th{text-align:left;color:#888;font-weight:500;padding:0 10px 2px 0}
.pp td{padding:1px 10px 1px 0;color:#bbb}.pp td+td{color:#fff;font-variant-numeric:tabular-nums}
.pp .cols{display:flex;gap:24px}
.pp textarea{flex:1;min-height:110px;width:100%;background:#0d0d0d;color:#cfe;border:1px solid #333;border-radius:4px;font:11px/1.4 Menlo,Consolas,monospace;padding:6px;resize:none}
.pp .row{display:flex;gap:8px;flex-wrap:wrap}
.pp button{height:28px;padding:0 12px;background:#2a2f3a;color:#eee;border:1px solid #556;border-radius:4px;font:inherit;cursor:pointer}
</style><div class="pp">
<h1>Persistence Probe <small>${VERSION}</small></h1>
<div class="next"><b>NEXT:</b> <span data-next>Waiting for the DSP…</span></div>
<ul data-findings><li>—</li></ul>
<div class="cols">
<table><tr><th>run</th><th>window opened</th><th>DSP clock</th></tr><tbody data-runs><tr><td colspan="3">—</td></tr></tbody></table>
<table>${FIELDS.map(f => `<tr><td>${f}</td><td data-field="${f}">-</td></tr>`).join('')}</table>
</div>
<textarea readonly spellcheck="false" aria-label="log"></textarea>
<div class="row"><button data-copy>Copy log</button><button data-reset>Reset test</button></div>
</div>`; }
}
// END_AMORPH_UI
