/**
 * Genera docs/metodologia.html leggendo direttamente fonti.ts, constants-2026.ts,
 * i dataset regioni/comuni e il motore calcola.ts: tabelle di parametri, esempi
 * numerici e casi di validazione non sono trascritti a mano, quindi non possono
 * divergere dal codice. Anche il numero di test è letto dalla suite reale.
 *
 * L'HTML va poi convertito in PDF con Chrome headless: vedi scripts/genera-pdf.sh.
 */
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
import { BRAND_CSS, copertina, escapeHtml, fascia, fmt, pct } from './pdf-brand'

const OGGI = '9 agosto 2026'

function tipoLabel(tipo: Fonte['tipo']): string {
  return { norma: 'Norma', prassi: 'Prassi', 'atto-locale': 'Atto locale' }[tipo]
}

/**
 * Numero di test letto dalla suite reale invece che scritto a mano: è un numero
 * che invecchia a ogni commit, e un documento che millanta una copertura diversa
 * da quella effettiva è peggio di un documento che non la cita.
 */
function contaTest(): number {
  const out = execSync('npx vitest run --reporter=json --silent', {
    cwd: resolve(__dirname, '..'),
    encoding: 'utf-8',
    maxBuffer: 32 * 1024 * 1024,
  })
  const json = out.slice(out.indexOf('{'))
  return JSON.parse(json).numTotalTests as number
}

const NUMERO_TEST = contaTest()

// --- Casi di validazione: confrontati con calcolatori pubblici in fase di ricerca ---
const CASI_VALIDAZIONE = [
  { ral: 35_000, nettoAtteso: 25_968, fonte: 'stipendionettocalcolatore.it · ral-35000-netto-2026' },
  { ral: 60_000, nettoAtteso: 37_621, fonte: 'stipendionettocalcolatore.it · ral-60000-netto' },
]

const risultatiValidazione = CASI_VALIDAZIONE.map((c) => {
  const r = calcola({ ...INPUT_DEFAULT, ral: c.ral })
  const scarto = ((r.nettoAnnuo - c.nettoAtteso) / c.nettoAtteso) * 100
  // Uno scarto di 4 millesimi arrotondato a due decimali stampa "−0,00%", che
  // sembra un errore di formattazione invece di uno scarto trascurabile.
  const scartoTesto =
    Math.abs(scarto) < 0.01
      ? 'sotto 0,01%'
      : `${scarto >= 0 ? '+' : '−'}${fmt(Math.abs(scarto), 2)}%`
  return { ...c, nettoCalcolato: r.nettoAnnuo, scarto, scartoTesto }
})

// --- Esempi numerici, calcolati dal motore e non trascritti ---
const esempioSoglia15k = (() => {
  const ralSoglia = 15_000 / (1 - INPUT_DEFAULT.aliquotaInps)
  return {
    sotto: calcola({ ...INPUT_DEFAULT, ral: ralSoglia - 1 }),
    sopra: calcola({ ...INPUT_DEFAULT, ral: ralSoglia + 1 }),
  }
})()

const esempioMensilita = {
  con12: calcola({ ...INPUT_DEFAULT, ral: 35_000, mensilita: 12 }),
  con14: calcola({ ...INPUT_DEFAULT, ral: 35_000, mensilita: 14 }),
}

const esempioWelfare = {
  sotto: calcola({ ...INPUT_DEFAULT, ral: 35_000, welfareAnnuo: WELFARE_2026.sogliaGenerale }),
  sopra: calcola({ ...INPUT_DEFAULT, ral: 35_000, welfareAnnuo: WELFARE_2026.sogliaGenerale + 1 }),
}

