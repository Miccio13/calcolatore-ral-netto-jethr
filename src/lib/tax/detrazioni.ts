import { formatNumero } from '../format'
import { FONTI } from './fonti'
import { CUNEO_FISCALE_2026, DETRAZIONE_LAVORO_DIPENDENTE_2026 } from './constants-2026'
import { rapportaAlPeriodo } from './periodo'
import { troncaRapporto } from './rapporto'
import type { VoceBreakdown } from './types'

type OpzioniDetrazioneLavoroDipendente = {
  /**
   * Sempre false nell'input reale del calcolatore: il caso standard copre solo
   * il tempo indeterminato, e il floor non produce comunque alcuna differenza
   * numerica (verificato: 690€/1.380€ sono entrambi sotto il valore base 1.955€
   * di questo scaglione). Il parametro esiste per rendere la funzione corretta
   * e testabile end-to-end, non per essere esposto come opzione in UI.
   */
  tempoDeterminato?: boolean
  /** Giorni lavorati nell'anno, default 365 (nessun effetto se l'anno è pieno). */
  giorniLavorati?: number
}

/**
 * Detrazione per redditi di lavoro dipendente, art. 13 c.1 lett. a) TUIR — tabella
 * ufficiale della circolare AdE 4/E del 16/05/2025. Il rapporto delle formule
 * decrescenti si assume nelle prime quattro cifre decimali (troncamento, non
 * arrotondamento): lo prescrive l'art. 13 c.6 TUIR, verificato sul testo vigente.
 *
 * Maggiorazione di 65 € (art. 13 c.1.1): per redditi complessivi oltre 25.000 e
 * fino a 35.000 la detrazione del c.1 è aumentata di 65 €. È un correttivo in
 * aumento successivo al riproporzionamento: spetta per intero, senza ragguaglio
 * al periodo di lavoro nell'anno (circ. AdE 4/E del 18/02/2022, §1.2.1).
 *
 * Il floor di 690€ (1.380€ per tempo determinato) è cablato esplicitamente nello
 * scaglione ≤15.000, anche se lì è un no-op aritmetico (il valore base 1.955€ lo
 * supera sempre): la norma lo prevede solo in quello scaglione, non nei successivi
 * (verificato sul testo strutturale dell'art. 13 TUIR), e il codice deve
 * dimostrarlo, non ometterlo silenziosamente.
 */
export function calcolaDetrazioneLavoroDipendente(
  redditoRiferimento: number,
  opzioni: OpzioniDetrazioneLavoroDipendente = {}
): VoceBreakdown {
  const {
    massimo,
    minimo,
    minimoTempoDeterminato,
    sogliaBassa,
    puntoIntermedio,
    sogliaAlta,
    maggiorazione,
  } = DETRAZIONE_LAVORO_DIPENDENTE_2026
  const { tempoDeterminato = false, giorniLavorati = 365 } = opzioni

  let importoAnnuo: number
  let formula: string

  if (redditoRiferimento <= sogliaBassa) {
    const floor = tempoDeterminato ? minimoTempoDeterminato : minimo
    importoAnnuo = Math.max(massimo, floor)
    formula = `fisso ${formatNumero(massimo)}, non inferiore a ${formatNumero(floor)} (reddito ≤ 15.000)`
  } else if (redditoRiferimento <= puntoIntermedio) {
    importoAnnuo =
      1910 +
      1190 * troncaRapporto((puntoIntermedio - redditoRiferimento) / (puntoIntermedio - sogliaBassa))
    formula = `1.910 + 1.190 × [(28.000 − ${formatNumero(redditoRiferimento)}) / 13.000, troncato a 4 decimali] = ${importoAnnuo.toFixed(2)}`
  } else if (redditoRiferimento <= sogliaAlta) {
    importoAnnuo =
      1910 * troncaRapporto((sogliaAlta - redditoRiferimento) / (sogliaAlta - puntoIntermedio))
    formula = `1.910 × [(50.000 − ${formatNumero(redditoRiferimento)}) / 22.000, troncato a 4 decimali] = ${importoAnnuo.toFixed(2)}`
  } else {
    importoAnnuo = 0
    formula = 'nessuna detrazione (reddito > 50.000)'
  }

  let importo = rapportaAlPeriodo(importoAnnuo, giorniLavorati)
  if (giorniLavorati < 365) {
    formula += ` × ${giorniLavorati}/365 (rapportata al periodo di lavoro)`
  }

  // Maggiorazione art. 13 c.1.1: dopo il riproporzionamento, per intero.
  const spettaMaggiorazione =
    redditoRiferimento > maggiorazione.redditoOltre &&
    redditoRiferimento <= maggiorazione.redditoFinoA
  if (spettaMaggiorazione) {
    importo += maggiorazione.importo
    formula += ` + ${maggiorazione.importo} (art. 13 c.1.1, reddito tra 25.000 e 35.000, senza ragguaglio al periodo)`
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
 * 20.000 e 32.000, decrescente linearmente fino a zero a 40.000. "Rapportata al
 * periodo di lavoro" per esplicita previsione della circolare AdE 4/E 2025.
 */
export function calcolaUlterioreDetrazione(
  redditoComplessivo: number,
  giorniLavorati = 365
): VoceBreakdown {
  const { importoMassimo, sogliaBassa, sogliaPiena, sogliaAlta } =
    CUNEO_FISCALE_2026.ulterioreDetrazione

  let importoAnnuo: number
  let formula: string

  if (redditoComplessivo <= sogliaBassa) {
    importoAnnuo = 0
    formula = 'non spettante (reddito complessivo ≤ 20.000)'
  } else if (redditoComplessivo <= sogliaPiena) {
    importoAnnuo = importoMassimo
    formula = `fisso 1.000 (reddito complessivo tra 20.000 e 32.000)`
  } else if (redditoComplessivo <= sogliaAlta) {
    importoAnnuo = importoMassimo * ((sogliaAlta - redditoComplessivo) / (sogliaAlta - sogliaPiena))
    formula = `1.000 × [(40.000 − ${formatNumero(redditoComplessivo)}) / 8.000] = ${importoAnnuo.toFixed(2)}`
  } else {
    importoAnnuo = 0
    formula = 'non spettante (reddito complessivo > 40.000)'
  }

  const importo = rapportaAlPeriodo(importoAnnuo, giorniLavorati)
  if (giorniLavorati < 365 && importoAnnuo > 0) {
    formula += ` × ${giorniLavorati}/365 (rapportata al periodo di lavoro)`
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
