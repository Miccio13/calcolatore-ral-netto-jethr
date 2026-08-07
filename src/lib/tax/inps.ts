import { formatNumero } from '../format'
import { FONTI } from './fonti'
import { INPS_2026 } from './constants-2026'
import { calcolaProgressivo } from './progressive'
import type { AliquotaInps, VoceBreakdown } from './types'

/**
 * Contributi previdenziali a carico del dipendente: aliquota base sulla RAL,
 * più 1% aggiuntivo sulla quota che eccede la 1ª fascia di retribuzione pensionabile
 * (56.224 € nel 2026). I contributi non concorrono a formare il reddito di lavoro
 * dipendente (art. 51 c.2 lett. a TUIR).
 */
export function calcolaContributiInps(ral: number, aliquotaBase: AliquotaInps): VoceBreakdown {
  const importo = calcolaProgressivo(ral, [
    { da: 0, a: INPS_2026.primaFasciaPensionabile, aliquota: aliquotaBase },
    { da: INPS_2026.primaFasciaPensionabile, a: Infinity, aliquota: aliquotaBase + INPS_2026.aliquotaAggiuntiva },
  ])

  const oltreSoglia = Math.max(0, ral - INPS_2026.primaFasciaPensionabile)
  const formula =
    oltreSoglia > 0
      ? `${formatNumero(INPS_2026.primaFasciaPensionabile)} × ${(aliquotaBase * 100).toFixed(2)}% + ${formatNumero(oltreSoglia)} × ${((aliquotaBase + INPS_2026.aliquotaAggiuntiva) * 100).toFixed(2)}% = ${importo.toFixed(2)}`
      : `${formatNumero(ral)} × ${(aliquotaBase * 100).toFixed(2)}% = ${importo.toFixed(2)}`

  return {
    id: 'contributi-inps',
    label: 'Contributi INPS a carico del dipendente',
    importo,
    segno: 'trattenuta',
    percentualeRal: importo / ral,
    formula,
    fonte: FONTI.inpsCirc6_2026,
  }
}
