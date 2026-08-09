# Metodologia PDF: revisione testi, salti pagina, via «Fonti in sintesi»

## Context

Richieste dell'utente (screenshot delle sue note) sul PDF Metodologia, tutte in
`scripts/genera-pdf-metodologia.ts`. Due delle note («togliamo tutti gli em
dash», attribuzione apprendistato) sono già state applicate nel giro
precedente — gli screenshot mostrano il PDF vecchio. Le novità sono quattro,
più una conseguenza da gestire: la sezione 8 era l'unica con link cliccabili
nel documento, e `verifica-fonti.ts` pretende link nei PDF.

## Modifiche (`scripts/genera-pdf-metodologia.ts`)

1. **r. 142** — «…alimentano l'interfaccia, così che testo e codice non possano
   divergere.» → «…alimentano l'interfaccia, così che testo e codice combacino.»

2. **r. 162-164** — cancellare il paragrafo «Nel caso di default non esistono
   altre fonti di reddito, … non in questo caso.»

3. **Ogni capitolo su pagina nuova** (scelta utente) — regola CSS locale al
   documento metodologia: `h2 { break-before: page; page-break-before: always }`
   nel suo `<style>`, senza toccare `BRAND_CSS` (i PDF fonti mantengono la loro
   impaginazione). Rimuovere il `<div class="page-break">` manuale ora
   ridondante prima della sezione 4 (r. 183). Il capitolo 1 dopo la copertina
   resta com'è (la copertina ha già `page-break-after`; verificare che la
   doppia regola non produca una pagina bianca — nel caso, `h2` con
   `:first-of-type` escluso).

4. **Rimuovere la sezione «8. Fonti in sintesi»** (r. 414-431), la costante
   `fontiUniche` (r. 111) e gli import/helper rimasti orfani (`tipoLabel`,
   eventualmente `escapeHtml` se non usato altrove).

5. **Colonna «Norma» della tabella del modello linkata** (r. 176):
   `<a href="${escapeHtml(r.fonte.url)}">${r.fonte.norma}</a>` — senza questa,
   il PDF resterebbe a zero link cliccabili, contro la filosofia del progetto
   (ogni voce cita la norma con link) e contro il verificatore. Le 15 righe
   della tabella diventano il canale dei link della metodologia; il rimando al
   documento «Fonti normative» per il dettaglio resta nel callout della sintesi.

6. **`scripts/verifica-fonti.ts`** — soglia per-PDF invece del piatto
   `fonti.length` per tutti: i due PDF fonti restano a `>= fonti.length` (20),
   la metodologia passa a `>= 15` (le righe della tabella del modello), con la
   ragione in commento.

## Verifica

- `npx tsc --noEmit`, `npx vitest run` (136 test).
- `./scripts/genera-pdf.sh` verde con le nuove soglie.
- **Link, tutti e live**: estrarre con pypdf ogni annotazione URI dai 3 PDF
  rigenerati e testarle una per una (HTTP + marcatori d'errore Normattiva),
  non solo il conteggio del verificatore.
- **Impaginazione, pagina per pagina**: rendere il PDF metodologia in immagini
  (pdftoppm o screenshot) e controllare che ogni capitolo parta a pagina nuova,
  senza pagine bianche, paragrafo «Nel caso di default…» assente, niente
  sezione 8, colonna Norma linkata.
- Doppio salvataggio piano; commit da proporre a lavoro verificato.
