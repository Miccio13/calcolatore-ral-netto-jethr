# Filtro regione → comune nella select della residenza fiscale

## Contesto

Oggi le due select "Regione" e "Comune" in `InputPanel.tsx` sono completamente
disaccoppiate: selezionando Molise la select comune mostra comunque tutti gli 11
capoluoghi (Milano compresa), e il calcolo somma silenziosamente addizionale
regionale Molise + comunale Milano — fiscalmente incoerente. I dataset non hanno
nessuna chiave che colleghi comune e regione. Obiettivo: mostrare solo i comuni
della regione selezionata, con fallback su "Altro comune (inserisci aliquota)"
quando la regione non ha capoluoghi nel dataset.

## Modifiche

### 1. `src/lib/tax/comuni-2026.ts` — collegare i dataset
- Aggiungere `regioneId: string` al tipo `Comune` e a ciascuna delle 11 entry,
  usando gli id kebab-case di `REGIONI_2026` (verificarli sul file prima di
  scrivere): milano→lombardia, roma→lazio, napoli→campania, torino→piemonte,
  genova→liguria, bologna→emilia-romagna, firenze→toscana, palermo→sicilia,
  bari→puglia, venezia→veneto, cagliari→sardegna.
- Aggiornare il commento di testa del file (una riga: i comuni sono ancorati
  alla regione per il filtro in UI).

### 2. `src/components/InputPanel.tsx` — filtro + reset coerente
- Nella select comune (righe ~246-265): sostituire `COMUNI_2026.map(...)` con
  `COMUNI_2026.filter(c => c.regioneId === regioneId).map(...)` (memoizzabile
  ma sono 11 elementi, non serve). L'option "Altro comune (inserisci aliquota)"
  resta sempre presente.
- Nell'`onChange` della select regione: oltre a `setRegioneId`, se il
  `comuneId` corrente è un preset che non appartiene alla nuova regione,
  resettare `setComuneId` al primo comune della nuova regione, o a
  `COMUNE_PERSONALIZZATO` se la regione non ha comuni nel dataset (caso Molise
  e altre ~10 regioni). Se l'utente era già su "personalizzato", non toccarlo.
  Il reset è indispensabile: senza, la select mostrerebbe un `value` assente
  tra le option e lo stato React divergerebbe da ciò che il browser visualizza.
- Il suffisso " (default)" su Milano resta com'è: appare solo quando la regione
  è Lombardia, coerente.

### 3. Test — integrità dati (stile del progetto: test sul motore, non sulla UI)
- In `src/lib/tax/__tests__/` (nel file esistente più pertinente o nuovo
  `comuni-2026.test.ts`): ogni `regioneId` di `COMUNI_2026` deve esistere in
  `REGIONI_2026`. Questo intercetta i typo sugli id kebab-case
  (`friuli-venezia-giulia`, `valle-daosta`, ecc.).

## Cosa NON cambia
- Motore di calcolo (`calcola.ts`, `addizionali.ts`): nessuna modifica — le due
  addizionali restano indipendenti, cambia solo cosa la UI lascia selezionare.
- `types.ts` / `ComuneScelto` / `INPUT_DEFAULT`: invariati (lombardia+milano
  restano coerenti tra loro).
- PDF/fonti: nessun parametro fiscale cambia, niente da rigenerare.

## Verifica
1. `npx vitest run` (121+1 test) e `npx tsc --noEmit`.
2. `npm run dev` → http://localhost:3000/AI-builder-jethr, controllare a mano:
   - Lombardia → solo Milano + "Altro comune".
   - Molise → solo "Altro comune", auto-selezionato, campi aliquota/soglia visibili.
   - Lombardia/Milano → cambio a Lazio → comune passa a Roma, netto ricalcolato.
   - Se ero su "Altro comune" e cambio regione → resto su "Altro comune".
3. `npm run build` (con `--webpack`, come da CLAUDE.md).
