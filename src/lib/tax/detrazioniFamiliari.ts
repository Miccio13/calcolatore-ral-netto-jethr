import { formatNumero } from '../format'
import {
  DETRAZIONE_ALTRI_FAMILIARI_2026,
  DETRAZIONE_CONIUGE_2026,
  DETRAZIONE_FIGLI_2026,
} from './constants-2026'
import { FONTI } from './fonti'
import { rapportaAlPeriodo } from './periodo'
import { troncaRapporto } from './rapporto'
import type { VoceBreakdown } from './types'

/**
 * Detrazione per coniuge a carico, art. 12 c.1 lett. a)+b) TUIR (testo letto
 * integralmente su Normattiva/Agenzia Entrate). Tre fasce più un micro-bonus
 * storico su una fascia di reddito molto stretta (lett. b). Rapportata al
 * periodo di lavoro nell'anno (c.3). I rapporti si assumono nelle prime quattro
 * cifre decimali (c.4): troncamento, non arrotondamento.
 *
 * Semplificazione dichiarata: non gestiamo il caso limite reddito complessivo
 * esattamente 0 (art. 12 c.4, "detrazione non compete" quando il rapporto è
 * zero) — irrilevante per un contribuente con una RAL positiva, che è l'unico
 * caso che questo calcolatore modella.
 */
export function calcolaDetrazioneConiuge(
  aCarico: boolean,
  redditoComplessivo: number,
  giorniLavorati: number
): VoceBreakdown {
  const { sogliaBassa, sogliaMedia, sogliaAlta, baseFasciaBassa, coefficienteFasciaBassa, fisso, microBonus } =
    DETRAZIONE_CONIUGE_2026

  let importoAnnuo = 0
  let formula = 'coniuge non a carico'

  if (aCarico) {
    if (redditoComplessivo <= sogliaBassa) {
      importoAnnuo =
        baseFasciaBassa - coefficienteFasciaBassa * troncaRapporto(redditoComplessivo / sogliaBassa)
      formula = `800 − 110 × (${formatNumero(redditoComplessivo)} / 15.000, troncato a 4 decimali) = ${importoAnnuo.toFixed(2)}`
    } else if (redditoComplessivo <= sogliaMedia) {
      importoAnnuo = fisso
      formula = `fisso 690 (reddito 15.000-40.000)`
    } else if (redditoComplessivo <= sogliaAlta) {
      importoAnnuo =
        fisso * troncaRapporto((sogliaAlta - redditoComplessivo) / (sogliaAlta - sogliaMedia))
      formula = `690 × [(80.000 − ${formatNumero(redditoComplessivo)}) / 40.000, troncato a 4 decimali] = ${importoAnnuo.toFixed(2)}`
    }

    const bonus = microBonus.find((b) => redditoComplessivo > b.da && redditoComplessivo <= b.a)
    if (bonus && importoAnnuo > 0) {
      importoAnnuo += bonus.importo
      formula += ` + ${bonus.importo} (micro-bonus art. 12 c.1 lett. b)`
    }
  }

  const importo = rapportaAlPeriodo(Math.max(0, importoAnnuo), giorniLavorati)

  return {
    id: 'detrazione-coniuge',
    label: 'Detrazione coniuge a carico',
    importo,
    segno: 'aggiunta',
    percentualeRal: redditoComplessivo > 0 ? importo / redditoComplessivo : 0,
    formula,
    fonte: FONTI.tuirArt12,
  }
}

/**
 * Detrazione per figli a carico di età 21-30 non disabili, art. 12 c.1 lett. c)
 * TUIR. Gli under-21 sono coperti dall'assegno unico universale (D.Lgs.
 * 230/2021), non da questa detrazione: il calcolatore modella solo la fascia
 * residua 21-30.
 *
 * Semplificazione dichiarata: non applichiamo il bonus di +200€ per famiglie
 * con più di tre figli a carico complessivamente (art. 12 c.1 lett. c, ultimo
 * periodo), perché richiederebbe conoscere anche i figli under-21 coperti da
 * assegno unico, che questo form non raccoglie. Non modelliamo età <3 anni
 * (1.220€) né disabilità (+400€): entrambe escluse per costruzione dal campo
 * "21-30 non disabili".
 */
