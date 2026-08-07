import { describe, expect, it } from 'vitest'
import { calcolaIrpefLorda } from '../irpef'

describe('calcolaIrpefLorda', () => {
  it('su 28.000 esatti restituisce 6.440 (forma cumulativa AdE)', () => {
    const r = calcolaIrpefLorda(28_000)
    expect(r.importo).toBeCloseTo(6_440, 6)
  })

  it('su 50.000 esatti restituisce 13.700 (forma cumulativa AdE)', () => {
    const r = calcolaIrpefLorda(50_000)
    expect(r.importo).toBeCloseTo(13_700, 6)
  })

  it('applica il 43% oltre i 50.000', () => {
    const r = calcolaIrpefLorda(60_000)
    expect(r.importo).toBeCloseTo(13_700 + 4_300, 6)
  })

  it('cita la legge di bilancio 2026 come fonte (riduzione 35->33%)', () => {
    const r = calcolaIrpefLorda(40_000)
    expect(r.fonte.norma).toContain('199')
  })
})
