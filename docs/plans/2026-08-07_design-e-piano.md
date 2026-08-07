# Jet HR — Calcolatore RAL → Netto — v2: personalizzazione reale

## Context

La v1 (già implementata, testata, deployata) copriva un solo caso fisso — Milano,
tempo indeterminato, nessun familiare — nascondendo le assunzioni in un accordion
collassato. Confrontandola con un competitor (screenshot forniti dall'utente:
calcolatore con dropdown regione, coniuge/figli/altri familiari a carico, giorni
lavorati, apprendistato, welfare) è emerso che la semplificazione era eccessiva
rispetto a ciò che le fonti già raccolte permettevano di modellare correttamente,
e che un bug concreto si nascondeva nel codice (floor di 690€ sulla detrazione
lavoro dipendente: definito in `constants-2026.ts`, mai usato in `detrazioni.ts`).

Decisione esplicita dell'utente: **andare ben oltre il brief**. Il caso standard
(impiegato, tempo indeterminato, Milano, nessuna agevolazione) resta il **prefilled
di default**, ma ogni variabile che incide realmente sul netto deve diventare
gestibile dall'utente, con dati reali alla fonte — non un form che finge
personalizzazione senza cambiare i numeri.

## Cosa è emerso dalla verifica del codice esistente

- **Bug confermato**: `DETRAZIONE_LAVORO_DIPENDENTE_2026.minimo` (690€) e
  `.minimoTempoDeterminato` (1.380€) sono definiti ma mai destrutturati/usati in
  `calcolaDetrazioneLavoroDipendente`. Verificato sul testo strutturale dell'art. 13
  TUIR (letto integralmente): il floor appartiene solo alla lettera a) — fascia
  ≤15.000 — dove il valore base è già 1.955€, quindi **oggi è un no-op numerico**,
  ma il codice deve dimostrarlo esplicitamente (`Math.max`), non ometterlo.
- **Tempo determinato vs indeterminato**: verificato — due volte, con fonti
  indipendenti — che nel nostro modello (INPS + IRPEF + addizionali + bonus) non
  produce **alcuna differenza numerica** sul netto del dipendente. Il floor
  differenziato dell'art. 13 TUIR (690€ vs 1.380€) non scatta mai perché la base a
  quella fascia è già 1.955€; il contributo aggiuntivo NASpI dell'1,4% per i
  contratti a termine (verificato su ricerca INPS dedicata, messaggio 269/2025) è
  interamente a carico del datore, non del lavoratore. **Non verrà esposto come
  toggle a sé**: sarebbe un controllo che non cambia mai nulla — peggio che non
  averlo. La verifica va documentata esplicitamente (dimostra che è stato
  controllato, non ignorato), non solo omessa in silenzio.
