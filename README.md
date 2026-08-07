# Calcolatore RAL → Netto — Jet HR

Prototipo per la selezione **Product Builder @ Jet HR**. Data una RAL, calcola netto
annuo, netto mensile e tutte le voci trattenute/aggiunte al lordo, con la fonte
normativa di ogni singolo calcolo — e lascia all'utente il controllo di ogni
variabile che incide davvero sul risultato, non solo del caso base.

**[→ Vedi il PDF metodologico completo](./docs/Jet-HR_Calcolatore-RAL-Netto_Metodologia.pdf)**
per il modello dettagliato, le fonti, le semplificazioni e la validazione.

## Il caso di default, non l'unico caso

Il brief suggerisce come esempio: impiegato a tempo indeterminato, residente a
Milano, nessuna agevolazione particolare. Questo resta il **prefilled** del
calcolatore — ma ogni variabile che incide realmente sul netto è personalizzabile:

- **Tipo di contratto**: tempo indeterminato (default) o apprendistato — cambia
  l'aliquota INPS del lavoratore (9,19%/9,49% → 5,84% flat)
- **Regione**: tutte le 20 regioni + le 2 province autonome
- **Comune**: 11 capoluoghi verificati singolarmente, più inserimento manuale
  (aliquota e soglia) per gli altri
- **Famiglia**: coniuge a carico, figli 21-30 non disabili a carico (con quota
  50%/100%), altri familiari a carico — art. 12 TUIR
- **Welfare / fringe benefit**: importo annuo, con la soglia di esenzione e il
  meccanismo di superamento corretti
- **Giorni lavorati nell'anno**: per chi non lavora l'intero anno
- **Mensilità**: 12, 13 (default) o 14

Quello che **non** è esposto come parametro: il tempo determinato. Verificato —
due volte, con fonti indipendenti — che non altera nessun numero rispetto al
tempo indeterminato in questo modello (vedi sotto). Un controllo che non cambia
mai nulla sarebbe peggio di non averlo.

## Perché questo approccio

Lo scopo dichiarato dell'esercizio non è produrre un calcolatore fiscale completo —
impossibile in un prototipo — ma dimostrare **ricerca delle fonti**, **capacità di
strutturare l'informazione** e **controllo reale sulla logica implementata**. Di
conseguenza:

- Il valore sta nel **motore di calcolo** (`src/lib/tax/`), non nella UI. La UI è un
  renderer puro del suo output.
- **Ogni voce del calcolo cita la norma che la impone**, con link diretto alla fonte —
  mai un portale fiscale commerciale, sempre un documento istituzionale (Normattiva,
  Agenzia delle Entrate, Dipartimento delle Finanze, INPS). Il tipo TypeScript rende
  la fonte un campo obbligatorio: il compilatore impedisce di dimenticarla.
- Le **semplificazioni sono dichiarate**, non nascoste — e visibili nella UI, non
  solo in un accordion in fondo alla pagina.
- Le **assunzioni sono verificate**, non date per scontate: durante lo sviluppo è
  emerso un bug reale (un floor normativo definito ma mai applicato nel codice) e
  una scoperta contro-intuitiva (un effetto soglia dove il netto scende pur salendo
  la RAL) — entrambi documentati, non nascosti.

## Il modello di calcolo

```
RAL
 − contributi INPS c/dipendente        9,19%/9,49% standard, o 5,84% flat se
                                        apprendistato (art. 1 c.773 L. 296/2006)
                                        +1% oltre 56.224 € (solo regime standard)
 + welfare sotto soglia                 esente fino a 1.000-2.000 €, si somma al netto
 + welfare sopra soglia → imponibile   soglia superata: l'INTERO importo tassato
 = IMPONIBILE FISCALE
 → IRPEF LORDA, scaglioni 2026:         23% ≤ 28.000 | 33% 28.000–50.000 | 43% > 50.000
 − detrazione lavoro dipendente         art. 13 c.1 TUIR, rapportata al periodo lavorato
 − detrazione coniuge a carico          art. 12 c.1 lett. a)+b) TUIR
 − detrazione figli 21-30 a carico      art. 12 c.1 lett. c) TUIR
 − detrazione altri familiari a carico  art. 12 c.1 lett. d) TUIR
 − ulteriore detrazione cuneo fiscale   art. 1 c.6 L. 207/2024
 = IRPEF NETTA (mai negativa)
 − addizionale regionale                variabile per regione: progressiva, flat, o soglia+flat
 − addizionale comunale                 soglia di esenzione, poi scaglioni marginali
 + trattamento integrativo              art. 1 c.1 D.L. 3/2020, rapportato al periodo
 + somma integrativa cuneo fiscale      art. 1 c.4-5 L. 207/2024, meccanica a due passi
 = NETTO ANNUO
   netto mensile = netto annuo / mensilità (12 | 13 | 14)
```

Sezione separata, non parte della catena netto:

```
RAL + contributi c/azienda (29,4% terziario | 32% industria) + TFR (RAL/13,5)
 = COSTO AZIENDA
   cuneo fiscale % = (costo azienda − netto annuo) / costo azienda
```

## Cinque cose che i calcolatori online spesso sbagliano (o evitano)

