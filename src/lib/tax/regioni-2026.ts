import type { Scaglione } from './progressive'

/**
 * Addizionale regionale IRPEF 2026, tutte le regioni e province autonome.
 * Fonte: Dipartimento delle Finanze (finanze.gov.it), tool di ricerca per
 * regione (`addregirpef.php?reg=N`), consultato nel 2026. Vedi FONTI.addizionaliRegionali2026
 * e FONTI.addizionaleRegionaleLombardia (quest'ultima con fonte e verifica dedicate).
 *
 * Cinque meccaniche distinte, verificate sui testi restituiti dal tool:
 * - `progressivo`: aliquota diversa per scaglione, applicata in modo marginale
 *   come l'IRPEF nazionale (obbligo di legge, art. 6 D.Lgs. 68/2011, per le
 *   regioni che differenziano l'aliquota per fascia di reddito)
 * - `flat`: aliquota unica su tutto il reddito, nessuno scaglione
 * - `sogliaFlat`: esenzione totale sotto una soglia, aliquota piena sull'intero
 *   reddito sopra soglia (non marginale) — verificato esplicitamente per la
 *   Valle d'Aosta, stesso meccanismo già confermato per l'addizionale
 *   comunale di Milano
 * - `fasceIntere`: l'aliquota della fascia di appartenenza si applica
 *   sull'intero imponibile, non solo alla quota nella fascia — è il regime
 *   del Friuli-Venezia Giulia ("l'aliquota è ridotta dello 0,53%" per i
 *   redditi fino a 15.000, testuale dal prospetto DF 2026)
 * - `progressivoConClausola`: scaglioni marginali, ma sotto una soglia di
 *   imponibile vale un'aliquota unica sull'intero; opzionale una detrazione
 *   fissa su una fascia di raccordo — è il regime del Lazio 2026
 *   (LR 20/31.12.2025, art. 2 c.2-3: 1,73% per imponibili ≤28.000,
 *   detrazione di 60 € tra 28.000 e 30.000)
 *
 * Semplificazione dichiarata: nessuna delle detrazioni/agevolazioni regionali
 * per figli a carico, disabilità o altre condizioni specifiche menzionate da
 * alcune regioni (es. Trento, Veneto, Piemonte) è modellata — solo l'aliquota
 * base per scaglione di reddito.
 */

export type ScaglioneRegionale = Scaglione

export type RegioneAddizionale =
  | { tipo: 'progressivo'; scaglioni: ScaglioneRegionale[] }
  | { tipo: 'flat'; aliquota: number }
  | { tipo: 'sogliaFlat'; soglia: number; aliquota: number }
  | { tipo: 'fasceIntere'; fasce: { finoA: number; aliquota: number }[] }
  | {
      tipo: 'progressivoConClausola'
      clausola: { imponibileFinoA: number; aliquota: number }
      scaglioni: ScaglioneRegionale[]
      detrazione?: { da: number; a: number; importo: number }
    }

export type Regione = {
  id: string
  nome: string
  addizionale: RegioneAddizionale
}

