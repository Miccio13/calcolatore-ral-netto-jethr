@AGENTS.md

# Calcolatore RAL → Netto — Jet HR

Prototipo per la selezione **Product Builder @ Jet HR**. Data una RAL calcola netto
annuo e mensile e tutte le voci trattenute al lordo, con la fonte normativa di ogni
singolo calcolo.

Non è un prodotto: è un esercizio valutato su **ricerca delle fonti**, **capacità di
strutturare l'informazione** e **controllo reale sulla logica**. Ogni decisione qui
sotto discende da quello.

## Le due regole non negoziabili

**1. Un parametro entra nel codice solo con una fonte istituzionale.**
Solo i domini in `DOMINI_ISTITUZIONALI` (`src/lib/tax/fonti.ts`): Normattiva,
Gazzetta Ufficiale, Agenzia delle Entrate, Dipartimento delle Finanze, INPS, MEF.
Mai un portale fiscale commerciale — in un esercizio che si gioca sulle fonti, una
citazione a un blog fiscale vale meno di nessuna citazione. Il tipo `VoceBreakdown`
rende `fonte` obbligatoria: il compilatore rifiuta una voce di calcolo senza norma.

**2. HTTP 200 non significa "raggiungibile".**
Normattiva serve una pagina «Errore nel caricamento delle informazioni» con status
200: tre fonti erano così, e due erano link rotti live in produzione. Su Normattiva
usare la **forma ELI** (`/eli/stato/LEGGE/2024/12/30/207/CONSOLIDATED`) o le URN
**con deep-link all'articolo** (`uri-res/N2Ls?urn:nir:…~art13!vig=`), che servono il
testo reale e sono più precise della ELI (puntano al singolo articolo, non all'intera
legge). Le URN **senza** deep-link sono quelle che servivano la pagina d'errore: mai.
In ogni caso una fonte non entra sulla fede del pattern URL — prima di committarla:
`npx tsx scripts/verifica-fonti.ts`.

## Architettura

```
src/lib/tax/      Motore puro, zero React. È qui che sta il valore.
  fonti.ts          Registro unico delle fonti. Lo leggono UI, README e PDF.
  constants-2026.ts Parametri non geografici
  regioni-2026.ts   Addizionale regionale, 21 regioni e province autonome
  comuni-2026.ts    Addizionale comunale, 11 capoluoghi verificati singolarmente
  progressive.ts    Scaglioni marginali, riusata da IRPEF e addizionali
  periodo.ts        Rapportamento al periodo lavorato — due meccaniche distinte
  calcola.ts        Orchestratore: Input → Risultato
src/components/   UI: renderer puro dell'output del motore
src/lib/format.ts Formattazione numerica italiana scritta a mano
scripts/          Generazione e verifica dei PDF in docs/
```

La UI non ricalcola nulla: itera su `risultato.breakdown`. Se serve un numero
nuovo in pagina, si aggiunge al motore e ai suoi test, non al componente.

## Trappole già pagate — non "correggerle"

Queste sono comportamenti reali, verificati e testati. Sembrano bug: non lo sono.

- **Il netto può scendere mentre la RAL sale**, appena sopra 15.000 € di reddito:
  si perde il trattamento integrativo (soglia netta) più di quanto si guadagni dal
  salto della detrazione. Coperto da un test dedicato in `calcola.test.ts`.
- **Soglia ≠ franchigia**, tre volte: addizionale comunale, addizionale regionale
  Valle d'Aosta e welfare. Superata la soglia si paga/tassa sull'**intero** importo,
  non sull'eccedenza.
- **`Intl.NumberFormat` è vietato.** Causava un mismatch di idratazione React: i
  dati ICU di Node (SSR) e del browser divergono, `1855` usciva `"1,855 €"` da una
  parte e `"1.855 €"` dall'altra. Usare sempre `src/lib/format.ts`.
- **Build con webpack, non Turbopack** (`next build --webpack`). Con Turbopack
  l'HTML di produzione referenziava chunk con hash inesistenti nell'output.
- **`assetPrefix` deve includere `basePath`**, e solo in produzione. L'app è montata
  sotto `/AI-builder-jethr` via rewrite dal portfolio (pattern Multi Zones): senza,
  gli asset `_next/*` danno 404. In dev un assetPrefix assoluto farebbe scaricare i
  chunk dal dominio deployato mentre credi di testare in locale.
- **Il tempo determinato non è un parametro.** Verificato due volte: non cambia
  nessun numero (il minimo art. 13 non scatta mai, il contributo NASpI è a carico
  del datore). Un controllo che non cambia mai nulla è peggio della sua assenza.
- Nella UI: i campi numerici tengono lo stato come **stringa** (altrimenti la
  casella non può restare vuota mentre si digita), e la card dei risultati usa
  `fixed` e non `position: sticky` (sticky innescava lo scroll anchoring di Chrome
  e lo scroll rimbalzava). I perché stanno nei commenti: leggerli prima di
  semplificare.

## Documenti

I due PDF in `docs/` sono **generati dal codice**, mai scritti a mano: parametri,
esempi numerici, conteggio dei test e fonti vengono dai sorgenti, così non possono
divergere dall'implementazione.

```bash
./scripts/genera-pdf.sh    # rigenera entrambi + verifica fonti e link
```

Se cambi un parametro, una fonte o lo scope: rigenera i PDF e aggiorna `README.md`
e `src/components/ComeSiCalcola.tsx`, che raccontano le stesse cose all'utente.

## Comandi

```bash
npx vitest run                    # 121 test, offline, ~300ms
npx tsc --noEmit
npm run build                     # usa --webpack, vedi sopra
npm run dev                       # http://localhost:3000/AI-builder-jethr
npx tsx scripts/verifica-fonti.ts # fonti raggiungibili + link nei PDF
```

## Convenzioni

- **Italiano** per identificatori, commenti, UI e documenti. Il dominio è italiano
  e i nomi seguono la norma (`calcolaDetrazioneLavoroDipendente` ↔ art. 13 TUIR),
  così il codice si confronta a vista con la fonte.
- **Test-first** sul motore: un modulo nuovo nasce col suo file in `__tests__/`.
- **Le semplificazioni si dichiarano**, non si nascondono. Ogni esclusione sta in
  `ComeSiCalcola.tsx`, nel README e nel PDF metodologico, con la ragione.
- Quando una fonte resta incerta, si scrive nel registro (vedi `apprendistato`:
  confermata su tre fonti ma testo primario non recuperato). Meglio un limite
  dichiarato di una certezza finta.

## Deploy

Due progetti Vercel distinti:

- `calcolatore-ral-netto-jethr` — questa app. `vercel deploy --prod` dalla root.
- `portfolio` — `mariglianosimone.design`, ospita il rewrite `/AI-builder-jethr`.
  **Non ha deploy automatico da GitHub**: un push non basta, serve `vercel --prod`
  dalla cartella del portfolio.

Mai deployare in produzione senza conferma esplicita.
