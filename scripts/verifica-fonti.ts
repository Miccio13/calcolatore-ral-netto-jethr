/**
 * Verifica che le fonti citate portino davvero da qualche parte, e che i link nei
 * PDF siano cliccabili.
 *
 *   npx tsx scripts/verifica-fonti.ts
 *
 * Perché non è un test di vitest: fa richieste di rete, e la suite deve poter
 * girare offline e in un quarto di secondo. Il test in __tests__/fonti.test.ts
 * resta e controlla che il dominio sia istituzionale — controllo statico, utile,
 * ma cieco su due difetti che questo script vede:
 *
 *   1. un URL che risponde 200 servendo una pagina di errore. Normattiva lo fa
 *      con le URN in forma `uri-res/N2Ls?urn:nir:…`: HTTP 200, corpo «Errore nel
 *      caricamento delle informazioni». Tre fonti del registro erano così, e due
 *      di esse erano link rotti live nel calcolatore pubblicato;
 *   2. un PDF senza annotazioni /URI, cioè con gli URL stampati come testo morto
 *      invece che come link cliccabili.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { FONTI } from '../src/lib/tax/fonti'

const RADICE = resolve(__dirname, '..')

/** Pagine che rispondono 200 ma non contengono il documento richiesto. */
const MARCATORI_DI_ERRORE = ['Errore nel caricamento delle informazioni', 'Normattiva - Errore']

const PDF_ATTESI = [
  'docs/Jet-HR_Calcolatore-RAL-Netto_Metodologia.pdf',
  'docs/Jet-HR_Calcolatore-RAL-Netto_Fonti.pdf',
  'docs/Jet-HR_Calcolatore-RAL-Netto_Fonti-Semplice.pdf',
]

type Esito = { ok: boolean; messaggio: string }

async function verificaUrl(url: string): Promise<Esito> {
  try {
    const risposta = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30_000),
      headers: { 'user-agent': 'Mozilla/5.0 (verifica fonti calcolatore RAL)' },
    })
    if (!risposta.ok) return { ok: false, messaggio: `HTTP ${risposta.status}` }

    const corpo = await risposta.text()
    const marcatore = MARCATORI_DI_ERRORE.find((m) => corpo.includes(m))
    if (marcatore) return { ok: false, messaggio: `HTTP 200 ma pagina di errore ("${marcatore}")` }

    return { ok: true, messaggio: `HTTP 200 · ${Math.round(corpo.length / 1024)} KB` }
  } catch (errore) {
    return { ok: false, messaggio: `richiesta fallita: ${(errore as Error).message}` }
  }
}

/** Conta le annotazioni /URI, cioè i link cliccabili, dentro un PDF. */
function contaLinkNelPdf(percorsoRelativo: string): number {
  const contenuto = readFileSync(resolve(RADICE, percorsoRelativo), 'latin1')
  return contenuto.split('/URI').length - 1
}

async function main(): Promise<void> {
  let problemi = 0

  console.log('Fonti — raggiungibilità\n')
  const fonti = Object.values(FONTI)
  const esiti = await Promise.all(fonti.map((f) => verificaUrl(f.url)))

  fonti.forEach((fonte, i) => {
    const esito = esiti[i]
    if (!esito.ok) problemi++
    console.log(`  ${esito.ok ? '✓' : '✗'} ${fonte.id} — ${esito.messaggio}`)
    if (!esito.ok) console.log(`      ${fonte.url}`)
  })

  console.log('\nPDF — link cliccabili\n')
  for (const pdf of PDF_ATTESI) {
    let link = 0
    try {
      link = contaLinkNelPdf(pdf)
    } catch {
      console.log(`  ✗ ${pdf} — non trovato, rigenera con ./scripts/genera-pdf.sh`)
      problemi++
      continue
    }
    // Ogni fonte deve comparire almeno una volta come link in ciascun documento:
    // sotto questa soglia qualcosa è tornato a essere testo morto.
    const ok = link >= fonti.length
    if (!ok) problemi++
    console.log(`  ${ok ? '✓' : '✗'} ${pdf} — ${link} link (attesi almeno ${fonti.length})`)
  }

  if (problemi > 0) {
    console.log(`\n${problemi} problem${problemi === 1 ? 'a' : 'i'} da sistemare.`)
    process.exit(1)
  }
  console.log('\nTutte le fonti sono raggiungibili e i PDF hanno link cliccabili.')
}

void main()