- **Apprendistato**: verificato che **cambia sostanzialmente** il netto — aliquota
  contributiva a carico del lavoratore **5,84% flat**, indipendente dall'anno di
  apprendistato e dalla dimensione dell'azienda (a differenza degli sgravi per il
  datore di lavoro, quelli sì variabili per azienda <9 dipendenti, ma quelli
  incidono sul costo azienda non sul netto). Fonte: art. 1 c.773 L. 296/2006,
  msg. INPS 3618/2023 — confermato su tre fonti indipendenti con la stessa cifra e
  lo stesso riferimento normativo; il fetch diretto della pagina INPS non è
  riuscito tecnicamente (stesso problema di rendering incontrato altrove in questo
  progetto), quindi **va riletto sulla fonte primaria in fase di implementazione**
  prima di scrivere la costante, seguendo lo stesso standard delle altre voci.
  → **Include**: "Tipo di contratto" diventa un selettore reale (non un dropdown
  con un'unica opzione utile): Tempo indeterminato (default) | Apprendistato —
  che sostituisce l'aliquota INPS 9,19%/9,49% con 5,84% quando selezionato.
  Il tempo determinato non compare come opzione separata perché — a differenza
  dell'apprendistato — non altera nessun numero, come verificato sopra.

## Variabili che incidono realmente sul netto — cosa aggiungiamo e perché

| Variabile | Incide sul netto? | Fonte | Decisione |
|---|---|---|---|
| Regione di residenza | Sì, molto (addizionale regionale varia 0-3%+ per regione, scaglioni diversi) | Dip. Finanze, stesso tool già usato per Lombardia (`reg=1..21`) | **Aggiungi**: tutte le 20 regioni + nota su Trentino-Alto Adige (statuto speciale, verificare in implementazione se il tool copre le province autonome o serve trattamento a parte) |
| Comune di residenza | Sì (addizionale comunale 0-0,9%, soglie di esenzione diverse) | Dip. Finanze, stesso tool, comune per comune (nessun dataset bulk trovato) | **Aggiungi parzialmente**: capoluoghi di regione (~20, sourced singolarmente) + campo "aliquota e soglia personalizzate" per chi non trova il proprio comune. Copertura dichiarata, non finta. |
| Coniuge a carico | Sì | Art. 12 c.1 lett. a)+b) TUIR, testo letto integralmente | **Aggiungi**: Sì/No |
| Figli 21-30 non disabili a carico | Sì | Art. 12 c.1 lett. c) TUIR (i minori di 21 sono coperti da assegno unico, non da questa detrazione) | **Aggiungi**: numero + quota a carico (50%/100%, come il competitor) |
| Altri familiari a carico | Sì | Art. 12 c.1 lett. d) TUIR | **Aggiungi**: numero |
| Giorni di lavoro nell'anno | Sì, sostanzialmente per chi non lavora l'anno intero | Art. 13 c.1 e art. 12 c.3 TUIR ("rapportata al periodo"); circ. AdE 4/E per il meccanismo distinto della somma integrativa | **Aggiungi**: default 365, editabile 1-365 |
| Welfare / fringe benefit | Sì (riduce l'imponibile fino a soglia, poi probabile cliff se superata) | Art. 51 c.3 TUIR, soglie 1.000€/2.000€ (con figli) da L. 207/2024, meccanismo da confermare su circ. AdE 35/2022 + aggiornamento 2024 | **Aggiungi**: importo annuo |
| Mensilità | Sì (solo ripartizione, non il totale annuo) | Già presente | **Correggi il default**: 13 invece di 14 — 13 è universale per CCNL, 14 è specifico di alcuni settori; senza un CCNL dichiarato, 13 è la scelta più difendibile |
| Aliquota INPS (9,19%/9,49%) | Sì | Già presente | Resta |
| Settore (costo azienda) | Solo sul costo azienda, non sul netto dipendente | Già presente | Resta |
| Tempo determinato/indeterminato | **No** (verificato due volte, fonti indipendenti) | — | Non esposto: sarebbe un controllo che non cambia mai nulla |
| Apprendistato | **Sì, molto**: aliquota INPS lavoratore 5,84% flat vs 9,19%/9,49% standard | Art. 1 c.773 L. 296/2006, msg. INPS 3618/2023 (confermato su 3 fonti indipendenti, fonte primaria da rileggere in implementazione) | **Aggiungi**: selettore "Tipo di contratto" (indeterminato standard / apprendistato) |
| Premi di risultato, welfare oltre il fringe benefit semplice | Sì | Regime a imposta sostitutiva 5-10%, soglie e requisiti di premialità distinti | Resta escluso, dichiarato |
| Sterilizzazione detrazioni >200k, INAIL, conguaglio, massimale contributivo | Marginali o fuori portata di un form semplice | — | Restano esclusi, dichiarati (invariato da v1) |

## Architettura — nuovi moduli

```
src/lib/tax/
  periodo.ts                 NUOVO — utility per il rapporto "giorni lavorati / 365",
                              riusata da detrazioni.ts, detrazioniFamiliari.ts, bonus.ts.
                              Due meccaniche distinte, non da confondere:
                              (a) detrazioni art.12/13: si calcola l'importo pieno sul
                                  reddito annuo, POI si moltiplica per giorni/365
                              (b) somma integrativa: si annualizza il reddito per
                                  scegliere lo scaglione, POI si applica % al reddito
                                  EFFETTIVO del periodo (meccanica art. 1 c.5 L.207/2024,
                                  già verificata sugli esempi numerici della circ. 4/E)
  detrazioniFamiliari.ts     NUOVO — coniuge a carico, figli 21-30 non disabili,
                              altri familiari (art. 12 TUIR, c.1 lett. a/b/c/d)
  welfare.ts                 NUOVO — fringe benefit, soglia 1.000/2.000€, cliff se superata
  contratto.ts                NUOVO — risolve l'aliquota INPS effettiva dal tipo di
                              contratto: indeterminato (9,19%/9,49% selezionabile) o
                              apprendistato (5,84% flat, non selezionabile insieme
                              all'altra opzione)
  regioni-2026.ts            NUOVO — tabella addizionale regionale per tutte le regioni
                              (sostituisce l'attuale ADDIZIONALE_REGIONALE_LOMBARDIA_2026
                              con un record Regione → scaglioni)
  comuni-2026.ts              NUOVO — capoluoghi di regione con aliquota/soglia comunale
                              sourced singolarmente + tipo per l'input manuale
  detrazioni.ts               MODIFICA — cabla esplicitamente il floor 690/1.380
                              (Math.max), integra il fattore periodo
  bonus.ts                    MODIFICA — integra il fattore periodo nel meccanismo
                              corretto (vedi periodo.ts)
  calcola.ts                  MODIFICA — orchestratore esteso: somma le nuove
                              detrazioni familiari nella riduzione dell'IRPEF lorda,
                              applica il welfare come riduzione dell'imponibile,
                              usa regione/comune scelti invece di costanti fisse
  constants-2026.ts            MODIFICA — rimuove i dati Lombardia-only spostati in
                              regioni-2026.ts/comuni-2026.ts, aggiunge WELFARE_2026
  types.ts                    MODIFICA — Input si espande: regione, comune (id o
                              custom {aliquota, soglia}), coniugeACarico, figliACarico
                              (count + quota), altriFamiliariACarico, giorniLavorati,
                              welfareAnnuo
  __tests__/                  nuovi file per ogni nuovo modulo, stesso pattern
                              test-first già in uso
```

## UI — redesign del form

La critica principale sulla v1 non era la scelta di semplificare (il brief la
autorizza), ma **nascondere** le assunzioni in un accordion chiuso invece di
esporle come parametri modificabili. Il form v2 sostituisce l'attuale singolo
campo RAL + "Parametri avanzati" collassato con una struttura a sezioni, tutte
visibili (nessun accordion per i dati che cambiano il risultato):

1. **RAL** — invariato, in evidenza
2. **Situazione lavorativa** — mensilità (default 13), giorni lavorati nell'anno
   (default 365), tipo di contratto (indeterminato standard / apprendistato,
   default indeterminato — determina anche l'aliquota INPS: 9,19%/9,49%
   selezionabili solo se non apprendistato, altrimenti fissa 5,84%)
3. **Residenza fiscale** — regione (default Lombardia, dropdown tutte le regioni),
   comune (dropdown capoluoghi della regione scelta + opzione "altro comune" che
   apre aliquota/soglia manuali; default Milano)
4. **Famiglia** — coniuge a carico (default No), figli 21-30 non disabili a carico
   con quota (default 0), altri familiari a carico (default 0)
5. **Welfare** — fringe benefit annuo (default 0)

Il pannello "Settore (costo azienda)" resta separato perché non tocca il netto
del dipendente, solo il costo azienda — via un piccolo accordion secondario in
quella sezione, non nel form principale.

Il waterfall e "Come si calcola" restano com'erano nella v1 (già validati),
aggiornati per includere le nuove voci (detrazione coniuge, detrazione figli,
detrazione altri familiari, welfare) con fonte obbligatoria come le altre.

## Verifica

- Test-first per ogni nuovo modulo, stesso pattern della v1 (Vitest).
- Golden test aggiuntivo: confronto diretto con gli screenshot del competitor
  fornito dall'utente (stessi input dove possibile: RAL, regione, mensilità,
  figli a carico) — è un benchmark più ricco della v1 perché copre più variabili.
