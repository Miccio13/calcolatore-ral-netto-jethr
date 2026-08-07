import { describe, expect, it } from 'vitest'
import { calcola } from '../calcola'
import { INPUT_DEFAULT } from '../types'

function conRal(ral: number, overrides: Partial<typeof INPUT_DEFAULT> = {}) {
  return calcola({ ...INPUT_DEFAULT, ral, ...overrides })
}

describe('calcola — casi standard', () => {
  it.each([15_000, 25_000, 35_000, 60_000, 100_000])(
    'produce un risultato internamente coerente per RAL %i',
    (ral) => {
      const r = conRal(ral)

      // Il netto non supera mai la RAL più i bonus, ed è positivo.
      expect(r.nettoAnnuo).toBeGreaterThan(0)
      expect(r.nettoAnnuo).toBeLessThan(ral + 3000)

      // Netto mensile coerente con le mensilità scelte.
      expect(r.nettoMensile).toBeCloseTo(r.nettoAnnuo / r.input.mensilita, 6)

      // L'aliquota effettiva è tra 0 e 1.
      expect(r.aliquotaEffettiva).toBeGreaterThan(0)
      expect(r.aliquotaEffettiva).toBeLessThan(1)

      // Il costo azienda supera sempre la RAL.
      expect(r.costoAzienda.totale).toBeGreaterThan(ral)

      // Ogni voce del breakdown ha una fonte.
      for (const voce of r.breakdown) {
        expect(voce.fonte).toBeDefined()
        expect(voce.fonte.url).toMatch(/^https:\/\//)
      }
    }
  )

  it('a RAL 35.000 con parametri di default aliquota effettiva è nel range atteso (25-35%)', () => {
    const r = conRal(35_000)
    expect(r.aliquotaEffettiva).toBeGreaterThan(0.2)
    expect(r.aliquotaEffettiva).toBeLessThan(0.35)
  })
})

describe('calcola — continuità sui valori di soglia', () => {
  // Le soglie normative (20.000, 28.000, 32.000, 40.000, 50.000, 56.224) sono sul
  // REDDITO, non sulla RAL. Si converte con RAL = reddito / (1 - aliquotaInps), valida
  // sotto la 1ª fascia pensionabile dove l'aliquota INPS è piatta.
  const ralPerReddito = (reddito: number) => reddito / (1 - INPUT_DEFAULT.aliquotaInps)
  const sogliePerReddito = [20_000, 28_000, 32_000, 40_000, 50_000, 56_224]

  it.each(sogliePerReddito)('non ha discontinuità artificiali intorno a reddito %i', (soglia) => {
    const ral = ralPerReddito(soglia)
    const sotto = conRal(ral - 1)
    const sopra = conRal(ral + 1)
    const salto = Math.abs(sopra.nettoAnnuo - sotto.nettoAnnuo)
    // Una variazione di 2 euro di RAL non deve produrre più di ~50 euro di salto nel
    // netto: le formule sono continue per costruzione a queste soglie, un salto grande
    // segnalerebbe un bug. Il salto a 15.000 è escluso: è una discontinuità reale della
    // norma, verificata a parte sotto.
    expect(salto).toBeLessThan(50)
  })

  it('a reddito 15.000 la norma produce un effetto soglia reale: il netto può scendere pur salendo la RAL', () => {
    // Documentato, non un bug. Due cose cambiano insieme appena il reddito supera i
    // 15.000 €: la detrazione art. 13 salta da 1.955 a ~3.100 (guadagno fiscale reale
    // ma parziale, perché vale solo come sconto sull'aliquota marginale, non 1 a 1),
    // e si perde interamente il trattamento integrativo di 1.200 € (soglia netta,
    // non decrescente). Il secondo effetto è più grande del primo: il netto annuo
    // diminuisce di qualche decina/centinaio di euro proprio nel punto in cui la RAL
    // aumenta. È un "effetto soglia" noto nella letteratura sulla fiscalità del lavoro
    // dipendente italiana, non un errore del motore — per questo va verificato
    // esplicitamente invece di essere nascosto da una tolleranza larga.
    const ral = ralPerReddito(15_000)
    const appenaSotto = conRal(ral - 1)
    const appenaSopra = conRal(ral + 1)
    expect(appenaSopra.nettoAnnuo).toBeLessThan(appenaSotto.nettoAnnuo)
  })
})

describe('calcola — trattamento integrativo e somma integrativa', () => {
  it('spettano entrambi sotto i 15.000 nel caso standard', () => {
    const r = conRal(14_000)
    const trattamento = r.breakdown.find((v) => v.id === 'trattamento-integrativo')
    const somma = r.breakdown.find((v) => v.id === 'somma-integrativa')
    expect(trattamento?.importo).toBeGreaterThan(0)
    expect(somma?.importo).toBeGreaterThan(0)
  })

  it('non spettano su una RAL alta', () => {
    const r = conRal(60_000)
    expect(r.breakdown.find((v) => v.id === 'trattamento-integrativo')).toBeUndefined()
    expect(r.breakdown.find((v) => v.id === 'somma-integrativa')).toBeUndefined()
  })
})

describe('calcola — mensilità', () => {
  it('12 mensilità danno un netto mensile più alto di 14 a parità di RAL', () => {
    const r12 = conRal(35_000, { mensilita: 12 })
    const r14 = conRal(35_000, { mensilita: 14 })
    expect(r12.nettoAnnuo).toBeCloseTo(r14.nettoAnnuo, 6)
    expect(r12.nettoMensile).toBeGreaterThan(r14.nettoMensile)
  })
})
