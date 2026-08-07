import { calcolaAddizionaleComunale, calcolaAddizionaleRegionale } from './addizionali'
import { calcolaSommaIntegrativa, calcolaTrattamentoIntegrativo } from './bonus'
import { COMUNI_2026 } from './comuni-2026'
import { calcolaCostoAzienda } from './costoAzienda'
import { risolviAliquotaInps } from './contratto'
import {
  calcolaDetrazioneAltriFamiliari,
  calcolaDetrazioneConiuge,
  calcolaDetrazioneFigli,
} from './detrazioniFamiliari'
import { calcolaDetrazioneLavoroDipendente, calcolaUlterioreDetrazione } from './detrazioni'
import { calcolaContributiInps } from './inps'
import { calcolaIrpefLorda } from './irpef'
import { REGIONI_2026 } from './regioni-2026'
import { calcolaWelfare } from './welfare'
import type { Input, Risultato, VoceBreakdown } from './types'

/**
 * Orchestratore: dalla RAL al netto annuo/mensile, seguendo la catena descritta nel
 * design doc del progetto (v2 — personalizzazione reale). Ogni passaggio usa la
 * base imponibile corretta — non sono tutti calcolati sulla RAL.
 *
 * Caso standard di default: impiegato, tempo indeterminato, Milano, nessun'altra
 * fonte di reddito, nessun familiare a carico, rapporto per l'intero anno — ma
 * ogni variabile è ora gestibile dall'utente tramite `Input`.
 */
export function calcola(input: Input): Risultato {
  const {
    ral,
    mensilita,
    tipoContratto,
    aliquotaInps,
    giorniLavorati,
    regioneId,
    comune: comuneScelto,
    coniugeACarico,
    figliACarico,
    quotaFigliACarico,
    altriFamiliariACarico,
    welfareAnnuo,
    settore,
  } = input

  // 1. Contributi INPS a carico del dipendente, sulla RAL. L'apprendistato ha
  //    un'aliquota flat che sostituisce la selezione standard (vedi contratto.ts).
  const { aliquota: aliquotaRisolta, fonte: fonteAliquota } = risolviAliquotaInps(
    tipoContratto,
    aliquotaInps
  )
  const contributiInps = calcolaContributiInps(ral, aliquotaRisolta, {
    applicaAliquotaAggiuntiva: tipoContratto === 'standard',
    fonte: fonteAliquota,
  })

  // 2. Imponibile fiscale = RAL - contributi (art. 51 c.2 lett. a TUIR).
  const redditoLavoroDipendentePeriodo = ral - contributiInps.importo

  // 3. Welfare: sotto soglia non tocca l'imponibile, sopra soglia l'intero
  //    importo si aggiunge (soglia, non franchigia — vedi welfare.ts).
  const risultatoWelfare = calcolaWelfare(welfareAnnuo, figliACarico > 0)

  const imponibileFiscale = redditoLavoroDipendentePeriodo + risultatoWelfare.imponibileAggiuntivo
  const redditoComplessivo = imponibileFiscale

  // 4. IRPEF lorda sull'imponibile fiscale.
  const irpefLordaVoce = calcolaIrpefLorda(imponibileFiscale)

  // 5. Detrazioni che riducono l'IRPEF lorda: lavoro dipendente, cuneo fiscale,
  //    e le detrazioni familiari (art. 12 TUIR) — tutte rapportate al periodo
  //    di lavoro dove previsto dalla norma.
  const detrazioneLavoroDip = calcolaDetrazioneLavoroDipendente(redditoComplessivo, {
    giorniLavorati,
  })
  const ulterioreDetrazione = calcolaUlterioreDetrazione(redditoComplessivo, giorniLavorati)
  const detrazioneConiuge = calcolaDetrazioneConiuge(coniugeACarico, redditoComplessivo, giorniLavorati)
  const detrazioneFigli = calcolaDetrazioneFigli(
    figliACarico,
    quotaFigliACarico,
    redditoComplessivo,
    giorniLavorati
  )
  const detrazioneAltriFamiliari = calcolaDetrazioneAltriFamiliari(
    altriFamiliariACarico,
    redditoComplessivo,
    giorniLavorati
  )

  const totaleDetrazioni =
    detrazioneLavoroDip.importo +
    ulterioreDetrazione.importo +
    detrazioneConiuge.importo +
    detrazioneFigli.importo +
    detrazioneAltriFamiliari.importo

  const irpefNetta = Math.max(0, irpefLordaVoce.importo - totaleDetrazioni)

  // 6. Addizionali locali, sull'imponibile fiscale (semplificazione: stesso
  //    anno d'imposta — vedi README). Regione e comune ora selezionabili.
  const regione = REGIONI_2026.find((r) => r.id === regioneId) ?? REGIONI_2026[0]
  const addizionaleRegionale = calcolaAddizionaleRegionale(regione.addizionale, imponibileFiscale)

  const comuneRisolto =
    comuneScelto.tipo === 'preset'
      ? (COMUNI_2026.find((c) => c.id === comuneScelto.id) ?? COMUNI_2026[0])
      : {
          nome: comuneScelto.nome,
          soglia: comuneScelto.soglia,
          scaglioni: [{ da: 0, a: Infinity, aliquota: comuneScelto.aliquota }],
        }
  const addizionaleComunale = calcolaAddizionaleComunale(comuneRisolto, imponibileFiscale)

  // 7. Bonus che si sommano al netto (non sono detrazioni, sono credito in
  //    busta paga). La capienza del trattamento integrativo guarda l'IRPEF
  //    lorda sui soli redditi di lavoro dipendente: nel caso standard è la
  //    stessa IRPEF lorda calcolata sopra.
  const trattamentoIntegrativo = calcolaTrattamentoIntegrativo({
    redditoComplessivo,
    irpefLordaSuRLD: irpefLordaVoce.importo,
    giorniLavorati,
  })
  const sommaIntegrativa = calcolaSommaIntegrativa({
    redditoComplessivo,
    redditoLavoroDipendentePeriodo,
    giorniLavorati,
  })

  const totaleTrattenute =
    contributiInps.importo + irpefNetta + addizionaleRegionale.importo + addizionaleComunale.importo
  const totaleAggiunte =
    trattamentoIntegrativo.importo + sommaIntegrativa.importo + risultatoWelfare.voce.importo

  const nettoAnnuo = ral - totaleTrattenute + totaleAggiunte
  const nettoMensile = nettoAnnuo / mensilita

  const tutteLeVoci: VoceBreakdown[] = [
    contributiInps,
    irpefLordaVoce,
    detrazioneLavoroDip,
    ulterioreDetrazione,
    detrazioneConiuge,
    detrazioneFigli,
    detrazioneAltriFamiliari,
    addizionaleRegionale,
    addizionaleComunale,
    trattamentoIntegrativo,
    sommaIntegrativa,
    risultatoWelfare.voce,
  ]
  const SEMPRE_VISIBILI = new Set(['contributi-inps', 'irpef-lorda'])
  const breakdown = tutteLeVoci.filter((v) => v.importo > 0 || SEMPRE_VISIBILI.has(v.id))

  const costoAzienda = calcolaCostoAzienda(ral, settore, nettoAnnuo)

  return {
    input,
    imponibileFiscale,
    redditoLavoroDipendente: redditoLavoroDipendentePeriodo,
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
