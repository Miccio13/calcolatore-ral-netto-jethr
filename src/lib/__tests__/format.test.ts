import { describe, expect, it } from 'vitest'
import { formatEuro, formatEuroPreciso, formatNumero, formatPercentuale } from '../format'

/**
 * Questi formatter sono scritti a mano invece di usare Intl.NumberFormat('it-IT', ...)
 * perché quest'ultimo dipende dai dati ICU del runtime: nel dev server questo progetto
 * ha prodotto "1,855 €" lato server (SSR) contro "1855 €" o "1.855 €" lato client,
 * causando un mismatch di idratazione React. I test qui fissano il comportamento atteso
 * indipendentemente da qualunque ICU disponibile nell'ambiente di esecuzione.
 */
describe('formatEuro', () => {
  it('usa il punto per le migliaia, nessun decimale', () => {
    expect(formatEuro(1855)).toBe('1.855 €')
    expect(formatEuro(25967)).toBe('25.967 €')
    expect(formatEuro(999)).toBe('999 €')
    expect(formatEuro(1000)).toBe('1.000 €')
    expect(formatEuro(1000000)).toBe('1.000.000 €')
  })

  it('arrotonda al numero intero più vicino', () => {
    expect(formatEuro(1854.6)).toBe('1.855 €')
    expect(formatEuro(1854.4)).toBe('1.854 €')
  })

  it('gestisce lo zero e i negativi', () => {
    expect(formatEuro(0)).toBe('0 €')
    expect(formatEuro(-500)).toBe('-500 €')
  })
})

describe('formatEuroPreciso', () => {
  it('usa il punto per le migliaia e la virgola per i decimali', () => {
    expect(formatEuroPreciso(1854.5)).toBe('1.854,50 €')
    expect(formatEuroPreciso(254.27)).toBe('254,27 €')
  })
})

describe('formatPercentuale', () => {
  it('converte la frazione in percentuale con la virgola come separatore decimale, sempre 1 decimale', () => {
    expect(formatPercentuale(0.258)).toBe('25,8%')
    expect(formatPercentuale(0.02)).toBe('2,0%')
  })
})

describe('formatNumero', () => {
  it('raggruppa le migliaia senza simbolo di valuta', () => {
    expect(formatNumero(35000)).toBe('35.000')
    expect(formatNumero(56224)).toBe('56.224')
  })
})