export function calcolaDetrazioneFigli(
  numeroFigli: number,
  quotaPercentuale: 50 | 100,
  redditoComplessivo: number,
  giorniLavorati: number
): VoceBreakdown {
  const { importoBase, baseRapporto, incrementoBasePerFiglioSuccessivo } = DETRAZIONE_FIGLI_2026

  if (numeroFigli <= 0) {
    return {
      id: 'detrazione-figli',
      label: 'Detrazione figli a carico (21-30 non disabili)',
      importo: 0,
      segno: 'aggiunta',
      percentualeRal: 0,
      formula: 'nessun figlio a carico',
      fonte: FONTI.tuirArt12,
    }
  }

  const base = baseRapporto + incrementoBasePerFiglioSuccessivo * (numeroFigli - 1)
  const rapporto = Math.max(0, troncaRapporto((base - redditoComplessivo) / base))
  const importoAnnuo = importoBase * numeroFigli * rapporto * (quotaPercentuale / 100)
  const importo = rapportaAlPeriodo(importoAnnuo, giorniLavorati)

  return {
    id: 'detrazione-figli',
    label: 'Detrazione figli a carico (21-30 non disabili)',
    importo,
    segno: 'aggiunta',
    percentualeRal: redditoComplessivo > 0 ? importo / redditoComplessivo : 0,
    formula: `950 × ${numeroFigli} × [(${formatNumero(base)} − ${formatNumero(redditoComplessivo)}) / ${formatNumero(base)}, troncato a 4 decimali] × ${quotaPercentuale}% = ${importoAnnuo.toFixed(2)}`,
    fonte: FONTI.tuirArt12,
  }
}

/**
 * Detrazione per altri familiari a carico, art. 12 c.1 lett. d) TUIR (persone
 * indicate nell'art. 433 c.c. conviventi col contribuente).
 *
 * Semplificazione dichiarata: la norma prevede la ripartizione "pro quota tra
 * coloro che hanno diritto alla detrazione" — assumiamo che il contribuente sia
 * l'unico avente diritto e prenda l'intero importo, come per figli e coniuge
 * nel resto del modello a percettore singolo.
 */
export function calcolaDetrazioneAltriFamiliari(
  numero: number,
  redditoComplessivo: number,
  giorniLavorati: number
): VoceBreakdown {
  const { importoBase, baseRapporto } = DETRAZIONE_ALTRI_FAMILIARI_2026

  if (numero <= 0) {
    return {
      id: 'detrazione-altri-familiari',
      label: 'Detrazione altri familiari a carico',
      importo: 0,
      segno: 'aggiunta',
      percentualeRal: 0,
      formula: 'nessun altro familiare a carico',
      fonte: FONTI.tuirArt12,
    }
  }

  const rapporto = Math.max(0, troncaRapporto((baseRapporto - redditoComplessivo) / baseRapporto))
  const importoAnnuo = importoBase * numero * rapporto
  const importo = rapportaAlPeriodo(importoAnnuo, giorniLavorati)

  return {
    id: 'detrazione-altri-familiari',
    label: 'Detrazione altri familiari a carico',
    importo,
    segno: 'aggiunta',
    percentualeRal: redditoComplessivo > 0 ? importo / redditoComplessivo : 0,
    formula: `750 × ${numero} × [(80.000 − ${formatNumero(redditoComplessivo)}) / 80.000, troncato a 4 decimali] = ${importoAnnuo.toFixed(2)}`,
    fonte: FONTI.tuirArt12,
  }
}
