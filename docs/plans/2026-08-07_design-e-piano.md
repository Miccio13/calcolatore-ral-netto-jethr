# Jet HR — Calcolatore RAL → Netto (prototipo Product Builder)

## Context

Task di selezione per il ruolo di Product Builder @ Jet HR. Va costruito un prototipo web
che, data una RAL, proietti netto annuo e mensile ed esponga tutte le voci trattenute
al lordo. Il brief dichiara esplicitamente che il dominio è troppo vasto per essere coperto
per intero: si valutano **ricerca delle fonti**, **strutturazione delle informazioni** e
**prototipo funzionante**, con l'avvertenza che il test non misura l'abilità con Lovable ma
il controllo effettivo sulle logiche.

Conseguenza progettuale: il valore non sta nella UI, sta nel **motore di calcolo tipizzato,
testato e documentato**. La UI è un renderer puro dell'output del motore. Il README è dove
la ricerca normativa atterra in modo verificabile.

Caso standard assunto (dal brief): impiegato, tempo indeterminato, Milano, nessuna
agevolazione, nessun familiare a carico, anno d'imposta 2026, rapporto per 365 giorni.

## Il modello di calcolo

Catena completa, ogni passaggio su una base imponibile diversa:

```
RAL
 − contributi INPS c/dipendente        9,19% (9,49% se azienda con CIGS/FIS >15 dip.)
                                       +1% sulla quota oltre 56.224 € (1ª fascia pens. 2026)
   I contributi previdenziali obbligatori non concorrono a formare il reddito di lavoro
   dipendente: art. 51 c.2 lett. a) TUIR (per i dipendenti è esclusione alla fonte, non
   deduzione come oneri ex art. 10 c.1 lett. e — stesso risultato, norma diversa: nel PDF
   va citata quella giusta).
 = IMPONIBILE FISCALE (≈ reddito di lavoro dipendente ≈ reddito complessivo)
 → IRPEF LORDA, scaglioni 2026 (Agenzia Entrate, L. 199/2025):
                                       23% ≤ 28.000
                                       33% 28.000–50.000   ← era 35%, ridotta dalla LdB 2026
                                       43% > 50.000
       Forma cumulativa dell'Agenzia, da usare come asserzione nei test:
       imposta = 6.440 + 33% oltre 28.000  →  su 50.000 esatti fa 13.700
       imposta = 13.700 + 43% oltre 50.000
 − detrazione lavoro dipendente (art. 13 c.1 TUIR), come da tabella della circ. AdE 4/E 2025:
       R ≤ 15.000        → 1.955 (non inferiore a 690; 1.380 se a tempo determinato)
       15.000 < R ≤ 28.000 → 1.910 + 1.190 × [(28.000 − R) / (28.000 − 15.000)]
       28.000 < R ≤ 50.000 → 1.910 × [(50.000 − R) / (50.000 − 28.000)]
       R > 50.000        → 0
   Il reddito di riferimento è il reddito complessivo **al netto** dell'abitazione principale
   e pertinenze (art. 13 c.6-bis TUIR; circ. 22/E del 19/11/2024 per il perimetro del
   "reddito di riferimento"). Nel caso standard non c'è altro reddito, quindi coincide
   con l'imponibile fiscale.
 − ulteriore detrazione "cuneo" (art. 1 c.6 L. 207/2024), rapportata al periodo di lavoro:
       20.000 < RC ≤ 32.000 → 1.000
       32.000 < RC ≤ 40.000 → 1.000 × (40.000 − RC) / 8.000
 = IRPEF NETTA (floor a 0, le detrazioni non generano credito)
 − addizionale regionale Lombardia, progressiva per scaglioni (art. 72 c.1 L.R. 14/07/2003
   n. 10; aliquote pubblicate dal Dip. Finanze il 28/01/2026):
       1,23% ≤ 15.000 | 1,58% 15–28k | 1,72% 28–50k | 1,73% > 50k
 − addizionale comunale Milano: 0,80%, **soglia** di esenzione a 23.000 — confermato sul
       lookup del Dip. Finanze: sotto → zero, sopra → si paga sull'intero imponibile.
       Delibera comunale n. 46 del 28/09/2020, pubblicata il 20/12/2025 per il 2026.
 + trattamento integrativo (d.l. 3/2020 art. 1 c.1, come modificato dall'art. 1 c.3
       L. 207/2024): 1.200 € se reddito complessivo ≤ 15.000 E capienza, dove la capienza
       è: imposta lorda **calcolata sui soli redditi di lavoro dipendente e assimilati**
       > detrazione art. 13 c.1 **diminuita di 75 €** rapportati al periodo di lavoro.
       → Verificato testualmente sulla circ. AdE 4/E 2025: la riduzione di 75 € serve a
       neutralizzare l'innalzamento della detrazione da 1.880 a 1.955, che altrimenti
       avrebbe escluso dal beneficio soggetti che invece ne sono destinatari.
 + somma integrativa "cuneo" (art. 1 c.4-5 L. 207/2024; non concorre alla formazione del
       reddito, si somma al netto): spetta se **reddito complessivo** ≤ 20.000; la
       percentuale si sceglie in base al **reddito di lavoro dipendente** rapportato
       all'intero anno e si applica al RLD effettivamente percepito:
       7,1% se RLD ≤ 8.500 | 5,3% se 8.500 < RLD ≤ 15.000 | 4,8% se RLD > 15.000
 = NETTO ANNUO
   netto mensile = netto annuo / mensilità (12 | 13 | 14)
```