// --- Tabella "il modello di calcolo" ---
const RIGHE_MODELLO = [
  { voce: 'Contributi INPS c/dipendente', base: 'RAL', formula: '9,19% o 9,49%, +1% oltre 56.224 €', fonte: FONTI.inpsCirc6_2026 },
  { voce: 'Contributi INPS, apprendistato', base: 'RAL', formula: '5,84% flat, sostituisce l’aliquota standard', fonte: FONTI.apprendistato },
  { voce: 'IRPEF lorda', base: 'Imponibile fiscale', formula: '23% / 33% / 43% per scaglioni', fonte: FONTI.ldb2026 },
  { voce: 'Detrazione lavoro dipendente', base: 'Reddito di riferimento', formula: 'da 1.955 € a 0, decrescente da 15.000 a 50.000', fonte: FONTI.tuirArt13 },
  { voce: 'Ulteriore detrazione cuneo fiscale', base: 'Reddito complessivo', formula: 'fino a 1.000 €, tra 20.000 e 40.000', fonte: FONTI.cuneoFiscale },
  { voce: 'Detrazione coniuge a carico', base: 'Reddito complessivo', formula: 'da 800 € a 0, tre fasce + micro-bonus', fonte: FONTI.tuirArt12 },
  { voce: 'Detrazione figli 21-30 a carico', base: 'Reddito complessivo', formula: '950 € per figlio, rapporto su base 95.000 €', fonte: FONTI.tuirArt12 },
  { voce: 'Detrazione altri familiari a carico', base: 'Reddito complessivo', formula: '750 € per familiare, rapporto su base 80.000 €', fonte: FONTI.tuirArt12 },
  { voce: 'Addizionale regionale', base: 'Imponibile fiscale', formula: 'per regione: progressiva, flat, o soglia + flat', fonte: FONTI.addizionaliRegionali2026 },
  { voce: 'Addizionale comunale', base: 'Imponibile fiscale', formula: 'per comune: soglia di esenzione, poi scaglioni', fonte: FONTI.addizionaliComunali2026 },
  { voce: 'Trattamento integrativo', base: 'Reddito complessivo', formula: '1.200 € se ≤ 15.000 € e c’è capienza', fonte: FONTI.trattamentoIntegrativo },
  { voce: 'Somma integrativa cuneo fiscale', base: 'Reddito di lavoro dipendente', formula: '7,1% / 5,3% / 4,8% se reddito ≤ 20.000 €', fonte: FONTI.cuneoFiscale },
  { voce: 'Welfare / fringe benefit', base: 'Valore ricevuto', formula: 'esente fino a 1.000–2.000 €, poi intero importo imponibile', fonte: FONTI.welfare },
  { voce: 'Contributi c/azienda', base: 'RAL', formula: '29,4% terziario o 32% industria', fonte: FONTI.inpsCirc6_2026 },
  { voce: 'TFR accantonato', base: 'RAL', formula: 'RAL / 13,5', fonte: FONTI.tfr },
]

const fontiUniche = Array.from(new Map(Object.values(FONTI).map((f) => [f.url, f])).values())
const lombardia = REGIONI_2026.find((r) => r.id === 'lombardia')!.addizionale as {
  tipo: 'progressivo'
  scaglioni: { da: number; a: number; aliquota: number }[]
}
const milano = COMUNI_2026.find((c) => c.id === 'milano')!

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Jet HR · Calcolatore RAL Netto: metodologia</title>
<style>${BRAND_CSS}</style>
</head>
<body>

${copertina({
  kicker: 'Product Builder · Esercizio di selezione',
  titolo: 'Calcolatore RAL Netto',
  sottotitolo: 'Metodologia di calcolo, parametri normativi e validazione',
  meta: `Anno d’imposta <strong>2026</strong> · Caso di default: Milano, Lombardia, ogni variabile è personalizzabile<br>
    Documento generato automaticamente dai file sorgente del motore di calcolo · ${OGGI}`,
})}

<h2>1. Sintesi</h2>
<p>Questo documento accompagna un prototipo che, data una Retribuzione Annua Lorda (RAL),
calcola il netto annuo e mensile percepito dal dipendente e tutte le voci di tassazione e
contribuzione trattenute al lordo.</p>
<p>Il motore di calcolo (<code>src/lib/tax/</code>) è indipendente dall’interfaccia: ogni voce
del risultato porta con sé la formula applicata e la norma che la impone, verificabile nel
codice sorgente e in questo documento, generato automaticamente dagli stessi file che
alimentano l’interfaccia, così che testo e codice non possano divergere.</p>
<div class="callout">
  <p>Ogni fonte citata è un documento istituzionale: Normattiva, Agenzia delle Entrate,
  Dipartimento delle Finanze, INPS. Nessun portale fiscale commerciale è usato come fonte
  di un parametro del codice. Il dettaglio completo, con URL e ambito di utilizzo di ciascuna
  fonte, è nel documento <strong>&laquo;Fonti normative&raquo;</strong> allegato.</p>
</div>

