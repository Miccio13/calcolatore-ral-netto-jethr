import { formatNumero } from '../format'
import { FONTI } from './fonti'
import { CUNEO_FISCALE_2026, TRATTAMENTO_INTEGRATIVO_2026 } from './constants-2026'
import { calcolaDetrazioneLavoroDipendente } from './detrazioni'
import type { VoceBreakdown } from './types'

type ParametriTrattamentoIntegrativo = {
  redditoComplessivo: number
  /** IRPEF lorda calcolata sui soli redditi di lavoro dipendente e assimilati. */
  irpefLordaSuRLD: number
}

/**
 * Trattamento integrativo (D.L. 3/2020, come modificato da L. 207/2024): 1.200 € se
 * il reddito complessivo non supera 15.000 € E c'è capienza, cioè l'imposta lorda
 * calcolata sui soli redditi di lavoro dipendente supera la detrazione art. 13
 * ridotta di 75 € — correttivo introdotto per neutralizzare l'innalzamento della
 * detrazione da 1.880 a 1.955 (circ. AdE 4/E 2025).
 *
 * Si somma al netto: non è una detrazione, non riduce l'imposta, è un credito erogato
 * in busta paga.
 */
export function calcolaTrattamentoIntegrativo(
  parametri: ParametriTrattamentoIntegrativo
): VoceBreakdown {
  const { redditoComplessivo, irpefLordaSuRLD } = parametri
  const { importo: importoBase, sogliaRedditoComplessivo, correttivoCapienza } =
    TRATTAMENTO_INTEGRATIVO_2026

  const detrazione = calcolaDetrazioneLavoroDipendente(redditoComplessivo)
  const sogliaCapienza = detrazione.importo - correttivoCapienza
  const spetta = redditoComplessivo <= sogliaRedditoComplessivo && irpefLordaSuRLD > sogliaCapienza

  const importo = spetta ? importoBase : 0
  const formula = spetta
    ? `1.200 fisso: reddito complessivo ${formatNumero(redditoComplessivo)} ≤ 15.000 e IRPEF lorda su RLD (${irpefLordaSuRLD.toFixed(2)}) > detrazione art.13 − 75 (${sogliaCapienza.toFixed(2)})`
    : redditoComplessivo > sogliaRedditoComplessivo
      ? `non spettante: reddito complessivo ${formatNumero(redditoComplessivo)} > 15.000`
      : `non spettante: manca capienza, IRPEF lorda su RLD (${irpefLordaSuRLD.toFixed(2)}) ≤ detrazione art.13 − 75 (${sogliaCapienza.toFixed(2)})`

  return {
    id: 'trattamento-integrativo',
    label: 'Trattamento integrativo',
    importo,
    segno: 'aggiunta',
    percentualeRal: redditoComplessivo > 0 ? importo / redditoComplessivo : 0,
    formula,
    fonte: FONTI.trattamentoIntegrativo,
  }
}

type ParametriSommaIntegrativa = {
  redditoComplessivo: number
  redditoLavoroDipendenteAnnuo: number
}

/**
 * Somma integrativa da cuneo fiscale (L. 207/2024 art. 1 c.4-5): non concorre alla
 * formazione del reddito, si somma al netto. Spetta se il reddito complessivo non
 * supera 20.000 €; la percentuale si sceglie in base al reddito di lavoro dipendente
 * rapportato all'anno e si applica al reddito di lavoro dipendente effettivo.
 */
export function calcolaSommaIntegrativa(parametri: ParametriSommaIntegrativa): VoceBreakdown {
  const { redditoComplessivo, redditoLavoroDipendenteAnnuo } = parametri
  const { sommaIntegrativa, sogliaMassimaSommaIntegrativa } = CUNEO_FISCALE_2026

  if (redditoComplessivo > sogliaMassimaSommaIntegrativa) {
    return {
      id: 'somma-integrativa',
      label: 'Somma integrativa cuneo fiscale',
      importo: 0,
      segno: 'aggiunta',
      percentualeRal: 0,
      formula: `non spettante: reddito complessivo ${formatNumero(redditoComplessivo)} > 20.000`,
      fonte: FONTI.cuneoFiscale,
    }
  }

  const scaglione =
    sommaIntegrativa.find((s) => redditoLavoroDipendenteAnnuo <= s.a) ?? sommaIntegrativa.at(-1)!

  const importo = redditoLavoroDipendenteAnnuo * scaglione.percentuale

  return {
    id: 'somma-integrativa',
    label: 'Somma integrativa cuneo fiscale',
    importo,
    segno: 'aggiunta',
    percentualeRal: redditoComplessivo > 0 ? importo / redditoComplessivo : 0,
    formula: `${formatNumero(redditoLavoroDipendenteAnnuo)} × ${(scaglione.percentuale * 100).toFixed(1)}% = ${importo.toFixed(2)}`,
    fonte: FONTI.cuneoFiscale,
  }
}
