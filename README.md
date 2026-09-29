# Gezondheid

De bronbestanden staan in twee appmappen:

- **Ritme/**: slaap, groente, fruit, sport, diensten en eigen afvinkbare gewoontes. De link onder de dienstkeuze opent Workout.
- **Workout/**: de bestaande core-oefeningen, bewegende voorbeelden en timer voor 5 of 10 minuten. Nieuwe oefeningen kunnen later in de code worden toegevoegd. Er is geen koppeling die sportminuten bijschrijft.

Ritme bewaart dagelijkse vinkjes onder `ritme.v2`. Vandaag, Gewoontes en Inzichten delen dezelfde doelen: minimaal 8 uur geslapen, groente gegeten, fruit gegeten, bewogen en eigen gewoontes. De nieuwe registratie begint leeg; bestaande gewoontes blijven behouden. Oude gegevens onder `ritme.v1` worden ongewijzigd gearchiveerd en blijven onderdeel van iedere JSON-back-up. Oude back-ups worden als archief geïmporteerd. Nieuwe back-ups herstellen vinkjes, gewoontes en startdatum en archiveren eerst het huidige schrift.

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
python3 Ritme/tests/journal_check.py
python3 tests/workout_browser.py
```

De controles starten een lokale server. Ritme controleert migratie en archief, vinkjes, statistieken, back-ups, kleine/grote schermen en offlinegebruik. Workout heeft een eigen browsercontrole.