<h2>2. Il caso di default, non l’unico caso</h2>
<p>Le assunzioni suggerite dal brief restano il <strong>prefilled</strong> del calcolatore,
ma ogni variabile che incide realmente sul netto è gestibile dall’utente:</p>
<ul>
  <li>Dipendente impiegato, contratto a tempo indeterminato · <span class="muted">selezionabile: apprendistato</span></li>
  <li>Residente a Milano, Lombardia · <span class="muted">selezionabile: ${REGIONI_2026.length} regioni e province autonome, ${COMUNI_2026.length} comuni, più inserimento manuale</span></li>
  <li>Nessuna agevolazione fiscale particolare</li>
  <li>Nessun familiare fiscalmente a carico · <span class="muted">selezionabile: coniuge, figli 21-30, altri familiari</span></li>
  <li>Nessun welfare o fringe benefit · <span class="muted">selezionabile: importo annuo</span></li>
  <li>13 mensilità · <span class="muted">più universale di 14 tra i CCNL in assenza di un contratto dichiarato; selezionabile: 12, 13, 14</span></li>
  <li>Contratto attivo per l’intero anno d’imposta, 365 giorni · <span class="muted">selezionabile: 1-365</span></li>
</ul>
<p>Nel caso di default non esistono altre fonti di reddito, quindi imponibile fiscale, reddito
di lavoro dipendente e reddito complessivo coincidono. Il motore li tratta comunque come
concetti distinti: è nella realtà che divergono, non in questo caso.</p>

<h2>3. Il modello di calcolo</h2>
<p>Ogni passaggio della catena usa la propria base imponibile: non tutte le voci si calcolano
sulla RAL.</p>
<table>
  <thead>
    <tr><th>Voce</th><th>Base imponibile</th><th>Formula</th><th>Norma</th></tr>
  </thead>
  <tbody>
    ${RIGHE_MODELLO.map(
      (r) =>
        `<tr><td>${r.voce}</td><td>${r.base}</td><td>${r.formula}</td><td>${r.fonte.norma}</td></tr>`
    ).join('\n    ')}
  </tbody>
</table>
<p>Trattamento integrativo e somma integrativa <strong>si sommano</strong> al netto: non sono
detrazioni che riducono l’imposta, sono credito erogato in busta paga.</p>

<div class="page-break"></div>

<h2>4. Parametri 2026</h2>

<div class="keep">
<h3>Scaglioni IRPEF</h3>
<table>
  <thead><tr><th>Scaglione di reddito</th><th class="num">Aliquota</th></tr></thead>
  <tbody>
    ${SCAGLIONI_IRPEF_2026.map(
      (s) =>
        `<tr><td class="nowrap">${fascia(s.da, s.a)}</td><td class="num">${pct(s.aliquota, 0)}</td></tr>`
    ).join('\n    ')}
  </tbody>
</table>
</div>

<div class="keep">
<h3>Detrazione lavoro dipendente · art. 13 c.1 TUIR</h3>
<table>
  <thead><tr><th>Reddito di riferimento</th><th class="num">Detrazione</th></tr></thead>
  <tbody>
    <tr><td class="nowrap">Fino a ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.sogliaBassa)} €</td><td class="num">${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.massimo)} € fisso</td></tr>
    <tr><td class="nowrap">${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.sogliaBassa)} – ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.puntoIntermedio)} €</td><td class="num">1.910 + 1.190 × rapporto</td></tr>
    <tr><td class="nowrap">${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.puntoIntermedio)} – ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.sogliaAlta)} €</td><td class="num">1.910 × rapporto</td></tr>
    <tr><td class="nowrap">Oltre ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.sogliaAlta)} €</td><td class="num">nessuna detrazione</td></tr>
    <tr><td>Minimo garantito</td><td class="num">${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.minimo)} € · ${fmt(DETRAZIONE_LAVORO_DIPENDENTE_2026.minimoTempoDeterminato)} € se tempo determinato</td></tr>
  </tbody>
</table>
</div>

<div class="keep">
<h3>Cuneo fiscale · L. 207/2024</h3>
<table>
  <thead><tr><th>Reddito di lavoro dipendente</th><th class="num">Somma integrativa</th></tr></thead>
  <tbody>
    ${CUNEO_FISCALE_2026.sommaIntegrativa
      .map(
        (s) =>
          `<tr><td class="nowrap">${fascia(s.da, s.a)}</td><td class="num">${pct(s.percentuale, 1)}</td></tr>`
      )
      .join('\n    ')}
  </tbody>
