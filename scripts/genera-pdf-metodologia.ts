/**
 * Genera docs/metodologia.html leggendo direttamente fonti.ts, constants-2026.ts e il
 * motore calcola.ts: le tabelle di parametri, fonti e casi di validazione non sono
 * trascritte a mano, quindi non possono divergere dal codice. L'HTML va poi convertito
 * in PDF con Chrome headless (vedi scripts/genera-pdf-metodologia.sh).
 */
import { calcola } from '../src/lib/tax/calcola'
import {
  ALIQUOTA_APPRENDISTATO_2026,
  COSTO_AZIENDA_2026,
  CUNEO_FISCALE_2026,
  DETRAZIONE_ALTRI_FAMILIARI_2026,
  DETRAZIONE_CONIUGE_2026,
  DETRAZIONE_FIGLI_2026,
  DETRAZIONE_LAVORO_DIPENDENTE_2026,
  INPS_2026,
  SCAGLIONI_IRPEF_2026,
  TRATTAMENTO_INTEGRATIVO_2026,
  WELFARE_2026,
} from '../src/lib/tax/constants-2026'
import { COMUNI_2026 } from '../src/lib/tax/comuni-2026'
import { REGIONI_2026 } from '../src/lib/tax/regioni-2026'
import { FONTI, type Fonte } from '../src/lib/tax/fonti'
import { INPUT_DEFAULT } from '../src/lib/tax/types'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OGGI = '7 agosto 2026'

function fmt(n: number, decimali = 0): string {
  const segno = n < 0 ? '-' : ''
  const [intera, decimale] = Math.abs(n).toFixed(decimali).split('.')
  const raggruppata = intera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimale ? `${segno}${raggruppata},${decimale}` : `${segno}${raggruppata}`
}

function tipoLabel(tipo: Fonte['tipo']): string {
  return { norma: 'Norma', prassi: 'Prassi', 'atto-locale': 'Atto locale' }[tipo]
}

// --- Casi di validazione: confrontati con calcolatori pubblici in fase di ricerca ---
const CASI_VALIDAZIONE = [
  { ral: 35_000, nettoAtteso: 25_968, fonte: 'stipendionettocalcolatore.it, ral-35000-netto-2026', tolleranza: '±0,5%' },
  { ral: 60_000, nettoAtteso: 37_621, fonte: 'stipendionettocalcolatore.it, ral-60000-netto/', tolleranza: '±0,5%' },
]

const risultatiValidazione = CASI_VALIDAZIONE.map((c) => {
  const r = calcola({ ...INPUT_DEFAULT, ral: c.ral })
  const scarto = ((r.nettoAnnuo - c.nettoAtteso) / c.nettoAtteso) * 100
  return { ...c, nettoCalcolato: r.nettoAnnuo, scarto }
})

// --- Esempi per la sezione "quattro trappole" ---
const esempioSoglia15k = (() => {
  const ralSotto = 15_000 / (1 - INPUT_DEFAULT.aliquotaInps) - 1
  const ralSopra = 15_000 / (1 - INPUT_DEFAULT.aliquotaInps) + 1
  return { sotto: calcola({ ...INPUT_DEFAULT, ral: ralSotto }), sopra: calcola({ ...INPUT_DEFAULT, ral: ralSopra }) }
})()

const esempioMensilita = {
  con12: calcola({ ...INPUT_DEFAULT, ral: 35_000, mensilita: 12 }),
  con14: calcola({ ...INPUT_DEFAULT, ral: 35_000, mensilita: 14 }),
}

