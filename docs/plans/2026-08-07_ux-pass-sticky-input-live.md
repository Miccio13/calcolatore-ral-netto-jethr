# UX pass — Calcolatore RAL → Netto

## Context

Il motore di calcolo è completo e verificato; quello che manca è l'ergonomia dell'interazione. Tre problemi emersi provando il prototipo:

1. **La card risultati esce dal viewport.** Il pannello nero (netto annuo / mensile / trattenute) sta in mezzo alla pagina: quando scorri per modificare comune, famiglia o welfare non vedi più il numero che stai cambiando. Il feedback del calcolo — il cuore del prodotto — è invisibile proprio mentre agisci sugli input.
2. **Lo zero iniziale sui campi numerici.** `value={welfareAnnuo}` con stato `0` renderizza `"0"`; digitando si ottiene `03213`. Riguarda tutti i campi `type="number"` (welfare, giorni lavorati, figli, altri familiari, aliquota e soglia comune personalizzato).
3. **Il form è submit-only.** `onCalcola` viene invocato solo su submit: cambiare mensilità, comune o fringe benefit non aggiorna nulla finché non si riclicca "Calcola". Nessun affordance segnala che il risultato mostrato è stale.

Esito atteso: si digita, il numero si muove sotto gli occhi, sempre.

File toccati: `src/components/Calculator.tsx`, `src/components/InputPanel.tsx` (unici due; la logica in `src/lib/tax/` non cambia, tranne una label di copy).

---

## 1. Card risultati sticky

`src/components/Calculator.tsx`

- La `<section>` dei KPI vive già dentro il wrapper `<div className="space-y-6">` che contiene tutto il resto della pagina: basta `sticky top-3 z-20` perché resti agganciata per tutto lo scroll di Waterfall, CostoAzienda e ComeSiCalcola.
- **Stato compatto quando è agganciata.** A tutta altezza (con la riga "Aliquota effettiva…") mangia troppo viewport. Sentinella + `IntersectionObserver`:
  - un `<div ref={sentinel} className="h-px" />` immediatamente sopra la section;
  - quando la sentinella esce dalla viewport (`!entry.isIntersecting`) → `stuck = true`;
  - in stato `stuck`: padding ridotto (`p-4`), KPI `text-xl` invece di `text-3xl`, riga aliquota nascosta (`hidden`), griglia forzata a `grid-cols-3` anche su mobile (altrimenti su small screen la card impilata occupa mezzo schermo), ombra `shadow-lg` per staccarla dal contenuto che le scorre sotto.
  - transizione CSS su padding/font-size (`transition-all duration-300`), niente JS di animazione — `AnimatedEuro` già usa `motion` per i numeri e non va toccato.
- Il container `<main>` ha `py-10 sm:py-16`: verificare che con `top-3` la card non finisca sotto il bordo su viewport corti.
- `prefers-reduced-motion`: la transizione è solo di layout, ma usare `motion-reduce:transition-none` per coerenza.

## 2. Fine dello zero iniziale sui campi numerici

`src/components/InputPanel.tsx`

Causa: lo stato è `number`, quindi il campo vuoto è impossibile da rappresentare e `Number(e.target.value) || 0` collassa anche gli input intermedi. Fix: **lo stato dei campi numerici diventa `string`**, il parsing avviene solo alla costruzione dell'`Input`.

- Nuovo componente locale `CampoNumero` (accanto a `Campo` e `Sezione`, stesso file, stesso `selectClass`), che incapsula:
  - `value: string`, `onChange: (v: string) => void`;
  - `inputMode="numeric"` + `type="text"` al posto di `type="number"` → spariscono le frecce spinner (visibili nello screenshot) **e** l'incremento accidentale con la rotellina del mouse, che con una card sticky diventa un rischio concreto mentre si scorre;
  - sanitizzazione `replace(/\D/g, '')` per gli interi (welfare, giorni, figli, familiari, soglia), variante decimale `replace(/[^\d.,]/g, '')` per l'aliquota comunale;
  - opzionale `formattaMigliaia` per welfare e soglia esenzione, riusando `formatNumero` da `@/lib/format` esattamente come già fa il campo RAL (riga 96) — coerenza con l'input principale.
