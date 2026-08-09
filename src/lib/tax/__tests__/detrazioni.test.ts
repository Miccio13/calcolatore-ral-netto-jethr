import { describe, expect, it } from 'vitest'
import { calcolaDetrazioneLavoroDipendente, calcolaUlterioreDetrazione } from '../detrazioni'

// Art. 13 c.6 TUIR: il risultato dei rapporti si assume nelle prime quattro
// cifre decimali (troncamento, non arrotondamento) — replicato negli attesi.
const tronca = (r: number) => Math.trunc(r * 10_000) / 10_000

describe('calcolaDetrazioneLavoroDipendente', () => {
  it('è 1.955 fisso fino a 15.000', () => {
    expect(calcolaDetrazioneLavoroDipendente(10_000).importo).toBeCloseTo(1955, 6)
    expect(calcolaDetrazioneLavoroDipendente(15_000).importo).toBeCloseTo(1955, 6)
  })

  it('decresce con la prima formula tra 15.000 e 28.000', () => {
    const r = calcolaDetrazioneLavoroDipendente(20_000)
    const atteso = 1910 + 1190 * tronca((28_000 - 20_000) / (28_000 - 15_000))
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('tronca il rapporto alle prime 4 cifre decimali (art. 13 c.6), non lo arrotonda', () => {
    // (28.000 − 27.001) / 13.000 = 0,076846… → si assume 0,0768
    const r = calcolaDetrazioneLavoroDipendente(27_001)
    expect(r.importo).toBeCloseTo(1910 + 1190 * 0.0768 + 65, 6)
    const nonTroncato = 1910 + 1190 * ((28_000 - 27_001) / 13_000) + 65
    expect(r.importo).not.toBeCloseTo(nonTroncato, 3)
  })

  it('a 28.000 esatti le due formule coincidono (continuità), più la maggiorazione di 65€', () => {
    const daPrimaFormula = 1910 + 1190 * ((28_000 - 28_000) / (28_000 - 15_000))
    const daSecondaFormula = 1910 * ((50_000 - 28_000) / (50_000 - 28_000))
    expect(daPrimaFormula).toBeCloseTo(daSecondaFormula, 6)
    expect(calcolaDetrazioneLavoroDipendente(28_000).importo).toBeCloseTo(daSecondaFormula + 65, 6)
  })

  it('decresce con la seconda formula tra 28.000 e 50.000', () => {
    const r = calcolaDetrazioneLavoroDipendente(40_000)
    const atteso = 1910 * tronca((50_000 - 40_000) / (50_000 - 28_000))
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('è zero oltre 50.000', () => {
    expect(calcolaDetrazioneLavoroDipendente(50_000).importo).toBeCloseTo(0, 6)
    expect(calcolaDetrazioneLavoroDipendente(80_000).importo).toBe(0)
  })

  it('il floor di 690€ (art. 13 c.1 lett. a) TUIR) è cablato esplicitamente, anche se in questo scaglione è un no-op numerico (1.955 > 690)', () => {
    const r = calcolaDetrazioneLavoroDipendente(10_000)
    expect(r.importo).toBeGreaterThanOrEqual(690)
    expect(r.formula).toMatch(/690/)
  })

  it('il floor sale a 1.380€ per tempo determinato, comunque no-op nello scaglione ≤15.000', () => {
    const r = calcolaDetrazioneLavoroDipendente(10_000, { tempoDeterminato: true })
    expect(r.importo).toBeCloseTo(1955, 6)
    expect(r.formula).toMatch(/1\.380/)
  })

  it('aggiunge la maggiorazione di 65€ (art. 13 c.1.1) per redditi tra 25.000 e 35.000', () => {
    const atteso30k = 1910 * tronca((50_000 - 30_000) / (50_000 - 28_000)) + 65
    expect(calcolaDetrazioneLavoroDipendente(30_000).importo).toBeCloseTo(atteso30k, 6)
    const atteso27k = 1910 + 1190 * tronca((28_000 - 27_000) / 13_000) + 65
    expect(calcolaDetrazioneLavoroDipendente(27_000).importo).toBeCloseTo(atteso27k, 6)
  })

  it('la maggiorazione scatta sopra 25.000 (escluso) e fino a 35.000 (incluso)', () => {
    const base25k = 1910 + 1190 * tronca((28_000 - 25_000) / 13_000)
    expect(calcolaDetrazioneLavoroDipendente(25_000).importo).toBeCloseTo(base25k, 6)
    const base35k = 1910 * tronca((50_000 - 35_000) / 22_000)
    expect(calcolaDetrazioneLavoroDipendente(35_000).importo).toBeCloseTo(base35k + 65, 6)
    const base35k1 = 1910 * tronca((50_000 - 35_001) / 22_000)
    expect(calcolaDetrazioneLavoroDipendente(35_001).importo).toBeCloseTo(base35k1, 6)
  })

  it('la maggiorazione di 65€ NON è rapportata al periodo di lavoro (circ. AdE 4/E 2022)', () => {
    const r = calcolaDetrazioneLavoroDipendente(30_000, { giorniLavorati: 182 })
    const baseAnnua = 1910 * tronca((50_000 - 30_000) / 22_000)
    expect(r.importo).toBeCloseTo(baseAnnua * (182 / 365) + 65, 6)
  })
})

describe('calcolaUlterioreDetrazione', () => {
  it('è zero fino a 20.000', () => {
    expect(calcolaUlterioreDetrazione(20_000).importo).toBe(0)
    expect(calcolaUlterioreDetrazione(15_000).importo).toBe(0)
  })

  it('è 1.000 fisso tra 20.000 e 32.000', () => {
    expect(calcolaUlterioreDetrazione(25_000).importo).toBeCloseTo(1000, 6)
    expect(calcolaUlterioreDetrazione(32_000).importo).toBeCloseTo(1000, 6)
  })

  it('decresce linearmente tra 32.000 e 40.000', () => {
    const r = calcolaUlterioreDetrazione(36_000)
    const atteso = 1000 * ((40_000 - 36_000) / 8_000)
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('è zero oltre 40.000', () => {
    expect(calcolaUlterioreDetrazione(40_000).importo).toBeCloseTo(0, 6)
    expect(calcolaUlterioreDetrazione(60_000).importo).toBe(0)
  })
})
