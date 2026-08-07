import { formatNumero } from '../format'
import { FONTI } from './fonti'
import { COSTO_AZIENDA_2026 } from './constants-2026'
import type { CostoAzienda, Settore, VoceBreakdown } from './types'

/**
 * Costo azienda: RAL + contributi a carico del datore + TFR accantonato.
 * Non è parte della catena RAL -> netto: è una sezione separata che risponde alla
 * domanda "quanto costa questo dipendente", non "quanto netto percepisce".
 *
 * Semplificazione dichiarata: esclude INAIL (variabile per rischio di settore) e usa
 * un'aliquota di sintesi per settore, non la scomposizione voce per voce (CUAF, malattia,
 * maternità, disoccupazione...) che compone il 23,81%+ effettivo.
 */
export function calcolaCostoAzienda(ral: number, settore: Settore, nettoAnnuo: number): CostoAzienda {
  const aliquotaContributi = COSTO_AZIENDA_2026.contributiPerSettore[settore]
  const contributi = ral * aliquotaContributi
  const tfr = ral * COSTO_AZIENDA_2026.tfrPercentuale
  const totale = ral + contributi + tfr
  const cuneoPercentuale = (totale - nettoAnnuo) / totale

  const contributiVoce: VoceBreakdown = {
    id: 'costo-contributi-azienda',
    label: `Contributi a carico azienda (${settore})`,
    importo: contributi,
    segno: 'aggiunta',
    percentualeRal: contributi / ral,
    formula: `${formatNumero(ral)} × ${(aliquotaContributi * 100).toFixed(1)}% = ${contributi.toFixed(2)}`,
    fonte: FONTI.inpsCirc6_2026,
  }

  const tfrVoce: VoceBreakdown = {
    id: 'costo-tfr',
    label: 'TFR accantonato',
    importo: tfr,
    segno: 'aggiunta',
    percentualeRal: tfr / ral,
    formula: `${formatNumero(ral)} / 13,5 = ${tfr.toFixed(2)}`,
    fonte: FONTI.tfr,
  }

  return {
    ral,
    contributi,
    tfr,
    totale,
    cuneoPercentuale,
    breakdown: [contributiVoce, tfrVoce],
  }
}