- Verifica esplicita che il floor 690/1.380 sia ora cablato (test dedicato che
  fallirebbe se il `Math.max` venisse rimosso).
- Verifica che il cambio di default mensilità (13) non rompa i test esistenti che
  assumevano 14 — vanno aggiornati esplicitamente, non lasciati a caso.
- `npx vitest run`, `npx tsc --noEmit`, `npm run build`, verifica reale in browser
  del nuovo form (tutte le sezioni, cambio regione → comuni disponibili si
  aggiornano, inserimento manuale comune, figli a carico che cambiano il netto).

## Consegna

Stesso repo (`Miccio13/calcolatore-ral-netto-jethr`), stesso deploy
(`calcolatore-ral-netto-jethr.vercel.app`, proxato anche su
`mariglianosimone.design/AI-builder-jethr`). README e PDF metodologico da
aggiornare per riflettere il nuovo modello — la generazione del PDF resta
automatica da `fonti.ts`/`constants-2026.ts` (ora arricchiti), quindi l'aggiornamento
è in gran parte automatico una volta aggiornato il codice.

## Fonte da rileggere in forma primaria prima di scrivere il codice

- **Apprendistato, aliquota 5,84%** — art. 1 c.773 L. 296/2006 e msg. INPS
  3618/2023. Confermato su tre fonti secondarie indipendenti con cifra e
  riferimento identici, ma il fetch diretto delle pagine INPS non è riuscito
  tecnicamente in questa sessione (stesso problema di rendering di altri PDF/pagine
  INPS già incontrato). Va riletto sulla fonte primaria prima di entrare in
  `fonti.ts`/`constants-2026.ts`, stesso standard delle altre voci del progetto.

