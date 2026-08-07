/**
 * Rapportamento al periodo di lavoro nell'anno.
 *
 * Il TUIR usa due meccaniche distinte per "periodo di lavoro", da non confondere:
 *
 * 1. Detrazioni (art. 13 c.1, art. 12 c.3 TUIR) e trattamento integrativo
 *    (D.L. 3/2020 art. 1 c.1): si calcola l'importo pieno sul reddito ANNUO,
 *    poi si moltiplica il risultato per (giorni lavorati / 365).
 *    → usare `rapportaAlPeriodo`.
 *
 * 2. Somma integrativa da cuneo fiscale (L. 207/2024 art. 1 c.4-5): si
 *    "annualizza" il reddito del periodo per scegliere lo scaglione di
 *    percentuale (7,1% / 5,3% / 4,8%), poi si applica quella percentuale al
 *    reddito EFFETTIVAMENTE percepito nel periodo — non al reddito annualizzato.
 *    Meccanismo verificato sugli esempi numerici della circ. AdE 4/E del
 *    16/05/2025 (Esempio 1: 2.000 € su 62 giorni → teorico 11.744,19 €).
 *    → usare `redditoAnnualizzato` solo per scegliere lo scaglione, non per
 *    calcolare l'importo erogato.
 */

export const GIORNI_ANNO = 365

/**
 * Riduce un importo già calcolato sul reddito annuo alla quota del periodo
 * effettivamente lavorato. Usata per le detrazioni art. 12/13 TUIR e per il
 * trattamento integrativo.
 */
export function rapportaAlPeriodo(importoAnnuo: number, giorniLavorati: number): number {
  const giorni = Math.min(GIORNI_ANNO, Math.max(0, giorniLavorati))
  return importoAnnuo * (giorni / GIORNI_ANNO)
}

/**
 * Annualizza il reddito di un periodo parziale, per determinare lo scaglione
 * di percentuale della somma integrativa da cuneo fiscale. Non va usata per
 * calcolare l'importo erogato: quello si applica al reddito effettivo del
 * periodo, non al valore annualizzato.
 */
export function redditoAnnualizzato(redditoPeriodo: number, giorniLavorati: number): number {
  if (giorniLavorati <= 0) return 0
  return (redditoPeriodo / giorniLavorati) * GIORNI_ANNO
}
