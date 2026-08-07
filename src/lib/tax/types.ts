import type { Fonte } from './fonti'
import type { TipoContratto } from './contratto'
import { REGIONE_DEFAULT_ID } from './regioni-2026'
import { COMUNE_DEFAULT_ID } from './comuni-2026'

export type Mensilita = 12 | 13 | 14

export type AliquotaInps = 0.0919 | 0.0949

export type Settore = 'terziario' | 'industria'

export type ComuneScelto =
  | { tipo: 'preset'; id: string }
  | { tipo: 'personalizzato'; nome: string; aliquota: number; soglia: number }

export type Input = {
  ral: number
  mensilita: Mensilita
  tipoContratto: TipoContratto
  /** Usata solo se tipoContratto === 'standard': l'apprendistato ha aliquota fissa. */
  aliquotaInps: AliquotaInps
  /** Giorni lavorati nell'anno, 1-365. Default 365 (contratto attivo tutto l'anno). */
  giorniLavorati: number
  regioneId: string
  comune: ComuneScelto
  coniugeACarico: boolean
  figliACarico: number
  quotaFigliACarico: 50 | 100
  altriFamiliariACarico: number
  welfareAnnuo: number
  settore: Settore
}

export const INPUT_DEFAULT: Input = {
  ral: 35000,
  mensilita: 13,
  tipoContratto: 'standard',
  aliquotaInps: 0.0919,
  giorniLavorati: 365,
  regioneId: REGIONE_DEFAULT_ID,
  comune: { tipo: 'preset', id: COMUNE_DEFAULT_ID },
  coniugeACarico: false,
  figliACarico: 0,
  quotaFigliACarico: 100,
  altriFamiliariACarico: 0,
  welfareAnnuo: 0,
  settore: 'terziario',
}

export type Segno = 'trattenuta' | 'aggiunta' | 'totale'

export type VoceBreakdown = {
  id: string
  label: string
  importo: number
  segno: Segno
  percentualeRal: number
  formula: string
  fonte: Fonte
}

export type CostoAzienda = {
  ral: number
  contributi: number
  tfr: number
  totale: number
  cuneoPercentuale: number
  breakdown: VoceBreakdown[]
}

export type Risultato = {
  input: Input
  imponibileFiscale: number
  redditoLavoroDipendente: number
  irpefLorda: number
  irpefNetta: number
  totaleTrattenute: number
  totaleAggiunte: number
  nettoAnnuo: number
  nettoMensile: number
  aliquotaEffettiva: number
  breakdown: VoceBreakdown[]
  costoAzienda: CostoAzienda
}