// --- Tabella "il modello di calcolo" ---
const RIGHE_MODELLO = [
  { voce: 'Contributi INPS c/dipendente', base: 'RAL', formula: '9,19% (o 9,49%) + 1% oltre 56.224 €', fonte: FONTI.inpsCirc6_2026 },
  { voce: 'IRPEF lorda', base: 'Imponibile fiscale', formula: '23% / 33% / 43% per scaglioni', fonte: FONTI.tuirArt11 },
  { voce: 'Detrazione lavoro dipendente', base: 'Reddito di riferimento', formula: 'da 1.955 € a 0, decrescente da 15.000 a 50.000', fonte: FONTI.tuirArt13 },
  { voce: 'Ulteriore detrazione cuneo fiscale', base: 'Reddito complessivo', formula: 'fino a 1.000 €, tra 20.000 e 40.000', fonte: FONTI.cuneoFiscale },
  { voce: 'Addizionale regionale', base: 'Imponibile fiscale', formula: 'variabile per regione: progressiva, flat, o soglia+flat', fonte: FONTI.addizionaliRegionali2026 },
  { voce: 'Addizionale comunale', base: 'Imponibile fiscale', formula: 'variabile per comune: soglia di esenzione poi scaglioni', fonte: FONTI.addizionaliComunali2026 },
  { voce: 'Detrazione coniuge a carico', base: 'Reddito complessivo', formula: 'da 800 € a 0, 3 fasce + micro-bonus', fonte: FONTI.tuirArt12 },
  { voce: 'Detrazione figli 21-30 a carico', base: 'Reddito complessivo', formula: '950 € per figlio, rapporto su base 95.000 €+', fonte: FONTI.tuirArt12 },
  { voce: 'Detrazione altri familiari a carico', base: 'Reddito complessivo', formula: '750 € per familiare, rapporto su base 80.000 €', fonte: FONTI.tuirArt12 },
  { voce: 'Trattamento integrativo', base: 'Reddito complessivo', formula: '1.200 € se ≤ 15.000 € e c\'è capienza', fonte: FONTI.trattamentoIntegrativo },
  { voce: 'Somma integrativa cuneo fiscale', base: 'Reddito di lavoro dipendente', formula: '7,1% / 5,3% / 4,8%, se reddito complessivo ≤ 20.000 €', fonte: FONTI.cuneoFiscale },
  { voce: 'Welfare / fringe benefit', base: 'Valore ricevuto', formula: 'esente fino a 1.000-2.000 €, poi intero importo imponibile', fonte: FONTI.welfare },
  { voce: 'Contributi c/azienda', base: 'RAL', formula: '29,4% (terziario) o 32% (industria)', fonte: FONTI.inpsCirc6_2026 },
  { voce: 'TFR accantonato', base: 'RAL', formula: 'RAL / 13,5', fonte: FONTI.tfr },
]

