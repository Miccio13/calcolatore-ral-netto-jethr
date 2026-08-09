# Fix: fonte TFR — deep-link all'art. 2120 c.c. invece dell'intero codice civile

## Context

La fonte `tfr` (`src/lib/tax/fonti.ts:184-191`) linka la ELI dell'intero R.D.
262/1942 (tutto il codice civile): riferimento troppo generico per «art. 2120
c.c.». Il deep-link URN standard (`~art2120`) NON funziona qui: il R.D. ha solo
gli artt. 1-2 e il codice civile è un **allegato** — verificato in browser, la
URN senza numero d'allegato atterra sull'art. 1 del decreto.

La forma che funziona è la URN **con numero d'allegato** (`:2`):

```
https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art2120!vig=
```

Verificata due volte:
- **Browser reale**: viewer completo con «(CODICE CIVILE-art. 2120)», testo
  vigente dal 11-4-1991, navigazione e collegamento permanente.
- **Server-side (come verifica-fonti.ts)**: HTTP 200, testo dell'articolo
  presente nell'HTML («Disciplina del trattamento di fine rapporto», «13,5»),
  nessun marcatore d'errore Normattiva.

## Modifiche

1. **`src/lib/tax/fonti.ts`** — nella fonte `tfr`, sostituire la `url` ELI con
   la URN qui sopra. Nessun altro file cita quell'URL (grep verificato).

2. **`CLAUDE.md` del progetto** (regola 2, sezione Normattiva) — una riga sulla
   nuance scoperta: per gli articoli di codici allegati a un atto (es. codice
   civile nel R.D. 262/1942) la URN richiede il numero d'allegato dopo il numero
   dell'atto (`;262:2~art2120!vig=`); senza, il deep-link cade sugli articoli
   del decreto di approvazione.

3. **Rigenerare i PDF**: `./scripts/genera-pdf.sh` (i tre PDF citano la fonte
   tfr dal registro condiviso; lo script lancia anche `verifica-fonti.ts`).

Nessuna modifica al motore o ai test: cambia solo l'URL nel registro fonti.

## Verifica

- `./scripts/genera-pdf.sh` verde: fonte `tfr` raggiungibile senza marcatori
  d'errore, PDF rigenerati con link cliccabili.
- `npx vitest run` (il test dei domini istituzionali resta soddisfatto:
  normattiva.it).
- Controllo annotazioni: la nuova URN compare nei PDF al posto della ELI.
- Post-approvazione: doppio salvataggio piano in `docs/plans/` e autosalvati.
