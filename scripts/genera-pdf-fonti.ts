/**
 * Genera docs/fonti.html: il registro completo delle fonti normative del
 * calcolatore, con l'indicazione di dove ciascuna incide sul calcolo.
 *
 * La sezione "fonti operative" non è scritta a mano: si ottiene eseguendo il
 * motore su una batteria di input scelti per attivare tutte le voci possibili e
 * raccogliendo, per ogni fonte, le voci di risultato che la citano. Se domani
 * una voce cambiasse fonte, questo documento lo direbbe da solo.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { COMUNI_2026 } from '../src/lib/tax/comuni-2026'
import { FONTI, type Fonte } from '../src/lib/tax/fonti'
import { REGIONI_2026 } from '../src/lib/tax/regioni-2026'
import { INPUT_DEFAULT } from '../src/lib/tax/types'
import { BRAND_CSS, copertina } from './pdf-brand'
import { FONTI_CSS, listaDomini, raccogliVociPerFonte, scheda } from './pdf-fonti-condiviso'

const OGGI = '9 agosto 2026'

/**
 * Input scelti per far comparire nel breakdown ogni voce che il motore sa
 * produrre: redditi bassi per i bonus, redditi medi per le detrazioni da cuneo,
 * un caso con familiari a carico, uno con welfare oltre soglia, uno in
 * apprendistato.
 */
const CASI_SONDA = [
  { ...INPUT_DEFAULT, ral: 12_000 },
  { ...INPUT_DEFAULT, ral: 22_000 },
  { ...INPUT_DEFAULT, ral: 35_000 },
  { ...INPUT_DEFAULT, ral: 70_000 },
  { ...INPUT_DEFAULT, ral: 40_000, coniugeACarico: true, figliACarico: 2, altriFamiliariACarico: 1 },
  { ...INPUT_DEFAULT, ral: 35_000, welfareAnnuo: 1_500 },
  { ...INPUT_DEFAULT, ral: 20_000, tipoContratto: 'apprendistato' as const },
]

/** fonteId -> etichette delle voci di risultato che la citano. */
const vociPerFonte = raccogliVociPerFonte(CASI_SONDA)

/**
 * Fonti che non compaiono in una singola voce di risultato ma che reggono il
 * modello: dichiarate a mano perché il loro ruolo è di contesto, e fingere una
 * derivazione automatica sarebbe una finzione.
 */
const RUOLI_DI_CONTESTO: Record<string, string> = {
  ldb2025:
    'Testo che introduce a regime scaglioni, detrazione da 1.955 €, correttivo di 75 € sul trattamento integrativo e le due misure da cuneo fiscale. È la norma sottostante a più voci operative.',
  tuirArt11:
    'Definisce la struttura di scaglioni e aliquote su cui opera il calcolo dell’imposta lorda, nella versione modificata dalla legge di bilancio 2026.',
  tuirArt51:
    'Stabilisce che i contributi previdenziali obbligatori non concorrono a formare il reddito di lavoro dipendente: è la ragione per cui l’imponibile fiscale si ottiene sottraendo i contributi dalla RAL.',
  circolareAde4e2025:
    'Documento di prassi da cui provengono le tabelle ufficiali di scaglioni e detrazioni, gli esempi numerici della somma integrativa e la spiegazione del correttivo di 75 €.',
  addizionaleRegionaleLombardia:
    'Verifica dedicata sulla regione del caso di default: base giuridica e aliquote lette singolarmente, prima di estendere la copertura a tutte le regioni.',
  addizionaleComunaleMilano:
    'Verifica dedicata sul comune del caso di default, da cui proviene anche la conferma che l’esenzione comunale è una soglia e non una franchigia, meccanismo poi applicato a tutti i comuni.',
  circolareAde4e2022:
    'Chiarisce la meccanica della maggiorazione di 65 € (art. 13 c.1.1): spetta per intero, senza ragguaglio al periodo di lavoro. Nel motore è per questo l’unico addendo che si somma dopo il riproporzionamento della detrazione.',
  addizionaleRegionaleLazio:
    'Il Lazio 2026 non segue la progressione marginale standard: sotto 28.000 € vale l’1,73% sull’intero imponibile, sopra scattano gli scaglioni con una detrazione di raccordo di 60 €. La meccanica dedicata implementata nel motore deriva da questo prospetto.',
  addizionaleRegionaleFriuli:
    'Il Friuli-VG applica l’aliquota della fascia di appartenenza all’intero imponibile (0,70% fino a 15.000 €, 1,23% sopra), non una progressione a scaglioni. Anche qui il motore usa una meccanica dedicata, derivata da questo prospetto.',
}

