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

  it('è rapportato al periodo di lavoro quando spettante', () => {
    const pieno = calcolaTrattamentoIntegrativo({
      redditoComplessivo: 12_000,
      irpefLordaSuRLD: 3_000,
      giorniLavorati: 365,
    })
    const meta = calcolaTrattamentoIntegrativo({
      redditoComplessivo: 12_000,
      irpefLordaSuRLD: 3_000,
      giorniLavorati: 182.5,
    })
    expect(pieno.importo).toBe(1200)
    expect(meta.importo).toBeCloseTo(600, 6)
  })
})

describe('calcolaSommaIntegrativa', () => {
  it('non spetta se il reddito complessivo supera 20.000', () => {
    const r = calcolaSommaIntegrativa({ redditoComplessivo: 25_000, redditoLavoroDipendentePeriodo: 25_000 })
    expect(r.importo).toBe(0)
  })

  it('applica 7,1% se il reddito di lavoro dipendente non supera 8.500', () => {
    const r = calcolaSommaIntegrativa({ redditoComplessivo: 8_000, redditoLavoroDipendentePeriodo: 8_000 })
    expect(r.importo).toBeCloseTo(8_000 * 0.071, 6)
  })

  it('applica 5,3% tra 8.500 e 15.000', () => {
    const r = calcolaSommaIntegrativa({ redditoComplessivo: 12_000, redditoLavoroDipendentePeriodo: 12_000 })
    expect(r.importo).toBeCloseTo(12_000 * 0.053, 6)
  })

  it('applica 4,8% oltre 15.000', () => {
    const r = calcolaSommaIntegrativa({ redditoComplessivo: 18_000, redditoLavoroDipendentePeriodo: 18_000 })
    expect(r.importo).toBeCloseTo(18_000 * 0.048, 6)
  })

  it('con periodo parziale sceglie lo scaglione sul reddito annualizzato, ma applica la % al reddito effettivo (esempio circ. AdE 4/E)', () => {
    // Esempio 1 della circolare: 2.000€ su 62 giorni -> teorico ~11.774€ (5,3%),
    // applicato ai 2.000€ effettivi = 106€.
    const r = calcolaSommaIntegrativa({
      redditoComplessivo: 2_000,
      redditoLavoroDipendentePeriodo: 2_000,
      giorniLavorati: 62,
    })
    expect(r.importo).toBeCloseTo(2_000 * 0.053, 2)
  })
})
