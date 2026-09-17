# Core workouts in Ritme

Open **Workout** in de onderste navigatie of **Core workout** op de Sport-kaart. Kies 5 of 10 minuten. Tik op een oefening voor een bewegend voorbeeld en uitleg.

## Inhoud

Hollow rocks, optrekken aan een vaste trap (voeten vrij), reverse crunches, handstand tegen de muur en plank shoulder taps. De uitleg bij de trap en handstand bevat voorwaarden voor de opstelling en een alternatief op de vloer.

| Onderdeel | 5 minuten | 10 minuten |
| --- | --- | --- |
| Voorbereiding | 30 sec | 60 sec |
| Rondes | 1 × 250 sec | 2 × 250 sec |
| Rustig afronden | 20 sec | 40 sec |
| Totaal | 300 sec | 600 sec |

Een ronde heeft vijf blokken van 50 seconden: 30 seconden oefenen + 20 seconden rust; bij de handstand is dat 20 + 30 seconden. Pauzes verlengen de werkelijke sessieduur.

De timer pauzeert bij het verlaten van het scherm, appwissel en gedetecteerde slaapstand. Na herladen wordt de sessie gepauzeerd hersteld. De schermvergrendeling wordt waar ondersteund tijdens de workout uitgesteld. Na voltooiing kan de gebruiker eenmaal de volledige sessieduur, inclusief rust, toevoegen aan Sport op de voltooiingsdatum. Bestaande sportminuten blijven behouden. De bestaande daglimiet van 300 sportminuten blijft van toepassing.

## Illustraties en beweging

Gemaakt met de ingebouwde **image_gen**-tool. Elke illustratie bevat zes getekende frames in een raster van 3 × 2; CSS speelt die achter elkaar af. Dit zijn korte illustratielussen met zichtbare stappen tussen houdingen. De handstand toont kleine houdingsverschillen tijdens het vasthouden. De animatie kan afzonderlijk worden stilgezet. Bij de systeemvoorkeur voor minder beweging is afspelen optioneel.

Alle gebruikte bestanden staan in [assets/workout](assets/workout):

- [hollow.png](assets/workout/hollow.png)
- [pullup.png](assets/workout/pullup.png)
- [crunch.png](assets/workout/crunch.png)
- [handstand.png](assets/workout/handstand.png)
- [taps-front.png](assets/workout/taps-front.png)
- [Volledige prompts](assets/workout/art-prompts.json)

De aangeleverde screenshots zijn alleen gebruikt als stijlreferentie. Reclame, tekst, interface en trainingsbeloften uit de screenshots zijn niet overgenomen.

Algemene bewegingsaanwijzingen geraadpleegd bij de [ACE-oefeningenbibliotheek](https://www.acefitness.org/resources/everyone/exercise-library/) en [CrossFit: The Handstand](https://www.crossfit.com/essentials/freestanding-handstand). Het korte Ritme-schema is eigen app-inhoud.

## Lokaal bekijken en testen

Vanuit deze map:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. Voor de regressietest: installeer het Python-pakket `playwright`, start de lokale server en voer `python3 tests/workout_browser.py` uit. De test gebruikt de lokaal geïnstalleerde Google Chrome op macOS.

De browsertest controleert beide volledige sessies, pauzeren, hervatten, navigeren, herstel na herladen, slaapstand, stoppen, optellen bij Sport zonder dubbel tellen, kleine/grote schermen, donkere modus, minder beweging en offline gebruik. Mobiele weergave is getest in Chrome-emulatie; er is geen fysieke iPhone-test uitgevoerd.

De serviceworker bewaart de code en alle vijf illustraties lokaal voor offline gebruik. De app bevat geen externe afbeeldings- of videodiensten.
