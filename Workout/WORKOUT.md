# Workout

Open de losse app **Workout**, of gebruik **Open Workout** op de Sport-kaart in Ritme. Kies **Core kracht** of **Core stabiliteit**, daarna 5 of 10 minuten. Tik op een oefening voor een getekend voorbeeld en uitleg.

## Inhoud

- **Core kracht:** hollow rocks, optrekken aan een vaste trap (voeten vrij), reverse crunches, handstand tegen de muur en plank shoulder taps. De uitleg bij de trap en handstand bevat voorwaarden voor de opstelling en een alternatief op de vloer.
- **Core stabiliteit:** plank op de onderarmen, side plank, The Bridge (glute bridge) en Bird Dogs. Side plank heeft afzonderlijke blokken voor links en rechts; bij Bird Dogs wissel je rustig de diagonale arm-beencombinatie af.

| Onderdeel | 5 minuten | 10 minuten |
| --- | --- | --- |
| Voorbereiding | 30 sec | 60 sec |
| Rondes | 1 × 250 sec | 2 × 250 sec |
| Rustig afronden | 20 sec | 40 sec |
| Totaal | 300 sec | 600 sec |

Beide workouts hebben vijf blokken van 50 seconden per ronde: 30 seconden oefenen + 20 seconden rust; bij de handstand is dat 20 + 30 seconden. Core stabiliteit heeft vier verschillende oefeningen en vijf blokken, omdat side plank aan beide kanten wordt gedaan. Pauzes verlengen de werkelijke sessieduur. Deze tijdsindeling is eigen app-inhoud.

De gekozen workout wordt bij de sessie opgeslagen. Een oude sessie zonder workoutkeuze blijft de oorspronkelijke Core kracht-volgorde gebruiken.

De timer pauzeert bij het verlaten van het scherm, appwissel en gedetecteerde slaapstand. Na herladen wordt de sessie gepauzeerd hersteld. De schermvergrendeling wordt waar ondersteund tijdens de workout uitgesteld. Na voltooiing toont de app de sessieduur. Sportminuten vul je zelf in Ritme in; Workout leest of schrijft geen trackerregistraties.

## Illustraties en beweging

Gemaakt met de ingebouwde **image_gen**-tool. De bewegende illustraties bevatten zes getekende frames in een raster van 3 × 2; CSS speelt die achter elkaar af. Dit zijn korte illustratielussen met zichtbare stappen tussen houdingen. Plank, side plank en handstand tonen een aangehouden houding met kleine verschillen. De animatie kan afzonderlijk worden stilgezet. Bij de systeemvoorkeur voor minder beweging is afspelen optioneel. Bird Dogs heeft een stilstaande voorbeeldhouding om de diagonale arm-beencombinatie duidelijk te tonen; de uitleg beschrijft hoe je van kant wisselt.

Alle gebruikte bestanden staan in [assets/workout](assets/workout):

- [hollow.png](assets/workout/hollow.png)
- [pullup.png](assets/workout/pullup.png)
- [crunch.png](assets/workout/crunch.png)
- [handstand.png](assets/workout/handstand.png)
- [taps-front.png](assets/workout/taps-front.png)
- [plank.png](assets/workout/plank.png)
- [side-plank.png](assets/workout/side-plank.png)
- [bridge.png](assets/workout/bridge.png)
- [bird-dog-pose.png](assets/workout/bird-dog-pose.png)
- [Volledige prompts](assets/workout/art-prompts.json)

De aangeleverde screenshots zijn alleen gebruikt als stijlreferentie. Reclame, tekst, interface en trainingsbeloften uit de screenshots zijn niet overgenomen.

Algemene bewegingsaanwijzingen geraadpleegd bij de [ACE-oefeningenbibliotheek](https://www.acefitness.org/resources/everyone/exercise-library/) en [CrossFit: The Handstand](https://www.crossfit.com/essentials/freestanding-handstand). Het korte schema is eigen app-inhoud.

De vier nieuwe varianten zijn gecontroleerd aan de hand van het [door de gebruiker aangeleverde filmpje van Tone and Tighten](https://www.youtube.com/shorts/QQYviTCnKWU), met aanvullende houdingscontrole bij ACE: [plank](https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/), [side plank](https://www.acefitness.org/resources/everyone/exercise-library/99/side-plank-modified/), [bridge](https://www.acefitness.org/resources/everyone/exercise-library/49/glute-bridge/) en [Bird Dog](https://www.acefitness.org/resources/everyone/exercise-library/14/bird-dog/). Het filmpje is een bewegingsreferentie; de sporter en tuin zijn nieuw getekend in de bestaande appstijl.

## Lokaal bekijken en testen

Vanuit deze map:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. Voor de regressietest: installeer het Python-pakket `playwright` en voer vanuit Gezondheid `python3 tests/gezondheid_browser.py` uit. De test start zelf een lokale server. De test gebruikt de lokaal geïnstalleerde Google Chrome op macOS.

De browsertest controleert beide volledige sessies, pauzeren, hervatten, navigeren, herstel na herladen, slaapstand, stoppen, ongewijzigde sportregistraties in Ritme, kleine/grote schermen, donkere modus, minder beweging en offline gebruik. Mobiele weergave is getest in Chrome-emulatie; er is geen fysieke iPhone-test uitgevoerd.

De serviceworker bewaart de code en alle negen illustraties lokaal voor offline gebruik. De app bevat geen externe afbeeldings- of videodiensten.
