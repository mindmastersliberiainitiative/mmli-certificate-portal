/* =========================================================
   MMLI Visual Content Generator — app logic
   ========================================================= */
(function(){
  "use strict";

  const MOTTO = "Unleashing the Genius Within";
  const ORG   = "MIND MASTERS LIBERIA INITIATIVE";

  const TEMPLATES = [
    { id:'t1', cls:'tt1', thumb:'t1', name:'Modern Quiz',      desc:'Bold navy + gold diagonal', accent:'gold', align:'center' },
    { id:'t2', cls:'tt2', thumb:'t2', name:'Academic Honors',  desc:'Framed cream, formal serif', accent:'navy', align:'center' },
    { id:'t3', cls:'tt3', thumb:'t3', name:'Bold Competition', accent:'gold', desc:'High-contrast, dynamic cut', align:'center' },
    { id:'t4', cls:'tt4', thumb:'t4', name:'Elegant',          desc:'Minimal cream & gold rule', accent:'navy', align:'center' },
    { id:'t5', cls:'tt5', thumb:'t5', name:'Youth Energy',     desc:'Navy-to-green gradient', accent:'green', align:'center' },
    { id:'t6', cls:'tt6', thumb:'t6', name:'Premium Crest',    desc:'Deep navy, gold foil frame', accent:'gold', align:'center' },
  ];

  const ACCENTS = {
    gold:  { accent:'#F0B82C', deep:'#D89A0E' },
    navy:  { accent:'#0A5C9C', deep:'#00203E' },
    green: { accent:'#77B14C', deep:'#4C8A34' },
    cream: { accent:'#FAF7EC', deep:'#E7E0C9' },
  };

  const EVENT_TYPES = ['Quiz Competition','Workshop','Training Bootcamp','Award Ceremony','Community Outreach','Panel Discussion'];

  /* ---------------- state ---------------- */
  const state = {
    view: 'dashboard',
    flyerType: null,      // 'event' | 'individual'
    step: 1,
    template: 't1',
    accent: 'gold',
    scaleLevel: 0,        // -1,0,1 relative text scale
    align: 'center',
    sections: { prizes:true, meta:true, desc:true, footer:true },
    data: {
      // event
      eventName:'', eventType:EVENT_TYPES[0], theme:'', date:'', time:'', venue:'',
      description:'', registration:'Open', regDeadline:'', contact:'', website:'',
      prize1:'', prize2:'', prize3:'',
      // individual
      fullName:'', roleTitle:'', school:'', achievement:'', subject:'', bio:'', quote:'', photo:''
    },
    chat: []
  };

  const EVENT_STEPS = ['Event info','Prizes & branding','Choose a template'];
  const INDIVIDUAL_STEPS = ['Person info','Photo','Choose a template'];

  /* ---------------- helpers ---------------- */
  const $  = (sel,el) => (el||document).querySelector(sel);
  const $$ = (sel,el) => Array.from((el||document).querySelectorAll(sel));
  function esc(str){
    return String(str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function el(tag, attrs, html){
    const e = document.createElement(tag);
    if(attrs) for(const k in attrs) e.setAttribute(k, attrs[k]);
    if(html!=null) e.innerHTML = html;
    return e;
  }
  function showToast(msg, icon){
    const t = el('div',{class:'toast'}, (icon||'✓')+' '+esc(msg));
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(10px)'; t.style.transition='all .3s ease'; },1800);
    setTimeout(()=> t.remove(), 2150);
  }
  function confetti(){
    const colors = ['#F0B82C','#00457D','#77B14C','#D89A0E'];
    for(let i=0;i<26;i++){
      const p = el('div',{class:'confetti-piece'});
      const x = 50 + (Math.random()*50-25);
      p.style.left = x+'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random()*0.3)+'s';
      p.style.transform = `rotate(${Math.random()*360}deg)`;
      document.body.appendChild(p);
      setTimeout(()=>p.remove(), 2000);
    }
  }

  /* ---------------- view switching ---------------- */
  function setView(v){
    state.view = v;
    $$('.view').forEach(s => s.classList.remove('active'));
    $('#view-'+v).classList.add('active');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function goDashboard(){
    state.flyerType = null; state.step = 1;
    setView('dashboard');
  }

  function startWizard(type){
    state.flyerType = type;
    state.step = 1;
    $('#wizardTitle').textContent = type === 'event' ? 'Event flyer' : 'Individual flyer';
    setView('wizard');
    renderSteps();
    renderStepPanel();
  }

  /* ---------------- step pills ---------------- */
  function renderSteps(){
    const labels = state.flyerType === 'event' ? EVENT_STEPS : INDIVIDUAL_STEPS;
    const wrap = $('#stepPills'); wrap.innerHTML = '';
    labels.forEach((label, i) => {
      const n = i+1;
      const pill = el('div',{class:'step-pill'+(n===state.step?' active':'')+(n<state.step?' done':'')},
        `<span class="n">${n<state.step?'✓':n}</span>${esc(label)}`);
      wrap.appendChild(pill);
    });
  }

  /* ---------------- step panels ---------------- */
  function renderStepPanel(){
    const panel = $('#stepPanel'); panel.innerHTML = '';
    const box = el('div',{class:'panel'});
    if(state.flyerType === 'event'){
      if(state.step===1) box.appendChild(buildEventInfoStep());
      else if(state.step===2) box.appendChild(buildEventBrandingStep());
      else box.appendChild(buildTemplateStep());
    } else {
      if(state.step===1) box.appendChild(buildIndividualInfoStep());
      else if(state.step===2) box.appendChild(buildIndividualPhotoStep());
      else box.appendChild(buildTemplateStep());
    }
    panel.appendChild(box);
  }

  function fieldInput(labelText, key, opts){
    opts = opts || {};
    const wrap = el('div',{class:'field'+(opts.span2?' span2':'')});
    wrap.appendChild(el('label',{},esc(labelText)));
    let input;
    if(opts.textarea){
      input = el('textarea',{placeholder:opts.placeholder||'', maxlength:opts.maxlength||600});
      input.value = state.data[key]||'';
    } else if(opts.select){
      input = el('select',{});
      opts.options.forEach(o=>{
        const o_ = el('option',{value:o}, esc(o));
        if(state.data[key]===o) o_.setAttribute('selected','selected');
        input.appendChild(o_);
      });
    } else {
      input = el('input',{type:opts.type||'text', placeholder:opts.placeholder||''});
      input.value = state.data[key]||'';
    }
    input.addEventListener('input', ()=>{ state.data[key]=input.value; });
    wrap.appendChild(input);
    if(opts.hint) wrap.appendChild(el('div',{class:'hint'}, esc(opts.hint)));
    return wrap;
  }

  function buildEventInfoStep(){
    const f = el('div',{});
    const grid = el('div',{class:'field-grid'});
    grid.appendChild(fieldInput('Event name','eventName',{span2:true, placeholder:'MMLI Back-to-School Quiz Challenge'}));
    grid.appendChild(fieldInput('Event type','eventType',{select:true, options:EVENT_TYPES}));
    grid.appendChild(fieldInput('Theme / headline','theme',{placeholder:'Unleashing Young Minds'}));
    grid.appendChild(fieldInput('Date','date',{type:'date'}));
    grid.appendChild(fieldInput('Time','time',{type:'time'}));
    grid.appendChild(fieldInput('Venue','venue',{span2:true, placeholder:'MMLI Learning Center, Monrovia'}));
    grid.appendChild(fieldInput('Short description','description',{span2:true, textarea:true,
      placeholder:'Tell people what to expect, who can join, and why it matters.', hint:'Aim for 1–2 sentences — THOMAS will flag it if it runs long.'}));
    f.appendChild(grid);
    f.appendChild(wizardActions(false, ()=>{ if(validateStep1Event()){ state.step=2; renderSteps(); renderStepPanel(); } }));
    return f;
  }

  function validateStep1Event(){
    if(!state.data.eventName.trim()){ showToast('Add an event name to continue','⚠️'); return false; }
    return true;
  }

  function buildEventBrandingStep(){
    const f = el('div',{});
    const grid = el('div',{class:'field-grid'});
    grid.appendChild(fieldInput('Registration','registration',{select:true, options:['Open','Closed']}));
    grid.appendChild(fieldInput('Registration deadline','regDeadline',{type:'date'}));
    grid.appendChild(fieldInput('Contact','contact',{placeholder:'+231 ...'}));
    grid.appendChild(fieldInput('Website','website',{placeholder:'mmli.org'}));
    f.appendChild(grid);

    f.appendChild(el('h4',{style:'font:800 10.5px Inter;letter-spacing:1.2px;text-transform:uppercase;color:#69728A;margin:22px 0 10px'},'Prizes (optional)'));
    const prizeRows = el('div',{class:'prize-rows'});
    [['1st place','prize1'],['2nd place','prize2'],['3rd place','prize3']].forEach(([label,key])=>{
      const row = el('div',{class:'prize-row'});
      row.appendChild(el('label',{style:'font:700 12px Inter;color:#00457D;align-self:center'}, esc(label)));
      const inp = el('input',{type:'text',placeholder:'e.g. $500'});
      inp.value = state.data[key]||'';
      inp.addEventListener('input', ()=> state.data[key]=inp.value);
      row.appendChild(inp);
      prizeRows.appendChild(row);
    });
    f.appendChild(prizeRows);

    f.appendChild(el('div',{style:'margin-top:18px;padding:14px 16px;background:#F5F8FB;border:1px solid #E7E0C9;border-radius:10px;font:500 12.5px Inter;color:#69728A'},
      '🏷️ The MMLI logo, motto and colours are added to every flyer automatically — no need to re-enter them.'));

    f.appendChild(wizardActions(true, ()=>{ state.step=3; renderSteps(); renderStepPanel(); }, ()=>{ state.step=1; renderSteps(); renderStepPanel(); }));
    return f;
  }

  function buildIndividualInfoStep(){
    const f = el('div',{});
    const grid = el('div',{class:'field-grid'});
    grid.appendChild(fieldInput('Full name','fullName',{span2:true, placeholder:'Jestina Doe'}));
    grid.appendChild(fieldInput('Title / role','roleTitle',{placeholder:'Mathematics Olympiad Participant'}));
    grid.appendChild(fieldInput('School / organization','school',{placeholder:'MMLI Learning Center'}));
    grid.appendChild(fieldInput('Achievement','achievement',{placeholder:'Gold Medalist'}));
    grid.appendChild(fieldInput('Subject / area','subject',{placeholder:'Mathematics'}));
    grid.appendChild(fieldInput('Short bio','bio',{span2:true, textarea:true, placeholder:'A sentence or two about them.'}));
    grid.appendChild(fieldInput('Quote','quote',{span2:true, placeholder:'“Mathematics is everywhere.”'}));
    f.appendChild(grid);
    f.appendChild(wizardActions(false, ()=>{ if(!state.data.fullName.trim()){ showToast('Add a full name to continue','⚠️'); return;} state.step=2; renderSteps(); renderStepPanel(); }));
    return f;
  }

  function buildIndividualPhotoStep(){
    const f = el('div',{});
    const wrap = el('div',{class:'field upload span2'});
    wrap.appendChild(el('label',{},'Photo'));
    const uplLabel = el('label',{class:'upl'});
    const preview = el('img',{class:'upl-preview round', src: state.data.photo || makeInitialsDataURI(state.data.fullName)});
    uplLabel.appendChild(preview);
    uplLabel.appendChild(el('span',{}, state.data.photo ? 'Change photo' : 'Upload a photo (optional — MMLI branding still applies without one)'));
    const fileInput = el('input',{type:'file', accept:'image/*'});
    fileInput.addEventListener('change', (ev)=>{
      const file = ev.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = ()=>{ state.data.photo = reader.result; preview.src = reader.result; };
      reader.readAsDataURL(file);
    });
    uplLabel.appendChild(fileInput);
    wrap.appendChild(uplLabel);
    f.appendChild(wrap);
    f.appendChild(el('div',{style:'margin-top:18px;padding:14px 16px;background:#F5F8FB;border:1px solid #E7E0C9;border-radius:10px;font:500 12.5px Inter;color:#69728A'},
      '🏷️ MMLI logo and motto are added automatically to every individual spotlight.'));
    f.appendChild(wizardActions(true, ()=>{ state.step=3; renderSteps(); renderStepPanel(); }, ()=>{ state.step=1; renderSteps(); renderStepPanel(); }));
    return f;
  }

  function makeInitialsDataURI(name){
    const initials = (name||'MM').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'MM';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#00457D"/><text x="40" y="48" font-family="Inter,Arial" font-size="28" font-weight="700" fill="#F0B82C" text-anchor="middle">${initials}</text></svg>`;
    try{
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }catch(e){
      return 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#00457D"/></svg>');
    }
  }

  function buildTemplateStep(){
    const f = el('div',{});
    f.appendChild(el('p',{style:'font:500 13.5px Inter;color:#69728A;margin:0 0 18px'},'Pick a starting look — you can change fonts, colours and layout later in the editor.'));
    const grid = el('div',{class:'tpl-grid'});
    TEMPLATES.forEach(t=>{
      const card = el('button',{class:'tpl-card'+(state.template===t.id?' selected':'')});
      const thumb = el('div',{class:'tpl-thumb '+t.thumb});
      thumb.innerHTML = `<div class="tt-eyebrow">MMLI</div><div class="tt-head">${state.flyerType==='event' ? 'Event Title' : 'Full Name'}</div><div class="tt-line"></div><div class="tt-meta">${state.flyerType==='event' ? 'DATE • TIME • VENUE' : 'ROLE • SCHOOL'}</div>`;
      card.appendChild(thumb);
      const meta = el('div',{class:'tpl-meta'}, `<b>${esc(t.name)}</b><span>${esc(t.desc)}</span>`);
      card.appendChild(meta);
      card.addEventListener('click', ()=>{
        state.template = t.id; state.accent = t.accent; state.align = t.align;
        $$('.tpl-card').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected');
      });
      grid.appendChild(card);
    });
    f.appendChild(grid);
    const actions = el('div',{class:'wizard-actions'});
    const back = el('button',{class:'btn btn-ghost'},'← Back');
    back.addEventListener('click', ()=>{ state.step=2; renderSteps(); renderStepPanel(); });
    const go = el('button',{class:'btn btn-primary'},'Generate flyer →');
    go.addEventListener('click', ()=>{ openEditor(); });
    actions.appendChild(back); actions.appendChild(go);
    f.appendChild(actions);
    return f;
  }

  function wizardActions(hasBack, onNext, onBack){
    const actions = el('div',{class:'wizard-actions'});
    if(hasBack){
      const back = el('button',{class:'btn btn-ghost'},'← Back');
      back.addEventListener('click', onBack);
      actions.appendChild(back);
    } else {
      actions.appendChild(el('span',{}));
    }
    const next = el('button',{class:'btn btn-primary'},'Continue →');
    next.addEventListener('click', onNext);
    actions.appendChild(next);
    return actions;
  }

  /* ---------------- editor ---------------- */
  function openEditor(){
    setView('editor');
    buildEditorSidebars();
    renderCanvas();
    confetti();
    showToast('Flyer generated — edit anything below', '✨');
  }

  function buildEditorSidebars(){
    // section toggles
    const sec = $('#sectionToggles'); sec.innerHTML='';
    const secDefs = state.flyerType==='event'
      ? [['meta','Date / time / venue'],['desc','Description'],['prizes','Prizes'],['footer','Contact & website']]
      : [['desc','Bio'],['footer','Contact & website']];
    secDefs.forEach(([key,label])=>{
      const row = el('div',{class:'toggle-row'});
      const sw = el('label',{class:'switch'});
      const cb = el('input',{type:'checkbox'});
      cb.checked = state.sections[key] !== false;
      cb.addEventListener('change', ()=>{ state.sections[key]=cb.checked; renderCanvas(); });
      sw.appendChild(cb); sw.appendChild(el('span',{class:'slider'}));
      row.appendChild(sw);
      row.appendChild(el('span',{style:'font:600 12.5px Inter'}, esc(label)));
      sec.appendChild(row);
    });

    // accent swatches
    const sw = $('#accentSwatches'); sw.innerHTML='';
    Object.keys(ACCENTS).forEach(key=>{
      const b = el('button',{class:'swatch sw-'+key+(state.accent===key?' active':''), title:key});
      b.addEventListener('click', ()=>{ state.accent=key; $$('.swatch').forEach(s=>s.classList.remove('active')); b.classList.add('active'); renderCanvas(); });
      sw.appendChild(b);
    });

    // template list (right column)
    const tl = $('#editorTemplateList'); tl.innerHTML='';
    TEMPLATES.forEach(t=>{
      const b = el('button',{class:'mini-btn'}, (state.template===t.id?'● ':'○ ')+esc(t.name));
      b.addEventListener('click', ()=>{ state.template=t.id; buildEditorSidebars(); renderCanvas(); });
      tl.appendChild(b);
    });

    // quick switch segmented control (top of canvas) — prev/next template
    const qs = $('#templateQuickSwitch'); qs.innerHTML='';
    const prev = el('button',{},'‹ Template'); const next = el('button',{},'Template ›');
    prev.addEventListener('click', ()=> cycleTemplate(-1));
    next.addEventListener('click', ()=> cycleTemplate(1));
    qs.appendChild(prev); qs.appendChild(next);

    // alignment segment
    $$('#alignSeg button').forEach(b=>{
      b.classList.toggle('active', b.dataset.align===state.align);
      b.onclick = ()=>{ state.align=b.dataset.align; $$('#alignSeg button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderCanvas(); };
    });

    $$('.mini-btn[data-scale]').forEach(b=>{
      b.onclick = ()=>{
        if(b.dataset.scale==='up') state.scaleLevel = Math.max(-1, state.scaleLevel-1);
        else state.scaleLevel = Math.min(2, state.scaleLevel+1);
        renderCanvas();
      };
    });
  }

  function cycleTemplate(dir){
    const idx = TEMPLATES.findIndex(t=>t.id===state.template);
    const next = TEMPLATES[(idx+dir+TEMPLATES.length)%TEMPLATES.length];
    state.template = next.id;
    buildEditorSidebars();
    renderCanvas();
  }

  function fitClassFor(level){
    if(level<=-1) return ' grow';
    if(level===0) return '';
    if(level===1) return ' fit-1';
    return ' fit-2';
  }

  function renderCanvas(){
    const canvas = $('#flyerCanvas');
    const tpl = TEMPLATES.find(t=>t.id===state.template) || TEMPLATES[0];
    const acc = ACCENTS[state.accent] || ACCENTS.gold;
    canvas.style.setProperty('--accent', acc.accent);
    canvas.style.setProperty('--accent-deep', acc.deep);

    const d = state.data;
    const dateStr = d.date ? new Date(d.date+'T00:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}) : '';
    const headFit = fitClassFor(state.scaleLevel);

    let inner = `<div class="fc-inner ${tpl.cls}" data-align="${state.align}">`;
    inner += `<div class="fc-eyebrow">${esc(ORG)}</div>`;
    inner += `<div class="fc-logo-badge"><img src="${MMLI_LOGO}" alt=""></div>`;

    if(state.flyerType === 'event'){
      inner += `<div class="fc-headline${headFit}" contenteditable="true" data-key="eventName">${esc(d.eventName||'Your Event Name')}</div>`;
      if(d.theme) inner += `<div class="fc-theme" contenteditable="true" data-key="theme">${esc(d.theme)}</div>`;
      inner += `<div class="fc-rule"></div>`;
      if(state.sections.meta){
        const metaBits = [d.eventType, dateStr, d.time, d.venue].filter(Boolean);
        inner += `<div class="fc-meta">`+ metaBits.map(m=>`<span>${esc(m)}</span>`).join('') +`</div>`;
      }
      if(state.sections.desc && d.description){
        inner += `<div class="fc-desc${fitClassFor(Math.max(0,state.scaleLevel))}" contenteditable="true" data-key="description">${esc(d.description)}</div>`;
      }
      inner += `<div class="fc-spacer"></div>`;
      if(state.sections.prizes && (d.prize1||d.prize2||d.prize3)){
        inner += `<div class="fc-prizes">`;
        if(d.prize1) inner += `<div><span>🥇 1st place</span><span>${esc(d.prize1)}</span></div>`;
        if(d.prize2) inner += `<div><span>🥈 2nd place</span><span>${esc(d.prize2)}</span></div>`;
        if(d.prize3) inner += `<div><span>🥉 3rd place</span><span>${esc(d.prize3)}</span></div>`;
        inner += `</div>`;
      }
      if(state.sections.footer){
        const footBits = [];
        if(d.registration) footBits.push('Registration: '+d.registration + (d.regDeadline ? ' · closes '+new Date(d.regDeadline+'T00:00:00').toLocaleDateString() : ''));
        if(d.contact) footBits.push(d.contact);
        if(d.website) footBits.push(d.website);
        inner += `<div class="fc-footer">${footBits.map(esc).join('<br>')}</div>`;
      }
      inner += `<div class="fc-motto">"${esc(MOTTO)}"</div>`;
    } else {
      inner += `<div class="fc-photo-wrap">` + (d.photo ? `<img src="${d.photo}" alt="">` : esc(initialsOf(d.fullName))) + `</div>`;
      inner += `<div class="fc-name${headFit}" contenteditable="true" data-key="fullName">${esc(d.fullName||'Full Name')}</div>`;
      if(d.roleTitle) inner += `<div class="fc-role" contenteditable="true" data-key="roleTitle">${esc(d.roleTitle)}</div>`;
      if(d.school) inner += `<div class="fc-school" contenteditable="true" data-key="school">${esc(d.school)}</div>`;
      if(d.achievement) inner += `<div class="fc-badge">${esc(d.achievement)}</div>`;
      inner += `<div class="fc-rule"></div>`;
      if(state.sections.desc && d.bio){
        inner += `<div class="fc-desc${fitClassFor(Math.max(0,state.scaleLevel))}" contenteditable="true" data-key="bio">${esc(d.bio)}</div>`;
      }
      inner += `<div class="fc-spacer"></div>`;
      if(d.quote) inner += `<div class="fc-quote" contenteditable="true" data-key="quote">“${esc(d.quote.replace(/^["“]|["”]$/g,''))}”</div>`;
      if(state.sections.footer){
        const footBits = [];
        if(d.subject) footBits.push(d.subject);
        inner += `<div class="fc-footer">${footBits.map(esc).join(' · ')}</div>`;
      }
      inner += `<div class="fc-motto">"${esc(MOTTO)}"</div>`;
    }
    inner += `</div>`;
    canvas.innerHTML = inner;

    // wire up contenteditable sync back to state
    $$('[contenteditable="true"]', canvas).forEach(node=>{
      node.addEventListener('blur', ()=>{
        const key = node.dataset.key;
        if(key) state.data[key] = node.textContent.trim();
      });
      node.addEventListener('keydown', (e)=>{
        if(e.key==='Enter' && (node.classList.contains('fc-headline') || node.classList.contains('fc-name'))) e.preventDefault();
      });
    });

    autoFitLayout(canvas);
  }

  function initialsOf(name){
    return (name||'').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase() || '🙂';
  }

  function autoFitLayout(canvas){
    // Smart layout: shrink long headline/description automatically if it overflows.
    const headline = $('.fc-headline, .fc-name', canvas);
    const desc = $('.fc-desc', canvas);
    [headline].forEach(node=>{
      if(!node) return;
      let guard = 0;
      while(node.scrollWidth > node.clientWidth + 4 && guard < 2){
        if(node.classList.contains('fit-2')) break;
        node.classList.add(node.classList.contains('fit-1') ? 'fit-2' : 'fit-1');
        guard++;
      }
    });
    if(desc){
      let guard = 0;
      while(desc.scrollHeight > 92 && guard < 2){
        if(desc.classList.contains('fit-2')) break;
        desc.classList.add(desc.classList.contains('fit-1') ? 'fit-2' : 'fit-1');
        guard++;
      }
    }
  }

  /* ---------------- export ---------------- */
  function exportPNG(){
    const canvas = $('#flyerCanvas');
    if(typeof html2canvas === 'undefined'){
      showToast('Still loading the exporter — try again in a second', '⏳');
      return;
    }
    $$('[contenteditable]', canvas).forEach(n=>n.removeAttribute('contenteditable'));
    html2canvas(canvas, {scale:3, useCORS:true, backgroundColor:null}).then(c=>{
      const link = document.createElement('a');
      const name = (state.data.eventName || state.data.fullName || 'mmli-flyer').replace(/[^a-z0-9]+/gi,'-').toLowerCase();
      link.download = name + '.png';
      link.href = c.toDataURL('image/png');
      link.click();
      $$('.fc-headline,.fc-name,.fc-theme,.fc-desc,.fc-role,.fc-school,.fc-quote,.fc-bio', canvas).forEach(n=>n.setAttribute('contenteditable','true'));
      showToast('Flyer downloaded', '⬇️');
    }).catch(()=> showToast('Export failed — try Print instead', '⚠️'));
  }

  function printFlyer(){
    window.print();
  }

  /* ============================================================
     THOMAS — rule-based design assistant
     ============================================================ */
  function thomasOpen(){ $('#thomasPanel').classList.add('open'); if(state.chat.length===0) thomasGreet(); }
  function thomasToggle(){ $('#thomasPanel').classList.toggle('open'); if($('#thomasPanel').classList.contains('open') && state.chat.length===0) thomasGreet(); }
  function thomasClose(){ $('#thomasPanel').classList.remove('open'); }

  function thomasGreet(){
    const name = state.flyerType==='event' ? (state.data.eventName||'this flyer') : (state.data.fullName||'this spotlight');
    const msg = state.view==='editor'
      ? `Hi, I'm THOMAS 👋 I can resize text, switch templates, change colours, tighten copy, or review ${esc(name)} for you. What would you like?`
      : `Hi, I'm THOMAS 👋 your MMLI design assistant. Start a flyer and I'll help you fine‑tune it — or ask me anything about the generator.`;
    pushBot(msg);
    renderChips();
  }

  function pushBot(text){ state.chat.push({who:'bot', text}); renderChat(); }
  function pushUser(text){ state.chat.push({who:'user', text}); renderChat(); }

  function renderChat(){
    const body = $('#thomasBody');
    body.innerHTML = '';
    state.chat.forEach(m=>{
      body.appendChild(el('div',{class:'tmsg '+(m.who==='bot'?'bot':'user')}, esc(m.text).replace(/\n/g,'<br>')));
    });
    body.scrollTop = body.scrollHeight;
  }

  function renderChips(){
    const chips = $('#thomasChips'); chips.innerHTML='';
    const inEditor = state.view === 'editor';
    const options = inEditor
      ? ['Improve this design','Make the title bigger','Try a different template','Shorten the description','Change the accent colour']
      : ['What can you do?','Help me choose a template','How do I export my flyer?'];
    options.forEach(o=>{
      const c = el('button',{class:'chip'}, esc(o));
      c.addEventListener('click', ()=>{ pushUser(o); setTimeout(()=>respond(o), 450); });
      chips.appendChild(c);
    });
  }

  function typingThen(fn){
    const body = $('#thomasBody');
    const t = el('div',{class:'typing', id:'typingNode'},'<span></span><span></span><span></span>');
    body.appendChild(t); body.scrollTop = body.scrollHeight;
    setTimeout(()=>{
      const node = document.getElementById('typingNode');
      if(node) node.remove();
      fn();
    }, 520 + Math.random()*380);
  }

  function respond(raw){
    const text = raw.toLowerCase();
    typingThen(()=>{
      const reply = thomasHandle(text);
      pushBot(reply);
      renderChips();
    });
  }

  function thomasHandle(text){
    if(!state.flyerType || state.view!=='editor'){
      if(/what can you do|help/.test(text)){
        return "I can help you pick a template, keep text readable, and once you're in the editor I can resize text, swap colours, tighten copy and review your design before you export. Start a flyer from the dashboard and I'll be right there.";
      }
      if(/template/.test(text)){
        return "Modern Quiz and Bold Competition read well for high-energy events; Academic Honors and Elegant suit formal programs; Youth Energy is great for younger audiences. You can always switch later in the editor.";
      }
      if(/export|download|pdf/.test(text)){
        return "Once your flyer is generated, use 'Download PNG' for social media, or 'Print / Save PDF' for a printable version — both are in the editor's right-hand panel.";
      }
      return "I'm most useful once you're editing a flyer — start one from the dashboard and I'll help you fine‑tune it.";
    }

    // in editor
    if(/hi|hello|hey/.test(text) && text.length<12) return "Hey! What would you like to adjust?";

    if(/thank/.test(text)) return "Anytime — that's what I'm here for. Anything else before you export?";

    if(/(bigger|larger|increase).*(title|headline|heading|name)|((title|headline|heading|name).*(bigger|larger))/.test(text)){
      state.scaleLevel = Math.max(-1, state.scaleLevel-1); renderCanvas();
      return "Done — I've bumped up the headline size and kept it from overflowing the frame.";
    }
    if(/(smaller|reduce|shrink).*(title|headline|heading|name)|((title|headline|heading|name).*(smaller|reduce))/.test(text)){
      state.scaleLevel = Math.min(2, state.scaleLevel+1); renderCanvas();
      return "Got it — headline is a touch smaller now, which also gives your other details more room.";
    }
    if(/(bigger|larger) text|increase (the )?text/.test(text)){
      state.scaleLevel = Math.max(-1, state.scaleLevel-1); renderCanvas();
      return "Increased the overall text size.";
    }
    if(/(smaller|reduce) text|decrease (the )?text/.test(text)){
      state.scaleLevel = Math.min(2, state.scaleLevel+1); renderCanvas();
      return "Reduced the overall text size.";
    }

    if(/template\s*(\d)/.test(text)){
      const n = parseInt(text.match(/template\s*(\d)/)[1],10);
      const t = TEMPLATES[n-1];
      if(t){ state.template = t.id; buildEditorSidebars(); renderCanvas(); return `Switched to ${t.name}.`; }
    }
    for(const t of TEMPLATES){
      if(text.includes(t.name.toLowerCase())){
        state.template = t.id; buildEditorSidebars(); renderCanvas();
        return `Switched to ${t.name} — ${t.desc.toLowerCase()}.`;
      }
    }
    if(/different template|another template|new template|change (the )?template|swap (the )?template/.test(text)){
      cycleTemplate(1);
      const t = TEMPLATES.find(x=>x.id===state.template);
      return `Try this one — ${t.name}. Say "another template" to keep browsing, or name one directly.`;
    }

    if(/gold|golden/.test(text) && /(colour|color|accent|theme|background)/.test(text) || /^gold$/.test(text)){
      state.accent='gold'; buildEditorSidebars(); renderCanvas(); return "Switched the accent to MMLI gold.";
    }
    if(/navy|blue/.test(text) && (/(colour|color|accent|theme|background)/.test(text) || text.trim()==='navy')){
      state.accent='navy'; buildEditorSidebars(); renderCanvas(); return "Switched the accent to navy.";
    }
    if(/green/.test(text)){
      state.accent='green'; buildEditorSidebars(); renderCanvas(); return "Switched the accent to green — nice for youth-facing designs.";
    }
    if(/cream|light|white/.test(text) && /(colour|color|accent|theme|background)/.test(text)){
      state.accent='cream'; buildEditorSidebars(); renderCanvas(); return "Lightened the accent to cream.";
    }

    if(/center/.test(text)){ state.align='center'; buildEditorSidebars(); renderCanvas(); return "Centered the layout."; }
    if(/left align|align left/.test(text)){ state.align='left'; buildEditorSidebars(); renderCanvas(); return "Left-aligned the layout — good for a more editorial feel."; }

    if(/shorten|too long|trim|cut (it )?down|tighten/.test(text)){
      const key = state.flyerType==='event' ? 'description' : 'bio';
      const val = state.data[key]||'';
      if(!val){ return "There's no description yet for me to trim — add one in the wizard and I'll help tighten it."; }
      if(val.length <= 140){ return "That copy is already tight — I wouldn't cut anything further."; }
      const trimmed = val.slice(0, 137).replace(/\s+\S*$/,'') + '…';
      state.data[key] = trimmed; renderCanvas();
      return "Trimmed it to a tighter, skim-friendly length. Feel free to tweak the wording directly on the flyer.";
    }

    if(/(add|show) prizes|(hide|remove) prizes/.test(text)){
      const show = /add|show/.test(text);
      state.sections.prizes = show; buildEditorSidebars(); renderCanvas();
      return show ? "Prizes are now showing." : "Hid the prizes block.";
    }

    if(/reset|start over|undo all/.test(text)){
      state.scaleLevel = 0; state.align='center';
      buildEditorSidebars(); renderCanvas();
      return "Reset text size and alignment back to defaults.";
    }

    if(/export|download|save image|pdf|print/.test(text)){
      return "Use 'Download PNG' for social posts, or 'Print / Save PDF' for a print-ready version — both are in the right-hand panel.";
    }

    if(/improve|suggest|feedback|review|critique|check/.test(text)){
      return runDesignReview();
    }

    return "I can resize text, switch templates, change the accent colour, tighten copy, or review the whole design — try 'improve this design' or name a template like 'Elegant'.";
  }

  function runDesignReview(){
    const issues = [];
    const d = state.data;
    const descKey = state.flyerType==='event' ? 'description' : 'bio';
    const desc = d[descKey]||'';

    if(desc.length > 200){
      issues.push("Your "+(state.flyerType==='event'?'description':'bio')+" runs long for a quick read — say 'shorten the description' and I'll tighten it.");
    }
    if(state.flyerType==='event' && !d.venue){
      issues.push("No venue listed yet — flyers without one confuse people. Add it back in the wizard when you can.");
    }
    if(state.flyerType==='event' && d.eventName && d.eventName.length > 42 && state.scaleLevel<=0){
      state.scaleLevel = 1; renderCanvas();
      issues.push("Your event name is long, so I nudged the headline size down to keep it on one line.");
    }
    if(state.accent==='cream' && ['t1','t3','t6'].includes(state.template)){
      issues.push("A cream accent is hard to read on this darker template — I'd switch to gold or green for contrast.");
    }
    if(state.flyerType==='event' && !(d.prize1||d.prize2||d.prize3) && state.sections.prizes){
      issues.push("Prizes are toggled on but empty — hide that section or fill in at least first place.");
    }
    if(!issues.length){
      return "This is in good shape — clear hierarchy, readable contrast, and MMLI branding is all present. Ready to export.";
    }
    return "Here's what I'd tighten:\n• " + issues.join("\n• ");
  }

  /* ---------------- wire up global events ---------------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    $('#brandMark').addEventListener('click', goDashboard);
    $('#brandName').addEventListener('click', goDashboard);
    $('#topCreateBtn').addEventListener('click', ()=>{
      if(state.view==='dashboard'){ const g = $('.create-grid'); if(g) g.scrollIntoView({behavior:'smooth', block:'center'}); }
      else { goDashboard(); setTimeout(()=>{ const g = $('.create-grid'); if(g) g.scrollIntoView({behavior:'smooth', block:'center'}); }, 300); }
    });

    $$('[data-start]').forEach(b=> b.addEventListener('click', ()=> startWizard(b.dataset.start)));

    $('#wizardBack').addEventListener('click', ()=>{
      if(state.step>1){ state.step--; renderSteps(); renderStepPanel(); } else { goDashboard(); }
    });
    $('#editorBack').addEventListener('click', ()=>{ state.step=3; setView('wizard'); renderSteps(); renderStepPanel(); });

    $('#exportPngBtn').addEventListener('click', exportPNG);
    $('#printBtn').addEventListener('click', printFlyer);
    $('#startOverBtn').addEventListener('click', ()=>{
      if(confirm('Start a new design? Current edits will be lost.')) goDashboard();
    });

    $('#askThomasImprove').addEventListener('click', ()=>{
      thomasOpen();
      setTimeout(()=>{ pushUser('Improve this design'); setTimeout(()=>respond('improve this design'), 450); }, 250);
    });

    $('#thomasFab').addEventListener('click', thomasToggle);
    $('#thomasClose').addEventListener('click', thomasClose);
    $('#thomasSend').addEventListener('click', sendThomasInput);
    $('#thomasInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter') sendThomasInput(); });

    function sendThomasInput(){
      const input = $('#thomasInput');
      const val = input.value.trim();
      if(!val) return;
      pushUser(val);
      input.value='';
      respond(val);
    }

    renderSteps();
  });

})();
