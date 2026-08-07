import { formatEuroPreciso } from '../format'
import { WELFARE_2026 } from './constants-2026'
import { FONTI } from './fonti'
import type { VoceBreakdown } from './types'

export type RisultatoWelfare = {
  /** Da sommare all'imponibile fiscale — zero se sotto soglia. */
  imponibileAggiuntivo: number
  /** Voce per il waterfall: il valore ricevuto dal dipendente, sempre positivo. */
  voce: VoceBreakdown
}

/**
 * Fringe benefit / welfare aziendale, art. 51 c.3 TUIR. Soglia 1.000 € (2.000 €
 * con figli a carico), confermata per il 2025-2027 da L. 207/2024.
 *
 * Non è una franchigia: se il valore complessivo supera la soglia, l'INTERO
 * importo diventa imponibile — non solo l'eccedenza. Verificato testualmente
 * sulla circolare AdE 35/E del 04/11/2022: "in caso di superamento di
 * quest'ultimo, l'inclusione nel reddito imponibile dell'intero ammontare e
 * non solo della quota eccedente il medesimo limite." Stesso meccanismo a
 * soglia già visto per l'addizionale comunale di Milano.
 *
 * Il valore in ogni caso si somma a ciò che il dipendente riceve (è un
 * compenso reale, in beni/servizi): sotto soglia è denaro "pulito", sopra
 * soglia è denaro che genera IRPEF aggiuntiva ma resta comunque percepito.
 */
export function calcolaWelfare(importoAnnuo: number, haFigliACarico: boolean): RisultatoWelfare {
  const soglia = haFigliACarico ? WELFARE_2026.sogliaConFigliACarico : WELFARE_2026.sogliaGenerale
  const superaSoglia = importoAnnuo > soglia

  const imponibileAggiuntivo = superaSoglia ? importoAnnuo : 0

  const formula =
    importoAnnuo === 0
      ? 'nessun welfare dichiarato'
      : superaSoglia
        ? `${formatEuroPreciso(importoAnnuo)} supera la soglia di ${formatEuroPreciso(soglia)}: l'intero importo diventa imponibile, non solo l'eccedenza`
        : `${formatEuroPreciso(importoAnnuo)} entro la soglia di ${formatEuroPreciso(soglia)}: interamente esente`

  return {
    imponibileAggiuntivo,
    voce: {
      id: 'welfare',
      label: 'Welfare / fringe benefit',
      importo: importoAnnuo,
      segno: 'aggiunta',
      percentualeRal: 0,
      formula,
      fonte: FONTI.welfare,
    },
  }
}
