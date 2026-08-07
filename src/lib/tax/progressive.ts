/**
 * Utility generica per il calcolo per scaglioni progressivi (IRPEF, addizionale regionale).
 * Ogni scaglione tassa solo la propria fascia di reddito, non l'intero importo.
 */

export type Scaglione = {
  da: number
  a: number
  aliquota: number
}

/**
 * Applica l'imposta per scaglioni progressivi: per ogni fascia [da, a) tassa solo la
 * quota di `base` che ricade in quella fascia, all'aliquota dello scaglione.
 */
export function calcolaProgressivo(base: number, scaglioni: readonly Scaglione[]): number {
  if (base <= 0) return 0

  let imposta = 0
  for (const scaglione of scaglioni) {
    if (base <= scaglione.da) break
    const quotaInScaglione = Math.min(base, scaglione.a) - scaglione.da
    imposta += quotaInScaglione * scaglione.aliquota
  }
  return imposta
}
