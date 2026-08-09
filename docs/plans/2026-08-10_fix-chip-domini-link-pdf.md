# Fix: chip dei domini non cliccabili nei PDF Fonti

## Context

Nella sezione «1. La regola» dei PDF delle fonti, i domini istituzionali
(`normattiva.it`, `gazzettaufficiale.it`, ecc.) sono renderizzati come semplici
`<code>` con sfondo a pillola verdino — **sembrano link ma non lo sono mai stati**:
la pagina non ha alcuna annotazione URI nel PDF, per questo cliccandoli in
Anteprima macOS non succede nulla. Tutti gli altri link del documento sono veri
`<a href>` e funzionano (verificati tutti e 20: curl + browser reale, contenuto
incluso).

Il problema riguarda **entrambi** i PDF fonti (la lista è identica nei due
generatori — lo screenshot dell'utente mostra la versione completa, conteggi
20/11/9/21+11, ma la sezione è condivisa):

- `scripts/genera-pdf-fonti.ts:103-105`
- `scripts/genera-pdf-fonti-semplice.ts:109-111`

Verificato in anticipo: le homepage di tutti e 7 i domini rispondono 200
(`finanze.it` redirige su `finanze.gov.it`, accettabile).

## Modifiche

1. **`scripts/pdf-fonti-condiviso.ts`** — aggiungere un helper condiviso
   `listaDomini()` che genera la `<ul class="domini">` con ogni dominio
   avvolto in un link alla homepage istituzionale:
   ```html
   <li><a href="https://www.normattiva.it/"><code>normattiva.it</code></a></li>
   ```
   Itera su `DOMINI_ISTITUZIONALI` (da `src/lib/tax/fonti.ts:22`), URL
   `https://www.<dominio>/`. Nessuna mappa a mano: il pattern vale per tutti e 7.

2. **`scripts/genera-pdf-fonti.ts`** e **`scripts/genera-pdf-fonti-semplice.ts`**
   — sostituire il blocco `<ul class="domini">…</ul>` duplicato con l'helper.

3. **CSS** (in `FONTI_CSS`, `pdf-fonti-condiviso.ts`): i link nel progetto hanno
   la sottolineatura come affordance (commento in `pdf-brand.ts:94-97`); per le
   chip mantenere l'aspetto a pillola senza doppia decorazione —
   `.domini a { text-decoration: none; }` così la chip resta l'affordance,
   ora però realmente cliccabile.

4. **Rigenerare i PDF**: `./scripts/genera-pdf.sh` (rigenera i 3 PDF e lancia
   `verifica-fonti.ts`). I conteggi minimi di link nel verificatore sono "almeno
   20", quindi l'aggiunta di 7 link per PDF non rompe nulla.

Nessuna modifica al motore, ai test o alle fonti: solo generatori PDF.

## Verifica

- `./scripts/genera-pdf.sh` verde (fonti raggiungibili + link cliccabili).
- Ri-estrarre le annotazioni dei PDF (pypdf nello scratchpad venv già creato) e
  confermare che la pagina de «La regola» ora contiene 7 annotazioni URI verso
  le homepage istituzionali, in entrambi i PDF fonti.
- Apertura manuale in Anteprima da parte dell'utente per conferma finale.
- Post-approvazione: copia canonica del piano in `docs/plans/` (regola doppio
  salvataggio) e, se richiesto, commit + push (deploy non necessario: i PDF non
  sono serviti dall'app, vivono in `docs/`).
