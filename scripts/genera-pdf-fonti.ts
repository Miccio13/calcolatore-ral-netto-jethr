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
import { calcola } from '../src/lib/tax/calcola'
import { COMUNI_2026 } from '../src/lib/tax/comuni-2026'
import { DOMINI_ISTITUZIONALI, FONTI, type Fonte } from '../src/lib/tax/fonti'
import { REGIONI_2026 } from '../src/lib/tax/regioni-2026'
import { INPUT_DEFAULT } from '../src/lib/tax/types'
import { BRAND_CSS, copertina } from './pdf-brand'

const OGGI = '7 agosto 2026'

function tipoLabel(tipo: Fonte['tipo']): string {
  return { norma: 'Norma', prassi: 'Prassi', 'atto-locale': 'Atto locale' }[tipo]
}

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
const vociPerFonte = new Map<string, Set<string>>()
for (const input of CASI_SONDA) {
  const r = calcola(input)
  for (const voce of [...r.breakdown, ...r.costoAzienda.breakdown]) {
    const set = vociPerFonte.get(voce.fonte.id) ?? new Set<string>()
    // Il nome del comune finisce nell'etichetta: normalizzato, o la stessa voce
    // comparirebbe più volte al cambiare della città scelta.
    set.add(voce.label.replace(/\s*\(.*\)$/, ''))
    vociPerFonte.set(voce.fonte.id, set)
  }
}

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
    'Verifica dedicata sul comune del caso di default, da cui proviene anche la conferma che l’esenzione comunale è una soglia e non una franchigia — meccanismo poi applicato a tutti i comuni.',
}

const fonti = Object.values(FONTI)
const operative = fonti.filter((f) => vociPerFonte.has(f.id))
const contesto = fonti.filter((f) => !vociPerFonte.has(f.id))

function scheda(f: Fonte, dettaglio: string, etichettaDettaglio: string): string {
  return `
<div class="fonte keep">
  <div class="fonte-head">
    <span class="badge">${tipoLabel(f.tipo)}</span>
    <span class="fonte-norma">${f.norma}</span>
  </div>
  <p class="fonte-desc">${f.descrizione}</p>
  <p class="fonte-uso"><span class="fonte-uso-label">${etichettaDettaglio}</span> ${dettaglio}</p>
  <p class="url">${f.url}</p>
</div>`
}

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Jet HR — Calcolatore RAL → Netto: fonti normative</title>
<style>
${BRAND_CSS}

  .fonte {
    border: 0.75pt solid #e8e6dc; border-left: 2.5pt solid #dbe6bd;
    border-radius: 3pt; padding: 10pt 12pt; margin: 0 0 9pt;
  }
  .fonte-head {
    display: flex; align-items: baseline; gap: 8pt;
    margin-bottom: 5pt;
  }
  .fonte-norma { font-weight: 700; font-size: 10.4pt; }
  .fonte-desc { margin: 0 0 6pt; font-size: 9.4pt; line-height: 1.5; }
  .fonte-uso {
    margin: 0 0 6pt; font-size: 9pt; line-height: 1.5;
    color: #3f4437;
  }
  .fonte-uso-label {
    font-weight: 700; color: #33501a;
    font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em;
    margin-right: 3pt;
  }
  .fonte .url { margin: 0; }

  .domini { columns: 2; column-gap: 18pt; margin: 8pt 0 14pt; }
  .domini li { margin-bottom: 4pt; break-inside: avoid; }

  .conteggio {
    display: flex; gap: 26pt; margin: 0 0 18pt;
    padding: 11pt 14pt; background: #eef3e2; border-radius: 4pt;
  }
  .conteggio div { line-height: 1.3; }
  .conteggio .n { font-size: 17pt; font-weight: 700; display: block; }
  .conteggio .l { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; color: #33501a; font-weight: 600; }
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
fonte un campo obbligatorio — il compilatore rifiuta una voce di calcolo senza norma di
riferimento — e un test automatico verifica che ogni URL appartenga a uno di questi domini:</p>

<ul class="domini">
  ${DOMINI_ISTITUZIONALI.map((d) => `<li><code>${d}</code></li>`).join('\n  ')}
</ul>

<div class="conteggio">
  <div><span class="n">${fonti.length}</span><span class="l">Fonti totali</span></div>
  <div><span class="n">${operative.length}</span><span class="l">Operative</span></div>
  <div><span class="n">${contesto.length}</span><span class="l">Di contesto</span></div>
  <div><span class="n">${REGIONI_2026.length} + ${COMUNI_2026.length}</span><span class="l">Regioni + comuni coperti</span></div>
</div>

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

<h2>4. Cosa non è una fonte</h2>
<p>Due calcolatori pubblici sono stati usati come <em>benchmark</em> per un confronto di
sanità sui risultati finali, ed è così che sono citati nel documento di metodologia: servono
a rispondere alla domanda “il numero che esce è plausibile?”, non a stabilire quale sia
l’aliquota di una voce. Nessun parametro del codice proviene da loro.</p>

<h2>5. Una nota sull’onestà delle citazioni</h2>
<p>Un caso merita di essere segnalato invece che nascosto. L’aliquota contributiva
dell’apprendistato (5,84%) è confermata da tre fonti indipendenti che citano tutte lo stesso
riferimento normativo, ma il recupero del testo integrale dell’art. 1 della L. 296/2006 —
una legge finanziaria da 1.364 commi — non è riuscito tecnicamente durante la ricerca. Il
dato è quindi marcato nel registro come da rileggere sulla fonte primaria, con la ragione
scritta accanto, invece di essere presentato come verificato al pari degli altri.</p>
<p>Lo stesso vale per il verso opposto: il “troncamento a quattro decimali” nella formula
della detrazione art. 13, riportato da diversi portali fiscali, non compare né nella tabella
della circolare 4/E né in un riscontro testuale sull’articolo. Non è stato replicato nel
codice, e la scelta è annotata nel modulo che implementa quella formula.</p>

</body>
</html>
`

const outPath = resolve(__dirname, '../docs/fonti.html')
writeFileSync(outPath, html, 'utf-8')
console.log(
  `Scritto ${outPath} (${fonti.length} fonti: ${operative.length} operative, ${contesto.length} di contesto)`
)
