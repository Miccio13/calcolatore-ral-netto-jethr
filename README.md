# Calcolatore RAL → Netto — Jet HR

Prototipo per la selezione **Product Builder @ Jet HR**. Data una RAL, calcola netto
annuo, netto mensile e tutte le voci trattenute/aggiunte al lordo, con la fonte
normativa di ogni singolo calcolo.

**[→ Vedi il PDF metodologico completo](./docs/Jet-HR_Calcolatore-RAL-Netto_Metodologia.pdf)**
per il modello dettagliato, le fonti, le semplificazioni e la validazione.

## Il caso standard

Impiegato a tempo indeterminato, residente a Milano, nessun familiare a carico né
agevolazione particolare, anno d'imposta 2026, contratto attivo per l'intero anno.
È il caso descritto nel brief; ogni altra combinazione esce dallo scope dichiarato.

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
- Le **semplificazioni sono dichiarate**, non nascoste. Vedi la sezione dedicata più
  sotto e, in dettaglio, il PDF metodologico.

## Il modello di calcolo

```
RAL
 − contributi INPS c/dipendente        9,19% (9,49% se azienda con CIGS/FIS >15 dip.)
                                        +1% sulla quota oltre 56.224 € (1ª fascia
                                        pensionabile 2026, circ. INPS 6/2026)
 = IMPONIBILE FISCALE
 → IRPEF LORDA, scaglioni 2026:         23% ≤ 28.000
                                        33% 28.000–50.000  (ridotta dal 35% dalla
                                        L. 199/2025, art. 1 c.3)
                                        43% > 50.000
 − detrazione lavoro dipendente         art. 13 c.1 TUIR, tabella circ. AdE 4/E 2025
 − ulteriore detrazione cuneo fiscale   art. 1 c.6 L. 207/2024
 = IRPEF NETTA (mai negativa)
 − addizionale regionale (Lombardia)    art. 72 L.R. 10/2003, progressiva 1,23%-1,73%
 − addizionale comunale (Milano)        delibera n. 46/2020, 0,80% con soglia 23.000 €
 + trattamento integrativo              art. 1 c.1 D.L. 3/2020, mod. L. 207/2024 c.3
 + somma integrativa cuneo fiscale      art. 1 c.4-5 L. 207/2024
 = NETTO ANNUO
   netto mensile = netto annuo / mensilità (12 | 13 | 14)
```

Sezione separata, non parte della catena netto:

```
RAL + contributi c/azienda (29,4% terziario | 32% industria) + TFR (RAL/13,5)
 = COSTO AZIENDA
   cuneo fiscale % = (costo azienda − netto annuo) / costo azienda
```

## Quattro cose che i calcolatori online spesso sbagliano

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

## Fuori scope, dichiarato

Familiari a carico, premi di risultato e welfare, fringe benefit, addizionali di
comuni diversi da Milano, sterilizzazione delle detrazioni per redditi oltre
200.000 €, INAIL nel costo azienda (variabile per rischio di settore), ratei di
13ª/14ª con tassazione separata, conguaglio di fine anno, part-time e periodi
infra-annuali, massimale contributivo per iscritti dal 1996 (122.295 € nel 2026,
rilevante solo su RAL molto alte).

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind v4**
- **Vitest** — 74 test sul motore di calcolo: unitari per modulo, end-to-end sui
  casi standard, continuità sui valori di soglia, regola dei domini istituzionali
- **motion** per l'animazione dei numeri
- Font **Wix Madefor Display** via `next/font/google` (self-hosted)

## Architettura

```
src/lib/tax/
  fonti.ts              Registro unico delle fonti normative
  constants-2026.ts     Parametri normativi 2026, ognuno legato alla sua fonte
  types.ts               Input, Fonte, VoceBreakdown, Risultato
  progressive.ts          Utility per scaglioni progressivi (IRPEF, addizionale regionale)
  inps.ts, irpef.ts, detrazioni.ts, bonus.ts, addizionali.ts, costoAzienda.ts
  calcola.ts              Orchestratore: Input → Risultato
  __tests__/              Un file di test per modulo

src/components/          UI: renderer puro dell'output del motore
src/lib/format.ts        Formattazione numerica scritta a mano (vedi nota sotto)
docs/                     PDF metodologico e relativo sorgente HTML
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
npx vitest run     # 74 test
npx tsc --noEmit
npm run build
npm run dev         # verifica manuale su http://localhost:3000
```

## Non costituisce consulenza fiscale

Prototipo per un caso semplice e standard. Ogni altra combinazione (part-time,
contratti infra-annuali, altri redditi, agevolazioni) richiede logiche non coperte
qui — discusse volentieri in un eventuale colloquio.
