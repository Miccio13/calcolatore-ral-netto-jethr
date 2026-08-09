# Fix scroll: la card risultati rimbalza mentre si aggancia

## Context

Il pass UX precedente (sticky + input live + card dentro il primo viewport) è implementato e funziona. Resta un difetto di scorrimento: scrollando verso il basso lo scroll "lagga e riporta verso l'alto".

Causa diagnosticata e riprodotta in browser su `localhost:3000/AI-builder-jethr`:

1. La card risultati è `position: sticky`, quindi **resta nel flusso** anche da agganciata.
2. Quando si aggancia passa alla forma compatta e la sua altezza scende da 166px a 79px.
3. Il contenuto sotto risale di 87px; Chrome applica lo **scroll anchoring** e compensa spostando lo scroll all'indietro.
4. Con lo scroll arretrato la card torna sopra la soglia, si riespande, e il ciclo riparte.

Traccia della misura (`scrollBy(0, 30)` ripetuto, atteso → reale):

```
300 → 300   altezza 166   estesa
330 → 330   altezza 166   estesa
360 → 305   altezza 111   compatta   ← lo scroll torna indietro di 55px
390 → 389   altezza 165   estesa     ← si riespande
420 → 365   altezza 111   compatta   ← oscilla
```

Verificato che `overflow-anchor: none` da solo rende lo scroll perfettamente lineare (300/330/360/390/420), ma lascia un secondo difetto: a scroll fermo il contenuto sotto la card **deriva verso l'alto** mentre la card si accorcia (misurati 31px in 300ms nel campione, 87px sul totale).

Esito atteso: durante l'aggancio nulla si muove tranne la card. Scelta confermata dall'utente: fix completo, card fuori dal flusso.

File toccato: `src/components/Calculator.tsx` (solo lui — `InputPanel.tsx` riceve la card via prop `risultati` e non cambia).

---

## Intervento

### 1. La card esce dal flusso quando si aggancia

Oggi la card è un unico `<section className="sticky top-3 …">` che cambia padding e font. Diventa **due livelli**, così il posizionamento è separato dall'aspetto:

- **outer** — solo posizionamento. Da agganciata: `fixed inset-x-0 top-3 z-20 px-4 sm:px-6` (i padding orizzontali replicano quelli del `<main>`, che è `px-4 sm:px-6`). Da sganciata: nessuna classe, sta nel flusso dentro il `<main>` già largo `max-w-3xl`.
- **inner** — tutto l'aspetto attuale: `mx-auto max-w-3xl rounded-3xl border border-border bg-ink text-cream`, più `p-4` + ombra da agganciata / `p-6 sm:p-8` da sganciata, e la `transition-all duration-300 motion-reduce:transition-none` già presente. Il `mx-auto max-w-3xl` è inerte nello stato in flusso e allinea la card al resto della pagina quando è `fixed`.

### 2. Spazio riservato ad altezza costante

La card in flusso viene avvolta da un wrapper che ne conserva l'altezza anche quando lei diventa `fixed`:

- `<div ref={spazioRiservato} style={{ minHeight: altezzaEstesa }}>`;
- `altezzaEstesa` misurata con un `ResizeObserver` sull'inner, aggiornata **solo quando la card non è agganciata** (da agganciata l'inner è compatto: misurarlo collasserebbe lo spazio riservato e reintrodurrebbe il salto);
- finché la misura non è disponibile (primo render, SSR) nessun `minHeight`: la card è comunque in flusso e detta l'altezza da sé.

Il flusso del documento non cambia più fra i due stati → niente scroll anchoring da innescare, niente deriva.

### 3. La soglia si misura sullo spazio riservato

`useStickyState` oggi misura la card stessa. Da `fixed` la card avrebbe `top` costante a 12px e resterebbe agganciata per sempre. Il target del `getBoundingClientRect()` diventa il **wrapper**, che resta in flusso e ad altezza costante: `agganciata = rect.top <= OFFSET_STICKY_PX`. Resta invariato il resto dell'hook (throttle su `requestAnimationFrame`, listener `scroll` passivo + `resize`, misura iniziale al mount).

### 4. `overflow-anchor: none` come cintura di sicurezza

Sul contenitore di pagina in `Calculator.tsx`. Con il flusso ormai stabile non serve più a nulla nel percorso normale, ma azzera il rischio che una futura variazione d'altezza sopra il viewport (un avviso che compare, un campo condizionale come "Altro comune") reintroduca lo stesso rimbalzo. Una riga, nessun effetto collaterale: l'anchoring serve a preservare la posizione di lettura quando cambia contenuto *sopra*, e qui è proprio ciò che non vogliamo.

### Limite noto, accettato

Con la card `fixed`, lo spazio riservato resta visibile come vuoto fra la card RAL e i parametri di dettaglio mentre si scorre — comportamento standard di qualsiasi header fixed con placeholder. È il prezzo scelto per avere il contenuto immobile.

Secondo limite, minore: se si ruota il telefono *mentre* la card è agganciata, `altezzaEstesa` resta quella dell'orientamento precedente (la griglia passa da 1 a 3 colonne) finché non si torna in cima e la card si sgancia, rimisurandosi. Nessun fix previsto: costerebbe più della sua utilità.

---

## Verifica

1. `npx vitest run` — 121 test devono restare verdi (nessuna modifica alla logica fiscale).
2. `npm run lint` e `npm run build`.
3. `npm run dev` + browser, ripetendo le misure che hanno diagnosticato il bug:
   - **niente rimbalzo**: `scrollBy(0, 30)` ripetuto attraverso la soglia → `window.scrollY` deve seguire la progressione attesa senza mai tornare indietro (oggi: 360 → 305);
   - **niente deriva**: fermando lo scroll a cavallo della soglia, il `getBoundingClientRect().top` della sezione "Parametri di dettaglio" non deve muoversi durante i 300ms di transizione (oggi: −31px);
   - la card resta allineata al resto della pagina da agganciata (stesso bordo sinistro/destro delle altre card) a 1280 e a 375px;
   - compattamento ancora corretto in entrambe le direzioni di scroll, card ancora dentro il primo viewport al caricamento, gap di 24px sopra e sotto invariati;
   - ricalcolo live e campi numerici non toccati, ma un giro di controllo su RAL e fringe benefit.