1. **Trattamento integrativo e somma integrativa si sommano al netto**, non sono
   trattenute: sono credito erogato in busta paga, non riduzioni d'imposta. La loro
   base è il reddito di lavoro dipendente, non l'imponibile su cui gira l'IRPEF.
2. **Le addizionali locali** per legge si calcolano sul reddito dell'anno precedente
   e si versano in 11 rate l'anno successivo. In una proiezione annuale si semplifica
   assumendo lo stesso anno d'imposta — dichiarato, non nascosto.
3. **Il netto mensile dipende dalle mensilità del CCNL** (12, 13 o 14). Dividere
   sempre per 12 produce un numero sbagliato.
4. **Appena sopra i 15.000 € di reddito il netto annuo può scendere pur salendo la
   RAL.** Non è un bug: a quella soglia la detrazione lavoro dipendente salta da
   1.955 € a circa 3.100 € (guadagno fiscale parziale, vale solo come sconto
   sull'aliquota marginale), ma si perde interamente il trattamento integrativo di
   1.200 € (soglia netta, non graduale). Il secondo effetto vince sul primo. È un
   effetto soglia reale e documentato della normativa italiana sul lavoro dipendente,
   scoperto scrivendo i test del motore (`calcola.test.ts`), non ipotizzato a tavolino.
5. **Il welfare/fringe benefit ha lo stesso meccanismo a soglia (non a franchigia)**
   delle addizionali comunali: se il valore complessivo supera 1.000 € (2.000 € con
   figli a carico), l'INTERO importo diventa imponibile — non solo l'eccedenza.
   Verificato testualmente sulla circolare AdE 35/E del 2022.

## Fuori scope, dichiarato

Tempo determinato come opzione a sé (verificato che non cambia nessun numero — vedi
sopra); comuni oltre gli 11 capoluoghi verificati singolarmente (nessun dataset bulk
trovato per gli oltre 8.000 comuni italiani, fallback manuale disponibile); premi di
risultato oltre il fringe benefit semplice (regime a imposta sostitutiva distinto);
sterilizzazione delle detrazioni per redditi oltre 200.000 €; INAIL nel costo azienda
(variabile per rischio di settore); ratei di 13ª/14ª con tassazione separata;
conguaglio di fine anno; massimale contributivo per iscritti dal 1996 (122.295 € nel
2026, rilevante solo su RAL molto alte); bonus di +200€ per famiglie con più di tre
figli a carico (richiederebbe conoscere anche i figli under-21 coperti da assegno
unico, non raccolti dal form).

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind v4**
- **Vitest** — 121 test sul motore di calcolo: unitari per modulo, end-to-end sui
  casi standard, continuità sui valori di soglia, regola dei domini istituzionali
- **motion** per l'animazione dei numeri
- Font **Wix Madefor Display** via `next/font/google` (self-hosted)

## Architettura

```
src/lib/tax/
  fonti.ts                  Registro unico delle fonti normative
  constants-2026.ts         Parametri normativi 2026 non geografici
  regioni-2026.ts            Addizionale regionale, tutte le regioni/province autonome
  comuni-2026.ts              Addizionale comunale, capoluoghi verificati
  types.ts                    Input, Fonte, VoceBreakdown, Risultato
  progressive.ts               Utility per scaglioni progressivi (riusata ovunque)
  periodo.ts                    Rapporto al periodo lavorato — due meccaniche distinte
  contratto.ts                   Risolve l'aliquota INPS da tipo di contratto
  inps.ts, irpef.ts, detrazioni.ts, detrazioniFamiliari.ts, bonus.ts,
  addizionali.ts, welfare.ts, costoAzienda.ts
  calcola.ts                      Orchestratore: Input → Risultato
  __tests__/                       Un file di test per modulo

src/components/            UI: renderer puro dell'output del motore, a sezioni
                            visibili (nessun parametro nascosto in accordion)
src/lib/format.ts          Formattazione numerica scritta a mano (vedi nota sotto)
docs/                       PDF metodologico e relativo sorgente HTML
```

### Una nota tecnica non banale: perché `format.ts` non usa `Intl.NumberFormat`

Durante lo sviluppo, `Intl.NumberFormat('it-IT', ...)` ha causato un **mismatch di
idratazione React**: il Node del dev server (SSR) formattava `1855` come `"1,855 €"`
(virgola, dati ICU limitati), mentre il browser (idratazione client) produceva un
output diverso. Il difetto non dipende dal codice ma dai dati ICU disponibili in
ciascun runtime, quindi non è affidabile in produzione. `src/lib/format.ts` implementa
la formattazione italiana (punto per le migliaia, virgola per i decimali) a mano, con
una manipolazione di stringhe deterministica — stesso output ovunque, testato in
`format.test.ts`.

## Verifica

```bash
npm install
npx vitest run     # 121 test
npx tsc --noEmit
npm run build
npm run dev         # verifica manuale su http://localhost:3000
```

## Non costituisce consulenza fiscale

Prototipo che copre una parte ampia — ma non totale — del dominio. Casi rimasti
fuori scope (elencati sopra) richiedono logiche non coperte qui — discusse
volentieri in un eventuale colloquio.
