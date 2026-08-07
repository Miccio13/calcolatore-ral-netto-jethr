import { describe, expect, it } from 'vitest'
import { DOMINI_ISTITUZIONALI, FONTI } from '../fonti'

describe('FONTI — regola dei domini istituzionali', () => {
  const tutteLeFonti = Object.values(FONTI)

  it('non è vuoto', () => {
    expect(tutteLeFonti.length).toBeGreaterThan(0)
  })

  it.each(tutteLeFonti)('$id punta a un dominio istituzionale', (fonte) => {
    const { hostname } = new URL(fonte.url)
    const appartiene = DOMINI_ISTITUZIONALI.some(
      (dominio) => hostname === dominio || hostname.endsWith(`.${dominio}`)
    )
    expect(appartiene, `${fonte.url} non è su un dominio istituzionale`).toBe(true)
  })

  it('ogni fonte ha norma, descrizione e tipo non vuoti', () => {
    for (const fonte of tutteLeFonti) {
      expect(fonte.norma.length).toBeGreaterThan(0)
      expect(fonte.descrizione.length).toBeGreaterThan(0)
      expect(['norma', 'prassi', 'atto-locale']).toContain(fonte.tipo)
    }
  })
})
