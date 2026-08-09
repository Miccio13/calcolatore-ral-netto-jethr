import { describe, expect, it } from 'vitest'
import { COMUNI_2026 } from '../comuni-2026'
import { REGIONI_2026 } from '../regioni-2026'

describe('COMUNI_2026 — integrità del legame con le regioni', () => {
  it('ogni comune punta a una regione esistente in REGIONI_2026', () => {
    const idRegioni = new Set(REGIONI_2026.map((r) => r.id))
    for (const comune of COMUNI_2026) {
      expect(idRegioni, `regioneId '${comune.regioneId}' di ${comune.nome}`).toContain(
        comune.regioneId,
      )
    }
  })

  it("nessun comune usa l'id riservato 'personalizzato' (sentinella della UI)", () => {
    for (const comune of COMUNI_2026) {
      expect(comune.id).not.toBe('personalizzato')
    }
  })
})
