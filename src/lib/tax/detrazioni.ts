import { formatNumero } from '../format'
import { FONTI } from './fonti'
import { CUNEO_FISCALE_2026, DETRAZIONE_LAVORO_DIPENDENTE_2026 } from './constants-2026'
import type { VoceBreakdown } from './types'

/**
 * Detrazione per redditi di lavoro dipendente, art. 13 c.1 lett. a) TUIR — tabella
 * ufficiale della circolare AdE 4/E del 16/05/2025. Nessun troncamento intermedio:
 * il "troncamento a 4 decimali" riportato da alcuni portali fiscali non compare né
 * nella circolare né in un riscontro testuale sull'art. 13 TUIR.
 */
export function calcolaDetrazioneLavoroDipendente(redditoRiferimento: number): VoceBreakdown {
  const { massimo, sogliaBassa, puntoIntermedio, sogliaAlta } = DETRAZIONE_LAVORO_DIPENDENTE_2026

  let importo: number
  let formula: string

  if (redditoRiferimento <= sogliaBassa) {
    importo = massimo
    formula = `fisso ${formatNumero(massimo)} (reddito ≤ 15.000)`
  } else if (redditoRiferimento <= puntoIntermedio) {
    importo =
      1910 + 1190 * ((puntoIntermedio - redditoRiferimento) / (puntoIntermedio - sogliaBassa))
    formula = `1.910 + 1.190 × [(28.000 − ${formatNumero(redditoRiferimento)}) / 13.000] = ${importo.toFixed(2)}`
  } else if (redditoRiferimento <= sogliaAlta) {
    importo = 1910 * ((sogliaAlta - redditoRiferimento) / (sogliaAlta - puntoIntermedio))
    formula = `1.910 × [(50.000 − ${formatNumero(redditoRiferimento)}) / 22.000] = ${importo.toFixed(2)}`
  } else {
    importo = 0
    formula = 'nessuna detrazione (reddito > 50.000)'
  }

  return {
    id: 'detrazione-lavoro-dipendente',
    label: 'Detrazione lavoro dipendente',
    importo,
    segno: 'aggiunta',
    percentualeRal: importo / redditoRiferimento,
    formula,
    fonte: FONTI.tuirArt13,
  }
}

/**
 * Ulteriore detrazione da cuneo fiscale, art. 1 c.6 L. 207/2024: 1.000 € fissi tra
 * 20.000 e 32.000, decrescente linearmente fino a zero a 40.000.
 */
export function calcolaUlterioreDetrazione(redditoComplessivo: number): VoceBreakdown {
  const { importoMassimo, sogliaBassa, sogliaPiena, sogliaAlta } =
    CUNEO_FISCALE_2026.ulterioreDetrazione

  let importo: number
  let formula: string

  if (redditoComplessivo <= sogliaBassa) {
    importo = 0
    formula = 'non spettante (reddito complessivo ≤ 20.000)'
  } else if (redditoComplessivo <= sogliaPiena) {
    importo = importoMassimo
    formula = `fisso 1.000 (reddito complessivo tra 20.000 e 32.000)`
  } else if (redditoComplessivo <= sogliaAlta) {
    importo = importoMassimo * ((sogliaAlta - redditoComplessivo) / (sogliaAlta - sogliaPiena))
    formula = `1.000 × [(40.000 − ${formatNumero(redditoComplessivo)}) / 8.000] = ${importo.toFixed(2)}`
  } else {
    importo = 0
    formula = 'non spettante (reddito complessivo > 40.000)'
  }

  return {
    id: 'ulteriore-detrazione-cuneo',
    label: 'Ulteriore detrazione cuneo fiscale',
    importo,
    segno: 'aggiunta',
    percentualeRal: redditoComplessivo > 0 ? importo / redditoComplessivo : 0,
    formula,
    fonte: FONTI.cuneoFiscale,
  }
}
