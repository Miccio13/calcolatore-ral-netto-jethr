import { describe, expect, it } from 'vitest'
import { calcolaWelfare } from '../welfare'

describe('calcolaWelfare', () => {
  it('importo zero: nessun impatto', () => {
    const r = calcolaWelfare(0, false)
    expect(r.imponibileAggiuntivo).toBe(0)
    expect(r.voce.importo).toBe(0)
  })

  it('sotto soglia (1.000€ senza figli a carico): interamente esente, si somma al netto', () => {
    const r = calcolaWelfare(800, false)
    expect(r.imponibileAggiuntivo).toBe(0)
    expect(r.voce.importo).toBeCloseTo(800, 6)
  })

  it('sopra soglia generale: l\'intero importo diventa imponibile, non solo l\'eccedenza', () => {
    const r = calcolaWelfare(1_200, false)
    expect(r.imponibileAggiuntivo).toBeCloseTo(1_200, 6)
    expect(r.voce.formula).toMatch(/intero/i)
  })

  it('con figli a carico la soglia sale a 2.000€', () => {
    const sottoSogliaAlta = calcolaWelfare(1_800, true)
    expect(sottoSogliaAlta.imponibileAggiuntivo).toBe(0)

    const sopraSogliaAlta = calcolaWelfare(2_100, true)
    expect(sopraSogliaAlta.imponibileAggiuntivo).toBeCloseTo(2_100, 6)
  })

  it('esattamente sulla soglia resta esente (soglia inclusiva)', () => {
    const r = calcolaWelfare(1_000, false)
    expect(r.imponibileAggiuntivo).toBe(0)
  })
})
