import { calcolaAddizionaleComunale, calcolaAddizionaleRegionale } from './addizionali'
import { calcolaSommaIntegrativa, calcolaTrattamentoIntegrativo } from './bonus'
import { calcolaCostoAzienda } from './costoAzienda'
import { calcolaDetrazioneLavoroDipendente, calcolaUlterioreDetrazione } from './detrazioni'
import { calcolaContributiInps } from './inps'
import { calcolaIrpefLorda } from './irpef'
import type { Input, Risultato, VoceBreakdown } from './types'

/**
 * Orchestratore: dalla RAL al netto annuo/mensile, seguendo la catena descritta nel
 * design doc del progetto. Ogni passaggio usa la base imponibile corretta — non sono
 * tutti calcolati sulla RAL.
 *
 * Caso standard assunto: impiegato, tempo indeterminato, Milano, nessun'altra fonte di
 * reddito, nessun familiare a carico, rapporto per l'intero anno. In questo caso
 * imponibile fiscale, reddito di lavoro dipendente e reddito complessivo coincidono —
 * nella realtà possono divergere, ed è per questo che il motore li tiene distinti
 * internamente invece di usare un unico numero con nomi diversi.
 */
export function calcola(input: Input): Risultato {
  const { ral, mensilita, aliquotaInps, settore } = input

  // 1. Contributi INPS a carico del dipendente, sulla RAL.
  const contributiInps = calcolaContributiInps(ral, aliquotaInps)

  // 2. Imponibile fiscale = RAL - contributi (art. 51 c.2 lett. a TUIR).
  //    Nel caso standard coincide con reddito di lavoro dipendente e reddito complessivo.
  const imponibileFiscale = ral - contributiInps.importo
  const redditoLavoroDipendente = imponibileFiscale
  const redditoComplessivo = imponibileFiscale

  // 3. IRPEF lorda sull'imponibile fiscale.
  const irpefLordaVoce = calcolaIrpefLorda(imponibileFiscale)

  // 4. Detrazioni che riducono l'IRPEF lorda.
  const detrazioneLavoroDip = calcolaDetrazioneLavoroDipendente(redditoComplessivo)
  const ulterioreDetrazione = calcolaUlterioreDetrazione(redditoComplessivo)

  const irpefNetta = Math.max(
    0,
    irpefLordaVoce.importo - detrazioneLavoroDip.importo - ulterioreDetrazione.importo
  )

  // 5. Addizionali locali, sull'imponibile fiscale (semplificazione: stesso anno d'imposta).
  const addizionaleRegionale = calcolaAddizionaleRegionale(imponibileFiscale)
  const addizionaleComunale = calcolaAddizionaleComunale(imponibileFiscale)

  // 6. Bonus che si sommano al netto (non sono detrazioni, sono credito in busta paga).
  //    La capienza del trattamento integrativo guarda l'IRPEF lorda sui soli redditi di
  //    lavoro dipendente: nel caso standard è la stessa IRPEF lorda calcolata sopra.
  const trattamentoIntegrativo = calcolaTrattamentoIntegrativo({
    redditoComplessivo,
    irpefLordaSuRLD: irpefLordaVoce.importo,
  })
  const sommaIntegrativa = calcolaSommaIntegrativa({
    redditoComplessivo,
    redditoLavoroDipendenteAnnuo: redditoLavoroDipendente,
  })

  const totaleTrattenute =
    contributiInps.importo + irpefNetta + addizionaleRegionale.importo + addizionaleComunale.importo
  const totaleAggiunte = trattamentoIntegrativo.importo + sommaIntegrativa.importo

  const nettoAnnuo = ral - totaleTrattenute + totaleAggiunte
  const nettoMensile = nettoAnnuo / mensilita

  // Il waterfall mostrato in UI: IRPEF lorda seguita dalle detrazioni che la riducono,
  // poi le addizionali, poi i bonus. La IRPEF netta non è una voce a sé: è il risultato
  // di lorda meno detrazioni, già rappresentato dalle voci sopra. Le voci opzionali a
  // importo zero (detrazioni azzerate, bonus non spettanti) si nascondono dal waterfall
  // ma restano calcolate — la formula spiega comunque perché sono a zero.
  const tutteLeVoci: VoceBreakdown[] = [
    contributiInps,
    irpefLordaVoce,
    detrazioneLavoroDip,
    ulterioreDetrazione,
    addizionaleRegionale,
    addizionaleComunale,
    trattamentoIntegrativo,
    sommaIntegrativa,
  ]
  const SEMPRE_VISIBILI = new Set(['contributi-inps', 'irpef-lorda'])
  const breakdown = tutteLeVoci.filter((v) => v.importo > 0 || SEMPRE_VISIBILI.has(v.id))

  const costoAzienda = calcolaCostoAzienda(ral, settore, nettoAnnuo)

  return {
    input,
    imponibileFiscale,
    redditoLavoroDipendente,
    irpefLorda: irpefLordaVoce.importo,
    irpefNetta,
    totaleTrattenute,
    totaleAggiunte,
    nettoAnnuo,
    nettoMensile,
    aliquotaEffettiva: totaleTrattenute / ral,
    breakdown,
    costoAzienda,
  }
}
