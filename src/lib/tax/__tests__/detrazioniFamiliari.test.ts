import { describe, expect, it } from 'vitest'
import {
  calcolaDetrazioneAltriFamiliari,
  calcolaDetrazioneConiuge,
  calcolaDetrazioneFigli,
} from '../detrazioniFamiliari'

// Art. 12 c.4 TUIR: il risultato dei rapporti si assume nelle prime quattro
// cifre decimali — replicato negli attesi.
const tronca = (r: number) => Math.trunc(r * 10_000) / 10_000

describe('calcolaDetrazioneConiuge', () => {
  it('è zero se il coniuge non è a carico', () => {
    expect(calcolaDetrazioneConiuge(false, 30_000, 365).importo).toBe(0)
  })

  it('prima fascia (≤15.000): 800 - 110 × rapporto (troncato a 4 decimali, art. 12 c.4)', () => {
    const r = calcolaDetrazioneConiuge(true, 10_000, 365)
    const atteso = 800 - 110 * tronca(10_000 / 15_000)
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('seconda fascia (15.000-40.000): fisso 690', () => {
    expect(calcolaDetrazioneConiuge(true, 25_000, 365).importo).toBeCloseTo(690, 6)
  })

  it('terza fascia (40.000-80.000): decresce linearmente', () => {
    const r = calcolaDetrazioneConiuge(true, 60_000, 365)
    const atteso = 690 * ((80_000 - 60_000) / 40_000)
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('è zero oltre 80.000', () => {
    expect(calcolaDetrazioneConiuge(true, 90_000, 365).importo).toBe(0)
  })

  it('applica il micro-bonus tra 29.000 e 29.200 (art. 12 c.1 lett. b)', () => {
    const r = calcolaDetrazioneConiuge(true, 29_100, 365)
    expect(r.importo).toBeCloseTo(690 + 10, 6)
  })

  it('applica il micro-bonus tra 34.700 e 35.000', () => {
    const r = calcolaDetrazioneConiuge(true, 34_800, 365)
    expect(r.importo).toBeCloseTo(690 + 30, 6)
  })

  it('è rapportata al periodo di lavoro', () => {
    const pieno = calcolaDetrazioneConiuge(true, 25_000, 365).importo
    const meta = calcolaDetrazioneConiuge(true, 25_000, 182.5).importo
    expect(meta).toBeCloseTo(pieno / 2, 6)
  })
})

describe('calcolaDetrazioneFigli', () => {
  it('è zero senza figli a carico', () => {
    expect(calcolaDetrazioneFigli(0, 100, 30_000, 365).importo).toBe(0)
  })

  it('un figlio, quota 100%, reddito basso: vicino al massimo 950 (rapporto troncato)', () => {
    const r = calcolaDetrazioneFigli(1, 100, 10_000, 365)
    const atteso = 950 * tronca((95_000 - 10_000) / 95_000)
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('la quota 50% dimezza l\'importo rispetto al 100%', () => {
    const pieno = calcolaDetrazioneFigli(1, 100, 30_000, 365).importo
    const meta = calcolaDetrazioneFigli(1, 50, 30_000, 365).importo
    expect(meta).toBeCloseTo(pieno / 2, 6)
  })

  it('con più figli la base del rapporto cresce di 15.000 per figlio successivo al primo', () => {
    const r = calcolaDetrazioneFigli(2, 100, 30_000, 365)
    const base = 95_000 + 15_000
    const atteso = 950 * 2 * tronca((base - 30_000) / base)
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('è zero oltre la soglia di reddito complessivo per quel numero di figli', () => {
    expect(calcolaDetrazioneFigli(1, 100, 95_000, 365).importo).toBe(0)
    expect(calcolaDetrazioneFigli(1, 100, 200_000, 365).importo).toBe(0)
  })
})

describe('calcolaDetrazioneAltriFamiliari', () => {
  it('è zero senza altri familiari a carico', () => {
    expect(calcolaDetrazioneAltriFamiliari(0, 30_000, 365).importo).toBe(0)
  })

  it('750 per familiare, rapporto su base 80.000', () => {
    const r = calcolaDetrazioneAltriFamiliari(1, 20_000, 365)
    const atteso = 750 * ((80_000 - 20_000) / 80_000)
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('è zero oltre 80.000', () => {
    expect(calcolaDetrazioneAltriFamiliari(1, 90_000, 365).importo).toBe(0)
  })
})
