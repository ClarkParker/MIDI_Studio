// Persistence Probe UI — self-guiding test; follow the NEXT box, then Copy log
// WINDOW SIZE: 600x680

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
const PARAM_MARK = 72;                               // param1 value the probe sets on its first run
const hhmmss = d => d ? new Date(d).toTimeString().slice(0, 8) : '?';
const RELOAD_STEPS = '1) Close this window.  2) Save the project.  3) Quit the DAW completely.  '
  + '4) Start the DAW, open the project.  5) Do NOT open this window yet: press Play in the DAW for ~3 seconds, then Stop.  '
  + '6) Now open this window and read the box again.';

class PersistenceProbeUI extends HTMLElement {
  constructor () {
    super();
    this._mounted = false; this._dsp = {}; this._handlers = {};
    this._store = null; this._storeKnown = false; this._runRecorded = false;
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
      pc.sendStoredStateValue('probe', null);
      this._line('TEST RESET: history cleared. Close and reopen this window to start from step 1.');
    });

    FIELDS.forEach(f => { this._handlers[f] = v => this._onDsp(f, num(v)); pc.addEndpointListener(f, this._handlers[f]); });
    this._onParam = ({ endpointID, value }) => { if (endpointID === 'param1') this._paramSeen = Math.round(Number(value)); };
    pc.addAllParameterListener(this._onParam);
    this._onState = msg => {
      if (msg?.key !== 'probe') return;
      const raw = msg.value;
      this._store = (raw && typeof raw === 'object' && Array.isArray(raw.runs)) ? raw : null;
      this._line(this._store ? `stored state found: ${this._store.runs.length} earlier run(s), blob ${this._store.blob}`
                             : `stored state EMPTY (raw=${JSON.stringify(raw)})`);
      this._storeKnown = true;
      this._afterStore();
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
    this._storeTimer = setTimeout(() => {
      if (!this._storeKnown) { this._storeKnown = true; this._line('stored state: no reply within 1.5 s, treating as EMPTY'); this._afterStore(); }
    }, 1500);
  }

  disconnectedCallback () {
    if (!this._mounted) return;
    const pc = this.patchConnection;
    clearTimeout(this._storeTimer);
    FIELDS.forEach(f => pc.removeEndpointListener(f, this._handlers[f]));
    pc.removeAllParameterListener(this._onParam);
    pc.removeStoredStateValueListener(this._onState);
    document.removeEventListener('visibilitychange', this._onVis);
    this._mounted = false;
  }

  // Runs once the stored-state reply (or its timeout) is in: first run sets the marks.
  _afterStore () {
    const pc = this.patchConnection;
    if (!this._store) {
      this._store = { blob: 1 + Math.floor(Math.random() * 126), runs: [] };
      pc.sendEventOrValue('param1', PARAM_MARK);
      this._line(`first run: param1 set to ${PARAM_MARK}, blob chosen: ${this._store.blob}`);
    }
    pc.sendMIDIInputEvent('midiIn', cc(119, this._store.blob));
    this._line(`blob ${this._store.blob} pushed to DSP (CC119 ch16)`);
    this._maybeRecordRun();
  }

  _maybeRecordRun () {
    if (this._runRecorded || !this._storeKnown || !this._dspStart) return;
    this._runRecorded = true;
    this._thisRun = { dspStartedAt: this._dspStart.getTime(), uiConnectedAt: this._uiStart.getTime(), uptimeAtConnect: this._uptimeAtConnect };
    this._store.runs.push(this._thisRun);
    this.patchConnection.sendStoredStateValue('probe', this._store);
    this._line(`run #${this._store.runs.length} recorded to stored state`);
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
      this._maybeRecordRun();
    }
    if (f !== 'uptimeOut' && prev !== v) this._line(`DSP ${f} = ${isTime && v >= 0 ? v.toFixed(1) + ' s uptime' : v}`);
    if (f === 'playTimeOut' || f === 'helloCountOut' || f === 'blobTimeOut' || f === 'paramValueOut') this._render();
  }

  // ---- verdict ----------------------------------------------------------------
  _analyse () {
    const d = this._dsp, run = this._thisRun, store = this._store;
    if (!run || !store) return { next: 'Waiting for the DSP and stored state (about one second)…', findings: [], code: 'WAIT' };
    const earlier = store.runs.slice(0, -1);
    const last = earlier[earlier.length - 1];
    const isReload = !!last && Math.abs(run.dspStartedAt - last.dspStartedAt) > 3000;
    const up = run.uptimeAtConnect;
    const F = [];
    const yes = (t, why) => F.push(`✓ ${t} — ${why}`), no = (t, why) => F.push(`✗ ${t} — ${why}`), unk = t => F.push(`? ${t}`);

    if (earlier.length === 0) return { next: `Step 1 done: baseline recorded (param1 = ${PARAM_MARK}, blob = ${store.blob}). NEXT: ${RELOAD_STEPS}`, findings: F, code: 'STEP1' };

    if (!isReload) return { next: `The DSP has not restarted since the last run (same start time ${hhmmss(run.dspStartedAt)}). That was a window close/open, not a project reload. NEXT: ${RELOAD_STEPS}`, findings: F, code: 'SAME_DSP' };

    // A reload happened. Facts first.
    yes('Stored state survived the project reload', `${earlier.length} earlier run(s) came back`);
    if (d.paramValueOut === PARAM_MARK && d.paramTimeOut >= 0 && d.paramTimeOut < 1) yes('Parameters restored into the DSP at start, without any UI', `param1 = ${PARAM_MARK} at uptime ${d.paramTimeOut.toFixed(1)} s`);
    else no('Parameters restored into the DSP at start', `param1 = ${d.paramValueOut} first changed at ${d.paramTimeOut} s`);

    if (!(d.playCountOut >= 1)) return { next: `Reload detected, but the DSP saw no Play before you opened this window. Inconclusive. NEXT: ${RELOAD_STEPS}`, findings: F, code: 'NO_PLAY' };

    const playBeforeWindow = d.playTimeOut < up - 1;
    if (playBeforeWindow) yes('DSP kept running while the window was closed (no restart on open)', `Play at ${d.playTimeOut.toFixed(1)} s, this window at ${up.toFixed(1)} s`);
    else return { next: `Play came AFTER this window opened (Play at ${d.playTimeOut.toFixed(1)} s, window at ${up.toFixed(1)} s). Inconclusive. NEXT: ${RELOAD_STEPS} — Play/Stop FIRST, then open.`, findings: F, code: 'PLAY_AFTER' };

    const headless = d.helloCountOut >= 2 || d.helloTimeOut < up - 2;
    if (headless) yes('UI JavaScript ran at plugin load, headless', `first hello at ${d.helloTimeOut.toFixed(1)} s, this window at ${up.toFixed(1)} s, hellos = ${d.helloCountOut}`);
    else no('UI JavaScript ran headless at load', `only hello is this window's (${d.helloTimeOut.toFixed(1)} s), hellos = ${d.helloCountOut}`);

    const blobBeforePlay = d.blobTimeOut >= 0 && d.blobTimeOut < d.playTimeOut && d.blobValueOut === store.blob;
    if (blobBeforePlay) yes('Stored state reached the DSP before Play', `blob ${d.blobValueOut} at ${d.blobTimeOut.toFixed(1)} s, Play at ${d.playTimeOut.toFixed(1)} s`);
    else no('Stored state reached the DSP before Play', `blob ${d.blobValueOut} at ${d.blobTimeOut} s, Play at ${d.playTimeOut.toFixed(1)} s`);

    const conclusion = (headless && blobBeforePlay)
      ? 'CONCLUSION: stored state CAN hold the playable state; the UI acts as its loader at plugin start.'
      : 'CONCLUSION: what the DSP plays MUST be parameters; stored state only reaches the DSP once the window is open.';
    return { next: `TEST COMPLETE. ${conclusion}  Click "Copy log" and paste the result.`, findings: F, code: headless && blobBeforePlay ? 'HEADLESS_OK' : 'PARAMS_ONLY' };
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
      + ` dspStartedAt=${hhmmss(this._dspStart)} uiConnectedAt=${hhmmss(this._uiStart)} runs=${this._store?.runs?.length ?? '?'} blob=${this._store?.blob ?? '?'}\n`
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
.pp textarea{flex:1;min-height:120px;width:100%;background:#0d0d0d;color:#cfe;border:1px solid #333;border-radius:4px;font:11px/1.4 Menlo,Consolas,monospace;padding:6px;resize:none}
.pp .row{display:flex;gap:8px}
.pp button{height:28px;padding:0 12px;background:#2a2f3a;color:#eee;border:1px solid #556;border-radius:4px;font:inherit;cursor:pointer}
</style><div class="pp">
<h1>Persistence Probe</h1>
<div class="next"><b>NEXT:</b> <span data-next>Waiting for the DSP…</span></div>
<ul data-findings><li>—</li></ul>
<div class="cols">
<table><tr><th>run</th><th>DSP started</th><th>window opened</th><th>Δ</th></tr><tbody data-runs><tr><td colspan="4">—</td></tr></tbody></table>
<table>${FIELDS.map(f => `<tr><td>${f}</td><td data-field="${f}">-</td></tr>`).join('')}</table>
</div>
<textarea readonly spellcheck="false" aria-label="log"></textarea>
<div class="row"><button data-copy>Copy log</button><button data-reset>Reset test</button></div>
</div>`; }
}
// END_AMORPH_UI
