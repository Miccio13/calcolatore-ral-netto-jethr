/**
 * Identità visiva condivisa dai PDF in docs/: font Wix Madefor self-hostato,
 * palette Jet HR, e — soprattutto — le regole di impaginazione per la stampa.
 *
 * Le regole di page-break sono la parte che conta davvero in un PDF: senza,
 * Chrome spezza tabelle a metà riga, lascia titoli orfani in fondo alla pagina
 * e manda una riga singola di paragrafo sulla pagina successiva. Sono raccolte
 * qui una volta sola invece di essere ripetute (e divergere) nei due documenti.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ASSETS = resolve(__dirname, '../docs/assets')

function fontBase64(file: string): string {
  return readFileSync(resolve(ASSETS, file)).toString('base64')
}

/** Logo inline: niente path da risolvere a runtime, il PDF resta autoconsistente. */
export function logoSvg(altezzaPt: number): string {
  const svg = readFileSync(resolve(ASSETS, 'jethr-logo.svg'), 'utf-8')
  return svg
    .replace(/<svg([^>]*)width="[^"]*"/, '<svg$1')
    .replace(/<svg([^>]*)height="[^"]*"/, `<svg$1height="${altezzaPt}pt"`)
    .replace('<svg', `<svg style="height:${altezzaPt}pt;width:auto"`)
}

export function pittogrammaSvg(altezzaPt: number): string {
  const svg = readFileSync(resolve(ASSETS, 'jethr-pictogram.svg'), 'utf-8')
  return svg
    .replace(/<svg([^>]*)width="[^"]*"/, '<svg$1')
    .replace(/<svg([^>]*)height="[^"]*"/, `<svg$1height="${altezzaPt}pt"`)
    .replace('<svg', `<svg style="height:${altezzaPt}pt;width:auto"`)
}