Ramo costo azienda (sezione separata, non parte della catena netto):

```
RAL
 + contributi c/azienda   ~29,40% (terziario/commercio) | ~32% (industria)
 + TFR accantonato        6,91% (= RAL/13,5 al netto dello 0,50% al Fondo di garanzia)
 = COSTO AZIENDA
   cuneo fiscale % = (costo azienda − netto annuo) / costo azienda
```

### Tre punti dove i calcolatori online sbagliano, e che il prototipo gestisce esplicitamente

1. **Trattamento integrativo e somma integrativa si sommano al netto**, non sono trattenute,
   e la loro base è il *reddito di lavoro dipendente* mentre le soglie di accesso guardano
   il *reddito complessivo*. Nel caso standard coincidono, ma il codice tiene i due concetti
   separati perché nella realtà divergono.
2. **Le addizionali** per legge si calcolano sul reddito dell'anno precedente e si versano in
   11 rate l'anno successivo. In una proiezione annuale si semplifica a stesso anno: va
   dichiarato nel README, non nascosto.
3. **Il netto mensile** dipende dalle mensilità del CCNL. Dividere sempre per 12 è sbagliato.
4. **Scoperta emersa dai test, non ipotizzata a tavolino**: appena sopra i 15.000 € di
   reddito il **netto annuo può scendere pur salendo la RAL**. Due cose cambiano nello
   stesso punto: la detrazione art. 13 salta da 1.955 a ~3.100 (guadagno fiscale reale ma
   parziale, vale solo come sconto sull'aliquota marginale), e si perde interamente il
   trattamento integrativo di 1.200 € (soglia netta, non graduale). Il secondo effetto
   vince sul primo: un salto di 2 € di RAL a cavallo dei 15.000 € di reddito produce un
   netto **più basso**, non più alto. Verificato con test dedicato (`calcola.test.ts`),
   confermato come effetto soglia reale e documentato nella letteratura sulla fiscalità
   del lavoro dipendente, non un bug del motore.

### Fuori scope, dichiarato

Familiari a carico; premi di risultato e welfare; fringe benefit; addizionali di altri comuni
oltre a un set ridotto; sterilizzazione delle detrazioni (−440 €) per redditi > 200.000;
INAIL nel costo azienda (variabile per rischio); ratei di 13ª/14ª con tassazione separata;
conguaglio di fine anno; part-time e periodi infra-annuali; massimale contributivo annuo per
iscritti post-1996 (**122.295 €** nel 2026, circ. INPS 6/2026) — rilevante solo su RAL molto
alte; secondo caso del trattamento integrativo per redditi tra 15.000 e 28.000 (spetta se la
somma di determinate detrazioni supera l'imposta lorda: dipende da oneri detraibili che il
prototipo non raccoglie).

## Stack e consegna

- **Next.js (App Router) + TypeScript + Tailwind v4**, repo GitHub pubblico, deploy su Vercel.
- **Vitest** per il motore di calcolo.
- Font: **Wix Madefor Display** via `next/font/google` (self-hosted, zero richieste esterne).
- `motion` (v12) solo per il conteggio animato dei numeri e l'entrata del waterfall. Niente altro.
- Prima di scrivere codice Next: verificare la major installata da `create-next-app@latest` e,
  se più recente del training, leggere `node_modules/next/dist/docs/` (regola CLAUDE.md).

## Architettura

Il motore è una libreria pura, senza dipendenze da React, che restituisce una struttura dati
descrittiva. La UI non ricalcola nulla: itera sulle voci.

```
src/lib/tax/
  fonti.ts            Registro unico delle fonti normative (id → norma, descrizione, url,
                      tipo: 'norma' | 'prassi' | 'atto-locale'). Tre consumatori leggono da
                      qui: la UI, il README, il PDF. Una fonte si aggiorna in un posto solo.
                      Un test verifica che ogni url stia su un dominio istituzionale in
                      whitelist: la regola sulle fonti la applica la CI, non la buona volontà.
  constants-2026.ts   Tutti i parametri normativi in un unico posto, ognuno legato al suo
                      id di fonte. Nessun magic number altrove nel codice.
  types.ts            Input, Fonte, VoceBreakdown, Risultato
  progressive.ts      Utility generica per scaglioni progressivi — riusata da irpef.ts
                      e addizionali.ts, non duplicata
  inps.ts             Contributi dipendente: aliquota base + 1% oltre 1ª fascia
  irpef.ts            Imposta lorda
  detrazioni.ts       art. 13 TUIR + ulteriore detrazione cuneo
  bonus.ts            Trattamento integrativo (con verifica capienza) + somma integrativa
  addizionali.ts      Regionale progressiva + comunale a soglia
  costoAzienda.ts     Contributi c/azienda + TFR + cuneo %
  calcola.ts          Orchestratore: Input → Risultato
  __tests__/          Un file per modulo + calcola.test.ts end-to-end
```

Forma del `Risultato` — è il contratto tra motore e UI:

```ts
type Fonte = {
  norma: string            // es. "art. 13 c.1 lett. b) TUIR"
  descrizione: string      // una frase, in italiano, su cosa dice la norma
  url: string              // link alla fonte consultata
}

type VoceBreakdown = {
  id: string
  label: string
  importo: number          // sempre positivo
  segno: 'trattenuta' | 'aggiunta' | 'totale'
  percentualeRal: number
  formula: string          // la formula applicata con i numeri di QUESTO calcolo
  fonte: Fonte             // obbligatoria: nessuna voce senza norma di riferimento
}

type Risultato = {
  input: Input
  nettoAnnuo: number
  nettoMensile: number
  totaleTrattenute: number
  aliquotaEffettiva: number
  breakdown: VoceBreakdown[]
  costoAzienda: { totale: number; contributi: number; tfr: number; cuneoPercentuale: number }
  imponibileFiscale: number
}
```

Arrotondamenti: si calcola in `number` e si arrotonda **solo in presentazione** (`Intl.NumberFormat`
it-IT, 0 decimali). Nessun troncamento intermedio: il "troncamento a 4 decimali" riportato da
alcuni portali fiscali per la formula dell'art. 13 scaglione 15–28k non compare né nella
tabella della circolare AdE 4/E né in un riscontro testuale sull'art. 13 TUIR — trattato come
folklore da calcolatore online, non replicato.

## UI

Pagina singola, verticale, tre blocchi.

1. **Input** — campo RAL grande e formattato in tempo reale (`€ 35.000`), CTA "Calcola".
   Sotto, un disclosure "Parametri" chiuso di default con: mensilità (12/13/14, default 14),
   aliquota INPS (9,19% / 9,49%, default 9,19%), settore per il costo azienda
   (terziario / industria). I default corrispondono al caso standard del brief.
2. **Risultato** — tre KPI (netto annuo, netto mensile, totale tasse e contributi) con numeri
   animati. Poi il **waterfall**: una riga per ogni `VoceBreakdown`, con barra proporzionale
   alla RAL, importo e percentuale. Trattenute in scuro, aggiunte in verde accento, totali
   in evidenza. È letteralmente la richiesta del brief: "tutte le voci trattenute al lordo".

   Ogni riga è espandibile e mostra la **fonte normativa**: norma citata, la formula
   applicata con i numeri di quel calcolo specifico (es. `1.910 × (50.000 − 33.784) / 22.000
   = 1.407,89`) e il link alla fonte. Su desktop, apertura inline sotto la riga; su mobile,
   riga interamente tappabile. Nessuna voce del waterfall esiste senza fonte: il tipo la
   rende obbligatoria, quindi il compilatore impedisce di dimenticarla.
3. **Costo azienda** — RAL → contributi c/azienda → TFR → costo totale, più il cuneo fiscale
   in percentuale. Stesso meccanismo di fonti espandibili. Sezione visivamente separata.

In fondo, accordion **"Come si calcola"**: la catena in formule, le tre trappole, le
semplificazioni fuori scope, e il link al PDF metodologico.

Design: brand Jet HR sobrio. `#11150A` come inchiostro, verde chiaro come sfondo di pagina,
superfici bianche con bordi tenui e raggio ampio (coerente con gli screenshot di prodotto),
verde acceso solo sulle voci in aggiunta. Logo SVG dagli asset in `asset aziendali/Jet Logo/`.
Responsive; su mobile il waterfall diventa una lista senza barre.

## Documentazione: il PDF metodologico

Questo è un esercizio di recruiting: la documentazione è un deliverable, non un contorno.
Nel repo va un PDF brandizzato, `docs/Jet-HR_Calcolatore-RAL-Netto_Metodologia.pdf`,
linkato dal README e dalla pagina.

Pipeline: HTML sul design system del progetto (stessi token e stesso font della web app)
→ PDF via Chrome headless, come in `proposta-pdf`. Il sorgente HTML resta versionato in
`docs/metodologia.html`, e le tabelle di parametri e fonti sono **generate da uno script
che legge `fonti.ts` e `constants-2026.ts`**: nessuna trascrizione a mano, quindi nessuna
possibilità che il PDF diverga dal codice.

Ogni fonte citata nel PDF è istituzionale (vedi sezione Fonti): nessun rimando a portali
fiscali commerciali.

Contenuti, in quest'ordine:

1. **Sintesi** — cosa fa, cosa non fa, in mezza pagina.
2. **Il caso standard** — tutte le assunzioni, quelle date dal brief e quelle aggiunte da me.
3. **Il modello di calcolo** — la catena passo per passo, con la formula di ogni voce e la
   norma che la impone. Una tabella: Voce | Base imponibile | Formula | Norma | Fonte.
4. **Parametri 2026** — tabella completa di aliquote, scaglioni e soglie, con l'atto che
   li fissa (LdB 2026, circ. INPS 6/2026, delibere Regione Lombardia e Comune di Milano).
5. **Le tre trappole** — dove i calcolatori online sbagliano e perché, con l'impatto in euro.
6. **Semplificazioni e limiti** — l'elenco "fuori scope", ognuna con la ragione della
   scelta e l'ordine di grandezza dell'errore che introduce.
7. **Validazione** — la tabella dei casi di test con i valori attesi e il confronto con i
   calcolatori pubblici, scostamenti inclusi e spiegati.
8. **Bibliografia** — tutte le fonti consultate, con data di consultazione.

Il PDF va salvato anche in `~/Library/Mobile Documents/.../claude/autosalvati/` come
`2026-08-07_jethr_metodologia_calcolo-ral-netto.md` (regola doppio salvataggio, CLAUDE.md).

## Verifica

- `npx vitest run` — test unitari per modulo, più test end-to-end su RAL 15.000 / 25.000 /
  35.000 / 60.000 / 100.000 e sui valori esatti di soglia (15.000, 20.000, 28.000, 32.000,
  40.000, 50.000, 56.224) per verificare che non ci siano discontinuità artificiali.
- **Golden test di sanità**: confronto dei netti su 3 RAL con due calcolatori pubblici,
  tolleranza dichiarata ±2%. Gli scostamenti attesi vanno spiegati nel README, non azzerati
  forzando il codice.
- `npm run build` e `npx tsc --noEmit`.
- Verifica reale del flusso in browser (skill `/run` o `/verify`): inserimento RAL, calcolo,
  lettura del waterfall, apertura dell'accordion, controllo responsive.

## Consegna

1. Repo GitHub pubblico con README che documenta modello, fonti e semplificazioni.
2. Deploy Vercel — solo dopo tua conferma esplicita del progetto e del target.
3. Risposta all'email di invito **senza modificare l'oggetto**, con `task@jethr.com` in CC.
   Preparo la bozza; l'invio è tuo.

## Fonti

**Regola vincolante del progetto**: in `constants-2026.ts` e nella bibliografia del PDF
entrano solo documenti pubblicati da `normattiva.it`, `gazzettaufficiale.it`,
`agenziaentrate.gov.it`, `finanze.gov.it`, `inps.it`, `mef.gov.it`. I portali fiscali
commerciali (fiscomania, informazionefiscale, ilcommercialistaonline e simili) possono
servire per orientarsi, ma **non vengono citati**: in un esercizio di recruiting che si
gioca sulla ricerca delle fonti, una nota a piè di pagina che rimanda a un blog fiscale
è un autogol. Ogni parametro ha una fonte istituzionale o non entra nel codice.

### Norma primaria

- [**L. 30/12/2024 n. 207** (LdB 2025) — Normattiva, testo vigente](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3Alegge%3A2024-12-30%3B207=) ·
  [Gazzetta Ufficiale](https://www.gazzettaufficiale.it/atto/vediMenuHTML?atto.dataPubblicazioneGazzetta=2024-12-31&atto.codiceRedazionale=24G00229&tipoSerie=serie_generale&tipoVigenza=originario) —
  art. 1 c.2-3 (aliquote, detrazione 1.955, correttivo 75 €), c.4-5 (somma integrativa),
  c.6 (ulteriore detrazione), c.9 (definizione di reddito complessivo).
- [**L. 30/12/2025 n. 199** (LdB 2026)](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3Alegge%3A2025-12-30%3B199=) —
  art. 1 c.3: modifica l'art. 11 c.1 lett. b) TUIR, "35 per cento" → "33 per cento" per lo
  scaglione 28.000–50.000. Testo verificato su Normattiva.
  → Correzione rispetto alla ricerca preliminare: la legge di bilancio 2026 è la
  **199/2025**, non "199/2026" (la numerazione delle leggi segue l'anno di pubblicazione
  in G.U., non l'anno a cui si riferisce il bilancio).
- **TUIR** (d.P.R. 917/1986) — art. 11 (aliquote), art. 13 c.1 e c.6-bis (detrazioni lavoro
  dipendente e reddito di riferimento), **art. 51 c.2 lett. a)** (i contributi previdenziali
  obbligatori non concorrono a formare il reddito di lavoro dipendente), art. 49 (definizione
  di reddito di lavoro dipendente), art. 2120 c.c. per il TFR.
- **D.Lgs. 216/2023** e **D.Lgs. 192/2024** — antecedenti della disciplina a regime.
- **D.L. 3/2020 conv. L. 21/2020** art. 1 c.1 — trattamento integrativo.

### Prassi — Agenzia delle Entrate

- [**Circolare 4/E del 16/05/2025**](https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91) —
  è **il** documento di riferimento del progetto. Contiene le tabelle ufficiali di scaglioni
  e detrazioni, le percentuali della somma integrativa con esempi numerici, le formule
  dell'ulteriore detrazione e la spiegazione del correttivo di 75 €. Già scaricata e letta.
- [Circolare 6/E del 29/05/2025](https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/CIRCOLARE_RIORDINO_DETRAZIONI+n.+6+del+29+maggio+2025.pdf/41d27442-ed03-83bb-abd9-b2c236043a5b) — riordino delle detrazioni.
- Circolare 22/E del 19/11/2024 — perimetro del "reddito di riferimento".
- [Aliquote e calcolo dell'IRPEF](https://www.agenziaentrate.gov.it/portale/imposta-sul-reddito-delle-persone-fisiche-irpef-/aliquote-e-calcolo-dell-irpef) — scaglioni 2026 in forma cumulativa.

### Fiscalità locale — Dipartimento delle Finanze (MEF)

- [Addizionale regionale, Lombardia (`reg=10`)](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=10) —
  base giuridica art. 72 c.1 L.R. Lombardia 14/07/2003 n. 10, aliquote pubblicate 28/01/2026.
- [Addizionale comunale, Milano (`pr=MI&cc=F205`)](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&pr=MI&cc=F205&r=1) —
  0,80%, soglia di esenzione 23.000 €, delibera n. 46 del 28/09/2020.
- [Quadro normativo dell'addizionale comunale](https://www.finanze.gov.it/it/fiscalita/fiscalita-regionale-e-locale/Addizionale-comunale-allIRPEF/normativa/index.html).

### Contribuzione — INPS

- [**Circolare INPS n. 6 del 30/01/2026**](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html) —
  minimali e massimali 2026: 1ª fascia di retribuzione pensionabile **56.224 €** (soglia
  dell'aliquota aggiuntiva 1%), massimale annuo **122.295 €** per gli iscritti post-1996.
  → Corregge il valore che avevo da fonte secondaria (120.607 €).
- Tabella delle aliquote contributive in vigore, allegata alle circolari INPS, per le
  aliquote a carico del datore usate nel ramo costo azienda.

### Da recuperare prima di scrivere il codice

Solo la tabella INPS delle aliquote a carico datore per il settore terziario (per il ramo
costo azienda) resta da fissare su fonte primaria in fase di implementazione — il resto è
verificato.

## Ordine di esecuzione

1. Scaffold Next.js + Tailwind + Vitest; font e token brand.
2. `fonti.ts`, `constants-2026.ts`, `types.ts` — prima le fonti, poi le costanti che le citano.
3. Motore modulo per modulo, **test-first** su ognuno.
4. `calcola.ts` + test end-to-end + golden test comparativi.
5. UI: input → KPI → waterfall con fonti espandibili → costo azienda → accordion.
6. Responsive, polish, verifica in browser.
7. README + script di generazione delle tabelle + PDF metodologico.
8. Repo GitHub. Deploy (previa conferma). Bozza email.
