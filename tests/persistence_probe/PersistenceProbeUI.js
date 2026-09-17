// Persistence Probe UI — self-guiding test; follow the NEXT box, then Copy log
// WINDOW SIZE: 600x700

export default function createPatchView (patchConnection) {
  const TAG = 'persistence-probe-ui';
  if (!customElements.get(TAG)) customElements.define(TAG, PersistenceProbeUI);
  const view = new (customElements.get(TAG))();
  view.patchConnection = patchConnection;
  return view;
}

const CH16 = 0xBF;                                   // control change on MIDI channel 16
const cc = (n, v) => (CH16 << 16) | (n << 8) | (v & 127);
const num = v => Number(v?.value ?? v);
const FIELDS = ['uptimeOut', 'paramValueOut', 'paramTimeOut', 'helloCountOut', 'helloTimeOut',
  'blobValueOut', 'blobTimeOut', 'blobCountOut', 'playCountOut', 'playTimeOut'];
const PARAM_BASE = 60;                               // param1 init; 60 + n = number of UI connects so far (survives reload)
const hhmmss = d => d ? new Date(d).toTimeString().slice(0, 8) : '?';
const QUICK = 'Close this window. Press PLAY in the DAW for ~3 seconds, then STOP. Open this window again and click the button "I pressed Play/Stop before opening".';
const RELOAD = 'Close this window. Save the project. QUIT the DAW completely. Start the DAW, open the project. Do NOT open this window yet: press PLAY for ~3 seconds, then STOP. Open this window and click the button "I pressed Play/Stop before opening".';

class PersistenceProbeUI extends HTMLElement {
  constructor () {
    super();
    this._mounted = false; this._dsp = {}; this._handlers = {};
    this._store = null; this._storeKnown = false; this._paramKnown = false; this._setupDone = false; this._attested = false;
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
    this.querySelector('[data-attest]').addEventListener('click', () => { this._attested = true; this._line('user confirms: Play/Stop was pressed before this window opened'); this._render(); });
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
      this._line(this._store ? `stored state found: ${this._store.runs.length} earlier run(s), blob ${this._store.blob}` : `stored state EMPTY (raw=${JSON.stringify(raw)})`);
      this._storeKnown = true;
      this._afterInputs();
    };
    pc.addStoredStateValueListener(this._onState);
    this._onVis = () => this._line(`window ${document.visibilityState}`);
    document.addEventListener('visibilitychange', this._onVis);