const fonti: Fonte[] = Object.values(FONTI)
const operative = fonti.filter((f) => vociPerFonte.has(f.id))
const contesto = fonti.filter((f) => !vociPerFonte.has(f.id))

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Jet HR · Calcolatore RAL Netto: fonti normative</title>
<style>
${BRAND_CSS}
${FONTI_CSS}
</style>
</head>
<body>

${copertina({
  kicker: 'Product Builder · Esercizio di selezione',
  titolo: 'Fonti normative',
  sottotitolo: 'Ogni parametro del calcolatore e il documento istituzionale da cui proviene',
  meta: `Anno d’imposta <strong>2026</strong> · ${fonti.length} fonti, tutte consultate il ${OGGI}<br>
    Documento generato automaticamente dal registro delle fonti del motore di calcolo`,
})}

<h2>1. La regola</h2>
<p>In questo progetto un parametro entra nel codice solo se proviene da un documento
pubblicato da un’istituzione: Normattiva, Gazzetta Ufficiale, Agenzia delle Entrate,
Dipartimento delle Finanze, INPS, MEF. I portali fiscali commerciali sono serviti a
orientarsi durante la ricerca, ma <strong>nessuno di essi è citato come fonte di un
parametro</strong>: in un esercizio che si gioca sulla capacità di risalire alle fonti,
una nota che rimanda a un blog fiscale vale meno di nessuna nota.</p>

<p>La regola non è affidata alla buona volontà. Le fonti vivono in un unico registro
tipizzato (<code>src/lib/tax/fonti.ts</code>), il tipo <code>VoceBreakdown</code> rende la
fonte un campo obbligatorio (il compilatore rifiuta una voce di calcolo senza norma di
riferimento) e un test automatico verifica che ogni URL appartenga a uno di questi domini:</p>

${listaDomini()}

<div class="conteggio">
  <div><span class="n">${fonti.length}</span><span class="l">Fonti totali</span></div>
  <div><span class="n">${operative.length}</span><span class="l">Operative</span></div>
  <div><span class="n">${contesto.length}</span><span class="l">Di contesto</span></div>
  <div><span class="n">${REGIONI_2026.length} + ${COMUNI_2026.length}</span><span class="l">Regioni + comuni coperti</span></div>
</div>

<div class="page-break"></div>

<h2>2. Fonti operative</h2>
<p>Fonti citate direttamente da una voce del risultato. L’elenco delle voci qui sotto non è
scritto a mano: si ottiene eseguendo il motore su una batteria di casi scelti per attivare
ogni voce possibile e raccogliendo, per ciascuna fonte, chi la cita.</p>

${operative
  .map((f) =>
    scheda(f, [...(vociPerFonte.get(f.id) ?? [])].sort().join(' · '), 'Voci che la citano')
  )
  .join('\n')}

<div class="page-break"></div>

<h2>3. Fonti di contesto</h2>
<p>Documenti che reggono il modello senza essere legati a una singola voce del risultato:
la norma sottostante a più voci operative, il testo di prassi da cui provengono le tabelle
ufficiali, o la verifica dedicata sul caso di default. Il loro ruolo è dichiarato qui
esplicitamente, perché una derivazione automatica sarebbe una finzione.</p>

${contesto
  .map((f) => scheda(f, RUOLI_DI_CONTESTO[f.id] ?? '—', 'Ruolo nel modello'))
  .join('\n')}

</body>
</html>
`

const outPath = resolve(__dirname, '../docs/fonti.html')
writeFileSync(outPath, html, 'utf-8')
console.log(
  `Scritto ${outPath} (${fonti.length} fonti: ${operative.length} operative, ${contesto.length} di contesto)`
)
