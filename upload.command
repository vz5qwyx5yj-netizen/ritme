#!/bin/bash
# Dubbelklik dit bestand om Ritme te uploaden naar GitHub Pages.
cd "$(dirname "$0")" || exit 1

echo "== Ritme uploaden =="

# 1) Cache-versie in sw.js bumpen, zodat telefoons de nieuwste versie ophalen
STAMP=$(date +%Y%m%d%H%M%S)
sed -i '' "s/const CACHE = 'ritme-[^']*';/const CACHE = 'ritme-$STAMP';/" sw.js
echo "Cache-versie -> ritme-$STAMP"

# 2) Wijzigingen committen en pushen
git add -A
if git diff --cached --quiet; then
  echo "Geen wijzigingen om te uploaden."
else
  git commit -m "Update $STAMP" >/dev/null
  echo "Commit gemaakt."
fi

if git push origin main; then
  echo ""
  echo "Klaar! Over ~1 minuut live op:"
  echo "  https://vz5qwyx5yj-netizen.github.io/ritme/"
else
  echo ""
  echo "Push mislukt. Bestaat de repo 'ritme' al op GitHub en is 'origin' ingesteld?"
fi

echo ""
read -n 1 -s -r -p "Druk op een toets om dit venster te sluiten..."
echo ""
