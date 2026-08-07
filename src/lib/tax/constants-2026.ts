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

export const INPS_2026 = {
  aliquotaBase: 0.0919,
  aliquotaConFis: 0.0949,
  aliquotaAggiuntiva: 0.01,
  primaFasciaPensionabile: 56_224,
  massimaleAnnuo: 122_295,
} as const

export const ADDIZIONALE_REGIONALE_LOMBARDIA_2026 = [
  { da: 0, a: 15_000, aliquota: 0.0123 },
  { da: 15_000, a: 28_000, aliquota: 0.0158 },
  { da: 28_000, a: 50_000, aliquota: 0.0172 },
  { da: 50_000, a: Infinity, aliquota: 0.0173 },
] as const

export const ADDIZIONALE_COMUNALE_MILANO_2026 = {
  aliquota: 0.008,
  sogliaEsenzione: 23_000,
} as const

export const COSTO_AZIENDA_2026 = {
  contributiPerSettore: {
    terziario: 0.294,
    industria: 0.32,
  },
  tfrPercentuale: 1 / 13.5,
} as const
