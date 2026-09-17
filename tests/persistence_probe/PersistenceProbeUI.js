// Persistence Probe UI — shows what the DSP received and when; log is copyable
// WINDOW SIZE: 560x600

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
const FIELDS = ['uptimeOut', 'paramValueOut', 'paramTimeOut', 'helloCountOut',
  'helloTimeOut', 'blobValueOut', 'blobTimeOut', 'blobCountOut'];

class PersistenceProbeUI extends HTMLElement {
  constructor () { super(); this._mounted = false; this._dsp = {}; this._handlers = {}; }

  connectedCallback () {
    if (this._mounted) return;
    this._mounted = true;
    const pc = this.patchConnection;
    this.innerHTML = this._html();
    this._log = this.querySelector('textarea');
    this._cells = {};
    FIELDS.forEach(f => { this._cells[f] = this.querySelector(`[data-field="${f}"]`); });

    this.querySelector('[data-send-param]').addEventListener('click', () => {
      const v = this._int(this.querySelector('[data-param="param1"]').value);
      pc.sendEventOrValue('param1', v);
      this._line(`param1 sent: ${v}`);
    });
    this.querySelector('[data-save-blob]').addEventListener('click', () => {
      const v = this._int(this.querySelector('[data-blob]').value);
      pc.sendStoredStateValue('testBlob', v);
      this._push(v, 'saved to stored state');
    });
    this.querySelector('[data-copy]').addEventListener('click', () => this._copy());

    FIELDS.forEach(f => {
      this._handlers[f] = v => this._onDsp(f, num(v));
      pc.addEndpointListener(f, this._handlers[f]);
    });
    this._onParam = ({ endpointID, value }) => {
      if (endpointID === 'param1') this.querySelector('[data-param="param1"]').value = Math.round(Number(value));
    };
    pc.addAllParameterListener(this._onParam);
    this._onState = msg => {
      if (msg?.key !== 'testBlob') return;
      const v = Number(msg.value);
      if (Number.isFinite(v)) { this.querySelector('[data-blob]').value = v; this._push(v, 'restored from stored state'); }
      else this._line('stored state: testBlob is empty');
    };
    pc.addStoredStateValueListener(this._onState);

    this._line(`UI connected (${new Date().toISOString()})`);
    pc.sendMIDIInputEvent('midiIn', cc(118, 1));
    this._line('hello sent to DSP (CC118 ch16)');
    pc.requestParameterValue('param1');
    pc.requestStoredStateValue('testBlob');
  }

  disconnectedCallback () {
    if (!this._mounted) return;
    const pc = this.patchConnection;
    FIELDS.forEach(f => pc.removeEndpointListener(f, this._handlers[f]));
    pc.removeAllParameterListener(this._onParam);
    pc.removeStoredStateValueListener(this._onState);
    this._mounted = false;
  }

  _push (v, why) {
    this.patchConnection.sendMIDIInputEvent('midiIn', cc(119, v));
    this._line(`blob ${why}: ${v} -> pushed to DSP (CC119 ch16)`);
  }
  _int (x) { return Math.max(0, Math.min(127, Math.round(Number(x) || 0))); }

  _onDsp (f, v) {
    const prev = this._dsp[f];
    this._dsp[f] = v;
    const isTime = f.endsWith('TimeOut');
    this._cells[f].textContent = f === 'uptimeOut' ? `${v.toFixed(1)} s` : isTime ? (v < 0 ? 'never' : `${v.toFixed(1)} s`) : String(v);
    if (f !== 'uptimeOut' && prev !== v) this._line(`DSP ${f} = ${isTime && v >= 0 ? v.toFixed(1) + ' s uptime' : v}`);
  }

  _line (t) {
    const ts = new Date().toTimeString().slice(0, 8);
    this._log.value += `[${ts}] ${t}\n`;
    this._log.scrollTop = this._log.scrollHeight;
  }
  _summary () { return 'RESULT ' + FIELDS.map(f => `${f}=${this._dsp[f] ?? '?'}`).join(' ') + '\n'; }
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
.pp p{margin:0;color:#aaa;font-size:12px;line-height:1.4}
.pp .row{display:flex;gap:8px;align-items:center}
.pp input{width:70px;height:28px;background:#222;color:#eee;border:1px solid #444;border-radius:4px;padding:0 6px;font:inherit}
.pp button{height:28px;padding:0 12px;background:#2a2f3a;color:#eee;border:1px solid #556;border-radius:4px;font:inherit;cursor:pointer}
.pp table{border-collapse:collapse;font-size:12px}
.pp td{padding:2px 10px 2px 0;color:#bbb}.pp td+td{color:#fff;font-variant-numeric:tabular-nums}
.pp textarea{flex:1;min-height:150px;width:100%;background:#0d0d0d;color:#cfe;border:1px solid #333;border-radius:4px;font:11px/1.4 Menlo,Consolas,monospace;padding:6px;resize:none}
</style><div class="pp">
<h1>Persistence Probe</h1>
<p>1. Set Param Note to 72, Blob to 99, click both buttons. 2. Close this window, save the project, quit the DAW. 3. Reopen the project, <b>do not open this window</b>, wait 30 s. 4. Open it, click Copy log, paste the result.</p>
<div class="row"><label>Param Note (param1)</label><input class="control" type="number" min="0" max="127" step="1" value="60" data-param="param1" data-endpoint-id="param1" data-min="0" data-max="127" data-init="60" data-step="1"><button data-send-param>Send param</button></div>
<div class="row"><label>Blob (stored state, 0-127)</label><input type="number" min="0" max="127" step="1" value="0" data-blob><button data-save-blob>Save blob</button></div>
<table>${FIELDS.map(f => `<tr><td>${f}</td><td data-field="${f}">-</td></tr>`).join('')}</table>
<textarea readonly spellcheck="false" aria-label="log"></textarea>
<div class="row"><button data-copy>Copy log</button></div>
</div>`; }
}
// END_AMORPH_UI
