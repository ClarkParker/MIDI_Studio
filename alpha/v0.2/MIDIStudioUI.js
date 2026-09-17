// MIDI Studio — WINDOW SIZE: 760x530
const scenes = [
 ['Piano','Broken chords & a moving melody'],['Lead synth','A hook with space & an answer'],
 ['Bass','Syncopated roots & approaches'],['Electric keys','Seventh chords & offbeat replies'],
 ['Pluck','Interlocking chord-tone figures'],['Drums','Four grooves with a closing fill'],
 ['Guitar','Fingerpicked chord patterns'],['Strings','Sustained voices & suspensions'],
 ['Flute','Breathing phrases & melodic turns'],['Brass','Voiced stabs & rhythmic answers']
];
const keys = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
class ParameterControl {
 constructor(el,view){this.knob=el;this.view=view;this.param=el.dataset.param;this.min=+el.dataset.min;this.max=+el.dataset.max;this.defaultValue=+el.dataset.init;this.value=this.defaultValue;
  el.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.dragging=true;this.pointer=e.pointerId;el.setPointerCapture(e.pointerId);this.move(e);e.preventDefault();});
  el.addEventListener('pointermove',e=>{if(this.dragging&&this.pointer===e.pointerId)this.move(e);});
  const up=e=>{this.dragging=false;if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('dblclick',()=>this.setValue(this.defaultValue,true));
  el.addEventListener('keydown',e=>{let v=this.value;if(e.key==='ArrowRight'||e.key==='ArrowUp')v+=1;else if(e.key==='ArrowLeft'||e.key==='ArrowDown')v-=1;else if(e.key==='Home')v=this.min;else if(e.key==='End')v=this.max;else return;e.preventDefault();this.setValue(v,true);});
  this.setValue(this.value,false);
 }
 move(e){const r=this.knob.getBoundingClientRect();this.setValue(this.min+(e.clientX-r.left)/r.width*(this.max-this.min),true);}
 setValue(v,notify){this.value=Math.max(this.min,Math.min(this.max,Math.round(v)));this.knob.style.setProperty('--norm',(this.value-this.min)/(this.max-this.min));this.knob.setAttribute('aria-valuenow',this.value);if(notify)this.view.send(this.param,this.value);}
}
class MIDIStudioView extends HTMLElement {
 constructor(pc) { super(); this.pc=pc; this.values={param1:0,param2:0,param3:1,param4:0,param5:1,param6:85,param7:96,param8:1,param9:1,param10:0}; this.innerHTML=this.html(); }
 connectedCallback() {
  if(this.listening) return; this.listening=true;
  this.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>this.send('param1',+b.dataset.scene)));
  this.querySelectorAll('[data-octave]').forEach(b=>b.addEventListener('click',()=>this.send('param4',+b.dataset.octave)));
  this.querySelector('.ms-variation').addEventListener('click',()=>this.send('param10',(this.values.param10+1)%4));
  this.querySelectorAll('select').forEach(el=>el.addEventListener('input',()=>this.send(el.dataset.param,+el.value)));
  this.querySelector('.ms-enable').addEventListener('click',()=>this.send('param9',this.values.param9?0:1));
  this.sliders=new Map();this.querySelectorAll('.ms-track').forEach(el=>this.sliders.set(el.dataset.param,new ParameterControl(el,this)));
  this.listener=({endpointID,value})=>{if(endpointID in this.values){this.values[endpointID]=Number(value);this.update();}};
  this.pc.addAllParameterListener(this.listener);
  Object.keys(this.values).forEach(id=>this.pc.requestParameterValue(id));
  const number=v=>Number(v?.value??v);
  this.transport=v=>{this.playing=number(v)>0.5;this.update();};
  this.tempo=v=>{this.querySelector('.ms-tempo').textContent=`${Math.round(number(v))} BPM`;};
  this.pulse=v=>{this.querySelectorAll('.ms-step').forEach((e,i)=>e.classList.toggle('current',i===Math.round(number(v))));};
  this.pc.addEndpointListener('transportStateOut',this.transport);
  this.pc.addEndpointListener('tempoOut',this.tempo);
  this.pc.addEndpointListener('pulseOut',this.pulse);
  this.bar=v=>{this.querySelector('.ms-bar').textContent=`Bar ${number(v)+1} / 4`;};
  this.pc.addEndpointListener('barOut',this.bar);
  this.update();
 }
 disconnectedCallback(){
  this.pc.removeAllParameterListener(this.listener);
  this.pc.removeEndpointListener('transportStateOut',this.transport);
  this.pc.removeEndpointListener('tempoOut',this.tempo);
  this.pc.removeEndpointListener('barOut',this.bar);
  this.pc.removeEndpointListener('pulseOut',this.pulse);this.listening=false;
 }
 send(id,value){this.values[id]=value;this.pc.sendEventOrValue(id,value);this.update();}
 update(){
  const v=this.values;
  this.querySelectorAll('[data-scene]').forEach(b=>{const on=+b.dataset.scene===v.param1;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
  this.querySelectorAll('select').forEach(el=>{el.value=v[el.dataset.param];});
  this.sliders?.forEach((c,id)=>c.setValue(v[id],false));
  this.querySelector('.ms-length').textContent=v.param6+'%';
  this.querySelector('.ms-velocity').textContent=v.param7;
  const btn=this.querySelector('.ms-enable');btn.textContent=v.param9?'● Enabled':'○ Muted';btn.classList.toggle('on',!!v.param9);btn.setAttribute('aria-pressed',String(!!v.param9));
  this.querySelector('.ms-status').textContent=!v.param9?'Muted':this.playing?'Playing':'Press play in your DAW';
  this.querySelector('.ms-status').classList.toggle('active',!!this.playing&&!!v.param9);
  if(!this.playing||!v.param9)this.querySelectorAll('.ms-step').forEach(e=>e.classList.remove('current'));
  const drums=v.param1===5;
  this.querySelectorAll('[data-octave]').forEach(b=>{b.disabled=drums;const on=+b.dataset.octave===v.param4;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
  this.querySelector('.ms-idea').textContent=`Idea ${v.param10+1} / 4`;
  ['param2','param3'].forEach(id=>{const el=this.querySelector(`[data-param="${id}"]`);el.disabled=drums;});
  const progressions=v.param3?['i · VI · iv · v','i · iv · VI · v','VI · iv · i · v','i · ii° · iv · v']:['I · vi · IV · V','I · IV · vi · V','vi · IV · I · V','I · ii · IV · V'];
  this.querySelector('.ms-hint').textContent=drums?`GM drum kit · channel ${v.param8} · four-bar groove with a final fill.`:`${keys[v.param2]} ${v.param3?'minor':'major'} · ${progressions[v.param10]} · four-bar composition`;
  this.querySelector('.ms-scene-title').textContent=scenes[v.param1][0];
 }
 select(id,label,items,values){return `<label class="ms-field"><span>${label}</span><select data-param="${id}" aria-label="${label}">${items.map((x,i)=>`<option value="${values?values[i]:i}">${x}</option>`).join('')}</select></label>`;}
 html(){return `<style>
 amorph-midi-studio-view{display:block;width:100%;height:100%;min-width:340px;background:#171a1d;color:#f1f0eb;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:auto}
 amorph-midi-studio-view *{box-sizing:border-box} .ms-shell{max-width:1000px;margin:auto;padding:26px 28px 20px}
 .ms-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:25px}.ms-brand{font-size:25px;letter-spacing:-1px;font-weight:650}.ms-brand small{display:block;font-size:11px;letter-spacing:.8px;color:#8b959c;font-weight:450;margin-top:5px;text-transform:uppercase}
 .ms-enable{border:1px solid #475153;border-radius:20px;padding:9px 15px;background:transparent;color:#98a3a7;font:inherit;cursor:pointer}.ms-enable.on{color:#c8e7b0;border-color:#647354;background:#263021}
 .ms-patterns{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px}.ms-card{border:1px solid #353b3f;background:#202529;border-radius:9px;text-align:left;padding:13px 12px;min-height:79px;color:#eef0eb;cursor:pointer;font:inherit}.ms-card strong{display:block;font-size:12px;font-weight:560;margin-bottom:7px}.ms-card small{display:block;color:#8f9aa0;font-size:10px;line-height:1.4}.ms-card.selected{border-color:#b8d5a0;background:#303b2b}.ms-card.selected small{color:#b2c1a6}.ms-card:hover{background:#30363b}.ms-card.selected:hover{background:#35442e}
 .ms-row{display:grid;grid-template-columns:1fr 1fr 1.7fr 1fr 1fr;gap:13px}.ms-field{display:block;min-width:0}.ms-field>span,.ms-slider label{display:block;color:#919ca4;font-size:11px;margin-bottom:9px}.ms-field select{width:100%;height:35px;border:1px solid #3b4248;border-radius:6px;padding:0 8px;background:#20262a;color:#e3e7e8;font:inherit}.ms-field select:disabled{opacity:.35}
 .ms-idea-row{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-bottom:20px}.ms-idea{font-size:11px;color:#9faa9a;font-variant-numeric:tabular-nums}.ms-variation{height:32px;padding:0 13px;border:1px solid #56624d;border-radius:6px;background:#263021;color:#c8e7b0;font:inherit;cursor:pointer}.ms-variation:hover{background:#35442e}.ms-octave-buttons{display:flex;gap:4px}.ms-octave-buttons button{flex:1;min-width:0;height:35px;padding:0 3px;border:1px solid #3b4248;border-radius:5px;background:#20262a;color:#bfc8cd;font:inherit;cursor:pointer}.ms-octave-buttons button.selected{background:#303b2b;border-color:#b8d5a0;color:#e0f0d3}.ms-octave-buttons button:disabled{opacity:.35;cursor:default}
 .ms-sliders{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin:22px 0}.ms-slider label{display:flex;justify-content:space-between}.ms-slider output{color:#eef0eb;font-variant-numeric:tabular-nums}.ms-track{height:20px;position:relative;cursor:ew-resize;touch-action:none;outline-offset:3px}.ms-track:before{content:"";position:absolute;top:8px;left:0;right:0;height:4px;border-radius:4px;background:linear-gradient(to right,#b8d5a0 calc(var(--norm)*100%),#3b444b 0)}.ms-track:after{content:"";position:absolute;top:4px;left:calc(var(--norm)*(100% - 12px));width:12px;height:12px;background:#c7e5ab;border-radius:50%}
 .ms-monitor{border-top:1px solid #353b3f;padding-top:18px}.ms-monitor-head{display:flex;justify-content:space-between;gap:14px;align-items:center}.ms-scene-title{font-size:13px;font-weight:550}.ms-clock{font-size:10px;color:#8f9aa0}.ms-tempo{font-variant-numeric:tabular-nums;margin-left:12px}.ms-status.active{color:#b8d5a0}.ms-steps{display:grid;grid-template-columns:repeat(16,1fr);gap:5px;margin:14px 0}.ms-step{height:5px;border-radius:2px;background:#333b40}.ms-step:nth-child(4n+1){background:#505b63}.ms-step.current{background:#c7e5ab}.ms-hint{min-height:28px;margin:0;color:#a3adb3;font-size:11px;line-height:1.5}.ms-footer{font-size:10px;color:#6e7a83;margin-top:10px}
 amorph-midi-studio-view button:focus-visible,amorph-midi-studio-view select:focus-visible,amorph-midi-studio-view .ms-track:focus-visible{outline:2px solid #c7e5ab;outline-offset:3px}
 @media(max-width:680px){.ms-shell{padding:20px}.ms-patterns{grid-template-columns:repeat(2,1fr)}.ms-row{grid-template-columns:repeat(2,1fr)}.ms-octave{grid-column:1 / -1;grid-row:2}.ms-monitor-head{align-items:flex-start;flex-direction:column}.ms-brand{font-size:22px}}
 </style><section class="ms-shell">
 <header class="ms-header"><div class="ms-brand">MIDI Studio<small>Composition starters · v0.2</small></div><button class="ms-enable on" data-param="param9" aria-pressed="true">● Enabled</button></header>
 <div class="ms-patterns" data-param="param1" role="group" aria-label="Instrument part">${scenes.map((s,i)=>`<button class="ms-card" data-scene="${i}" aria-pressed="false"><strong>${s[0]}</strong><small>${s[1]}</small></button>`).join('')}</div>
 <div class="ms-idea-row"><span class="ms-idea">Idea 1 / 4</span><button class="ms-variation" data-param="param10" title="Next idea for this pattern">↻ Variation</button></div>
 <div class="ms-row">${this.select('param2','Key',keys)}${this.select('param3','Scale',['Major','Minor'])}<div class="ms-field ms-octave"><span>Octave</span><div class="ms-octave-buttons" data-param="param4" role="group" aria-label="Octave">${[-2,-1,0,1,2].map(n=>`<button data-octave="${n}" aria-label="Octave ${n>0?'+':''}${n}" aria-pressed="false">${n>0?'+':''}${n}</button>`).join('')}</div></div>${this.select('param5','Speed',['Half','Normal','Double'])}${this.select('param8','Channel',Array.from({length:16},(_,i)=>String(i+1)),Array.from({length:16},(_,i)=>i+1))}</div>
 <div class="ms-sliders"><div class="ms-slider"><label for="ms-length">Length<output class="ms-length">85%</output></label><div id="ms-length" class="ms-track" role="slider" tabindex="0" aria-label="Length" aria-valuemin="10" aria-valuemax="100" data-param="param6" data-min="10" data-max="100" data-init="85"></div></div><div class="ms-slider"><label for="ms-velocity">Velocity<output class="ms-velocity">96</output></label><div id="ms-velocity" class="ms-track" role="slider" tabindex="0" aria-label="Velocity" aria-valuemin="1" aria-valuemax="127" data-param="param7" data-min="1" data-max="127" data-init="96"></div></div></div>
 <div class="ms-monitor"><div class="ms-monitor-head"><span class="ms-scene-title">Piano</span><span class="ms-clock"><span class="ms-bar">Bar 1 / 4</span> · <span class="ms-status">Press play in your DAW</span><span class="ms-tempo">Host tempo</span></span></div><div class="ms-steps">${'<i class="ms-step"></i>'.repeat(16)}</div><p class="ms-hint"></p></div>
 <footer class="ms-footer">MIDI only: route to your instrument, then press DAW play · 4/4 phrases · Mute stops notes</footer>
 </section>`;}
}
export default function createPatchView(pc){
 const tag='amorph-midi-studio-view';
 if(!customElements.get(tag)) customElements.define(tag,MIDIStudioView);
 return new (customElements.get(tag))(pc);
}