## Fonti nuove raccolte in questa fase

- [**Art. 12 TUIR — Detrazioni per carichi di famiglia**](https://www.agenziaentrate.gov.it/portale/documents/20143/255456/Articolo+12+del+Dpr+917_1986_articolo_12_Tuir.pdf/7224c483-95a6-f2b3-a2be-68fdf30c5b54) —
  testo integrale letto: coniuge a carico (c.1 lett. a, 3 scaglioni + micro-bonus
  b), figli a carico (c.1 lett. c, 950€/1.220€ under-3/400€ disabili/+200€ oltre
  il terzo figlio, rapporto su base 95.000€), altri familiari (c.1 lett. d, 750€
  pro-quota, rapporto su base 80.000€), soglia "a carico" 2.840,51€ (c.2),
  rapportato a mese (c.3).
  → Nota: il testo di questo PDF statico è la versione TUIR non ancora aggiornata
  con le ultime modifiche su assegno unico (D.Lgs. 230/2021): per i figli la
  detrazione qui descritta vale solo per la fascia 21-30 anni non disabili, gli
  under-21 sono coperti da assegno unico. Da confermare il testo vigente più
  recente in fase di implementazione.
- **Fringe benefit / welfare** — soglie 1.000€ (generale) / 2.000€ (con figli a
  carico) confermate per 2025-2027 da L. 207/2024. Meccanismo cliff (superamento
  soglia → intero importo tassato, non solo l'eccedenza) da confermare puntualmente
  su circ. AdE 35/2022 e relativo aggiornamento 2024/2025 prima di implementare.
- **Addizionale regionale, tutte le regioni** — stesso tool del Dip. Finanze già
  usato per la Lombardia (`addregirpef.php?reg=N`, N=1..21), da fetchare regione
  per regione in fase di implementazione, ciascuna con fonte e data di
  consultazione tracciate in `fonti.ts`.
- **Addizionale comunale, capoluoghi di regione** — stesso meccanismo già usato
  per Milano, da ripetere per gli altri ~19 capoluoghi in fase di implementazione.
  Nessun dataset bulk trovato sul sito del Dip. Finanze per tutti gli 8.000
  comuni italiani — copertura dichiaratamente parziale, con fallback manuale.

## Ordine di esecuzione

1. `periodo.ts` + test — la utility di rapportamento, usata ovunque dopo.
2. Fix del floor 690/1.380 in `detrazioni.ts` (cablaggio esplicito, test dedicato).
3. `detrazioniFamiliari.ts` + test (coniuge, figli, altri familiari).
4. `welfare.ts` + test, dopo aver confermato il meccanismo cliff sulla fonte.
5. `contratto.ts` + test, dopo aver riletto la fonte primaria sull'aliquota 5,84%.
6. Ricerca e popolamento `regioni-2026.ts` (20 regioni) e `comuni-2026.ts`
   (capoluoghi), ciascuno con fonte tracciata.
7. `types.ts` esteso, `calcola.ts` aggiornato con la nuova catena.
8. Redesign `InputPanel` in sezioni visibili (RAL, lavoro, residenza, famiglia,
   welfare), aggiornamento `Waterfall`/`ComeSiCalcola` per le nuove voci.
9. Aggiornamento test esistenti impattati dal cambio di default mensilità.
10. Verifica end-to-end, confronto con lo screenshot del competitor.
11. Aggiornamento README + rigenerazione PDF metodologico.
12. Commit, push, verifica deploy.
