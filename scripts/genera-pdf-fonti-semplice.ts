/**
 * Genera docs/fonti-semplice.html: il registro delle fonti normative per la
 * versione semplificata del calcolatore (route /semplice), stesso stampo del
 * documento della versione completa.
 *
 * La versione semplice usa lo stesso motore con un solo input (la RAL) e tutto
 * il resto fissato al caso standard: le fonti "operative" sono quindi il
 * sottoinsieme che quel caso può davvero attivare, derivato eseguendo il motore
 * — non trascritto a mano. Le fonti del motore che il caso fisso non può
 * raggiungere sono dichiarate in una sezione dedicata invece di sparire.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { FONTI, type Fonte } from '../src/lib/tax/fonti'
import { INPUT_DEFAULT } from '../src/lib/tax/types'
import { BRAND_CSS, copertina } from './pdf-brand'
import { FONTI_CSS, listaDomini, raccogliVociPerFonte, scheda } from './pdf-fonti-condiviso'

const OGGI = '9 agosto 2026'

/**
 * Casi sonda della versione semplice: varia solo la RAL, come fa l'utente sulla
 * route /semplice. Redditi bassi per i bonus, medi per le detrazioni da cuneo e
 * la maggiorazione di 65 €, alti per l'aliquota aggiuntiva INPS.
 */
const CASI_SONDA_SEMPLICE = [
  { ...INPUT_DEFAULT, ral: 12_000 },
  { ...INPUT_DEFAULT, ral: 22_000 },
  { ...INPUT_DEFAULT, ral: 35_000 },
  { ...INPUT_DEFAULT, ral: 70_000 },
]

const vociPerFonte = raccogliVociPerFonte(CASI_SONDA_SEMPLICE)

/**
 * Fonti che reggono il caso fisso senza comparire in una singola voce del
 * risultato: dichiarate a mano, come nel documento della versione completa.
 */
const RUOLI_DI_CONTESTO: Record<string, string> = {
  ldb2025:
    'Testo che introduce a regime scaglioni, detrazione da 1.955 €, correttivo di 75 € sul trattamento integrativo e le due misure da cuneo fiscale. È la norma sottostante a più voci operative.',
  tuirArt11:
    'Definisce la struttura di scaglioni e aliquote su cui opera il calcolo dell’imposta lorda, nella versione modificata dalla legge di bilancio 2026.',
  tuirArt51:
    'Stabilisce che i contributi previdenziali obbligatori non concorrono a formare il reddito di lavoro dipendente: è la ragione per cui l’imponibile fiscale si ottiene sottraendo i contributi dalla RAL.',
  circolareAde4e2022:
    'Chiarisce la meccanica della maggiorazione di 65 € (art. 13 c.1.1): spetta per intero, senza ragguaglio al periodo di lavoro. Nel caso fisso della versione semplice (anno intero) il ragguaglio non entra mai in gioco, ma la regola resta la base della formula.',
  circolareAde4e2025:
    'Documento di prassi da cui provengono le tabelle ufficiali di scaglioni e detrazioni, gli esempi numerici della somma integrativa e la spiegazione del correttivo di 75 €.',
  addizionaleRegionaleLombardia:
    'Nella versione semplice la regione non è selezionabile: è sempre la Lombardia. Questa è la base giuridica e la tabella di aliquote effettivamente applicate a ogni calcolo della route.',
  addizionaleComunaleMilano:
    'Nella versione semplice il comune non è selezionabile: è sempre Milano. Aliquota 0,80% ed esenzione fino a 23.000 € (soglia, non franchigia) applicate a ogni calcolo della route.',
}

/**
 * Fonti presenti nel motore condiviso ma non raggiungibili dal caso fisso della
 * versione semplice: il perché, dichiarato invece di ometterle.
 */
const NOTE_NON_ATTIVABILI: Record<string, string> = {
  tuirArt12:
    'Le detrazioni per familiari a carico richiedono coniuge, figli o ascendenti a carico: il caso fisso non ne prevede.',
  welfare:
    'Il caso fisso non prevede fringe benefit: la soglia di esenzione non entra mai in gioco.',
  apprendistato:
    'Il caso fisso è un contratto standard a tempo indeterminato: l’aliquota apprendisti non è selezionabile.',
  addizionaleRegionaleLazio:
    'Meccanica dedicata del Lazio 2026: attivabile solo nella versione completa, dove la regione è selezionabile.',
  addizionaleRegionaleFriuli:
    'Meccanica dedicata del Friuli-VG: attivabile solo nella versione completa, dove la regione è selezionabile.',
}

