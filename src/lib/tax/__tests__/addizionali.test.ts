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

describe('calcolaAddizionaleRegionale — fasceIntere (Friuli-Venezia Giulia)', () => {
  const fvg = REGIONI_2026.find((r) => r.id === 'friuli-venezia-giulia')!.addizionale

  it('applica lo 0,70% sull\'intero imponibile fino a 15.000', () => {
    expect(calcolaAddizionaleRegionale(fvg, 12_000).importo).toBeCloseTo(12_000 * 0.007, 6)
    expect(calcolaAddizionaleRegionale(fvg, 15_000).importo).toBeCloseTo(15_000 * 0.007, 6)
  })

  it('sopra 15.000 applica l\'1,23% sull\'intero imponibile, non in modo marginale', () => {
    expect(calcolaAddizionaleRegionale(fvg, 20_000).importo).toBeCloseTo(20_000 * 0.0123, 6)
    const marginaleSbagliato = 15_000 * 0.007 + 5_000 * 0.0123
    expect(calcolaAddizionaleRegionale(fvg, 20_000).importo).not.toBeCloseTo(marginaleSbagliato, 2)
  })
})

describe('calcolaAddizionaleRegionale — progressivo con clausola (Lazio 2026)', () => {
  const lazio = REGIONI_2026.find((r) => r.id === 'lazio')!.addizionale

  it('fino a 28.000 applica l\'1,73% sull\'intero imponibile (LR 20/2025 art. 2 c.2)', () => {
    expect(calcolaAddizionaleRegionale(lazio, 20_000).importo).toBeCloseTo(20_000 * 0.0173, 6)
    expect(calcolaAddizionaleRegionale(lazio, 28_000).importo).toBeCloseTo(28_000 * 0.0173, 6)
  })

  it('sopra 28.000 applica gli scaglioni marginali, con detrazione di 60€ fino a 30.000', () => {
    const atteso29k = 15_000 * 0.0173 + 14_000 * 0.0333 - 60
    expect(calcolaAddizionaleRegionale(lazio, 29_000).importo).toBeCloseTo(atteso29k, 6)
  })

  it('oltre 30.000 nessuna detrazione, solo scaglioni marginali', () => {
    const atteso40k = 15_000 * 0.0173 + 25_000 * 0.0333
    expect(calcolaAddizionaleRegionale(lazio, 40_000).importo).toBeCloseTo(atteso40k, 6)
  })

  it('la detrazione vale a 30.000 esatti e sparisce a 30.001', () => {
    const marginale = (imponibile: number) => 15_000 * 0.0173 + (imponibile - 15_000) * 0.0333
    expect(calcolaAddizionaleRegionale(lazio, 30_000).importo).toBeCloseTo(marginale(30_000) - 60, 6)
    expect(calcolaAddizionaleRegionale(lazio, 30_001).importo).toBeCloseTo(marginale(30_001), 6)
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
