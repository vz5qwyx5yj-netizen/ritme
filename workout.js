/* Local, offline workout player. No account or remote services required. */
(() => {
  'use strict';
  const STORAGE = 'ritme.workout.v1';
  const exercises = [
    {
      id:'hollow', name:'Hollow rocks', focus:'Diepe buikspieren', seconds:30,
      cue:'Span je buik aan, houd je onderrug rond en wieg klein heen en weer. Je armen en benen bewegen als één geheel.',
      steps:['Lig op je rug. Breng je schouders en gestrekte benen iets van de mat.', 'Houd je onderrug tegen de mat en je armen langs je oren.', 'Wieg rustig vanuit je hele lichaam; houd de beweging klein.'],
      easier:'Buig je knieën en houd de positie stil als je onderrug loskomt.'
    },
    {
      id:'pullup', name:'Optrekken aan de trap', focus:'Rug · armen · core', seconds:30,
      cue:'Span buik en billen aan. Trek beheerst op, zonder te zwaaien, en zak langzaam terug. Neem tussendoor rust als dat nodig is.',
      steps:['Gebruik alleen een vaste trede die je hele gewicht kan dragen, met voldoende grip en vrije ruimte onder de trap.', 'Pak de trede stevig vast, handen ongeveer op schouderbreedte. Houd je voeten vrij en je romp aangespannen.', 'Trek op zonder af te zetten of te zwaaien. Laat je gecontroleerd zakken; forceer geen extra herhaling.'],
      easier:'Geen geschikte trede of te zwaar? Doe dit werkblok een hoge plank op de vloer.'
    },
    {
      id:'crunch', name:'Reverse crunches', focus:'Buik · bekkencontrole', seconds:30,
      cue:'Breng je knieën naar je borst en rol je bekken een klein stukje van de mat. Laat je heupen rustig terugzakken.',
      steps:['Lig op je rug, armen naast je lichaam en knieën gebogen boven je heupen.', 'Adem uit en krul je bekken naar je ribben. Je schouders blijven op de mat.', 'Laat je bekken langzaam zakken. Gebruik je buikspieren, geen zwaai.'],
      easier:'Maak de beweging kleiner en houd je knieën gebogen.'
    },
    {
      id:'handstand', name:'Handstand tegen de muur', focus:'Core · schouders · balans', seconds:20,
      cue:'Duw de vloer weg, houd je armen gestrekt en span buik en billen aan. Je hielen steunen licht tegen de muur. Blijf ademen.',
      steps:['Kies een stevige, vrije muur en een stroeve vloer. Doe deze variant alleen als je al beheerst in en uit een handstand kunt komen.', 'Plaats je handen op schouderbreedte. Houd je armen gestrekt en je hielen licht tegen de muur.', 'Houd je ribben laag en buik en billen aangespannen. Kom gecontroleerd terug naar de vloer.'],
      easier:'Nog geen vertrouwde handstand? Houd een hoge plank op de vloer; handen onder je schouders en buik aangespannen.'
    },
    {
      id:'taps', name:'Plank shoulder taps', focus:'Core · stabiliteit', seconds:30,
      cue:'Zet je voeten wat breder. Tik om en om met één hand je andere schouder aan. Houd je heupen zo stil mogelijk.',
      steps:['Begin in een hoge plank, handen onder je schouders en voeten iets breder dan je heupen.', 'Verplaats je gewicht rustig naar één arm en tik met je vrije hand de tegenoverliggende schouder aan.', 'Zet je hand terug en wissel van kant. Houd je bekken recht.'],
      easier:'Zet je knieën op de mat of houd een hoge plank met beide handen aan de grond.'
    }
  ];
  let root, options, selected=5, session=null, timer=null, lastTick=0, lastPersist=0;
  let visible=false, animationOn=true, wakeLock=null, preview=null, exitDialog=null;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const byId=id=>exercises.find(ex=>ex.id===id);
  const time=seconds=>`${Math.floor(Math.max(0,seconds)/60)}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
  const dateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const sprite=(id,classes='')=>`<div class="wk-sprite ${classes}" style="background-image:url('assets/workout/${id==='taps'?'taps-front':id}.png')" role="img" aria-label="Getekend voorbeeld: ${byId(id).name}"></div>`;

  function plan(minutes){
    const rounds=minutes===10?2:1;
    const stages=[{type:'warmup',seconds:minutes===10?60:30,name:'Maak je lichaam klaar',cue:'Marcheer rustig, draai je schouders en polsen los en span je buik een paar keer aan. Neem extra tijd met de pauzeknop als je nog niet warm bent.'}];
    for(let round=1;round<=rounds;round++){
      exercises.forEach(ex=>{
        stages.push({type:'work',seconds:ex.seconds,exercise:ex.id,name:ex.name,cue:ex.cue,round});
        stages.push({type:'rest',seconds:50-ex.seconds,name:'Even op adem komen',cue:'Ontspan je armen, adem rustig door en maak je klaar voor het volgende onderdeel.',round});
      });
    }
    stages.push({type:'cooldown',seconds:minutes===10?40:20,name:'Rustig afronden',cue:'Kom rustig staan of zitten. Ontspan je schouders en laat je ademhaling tot rust komen.'});
    return stages;
  }
  function current(){return plan(session.minutes)[session.index];}
  function elapsed(){return plan(session.minutes).slice(0,session.index).reduce((sum,stage)=>sum+stage.seconds,0)+session.elapsed;}
  function persist(){
    try{if(session)localStorage.setItem(STORAGE,JSON.stringify(session));else localStorage.removeItem(STORAGE);}catch(_){/* The timer remains usable when storage is unavailable. */}
    lastPersist=performance.now();
  }
  function restore(){
    try{
      const s=JSON.parse(localStorage.getItem(STORAGE));
      if(!s || ![5,10].includes(s.minutes) || typeof s.id!=='string' || s.id.length>100) return;
      const stages=plan(s.minutes);
      if(!Number.isInteger(s.index) || s.index<0 || s.index>=stages.length || !Number.isFinite(s.elapsed) || s.elapsed<0 || s.elapsed>stages[s.index].seconds) return;
      if(!['running','paused','complete'].includes(s.status)) return;
      if(s.status==='complete' && (s.index!==stages.length-1 || s.elapsed!==stages[s.index].seconds || !/^\d{4}-\d{2}-\d{2}$/.test(s.date))) return;
      session={id:s.id,minutes:s.minutes,index:s.index,elapsed:s.elapsed,status:s.status==='complete'?'complete':'paused',date:s.date,logged:s.logged===true};
      selected=s.minutes;
    }catch(_){/* Ignore incomplete or old state. */}
  }
  async function keepAwake(){
    if(!navigator.wakeLock || wakeLock || document.hidden) return;
    try{
      const lock=await navigator.wakeLock.request('screen');
      if(!session || session.status!=='running'){await lock.release();return;}
      wakeLock=lock;
      lock.addEventListener('release',()=>{if(wakeLock===lock)wakeLock=null;});
    }catch(_){/* Screen lock is optional and may be unavailable in low power mode. */}
  }
  function releaseAwake(){if(wakeLock){wakeLock.release().catch(()=>{});wakeLock=null;}}
  function stopInterval(){clearInterval(timer);timer=null;releaseAwake();}
  function announce(message){const live=document.getElementById('wk-announcement');if(live)live.textContent=message;}
  function focusHeading(){const heading=root.querySelector('h1,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}

  function renderMenu(){
    root.innerHTML=`<div class="wk">
      <div class="wk-topline">Jouw moment <span>Ritme / workout</span></div>
      <div class="wk-hero">${sprite('hollow')}<div class="wk-stamp">CALISTHENICS · CORE</div><div class="wk-hero-copy"><h1>STERK VANUIT<br>JE <em>CORE.</em></h1><p>Je eigen kracht. Een paar minuten voor jezelf.</p></div></div>
      <div class="wk-content">
        ${session?`<div class="wk-resume"><p>${session.status==='complete'?'Je vorige workout is afgerond.':`Je workout van ${session.minutes} minuten staat op pauze.`}</p><button class="wk-primary" data-action="resume">${session.status==='complete'?'Bekijk je resultaat':'Verder met je workout'}</button><button class="wk-link" data-action="discard">${session.status==='complete'?'Nieuwe workout kiezen':'Workout beëindigen'}</button></div>`:''}
        <h2 class="wk-section-title">Hoeveel tijd heb je? <small>Elke minuut telt.</small></h2>
        <div class="wk-durations" role="group" aria-label="Duur van je workout">${[5,10].map(m=>`<button class="wk-duration" data-minutes="${m}" aria-pressed="${m===selected}"><span class="wk-choice-mark" aria-hidden="true">${m===selected?'✓':''}</span><b>${m} <small>min</small></b><span>${m===5?'Eén ronde · korte krachtboost':'Twee rondes · extra uitdaging'}</span></button>`).join('')}</div>
        <p class="wk-plan-note">Inclusief ${selected===5?'30':'60'} sec voorbereiding, ${selected===5?'1 ronde':'2 rondes'} en rustig afronden.<br>30 sec werken · 20 sec rust. Handstand: 20 sec werken · 30 sec rust.</p>
        <h2 class="wk-section-title">Jouw oefeningen <small>Tik voor een voorbeeld</small></h2>
        <ol class="wk-exercises">${exercises.map((ex,i)=>`<li><button class="wk-exercise" data-preview="${ex.id}"><span class="wk-thumb">${sprite(ex.id)}</span><span class="wk-exercise-copy"><strong>${String(i+1).padStart(2,'0')} &nbsp;${ex.name}</strong><small>${ex.focus} · ${ex.seconds} sec</small></span><span class="wk-exercise-arrow" aria-hidden="true">▶</span></button></li>`).join('')}</ol>
        <p class="wk-equipment">Wat je nodig hebt: een mat of stroeve vloer, een vrije muur en een vaste trap met een trede die geschikt is om aan te hangen. Bekijk de uitleg voor je begint.</p>
      </div>
      ${!session?`<div class="wk-actionbar"><button class="wk-primary" data-action="start"><span class="wk-play" aria-hidden="true">▶</span>Start ${selected} minuten</button><p>Zonder gewichten · op jouw tempo</p></div>`:''}
    </div>`;
  }
  function sceneExercise(){
    const stages=plan(session.minutes),stage=current();
    if(stage.exercise)return stage.exercise;
    return stages.slice(session.index+1).find(s=>s.exercise)?.exercise || 'hollow';
  }
  function nextLabel(){
    const next=plan(session.minutes)[session.index+1];
    if(!next)return 'Klaar voor vandaag';
    if(next.type==='rest')return `${next.seconds} sec rust`;
    return next.name;
  }
  function renderPlayer(){
    if(session.status==='complete'){renderComplete();return;}
    const stage=current(),id=sceneExercise(),paused=session.status==='paused';
    const tag={work:`Ronde ${stage.round} van ${session.minutes===10?2:1}`,rest:'Rustmoment',warmup:'Voorbereiding',cooldown:'Goed gedaan'}[stage.type];
    const sceneLabel=stage.type==='work'?'BEWEGEND VOORBEELD':stage.type==='cooldown'?'LAAT JE ADEMHALING ZAKKEN':'STRAKS · '+byId(id).name.toUpperCase();
    root.innerHTML=`<div class="wk ${paused?'wk-is-paused':''} ${stage.type==='rest'?'wk-rest':''}">
      <div class="wk-session-head"><div class="wk-session-meta"><span>CORE / ${session.minutes} MIN</span><span id="wk-total"></span></div><div class="wk-progress" role="progressbar" aria-label="Voortgang workout" aria-valuemin="0" aria-valuemax="100"><i id="wk-progress-fill"></i></div></div>
      <div class="wk-scene">${sprite(id,animationOn && stage.type!=='cooldown'?'wk-animate'+(!reducedMotion.matches?'':' wk-motion-requested'):'')}<span class="wk-scene-label">${sceneLabel}</span><button class="wk-scene-toggle" data-action="motion">${animationOn?'Ⅱ Voorbeeld stilzetten':'▶ Speel voorbeeld'}</button></div>
      <div class="wk-player-body"><div class="wk-stage-tag" id="wk-stage-tag">${paused?'Gepauzeerd':tag}</div><h2>${stage.name}</h2>
        <div class="wk-timer-line"><div class="wk-clock" id="wk-clock" role="timer" aria-label="Resterende tijd in dit onderdeel"></div><div class="wk-clock-caption">${stage.type==='work'?'Rustig en beheerst.<br>Kwaliteit vóór aantallen.':stage.type==='rest'?'Even herstellen.<br>Adem rustig door.':'Neem de tijd.<br>Vind je ritme.'}</div></div>
        <p class="wk-instruction">${stage.cue}</p>
        <div class="wk-controls"><button class="wk-primary" data-action="pause">${paused?'▶ Hervatten':'Ⅱ Pauzeren'}</button><button class="wk-secondary" data-action="stop">Stoppen</button></div>
        <div class="wk-next"><span>Hierna</span><strong>${nextLabel()}</strong></div>
        <p class="wk-player-hint">${stage.type==='work' && ['handstand','pullup'].includes(id)?'Te zwaar of geen geschikte plek? Houd een hoge plank op de vloer.':'Neem extra rust met de pauzeknop wanneer je dat nodig hebt.'}</p>
        <div id="wk-announcement" class="wk-sr-only" role="status" aria-live="polite"></div>
      </div>
    </div>`;
    updateClock();
  }
  function updateClock(){
    if(!session || session.status==='complete')return;
    const clock=root.querySelector('#wk-clock');if(!clock)return;
    const remaining=Math.ceil(Math.max(0,current().seconds-session.elapsed));
    clock.textContent=time(remaining);
    root.querySelector('#wk-total').textContent=`${time(Math.ceil(session.minutes*60-elapsed()))} over`;
    const pct=Math.min(100,elapsed()/(session.minutes*60)*100);
    root.querySelector('#wk-progress-fill').style.width=pct+'%';
    root.querySelector('[role=progressbar]').setAttribute('aria-valuenow',String(Math.round(pct)));
  }
  function tick(){
    if(!session || session.status!=='running')return;
    const now=performance.now(),delta=(now-lastTick)/1000;lastTick=now;
    // A suspended device must not silently complete the workout in the background.
    if(delta>2.5){pause(false);announce('Workout gepauzeerd. Tik op Hervatten om verder te gaan.');return;}
    session.elapsed+=Math.max(0,delta);
    let changed=false;
    while(session.elapsed+0.000001>=current().seconds){
      if(session.index===plan(session.minutes).length-1){finish();return;}
      session.elapsed=Math.max(0,session.elapsed-current().seconds);session.index++;changed=true;
    }
    if(changed){persist();renderPlayer();announce(current().name);}
    else updateClock();
    if(now-lastPersist>5000)persist();
  }
  function run(){
    if(!session || session.status==='complete')return;
    stopInterval();session.status='running';lastTick=performance.now();persist();renderPlayer();
    timer=setInterval(tick,100);keepAwake();
  }
  function start(){
    if(session)return;
    session={id:window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,minutes:selected,index:0,elapsed:0,status:'paused',logged:false};
    animationOn=!reducedMotion.matches;run();focusHeading();window.scrollTo(0,0);
  }
  function pause(accountTime=true){
    if(!session || session.status!=='running')return;
    if(accountTime)tick();
    if(session.status!=='running')return;
    session.status='paused';stopInterval();persist();renderPlayer();
  }
  function finish(){
    session.index=plan(session.minutes).length-1;session.elapsed=current().seconds;session.status='complete';session.date=dateKey();
    stopInterval();persist();renderComplete();focusHeading();
  }
  function renderComplete(){
    root.innerHTML=`<div class="wk wk-complete"><div class="wk-done-icon" aria-hidden="true">✓</div><div class="wk-eyebrow">Workout afgerond</div><h2>Goed voor je core.<br>Goed voor je ritme.</h2><p>Je hebt tijd gemaakt voor jezelf.<br>Dat mag je meenemen in je dag.</p><div class="wk-complete-stat">${session.minutes} <small>minuten</small></div><p>${session.minutes===10?'2 rondes':'1 ronde'} · 5 oefeningen · inclusief rust</p><button class="wk-primary" data-action="log" ${session.logged?'disabled':''}>${session.logged?'✓ Toegevoegd aan je sportminuten':`Voeg ${session.minutes} min toe aan Sport`}</button><p id="wk-save-message" role="status">${session.logged?'Je workout is opgeslagen.':'Wordt toegevoegd aan de dag waarop je deze workout afrondde.'}</p><button class="wk-secondary" data-action="home">Terug naar vandaag</button><button class="wk-link" data-action="new">Nieuwe workout</button></div>`;
  }
  function showPreview(id){
    const ex=byId(id);if(!ex)return;
    const animate=!reducedMotion.matches;
    preview.innerHTML=`<div class="wk-dialog-head"><span>Zo doe je deze oefening</span><button class="wk-close" data-close aria-label="Voorbeeld sluiten">×</button></div><div class="wk-scene">${sprite(id,animate?'wk-animate':'')}<button class="wk-scene-toggle" data-preview-motion>${animate?'Ⅱ Voorbeeld stilzetten':'▶ Speel voorbeeld'}</button></div><div class="wk-dialog-copy"><h2 id="wk-preview-title">${ex.name}</h2><p>${ex.focus} · ${ex.seconds} seconden per ronde</p><ol>${ex.steps.map(step=>`<li>${step}</li>`).join('')}</ol><p class="wk-tip"><b>Een stapje lichter</b><br>${ex.easier}</p></div>`;
    preview.showModal();preview.scrollTop=0;
  }
  function confirmStop(){
    if(!session)return;
    pause();
    exitDialog.innerHTML=`<div class="wk-dialog-copy"><h2 id="wk-stop-title">Workout stoppen?</h2><p>Je timer staat op pauze. Als je stopt, worden er geen sportminuten toegevoegd.</p><button class="wk-primary" data-continue>Verder met mijn workout</button><button class="wk-secondary" data-stop-confirm>Ja, stoppen</button></div>`;
    exitDialog.showModal();
  }
  function discard(){stopInterval();session=null;persist();renderMenu();focusHeading();}
  function toggleAnimation(){
    animationOn=!animationOn;
    const image=root.querySelector('.wk-scene .wk-sprite');
    image.classList.toggle('wk-animate',animationOn);image.classList.toggle('wk-motion-requested',animationOn);
    root.querySelector('[data-action=motion]').textContent=animationOn?'Ⅱ Voorbeeld stilzetten':'▶ Speel voorbeeld';
  }
  async function log(){
    if(!session || session.status!=='complete' || session.logged)return;
    const button=root.querySelector('[data-action=log]');button.disabled=true;
    try{await options.onLog({id:session.id,minutes:session.minutes,date:session.date});session.logged=true;persist();renderComplete();}
    catch(_){button.disabled=false;const message=root.querySelector('#wk-save-message');message.className='wk-error';message.textContent='Opslaan lukt niet. Maak ruimte vrij op je apparaat en probeer opnieuw.';}
  }
  function handleClick(event){
    const button=event.target.closest('button');if(!button || button.disabled)return;
    if(button.dataset.minutes){selected=Number(button.dataset.minutes);renderMenu();root.querySelector(`[data-minutes="${selected}"]`).focus({preventScroll:true});return;}
    if(button.dataset.preview){showPreview(button.dataset.preview);return;}
    switch(button.dataset.action){
      case 'start':start();break;
      case 'pause':session.status==='running'?pause():run();root.querySelector('[data-action=pause]')?.focus({preventScroll:true});break;
      case 'stop':confirmStop();break;
      case 'resume':session.status==='complete'?renderComplete():renderPlayer();focusHeading();window.scrollTo(0,0);break;
      case 'discard':session.status==='complete'?discard():confirmStop();break;
      case 'motion':toggleAnimation();break;
      case 'log':log();break;
      case 'home':options.onHome();break;
      case 'new':discard();break;
    }
  }
  window.RitmeWorkout={
    init(config){
      options=config;root=document.getElementById('workout-root');restore();renderMenu();root.addEventListener('click',handleClick);
      preview=document.createElement('dialog');preview.className='wk-dialog';preview.setAttribute('aria-labelledby','wk-preview-title');document.body.appendChild(preview);
      preview.addEventListener('click',event=>{
        if(event.target.closest('[data-close]'))preview.close();
        const control=event.target.closest('[data-preview-motion]');
        if(control){const image=preview.querySelector('.wk-sprite');const playing=image.classList.toggle('wk-animate');image.classList.toggle('wk-motion-requested',playing);control.textContent=playing?'Ⅱ Voorbeeld stilzetten':'▶ Speel voorbeeld';}
      });
      preview.addEventListener('close',()=>{preview.querySelector('.wk-sprite')?.classList.remove('wk-animate');});
      exitDialog=document.createElement('dialog');exitDialog.className='wk-dialog';exitDialog.setAttribute('aria-labelledby','wk-stop-title');document.body.appendChild(exitDialog);
      exitDialog.addEventListener('click',event=>{
        if(event.target.closest('[data-continue]')){exitDialog.close();run();}
        if(event.target.closest('[data-stop-confirm]')){exitDialog.close();discard();}
      });
      document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
      window.addEventListener('pagehide',()=>pause());
    },
    setVisible(value){
      visible=value;
      if(!visible){pause();return;}
      if(session?.status==='complete')renderComplete();
      else if(session)renderPlayer();
      else renderMenu();
    }
  };
})();
