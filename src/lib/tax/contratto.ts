import { ALIQUOTA_APPRENDISTATO_2026 } from './constants-2026'
import { FONTI } from './fonti'
import type { Fonte } from './fonti'
import type { AliquotaInps } from './types'

export type TipoContratto = 'standard' | 'apprendistato'

type AliquotaRisolta = {
  aliquota: number
  fonte: Fonte
}

/**
 * Risolve l'aliquota INPS effettiva a carico del dipendente dal tipo di
 * contratto. L'apprendistato ha un'aliquota flat (5,84%) che sostituisce
 * qualunque selezione 9,19%/9,49% — la scelta standard/CIGS non ha senso per
 * un apprendista, quindi viene ignorata quando il contratto è apprendistato.
 *
 * Il tempo determinato non è modellato come opzione a sé: verificato che non
 * altera l'aliquota INPS del lavoratore né il floor delle detrazioni (vedi
 * detrazioni.ts), quindi non avrebbe alcun effetto numerico da esporre.
 */
export function risolviAliquotaInps(
  tipoContratto: TipoContratto,
  aliquotaStandardSelezionata: AliquotaInps
): AliquotaRisolta {
  if (tipoContratto === 'apprendistato') {
    return { aliquota: ALIQUOTA_APPRENDISTATO_2026, fonte: FONTI.apprendistato }
  }
  return { aliquota: aliquotaStandardSelezionata, fonte: FONTI.inpsCirc6_2026 }
}
