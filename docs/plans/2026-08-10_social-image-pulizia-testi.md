# JetHR Calcolatore — Social image + pulizia testi (em dash, frecce, "Come si calcola")

## Context

Il calcolatore RAL→Netto (repo `/Users/MariglianoSimone/Documents/Lavoro/_attivi/JetHR/calcolatore-ral-netto`, Next.js 16 App Router, live su `www.mariglianosimone.design/AI-builder-jethr` via rewrite → Vercel) non ha alcun meta social: condividendo il link non appare nessuna immagine. Inoltre i testi contengono em dash "—" e frecce "→" da rimuovere, e la sezione "Come si calcola" va eliminata per intero.

**Coordinamento cross-session (fatto)**: 4 sessioni attive interrogate, tutte danno via libera su queste aree. Vincoli emersi:
- NON toccare `scripts/genera-pdf*` / `scripts/pdf-fonti-condiviso.ts` (modifiche non committate della sessione `fix-tfr-deep-link-article`).
- `src/lib/tax/fonti.ts` ha una modifica non committata di quella sessione (URL TFR): se lo committo, includo il suo cambio con attribuzione (pattern già usato nel progetto).
- Nel working tree ci sono altri file modificati non miei (CLAUDE.md, docs/*.html, docs/*.pdf, scripts/*): **non committarli**.

**Decisioni utente**:
- Nome prodotto senza freccia: **"Calcolatore RAL Netto"**.
- Scope em dash: **sito + social**; PDF e scripts/ esclusi (avviso io l'altra sessione che i PDF andranno rigenerati).
- A fine lavoro: **commit selettivo + push** (il push triggera il deploy Vercel in produzione).

## 1. Pulizia testi (em dash e frecce, solo UI/metadata)

| File | Modifica |
|---|---|
| `src/app/layout.tsx:11` | title → `'Calcolatore RAL Netto \| Jet HR'` |
| `src/app/semplice/page.tsx:4-8` | title → `'Calcolatore RAL Netto, versione semplice \| Jet HR'`; description: riscrivere senza em dash |
| `src/components/Calculator.tsx:44,46` | eyebrow `Jet HR — prototipo…` → `Jet HR · prototipo Product Builder`; h1 → `Calcolatore RAL Netto` |
| `src/components/CalculatorSemplice.tsx:66,69` | idem (eyebrow + h1 "Calcolatore RAL Netto, versione semplice") |
| `src/components/Waterfall.tsx:61` | separatore `</span> — {descrizione}` → `</span> · {descrizione}` |
| `src/lib/tax/fonti.ts` righe 60, 140, 164, 172 | riscrivere le 4 frasi sostituendo gli em dash con virgole/due punti (testo visibile nel Waterfall) |

Non si toccano: em dash/frecce in commenti di codice e test (non visibili), scripts/ e docs/ (PDF, altra sessione).

## 2. Rimozione "Come si calcola"

- Eliminare `src/components/ComeSiCalcola.tsx` (componente accordion autonomo, nessuna dipendenza).
- `src/components/Calculator.tsx`: rimuovere import (riga 10) e render (riga ~135).
- `Calculator.tsx:138-140` (footer): riscrivere la frase `Semplificazioni dichiarate nella sezione "Come si calcola"` — la sezione non esisterà più; sostituire con rimando al PDF Metodologia (già linkato/esistente in docs) o eliminare l'inciso.
- Nota di coerenza (segnalata dai peer): la sezione era l'unica disclosure in-app delle semplificazioni; restano README + PDF Metodologia. Scelta esplicita dell'utente, si procede.

## 3. Social image (og:image, mockup Mac della hero)

Dopo le modifiche testi (così lo screenshot è già pulito):

1. `npm run dev` → screenshot della parte alta della pagina `/` (hero + InputPanel + card KPI) a viewport desktop ~1440×900 via Playwright MCP.
2. Comporre una pagina HTML 1200×630 nello scratchpad: sfondo gradiente brand sage→cream (stesso di `src/app/page.tsx`), finestra macOS in CSS (barra con semafori, angoli arrotondati, ombra morbida) contenente lo screenshot, logo Jet HR (`public/brand/jethr-logo.svg`) + titolo "Calcolatore RAL Netto". Niente em dash né frecce nel testo dell'immagine.
3. Screenshot 1200×630 esatto → `public/og.png` (comprimere se >300KB, eventualmente jpg).
4. `src/app/layout.tsx`: aggiungere `metadataBase: new URL('https://calcolatore-ral-netto-jethr.vercel.app')` + blocco `openGraph` (title, description, url, `images: [{ url: 'https://calcolatore-ral-netto-jethr.vercel.app/AI-builder-jethr/og.png', width: 1200, height: 630 }]`) + `twitter: { card: 'summary_large_image' }`. URL assoluto obbligatorio: con `basePath`/`assetPrefix` gli asset vivono sotto `/AI-builder-jethr/` sul dominio Vercel (stesso pattern dell'`Image` del pictogram in `Calculator.tsx:35`). Il rewrite dal portfolio serve lo stesso HTML, quindi gli scraper social che leggono `mariglianosimone.design/AI-builder-jethr` trovano i meta.
5. `/semplice` eredita l'openGraph dal layout (override solo di title/description già previsto al punto 1).

## 4. Verifica

- `npx vitest run` (121 test) — prima `rm -rf node_modules/.vite` (memoria: falsi rossi con sessioni concorrenti).
- `npm run build`.
- Browser (Playwright): pagina `/` e `/semplice` — nessun "—" né "→" visibile, sezione "Come si calcola" assente, footer coerente, Waterfall leggibile col nuovo separatore.
- Meta: `curl -s localhost:3000 | grep og:` per verificare og:image/twitter card nell'HTML.
- Post-deploy: `curl -s https://www.mariglianosimone.design/AI-builder-jethr | grep og:image` e fetch dell'og.png.

## 5. Commit, deploy, coordinamento

- Commit selettivi (Conventional Commits), SOLO i file di questo task:
  1. `fix: rimuove em dash e frecce dai testi UI e metadata` (layout, pagine, componenti, fonti.ts — quest'ultimo include con attribuzione il fix URL TFR non committato della sessione peer, che avviso prima via SendMessage)
  2. `feat: social preview con og:image (mockup hero)` (og.png + metadata)
  3. `chore: rimuove sezione "Come si calcola"` — o accorpato al primo se preferibile in esecuzione
- Push → deploy Vercel automatico in produzione.
- SendMessage a `fix-tfr-deep-link-article`: fonti.ts modificato/committato + i PDF contengono ancora em dash e vecchio titolo con freccia → andranno rigenerati da loro.
- Doppio salvataggio piano: copia in `<repo>/docs/plans/` + `~/Library/Mobile Documents/com~apple~CloudDocs/Documenti/Progetti/claude/autosalvati/2026-08-10_jethr_piano_social-image-pulizia-testi.md`.