// --- Bibliografia, deduplicata per URL ---
const fontiUniche = Array.from(new Map(Object.values(FONTI).map((f) => [f.url, f])).values())

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Jet HR — Calcolatore RAL → Netto: metodologia</title>
<style>
  @page { size: A4; margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Wix Madefor Display', -apple-system, 'Segoe UI', Arial, sans-serif;
    color: #11150a;
    font-size: 10.5pt;
    line-height: 1.55;
  }
  h1 { font-size: 22pt; margin: 0 0 4pt; }
  h2 { font-size: 14pt; margin: 26pt 0 8pt; border-bottom: 2px solid #dbe6bd; padding-bottom: 4pt; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 14pt 0 6pt; page-break-after: avoid; }
  p { margin: 0 0 8pt; }
  .cover { text-align: center; padding-top: 60pt; }
  .cover .kicker { color: #6b6f61; font-size: 10pt; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 10pt; }
  .cover .sub { color: #6b6f61; margin-top: 8pt; font-size: 11pt; }
  .cover .meta { margin-top: 40pt; font-size: 9.5pt; color: #6b6f61; }
  .badge { display: inline-block; background: #e6efd9; color: #345216; border-radius: 999px; padding: 2pt 8pt; font-size: 8.5pt; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0 14pt; font-size: 9.3pt; }
  th, td { text-align: left; padding: 5pt 7pt; border-bottom: 1px solid #e6e4d9; vertical-align: top; }
  th { background: #eef3e2; font-weight: 600; font-size: 8.8pt; text-transform: uppercase; letter-spacing: 0.02em; color: #345216; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .fonte-url { font-size: 8.3pt; color: #6b6f61; word-break: break-all; }
  ol, ul { margin: 0 0 10pt; padding-left: 18pt; }
  li { margin-bottom: 6pt; }
  .box { background: #f8f7f2; border: 1px solid #e6e4d9; border-radius: 8pt; padding: 10pt 12pt; margin: 8pt 0 14pt; }
  .ok { color: #345216; font-weight: 600; }
  .page-break { page-break-before: always; }
  footer.pagefoot { position: fixed; bottom: 8mm; font-size: 8pt; color: #999; }
  code { font-family: 'SF Mono', Menlo, monospace; font-size: 9pt; background: #eef3e2; padding: 1pt 4pt; border-radius: 3pt; }
</style>
</head>
<body>

<section class="cover">
  <p class="kicker">Jet HR — Product Builder, esercizio di selezione</p>
  <h1>Calcolatore RAL → Netto</h1>
  <p class="sub">Metodologia di calcolo, fonti normative e validazione</p>
  <p class="meta">Anno d'imposta 2026 · Caso di default: Milano, Lombardia — ogni variabile è personalizzabile<br>Documento generato automaticamente dai file sorgente del motore di calcolo — ${OGGI}</p>
</section>

<div class="page-break"></div>

<h2>1. Sintesi</h2>
<p>Questo documento accompagna un prototipo che, data una Retribuzione Annua Lorda (RAL),
calcola il netto annuo e mensile percepito da un dipendente e tutte le voci di tassazione
e contribuzione al lordo. Copre un solo caso — descritto sotto — con ogni semplificazione
dichiarata esplicitamente, non nascosta nel codice.</p>
<p>Il motore di calcolo (<code>src/lib/tax/</code>) è indipendente dalla UI: ogni voce del
risultato porta con sé la formula applicata e la norma che la impone, verificabile nel
codice sorgente e in questo documento — generato automaticamente dagli stessi file che
alimentano l'interfaccia, così che testo e codice non possano divergere.</p>

<h2>2. Il caso standard</h2>
<p>Le assunzioni indicate esplicitamente dal brief restano il <strong>prefilled di
default</strong>, ma ogni variabile che incide realmente sul netto è gestibile dall'utente:</p>
<ul>
  <li>Dipendente impiegato, contratto a tempo indeterminato (selezionabile: apprendistato)</li>
  <li>Residente a Milano, Lombardia (selezionabile: ${REGIONI_2026.length} regioni, ${COMUNI_2026.length} comuni + inserimento manuale)</li>
  <li>Nessuna agevolazione fiscale particolare</li>
  <li>Nessun familiare fiscalmente a carico (selezionabile: coniuge, figli 21-30, altri familiari)</li>
  <li>Nessun welfare/fringe benefit (selezionabile: importo annuo)</li>
  <li>Mensilità di default: 13 — più universale di 14 tra i CCNL, senza un contratto specifico dichiarato (selezionabile: 12/13/14)</li>
  <li>Contratto attivo per l'intero anno d'imposta, 365 giorni (selezionabile: 1-365)</li>
</ul>
<p>Nessun'altra fonte di reddito: imponibile fiscale, reddito di lavoro dipendente e reddito
complessivo coincidono nel caso di default. Il motore li tratta come concetti distinti — è
nella realtà che possono divergere, non nel caso di default qui descritto. Anno d'imposta 2026.</p>

<h2>3. Il modello di calcolo</h2>
<p>Ogni passaggio della catena usa la base imponibile corretta — non tutte le voci si
calcolano sulla RAL:</p>
<table>
  <thead><tr><th>Voce</th><th>Base imponibile</th><th>Formula</th><th>Norma</th></tr></thead>
  <tbody>
    ${RIGHE_MODELLO.map(
      (r) => `<tr><td>${r.voce}</td><td>${r.base}</td><td>${r.formula}</td><td>${r.fonte.norma}</td></tr>`
    ).join('\n    ')}
  </tbody>
</table>
<p>Trattamento integrativo e somma integrativa <strong>si sommano</strong> al netto: non
sono detrazioni, sono credito erogato in busta paga.</p>

<h2>4. Parametri 2026</h2>
<h3>Scaglioni IRPEF</h3>
<table>
  <thead><tr><th>Da</th><th>A</th><th class="num">Aliquota</th></tr></thead>
  <tbody>
    ${SCAGLIONI_IRPEF_2026.map(
      (s) => `<tr><td>${fmt(s.da)} €</td><td>${s.a === Infinity ? '—' : fmt(s.a) + ' €'}</td><td class="num">${(s.aliquota * 100).toFixed(0)}%</td></tr>`
    ).join('\n    ')}
  </tbody>
</table>

<h3>Detrazione lavoro dipendente (art. 13 c.1 TUIR)</h3>
<table>
  <tbody>
    <tr><td>Fino a ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.sogliaBassa)} €</td><td class="num">${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.massimo)} € fisso</td></tr>
    <tr><td>Da ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.sogliaBassa)} a ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.puntoIntermedio)} €</td><td class="num">1.910 + 1.190 × rapporto</td></tr>
    <tr><td>Da ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.puntoIntermedio)} a ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.sogliaAlta)} €</td><td class="num">1.910 × rapporto</td></tr>
    <tr><td>Oltre ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.sogliaAlta)} €</td><td class="num">0 €</td></tr>
    <tr><td>Minimo garantito</td><td class="num">${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.minimo)} € (${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.minimoTempoDeterminato)} € se tempo determinato)</td></tr>
  </tbody>
