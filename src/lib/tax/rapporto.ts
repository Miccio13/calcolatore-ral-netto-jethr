/**
 * Art. 13 c.6 e art. 12 c.4 TUIR, stessa formula in entrambi: «se il risultato
 * dei rapporti è maggiore di zero, lo stesso si assume nelle prime quattro
 * cifre decimali». È un troncamento, non un arrotondamento: 0,076846… → 0,0768.
 */
export function troncaRapporto(rapporto: number): number {
  return Math.trunc(rapporto * 10_000) / 10_000
}
