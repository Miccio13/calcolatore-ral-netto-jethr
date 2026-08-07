#!/usr/bin/env bash
# Genera i due PDF in docs/ a partire dal codice sorgente del motore di calcolo.
#
#   ./scripts/genera-pdf.sh
#
# Ogni documento nasce da uno script TypeScript che legge fonti.ts, constants-2026.ts
# e il motore stesso: nessun dato è trascritto a mano, quindi i PDF non possono
# divergere dal codice. La conversione HTML -> PDF usa Chrome headless.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -x "$CHROME" ]; then
  echo "Chrome non trovato in $CHROME — serve per la conversione in PDF." >&2
  exit 1
fi

genera() {
  local script="$1" html="$2" pdf="$3" nome="$4"

  echo "→ $nome"
  npx tsx "scripts/$script"

  # --virtual-time-budget dà a Chrome il tempo di applicare i font embedded
  # prima di stampare: senza, capita che la prima pagina esca con il fallback.
  "$CHROME" --headless --disable-gpu \
    --no-pdf-header-footer --print-to-pdf-no-header \
    --virtual-time-budget=10000 \
    --print-to-pdf="docs/$pdf" \
    "file://$ROOT/docs/$html" 2>/dev/null

  echo "  docs/$pdf ($(du -h "docs/$pdf" | cut -f1 | tr -d ' '))"
}

genera genera-pdf-metodologia.ts metodologia.html \
  "Jet-HR_Calcolatore-RAL-Netto_Metodologia.pdf" "Metodologia"

genera genera-pdf-fonti.ts fonti.html \
  "Jet-HR_Calcolatore-RAL-Netto_Fonti.pdf" "Fonti normative"

echo "Fatto."