export const BRAND_CSS = `
  @font-face {
    font-family: 'Wix Madefor Display';
    font-style: normal;
    font-weight: 400 800;
    src: url(data:font/woff2;base64,${fontBase64('wix-madefor-latin.woff2')}) format('woff2');
    unicode-range: u+00??, u+0131, u+0152-0153, u+02bb-02bc, u+02c6, u+02da, u+02dc,
      u+2000-206f, u+20ac, u+2122, u+2191, u+2193, u+2212, u+2215;
  }
  @font-face {
    font-family: 'Wix Madefor Display';
    font-style: normal;
    font-weight: 400 800;
    src: url(data:font/woff2;base64,${fontBase64('wix-madefor-latin-ext.woff2')}) format('woff2');
    unicode-range: u+0100-02ba, u+02bd-02c5, u+1e00-1e9f, u+2020, u+20a0-20ab, u+20ad-20c0;
  }

  @page { size: A4; margin: 20mm 17mm 22mm; }

  * { box-sizing: border-box; }

  body {
    font-family: 'Wix Madefor Display', -apple-system, 'Segoe UI', Arial, sans-serif;
    color: #11150a;
    font-size: 10.2pt;
    line-height: 1.55;
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }

  /* --- Impaginazione: le regole che evitano rotture brutte --- */
  p, li { orphans: 3; widows: 3; }
  h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
  h2 + *, h3 + * { page-break-before: avoid; break-before: avoid; }
  table { page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  li { page-break-inside: avoid; break-inside: avoid; }
  .keep { page-break-inside: avoid; break-inside: avoid; }
  .page-break { page-break-before: always; break-before: page; }

  /* --- Tipografia --- */
  h1 { font-size: 25pt; line-height: 1.15; letter-spacing: -0.015em; margin: 0 0 6pt; font-weight: 700; }
  h2 {
    font-size: 13.5pt; font-weight: 700; letter-spacing: -0.01em;
    margin: 24pt 0 9pt; padding-bottom: 5pt;
    border-bottom: 1.5pt solid #dbe6bd;
  }
  h3 { font-size: 11pt; font-weight: 700; margin: 15pt 0 6pt; }
  p { margin: 0 0 8pt; }
  strong { font-weight: 700; }
  em { font-style: italic; }
  a { color: #11150a; text-decoration: none; }

  ol, ul { margin: 0 0 10pt; padding-left: 16pt; }
  li { margin-bottom: 7pt; padding-left: 2pt; }
  li:last-child { margin-bottom: 0; }

  /* --- Tabelle --- */
  table { width: 100%; border-collapse: collapse; margin: 9pt 0 15pt; font-size: 9pt; }
  th, td { text-align: left; padding: 6pt 8pt; vertical-align: top; }
  th {
    background: #eef3e2; color: #33501a; font-weight: 700;
    font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em;
    border-bottom: 1pt solid #cfdcae;
  }
  td { border-bottom: 0.75pt solid #e8e6dc; }
  tr:last-child td { border-bottom: none; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .nowrap { white-space: nowrap; }

  /* --- Elementi --- */
  .badge {
    display: inline-block; background: #e6efd9; color: #33501a;
    border-radius: 999px; padding: 1.5pt 7pt;
    font-size: 7.5pt; font-weight: 700; letter-spacing: 0.02em; white-space: nowrap;
  }
  .url { font-size: 8pt; color: #6b6f61; word-break: break-all; line-height: 1.4; }
  .muted { color: #6b6f61; }
  .accent { color: #33501a; font-weight: 700; }
  code {
    font-family: 'SF Mono', Menlo, monospace; font-size: 8.6pt;
    background: #eef3e2; padding: 1pt 4pt; border-radius: 3pt;
  }
  .callout {
    background: #f8f7f2; border-left: 2.5pt solid #dbe6bd;
    padding: 9pt 12pt; margin: 10pt 0 14pt;
  }
  .callout p:last-child { margin-bottom: 0; }

  /* --- Copertina --- */
  .cover { padding-top: 30pt; page-break-after: always; break-after: page; }
  .cover-logo { margin-bottom: 46pt; }
  .cover-kicker {
    color: #6b6f61; font-size: 8.5pt; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 12pt;
  }
  .cover-sub { font-size: 12.5pt; color: #4a4f42; margin: 10pt 0 0; line-height: 1.45; }
  .cover-rule { height: 3pt; background: #dbe6bd; margin: 26pt 0; width: 76pt; }
  .cover-meta { font-size: 9pt; color: #6b6f61; line-height: 1.6; margin: 0; }
  .cover-meta strong { color: #11150a; font-weight: 600; }

  /* Nessun footer ripetuto: Chrome in stampa posiziona gli elementi fixed
     rispetto alla prima pagina, e il risultato è una riga che si sovrappone al
     contenuto di ogni pagina successiva invece di stare a piè di pagina. Provato
     e scartato — meglio nessun footer che uno rotto. Le intestazioni di sezione
     e la copertina bastano a identificare il documento. */
`

type OpzioniCopertina = {
  kicker: string
  titolo: string
  sottotitolo: string
  meta: string
}

export function copertina(o: OpzioniCopertina): string {
  return `
<section class="cover">
  <div class="cover-logo">${logoSvg(26)}</div>
  <p class="cover-kicker">${o.kicker}</p>
  <h1>${o.titolo}</h1>
  <p class="cover-sub">${o.sottotitolo}</p>
  <div class="cover-rule"></div>
  <p class="cover-meta">${o.meta}</p>
</section>`
}

/** Formattazione numerica italiana, identica a quella del motore di calcolo. */
export function fmt(n: number, decimali = 0): string {
  const segno = n < 0 ? '−' : ''
  const [intera, decimale] = Math.abs(n).toFixed(decimali).split('.')
  const raggruppata = intera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimale ? `${segno}${raggruppata},${decimale}` : `${segno}${raggruppata}`
}

/**
 * Percentuale in formato italiano. `toFixed()` da solo produce "9.19%" — il
 * punto decimale inglese in un documento in italiano, dove ogni altro numero
 * usa la virgola.
 */
export function pct(frazione: number, decimali = 2): string {
  return `${fmt(frazione * 100, decimali)}%`
}

/**
 * Fascia di reddito leggibile. Senza questo, uno scaglione aperto verso l'alto
 * si stampa come "50.000 – —", che non si legge come "oltre".
 */
export function fascia(da: number, a: number, unita = ' €'): string {
  if (a === Infinity) return `Oltre ${fmt(da)}${unita}`
  if (da === 0) return `Fino a ${fmt(a)}${unita}`
  return `${fmt(da)} – ${fmt(a)}${unita}`
}