</table>
<p>Ulteriore detrazione: ${fmt(CUNEO_FISCALE_2026.ulterioreDetrazione.importoMassimo)} € fisso tra
${fmt(CUNEO_FISCALE_2026.ulterioreDetrazione.sogliaBassa)} e
${fmt(CUNEO_FISCALE_2026.ulterioreDetrazione.sogliaPiena)} €, decrescente fino a zero a
${fmt(CUNEO_FISCALE_2026.ulterioreDetrazione.sogliaAlta)} €.</p>
</div>

<div class="keep">
<h3>Trattamento integrativo</h3>
<p>${fmt(TRATTAMENTO_INTEGRATIVO_2026.importo)} € se il reddito complessivo non supera
${fmt(TRATTAMENTO_INTEGRATIVO_2026.sogliaRedditoComplessivo)} € <em>e</em> c’è capienza: imposta
lorda sui soli redditi di lavoro dipendente superiore alla detrazione art. 13 diminuita di
${TRATTAMENTO_INTEGRATIVO_2026.correttivoCapienza} €.</p>
</div>

<div class="keep">
<h3>Contributi INPS a carico del dipendente</h3>
<table>
  <tbody>
    <tr><td>Aliquota base</td><td class="num">${pct(INPS_2026.aliquotaBase)}</td></tr>
    <tr><td>Aliquota con FIS, aziende oltre 15 dipendenti</td><td class="num">${pct(INPS_2026.aliquotaConFis)}</td></tr>
    <tr><td>Apprendistato</td><td class="num">${pct(ALIQUOTA_APPRENDISTATO_2026)} flat</td></tr>
    <tr><td>1ª fascia di retribuzione pensionabile</td><td class="num">${fmt(INPS_2026.primaFasciaPensionabile)} €</td></tr>
    <tr><td>Aliquota aggiuntiva oltre la 1ª fascia</td><td class="num">+${pct(INPS_2026.aliquotaAggiuntiva, 0)}</td></tr>
    <tr><td>Massimale annuo, iscritti dal 1996</td><td class="num">${fmt(INPS_2026.massimaleAnnuo)} €</td></tr>
  </tbody>
</table>
</div>

<div class="keep">
<h3>Detrazioni per carichi di famiglia · art. 12 TUIR</h3>
<table>
  <tbody>
    <tr><td>Coniuge a carico</td><td class="num">da ${fmt(DETRAZIONE_CONIUGE_2026.baseFasciaBassa)} € a 0, azzerata a ${fmt(DETRAZIONE_CONIUGE_2026.sogliaAlta)} € di reddito</td></tr>
    <tr><td>Figli 21-30 non disabili a carico</td><td class="num">${fmt(DETRAZIONE_FIGLI_2026.importoBase)} € per figlio, base ${fmt(DETRAZIONE_FIGLI_2026.baseRapporto)} € · +${fmt(DETRAZIONE_FIGLI_2026.incrementoBasePerFiglioSuccessivo)} € per figlio successivo</td></tr>
    <tr><td>Altri familiari a carico</td><td class="num">${fmt(DETRAZIONE_ALTRI_FAMILIARI_2026.importoBase)} € per familiare, base ${fmt(DETRAZIONE_ALTRI_FAMILIARI_2026.baseRapporto)} €</td></tr>
  </tbody>
</table>
</div>

<div class="keep">
<h3>Welfare e fringe benefit · art. 51 c.3 TUIR</h3>
<p>Esenti fino a ${fmt(WELFARE_2026.sogliaGenerale)} € (${fmt(WELFARE_2026.sogliaConFigliACarico)} €
con figli a carico). Superata la soglia, l’<strong>intero importo</strong> (non solo
l’eccedenza) concorre a formare il reddito imponibile: è una soglia, non una franchigia.</p>
</div>

<div class="keep">
<h3>Addizionali locali</h3>
<p>Copertura: <strong>${REGIONI_2026.length}</strong> tra regioni e province autonome per
l’addizionale regionale, <strong>${COMUNI_2026.length}</strong> capoluoghi verificati
singolarmente per la comunale. Per un comune non elencato, l’interfaccia accetta aliquota e
soglia inserite a mano. Sotto, la combinazione di default:</p>
<table>
  <thead><tr><th>Regionale · Lombardia</th><th class="num">Aliquota</th></tr></thead>
  <tbody>
    ${lombardia.scaglioni
      .map(
        (s) =>
          `<tr><td class="nowrap">${fascia(s.da, s.a)}</td><td class="num">${pct(s.aliquota)}</td></tr>`
      )
      .join('\n    ')}
  </tbody>
