import { formatNumero } from '../format'
import type { Comune } from './comuni-2026'
import { FONTI } from './fonti'
import { calcolaProgressivo } from './progressive'
import type { RegioneAddizionale } from './regioni-2026'
import type { VoceBreakdown } from './types'

/**
 * Addizionale regionale IRPEF: gestisce le cinque meccaniche osservate nelle
 * leggi regionali (vedi regioni-2026.ts) — progressiva a scaglioni marginali
 * (come l'IRPEF nazionale), aliquota unica flat, esenzione sotto soglia con
 * aliquota piena sull'intero imponibile sopra soglia, aliquota di fascia
 * sull'intero imponibile (Friuli-VG), progressiva con clausola di aliquota
 * unica sotto soglia e detrazione di raccordo (Lazio 2026).
 *
 * Semplificazione dichiarata, invariata dalla v1: per legge l'addizionale si
 * applica sul reddito dell'anno precedente, con versamento in 11 rate l'anno
 * successivo. In questa proiezione annuale si assume lo stesso anno d'imposta.
 */
export function calcolaAddizionaleRegionale(
  regione: RegioneAddizionale,
  imponibile: number
): VoceBreakdown {
  let importo: number
  let formula: string

  if (regione.tipo === 'flat') {
    importo = imponibile * regione.aliquota
    formula = `${(regione.aliquota * 100).toFixed(2)}% su imponibile ${formatNumero(imponibile)} = ${importo.toFixed(2)}`
  } else if (regione.tipo === 'sogliaFlat') {
    const esente = imponibile <= regione.soglia
    importo = esente ? 0 : imponibile * regione.aliquota
    formula = esente
      ? `esente: imponibile ${formatNumero(imponibile)} ≤ ${formatNumero(regione.soglia)}`
      : `${(regione.aliquota * 100).toFixed(2)}% sull'intero imponibile ${formatNumero(imponibile)} (soglia ${formatNumero(regione.soglia)} superata) = ${importo.toFixed(2)}`
  } else if (regione.tipo === 'fasceIntere') {
    const fascia =
      regione.fasce.find((f) => imponibile <= f.finoA) ?? regione.fasce[regione.fasce.length - 1]
    importo = imponibile * fascia.aliquota
    formula = `${(fascia.aliquota * 100).toFixed(2)}% sull'intero imponibile ${formatNumero(imponibile)} (aliquota della fascia di appartenenza) = ${importo.toFixed(2)}`
  } else if (regione.tipo === 'progressivoConClausola') {
    if (imponibile <= regione.clausola.imponibileFinoA) {
      importo = imponibile * regione.clausola.aliquota
      formula = `${(regione.clausola.aliquota * 100).toFixed(2)}% sull'intero imponibile ${formatNumero(imponibile)} (clausola per imponibili ≤ ${formatNumero(regione.clausola.imponibileFinoA)}) = ${importo.toFixed(2)}`
    } else {
      const lordo = calcolaProgressivo(imponibile, regione.scaglioni)
      const detrazione =
        regione.detrazione &&
        imponibile > regione.detrazione.da &&
        imponibile <= regione.detrazione.a
          ? regione.detrazione.importo
          : 0
      importo = Math.max(0, lordo - detrazione)
      formula =
        detrazione > 0
          ? `progressiva per scaglioni su imponibile ${formatNumero(imponibile)} − detrazione ${detrazione} = ${importo.toFixed(2)}`
          : `progressiva per scaglioni su imponibile ${formatNumero(imponibile)} = ${importo.toFixed(2)}`
    }
  } else {
    importo = calcolaProgressivo(imponibile, regione.scaglioni)
    formula = `progressiva per scaglioni su imponibile ${formatNumero(imponibile)} = ${importo.toFixed(2)}`
  }

  return {
    id: 'addizionale-regionale',
    label: 'Addizionale regionale',
    importo,
    segno: 'trattenuta',
    percentualeRal: imponibile > 0 ? importo / imponibile : 0,
    formula,
    fonte: FONTI.addizionaliRegionali2026,
  }
}

/**
 * Addizionale comunale IRPEF. Meccanica uniforme (verificata su Milano ed
 * estesa agli altri comuni): sotto la soglia di esenzione zero, sopra soglia
 * si applicano gli scaglioni in modo marginale sull'intero imponibile — è una
 * soglia, non una franchigia. Un comune con aliquota unica è semplicemente un
 * array di un solo scaglione, quindi la stessa funzione copre entrambi i casi.
 *
 * Accetta anche un comune "personalizzato" (aliquota/soglia inseriti a mano
 * dall'utente per un comune non presente nel dataset) con la stessa forma.
 */
export function calcolaAddizionaleComunale(
  comune: Pick<Comune, 'nome' | 'soglia' | 'scaglioni'>,
  imponibile: number
): VoceBreakdown {
  const esente = imponibile <= comune.soglia
  const importo = esente ? 0 : calcolaProgressivo(imponibile, comune.scaglioni)

  return {
    id: 'addizionale-comunale',
    label: `Addizionale comunale (${comune.nome})`,
    importo,
    segno: 'trattenuta',
    percentualeRal: imponibile > 0 ? importo / imponibile : 0,
    formula: esente
      ? `esente: imponibile ${formatNumero(imponibile)} ≤ ${formatNumero(comune.soglia)}`
      : `su imponibile ${formatNumero(imponibile)} (soglia ${formatNumero(comune.soglia)} superata) = ${importo.toFixed(2)}`,
    fonte: FONTI.addizionaliComunali2026,
  }
}
