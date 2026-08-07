import { describe, expect, it } from 'vitest'
import { calcolaAddizionaleComunale, calcolaAddizionaleRegionale } from '../addizionali'
import { COMUNI_2026 } from '../comuni-2026'
import { REGIONI_2026 } from '../regioni-2026'

const lombardia = REGIONI_2026.find((r) => r.id === 'lombardia')!.addizionale
const veneto = REGIONI_2026.find((r) => r.id === 'veneto')!.addizionale // flat
const valleDAosta = REGIONI_2026.find((r) => r.id === 'valle-daosta')!.addizionale // sogliaFlat

describe('calcolaAddizionaleRegionale — progressivo (Lombardia)', () => {
  it('applica solo il primo scaglione sotto 15.000', () => {
    const r = calcolaAddizionaleRegionale(lombardia, 10_000)
    expect(r.importo).toBeCloseTo(10_000 * 0.0123, 6)
  })

  it('è progressiva sopra 15.000', () => {
    const r = calcolaAddizionaleRegionale(lombardia, 20_000)
    const atteso = 15_000 * 0.0123 + 5_000 * 0.0158
    expect(r.importo).toBeCloseTo(atteso, 6)
  })
})

describe('calcolaAddizionaleRegionale — flat (Veneto)', () => {
  it('applica l\'aliquota unica sull\'intero imponibile', () => {
    const r = calcolaAddizionaleRegionale(veneto, 40_000)
    expect(r.importo).toBeCloseTo(40_000 * 0.0123, 6)
  })
})

describe('calcolaAddizionaleRegionale — sogliaFlat (Valle d\'Aosta)', () => {
  it('è esente sotto soglia', () => {
    expect(calcolaAddizionaleRegionale(valleDAosta, 10_000).importo).toBe(0)
  })

  it('sopra soglia applica l\'aliquota sull\'intero imponibile, non solo l\'eccedenza', () => {
    const r = calcolaAddizionaleRegionale(valleDAosta, 20_000)
    expect(r.importo).toBeCloseTo(20_000 * 0.0123, 6)
  })
})

describe('calcolaAddizionaleComunale', () => {
  const milano = COMUNI_2026.find((c) => c.id === 'milano')!
  const torino = COMUNI_2026.find((c) => c.id === 'torino')! // multi-scaglione sopra soglia

  it('Milano: è zero fino a 23.000 (soglia di esenzione)', () => {
    expect(calcolaAddizionaleComunale(milano, 23_000).importo).toBe(0)
    expect(calcolaAddizionaleComunale(milano, 20_000).importo).toBe(0)
  })

  it('Milano: sopra soglia si applica sull\'intero imponibile', () => {
    const r = calcolaAddizionaleComunale(milano, 23_001)
    expect(r.importo).toBeCloseTo(23_001 * 0.008, 6)
  })

  it('Torino: esente sotto la propria soglia (11.790)', () => {
    expect(calcolaAddizionaleComunale(torino, 11_000).importo).toBe(0)
  })

  it('Torino: sopra soglia applica gli scaglioni in modo marginale sull\'intero imponibile', () => {
    const r = calcolaAddizionaleComunale(torino, 30_000)
    const atteso = 28_000 * 0.008 + 2_000 * 0.011
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('supporta un comune personalizzato (aliquota/soglia manuali)', () => {
    const custom = { id: 'custom', nome: 'Personalizzato', soglia: 5_000, scaglioni: [{ da: 0, a: Infinity, aliquota: 0.005 }] }
    expect(calcolaAddizionaleComunale(custom, 4_000).importo).toBe(0)
    expect(calcolaAddizionaleComunale(custom, 10_000).importo).toBeCloseTo(10_000 * 0.005, 6)
  })
})
