import { formatNumero } from '../format'
import { FONTI } from './fonti'
import { ADDIZIONALE_COMUNALE_MILANO_2026, ADDIZIONALE_REGIONALE_LOMBARDIA_2026 } from './constants-2026'
import { calcolaProgressivo } from './progressive'
import type { VoceBreakdown } from './types'

/**
 * Addizionale regionale IRPEF Lombardia: progressiva per scaglioni, stesso meccanismo
 * dell'IRPEF nazionale (art. 72 c.1 L.R. Lombardia 10/2003).
 *
 * Semplificazione dichiarata: per legge si applica sul reddito dell'anno precedente,
 * con versamento in 11 rate l'anno successivo. In questa proiezione annuale si assume
 * stesso anno d'imposta.
 */
export function calcolaAddizionaleRegionale(imponibile: number): VoceBreakdown {
  const importo = calcolaProgressivo(imponibile, ADDIZIONALE_REGIONALE_LOMBARDIA_2026)

  return {
    id: 'addizionale-regionale',
    label: 'Addizionale regionale (Lombardia)',
    importo,
    segno: 'trattenuta',
    percentualeRal: imponibile > 0 ? importo / imponibile : 0,
    formula: `progressiva 1,23%-1,73% su imponibile ${formatNumero(imponibile)} = ${importo.toFixed(2)}`,
    fonte: FONTI.addizionaleRegionaleLombardia,
  }
}

/**
 * Addizionale comunale IRPEF Milano: aliquota unica 0,80%, con soglia di esenzione a
 * 23.000 €. È una soglia, non una franchigia: sopra 23.000 si paga sull'intero
 * imponibile, non solo sull'eccedenza (delibera comunale n. 46/2020).
 *
 * Stessa semplificazione dichiarata dell'addizionale regionale: anno d'imposta unico.
 */
export function calcolaAddizionaleComunale(imponibile: number): VoceBreakdown {
  const { aliquota, sogliaEsenzione } = ADDIZIONALE_COMUNALE_MILANO_2026
  const esente = imponibile <= sogliaEsenzione
  const importo = esente ? 0 : imponibile * aliquota

  return {
    id: 'addizionale-comunale',
    label: 'Addizionale comunale (Milano)',
    importo,
    segno: 'trattenuta',
    percentualeRal: imponibile > 0 ? importo / imponibile : 0,
    formula: esente
      ? `esente: imponibile ${formatNumero(imponibile)} ≤ 23.000`
      : `0,80% su imponibile ${formatNumero(imponibile)} = ${importo.toFixed(2)}`,
    fonte: FONTI.addizionaleComunaleMilano,
  }
}
