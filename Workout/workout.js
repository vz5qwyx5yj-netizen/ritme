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
      sideCue:'Steun op je {kant}onderarm en de zijkant van je onderste voet. Houd je heupen omhoog, je lichaam recht en blijf ademen.',
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
      poseNote:'Voorbeeld van één kant. Wissel rustig tussen je rechterarm met linkerbeen en je linkerarm met rechterbeen.',
      cue:'Strek één arm en het tegenovergestelde been. Kom rustig terug en wissel van kant. Houd je heupen recht en je rug stil.',
      steps:['Begin op handen en knieën: handen onder je schouders, knieën onder je heupen. Span je buik licht aan.', 'Strek je rechterarm naar voren en je linkerbeen naar achteren, ongeveer tot romphoogte. Kijk naar de mat en houd je bekken recht.', 'Zet je hand en knie rustig terug. Wissel naar je linkerarm en rechterbeen. Blijf gedurende het werkblok rustig afwisselen.'],
      easier:'Beweeg eerst alleen één arm of één been. Houd de andere drie steunpunten op de mat.'
    },
    {
      id:'squat', name:'Squat', focus:'Benen · billen', seconds:30, still:true, image:'padel-squat',
      cue:'Zak rustig door je knieën met je heupen naar achteren. Houd je voeten plat en kom beheerst omhoog.',
      steps:['Sta met je voeten ongeveer op schouderbreedte, tenen iets naar buiten.', 'Buig je knieën en breng je heupen naar achteren. Laat je knieën met je tenen meebewegen.', 'Duw je voeten in de vloer en kom weer rechtop. Houd je borst open.'],
      easier:'Zak minder diep of raak met je billen kort een stevige stoel aan.'
    },
    {
      id:'reverse-lunge', name:'Reverse lunge', focus:'Benen · billen · balans', seconds:30, durationLabel:'30 sec per kant', still:true, image:'padel-reverse-lunge',
      cue:'Stap met één been naar achteren, zak rustig en duw jezelf via je voorste voet terug omhoog.',
      sideCue:'Je {kant}voet blijft voor. Stap met je andere voet naar achteren en zak rustig. Duw via je voorste voet terug omhoog.',
      poseNote:'De genoemde kant is het voorste been. Links en rechts krijgen elk een eigen beurt.',
      steps:['Sta rechtop met je voeten op heupbreedte. Houd het been van de genoemde kant voor.', 'Stap met je andere been naar achteren en buig beide knieën. Houd je voorste voet plat.', 'Duw jezelf via je voorste voet terug naar de beginpositie. Herhaal met hetzelfde been voor.'],
      easier:'Maak de stap en kniebuiging kleiner en steun met één hand tegen een muur.'
    },
    {
      id:'side-lunge', name:'Side lunge', focus:'Benen · binnenkant bovenbenen', seconds:30, durationLabel:'30 sec per kant', still:true, image:'padel-side-lunge',
      cue:'Stap opzij, buig het uitstappende been en breng je heupen naar achteren. Duw jezelf weer terug.',
      sideCue:'Stap opzij met je {kant}been. Buig die knie en houd het andere been lang. Duw jezelf via de uitstappende voet terug.',
      poseNote:'De genoemde kant is het been waarmee je opzij stapt. De timer wisselt van kant.',
      steps:['Begin rechtop met je voeten naast elkaar.', 'Stap ruim opzij naar de genoemde kant. Buig die knie, breng je heupen naar achteren en houd beide voeten op de vloer.', 'Duw jezelf terug naar het midden. Herhaal naar dezelfde kant tot de timer wisselt.'],
      easier:'Maak een kleinere zijwaartse stap en zak minder diep.'
    },
    {
      id:'calf-raise', name:'Single-leg calf raise', focus:'Kuiten · enkelstabiliteit', seconds:30, durationLabel:'30 sec per kant', still:true, image:'padel-calf-raise',
      cue:'Sta op één been en kom rustig op je tenen. Laat je hiel beheerst zakken. Gebruik een muur voor balans.',
      sideCue:'Sta op je {kant}been. Kom rustig op de bal van die voet en laat je hiel beheerst zakken. Houd licht steun aan de muur.',
      poseNote:'De genoemde kant is het been waarop je staat. Beide benen krijgen een eigen beurt.',
      steps:['Sta naast een muur en zet je vingertoppen ertegen voor balans.', 'Til één voet op. Duw via de bal van je standvoet je hiel omhoog; houd je enkel recht.', 'Laat je hiel langzaam zakken en herhaal. Wissel van standbeen als de timer dat aangeeft.'],
      easier:'Doe de beweging met beide voeten op de vloer.'
    },
    {
      id:'push-up', name:'Push-up', focus:'Borst · armen · core', seconds:30, still:true, image:'padel-push-up',
      cue:'Houd je lichaam recht. Buig je ellebogen schuin naar achteren, zak beheerst en duw jezelf weer omhoog.',
      steps:['Begin in een hoge plank met je handen iets breder dan je schouders.', 'Span je buik en billen aan. Buig je ellebogen en laat je borst richting de vloer zakken.', 'Duw de vloer weg en strek je armen. Houd je heupen in lijn met je schouders en hielen.'],
      easier:'Steun op je knieën of doe push-ups met je handen tegen een stevige muur.'
    },
    {
      id:'skater', name:'Skater jumps', focus:'Benen · balans · coördinatie', seconds:30, still:true, image:'padel-skater',
      cue:'Spring klein zijwaarts en land zacht op één been. Buig je knie en wissel van kant zodra je stabiel staat.',
      poseNote:'Het beeld toont één landing. Wissel gedurende het blok rustig links en rechts af.',
      steps:['Sta met licht gebogen knieën en voldoende vrije ruimte naast je.', 'Spring zijwaarts naar je andere been. Laat het vrije been achter je standbeen bewegen.', 'Land beheerst met een gebogen knie en spring terug zodra je balans hebt.'],
      easier:'Stap zijwaarts zonder te springen en zet je andere voet kort bij voor balans.'
    },
    {
      id:'hip-flexor', name:'Heupflexor stretch', focus:'Voorkant heup', seconds:30, durationLabel:'30 sec per kant', still:true, image:'padel-hip-flexor',
      cue:'Kniel op één knie, kantel je bekken licht achterover en schuif je heup rustig naar voren. Houd je romp recht.',
      sideCue:'Je {kant}knie rust achter op de mat. Zet je andere voet voor. Span je bil aan en schuif je heup rustig naar voren zonder je rug hol te trekken.',
      poseNote:'De genoemde kant is de heup van het achterste, knielende been.',
      steps:['Zet één knie op de mat en je andere voet voor je, met de voorste knie gebogen.', 'Span de bil van het achterste been licht aan en kantel je bekken iets achterover.', 'Schuif je heup een klein stukje naar voren. Houd een milde rek vast en blijf ademen.'],
      easier:'Leg een opgevouwen handdoek onder je knie en maak de beweging kleiner.'
    },
    {
      id:'adductor', name:'Adductor rock-back', focus:'Binnenkant bovenbeen · heup', seconds:30, durationLabel:'30 sec per kant', still:true, image:'padel-adductor',
      cue:'Steun op handen en één knie, strek het andere been opzij en beweeg je billen rustig naar achteren en terug.',
      sideCue:'Strek je {kant}been opzij met de voet op de vloer. Steun op je handen en andere knie. Beweeg je billen rustig naar achteren en weer terug.',
      poseNote:'De genoemde kant is het been dat opzij gestrekt ligt.',
      steps:['Begin op handen en knieën. Strek het been van de genoemde kant opzij.', 'Houd je rug lang en schuif je billen rustig naar achteren tot je milde rek voelt.', 'Kom beheerst terug en herhaal zonder te veren.'],
      easier:'Schuif minder ver naar achteren en houd de beweging klein.'
    },
    {
      id:'hip-9090', name:'90/90 heupstretch', focus:'Heupmobiliteit', seconds:30, still:true, image:'padel-hip-9090',
      cue:'Zit met beide knieën gebogen en draai ze rustig van links naar rechts. Gebruik je handen als steun.',
      poseNote:'Het beeld toont één kant. Beweeg tijdens dit blok rustig tussen beide kanten.',
      steps:['Zit op de mat met je knieën gebogen en je voeten iets breder uit elkaar.', 'Laat beide knieën naar één kant zakken, zodat je benen ongeveer rechte hoeken vormen. Houd de beweging comfortabel.', 'Draai via het midden naar de andere kant. Steun zo nodig met je handen achter je.'],
      easier:'Leun wat achterover op je handen en laat je knieën minder ver zakken.'
    },
    {
      id:'ankle', name:'Enkelmobiliteit', focus:'Enkel · onderbeen', seconds:30, durationLabel:'30 sec per kant', still:true, image:'padel-ankle',
      cue:'Breng je voorste knie rustig over je tenen naar voren. Houd de hele voet, inclusief je hiel, op de vloer.',
      sideCue:'Je {kant}voet staat voor en blijft helemaal op de vloer. Beweeg die knie rustig naar voren over je tenen en terug; je hiel blijft laag.',
      poseNote:'De genoemde kant is de enkel van de voorste voet.',
      steps:['Kniel op één knie met de voet van de genoemde kant voor je.', 'Beweeg je voorste knie rustig naar voren in de richting van je tenen. Houd je hiel op de grond.', 'Beweeg terug en herhaal zonder je voet naar binnen te laten kantelen.'],
      easier:'Maak de beweging kleiner en steun met je handen op je bovenbeen.'
    },
    {
      id:'calf-stretch', name:'Kuitstretch', focus:'Kuit', seconds:30, durationLabel:'30 sec per kant', still:true, image:'padel-calf-stretch',
      cue:'Zet één been gestrekt achter je. Houd de achterste hiel op de grond en leun rustig naar voren.',
      sideCue:'Zet je {kant}been gestrekt achter je met de hiel op de grond. Buig je voorste knie en leun rustig naar de muur.',
      poseNote:'De genoemde kant is het achterste been waarvan je de kuit rekt.',
      steps:['Steun met beide handen tegen een stevige muur. Zet het been van de genoemde kant achter je.', 'Houd de achterste knie gestrekt, de hiel laag en de tenen naar voren gericht.', 'Buig je voorste knie tot je milde rek voelt in de achterste kuit. Blijf rustig ademen.'],
      easier:'Zet je achterste voet iets dichter bij de muur.'
    },
    {
      id:'open-book', name:'Open book rotatie', focus:'Bovenrug · borst', seconds:30, durationLabel:'30 sec per kant', still:true, image:'padel-open-book',
      cue:'Lig op je zij met gebogen knieën op elkaar. Open je bovenste arm en draai je borst rustig mee; je knieën blijven liggen.',
      sideCue:'Open je {kant}arm vanuit zijligging; je andere zijde ligt op de mat. Draai je borst rustig open en terug, met je knieën op elkaar.',
      poseNote:'De genoemde kant is de bovenste arm die je opent. Steun je hoofd zo nodig op een handdoek.',
      steps:['Lig op je zij met beide knieën gebogen en op elkaar. Strek je armen voor je uit.', 'Beweeg je bovenste arm rustig naar achteren en draai je borst mee. Je knieën blijven samen op de mat.', 'Keer rustig terug. Herhaal binnen een comfortabele bewegingsruimte.'],
      easier:'Open je arm minder ver en ondersteun je hoofd met een opgevouwen handdoek.'
    },
    {
      id:'chest-stretch', name:'Schouder/borststretch', focus:'Borst · voorkant schouder', seconds:30, durationLabel:'30 sec per kant', still:true, image:'padel-chest-stretch',
      cue:'Plaats één onderarm tegen een muur en draai je lichaam rustig van die arm af. Houd je schouder ontspannen.',
      sideCue:'Zet je {kant}onderarm tegen de muur, elleboog rond schouderhoogte. Draai je lichaam rustig van die arm af tot je milde rek voelt.',
      poseNote:'De genoemde kant is de arm die tegen de muur steunt.',
      steps:['Ga naast een muur staan. Zet de onderarm van de genoemde kant tegen de muur, met gebogen elleboog.', 'Draai je romp een klein stukje van die arm af. Trek je schouder niet op.', 'Houd de milde rek vast en adem rustig door.'],
      easier:'Zet je elleboog wat lager en draai minder ver weg.'
    },
    {
      id:'lat-stretch', name:'Lat stretch', focus:'Zijkant rug · schouders', seconds:30, still:true, image:'padel-lat-stretch',
      cue:'Leg je handen op een stevige verhoging, schuif je heupen naar achteren en laat je borst rustig richting de grond zakken.',
      steps:['Leg beide handen op een stevige tafel of bank die niet verschuift.', 'Stap naar achteren en buig vanuit je heupen. Houd je armen lang en je knieën licht gebogen.', 'Laat je borst tussen je armen zakken zonder je onderrug hol te trekken. Houd een milde rek vast.'],
      easier:'Gebruik een hogere steun en laat je borst minder diep zakken.'
    }
  ];
  const bothSides=id=>[{id,side:'links'},{id,side:'rechts'}];
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
      equipment:'Wat je nodig hebt: een mat of een comfortabele, stroeve vloer. Tik op een oefening voor de houding en een lichtere variant.'},
    {id:'padel-strength', name:'Padel kracht', hero:'squat', description:'8 oefeningen · kracht en balans voor padel', padel:true, rest:20,
      headline:'STERK OP<br>DE <em>BAAN.</em>', subtitle:'Werk aan je kracht, balans en controle.', completeTitle:'Kracht voor de baan.',
      exercises:['squat','reverse-lunge','side-lunge','bridge','calf-raise','push-up','taps','skater'],
      blocks:[{id:'squat'},...bothSides('reverse-lunge'),...bothSides('side-lunge'),{id:'bridge'},...bothSides('calf-raise'),{id:'push-up'},{id:'taps'},{id:'skater'}],
      overrides:{bridge:{name:'Glute bridge',still:true,image:'padel-bridge'},taps:{still:true,image:'padel-taps',poseNote:'Het beeld toont één schoudertik. Tik tijdens het blok afwisselend je linker- en rechterschouder aan.'}},
      warmup:'Marcheer rustig, maak kleine zijstappen en draai je schouders en enkels los. Gebruik de pauzeknop als je meer voorbereiding nodig hebt.',
      note:'30 sec oefenen · 20 sec rust. Reverse lunge, side lunge en calf raise: een eigen beurt per kant. Shoulder taps en skater jumps: afwisselen.',
      equipment:'Wat je nodig hebt: een mat of stroeve vloer, een stevige muur voor steun en vrije ruimte om opzij te bewegen. Tik op een oefening voor uitleg en een lichtere variant.'},
    {id:'padel-stretch', name:'Padel stretch', hero:'hip-flexor', description:'8 oefeningen · soepel bewegen voor padel', padel:true, stretch:true, rest:10,
      headline:'SOEPEL OP<br>DE <em>BAAN.</em>', subtitle:'Een rustig moment voor je heupen, rug en schouders.', completeTitle:'Tijd voor soepel bewegen.',
      exercises:['hip-flexor','adductor','hip-9090','ankle','calf-stretch','open-book','chest-stretch','lat-stretch'],
      blocks:[...bothSides('hip-flexor'),...bothSides('adductor'),{id:'hip-9090'},...bothSides('ankle'),...bothSides('calf-stretch'),...bothSides('open-book'),...bothSides('chest-stretch'),{id:'lat-stretch'}],
      warmup:'Leg je mat klaar, marcheer rustig en beweeg je schouders en heupen los. Zoek tijdens het stretchen een milde rek en blijf rustig ademen.',
      cooldown:'Laat de rek rustig los. Kom ontspannen zitten of staan en adem rustig door.',
      note:'30 sec oefenen · 10 sec wisseltijd. Elke kant krijgt een eigen beurt, behalve bij 90/90 (afwisselen) en lat stretch (beide armen samen).',
      equipment:'Wat je nodig hebt: een mat, een stevige muur en een tafel of bank die niet verschuift. Houd de rek mild en beweeg zonder te veren.'}
  ];
  const byRoutine=id=>routines.find(routine=>routine.id===id);
  let root, selectedRounds=1, selectedRoutine='classic', session=null, timer=null, lastTick=0, lastPersist=0;
  let visible=true, animationOn=true, wakeLock=null, preview=null, exitDialog=null;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const byId=id=>exercises.find(ex=>ex.id===id);
  const exerciseFor=(id,routineId=session?.routine || selectedRoutine)=>({...byId(id),...byRoutine(routineId).overrides?.[id]});
  const time=seconds=>`${Math.floor(Math.max(0,seconds)/60)}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
  const duration=seconds=>seconds%60===0?`${seconds/60} minuten`:`${Math.floor(seconds/60)} min ${seconds%60} sec`;
  const dateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const sprite=(id,classes='')=>{
    const ex=exerciseFor(id);
    return `<div class="wk-sprite ${ex.still?'wk-still':classes}" style="background-image:url('assets/workout/${ex.image || (id==='taps'?'taps-front':id)}.png')" role="img" aria-label="Getekend voorbeeld: ${ex.name}"></div>`;
  };

  function plan(rounds,routineId=session?.routine || selectedRoutine){
    const routine=byRoutine(routineId);
    const stages=[{type:'warmup',seconds:rounds*30,name:'Maak je lichaam klaar',cue:routine.warmup || 'Marcheer rustig, draai je schouders en polsen los en span je buik een paar keer aan. Neem extra tijd met de pauzeknop als je nog niet warm bent.'}];
    for(let round=1;round<=rounds;round++){
      routine.blocks.forEach(block=>{
        const ex=exerciseFor(block.id,routineId);
        const name=ex.name+(block.side?' · '+block.side:'');
        const cue=block.side?ex.sideCue.replaceAll('{kant}',block.side==='links'?'linker':'rechter'):ex.cue;
        stages.push({type:'work',seconds:ex.seconds,exercise:ex.id,name,cue,round});
        stages.push({type:'rest',seconds:routine.rest ?? 50-ex.seconds,name:routine.stretch?'Rustig wisselen':'Even op adem komen',cue:routine.stretch?'Laat de rek los en neem rustig de houding voor het volgende onderdeel aan.':'Ontspan je armen, adem rustig door en maak je klaar voor het volgende onderdeel.',round});
      });
    }
    stages.push({type:'cooldown',seconds:rounds*20,name:'Rustig afronden',cue:routine.cooldown || 'Kom rustig staan of zitten. Ontspan je schouders en laat je ademhaling tot rust komen.'});
    return stages;
  }
  const totalSeconds=(rounds,routineId)=>plan(rounds,routineId).reduce((sum,stage)=>sum+stage.seconds,0);
  function current(){return plan(session.rounds)[session.index];}
  function elapsed(){return plan(session.rounds).slice(0,session.index).reduce((sum,stage)=>sum+stage.seconds,0)+session.elapsed;}
  function persist(){
    try{if(session)localStorage.setItem(STORAGE,JSON.stringify(session));else localStorage.removeItem(STORAGE);}catch(_){/* The timer remains usable when storage is unavailable. */}
    lastPersist=performance.now();
  }
  function restore(){
    try{
      const s=JSON.parse(localStorage.getItem(STORAGE));
      if(!s || typeof s.id!=='string' || s.id.length>100) return;
      const routine=s.routine===undefined?'classic':s.routine;
      if(!byRoutine(routine))return;
      // Legacy core sessions stored minutes; their stage order and durations stay identical.
      const rounds=s.rounds===undefined && !byRoutine(routine).padel && [5,10].includes(s.minutes)?s.minutes/5:s.rounds;
      if(![1,2].includes(rounds))return;
      const stages=plan(rounds,routine);
      if(!Number.isInteger(s.index) || s.index<0 || s.index>=stages.length || !Number.isFinite(s.elapsed) || s.elapsed<0 || s.elapsed>stages[s.index].seconds) return;
      if(!['running','paused','complete'].includes(s.status)) return;
      if(s.status==='complete' && (s.index!==stages.length-1 || s.elapsed!==stages[s.index].seconds || !/^\d{4}-\d{2}-\d{2}$/.test(s.date))) return;
      session={id:s.id,rounds,routine,index:s.index,elapsed:s.elapsed,status:s.status==='complete'?'complete':'paused',date:s.date};
      selectedRounds=rounds;selectedRoutine=routine;
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
      <div class="wk-topline">Jouw moment <span>Workout / ${routine.padel?'padel':'core'}</span></div>
      <div class="wk-hero">${sprite(routine.hero)}<div class="wk-stamp">${routine.name.toUpperCase()}</div><div class="wk-hero-copy"><h1>${routine.headline || 'STERK VANUIT<br>JE <em>CORE.</em>'}</h1><p>${routine.subtitle || 'Je eigen kracht. Een paar minuten voor jezelf.'}</p></div></div>
      <div class="wk-content">
        ${session?`<div class="wk-resume"><p>${session.status==='complete'?'Je vorige workout is afgerond.':`Je workout van ${duration(totalSeconds(session.rounds,session.routine))} staat op pauze.`}</p><button class="wk-primary" data-action="resume">${session.status==='complete'?'Bekijk je resultaat':'Verder met je workout'}</button><button class="wk-link" data-action="discard">${session.status==='complete'?'Nieuwe workout kiezen':'Workout beëindigen'}</button></div>`:''}
        <h2 class="wk-section-title">Kies je workout</h2>
        <div class="wk-routines" role="group" aria-label="Kies je workout">${routines.map(item=>`<button class="wk-routine" data-routine="${item.id}" aria-pressed="${item.id===selectedRoutine}"><strong>${item.name}</strong><span>${item.description}</span><i aria-hidden="true">${item.id===selectedRoutine?'✓':'+'}</i></button>`).join('')}</div>
        <h2 class="wk-section-title">${routine.padel?'Hoeveel rondes doe je?':'Hoeveel tijd heb je?'} <small>Op jouw tempo.</small></h2>
        <div class="wk-durations" role="group" aria-label="Duur van je workout">${[1,2].map(rounds=>{
          const seconds=totalSeconds(rounds,selectedRoutine);
          return `<button class="wk-duration ${routine.stretch?'wk-duration-exact':''}" data-rounds="${rounds}" ${routine.padel?'':`data-minutes="${rounds*5}"`} aria-pressed="${rounds===selectedRounds}"><span class="wk-choice-mark" aria-hidden="true">${rounds===selectedRounds?'✓':''}</span><b>${seconds%60===0?seconds/60:time(seconds)} <small>${seconds%60===0?'min':'min:sec'}</small></b><span>${rounds===1?'Eén ronde':'Twee rondes'}${routine.padel?'':rounds===1?' · korte krachtboost':' · extra uitdaging'}</span></button>`;
        }).join('')}</div>
        <p class="wk-plan-note">Inclusief ${selectedRounds*30} sec voorbereiding, ${selectedRounds===1?'1 ronde':'2 rondes'} en ${selectedRounds*20} sec rustig afronden.<br>${routine.note}</p>
        <h2 class="wk-section-title">Jouw oefeningen <small>Tik voor een voorbeeld</small></h2>
        <ol class="wk-exercises">${routine.exercises.map(id=>exerciseFor(id)).map((ex,i)=>`<li><button class="wk-exercise" data-preview="${ex.id}"><span class="wk-thumb">${sprite(ex.id)}</span><span class="wk-exercise-copy"><strong>${String(i+1).padStart(2,'0')} &nbsp;${ex.name}</strong><small>${ex.focus} · ${ex.durationLabel || ex.seconds+' sec'}</small></span><span class="wk-exercise-arrow" aria-hidden="true">▶</span></button></li>`).join('')}</ol>
        <p class="wk-equipment">${routine.equipment}</p>
      </div>
      ${!session?`<div class="wk-actionbar"><button class="wk-primary" data-action="start"><span class="wk-play" aria-hidden="true">▶</span>Start ${duration(totalSeconds(selectedRounds,selectedRoutine))}</button><p>${routine.stretch?'Rustig bewegen · milde rek':'Zonder gewichten · op jouw tempo'}</p></div>`:''}
    </div>`;
  }
  function sceneExercise(){
    const stages=plan(session.rounds),stage=current();
    if(stage.exercise)return stage.exercise;
    return stages.slice(session.index+1).find(s=>s.exercise)?.exercise || byRoutine(session.routine).hero;
  }
  function nextLabel(){
    const next=plan(session.rounds)[session.index+1];
    if(!next)return 'Klaar voor vandaag';
    if(next.type==='rest')return `${next.seconds} sec ${byRoutine(session.routine).stretch?'wisseltijd':'rust'}`;
    return next.name;
  }
  function renderPlayer(){
    if(session.status==='complete'){renderComplete();return;}
    const stage=current(),id=sceneExercise(),paused=session.status==='paused',routine=byRoutine(session.routine);
    const tag={work:`Ronde ${stage.round} van ${session.rounds}`,rest:routine.stretch?'Wisseltijd':'Rustmoment',warmup:'Voorbereiding',cooldown:'Goed gedaan'}[stage.type];
    const sceneLabel=stage.type==='work'?(exerciseFor(id).still?'VOORBEELDHOUDING':'BEWEGEND VOORBEELD'):stage.type==='cooldown'?'LAAT JE ADEMHALING ZAKKEN':'STRAKS · '+exerciseFor(id).name.toUpperCase();
    root.innerHTML=`<div class="wk ${paused?'wk-is-paused':''} ${stage.type==='rest'?'wk-rest':''}">
      <div class="wk-session-head"><div class="wk-session-meta"><span>${routine.name.toUpperCase()} / ${time(totalSeconds(session.rounds))}</span><span id="wk-total"></span></div><div class="wk-progress" role="progressbar" aria-label="Voortgang workout" aria-valuemin="0" aria-valuemax="100"><i id="wk-progress-fill"></i></div></div>
      <div class="wk-scene">${sprite(id,animationOn && stage.type!=='cooldown'?'wk-animate'+(!reducedMotion.matches?'':' wk-motion-requested'):'')}<span class="wk-scene-label">${sceneLabel}</span>${exerciseFor(id).still?'':`<button class="wk-scene-toggle" data-action="motion">${animationOn?'Ⅱ Voorbeeld stilzetten':'▶ Speel voorbeeld'}</button>`}</div>
      <div class="wk-player-body"><div class="wk-stage-tag" id="wk-stage-tag">${paused?'Gepauzeerd':tag}</div><h2>${stage.name}</h2>
        <div class="wk-timer-line"><div class="wk-clock" id="wk-clock" role="timer" aria-label="Resterende tijd in dit onderdeel"></div><div class="wk-clock-caption">${stage.type==='work'?(routine.stretch?'Milde rek.<br>Adem rustig door.':'Rustig en beheerst.<br>Kwaliteit vóór aantallen.'):stage.type==='rest'?(routine.stretch?'Neem rustig je<br>volgende houding aan.':'Even herstellen.<br>Adem rustig door.'):'Neem de tijd.<br>Vind je ritme.'}</div></div>
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
    root.querySelector('#wk-total').textContent=`${time(Math.ceil(totalSeconds(session.rounds)-elapsed()))} over`;
    const pct=Math.min(100,elapsed()/(totalSeconds(session.rounds))*100);
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
      if(session.index===plan(session.rounds).length-1){finish();return;}
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
    session={id:window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,rounds:selectedRounds,routine:selectedRoutine,index:0,elapsed:0,status:'paused'};
    animationOn=!reducedMotion.matches;run();focusHeading();window.scrollTo(0,0);
  }
  function pause(accountTime=true){
    if(!session || session.status!=='running')return;
    if(accountTime)tick();
    if(session.status!=='running')return;
    session.status='paused';stopInterval();persist();renderPlayer();
  }
  function finish(){
    session.index=plan(session.rounds).length-1;session.elapsed=current().seconds;session.status='complete';session.date=dateKey();
    stopInterval();persist();renderComplete();focusHeading();
  }
  function renderComplete(){
    const routine=byRoutine(session.routine);
    root.innerHTML=`<div class="wk wk-complete"><div class="wk-done-icon" aria-hidden="true">✓</div><div class="wk-eyebrow">Workout afgerond</div><h2>${routine.completeTitle || 'Goed voor je core.'}<br>Tijd voor jezelf.</h2><p>${routine.name} afgerond.</p><div class="wk-complete-stat">${totalSeconds(session.rounds)%60===0?totalSeconds(session.rounds)/60:time(totalSeconds(session.rounds))} <small>${totalSeconds(session.rounds)%60===0?'minuten':'min:sec'}</small></div><p>${session.rounds===2?'2 rondes':'1 ronde'} · ${routine.exercises.length} oefeningen · inclusief ${routine.stretch?'wisseltijd':'rust'}${session.routine==='stability'?'<br>Side plank aan beide kanten':''}</p><p>Je sportminuten kun je zelf invullen in Ritme.</p><button class="wk-primary" data-action="new">Nieuwe workout</button></div>`;
  }
  function showPreview(id){
    if(!byId(id))return;
    const ex=exerciseFor(id);
    const animate=!ex.still && !reducedMotion.matches;
    preview.innerHTML=`<div class="wk-dialog-head"><span>Zo doe je deze oefening</span><button class="wk-close" data-close aria-label="Voorbeeld sluiten">×</button></div><div class="wk-scene">${sprite(id,animate?'wk-animate':'')}${ex.still?'':`<button class="wk-scene-toggle" data-preview-motion>${animate?'Ⅱ Voorbeeld stilzetten':'▶ Speel voorbeeld'}</button>`}</div><div class="wk-dialog-copy"><h2 id="wk-preview-title">${ex.name}</h2><p>${ex.focus} · ${ex.durationLabel || ex.seconds+' seconden per ronde'}</p>${ex.poseNote?`<p>${ex.poseNote}</p>`:''}<ol>${ex.steps.map(step=>`<li>${step}</li>`).join('')}</ol><p class="wk-tip"><b>Een stapje lichter</b><br>${ex.easier}</p></div>`;
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
    if(button.dataset.routine && !session && byRoutine(button.dataset.routine)){selectedRoutine=button.dataset.routine;selectedRounds=1;renderMenu();root.querySelector(`[data-routine="${selectedRoutine}"]`).focus({preventScroll:true});return;}
    if(button.dataset.rounds && !session && [1,2].includes(Number(button.dataset.rounds))){selectedRounds=Number(button.dataset.rounds);renderMenu();root.querySelector(`[data-rounds="${selectedRounds}"]`).focus({preventScroll:true});return;}
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
