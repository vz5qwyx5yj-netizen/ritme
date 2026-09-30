(() => {
  'use strict';
  const S=RitmeStore, $=id=>document.getElementById(id);
  const paths={
    moon:'M21 14A9 9 0 0 1 10 3a9 9 0 1 0 11 11ZM18 3v4m-2-2h4',
    leaf:'M12 22V11M12 17C3 18 2 10 3 7c6 0 9 4 9 10ZM12 12C12 5 17 2 22 2c0 6-3 10-10 10Z',
    apple:'M12 7c-7-5-12 3-8 10 3 6 5 4 8 4s5 2 8-4c4-7-1-15-8-10ZM12 7c-1-3 0-5 2-6m0 4c1-3 4-3 5-2-1 2-3 3-5 2Z',
    sport:'M3 8v8m3-11v14m12-14v14m3-11v8M6 12h12M1 10v4m22-4v4',
    book:'M12 5C9 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v16',
    sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
    heart:'M12 21 3 12C-3 4 7-2 12 6c5-8 15-2 9 6Z',
    drop:'M12 2C10 7 4 12 4 16a8 8 0 0 0 16 0c0-4-6-9-8-14Z',
    fasting:'M18 2a5 5 0 0 0 4 7 5 5 0 1 1-4-7ZM17 16a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM3 12v5m2-5v5m-1 0v6m17-11v11',
    steps:'M7 2c3 0 4 8 2 10-1 1-4 0-4-2S4 2 7 2ZM5 15h4v4H5ZM17 5c3 0 3 7 2 9s-4 3-5 1 0-10 3-10ZM14 19l4 1-1 3-4-1Z',
    stretch:'M14 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM12 8v7m0-5L5 7 2 3m10 7 7-3 3-4M12 15l-5 7m5-7 5 7',
    phone:'M8 2h9a1 1 0 0 1 1 1v13M18 20v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8m3-6h5M10 19h4M2 2l20 20',
    journal:'M15 3H4v19h15V12M2 7h4m-4 5h4m-4 5h4M8 8h4m-4 4h2m-2 6h6M12 13l1-4 7-7 3 3-7 7-4 1Zm6-9 3 3',
    tea:'M3 10h14v7c0 6-14 6-14 0v-7Zm14 1h2c5 0 3 6-2 6M5 3c-3 3 3 3 0 5m5-7c-3 3 3 4 0 7m5-5c-3 3 3 3 0 5M2 23h17',
    target:'M21 12a9 9 0 1 1-9-9M17 12a5 5 0 1 1-5-5m0 5 9-9m-5 0h5v5',
    trash:'M3 6h18M9 6V3h6v3M5 6l1 16h12l1-16M10 10v8m4-8v8',
    home:'m2 11 10-9 10 9M5 9v13h5v-8h4v8h5V9',
    calendar:'M4 5h16a1 1 0 0 1 1 1v15H3V6a1 1 0 0 1 1-1ZM7 2v6m10-6v6M3 10h18M7 14h1m3 0h1m3 0h1M7 18h1m3 0h1m3 0h1',
    chart:'M3 22V12h4v10m3 0V6h4v16m3 0V2h4v20M1 22h22'
  };
  const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.sun}"/></svg>`;
  const paint=(el,h)=>{el.style.setProperty('--wash',`var(--wash-${h.color})`);el.style.setProperty('--paint',`var(--paint-${h.color})`);};
  const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
  const fmt=(day,options)=>S.asDate(day).toLocaleDateString('nl-NL',options);
  const short=day=>fmt(day,{day:'numeric',month:'short'});
  let state,view='vandaag',selected=S.today(),anchor=selected,mode='week',lastToday=selected,toastTimer;
  function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4500);}
  try{state=S.load();}catch(error){$('app').hidden=true;$('fatal').hidden=false;$('fatal').textContent='Je schrift kon niet worden geopend. Je opgeslagen gegevens zijn niet gewijzigd. Controleer of je browser lokale opslag toestaat en herlaad de pagina.';document.querySelector('.bottom-nav').hidden=true;return;}
  function commit(next){try{S.save(next);state=next;return true;}catch(_){const message='Opslaan lukt niet. Je wijziging is niet bewaard. Maak ruimte vrij en probeer opnieuw.';toast(message);for(const [dialog,error] of [['habit-dialog','goal-error'],['manage-dialog','manage-error']]){if($(dialog).open){$(error).textContent=message;$(error).hidden=false;}}return false;}}
  function toggle(id,day){const h=S.goals(state).find(h=>h.id===id);if(!h||!S.available(state,h,day))return;const next=structuredClone(state);const entry=next.entries[day]||{checks:{},dienst:''};entry.checks[id]=!entry.checks[id];next.entries[day]=entry;if(commit(next)){renderKeepingFocus();}}
  function renderKeepingFocus(){const active=document.activeElement;const key=active?.dataset.focus;const scroll=$('habit-grid').scrollLeft;render();if(key){[...document.querySelectorAll('[data-focus]')].find(n=>n.dataset.focus===key)?.focus({preventScroll:true});}$('habit-grid').scrollLeft=scroll;}
  function render(){
    const today=S.today(),dates=S.periodDates(anchor,mode);
    const labels={vandaag:'Vandaag',gewoontes:'Gewoontes',inzichten:'Inzichten'};
    $('page-title').textContent=labels[view];$('eyebrow').textContent={vandaag:'JOUW DAG, JOUW TEMPO',gewoontes:'KLEINE STAPPEN, ELKE DAG',inzichten:'KIJK EENS HOEVER JE BENT'}[view];
    for(const name of Object.keys(labels))$('view-'+name).hidden=name!==view;
    document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    $('period-modes').hidden=view==='vandaag';document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));
    $('date-label').textContent=view==='vandaag'?fmt(selected,{weekday:'long',day:'numeric',month:'long'}):mode==='month'?fmt(anchor,{month:'long',year:'numeric'}):`${short(dates[0])} – ${short(dates[6])}`;
    $('date-hint').textContent=view==='vandaag'?(selected===today?'vandaag':'terug naar vandaag'):'terug naar deze '+(mode==='week'?'week':'maand');
    $('previous').setAttribute('aria-label',view==='vandaag'?'Vorige dag':'Vorige '+(mode==='week'?'week':'maand'));
    $('next').setAttribute('aria-label',view==='vandaag'?'Volgende dag':'Volgende '+(mode==='week'?'week':'maand'));
    $('next').disabled=view==='vandaag'?selected>=today:dates.at(-1)>=today;
    $('previous').disabled=view==='vandaag'?selected<=state.startDate:dates[0]<=state.startDate;
    if(view==='vandaag')renderToday();else if(view==='gewoontes')renderGrid(dates);else renderStats(dates);
    if($('habit-dialog').open)renderCatalog();if($('manage-dialog').open)renderManaged();
  }
  function renderToday(){
    const strip=$('week-strip');strip.replaceChildren();
    for(const day of S.periodDates(selected,'week')){
      const b=el('button');b.append(el('small','',fmt(day,{weekday:'short'}).replace('.','')),el('span','',S.asDate(day).getDate()));b.setAttribute('aria-label',fmt(day,{weekday:'long',day:'numeric',month:'long'}));b.setAttribute('aria-pressed',day===selected);b.disabled=day>S.today()||day<state.startDate;b.dataset.focus='day-'+day;b.onclick=()=>{selected=day;renderKeepingFocus();};strip.append(b);
    }
    const goals=S.goals(state).filter(h=>h.startDate<=selected),mount=$('daily-list');mount.replaceChildren();
    for(const h of goals){const b=el('button','daily-row');paint(b,h);b.innerHTML=icon(h.icon);b.append(el('span','wash',h.name),el('span','check'));b.setAttribute('aria-pressed',state.entries[selected]?.checks[h.id]===true);b.disabled=!S.available(state,h,selected);b.dataset.focus='daily-'+h.id;b.dataset.habit=h.id;b.onclick=()=>toggle(h.id,selected);mount.append(b);}
    const done=goals.filter(h=>state.entries[selected]?.checks[h.id]===true).length;$('day-count').textContent=`${done} / ${goals.length}`;
    $('goals-empty').hidden=goals.length>0;$('day-empty').hidden=selected>=state.startDate;$('start-label').textContent=short(state.startDate);
    const shifts=$('shifts');shifts.replaceChildren();for(const [key,label] of [['ochtend','Ochtend'],['middag','Middag'],['nacht','Nacht'],['vrij','Vrij']]){const b=el('button','',label);b.setAttribute('aria-pressed',state.entries[selected]?.dienst===key);b.dataset.focus='shift-'+key;b.disabled=selected<state.startDate||selected>S.today();b.onclick=()=>{const next=structuredClone(state);const entry=next.entries[selected]||{checks:{},dienst:''};entry.dienst=entry.dienst===key?'':key;next.entries[selected]=entry;if(commit(next))renderKeepingFocus();};shifts.append(b);}
  }
  function renderGrid(dates){
    const table=el('table','journal-table '+mode),head=table.createTHead().insertRow();const corner=el('th','','Gewoonte');corner.scope='col';head.append(corner);
    for(const day of dates){const th=el('th',day===S.today()?'is-today':'');th.scope='col';th.append(el('small','',fmt(day,{weekday:'short'}).replace('.','')),el('span','',S.asDate(day).getDate()));head.append(th);}
    const body=table.createTBody();
    for(const h of S.goals(state).filter(h=>h.startDate<=dates.at(-1))){const row=body.insertRow();paint(row,h);const th=el('th');th.scope='row';const label=el('span','goal-grid-label');label.innerHTML=icon(h.icon);label.append(el('span','wash',h.name));th.append(label);row.append(th);
      for(const day of dates){const td=row.insertCell(),b=el('button','grid-check');b.append(el('span','grid-square'));const done=state.entries[day]?.checks[h.id]===true;b.setAttribute('aria-pressed',done);b.setAttribute('aria-label',`${h.name}, ${short(day)}: ${done?'gedaan':'niet afgevinkt'}`);b.disabled=!S.available(state,h,day);b.dataset.habit=h.id;b.dataset.date=day;b.dataset.focus=day+'-'+h.id;b.onclick=()=>toggle(h.id,day);td.append(b);}
    }
    $('habit-grid').replaceChildren(table);if(!body.rows.length)$('habit-grid').replaceChildren(el('p','empty-goals','Nog geen doelen in deze periode. Voeg een doel toe om te beginnen.'));$('scroll-note').hidden=mode!=='month'||!body.rows.length;
  }
  function renderStats(dates){
    const stats=S.stats(state,dates),eligible=stats.rows.filter(h=>h.total>0);$('progress-percent').textContent=stats.total?stats.percent+'%':'—';$('progress-ring').style.setProperty('--progress',stats.percent+'%');$('progress-description').textContent=stats.total?'van je dagelijkse vinkjes gezet deze '+(mode==='week'?'week.':'maand.'):'In deze periode zijn er nog geen dagen om bij te houden.';
    $('stat-done').textContent=stats.done;$('stat-days').textContent=dates.filter(d=>eligible.some(h=>S.available(state,h,d)&&state.entries[d]?.checks[h.id]===true)).length;$('stat-goals').textContent=eligible.length;
    const mount=$('habit-stats');mount.replaceChildren();for(const h of stats.rows){const row=el('div','stat-row');paint(row,h);row.innerHTML=icon(h.icon);row.append(el('span','name',h.name));const bar=el('div','bar'),fill=el('i');const percent=h.total?Math.round(h.done/h.total*100):0;fill.style.width=percent+'%';bar.append(fill);bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',h.name);bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',percent);bar.setAttribute('aria-valuetext',`${h.done} van ${h.total} dagen`);row.append(bar,el('small','',h.total?percent+'%':'—'));mount.append(row);}
    $('archive-note').textContent=state.archives.length?'Je oude registraties zijn gearchiveerd en gaan mee in iedere back-up.':'Je nieuwe schrift begint op '+short(state.startDate)+'.';
  }
  document.querySelectorAll('[data-icon]').forEach(n=>n.innerHTML=icon(n.dataset.icon));$('workout-icon').innerHTML=icon('sport');
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render();window.scrollTo(0,0);});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render();});
  function step(n){if(view==='vandaag')selected=S.addDays(selected,n);else if(mode==='week')anchor=S.addDays(anchor,n*7);else{const d=S.asDate(anchor);d.setDate(1);d.setMonth(d.getMonth()+n);anchor=S.dateKey(d);}render();}
  $('previous').onclick=()=>step(-1);$('next').onclick=()=>step(1);$('date-reset').onclick=()=>{selected=S.today();anchor=selected;render();};
  let chosenIcon='target';
  function renderCatalog(){
    const mount=$('suggestions');mount.replaceChildren();
    for(const h of S.catalog){
      const added=state.goals.some(g=>S.normalizeName(g.name)===S.normalizeName(h.name));
      const b=el('button','suggestion');b.type='button';b.dataset.preset=h.id;paint(b,h);b.innerHTML=icon(h.icon);b.append(el('span','wash',h.name),el('small','',added?'Toegevoegd':'+'));
      b.disabled=added;b.setAttribute('aria-label',h.name+(added?', toegevoegd':', toevoegen'));b.onclick=()=>addGoal(h.name,h.icon,h.color);mount.append(b);
    }
  }
  function renderPicker(){
    const mount=$('icon-picker');mount.replaceChildren();
    for(const [key,label] of Object.entries(S.icons)){
      const option=el('label','icon-option'),input=el('input');input.type='radio';input.name='goal-icon';input.value=key;input.checked=chosenIcon===key;input.setAttribute('aria-label',label);
      input.onchange=()=>{chosenIcon=key;};const drawing=el('span');drawing.innerHTML=icon(key);option.append(input,drawing,el('small','',label));mount.append(option);
    }
  }
  function addGoal(name,iconName,color){
    $('goal-error').hidden=true;
    let next;try{next=S.addGoal(state,name,iconName,color);}catch(error){$('goal-error').textContent=error.message;$('goal-error').hidden=false;return;}
    if(commit(next)){$('habit-dialog').close();selected=S.today();anchor=selected;render();toast('Een nieuw doel voor vandaag.');}
  }
  const openHabit=()=>{$('goal-error').hidden=true;$('goal-catalog').hidden=false;$('habit-form').hidden=true;renderCatalog();$('habit-dialog').showModal();$('custom-goal').focus();};
  $('add-habit').onclick=openHabit;$('grid-add').onclick=openHabit;$('empty-add').onclick=openHabit;$('close-dialog').onclick=()=>$('habit-dialog').close();
  $('custom-goal').onclick=()=>{$('goal-catalog').hidden=true;$('habit-form').hidden=false;$('habit-form').reset();$('goal-error').hidden=true;chosenIcon='target';renderPicker();$('habit-name').focus();};
  $('back-catalog').onclick=()=>{$('habit-form').hidden=true;$('goal-catalog').hidden=false;$('goal-error').hidden=true;$('custom-goal').focus();};
  $('habit-form').onsubmit=e=>{e.preventDefault();addGoal($('habit-name').value,chosenIcon,state.goals.length%6);};
  function renderManaged(){
    const mount=$('managed-goals');mount.replaceChildren();
    if(!state.goals.length)mount.append(el('p','empty-goals','Je lijst is leeg. Voeg via de plusknop een doel toe.'));
    for(const h of state.goals){
      const row=el('div','managed-goal');paint(row,h);row.innerHTML=icon(h.icon);row.append(el('span','wash',h.name));
      const b=el('button','delete-goal');b.innerHTML=icon('trash');b.setAttribute('aria-label',h.name+' verwijderen');b.dataset.remove=h.id;
      b.onclick=()=>{
        if(!confirm('“'+h.name+'” verwijderen? Alle bijbehorende vinkjes verdwijnen ook uit eerdere dagen en je statistieken. Dit kun je niet ongedaan maken.'))return;
        $('manage-error').hidden=true;const position=state.goals.findIndex(g=>g.id===h.id);
        if(commit(S.removeGoal(state,h.id))){render();const buttons=$('managed-goals').querySelectorAll('button');(buttons[Math.min(position,buttons.length-1)]||$('close-manage')).focus();}
      };row.append(b);mount.append(row);
    }
  }
  $('manage-goals').onclick=()=>{$('manage-error').hidden=true;renderManaged();$('manage-dialog').showModal();};$('close-manage').onclick=()=>$('manage-dialog').close();
  $('export').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='ritme-backup-'+S.today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('import').onclick=()=>$('import-file').click();$('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const raw=await file.text(),next=S.importData(raw,state),isNew=[2,3].includes(JSON.parse(raw).version);const message=isNew?'Deze back-up herstelt je vinkjes, gewoontes en startdatum. Je huidige schrift wordt eerst in het back-uparchief bewaard. Herstellen?':'Deze oude back-up wordt aan je archief toegevoegd. Je huidige vinkjes blijven zoals ze zijn. Toevoegen?';if(confirm(message)&&commit(next)){selected=S.today();anchor=selected;render();toast(isNew?'Je schrift is hersteld.':'De oude back-up is veilig gearchiveerd.');}}catch(_){toast('Dit bestand kon niet worden hersteld. Kies een geldige Ritme-back-up.');}finally{e.target.value='';}};
  function refresh(){const day=S.today();if(day!==lastToday){if(selected===lastToday)selected=day;if(anchor===lastToday)anchor=day;lastToday=day;render();}}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});window.addEventListener('focus',refresh);setInterval(refresh,30000);
  window.addEventListener('storage',e=>{if(e.key===S.KEY&&e.newValue){try{state=S.validate(JSON.parse(e.newValue));render();}catch(_){toast('Een wijziging uit een ander tabblad kon niet worden geladen.');}}});
  render();
  if('serviceWorker' in navigator){let controlled=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlled)location.reload();controlled=true;});navigator.serviceWorker.register('./sw.js').catch(()=>toast('Offlinegebruik is nog niet beschikbaar. Open Ritme opnieuw zodra je verbinding hebt.'));}
})();