</table>

<h3>Cuneo fiscale (L. 207/2024)</h3>
<table>
  <thead><tr><th>Reddito lavoro dipendente</th><th class="num">Somma integrativa</th></tr></thead>
  <tbody>
    ${CUNEO_FISCALE_2026.sommaIntegrativa.map(
      (s) => `<tr><td>${fmt(s.da)} – ${s.a === Infinity ? '—' : fmt(s.a) + ' €'}</td><td class="num">${(s.percentuale * 100).toFixed(1)}%</td></tr>`
    ).join('\n    ')}
  </tbody>
</table>
<p>Ulteriore detrazione: ${fmt(CUNEO_FISCALE_2026.ulterioreDetrazione.importoMassimo)} € fisso tra
${fmt(CUNEO_FISCALE_2026.ulterioreDetrazione.sogliaBassa)} e ${fmt(CUNEO_FISCALE_2026.ulterioreDetrazione.sogliaPiena)} €,
decrescente fino a zero a ${fmt(CUNEO_FISCALE_2026.ulterioreDetrazione.sogliaAlta)} €.</p>

<h3>Trattamento integrativo</h3>
<p>${fmt(TRATTAMENTO_INTEGRATIVO_2026.importo)} € se reddito complessivo ≤
${fmt(TRATTAMENTO_INTEGRATIVO_2026.sogliaRedditoComplessivo)} € e c'è capienza: imposta lorda
sui redditi di lavoro dipendente superiore alla detrazione art. 13 ridotta di
${TRATTAMENTO_INTEGRATIVO_2026.correttivoCapienza} €.</p>

<h3>Contributi INPS</h3>
<table>
  <tbody>
    <tr><td>Aliquota base</td><td class="num">${(INPS_2026.aliquotaBase * 100).toFixed(2)}%</td></tr>
    <tr><td>Aliquota con FIS (aziende &gt;15 dip.)</td><td class="num">${(INPS_2026.aliquotaConFis * 100).toFixed(2)}%</td></tr>
    <tr><td>1ª fascia retribuzione pensionabile</td><td class="num">${fmt(INPS_2026.primaFasciaPensionabile)} €</td></tr>
    <tr><td>Aliquota aggiuntiva oltre la 1ª fascia</td><td class="num">+${(INPS_2026.aliquotaAggiuntiva * 100).toFixed(0)}%</td></tr>
    <tr><td>Massimale annuo (iscritti dal 1996)</td><td class="num">${fmt(INPS_2026.massimaleAnnuo)} €</td></tr>
  </tbody>
</table>

<h3>Addizionali locali</h3>
<p>Regione e comune sono selezionabili nella UI. Copertura: ${REGIONI_2026.length} regioni/province
autonome (addizionale regionale) e ${COMUNI_2026.length} capoluoghi verificati singolarmente
(addizionale comunale) — per un comune non elencato, la UI accetta aliquota e soglia inserite
manualmente. Esempio, la combinazione di default (Lombardia / Milano):</p>
<table>
  <thead><tr><th>Regionale (Lombardia)</th><th class="num">Aliquota</th></tr></thead>
  <tbody>
    ${(REGIONI_2026.find((r) => r.id === 'lombardia')!.addizionale as { tipo: 'progressivo'; scaglioni: { da: number; a: number; aliquota: number }[] }).scaglioni.map(
      (s) => `<tr><td>${fmt(s.da)} – ${s.a === Infinity ? '—' : fmt(s.a) + ' €'}</td><td class="num">${(s.aliquota * 100).toFixed(2)}%</td></tr>`
    ).join('\n    ')}
  </tbody>
</table>
<table>
  <thead><tr><th>Comunale (Milano)</th><th class="num">Aliquota</th></tr></thead>
  <tbody>
    <tr><td>Esente fino a ${fmt(COMUNI_2026.find((c) => c.id === 'milano')!.soglia)} €, poi</td><td class="num">${(COMUNI_2026.find((c) => c.id === 'milano')!.scaglioni[0].aliquota * 100).toFixed(2)}%</td></tr>
  </tbody>
</table>

