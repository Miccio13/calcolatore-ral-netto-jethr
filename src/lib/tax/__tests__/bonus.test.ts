import { describe, expect, it } from 'vitest'
import { calcolaSommaIntegrativa, calcolaTrattamentoIntegrativo } from '../bonus'

describe('calcolaTrattamentoIntegrativo', () => {
  it('non spetta se il reddito complessivo supera 15.000', () => {
    const r = calcolaTrattamentoIntegrativo({ redditoComplessivo: 20_000, irpefLordaSuRLD: 3_000 })
    expect(r.importo).toBe(0)
  })

  it('spetta per intero se c\'è capienza sotto 15.000', () => {
    // reddito 12.000, IRPEF lorda sui soli redditi di lavoro dipendente > detrazione - 75
    const r = calcolaTrattamentoIntegrativo({ redditoComplessivo: 12_000, irpefLordaSuRLD: 3_000 })
    expect(r.importo).toBe(1200)
  })

  it('non spetta se manca la capienza (imposta lorda troppo bassa)', () => {
    const r = calcolaTrattamentoIntegrativo({ redditoComplessivo: 8_000, irpefLordaSuRLD: 100 })
    expect(r.importo).toBe(0)
  })

  it('la soglia di capienza è la detrazione art.13 ridotta di 75 euro', () => {
    // A reddito 12.000, detrazione piena è 1.955 (reddito <= 15.000). Soglia = 1.880.
    // Se irpefLordaSuRLD = 1.881 (appena sopra), spetta; se 1.879 (appena sotto), no.
    const spetta = calcolaTrattamentoIntegrativo({ redditoComplessivo: 12_000, irpefLordaSuRLD: 1_881 })
    const nonSpetta = calcolaTrattamentoIntegrativo({ redditoComplessivo: 12_000, irpefLordaSuRLD: 1_879 })
    expect(spetta.importo).toBe(1200)
    expect(nonSpetta.importo).toBe(0)
  })
})

describe('calcolaSommaIntegrativa', () => {
  it('non spetta se il reddito complessivo supera 20.000', () => {
    const r = calcolaSommaIntegrativa({ redditoComplessivo: 25_000, redditoLavoroDipendenteAnnuo: 25_000 })
    expect(r.importo).toBe(0)
  })

  it('applica 7,1% se il reddito di lavoro dipendente non supera 8.500', () => {
    const r = calcolaSommaIntegrativa({ redditoComplessivo: 8_000, redditoLavoroDipendenteAnnuo: 8_000 })
    expect(r.importo).toBeCloseTo(8_000 * 0.071, 6)
  })

  it('applica 5,3% tra 8.500 e 15.000', () => {
    const r = calcolaSommaIntegrativa({ redditoComplessivo: 12_000, redditoLavoroDipendenteAnnuo: 12_000 })
    expect(r.importo).toBeCloseTo(12_000 * 0.053, 6)
  })

  it('applica 4,8% oltre 15.000', () => {
    const r = calcolaSommaIntegrativa({ redditoComplessivo: 18_000, redditoLavoroDipendenteAnnuo: 18_000 })
    expect(r.importo).toBeCloseTo(18_000 * 0.048, 6)
  })
})