export const REGIONI_2026: Regione[] = [
  {
    id: 'abruzzo',
    nome: 'Abruzzo',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 28_000, aliquota: 0.0167 },
        { da: 28_000, a: 50_000, aliquota: 0.0287 },
        { da: 50_000, a: Infinity, aliquota: 0.0333 },
      ],
    },
  },
  { id: 'basilicata', nome: 'Basilicata', addizionale: { tipo: 'flat', aliquota: 0.0123 } },
  {
    id: 'bolzano',
    nome: 'Bolzano (Provincia autonoma)',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 50_000, aliquota: 0.0123 },
        { da: 50_000, a: Infinity, aliquota: 0.0173 },
      ],
    },
  },
  { id: 'calabria', nome: 'Calabria', addizionale: { tipo: 'flat', aliquota: 0.0173 } },
  {
    id: 'campania',
    nome: 'Campania',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0173 },
        { da: 15_000, a: 28_000, aliquota: 0.0296 },
        { da: 28_000, a: 50_000, aliquota: 0.032 },
        { da: 50_000, a: Infinity, aliquota: 0.0333 },
      ],
    },
  },
  {
    id: 'emilia-romagna',
    nome: 'Emilia-Romagna',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0133 },
        { da: 15_000, a: 28_000, aliquota: 0.0193 },
        { da: 28_000, a: 50_000, aliquota: 0.0278 },
        { da: 50_000, a: Infinity, aliquota: 0.0333 },
      ],
    },
  },
  {
    id: 'friuli-venezia-giulia',
    nome: 'Friuli Venezia Giulia',
    addizionale: {
      tipo: 'fasceIntere',
      fasce: [
        { finoA: 15_000, aliquota: 0.007 },
        { finoA: Infinity, aliquota: 0.0123 },
      ],
    },
  },
  {
    id: 'lazio',
    nome: 'Lazio',
    addizionale: {
      tipo: 'progressivoConClausola',
      clausola: { imponibileFinoA: 28_000, aliquota: 0.0173 },
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0173 },
        { da: 15_000, a: Infinity, aliquota: 0.0333 },
      ],
      detrazione: { da: 28_000, a: 30_000, importo: 60 },
    },
  },
  {
    id: 'liguria',
    nome: 'Liguria',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 28_000, aliquota: 0.0123 },
        { da: 28_000, a: 50_000, aliquota: 0.0318 },
        { da: 50_000, a: Infinity, aliquota: 0.0323 },
      ],
    },
  },
  {
    id: 'lombardia',
    nome: 'Lombardia',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0123 },
        { da: 15_000, a: 28_000, aliquota: 0.0158 },
        { da: 28_000, a: 50_000, aliquota: 0.0172 },
        { da: 50_000, a: Infinity, aliquota: 0.0173 },
      ],
    },
  },
  {
    id: 'marche',
    nome: 'Marche',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0123 },
        { da: 15_000, a: 28_000, aliquota: 0.0153 },
        { da: 28_000, a: 50_000, aliquota: 0.017 },
        { da: 50_000, a: Infinity, aliquota: 0.0173 },
      ],
    },
  },
  {
    id: 'molise',
    nome: 'Molise',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0203 },
        { da: 15_000, a: 28_000, aliquota: 0.0223 },
        { da: 28_000, a: Infinity, aliquota: 0.0363 },
      ],
    },
  },
  {
    id: 'piemonte',
    nome: 'Piemonte',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0162 },
        { da: 15_000, a: 28_000, aliquota: 0.0268 },
        { da: 28_000, a: 50_000, aliquota: 0.0331 },
        { da: 50_000, a: Infinity, aliquota: 0.0333 },
      ],
    },
  },
  {
    id: 'puglia',
    nome: 'Puglia',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0133 },
        { da: 15_000, a: 28_000, aliquota: 0.0213 },
        { da: 28_000, a: 50_000, aliquota: 0.0323 },
        { da: 50_000, a: Infinity, aliquota: 0.0333 },
      ],
    },
  },
  { id: 'sardegna', nome: 'Sardegna', addizionale: { tipo: 'flat', aliquota: 0.0123 } },
  { id: 'sicilia', nome: 'Sicilia', addizionale: { tipo: 'flat', aliquota: 0.0123 } },
  {
    id: 'toscana',
    nome: 'Toscana',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0142 },
        { da: 15_000, a: 28_000, aliquota: 0.0143 },
        { da: 28_000, a: 50_000, aliquota: 0.0332 },
        { da: 50_000, a: Infinity, aliquota: 0.0333 },
      ],
    },
  },
  {
    id: 'trento',
    nome: 'Trento (Provincia autonoma)',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 50_000, aliquota: 0.0123 },
        { da: 50_000, a: Infinity, aliquota: 0.0173 },
      ],
    },
  },
  {
    id: 'umbria',
    nome: 'Umbria',
    addizionale: {
      tipo: 'progressivo',
      scaglioni: [
        { da: 0, a: 15_000, aliquota: 0.0173 },
        { da: 15_000, a: 28_000, aliquota: 0.0302 },
        { da: 28_000, a: 50_000, aliquota: 0.0312 },
        { da: 50_000, a: Infinity, aliquota: 0.0333 },
      ],
    },
  },
  {
    id: 'valle-daosta',
    nome: "Valle d'Aosta",
    addizionale: { tipo: 'sogliaFlat', soglia: 15_000, aliquota: 0.0123 },
  },
  { id: 'veneto', nome: 'Veneto', addizionale: { tipo: 'flat', aliquota: 0.0123 } },
]

export const REGIONE_DEFAULT_ID = 'lombardia'