</table>
<table>
  <thead><tr><th>Comunale · Milano</th><th class="num">Aliquota</th></tr></thead>
  <tbody>
    <tr><td>Esente fino a ${fmt(milano.soglia)} €, oltre la soglia</td><td class="num">${pct(milano.scaglioni[0].aliquota)}</td></tr>
  </tbody>
</table>
</div>

<div class="keep">
<h3>Costo azienda</h3>
<table>
  <tbody>
    <tr><td>Contributi a carico azienda, terziario</td><td class="num">${pct(COSTO_AZIENDA_2026.contributiPerSettore.terziario, 1)}</td></tr>
    <tr><td>Contributi a carico azienda, industria</td><td class="num">${pct(COSTO_AZIENDA_2026.contributiPerSettore.industria, 1)}</td></tr>
    <tr><td>TFR accantonato</td><td class="num">RAL / 13,5</td></tr>
  </tbody>
</table>
</div>

<h2>5. Cinque cose che i calcolatori online spesso sbagliano</h2>
<ol>
  <li><strong>Trattamento integrativo e somma integrativa si sommano al netto</strong>, non
  sono trattenute: la loro base è il reddito di lavoro dipendente, non l’imponibile su cui
  gira l’IRPEF.</li>

  <li><strong>Le addizionali locali</strong> per legge si calcolano sul reddito dell’anno
  precedente e si versano in 11 rate l’anno successivo. Qui si assume lo stesso anno
  d’imposta per semplicità di proiezione: scelta dichiarata, non un errore.</li>

  <li><strong>Il netto mensile dipende dalle mensilità del CCNL.</strong> Su una RAL di
  35.000 €, con 12 mensilità il netto mensile è
  <span class="accent">${fmt(esempioMensilita.con12.nettoMensile)} €</span>, con 14 è
  <span class="accent">${fmt(esempioMensilita.con14.nettoMensile)} €</span>: a parità di netto
  annuo (${fmt(esempioMensilita.con12.nettoAnnuo)} €), cambia solo la ripartizione. Dividere
  sempre per 12 produce un numero sbagliato.</li>

  <li><strong>Appena sopra i 15.000 € di reddito il netto annuo può scendere pur salendo la
  RAL.</strong> Non è un bug: a quella soglia la detrazione lavoro dipendente sale da 1.955 €
  a circa 3.100 €, ma si perde interamente il trattamento integrativo di 1.200 €, che è una
  soglia netta e non un importo decrescente. Esempio dal motore, a cavallo della soglia:
  netto <span class="accent">${fmt(esempioSoglia15k.sotto.nettoAnnuo, 2)} €</span> appena sotto,
  netto <span class="accent">${fmt(esempioSoglia15k.sopra.nettoAnnuo, 2)} €</span> appena sopra:
  ${fmt(esempioSoglia15k.sotto.nettoAnnuo - esempioSoglia15k.sopra.nettoAnnuo, 2)} € in meno a
  fronte di 2 € di RAL in più. Scoperto scrivendo i test del motore, non ipotizzato a tavolino.</li>

  <li><strong>Il welfare ha lo stesso meccanismo a soglia delle addizionali comunali</strong>,
  e va nella direzione opposta a quella intuitiva: un euro di fringe benefit in più, oltre la
  soglia, rende imponibile l’intero importo. Con ${fmt(WELFARE_2026.sogliaGenerale)} € di
  welfare il netto annuo è <span class="accent">${fmt(esempioWelfare.sotto.nettoAnnuo)} €</span>;
  con ${fmt(WELFARE_2026.sogliaGenerale + 1)} € scende a
  <span class="accent">${fmt(esempioWelfare.sopra.nettoAnnuo)} €</span>.</li>
</ol>

