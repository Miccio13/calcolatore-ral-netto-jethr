# Allineamento PDF/README al nuovo nome prodotto e pulizia em dash

## Context

La sessione peer ha rinominato il prodotto in **«Calcolatore RAL Netto»** (senza
freccia, decisione utente), rimosso em dash e frecce dai testi della UI ed
eliminato `ComeSiCalcola.tsx` (commit b520286, push già deployato). Restano
disallineati i documenti generati e la loro toolchain, più README e CLAUDE.md.
Criterio di sostituzione degli em dash: separatori neutri contestuali (virgola,
due punti, parentesi, «·»), lo stesso usato dal peer nella UI.

## Modifiche

1. **Script PDF** — titoli hardcoded e prosa che finisce nei documenti:
   - `scripts/genera-pdf-fonti.ts:74` e `:100-101` — `<title>` («Jet HR ·
     Calcolatore RAL Netto: fonti normative») e i due em dash nel paragrafo
     «La regola» (incisi → parentesi/virgole); em dash nella stringa di
     `RUOLI_DI_CONTESTO` (r. 57).
   - `scripts/genera-pdf-fonti-semplice.ts:82,92,101,126-127,138` — `<title>`,
     `titolo: 'Fonti normative — versione semplice'` → separatore neutro, e gli
     em dash nella prosa dei paragrafi.
   - `scripts/genera-pdf-metodologia.ts:122,129,131` — `<title>`, `titolo:
     'Calcolatore RAL → Netto'` → «Calcolatore RAL Netto», e gli em dash nella
     prosa/`<li>` (pattern «— <span class="muted">» → « (…)» o «: »); anche le
     etichette fonte dei casi di sanità (r. 57-58) e le celle tabella
     (r. 302-303).
   - NON toccare: commenti TS (non user-visible), l'en dash «–» dei range in
     `fascia()` (`pdf-brand.ts:238`), i placeholder `?? '—'` (valore-vuoto da
     tabella, non prosa).

2. **`README.md`** — titolo «# Calcolatore RAL Netto — Jet HR» → nuovo nome
   senza freccia e separatore neutro; em dash nel corpo → separatori neutri.
   I nomi file dei PDF linkati restano invariati (già senza freccia).

3. **`CLAUDE.md` di progetto**:
   - Titolo: «Calcolatore RAL → Netto — Jet HR» → «Calcolatore RAL Netto, Jet HR».
   - Riga 94: rimuovere il riferimento a `src/components/ComeSiCalcola.tsx`
     (file eliminato) — restano README e PDF.
   - Riga 113 (convenzione «le semplificazioni si dichiarano»): ora vivono nel
     README e nel PDF metodologico, non più in ComeSiCalcola.tsx.
   - Gli em dash interni al CLAUDE.md restano (doc interno, fuori scope).

4. **Rigenerare i PDF**: `./scripts/genera-pdf.sh` (3 PDF + verifica fonti).

## Verifica

- `npx tsc --noEmit` e `npx vitest run` (136 test).
- `./scripts/genera-pdf.sh` verde.
- Grep di controllo sui PDF rigenerati: nessuna occorrenza di «RAL → Netto» né
  em dash nel testo estratto (pdftotext o strings), esclusi i placeholder.
- Grep su README: niente «→» né «—».
- Post-approvazione: doppio salvataggio piano in docs/plans/ e autosalvati.
  Commit: da concordare con l'utente (il peer ha già committato la sua parte).
