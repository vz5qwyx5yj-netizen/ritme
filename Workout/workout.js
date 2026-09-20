/* Local, offline workout player. No account or remote services required. */
(() => {
  'use strict';
  const STORAGE = 'workout.session.v1';
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
    },
    {
      id:'plank', name:'Plank', focus:'Buik · rompstabiliteit', seconds:30,
      cue:'Steun op je onderarmen en tenen. Houd je lichaam in één lijn, span je buik en billen aan en blijf rustig ademen.',
      steps:['Zet je ellebogen onder je schouders en leg je onderarmen op de mat.', 'Strek je benen en steun op je tenen. Houd je hoofd, rug en heupen in één lijn.', 'Houd deze positie vast zonder je heupen te laten zakken of omhoog te duwen. Blijf doorademen.'],
      easier:'Laat je knieën op de mat rusten en houd je romp recht.'
    },
    {
      id:'side-plank', name:'Side plank', focus:'Schuine buikspieren · stabiliteit', seconds:30, durationLabel:'30 sec per kant',
      cue:'Steun op één onderarm en de zijkant van je onderste voet. Houd je heupen omhoog en je schouders boven elkaar.',
      steps:['Ga op je zij liggen. Zet je onderste elleboog onder je schouder en leg je onderarm op de mat.', 'Strek je benen, leg je voeten op elkaar en til je heupen op. Houd je schouders, heupen en enkels in één lijn.', 'Leg je bovenste hand op je heup en blijf ademen. De timer geeft links en rechts elk een eigen beurt.'],
      easier:'Buig je knieën en steun op je onderste knie en onderarm. Houd je schouder, heup en knie in één lijn.'
    },
    {
      id:'bridge', name:'The Bridge', focus:'Billen · heupen · core', seconds:30,
      cue:'Duw je voeten in de mat en til je bekken rustig op. Span je billen aan en laat je heupen beheerst zakken.',
      steps:['Lig op je rug met gebogen knieën en je voeten plat op de mat, op heupbreedte. Leg je armen naast je lichaam.', 'Span je buik en billen aan en til je heupen op tot je schouders, heupen en knieën in één lijn zijn. Je hoofd en schouders blijven liggen.', 'Laat je bekken rustig zakken en herhaal. Til niet zo hoog dat je onderrug hol trekt.'],
      easier:'Til je heupen een kleiner stukje op en laat ze tussendoor rustig op de mat rusten.'
    },
    {
      id:'bird-dog', name:'Bird Dogs', focus:'Core · rug · coördinatie', seconds:30, image:'bird-dog-pose', still:true,
      cue:'Strek één arm en het tegenovergestelde been. Kom rustig terug en wissel van kant. Houd je heupen recht en je rug stil.',
      steps:['Begin op handen en knieën: handen onder je schouders, knieën onder je heupen. Span je buik licht aan.', 'Strek je rechterarm naar voren en je linkerbeen naar achteren, ongeveer tot romphoogte. Kijk naar de mat en houd je bekken recht.', 'Zet je hand en knie rustig terug. Wissel naar je linkerarm en rechterbeen. Blijf gedurende het werkblok rustig afwisselen.'],
      easier:'Beweeg eerst alleen één arm of één been. Houd de andere drie steunpunten op de mat.'
    }
  ];
  const routines = [
    {id:'classic', name:'Core kracht', hero:'hollow', description:'Je vertrouwde 5 oefeningen',
      exercises:['hollow','pullup','crunch','handstand','taps'],
      blocks:[{id:'hollow'},{id:'pullup'},{id:'crunch'},{id:'handstand'},{id:'taps'}],
      note:'30 sec werken · 20 sec rust. Handstand: 20 sec werken · 30 sec rust.',
      equipment:'Wat je nodig hebt: een mat of stroeve vloer, een vrije muur en een vaste trap met een trede die geschikt is om aan te hangen. Bekijk de uitleg voor je begint.'},
    {id:'stability', name:'Core stabiliteit', hero:'plank', description:'Nieuw · plank, side plank, bridge & bird dogs',
      exercises:['plank','side-plank','bridge','bird-dog'],
      blocks:[{id:'plank'},{id:'side-plank',side:'links'},{id:'side-plank',side:'rechts'},{id:'bridge'},{id:'bird-dog'}],
      note:'30 sec oefenen · 20 sec rust. Side plank: een eigen beurt voor links en rechts. Bird Dogs: rustig afwisselen.',
      equipment:'Wat je nodig hebt: een mat of een comfortabele, stroeve vloer. Tik op een oefening voor de houding en een lichtere variant.'}
  ];
  const byRoutine=id=>routines.find(routine=>routine.id===id);
  let root, selected=5, selectedRoutine='classic', session=null, timer=null, lastTick=0, lastPersist=0;
  let visible=true, animationOn=true, wakeLock=null, preview=null, exitDialog=null;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const byId=id=>exercises.find(ex=>ex.id===id);
  const time=seconds=>`${Math.floor(Math.max(0,seconds)/60)}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
  const dateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const sprite=(id,classes='')=>{
    const ex=byId(id);
    return `<div class="wk-sprite ${ex.still?'wk-still':classes}" style="background-image:url('assets/workout/${ex.image || (id==='taps'?'taps-front':id)}.png')" role="img" aria-label="Getekend voorbeeld: ${ex.name}"></div>`;
  };

  function plan(minutes,routineId=session?.routine || selectedRoutine){
    const rounds=minutes===10?2:1;
    const stages=[{type:'warmup',seconds:minutes===10?60:30,name:'Maak je lichaam klaar',cue:'Marcheer rustig, draai je schouders en polsen los en span je buik een paar keer aan. Neem extra tijd met de pauzeknop als je nog niet warm bent.'}];
    for(let round=1;round<=rounds;round++){
      byRoutine(routineId).blocks.forEach(block=>{
        const ex=byId(block.id);
        const name=ex.name+(block.side?' · '+block.side:'');
        const cue=block.side?`Steun op je ${block.side==='links'?'linker':'rechter'}onderarm en de zijkant van je onderste voet. Houd je heupen omhoog, je lichaam recht en blijf ademen.`:ex.cue;
        stages.push({type:'work',seconds:ex.seconds,exercise:ex.id,name,cue,round});
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
      const routine=s.routine===undefined?'classic':s.routine;
      if(!byRoutine(routine))return;
      const stages=plan(s.minutes,routine);
      if(!Number.isInteger(s.index) || s.index<0 || s.index>=stages.length || !Number.isFinite(s.elapsed) || s.elapsed<0 || s.elapsed>stages[s.index].seconds) return;
      if(!['running','paused','complete'].includes(s.status)) return;
      if(s.status==='complete' && (s.index!==stages.length-1 || s.elapsed!==stages[s.index].seconds || !/^\d{4}-\d{2}-\d{2}$/.test(s.date))) return;
      session={id:s.id,minutes:s.minutes,routine,index:s.index,elapsed:s.elapsed,status:s.status==='complete'?'complete':'paused',date:s.date};
      selected=s.minutes;selectedRoutine=routine;
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
    const routine=byRoutine(selectedRoutine);
    root.innerHTML=`<div class="wk">
      <div class="wk-topline">Jouw moment <span>Workout / core</span></div>
      <div class="wk-hero">${sprite(routine.hero)}<div class="wk-stamp">${routine.name.toUpperCase()}</div><div class="wk-hero-copy"><h1>STERK VANUIT<br>JE <em>CORE.</em></h1><p>Je eigen kracht. Een paar minuten voor jezelf.</p></div></div>
      <div class="wk-content">
        ${session?`<div class="wk-resume"><p>${session.status==='complete'?'Je vorige workout is afgerond.':`Je workout van ${session.minutes} minuten staat op pauze.`}</p><button class="wk-primary" data-action="resume">${session.status==='complete'?'Bekijk je resultaat':'Verder met je workout'}</button><button class="wk-link" data-action="discard">${session.status==='complete'?'Nieuwe workout kiezen':'Workout beëindigen'}</button></div>`:''}
        <h2 class="wk-section-title">Kies je workout</h2>
        <div class="wk-routines" role="group" aria-label="Kies je workout">${routines.map(item=>`<button class="wk-routine" data-routine="${item.id}" aria-pressed="${item.id===selectedRoutine}"><strong>${item.name}</strong><span>${item.description}</span><i aria-hidden="true">${item.id===selectedRoutine?'✓':'+'}</i></button>`).join('')}</div>
        <h2 class="wk-section-title">Hoeveel tijd heb je? <small>Elke minuut telt.</small></h2>
        <div class="wk-durations" role="group" aria-label="Duur van je workout">${[5,10].map(m=>`<button class="wk-duration" data-minutes="${m}" aria-pressed="${m===selected}"><span class="wk-choice-mark" aria-hidden="true">${m===selected?'✓':''}</span><b>${m} <small>min</small></b><span>${m===5?'Eén ronde · korte krachtboost':'Twee rondes · extra uitdaging'}</span></button>`).join('')}</div>
        <p class="wk-plan-note">Inclusief ${selected===5?'30':'60'} sec voorbereiding, ${selected===5?'1 ronde':'2 rondes'} en rustig afronden.<br>${routine.note}</p>
        <h2 class="wk-section-title">Jouw oefeningen <small>Tik voor een voorbeeld</small></h2>
        <ol class="wk-exercises">${routine.exercises.map(byId).map((ex,i)=>`<li><button class="wk-exercise" data-preview="${ex.id}"><span class="wk-thumb">${sprite(ex.id)}</span><span class="wk-exercise-copy"><strong>${String(i+1).padStart(2,'0')} &nbsp;${ex.name}</strong><small>${ex.focus} · ${ex.durationLabel || ex.seconds+' sec'}</small></span><span class="wk-exercise-arrow" aria-hidden="true">▶</span></button></li>`).join('')}</ol>
        <p class="wk-equipment">${routine.equipment}</p>
      </div>
      ${!session?`<div class="wk-actionbar"><button class="wk-primary" data-action="start"><span class="wk-play" aria-hidden="true">▶</span>Start ${selected} minuten</button><p>Zonder gewichten · op jouw tempo</p></div>`:''}
    </div>`;
  }
  function sceneExercise(){
    const stages=plan(session.minutes),stage=current();
    if(stage.exercise)return stage.exercise;
    return stages.slice(session.index+1).find(s=>s.exercise)?.exercise || byRoutine(session.routine).hero;
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
    const sceneLabel=stage.type==='work'?(byId(id).still?'VOORBEELDHOUDING':'BEWEGEND VOORBEELD'):stage.type==='cooldown'?'LAAT JE ADEMHALING ZAKKEN':'STRAKS · '+byId(id).name.toUpperCase();
    root.innerHTML=`<div class="wk ${paused?'wk-is-paused':''} ${stage.type==='rest'?'wk-rest':''}">
      <div class="wk-session-head"><div class="wk-session-meta"><span>${byRoutine(session.routine).name.toUpperCase()} / ${session.minutes} MIN</span><span id="wk-total"></span></div><div class="wk-progress" role="progressbar" aria-label="Voortgang workout" aria-valuemin="0" aria-valuemax="100"><i id="wk-progress-fill"></i></div></div>
      <div class="wk-scene">${sprite(id,animationOn && stage.type!=='cooldown'?'wk-animate'+(!reducedMotion.matches?'':' wk-motion-requested'):'')}<span class="wk-scene-label">${sceneLabel}</span>${byId(id).still?'':`<button class="wk-scene-toggle" data-action="motion">${animationOn?'Ⅱ Voorbeeld stilzetten':'▶ Speel voorbeeld'}</button>`}</div>
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
    session={id:window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,minutes:selected,routine:selectedRoutine,index:0,elapsed:0,status:'paused'};
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
    const routine=byRoutine(session.routine);
    root.innerHTML=`<div class="wk wk-complete"><div class="wk-done-icon" aria-hidden="true">✓</div><div class="wk-eyebrow">Workout afgerond</div><h2>Goed voor je core.<br>Tijd voor jezelf.</h2><p>${routine.name} afgerond.</p><div class="wk-complete-stat">${session.minutes} <small>minuten</small></div><p>${session.minutes===10?'2 rondes':'1 ronde'} · ${routine.exercises.length} oefeningen · inclusief rust${session.routine==='stability'?'<br>Side plank aan beide kanten':''}</p><p>Je sportminuten kun je zelf invullen in Ritme.</p><button class="wk-primary" data-action="new">Nieuwe workout</button></div>`;
  }
  function showPreview(id){
    const ex=byId(id);if(!ex)return;
    const animate=!ex.still && !reducedMotion.matches;
    preview.innerHTML=`<div class="wk-dialog-head"><span>Zo doe je deze oefening</span><button class="wk-close" data-close aria-label="Voorbeeld sluiten">×</button></div><div class="wk-scene">${sprite(id,animate?'wk-animate':'')}${ex.still?'':`<button class="wk-scene-toggle" data-preview-motion>${animate?'Ⅱ Voorbeeld stilzetten':'▶ Speel voorbeeld'}</button>`}</div><div class="wk-dialog-copy"><h2 id="wk-preview-title">${ex.name}</h2><p>${ex.focus} · ${ex.durationLabel || ex.seconds+' seconden per ronde'}</p>${ex.still?'<p>Voorbeeld van één kant. Wissel rustig tussen je rechterarm met linkerbeen en je linkerarm met rechterbeen.</p>':''}<ol>${ex.steps.map(step=>`<li>${step}</li>`).join('')}</ol><p class="wk-tip"><b>Een stapje lichter</b><br>${ex.easier}</p></div>`;
    preview.showModal();preview.scrollTop=0;
  }
  function confirmStop(){
    if(!session)return;
    pause();
    exitDialog.innerHTML=`<div class="wk-dialog-copy"><h2 id="wk-stop-title">Workout stoppen?</h2><p>Je timer staat op pauze. Als je stopt, vervalt deze sessie.</p><button class="wk-primary" data-continue>Verder met mijn workout</button><button class="wk-secondary" data-stop-confirm>Ja, stoppen</button></div>`;
    exitDialog.showModal();
  }
  function discard(){stopInterval();session=null;persist();renderMenu();focusHeading();}
  function toggleAnimation(){
    animationOn=!animationOn;
    const image=root.querySelector('.wk-scene .wk-sprite');
    image.classList.toggle('wk-animate',animationOn);image.classList.toggle('wk-motion-requested',animationOn);
    root.querySelector('[data-action=motion]').textContent=animationOn?'Ⅱ Voorbeeld stilzetten':'▶ Speel voorbeeld';
  }
  function handleClick(event){
    const button=event.target.closest('button');if(!button || button.disabled)return;
    if(button.dataset.routine && !session && byRoutine(button.dataset.routine)){selectedRoutine=button.dataset.routine;renderMenu();root.querySelector(`[data-routine="${selectedRoutine}"]`).focus({preventScroll:true});return;}
    if(button.dataset.minutes && !session){selected=Number(button.dataset.minutes);renderMenu();root.querySelector(`[data-minutes="${selected}"]`).focus({preventScroll:true});return;}
    if(button.dataset.preview){showPreview(button.dataset.preview);return;}
    switch(button.dataset.action){
      case 'start':start();break;
      case 'pause':session.status==='running'?pause():run();root.querySelector('[data-action=pause]')?.focus({preventScroll:true});break;
      case 'stop':confirmStop();break;
      case 'resume':session.status==='complete'?renderComplete():renderPlayer();focusHeading();window.scrollTo(0,0);break;
      case 'discard':session.status==='complete'?discard():confirmStop();break;
      case 'motion':toggleAnimation();break;
      case 'new':discard();break;
    }
  }
  window.Workout={
    init(){
      root=document.getElementById('workout-root');restore();renderMenu();root.addEventListener('click',handleClick);
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
      window.addEventListener('pageshow',()=>{if(session?.status==='complete')renderComplete();else if(session)renderPlayer();});
      if(session?.status==='complete')renderComplete();else if(session)renderPlayer();
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
