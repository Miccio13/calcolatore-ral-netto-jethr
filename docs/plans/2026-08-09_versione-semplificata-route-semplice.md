# Versione semplificata del calcolatore RAL → Netto (route `/semplice`)

## Context

Il prototipo Jet HR (`calcolatore-ral-netto`) copre il dominio in ampiezza: regioni, comuni, contratti, familiari, welfare. Serve una **versione semplificata** che copra solo il caso standard dichiarato dal brief — impiegato a tempo indeterminato, residente a Milano, nessuna agevolazione — senza sovrascrivere nulla dell'esistente.

Decisioni prese con l'utente:
- Vive come **nuova route `/semplice`** nella stessa app (URL pubblico `/AI-builder-jethr/semplice`).
- Unico input esposto: **RAL**.
- Output: **netto annuo/mensile + breakdown delle voci** con fonti.

Punto di leva: il motore ha già esattamente questo caso come default — `INPUT_DEFAULT` in `src/lib/tax/types.ts:34` (13 mensilità, contratto standard, INPS 9,19%, 365 giorni, Lombardia/Milano, zero familiari, welfare 0). La versione semplice fa spread su quel default cambiando solo `ral`. **Zero modifiche al motore, zero modifiche ai file esistenti.**

## File nuovi (soli 2)

### 1. `src/app/semplice/page.tsx`
Server component, speculare a `src/app/page.tsx`:
- `export const metadata` proprio (titolo tipo "Calcolatore RAL → Netto — versione semplice").
- Stesso wrapper `min-h-full bg-gradient-to-b from-sage to-cream`, renderizza `<CalculatorSemplice />`.
- Il basePath è applicato automaticamente da Next: nella route si scrive solo `/semplice`.

### 2. `src/components/CalculatorSemplice.tsx`
`'use client'`, versione distillata di `Calculator.tsx`:

- **Stato**: RAL come **stringa** (`useState('35000')`) — stessa regola di `InputPanel.tsx`: il campo deve poter restare vuoto durante la digitazione (trappola documentata nel CLAUDE.md di progetto). Parse → numero, fallback a 0/valore precedente se vuoto.
- **Calcolo**: `useMemo(() => calcola({ ...INPUT_DEFAULT, ral }), [ral])`. Il motore è puro e sincrono (~µs), nessun debounce necessario con un solo campo.
- **Layout** (stesso `max-w-3xl` e classi dell'esistente):
  1. Header con pictogram Jet HR — copiare l'`<Image>` con **src assoluto hardcoded** da `Calculator.tsx:34` (next/image non applica basePath agli SVG, commento in loco).
  2. Campo RAL hero (unico input).
  3. Card KPI scura (`bg-ink text-cream`): netto annuo, netto mensile (13 mensilità), tasse e contributi — con `AnimatedEuro`. **Card statica**: niente `useCardAgganciata` (la pagina è corta, la meccanica fixed/anti-anchoring non serve — è la semplificazione principale rispetto a `Calculator.tsx`).
  4. `<Waterfall voci={risultato.breakdown} base={ral} />` — riusato as-is, porta già formule e fonti per voce.
  5. Blocco breve "Ipotesi del caso standard": impiegato a tempo indeterminato, CCNL terziario 13 mensilità, residente a Milano, anno intero, nessun carico familiare né fringe benefit — con link alla versione completa (`next/link` verso `/`) per chi vuole i parametri. Le semplificazioni si dichiarano, non si nascondono (convenzione di progetto).
  6. Footer identico allo spirito dell'esistente (anno d'imposta 2026, non è consulenza fiscale).
- Aliquota effettiva: caso semplice senza welfare → `risultato.totaleTrattenute / ral` (il ramo welfare di `Calculator.tsx:23-25` qui non esiste per costruzione).

## Cosa NON si tocca

- `src/lib/tax/*` (motore, fonti, costanti) — riusato senza modifiche.
- `Calculator.tsx`, `InputPanel.tsx`, `page.tsx`, PDF in `docs/`, README.
- Nessun nuovo parametro ⇒ nessuna nuova fonte ⇒ niente da rigenerare nei PDF.

## Riuso esplicito

| Cosa | Da dove |
|---|---|
| `calcola`, `INPUT_DEFAULT` | `src/lib/tax/calcola.ts`, `src/lib/tax/types.ts` |
| `Waterfall` | `src/components/Waterfall.tsx` |
| `AnimatedEuro` | `src/components/AnimatedEuro.tsx` |
| `formatNumero`, `formatPercentuale` | `src/lib/format.ts` (mai `Intl.NumberFormat`) |

## Verifica

```bash
npx tsc --noEmit
npx vitest run          # i 121 test esistenti devono restare verdi (motore intatto)
npm run build           # con --webpack, come da script
npm run dev             # → http://localhost:3000/AI-builder-jethr/semplice
```

In dev, verificare a mano: campo RAL vuoto non rompe nulla; cambiando RAL i tre KPI e il breakdown si aggiornano; a parità di RAL i numeri coincidono con la versione completa lasciata sui default; link "versione completa" funziona sotto basePath.

A piano approvato: copia canonica in `calcolatore-ral-netto/docs/plans/` (regola doppio salvataggio).