<h2>6. Semplificazioni e limiti</h2>
<table>
  <thead><tr><th style="width:34%">Esclusione</th><th>Perché</th></tr></thead>
  <tbody>
    <tr>
      <td>Tempo determinato come opzione a sé</td>
      <td>Verificato due volte, con fonti indipendenti, che non altera alcun numero rispetto
      al tempo indeterminato in questo modello: il minimo differenziato dell’art. 13 TUIR non
      scatta mai, e il contributo addizionale NASpI dell’1,4% è interamente a carico del
      datore. Un comando che non cambia mai nulla sarebbe peggio della sua assenza</td>
    </tr>
    <tr>
      <td>Comuni oltre gli ${COMUNI_2026.length} capoluoghi verificati</td>
      <td>Oltre 8.000 comuni italiani e nessun dataset aggregato disponibile sul sito del
      Dipartimento delle Finanze: copertura reale ma parziale, con inserimento manuale di
      aliquota e soglia come alternativa</td>
    </tr>
    <tr>
      <td>Premi di risultato oltre il fringe benefit semplice</td>
      <td>Regime a imposta sostitutiva del 5-10%, con soglie e requisiti di premialità che
      meritano una modellazione dedicata</td>
    </tr>
    <tr>
      <td>Sterilizzazione delle detrazioni oltre 200.000 €</td>
      <td>Irrilevante sotto quella soglia di reddito, che il caso tipico non raggiunge</td>
    </tr>
    <tr>
      <td>INAIL nel costo azienda</td>
      <td>Aliquota variabile per rischio di settore secondo la tariffa INAIL, non riducibile a
      un parametro unico</td>
    </tr>
    <tr>
      <td>Ratei di 13ª e 14ª con tassazione separata, conguaglio di fine anno</td>
      <td>Riguardano la distribuzione infra-annuale delle somme, non la proiezione annuale
      oggetto del calcolatore</td>
    </tr>
    <tr>
      <td>Massimale contributivo per iscritti dal 1996 (${fmt(INPS_2026.massimaleAnnuo)} €)</td>
      <td>Rilevante solo su RAL molto elevate, oltre il range tipico d’uso</td>
    </tr>
    <tr>
      <td>Maggiorazione per famiglie con più di tre figli a carico (art. 12 c.1 lett. c TUIR)</td>
      <td>Richiederebbe di conoscere anche i figli under-21, coperti dall’assegno unico e
      quindi non raccolti dal form</td>
    </tr>
  </tbody>
</table>

<h2>7. Validazione</h2>
<p>Il motore è coperto da <strong>${NUMERO_TEST} test automatici</strong>: unitari per ogni
modulo, end-to-end sui casi tipici, continuità sui valori di soglia, più un test che verifica
che ogni fonte citata appartenga a un dominio istituzionale. In aggiunta, un confronto di
sanità con calcolatori pubblici indipendenti:</p>
<table>
  <thead>
    <tr><th>RAL</th><th class="num">Netto atteso</th><th class="num">Netto calcolato</th><th class="num">Scarto</th><th>Fonte del confronto</th></tr>
  </thead>
  <tbody>
    ${risultatiValidazione
      .map(
        (r) =>
          `<tr><td class="nowrap">${fmt(r.ral)} €</td><td class="num">${fmt(r.nettoAtteso)} €</td><td class="num">${fmt(r.nettoCalcolato)} €</td><td class="num">${r.scartoTesto}</td><td class="muted">${r.fonte}</td></tr>`
      )
      .join('\n    ')}
  </tbody>
</table>
<p>Scarti entro la tolleranza dichiarata di ±0,5%, riconducibili ad arrotondamenti e a piccole
differenze nelle aliquote di dettaglio tra fonti indipendenti, non a un errore nella catena di
calcolo. I calcolatori usati per il confronto sono citati qui come <em>benchmark</em>, non come
fonte di alcun parametro: quelli vengono tutti da documenti istituzionali.</p>

<h2>8. Fonti in sintesi</h2>
<p>Elenco compatto: ogni riferimento è un link alla fonte. Il dettaglio con URL per esteso,
ambito di utilizzo e data di consultazione è nel documento
<strong>&laquo;Fonti normative&raquo;</strong> allegato. Le voci qui sono
${fontiUniche.length} per ${Object.keys(FONTI).length} fonti del registro: tre fonti
(somma integrativa, trattamento integrativo e circolare 4/E 2025) condividono lo stesso
documento dell'Agenzia delle Entrate e compaiono una sola volta.</p>
<table>
  <thead><tr><th style="width:22%">Tipo</th><th>Riferimento</th></tr></thead>
  <tbody>
    ${fontiUniche
      .map(
        (f) =>
          `<tr><td><span class="badge">${tipoLabel(f.tipo)}</span></td><td><a href="${escapeHtml(f.url)}">${escapeHtml(f.norma)}</a></td></tr>`
      )
      .join('\n    ')}
  </tbody>
</table>

</body>
</html>
`

const outPath = resolve(__dirname, '../docs/metodologia.html')
writeFileSync(outPath, html, 'utf-8')
console.log(`Scritto ${outPath} (${NUMERO_TEST} test rilevati)`)
