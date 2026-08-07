import { formatNumero } from '../format'
import { FONTI } from './fonti'
import { SCAGLIONI_IRPEF_2026 } from './constants-2026'
import { calcolaProgressivo } from './progressive'
import type { VoceBreakdown } from './types'

/**
 * IRPEF lorda sull'imponibile fiscale, scaglioni 2026: 23% fino a 28.000, 33% da 28.000
 * a 50.000 (ridotta dal 35% dalla legge di bilancio 2026), 43% oltre 50.000.
 */
export function calcolaIrpefLorda(imponibile: number): VoceBreakdown {
  const importo = calcolaProgressivo(imponibile, SCAGLIONI_IRPEF_2026)

  return {
    id: 'irpef-lorda',
    label: 'IRPEF lorda',
    importo,
    segno: 'trattenuta',
    percentualeRal: importo / imponibile,
    formula: `23% ≤ 28.000 | 33% 28.000-50.000 | 43% > 50.000, su imponibile ${formatNumero(imponibile)} = ${importo.toFixed(2)}`,
    fonte: FONTI.ldb2026,
  }
}
