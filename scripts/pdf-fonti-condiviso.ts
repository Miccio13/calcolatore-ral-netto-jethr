/**
 * Parti condivise tra i documenti "Fonti normative" (versione completa e
 * versione semplice): card della singola fonte, CSS dedicato, raccolta
 * automatica delle voci di risultato che citano ciascuna fonte. Stessa logica
 * di pdf-brand.ts: ciò che è uguale nei due documenti vive in un posto solo,
 * così non può divergere.
 */
import { calcola } from '../src/lib/tax/calcola'
import { DOMINI_ISTITUZIONALI, type Fonte } from '../src/lib/tax/fonti'
import type { Input } from '../src/lib/tax/types'
import { escapeHtml, linkFonte } from './pdf-brand'

export function tipoLabel(tipo: Fonte['tipo']): string {
  return { norma: 'Norma', prassi: 'Prassi', 'atto-locale': 'Atto locale' }[tipo]
}

/**
 * Esegue il motore sui casi sonda e raccoglie, per ogni fonte, le etichette
 * delle voci di risultato che la citano. È questo a rendere "derivata e non
 * scritta a mano" la sezione delle fonti operative.
 */
export function raccogliVociPerFonte(casi: Input[]): Map<string, Set<string>> {
  const vociPerFonte = new Map<string, Set<string>>()
  for (const input of casi) {
    const r = calcola(input)
    for (const voce of [...r.breakdown, ...r.costoAzienda.breakdown]) {
      const set = vociPerFonte.get(voce.fonte.id) ?? new Set<string>()
      // Il nome del comune finisce nell'etichetta: normalizzato, o la stessa
      // voce comparirebbe più volte al cambiare della città scelta.
      set.add(voce.label.replace(/\s*\(.*\)$/, ''))
      vociPerFonte.set(voce.fonte.id, set)
    }
  }
  return vociPerFonte
}

/**
 * Elenco dei domini istituzionali, ognuno cliccabile verso la propria homepage:
 * le chip col fondo a pillola sembrano link, quindi devono esserlo davvero.
 */
export function listaDomini(): string {
  return `<ul class="domini">
  ${DOMINI_ISTITUZIONALI.map((d) => `<li><a href="https://www.${d}/"><code>${d}</code></a></li>`).join('\n  ')}
</ul>`
}

export function scheda(f: Fonte, dettaglio: string, etichettaDettaglio: string): string {
  return `
<div class="fonte keep">
  <div class="fonte-head">
    <span class="badge">${tipoLabel(f.tipo)}</span>
    <span class="fonte-norma">${escapeHtml(f.norma)}</span>
  </div>
  <p class="fonte-desc">${escapeHtml(f.descrizione)}</p>
  <p class="fonte-uso"><span class="fonte-uso-label">${etichettaDettaglio}</span> ${escapeHtml(dettaglio)}</p>
  ${linkFonte(f.url)}
</div>`
}

export const FONTI_CSS = `
  .fonte {
    border: 0.75pt solid #e8e6dc; border-left: 2.5pt solid #dbe6bd;
    border-radius: 3pt; padding: 10pt 12pt; margin: 0 0 9pt;
  }
  .fonte-head {
    display: flex; align-items: baseline; gap: 8pt;
    margin-bottom: 5pt;
  }
  .fonte-norma { font-weight: 700; font-size: 10.4pt; }
  .fonte-desc { margin: 0 0 6pt; font-size: 9.4pt; line-height: 1.5; }
  .fonte-uso {
    margin: 0 0 6pt; font-size: 9pt; line-height: 1.5;
    color: #3f4437;
  }
  .fonte-uso-label {
    font-weight: 700; color: #33501a;
    font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em;
    margin-right: 3pt;
  }
  .fonte .url { margin: 0; }

  .domini { columns: 2; column-gap: 18pt; margin: 8pt 0 14pt; }
  .domini li { margin-bottom: 4pt; break-inside: avoid; }
  /* La chip è già l'affordance: niente sottolineatura doppia sui link. */
  .domini a { text-decoration: none; }

  .conteggio {
    display: flex; gap: 26pt; margin: 0 0 18pt;
    padding: 11pt 14pt; background: #eef3e2; border-radius: 4pt;
  }
  .conteggio div { line-height: 1.3; }
  .conteggio .n { font-size: 17pt; font-weight: 700; display: block; }
  .conteggio .l { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; color: #33501a; font-weight: 600; }
`
