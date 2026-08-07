import { describe, expect, it } from 'vitest'
import { risolviAliquotaInps } from '../contratto'

describe('risolviAliquotaInps', () => {
  it('con contratto standard usa l\'aliquota INPS selezionata (9,19%)', () => {
    expect(risolviAliquotaInps('standard', 0.0919).aliquota).toBeCloseTo(0.0919, 6)
  })

  it('con contratto standard usa l\'aliquota INPS selezionata (9,49%)', () => {
    expect(risolviAliquotaInps('standard', 0.0949).aliquota).toBeCloseTo(0.0949, 6)
  })

  it('con apprendistato ignora l\'aliquota selezionata e usa 5,84% flat', () => {
    expect(risolviAliquotaInps('apprendistato', 0.0919).aliquota).toBeCloseTo(0.0584, 6)
    expect(risolviAliquotaInps('apprendistato', 0.0949).aliquota).toBeCloseTo(0.0584, 6)
  })
})