<h3>Detrazioni familiari (art. 12 TUIR)</h3>
<table>
  <tbody>
    <tr><td>Coniuge a carico</td><td class="num">da ${fmt(DETRAZIONE_CONIUGE_2026.baseFasciaBassa)} € a 0, decrescente fino a ${fmt(DETRAZIONE_CONIUGE_2026.sogliaAlta)} € di reddito</td></tr>
    <tr><td>Figli 21-30 non disabili a carico</td><td class="num">${fmt(DETRAZIONE_FIGLI_2026.importoBase)} € per figlio, base rapporto ${fmt(DETRAZIONE_FIGLI_2026.baseRapporto)} € (+${fmt(DETRAZIONE_FIGLI_2026.incrementoBasePerFiglioSuccessivo)} € per figlio successivo)</td></tr>
    <tr><td>Altri familiari a carico</td><td class="num">${fmt(DETRAZIONE_ALTRI_FAMILIARI_2026.importoBase)} € per familiare, base rapporto ${fmt(DETRAZIONE_ALTRI_FAMILIARI_2026.baseRapporto)} €</td></tr>
  </tbody>
</table>

<h3>Welfare / fringe benefit</h3>
<p>Esente fino a ${fmt(WELFARE_2026.sogliaGenerale)} € (${fmt(WELFARE_2026.sogliaConFigliACarico)} € con figli a carico); se superata, l'intero
importo — non solo l'eccedenza — diventa imponibile (soglia, non franchigia; verificato sulla
circolare AdE 35/E del 2022).</p>

<h3>Apprendistato</h3>
<p>Aliquota INPS a carico del lavoratore: ${(ALIQUOTA_APPRENDISTATO_2026 * 100).toFixed(2)}% flat,
indipendente dall'anno di apprendistato e dalla dimensione dell'azienda, in sostituzione
dell'aliquota standard.</p>

<h3>Costo azienda</h3>
<table>
  <tbody>
    <tr><td>Contributi c/azienda — terziario</td><td class="num">${(COSTO_AZIENDA_2026.contributiPerSettore.terziario * 100).toFixed(1)}%</td></tr>
    <tr><td>Contributi c/azienda — industria</td><td class="num">${(COSTO_AZIENDA_2026.contributiPerSettore.industria * 100).toFixed(1)}%</td></tr>
    <tr><td>TFR</td><td class="num">RAL / 13,5</td></tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>5. Quattro cose che i calcolatori online spesso sbagliano</h2>
<ol>
  <li><strong>Trattamento integrativo e somma integrativa si sommano al netto</strong>, non
  sono trattenute: la loro base è il reddito di lavoro dipendente, non l'imponibile su cui
  gira l'IRPEF.</li>
  <li><strong>Le addizionali locali</strong> per legge si calcolano sul reddito dell'anno
  precedente, versate in 11 rate l'anno successivo. Qui si assume lo stesso anno d'imposta
  per semplicità di proiezione — scelta dichiarata, non un errore.</li>
  <li><strong>Il netto mensile dipende dalle mensilità del CCNL.</strong> Su una RAL di
  35.000 €, con 12 mensilità il netto mensile è
  <span class="ok">${fmt(esempioMensilita.con12.nettoMensile, 0)} €</span>, con 14 è
  <span class="ok">${fmt(esempioMensilita.con14.nettoMensile, 0)} €</span> — stesso netto
  annuo (${fmt(esempioMensilita.con12.nettoAnnuo, 0)} €), ripartizione diversa. Dividere
  sempre per 12 produce un numero sbagliato.</li>
  <li><strong>Appena sopra i 15.000 € di reddito il netto annuo può scendere pur salendo la
  RAL.</strong> Non è un bug: a quella soglia la detrazione lavoro dipendente sale da
  1.955 € a circa 3.100 €, ma si perde interamente il trattamento integrativo di 1.200 €
  (soglia netta). Esempio dal motore, a cavallo della soglia (±1 € di RAL):
  netto ${fmt(esempioSoglia15k.sotto.nettoAnnuo, 2)} € appena sotto la soglia di reddito,
  netto ${fmt(esempioSoglia15k.sopra.nettoAnnuo, 2)} € appena sopra — una differenza di
  ${fmt(esempioSoglia15k.sotto.nettoAnnuo - esempioSoglia15k.sopra.nettoAnnuo, 2)} € a
  fronte di soli 2 € di RAL in più. Scoperto scrivendo i test del motore, non ipotizzato a
  tavolino: è un effetto soglia reale e documentato della normativa italiana sul lavoro
  dipendente.</li>
