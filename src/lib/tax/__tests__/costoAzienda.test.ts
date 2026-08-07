import { describe, expect, it } from 'vitest'
import { calcolaCostoAzienda } from '../costoAzienda'

describe('calcolaCostoAzienda', () => {
  it('somma contributi c/azienda e TFR alla RAL', () => {
    const r = calcolaCostoAzienda(35_000, 'terziario', 25_000)
    expect(r.contributi).toBeCloseTo(35_000 * 0.294, 6)
    expect(r.tfr).toBeCloseTo(35_000 / 13.5, 6)
    expect(r.totale).toBeCloseTo(35_000 + r.contributi + r.tfr, 6)
  })

  it('usa l\'aliquota industria quando richiesto', () => {
    const r = calcolaCostoAzienda(35_000, 'industria', 25_000)
    expect(r.contributi).toBeCloseTo(35_000 * 0.32, 6)
  })

  it('calcola il cuneo fiscale come (costo azienda - netto) / costo azienda', () => {
    const r = calcolaCostoAzienda(35_000, 'terziario', 25_000)
    const atteso = (r.totale - 25_000) / r.totale
    expect(r.cuneoPercentuale).toBeCloseTo(atteso, 6)
  })
})
