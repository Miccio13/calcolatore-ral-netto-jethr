# Audit comprensivo — ragionamento fiscale e fonti (7 agosto 2026)

Audit del motore fiscale (`src/lib/tax/`) e delle fonti dichiarate (`fonti.ts`, `docs/fonti.html`, `docs/metodologia.html`), anno d'imposta 2026. Verifica esterna su fonti primarie (Normattiva testo vigente, GU, circolari AdE/INPS, prospetti Dipartimento Finanze per tutte le 21 regioni e gli 11 comuni) + triage di coerenza interna. **Solo report: nessun fix applicato.** Baseline: 121/121 test verdi.

## Verdetto sintetico

L'impianto è solido: scaglioni IRPEF, cuneo fiscale, trattamento integrativo (fascia ≤15k), detrazioni familiari, INPS (aliquote, prima fascia, massimale come valore), welfare, TFR, 11/11 comuni e 17/21 regioni sono **conformi alle fonti primarie**. Ma l'audit ha trovato **4 errori che producono numeri sbagliati per l'utente (P0)** — uno dei quali colpisce il caso di default in landing — più una serie di claim documentali smentiti dalle fonti (P1) e questioni di igiene (P2).

---

## P0 — Errori di calcolo (numeri sbagliati mostrati all'utente)

### P0.1 Manca il +65 € della detrazione lavoro dipendente (art. 13 c.1.1 TUIR)
Il testo vigente dell'art. 13 ([Normattiva, vigenza 1-1-2025 → 31-12-2026](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art13!vig=)) al comma 1.1 recita: *"La detrazione spettante ai sensi del comma 1 è aumentata di un importo pari a 65 euro, se il reddito complessivo è superiore a 25.000 euro ma non a 35.000 euro."* Il motore non lo applica mai (grep negativo su `src/lib/tax/`).
**Impatto**: netto sottostimato di 65 €/anno per tutti i redditi complessivi 25.000-35.000 — **inclusa la RAL di default 35.000** (reddito ≈ 31.783): il netto in landing (25.967 €) è sbagliato, così come il valore pinnato in metodologia §5/§7.
**Fix proposto**: nuovo ramo in `detrazioni.ts` (`calcolaDetrazioneLavoroDipendente`), costante in `constants-2026.ts`, chiarire se il +65 vada rapportato al periodo (la circolare 4/E lo tratta come importo in misura fissa non rapportata — da verificare in fase di fix), test dedicati, rigenerare metodologia.