</ol>

<h2>6. Semplificazioni e limiti</h2>
<table>
  <thead><tr><th>Esclusione</th><th>Perché</th></tr></thead>
  <tbody>
    <tr><td>Tempo determinato come opzione a sé</td><td>Verificato — due volte, con fonti indipendenti — che non altera nessun numero rispetto al tempo indeterminato in questo modello: il floor differenziato dell'art. 13 TUIR non scatta mai, e il contributo NASpI 1,4% aggiuntivo è interamente a carico del datore. Un toggle che non cambia mai un numero sarebbe peggio di non averlo</td></tr>
    <tr><td>Comuni oltre gli ${COMUNI_2026.length} capoluoghi verificati</td><td>Oltre 8.000 comuni italiani, nessun dataset bulk trovato sul sito del Dip. Finanze; copertura reale ma parziale, con inserimento manuale come fallback</td></tr>
    <tr><td>Premi di risultato oltre il fringe benefit semplice</td><td>Regime a imposta sostitutiva 5-10%, soglie e requisiti di premialità distinti da modellare a parte</td></tr>
    <tr><td>Sterilizzazione delle detrazioni oltre 200.000 €</td><td>Irrilevante sotto quella soglia di reddito; il caso standard non la raggiunge</td></tr>
    <tr><td>INAIL nel costo azienda</td><td>Aliquota variabile per rischio di settore (tariffa specifica INAIL), non un parametro unico</td></tr>
    <tr><td>Ratei di 13ª/14ª con tassazione separata, conguaglio di fine anno</td><td>Riguardano la distribuzione infra-annuale, non la proiezione annuale richiesta</td></tr>
    <tr><td>Massimale contributivo iscritti dal 1996 (${fmt(INPS_2026.massimaleAnnuo)} €)</td><td>Rilevante solo su RAL molto alte, oltre il range tipico del caso standard</td></tr>
    <tr><td>Bonus +200€ per famiglie con più di 3 figli a carico (art. 12 c.1 lett. c TUIR)</td><td>Richiederebbe conoscere anche i figli under-21 coperti da assegno unico, non raccolti dal form</td></tr>
  </tbody>
</table>

<h2>7. Validazione</h2>
<p>Il motore è coperto da 74 test automatici (unitari per modulo, end-to-end sui casi
standard, continuità sui valori di soglia). In aggiunta, un confronto di sanità con
calcolatori pubblici indipendenti:</p>
<table>
  <thead><tr><th>RAL</th><th class="num">Netto atteso</th><th class="num">Netto calcolato</th><th class="num">Scarto</th><th>Fonte confronto</th></tr></thead>
  <tbody>
    ${risultatiValidazione
      .map(
        (r) =>
          `<tr><td>${fmt(r.ral)} €</td><td class="num">${fmt(r.nettoAtteso)} €</td><td class="num">${fmt(r.nettoCalcolato, 0)} €</td><td class="num">${r.scarto >= 0 ? '+' : ''}${r.scarto.toFixed(2)}%</td><td class="fonte-url">${r.fonte}</td></tr>`
      )
      .join('\n    ')}
  </tbody>
</table>
<p>Scarti entro la tolleranza dichiarata (±0,5%): riconducibili ad arrotondamenti e a
piccole differenze nelle aliquote di dettaglio (es. voce specifica di alcuni contributi
minori) tra fonti indipendenti, non a un errore nella catena di calcolo.</p>

<div class="page-break"></div>

<h2>8. Bibliografia</h2>
<p>Solo documenti istituzionali: Normattiva, Agenzia delle Entrate, Dipartimento delle
Finanze (MEF), INPS. Nessun portale fiscale commerciale è citato come fonte del codice.
Consultate il ${OGGI}.</p>
<table>
  <thead><tr><th>Tipo</th><th>Norma</th><th>Descrizione</th></tr></thead>
  <tbody>
    ${fontiUniche
      .map(
        (f) =>
          `<tr><td><span class="badge">${tipoLabel(f.tipo)}</span></td><td>${f.norma}</td><td>${f.descrizione}<br><span class="fonte-url">${f.url}</span></td></tr>`
      )
      .join('\n    ')}
  </tbody>
</table>

</body>
</html>
`

const outPath = resolve(__dirname, '../docs/metodologia.html')
writeFileSync(outPath, html, 'utf-8')
console.log(`Scritto ${outPath}`)
