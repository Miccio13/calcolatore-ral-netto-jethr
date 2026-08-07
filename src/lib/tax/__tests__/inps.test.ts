import { describe, expect, it } from 'vitest'
import { calcolaContributiInps } from '../inps'

describe('calcolaContributiInps', () => {
  it('applica la sola aliquota base sotto la 1ª fascia pensionabile (56.224)', () => {
    const r = calcolaContributiInps(35_000, 0.0919)
    expect(r.importo).toBeCloseTo(35_000 * 0.0919, 6)
  })

  it('esattamente sulla soglia 56.224 non applica l\'aliquota aggiuntiva', () => {
    const r = calcolaContributiInps(56_224, 0.0919)
    expect(r.importo).toBeCloseTo(56_224 * 0.0919, 6)
  })

  it('applica l\'1% aggiuntivo solo sulla quota oltre 56.224', () => {
    const r = calcolaContributiInps(70_000, 0.0919)
    const atteso = 56_224 * 0.0919 + (70_000 - 56_224) * (0.0919 + 0.01)
    expect(r.importo).toBeCloseTo(atteso, 6)
  })

  it('usa l\'aliquota 9,49% quando richiesta', () => {
    const r = calcolaContributiInps(30_000, 0.0949)
    expect(r.importo).toBeCloseTo(30_000 * 0.0949, 6)
  })

  it('restituisce una VoceBreakdown con fonte e segno trattenuta', () => {
    const r = calcolaContributiInps(35_000, 0.0919)
    expect(r.segno).toBe('trattenuta')
    expect(r.fonte.norma).toContain('INPS')
  })
})