### P0.2 Friuli-Venezia Giulia: meccanica sbagliata
Nel codice è modellata come progressiva a scaglioni marginali (0,70% ≤15k, 1,23% oltre). Il prospetto DF 2026 ([addregirpef reg=07](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=07&anno=2026)) e [regione.fvg.it](https://www.regione.fvg.it/rafvg/cms/RAFVG/GEN/tributi/FOGLIA8/) dicono altro: aliquota unica 1,23% **sull'intero imponibile**, ridotta a 0,70% (sempre sull'intero) per redditi ≤15.000.
**Impatto**: sottostima di 0,53% × 15.000 = **79,50 €** per ogni contribuente FVG sopra 15.000 €.
**Fix proposto**: nuova meccanica in `addizionali.ts` (due aliquote piene per fascia, sull'intero imponibile) o modellazione come doppio `sogliaFlat`; test.

### P0.3 Lazio: manca la clausola 2026 per i redditi ≤28.000
La LR Lazio 20/31.12.2025 prevede per il 2026: redditi complessivi ≤28.000 → **1,73% sull'intero imponibile** (non lo scaglione marginale 3,33% sopra 15k), più detrazione di 60 € per la fascia 28-30k. Fonti: [DF reg=08](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=08&anno=2026), [regione.lazio.it (PDF Addizionale 2026)](https://www.regione.lazio.it/sites/default/files/2026-01/Addizionale-regionale-2026.pdf).
**Impatto**: sovrastima fino a ~208 € nella fascia 15-28k, la più popolata.
**Fix proposto**: meccanica condizionale sul reddito complessivo in `addizionali.ts`/`regioni-2026.ts`; test.

### P0.4 Soglia welfare 2.000 € legata ai soli "figli 21-30"
`calcola.ts:60` deriva `haFigliACarico` da `figliACarico > 0`, dove il campo UI rappresenta i figli 21-30 (quelli che danno detrazione). Ma l'art. 1 c.390-391 L. 207/2024 ([GU](https://www.gazzettaufficiale.it/eli/id/2024/12/31/24G00229/sg)) lega la soglia 2.000 € alle **condizioni dell'art. 12 c.2 TUIR** (figlio fiscalmente a carico), che includono gli under-21 coperti da assegno unico (conferma AdE, circ. 23/E/2023 sulla norma gemella).
**Impatto**: un utente con soli figli piccoli e welfare 1.000-2.000 € vede l'intero importo tassato quando invece è esente.
**Fix proposto**: input separato (`haFigliFiscalmenteACarico: boolean`) in `types.ts` + UI, sganciato dal contatore delle detrazioni; test.

---

## P1 — Claim documentali smentiti dalle fonti (codice quasi sempre giusto, docs/fonti no)

1. **Claim sul troncamento falso** — `detrazioni.ts:22-24` afferma che il troncamento a 4 decimali "non compare né nella circolare né nell'art. 13". L'art. 13 **c.6** vigente lo prevede testualmente (*"lo stesso si assume nelle prime quattro cifre decimali"*), e l'art. 12 **c.4** lo replica per le detrazioni familiari. Impatto ai centesimi, ma il claim va rovesciato e il troncamento implementato (`Math.trunc(r*10000)/10000` sul rapporto) in `detrazioni.ts` e `detrazioniFamiliari.ts`.
2. **Fonte apprendistato errata** — il 5,84% è giusto, ma l'art. 1 c.773 L. 296/2006 ([testo GU su parlamento.it](https://www.parlamento.it/parlam/leggi/06296l.htm)) disciplina solo il 10% **a carico del datore**; la base normativa della quota apprendista è l'**art. 21 c.6 L. 41/1986**, come indicato dal [msg. INPS 3618/2023](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2023.10.messaggio-numero-3618-del-17-10-2023_14297.html). Il dubbio auto-dichiarato in `fonti.ts:156` era fondato. Fix: correggere la voce `apprendistato` in `fonti.ts`.
3. **PDF art. 13 storico** — l'URL in `fonti.ts:61` (`tuirArt13`) punta a un PDF AdE "in vigore dal 1 gennaio 2008" (importi 1.840/1.338, soglie 8k/15k/55k): documenta la norma previgente. Sostituire con il testo vigente Normattiva (la variante `~art13!vig=` risponde con contenuto reale).
4. **"FIS" è in realtà CIGS** — il +0,30% che porta il 9,19% a 9,49% è il contributo ordinario **CIGS** (imprese >15 dipendenti, [lavoro.gov.it](https://www.lavoro.gov.it/temi-e-priorita/ammortizzatori-sociali/focus-on/CIGS/Pagine/Cassa-integrazione-guadagni-straordinaria-CIGS)); il FIS è 0,50/0,80% con quota lavoratore ≈0,267% e soglia >5 dipendenti. Numeri e soglia del codice giusti, etichetta sbagliata in `constants-2026.ts` (`aliquotaConFis`), metodologia §4 e UI.
5. **Massimale 122.295 € presentato come parametro attivo** — dichiarato in `constants-2026.ts:79` ed esposto in metodologia §4, ma mai applicato nel motore (`inps.ts` calcola fino a Infinity): sopra 122.295 € i contributi crescono senza limite. Valore confermato dalla [circ. INPS 6/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html) (122.295,40 → 122.295, iscritti post-1995). Decidere: implementarlo (con caveat ante/post-1996) o spostarlo esplicitamente tra le esclusioni ovunque.
6. **Trattamento integrativo, fascia 15-28k non dichiarata** — il D.L. 3/2020 vigente prevede anche la fascia 15.000-28.000 (importo = eccedenza delle detrazioni sull'imposta lorda, max 1.200 — circ. 4/E nota 9). Il calcolatore modella solo ≤15.000: semplificazione accettabile ma assente da metodologia §6.
7. **Commento art. 433 c.c. obsoleto** — `detrazioniFamiliari.ts:~115` cita il testo previgente; la lett. d) vigente copre solo *"ciascun ascendente che conviva con il contribuente"*. Formula corretta, commento (e UI se parla di "altri familiari" generici) da aggiornare.
8. **Fonte IRPEF divergente** — `irpef.ts` cita `ldb2026`, metodologia §3 attribuisce ad art. 11 TUIR (classificata "di contesto" in fonti.html). Allineare.
9. **Benchmark §7 senza riferimenti** — `stipendionettocalcolatore.it` citato senza URL né data; lo scarto −0,18% a 60.000 € non è spiegato (nota: almeno 65 € ora si spiegano col P0.1). Rifare i benchmark dopo i fix.

## P2 — Igiene, robustezza, semplificazioni da rendere esplicite

1. **Doppi punti di verità** contro il claim "nessun magic number altrove" (`constants-2026.ts:3-4`): aliquote 0,0919/0,0949 ricodificate come letterali in `types.ts:8,38`; costanti `1910`/`1190` hardcoded in `detrazioni.ts:49,52`.
2. **Fallback silenziosi** — regione ignota → `REGIONI_2026[0]` = Abruzzo (aliquote alte), comune ignoto → Milano (`calcola.ts:99,104`). Meglio un errore esplicito o il default dichiarato (lombardia/milano).
3. **Annualizzazione dell'1% aggiuntivo** — la circ. 6/2026 prescrive la mensilizzazione (tetto 4.685 €/mese); il codice annualizza. Equivalente solo con retribuzione uniforme su 12 mensilità: da dichiarare in metodologia.
4. **1% e apprendisti** — la lettera della circ. 6/2026 (contributo dovuto se aliquota lavoratore <10%) includerebbe l'apprendista; il codice lo disattiva per prudenza. Caso raro (apprendista >56.224 €), ma la scelta va dichiarata — e semmai la lettura prudenziale sarebbe applicarlo.
5. **Correttivo 75 € non rapportato al periodo** — la norma lo vuole "rapportato al periodo di lavoro nell'anno"; `bonus.ts:36` usa 75 pieni nella capienza. Edge case anni parziali.
6. **Base della somma integrativa esclude il welfare imponibile** — `calcola.ts:121-125` passa `redditoLavoroDipendentePeriodo` (senza welfare), ma il fringe benefit sopra soglia è reddito di lavoro dipendente ex art. 51 c.1. Da verificare e comunque documentare.
7. **Welfare dentro `redditoComplessivo`** (`calcola.ts:63`) — corretto fiscalmente, ma l'effetto collaterale (welfare sopra soglia riduce detrazioni e bonus) non è né documentato né testato.
8. **Detrazioni regionali materiali non modellate** — Trento (deduzione 30.000 € → esenzione de facto ≤30k, fino a ~369 €), Bolzano (detrazione 430,50 € → esenzione de facto fino a ~35k), Umbria (maggiorazioni non applicate ≤28k + detrazione 150 €, sovrastima fino a ~300 €). La riga generica "nessuna agevolazione regionale" in `regioni-2026.ts:19-22` è troppo tenue per questi tre casi: o modellarle, o segnalarle in UI per quelle regioni.
9. **Input degeneri** — RAL 0 → `NaN` in `percentualeRal` (`inps.ts`, `irpef.ts:19`); nessun guard in `calcola()`.
10. **Comuni: 2026 per trascinamento** — per Roma, Napoli, Torino, Genova, Firenze, Venezia e Cagliari il DF non espone ancora la riga 2026 (vale il 2025 ex art. 1 c.169 L. 296/2006). Corretto, ma annotare nel dataset chi è "deliberato 2026" (Milano, Bologna, Bari, Palermo) e chi no. Palermo da ricontrollare a fine anno (aliquota in crescita annuale da piano di riequilibrio).

## Copertura test — lacune da colmare (dopo i fix)

- Nessun test pinna un **netto annuo assoluto** end-to-end (i valori di metodologia §5/§7 non sono asseriti da nessun test — e P0.1 dimostra il costo di questa lacuna).
- 18 regioni e 8 comuni del dataset mai toccati dai test (FVG e Lazio sarebbero stati comunque "verdi" perché i dati erano sbagliati alla fonte: servono test derivati dalle fonti, non dal dataset).
- Mancano: interazione welfare↔detrazioni, apprendistato end-to-end via `calcola()`, giorni parziali via `calcola()`, fallback regione/comune ignoti, RAL 0/negativa, RAL > 122.295.

## Esito verifica esterna per area (dettaglio ✅)

| Area | Esito | Fonte principale |
|---|---|---|
| Scaglioni IRPEF 23/33/43 (L. 199/2025 art. 1 c.3: 35→33) | ✅ | [Normattiva L. 199/2025](https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED) · [GU](https://www.gazzettaufficiale.it/eli/id/2025/12/30/25G00212/SG) |
| Formule art. 13 c.1 (1.955; 1.910+1.190; 1.910; floor 690/1.380 solo 1° scaglione) | ✅ (ma v. P0.1, P1.1) | [Normattiva art. 13 vig.](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art13!vig=) |
| Cuneo fiscale: 7,1/5,3/4,8 ≤20k; ulteriore detrazione 1.000 su 20/32/40k; strutturale, invariato nel 2026; meccanica a due passi | ✅ | [Normattiva L. 207/2024](https://www.normattiva.it/eli/stato/LEGGE/2024/12/30/207/CONSOLIDATED) · [circ. 4/E 2025 (PDF)](https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91) |
| Trattamento integrativo 1.200/15.000/−75 | ✅ (v. P1.6, P2.5) | [Normattiva D.L. 3/2020](https://www.normattiva.it/eli/stato/DECRETO-LEGGE/2020/02/05/3/CONSOLIDATED) |
| Art. 12: coniuge (micro-bonus 29.000-35.200 con gap fino a 40k conforme), figli 21-<30 (950, 95.000+15.000), ascendenti conviventi (750/80.000) | ✅ (v. P1.7) | Normattiva art. 12 vig. |
| INPS: 9,19/9,49 (v. P1.4), prima fascia 56.224, 1% marginale, massimale 122.295 | ✅ valori (v. P1.5, P2.3-4) | [Circ. INPS 6/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html) |
| Apprendistato 5,84% | ✅ valore (v. P1.2) | [Msg. INPS 3618/2023](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2023.10.messaggio-numero-3618-del-17-10-2023_14297.html) |
| Welfare 1.000/2.000 per 2025-2027, soglia non franchigia | ✅ (v. P0.4) | [L. 207/2024 c.390-391 GU](https://www.gazzettaufficiale.it/eli/id/2024/12/31/24G00229/sg) · [circ. 35/E/2022 (PDF)](https://www.agenziaentrate.gov.it/portale/documents/20143/4785312/circolare_welfare_aziendale_+n.+35+del+4+novembre+2022+.pdf/657de91b-6e75-2330-ce10-450e5f7a561b) |
| TFR /13,5 (art. 2120 c.c., L. 297/1982) | ✅ | [art. 2120 c.c. su gazzettaufficiale.it](https://www.gazzettaufficiale.it/atto/serie_generale/caricaArticolo?art.progressivo=0&art.idArticolo=2120&art.versione=5&art.idGruppo=267&art.flagTipoArticolo=2&art.codiceRedazionale=042U0262&art.idSottoArticolo1=10&art.idSottoArticolo=1&art.dataPubblicazioneGazzetta=1942-04-04) — testuale: "divisa per 13,5" |
| Costo azienda 29,4/32% (approssimazione dichiarata) | ✅ ragionevole | composizione FPLD 23,81 + minori |
| Addizionali regionali: 17/21 identiche ai prospetti DF 2026 (tutte le regioni hanno pubblicato il 2026; Campania progressiva confermata; Valle d'Aosta sogliaFlat confermata testualmente) | ✅ tranne FVG/Lazio (P0.2-0.3) e Trento/Bolzano/Umbria (P2.8) | [DF sceltaregione](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/sceltaregione.htm) + pagine reg=01…21 |
| Addizionali comunali: 11/11 conformi, semantica soglia confermata (esenzione totale sotto, intero sopra), Roma 0,9% e Palermo 1,03% (2026) legittimi, Firenze 0,2%/25.000 reale | ✅ (v. P2.10) | prospetti DF `risultato.htm` per comune + siti comunali |

## Ordine di esecuzione suggerito per la sessione di fix

1. P0.1 (+65 €) → rigenerare i numeri di metodologia §5/§7 e rifare i benchmark.
2. P0.2 + P0.3 (FVG, Lazio) → nuova meccanica in `addizionali.ts` + test derivati dalle fonti.
3. P0.4 (welfare/figli) → nuovo input + UI.
4. P1 in blocco (fonti.ts, commenti, etichetta CIGS, troncamento 4 decimali, massimale) → rigenerare i PDF fonti/metodologia.
5. P2 + copertura test (netto end-to-end pinnato, regioni/comuni mancanti, edge case).

## Addendum 9 agosto 2026 — fix applicati

P0.1, P0.2 e P0.3 sono stati corretti (sessione del 9/08). In una seconda passata sono stati chiusi anche i P1 documentali principali: **troncamento a 4 decimali implementato** (`rapporto.ts`, applicato in `detrazioni.ts` e `detrazioniFamiliari.ts` — P1.1), **fonte apprendistato corretta** ad art. 21 c.6 L. 41/1986 (P1.2), **link art. 13 e art. 12 sostituiti** col testo vigente Normattiva al posto dei PDF AdE storici (P1.3), nota "non riletto singolarmente" delle regionali superata, e aggiunte 3 fonti nuove (circ. 4/E/2022 per i 65 €, LR Lazio 20/2025, LR FVG 14/2012). Il **PDF Fonti è stato rigenerato** (20 fonti, verifica raggiungibilità + link cliccabili passata, impaginazione controllata pagina per pagina). **Restano aperti: P0.4, P1.4-P1.6, P1.8-P1.9 e i P2.** La Metodologia è stata rigenerata coi numeri post-fix (commit `a60b29f`, netto default 26.032,22 €).
- **P0.1**: maggiorazione 65 € implementata in `detrazioni.ts` + `constants-2026.ts` — applicata dopo il riproporzionamento, per intero (conferma testuale circ. AdE 4/E del 18/02/2022 §1.2.1: *"deve essere corrisposto per intero... senza effettuare alcun ragguaglio al periodo di lavoro nell'anno"*; introdotta dalla L. 234/2021, strutturale). Netto default 35.000: 25.967,22 → **26.032,22 €**. I numeri pinnati in metodologia §5/§7, rimasti temporaneamente stale, sono stati rigenerati nel commit `a60b29f`.
- **P0.2**: FVG modellata col nuovo tipo `fasceIntere` (aliquota della fascia sull'intero imponibile: 0,70% ≤15k, 1,23% sopra).
- **P0.3**: Lazio modellata col nuovo tipo `progressivoConClausola` (1,73% sull'intero per imponibili ≤28.000; scaglioni marginali sopra, con detrazione 60 € per 28.000-30.000 — LR 20/2025 art. 2 c.2-3).
- Test: 121 → 130, tutti verdi; typecheck, lint e build puliti. Second opinion esterna (GPT) sui tre fix: nessun bug rilevato; i rilievi residui coincidono coi P2 già tracciati (input degeneri).

## Nota di metodo sulle fonti

Ogni verdetto del report poggia su fonti istituzionali: normattiva.it, gazzettaufficiale.it, agenziaentrate.gov.it, inps.it, finanze.gov.it, lavoro.gov.it, parlamento.it (testo GU della L. 296/2006), regione.lazio.it, regione.fvg.it. Portali secondari (es. CGIL Lazio, calcolonetto.it) sono stati usati dagli agenti di ricerca **solo come conferma incrociata**, mai come base di un verdetto ❌/⚠️. Due punti in cui il fetch diretto della fonte era inizialmente fallito sono stati richiusi su fonte ufficiale:
- **Circ. INPS 6/2026** (56.224 € prima fascia; 122.295 € massimale): la pagina inps.it è una SPA non leggibile via fetch, ma i valori sono confermati da ricerca ristretta al dominio inps.it ([pagina circolare](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html), [news inps.it minimali 2026](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.lavoratori-dipendenti-limite-minimo-di-retribuzione-giornaliera-2026.html), documento su servizi2.inps.it idunivoco=13700).
- **Art. 2120 c.c.** (divisore 13,5): testo integrale letto su gazzettaufficiale.it (link in tabella).

Avvertenza tecnica per gli aggiornamenti futuri: normattiva.it blocca i fetch in formato ELI (HTTP 409) ma risponde con il testo reale nella variante URN `uri-res/N2Ls?urn:nir:...~artN!vig=` per gli articoli di legge (non per il codice civile, dove funziona invece `caricaArticolo` su gazzettaufficiale.it); i prospetti DF regionali richiedono il codice regione a due cifre (`reg=07`, non `reg=7`).

---
*Audit eseguito il 7 agosto 2026. Verifiche condotte su Normattiva (testo vigente), Gazzetta Ufficiale, circolari AdE 4/E-2025 e 35/E-2022, circolare INPS 6/2026, messaggio INPS 3618/2023, prospetti del Dipartimento delle Finanze per tutte le 21 entità regionali e gli 11 comuni del dataset. I claim critici (art. 13 c.1.1 e c.6, PDF storico 2008) sono stati riverificati direttamente sulla fonte primaria, non solo tramite subagenti.*
