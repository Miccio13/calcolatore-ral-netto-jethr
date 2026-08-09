/**
 * Parametri normativi per l'anno d'imposta 2026, Comune di Milano, Regione Lombardia.
 * Ogni costante è legata a una fonte in fonti.ts tramite fonteId. Nessun magic number
 * altrove nel motore: se un parametro cambia, cambia solo qui.
 */

export const SCAGLIONI_IRPEF_2026 = [
  { da: 0, a: 28_000, aliquota: 0.23 },
  { da: 28_000, a: 50_000, aliquota: 0.33 },
  { da: 50_000, a: Infinity, aliquota: 0.43 },
] as const

export const DETRAZIONE_LAVORO_DIPENDENTE_2026 = {
  massimo: 1955,
  minimo: 690,
  minimoTempoDeterminato: 1380,
  sogliaBassa: 15_000,
  sogliaAlta: 50_000,
  puntoIntermedio: 28_000,
  // Art. 13 c.1.1 TUIR (introdotto dalla L. 234/2021): correttivo in aumento,
  // spetta per intero senza ragguaglio al periodo di lavoro (circ. AdE 4/E 2022).
  maggiorazione: {
    importo: 65,
    redditoOltre: 25_000,
    redditoFinoA: 35_000,
  },
} as const

export const DETRAZIONE_CONIUGE_2026 = {
  sogliaBassa: 15_000,
  sogliaMedia: 40_000,
  sogliaAlta: 80_000,
  baseFasciaBassa: 800,
  coefficienteFasciaBassa: 110,
  fisso: 690,
  // Micro-bonus art. 12 c.1 lett. b): correttivi storici su fasce di reddito
  // molto strette, aggiuntivi alla detrazione base.
  microBonus: [
    { da: 29_000, a: 29_200, importo: 10 },
    { da: 29_200, a: 34_700, importo: 20 },
    { da: 34_700, a: 35_000, importo: 30 },
    { da: 35_000, a: 35_100, importo: 20 },
    { da: 35_100, a: 35_200, importo: 10 },
  ],
} as const

export const DETRAZIONE_FIGLI_2026 = {
  importoBase: 950,
  baseRapporto: 95_000,
  incrementoBasePerFiglioSuccessivo: 15_000,
} as const

export const DETRAZIONE_ALTRI_FAMILIARI_2026 = {
  importoBase: 750,
  baseRapporto: 80_000,
} as const

export const CUNEO_FISCALE_2026 = {
  sommaIntegrativa: [
    { da: 0, a: 8_500, percentuale: 0.071 },
    { da: 8_500, a: 15_000, percentuale: 0.053 },
    { da: 15_000, a: Infinity, percentuale: 0.048 },
  ],
  sogliaMassimaSommaIntegrativa: 20_000,
  ulterioreDetrazione: {
    importoMassimo: 1000,
    sogliaBassa: 20_000,
    sogliaPiena: 32_000,
    sogliaAlta: 40_000,
  },
} as const

export const TRATTAMENTO_INTEGRATIVO_2026 = {
  importo: 1200,
  sogliaRedditoComplessivo: 15_000,
  correttivoCapienza: 75,
} as const

export const ALIQUOTA_APPRENDISTATO_2026 = 0.0584 as const

export const INPS_2026 = {
  aliquotaBase: 0.0919,
  aliquotaConFis: 0.0949,
  aliquotaAggiuntiva: 0.01,
  primaFasciaPensionabile: 56_224,
  massimaleAnnuo: 122_295,
} as const

// Le aliquote regionali e comunali sono in regioni-2026.ts e comuni-2026.ts,
// non più fisse alla sola Lombardia/Milano.

export const WELFARE_2026 = {
  sogliaGenerale: 1_000,
  sogliaConFigliACarico: 2_000,
} as const

export const COSTO_AZIENDA_2026 = {
  contributiPerSettore: {
    terziario: 0.294,
    industria: 0.32,
  },
  tfrPercentuale: 1 / 13.5,
} as const
