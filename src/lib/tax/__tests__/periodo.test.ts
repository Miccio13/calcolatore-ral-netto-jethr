import { describe, expect, it } from 'vitest'
import { GIORNI_ANNO, rapportaAlPeriodo, redditoAnnualizzato } from '../periodo'

describe('rapportaAlPeriodo', () => {
  it('con 365 giorni non modifica l\'importo (rapporto 1)', () => {
    expect(rapportaAlPeriodo(1955, 365)).toBeCloseTo(1955, 6)
  })

  it('dimezza l\'importo a metà anno', () => {
    expect(rapportaAlPeriodo(1000, 182.5)).toBeCloseTo(500, 6)
  })

  it('azzera l\'importo con 0 giorni', () => {
    expect(rapportaAlPeriodo(1000, 0)).toBe(0)
  })

  it('tronca a 365 se venisse passato un valore maggiore per errore', () => {
    expect(rapportaAlPeriodo(1000, 400)).toBeCloseTo(1000, 6)
  })
})

describe('redditoAnnualizzato', () => {
  it('con 365 giorni coincide con il reddito del periodo', () => {
    expect(redditoAnnualizzato(20_000, 365)).toBeCloseTo(20_000, 6)
  })

  it('annualizza correttamente un periodo parziale (esempio circ. AdE 4/E)', () => {
    // Esempio 1 della circolare, input (2.000:62) x 365. Il valore letto in
    // origine dall'OCR del PDF (11.744,19) aveva una probabile inversione di
    // cifre: il calcolo aritmetico diretto dà 11.774,19 (730.000/62), coerente
    // con l'operazione dichiarata nel testo stesso.
    expect(redditoAnnualizzato(2_000, 62)).toBeCloseTo(11_774.19, 2)
  })

  it('con 0 giorni non genera NaN/Infinity', () => {
    expect(Number.isFinite(redditoAnnualizzato(0, 0))).toBe(true)
  })
})

describe('GIORNI_ANNO', () => {
  it('è 365', () => {
    expect(GIORNI_ANNO).toBe(365)
  })
})
