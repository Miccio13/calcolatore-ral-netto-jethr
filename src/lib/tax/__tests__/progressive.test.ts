import { describe, expect, it } from 'vitest'
import { calcolaProgressivo } from '../progressive'
import { SCAGLIONI_IRPEF_2026 } from '../constants-2026'

describe('calcolaProgressivo', () => {
  it('restituisce 0 per base zero o negativa', () => {
    expect(calcolaProgressivo(0, SCAGLIONI_IRPEF_2026)).toBe(0)
    expect(calcolaProgressivo(-100, SCAGLIONI_IRPEF_2026)).toBe(0)
  })

  it('tassa interamente al primo scaglione se la base non lo supera', () => {
    expect(calcolaProgressivo(20_000, SCAGLIONI_IRPEF_2026)).toBeCloseTo(20_000 * 0.23, 6)
  })

  it('applica la forma cumulativa ufficiale AdE su 50.000 esatti: 13.700', () => {
    expect(calcolaProgressivo(50_000, SCAGLIONI_IRPEF_2026)).toBeCloseTo(13_700, 6)
  })

  it('applica la forma cumulativa ufficiale AdE su 28.000 esatti: 6.440', () => {
    expect(calcolaProgressivo(28_000, SCAGLIONI_IRPEF_2026)).toBeCloseTo(6_440, 6)
  })

  it('tassa oltre il terzo scaglione: 60.000 -> 13.700 + 43% di 10.000', () => {
    expect(calcolaProgressivo(60_000, SCAGLIONI_IRPEF_2026)).toBeCloseTo(13_700 + 4_300, 6)
  })
})