- Alla costruzione dell'`Input`: `Number(stringa) || 0`, con i clamp già presenti (`Math.max(0, …)`, `Math.min(365, …)`). Attenzione a `giorniLavorati`: oggi `Number(e.target.value) || 365` fa saltare il campo a 365 appena lo svuoti — il clamp va applicato **solo** in fase di submit/derivazione, non durante la digitazione.
- Il campo RAL già gestisce correttamente il caso vuoto (`value={ral ? formatNumero(ral) : ''}`) ma tiene stato `number`: allinearlo a stringa per uniformità con gli altri.

## 3. Ricalcolo live

`src/components/InputPanel.tsx` + `src/components/Calculator.tsx`

- L'`Input` viene derivato con `useMemo` dallo stato locale (stessa logica oggi in `handleSubmit`, righe 52-76, estratta in una funzione pura `costruisciInput()`).
- Un `useEffect` con debounce **300 ms** chiama `onCalcola(inputDerivato)`. Un unico debounce per tutti i campi: `AnimatedEuro` anima comunque su 700 ms, quindi i select non risulteranno lenti e si evita di far partire l'animazione a ogni tasto sulla RAL.
- `ral <= 0` → non si propaga nulla e si mantiene l'ultimo risultato valido (evita il flash a zero mentre si cancella il campo per riscriverlo).
- **Il bottone "Calcola" viene rimosso**: con l'aggiornamento live non ha più un'azione da compiere e un bottone che non fa niente è peggio di nessun bottone. Conseguenze:
  - il campo RAL diventa full-width (via il wrapper `flex-col sm:flex-row`);
  - sotto l'input, hint discreto `text-xs text-muted`: "I risultati si aggiornano mentre digiti";
  - il `<form>` resta con `onSubmit={(e) => e.preventDefault()}` per non ricaricare la pagina all'Invio.

## 4. Micro-fix di copy correlati

- **Hint welfare dinamico** (`InputPanel.tsx`, righe 291-294): oggi il testo cita entrambe le soglie sempre. Renderlo reattivo a `figliACarico` — "Esente fino a 2.000 € (hai figli a carico)" / "…1.000 €" — e aggiungere, quando l'importo supera la soglia, una riga in `text-accent`: "Sopra soglia: l'intero importo diventa imponibile". È l'unico punto del calcolatore con un effetto a gradino, e oggi l'utente vede il netto crollare senza capire perché. Soglie da `WELFARE_2026` in `src/lib/tax/constants-2026.ts`, stessa fonte usata da `calcolaWelfare`.
- **Label aliquota effettiva** (`Calculator.tsx`, righe 62-65): `aliquotaEffettiva = totaleTrattenute / ral` (`calcola.ts:164`) mette al numeratore anche l'IRPEF generata dal fringe benefit sopra soglia, mentre il denominatore è la sola RAL → con welfare alto la percentuale sfonda valori assurdi (lo screenshot mostra 72,4% su una RAL di 32k). Correggere il **denominatore** a `risultato.imponibileFiscale + contributi` non è banale senza toccare la semantica; intervento minimo e onesto: quando c'è welfare imponibile, la frase diventa "Aliquota effettiva X% su RAL + fringe benefit imponibile di Y €", calcolando la percentuale sulla base effettivamente tassata. Nessun test di `calcola.ts` cambia se il ricalcolo resta nel componente; se invece si preferisce spostarlo in `calcola.ts`, va aggiornato `src/lib/tax/__tests__/calcola.test.ts`.

---

## Fuori scope (proposte per dopo)

- Collassare le sezioni avanzate (Residenza / Famiglia / Welfare) lasciando visibile la sola RAL: accorcia molto il form, ma è un ridisegno dell'information architecture, non un fix.
- Deep link con i parametri in querystring per condividere una simulazione.

## Verifica

1. `npm test` — la suite Vitest deve restare verde (nessuna modifica alla logica fiscale, salvo il punto 4 se spostato in `calcola.ts`).
2. `npm run build` — build webpack, come da `package.json`.
3. `npm run dev` e verifica reale nel browser (skill `/run` o claude-in-chrome):
   - scorrere fino a "Come si calcola": la card resta in alto e passa alla forma compatta;
   - campo fringe benefit vuoto → digitare `3213` → deve leggersi `3.213`, mai `03213`;
   - svuotare "Giorni lavorati" → il campo resta vuoto, non salta a 365;
   - cambiare Comune da select → i KPI si aggiornano entro ~300 ms senza toccare altro;
   - rotellina del mouse sopra un campo numerico → il valore non cambia;
   - portare il fringe benefit da 900 a 1.100 € → compare l'avviso di superamento soglia e il netto scende;
   - mobile (375px): card sticky compatta su 3 colonne, leggibile.
