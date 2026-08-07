import type { Fonte } from './fonti'

export type Mensilita = 12 | 13 | 14

export type AliquotaInps = 0.0919 | 0.0949

export type Settore = 'terziario' | 'industria'

export type Input = {
  ral: number
  mensilita: Mensilita
  aliquotaInps: AliquotaInps
  settore: Settore
}

export const INPUT_DEFAULT: Input = {
  ral: 35000,
  mensilita: 14,
  aliquotaInps: 0.0919,
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
