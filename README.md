# Gezondheid

De bronbestanden staan in twee appmappen:

- **Ritme/**: slaap, groente, fruit, sport, diensten en eigen afvinkbare gewoontes. De knop op de Sport-kaart opent Workout.
- **Workout/**: de bestaande core-oefeningen, bewegende voorbeelden en timer voor 5 of 10 minuten. Nieuwe oefeningen kunnen later in de code worden toegevoegd. Er is geen koppeling die sportminuten bijschrijft.

Ritme bewaart bestaande gegevens onder dezelfde sleutel `ritme.v1`. Gewoontes zitten in dezelfde opslag en JSON-back-up. Elke gewoonte begint op de dag die bij toevoegen geselecteerd is; eerdere dagen tellen niet mee. Zowel oude back-ups als nieuwe back-ups met gewoontes kunnen worden hersteld. Herstellen vervangt de dagen met dezelfde datum, zoals voorheen.

Workout heeft een eigen manifest, icoon, offline cache en sessieopslag (`workout.session.v1`). Een onderbroken sessie wordt gepauzeerd hersteld. Beide apps bewaren hun gegevens lokaal op het apparaat.

## Lokaal bekijken

Vanuit deze map:

```sh
python3 build.py
python3 -m http.server 8765 --bind 127.0.0.1
```

Open Ritme op `http://127.0.0.1:8765/` en Workout op `http://127.0.0.1:8765/Workout/`.

## Publiceren en beginscherm

De bestaande Git-repository staat nu in Gezondheid. GitHub Pages publiceert nog steeds vanuit de hoofdmap van de bestaande repository. `build.py` maakt daarom publicatiekopieën van Ritme in die hoofdmap. Bewerk de bronbestanden in **Ritme/**; voer daarna de build opnieuw uit. Workout staat rechtstreeks onder **Workout/**. Alleen de expliciet opgegeven appbestanden worden gekopieerd, niet de privéreferentiefoto.

Dubbelklik **upload.command** om te bouwen, committen en beide apps samen te publiceren. Het script stopt bij een build- of commitfout. Het verandert geen GitHub Pages-instellingen.

Na publicatie:

- Ritme blijft op `https://vz5qwyx5yj-netizen.github.io/ritme/`. Het bestaande beginschermicoon en de opslag op dezelfde oorsprong blijven bruikbaar.
- Workout komt op `https://vz5qwyx5yj-netizen.github.io/ritme/Workout/`. Open dit adres en kies in Safari **Deel → Zet op beginscherm**, of in Chrome **Toevoegen aan startscherm / App installeren**.
- Open elke app eenmaal met internet voordat je deze offline gebruikt.

Een lokale build publiceert niets. Een kopie op een ander domein heeft geen toegang tot de gegevens van het huidige Ritme-adres; gebruik dan de back-upfunctie om gegevens over te zetten.

## Controleren

Met Python Playwright en Google Chrome geïnstalleerd:

```sh
python3 tests/gezondheid_browser.py
```

De test start zelf een lokale server. Hij controleert bestaande gegevens, gewoontes per dag, back-ups, beide volledige workouts, pauzeren en hervatten, aparte installatiegegevens, kleine/grote schermen en offline gebruik van beide apps.