    this._uiStart = new Date();
    this._line(`UI connected (${this._uiStart.toISOString()})`);
    pc.sendMIDIInputEvent('midiIn', cc(118, 1));
    this._line('hello sent to DSP (CC118 ch16)');
    pc.requestParameterValue('param1');
    pc.requestStoredStateValue('probe');
    this._timer = setTimeout(() => {
      if (!this._storeKnown) { this._storeKnown = true; this._line('stored state: no reply within 1.5 s, treating as EMPTY'); }
      if (!this._paramKnown) { this._paramKnown = true; this._paramAtConnect = PARAM_BASE; this._line('param1: no reply within 1.5 s, assuming 60'); }
      this._afterInputs();
    }, 1500);
  }

  disconnectedCallback () {
    if (!this._mounted) return;
    const pc = this.patchConnection;
    clearTimeout(this._timer);
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
    if (!this._store) this._store = { blob: 1 + Math.floor(Math.random() * 126), runs: [] };
    pc.sendEventOrValue('param1', Math.min(127, PARAM_BASE + this._earlierConnects + 1));
    pc.sendMIDIInputEvent('midiIn', cc(119, this._store.blob));
    this._line(`blob ${this._store.blob} pushed to DSP (CC119 ch16); param1 set to ${PARAM_BASE + this._earlierConnects + 1}`);
    this._thisRun = { dspStartedAt: this._dspStart.getTime(), uiConnectedAt: this._uiStart.getTime(), uptimeAtConnect: this._uptimeAtConnect };
    this._store.runs.push(this._thisRun);
    pc.sendStoredStateValue('probe', this._store);
    this._line(`run recorded (connect #${this._earlierConnects + 1} by parameter count, #${this._store.runs.length} by stored state)`);
    this._render();
  }

  _onDsp (f, v) {
    const prev = this._dsp[f];
    this._dsp[f] = v;
    const isTime = f.endsWith('TimeOut');
    this._cells[f].textContent = f === 'uptimeOut' ? `${v.toFixed(1)} s` : isTime ? (v < 0 ? 'never' : `${v.toFixed(1)} s`) : String(v);
    if (f === 'uptimeOut' && !this._dspStart) {
      this._uptimeAtConnect = v;
      this._dspStart = new Date(Date.now() - v * 1000);
      this._line(`DSP started at ${hhmmss(this._dspStart)}; this window connected ${v.toFixed(1)} s later`);
      this._afterInputs();
    }
    if (f !== 'uptimeOut' && prev !== v) this._line(`DSP ${f} = ${isTime && v >= 0 ? v.toFixed(1) + ' s uptime' : v}`);
    if (f !== 'uptimeOut') this._render();
  }

  // ---- verdict ----------------------------------------------------------------
  _analyse () {
    const d = this._dsp, run = this._thisRun;
    if (!run) return { next: 'Waiting for the DSP, param1 and stored state (about two seconds)…', findings: [], code: 'WAIT' };
    const F = [];
    const yes = (t, why) => F.push(`✓ ${t} — ${why}`), no = (t, why) => F.push(`✗ ${t} — ${why}`);
    const n = this._earlierConnects, up = run.uptimeAtConnect;
    const earlier = this._store.runs.slice(0, -1), last = earlier[earlier.length - 1];
    const dspChanged = !!last && Math.abs(run.dspStartedAt - last.dspStartedAt) > 3000;

    if (n === 0) return { next: `Step 1 done: baseline recorded (blob ${this._store.blob}). NEXT (quick check, no DAW restart): ${QUICK}`, findings: F, code: 'STEP1' };

    // Facts about persistence, from the parameter counter.
    yes('Parameters survived and reached the DSP at start, without any UI', `param1 was ${this._paramAtConnect} at connect, first set at uptime ${d.paramTimeOut} s`);
    if (this._storeLost) no('Stored state survived', `EMPTY although ${n} earlier connect(s) had saved it`);
    else yes('Stored state survived', `${earlier.length} earlier run(s) came back`);

    // Facts about the DSP lifetime, from Play.
    if (d.playCountOut >= 1 && d.playTimeOut < up - 1) {
      yes('DSP kept running while the window was closed', `Play at ${d.playTimeOut.toFixed(1)} s, this window at ${up.toFixed(1)} s`);
    } else if (d.playCountOut >= 1) {
      return { next: `Play came AFTER this window opened (Play at ${d.playTimeOut.toFixed(1)} s, window at ${up.toFixed(1)} s). Inconclusive. NEXT: ${QUICK}`, findings: F, code: 'PLAY_AFTER' };
    } else if (!this._attested) {
      return { next: `This DSP instance saw no Play. If you DID press Play/Stop before opening this window, click the button below. If not: ${QUICK}`, findings: F, code: 'NO_PLAY' };
    } else {
      no('DSP kept running while the window was closed', `you pressed Play, yet this DSP instance saw none and is only ${up.toFixed(1)} s old: the DSP restarted when the window opened`);
    }

    const headless = d.helloCountOut >= 2 || d.helloTimeOut < up - 2;
    if (headless) yes('UI JavaScript ran at plugin load, headless', `first hello at ${d.helloTimeOut.toFixed(1)} s, this window at ${up.toFixed(1)} s, hellos = ${d.helloCountOut}`);
    else no('UI JavaScript ran headless at load', `the only hello is this window's (${d.helloTimeOut.toFixed(1)} s)`);

    const blobEarly = d.blobTimeOut >= 0 && d.blobTimeOut < up - 2;
    if (blobEarly) yes('Stored state reached the DSP before the window opened', `blob ${d.blobValueOut} at ${d.blobTimeOut.toFixed(1)} s`);
    else no('Stored state reached the DSP before the window opened', `blob at ${d.blobTimeOut} s, window at ${up.toFixed(1)} s`);

    const reloaded = this._storeLost || dspChanged;
    const conclusion = (!this._storeLost && headless && blobEarly)
      ? 'stored state CAN hold the playable state (UI acts as loader at start).'
      : 'what the DSP plays MUST be parameters.';
    if (!reloaded) return { next: `Quick check done (no project reload yet). So far: ${conclusion} NEXT (the real test): ${RELOAD}`, findings: F, code: 'QUICK_DONE' };
    return { next: `TEST COMPLETE after a project reload. CONCLUSION: ${conclusion} Click "Copy log" and paste the result.`, findings: F, code: (!this._storeLost && headless && blobEarly) ? 'HEADLESS_OK' : 'PARAMS_ONLY' };
  }

  _render () {
    const a = this._analyse();
    this.querySelector('[data-next]').textContent = a.next;
    this.querySelector('[data-findings]').innerHTML = a.findings.map(f => `<li>${f}</li>`).join('') || '<li>—</li>';
    const rows = (this._store?.runs ?? []).map((r, i) => `<tr><td>${i + 1}</td><td>${hhmmss(r.dspStartedAt)}</td><td>${hhmmss(r.uiConnectedAt)}</td><td>${r.uptimeAtConnect.toFixed(1)} s</td></tr>`).join('');
    this.querySelector('[data-runs]').innerHTML = rows || '<tr><td colspan="4">—</td></tr>';
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
    return `RESULT code=${a.code} ` + FIELDS.map(f => `${f}=${this._dsp[f] ?? '?'}`).join(' ')
      + ` paramAtConnect=${this._paramAtConnect ?? '?'} dspStartedAt=${hhmmss(this._dspStart)} uiConnectedAt=${hhmmss(this._uiStart)} storeRuns=${this._store?.runs?.length ?? '?'} storeLost=${!!this._storeLost} attested=${this._attested}\n`
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
.pp h1{font-size:15px;margin:0}
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
.pp button.attest{background:#3a2f1e;border-color:#8a6a3a}
</style><div class="pp">
<h1>Persistence Probe</h1>
<div class="next"><b>NEXT:</b> <span data-next>Waiting for the DSP…</span></div>
<ul data-findings><li>—</li></ul>
<div class="cols">
<table><tr><th>run</th><th>DSP started</th><th>window opened</th><th>Δ</th></tr><tbody data-runs><tr><td colspan="4">—</td></tr></tbody></table>
<table>${FIELDS.map(f => `<tr><td>${f}</td><td data-field="${f}">-</td></tr>`).join('')}</table>
</div>
<textarea readonly spellcheck="false" aria-label="log"></textarea>
<div class="row"><button class="attest" data-attest>I pressed Play/Stop before opening</button><button data-copy>Copy log</button><button data-reset>Reset test</button></div>
</div>`; }
}
// END_AMORPH_UI