const fonti: Fonte[] = Object.values(FONTI)
const operative = fonti.filter((f) => vociPerFonte.has(f.id))
const contesto = fonti.filter((f) => !vociPerFonte.has(f.id) && RUOLI_DI_CONTESTO[f.id])
const nonAttivabili = fonti.filter((f) => !vociPerFonte.has(f.id) && !RUOLI_DI_CONTESTO[f.id])

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Jet HR · Calcolatore RAL Netto (versione semplice): fonti normative</title>
<style>
${BRAND_CSS}
${FONTI_CSS}
</style>
</head>
<body>

${copertina({
  kicker: 'Product Builder · Esercizio di selezione',
  titolo: 'Fonti normative, versione semplice',
  sottotitolo:
    'Le fonti istituzionali dietro il calcolatore a un solo input: RAL variabile, tutto il resto fissato al caso standard',
  meta: `Anno d’imposta <strong>2026</strong> · ${fonti.length} fonti nel registro condiviso, tutte consultate il ${OGGI}<br>
    Caso fisso: tempo indeterminato, CCNL terziario, 13 mensilità, Milano, anno intero, nessun carico né fringe benefit<br>
    Documento generato automaticamente dal registro delle fonti del motore di calcolo`,
})}

<h2>1. La regola</h2>
<p>La versione semplice condivide il motore di calcolo, e quindi il registro delle fonti,
con la versione completa: un parametro entra nel codice solo se proviene da un documento
pubblicato da un’istituzione (Normattiva, Gazzetta Ufficiale, Agenzia delle Entrate,
Dipartimento delle Finanze, INPS, MEF). Le fonti vivono in un unico registro tipizzato
(<code>src/lib/tax/fonti.ts</code>), il tipo <code>VoceBreakdown</code> rende la fonte un
campo obbligatorio, e un test automatico verifica che ogni URL appartenga a uno di questi
domini:</p>

${listaDomini()}

<p>Con un solo input, però, non tutto il motore è raggiungibile: le fonti qui sotto sono
divise tra quelle che il caso fisso attiva davvero, quelle che lo reggono come contesto, e
quelle che restano al servizio della sola versione completa.</p>

<div class="conteggio">
  <div><span class="n">${fonti.length}</span><span class="l">Fonti nel registro</span></div>
  <div><span class="n">${operative.length}</span><span class="l">Operative</span></div>
  <div><span class="n">${contesto.length}</span><span class="l">Di contesto</span></div>
  <div><span class="n">${nonAttivabili.length}</span><span class="l">Solo versione completa</span></div>
</div>

<div class="page-break"></div>

<h2>2. Fonti operative</h2>
<p>Fonti citate direttamente da una voce del risultato sulla route /semplice. L’elenco delle
voci non è scritto a mano: si ottiene eseguendo il motore su una batteria di RAL (l’unico
input che l’utente può variare) e raccogliendo, per ciascuna fonte, chi la cita.</p>

${operative
  .map((f) =>
    scheda(f, [...(vociPerFonte.get(f.id) ?? [])].sort().join(' · '), 'Voci che la citano')
  )
  .join('\n')}

<div class="page-break"></div>

<h2>3. Fonti di contesto</h2>
<p>Documenti che reggono il caso fisso senza essere legati a una singola voce del risultato,
inclusa la base giuridica di regione e comune, che nella versione semplice non sono
selezionabili: Lombardia e Milano valgono per ogni calcolo.</p>

${contesto
  .map((f) => scheda(f, RUOLI_DI_CONTESTO[f.id], 'Ruolo nel modello'))
  .join('\n')}

<h2>4. Fonti attivabili solo nella versione completa</h2>
<p>Il motore è condiviso, il registro pure: queste fonti restano nel codice ma il caso fisso
della versione semplice non può raggiungerle. Sono elencate per completezza, con la ragione
per cui qui non producono mai una voce di risultato.</p>

${nonAttivabili
  .map((f) => scheda(f, NOTE_NON_ATTIVABILI[f.id] ?? '—', 'Perché non si attiva qui'))
  .join('\n')}

</body>
</html>
`

const outPath = resolve(__dirname, '../docs/fonti-semplice.html')
writeFileSync(outPath, html, 'utf-8')
console.log(
  `Scritto ${outPath} (${fonti.length} fonti: ${operative.length} operative, ${contesto.length} di contesto, ${nonAttivabili.length} solo versione completa)`
)
