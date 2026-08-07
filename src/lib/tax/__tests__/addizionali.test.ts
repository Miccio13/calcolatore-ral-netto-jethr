import { describe, expect, it } from 'vitest'
import { calcolaAddizionaleComunale, calcolaAddizionaleRegionale } from '../addizionali'

describe('calcolaAddizionaleRegionale', () => {
  it('applica solo il primo scaglione sotto 15.000', () => {
    const r = calcolaAddizionaleRegionale(10_000)
    expect(r.importo).toBeCloseTo(10_000 * 0.0123, 6)
  })

  it('è progressiva sopra 15.000', () => {
    const r = calcolaAddizionaleRegionale(20_000)
    const atteso = 15_000 * 0.0123 + 5_000 * 0.0158
    expect(r.importo).toBeCloseTo(atteso, 6)
  })
})

describe('calcolaAddizionaleComunale', () => {
  it('è zero fino a 23.000 (soglia di esenzione)', () => {
    expect(calcolaAddizionaleComunale(23_000).importo).toBe(0)
    expect(calcolaAddizionaleComunale(20_000).importo).toBe(0)
  })

  it('sopra soglia si applica sull\'intero imponibile, non è una franchigia', () => {
    const r = calcolaAddizionaleComunale(23_001)
    expect(r.importo).toBeCloseTo(23_001 * 0.008, 6)
  })
})
