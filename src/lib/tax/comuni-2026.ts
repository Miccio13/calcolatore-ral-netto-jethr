import type { Scaglione } from './progressive'

/**
 * Addizionale comunale IRPEF 2026, per un set di 11 capoluoghi verificati
 * singolarmente sul Dipartimento delle Finanze (vedi FONTI.addizionaliComunali2026
 * e FONTI.addizionaleComunaleMilano). Copertura dichiaratamente parziale — vedi
 * la nota nella fonte — con inserimento manuale come fallback per gli altri
 * comuni (gestito nell'orchestratore, non qui).
 *
 * Meccanica uniforme, verificata su Milano e confermata sugli altri comuni:
 * sotto la soglia di esenzione l'addizionale è zero; sopra la soglia si paga
 * sull'intero imponibile (non solo sull'eccedenza — soglia, non franchigia),
 * applicando poi gli scaglioni in modo marginale come l'IRPEF nazionale per i
 * comuni che differenziano l'aliquota per fascia di reddito (art. 1 c.142-143
 * L. 296/2006). Un comune con aliquota unica è semplicemente un array di un
 * solo scaglione.
 */

export type Comune = {
  id: string
  nome: string
  soglia: number
  scaglioni: Scaglione[]
}

export const COMUNI_2026: Comune[] = [
  {
    id: 'milano',
    nome: 'Milano',
    soglia: 23_000,
    scaglioni: [{ da: 0, a: Infinity, aliquota: 0.008 }],
  },
  {
    id: 'roma',
    nome: 'Roma',
    soglia: 14_000,
    scaglioni: [{ da: 0, a: Infinity, aliquota: 0.009 }],
  },
  {
    id: 'napoli',
    nome: 'Napoli',
    soglia: 12_000,
    scaglioni: [{ da: 0, a: Infinity, aliquota: 0.01 }],
  },
  {
    id: 'torino',
    nome: 'Torino',
    soglia: 11_790,
    scaglioni: [
      { da: 0, a: 28_000, aliquota: 0.008 },
      { da: 28_000, a: 50_000, aliquota: 0.011 },
      { da: 50_000, a: Infinity, aliquota: 0.012 },
    ],
  },
  {
    id: 'genova',
    nome: 'Genova',
    soglia: 14_000,
    scaglioni: [
      { da: 0, a: 28_000, aliquota: 0.01 },
      { da: 28_000, a: 50_000, aliquota: 0.011 },
      { da: 50_000, a: Infinity, aliquota: 0.012 },
    ],
  },
  {
    id: 'bologna',
    nome: 'Bologna',
    soglia: 15_000,
    scaglioni: [{ da: 0, a: Infinity, aliquota: 0.008 }],
  },
  {
    id: 'firenze',
    nome: 'Firenze',
    soglia: 25_000,
    scaglioni: [{ da: 0, a: Infinity, aliquota: 0.002 }],
  },
  {
    id: 'palermo',
    nome: 'Palermo',
    soglia: 0,
    scaglioni: [{ da: 0, a: Infinity, aliquota: 0.0103 }],
  },
  {
    id: 'bari',
    nome: 'Bari',
    soglia: 15_000,
    scaglioni: [{ da: 0, a: Infinity, aliquota: 0.008 }],
  },
  {
    id: 'venezia',
    nome: 'Venezia',
    soglia: 10_000,
    scaglioni: [{ da: 0, a: Infinity, aliquota: 0.008 }],
  },
  {
    id: 'cagliari',
    nome: 'Cagliari',
    soglia: 10_000,
    scaglioni: [
      { da: 0, a: 15_000, aliquota: 0.0066 },
      { da: 15_000, a: 28_000, aliquota: 0.0072 },
      { da: 28_000, a: 50_000, aliquota: 0.0078 },
      { da: 50_000, a: Infinity, aliquota: 0.008 },
    ],
  },
]

export const COMUNE_DEFAULT_ID = 'milano'
