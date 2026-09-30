/* Local data and calendar helpers. The original ritme.v1 key is never modified. */
window.RitmeStore = (() => {
  const KEY = 'ritme.v3';
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const asDate = s => new Date(s + 'T12:00:00');
  const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && dateKey(asDate(s)) === s;
  const today = () => dateKey(new Date());
  const addDays = (s,n) => { const d=asDate(s); d.setDate(d.getDate()+n); return dateKey(d); };
  const shifts = ['ochtend','middag','nacht','vrij'];
  const base = [
    {id:'slaap',name:'Minimaal 8 uur geslapen',icon:'moon',color:0},
    {id:'groente',name:'Groente gegeten',icon:'leaf',color:1},
    {id:'fruit',name:'Fruit gegeten',icon:'apple',color:2},
    {id:'sport',name:'Bewogen',icon:'sport',color:3}
  ];
  const catalog = [...base,
    {id:'fasting',name:'Avondvasten',icon:'fasting',color:4},
    {id:'water',name:'Water drinken',icon:'drop',color:5},
    {id:'reading',name:'Lezen',icon:'book',color:1},
    {id:'outside',name:'Naar buiten gaan',icon:'sun',color:2},
    {id:'walking',name:'Wandelen',icon:'steps',color:0},
    {id:'stretching',name:'Rekken en strekken',icon:'stretch',color:3},
    {id:'screen',name:'Tijd zonder scherm',icon:'phone',color:4},
    {id:'journal',name:'Dagboek schrijven',icon:'journal',color:5},
    {id:'relax',name:'Tijd voor ontspanning',icon:'tea',color:1}
  ];
  const icons = {moon:'Maan',leaf:'Blaadje',apple:'Appel',sport:'Halter',fasting:'Maan met bord',drop:'Waterdruppel',book:'Open boek',sun:'Zon',steps:'Voetstappen',stretch:'Strekkend figuurtje',phone:'Telefoon met streep',journal:'Schriftje met pen',tea:'Kopje thee',heart:'Hart',target:'Doelwit'};
  const normalizeName = name => name.trim().replace(/\s+/g,' ').toLocaleLowerCase('nl-NL');
  function habits(input, strict=false) {
    if (!Array.isArray(input)) { if(strict) throw Error('Gewoontes ontbreken in deze back-up.'); return []; }
    const seen=new Set();
    return input.filter(h => {
      const ok=object(h) && typeof h.id==='string' && /^h-[a-zA-Z0-9-]{1,90}$/.test(h.id) && typeof h.name==='string' && h.name.trim().length>0 && h.name.length<=60 && validDate(h.startDate) && !seen.has(h.id);
      if(!ok && strict) throw Error('Deze back-up bevat een ongeldige gewoonte.');
      if(ok) seen.add(h.id); return ok;
    }).map(h=>({id:h.id,name:h.name.trim(),startDate:h.startDate}));
  }
  function validateV2(v) {
    if(!object(v) || v.version!==2 || !validDate(v.startDate) || !object(v.entries) || !Array.isArray(v.archives)) throw Error('Dit is geen geldige Ritme-back-up.');
    const cleanHabits=habits(v.habits,true), ids=new Set([...base,...cleanHabits].map(h=>h.id));
    const entries={};
    for(const [day,entry] of Object.entries(v.entries)) {
      if(!validDate(day) || !object(entry) || !object(entry.checks) || (entry.dienst!=='' && !shifts.includes(entry.dienst))) throw Error('Deze back-up bevat een ongeldige dag.');
      const checks={};
      for(const [id,value] of Object.entries(entry.checks)) {
        if(!ids.has(id) || typeof value!=='boolean') throw Error('Deze back-up bevat ongeldige vinkjes.');
        checks[id]=value;
      }
      entries[day]={checks,dienst:entry.dienst};
    }
    if(v.archives.some(a=>!object(a) || typeof a.raw!=='string' || typeof a.savedAt!=='string')) throw Error('Het back-uparchief is ongeldig.');
    return {version:2,startDate:v.startDate,habits:cleanHabits,entries,archives:v.archives};
  }
  function archive(raw) { return {savedAt:new Date().toISOString(),raw}; }
  function migrateV2(input) {
    const v=validateV2(input);
    return {version:3,startDate:v.startDate,goals:[
      ...base.map(h=>({...h,startDate:v.startDate})),
      ...v.habits.map((h,i)=>({...h,icon:['book','sun','heart','drop'][i%4],color:(i+4)%6}))
    ],entries:v.entries,archives:v.archives};
  }
  function validate(v) {
    if(!object(v) || v.version!==3 || !validDate(v.startDate) || !Array.isArray(v.goals) || !object(v.entries) || !Array.isArray(v.archives)) throw Error('Dit is geen geldige Ritme-back-up.');
    const ids=new Set();
    const goals=v.goals.map(h=>{
      if(!object(h) || typeof h.id!=='string' || !/^(slaap|groente|fruit|sport|h-[a-zA-Z0-9-]{1,90})$/.test(h.id) || ids.has(h.id) || typeof h.name!=='string' || !h.name.trim() || h.name.length>60 || !Object.hasOwn(icons,h.icon) || !Number.isInteger(h.color) || h.color<0 || h.color>5 || !validDate(h.startDate)) throw Error('Deze back-up bevat een ongeldig doel.');
      ids.add(h.id);
      return {id:h.id,name:h.name.trim().replace(/\s+/g,' '),icon:h.icon,color:h.color,startDate:h.startDate};
    });
    const entries={};
    for(const [day,entry] of Object.entries(v.entries)) {
      if(!validDate(day) || !object(entry) || !object(entry.checks) || (entry.dienst!=='' && !shifts.includes(entry.dienst))) throw Error('Deze back-up bevat een ongeldige dag.');
      const checks={};
      for(const [id,value] of Object.entries(entry.checks)) {
        if(!ids.has(id) || typeof value!=='boolean') throw Error('Deze back-up bevat ongeldige vinkjes.');
        checks[id]=value;
      }
      entries[day]={checks,dienst:entry.dienst};
    }
    if(v.archives.some(a=>!object(a) || typeof a.raw!=='string' || typeof a.savedAt!=='string')) throw Error('Het back-uparchief is ongeldig.');
    return {version:3,startDate:v.startDate,goals,entries,archives:v.archives};
  }
  function load() {
    const saved=localStorage.getItem(KEY);
    if(saved!==null) return validate(JSON.parse(saved));
    const previous=localStorage.getItem('ritme.v2');
    let state;
    if(previous!==null) state=migrateV2(JSON.parse(previous));
    else {
      const raw=localStorage.getItem('ritme.v1');
      let old=null; try { old=JSON.parse(raw); } catch (_) { /* Preserve unreadable legacy content, too. */ }
      state=migrateV2({version:2,startDate:today(),habits:habits(old?.habits),entries:{},archives:raw===null?[]:[archive(raw)]});
    }
    save(state); return state;
  }
  function save(state) { localStorage.setItem(KEY,JSON.stringify(state)); }
  function importData(raw,current) {
    const v=JSON.parse(raw);
    if(v?.version===2 || v?.version===3) {
      const restored=v.version===2?migrateV2(v):validate(v);
      restored.archives.push(archive(JSON.stringify(current)));
      return restored;
    }
    if(!object(v) || (v.version!==undefined && v.version!==1) || !object(v.entries)) throw Error('Dit is geen geldige Ritme-back-up.');
    const next=structuredClone(current);
    if(!next.archives.some(a=>a.raw===raw)) next.archives.push(archive(raw));
    return next;
  }
  function addGoal(state,name,icon,color=0) {
    name=name.trim().replace(/\s+/g,' ');
    if(!name || name.length>60 || !Object.hasOwn(icons,icon)) throw Error('Vul een naam in en kies een pictogram.');
    if(state.goals.some(h=>normalizeName(h.name)===normalizeName(name))) throw Error('Dit doel staat al in je lijst.');
    const next=structuredClone(state);
    next.goals.push({id:'h-'+crypto.randomUUID(),name,icon,color,startDate:today()});
    return next;
  }
  function removeGoal(state,id) {
    const next=structuredClone(state);
    next.goals=next.goals.filter(h=>h.id!==id);
    for(const entry of Object.values(next.entries)) delete entry.checks[id];
    return next;
  }
  function goals(state) { return state.goals; }
  function available(state,h,day) { return day>=state.startDate && day>=h.startDate && day<=today(); }
  function periodDates(anchor,mode) {
    const d=asDate(anchor);
    if(mode==='month') d.setDate(1); else d.setDate(d.getDate()-((d.getDay()+6)%7));
    const count=mode==='month'?new Date(d.getFullYear(),d.getMonth()+1,0).getDate():7;
    return Array.from({length:count},(_,i)=>addDays(dateKey(d),i));
  }
  function stats(state,dates) {
    const rows=goals(state).map(h=>{
      const eligible=dates.filter(d=>available(state,h,d));
      return {...h,total:eligible.length,done:eligible.filter(d=>state.entries[d]?.checks[h.id]===true).length};
    });
    const total=rows.reduce((s,h)=>s+h.total,0), done=rows.reduce((s,h)=>s+h.done,0);
    return {rows,total,done,percent:total?Math.round(done/total*100):0};
  }
  return {catalog,icons,normalizeName,addGoal,removeGoal,migrateV2,KEY,today,dateKey,asDate,validDate,addDays,load,save,validate,importData,goals,available,periodDates,stats,shifts};
})();
