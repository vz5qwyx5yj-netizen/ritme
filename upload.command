#!/bin/bash
# Dubbelklik om Ritme en Workout samen naar de bestaande GitHub Pages-site te uploaden.
set -e
cd "$(dirname "$0")" || exit 1

echo "== Ritme en Workout uploaden =="

# Publicatiebestanden bouwen; cacheversies volgen automatisch de bestandsinhoud.
python3 build.py
RELEASE_STAMP=$(date +%Y%m%d%H%M%S)

# 2) Wijzigingen committen en pushen
git add -A
if git diff --cached --quiet; then
  echo "Geen wijzigingen om te uploaden."
else
  git commit -m "Update Ritme en Workout $RELEASE_STAMP" >/dev/null
  echo "Commit gemaakt."
fi

if git push origin main; then
  echo ""
  echo "Klaar! Over ~1 minuut live op:"
  echo "  https://vz5qwyx5yj-netizen.github.io/ritme/"
  echo "  https://vz5qwyx5yj-netizen.github.io/ritme/Workout/"
else
  echo ""
  echo "Push mislukt. Bestaat de repo 'ritme' al op GitHub en is 'origin' ingesteld?"
fi

echo ""
read -n 1 -s -r -p "Druk op een toets om dit venster te sluiten..."
echo ""
