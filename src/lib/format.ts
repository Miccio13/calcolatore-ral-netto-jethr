/**
 * Formattazione numerica scritta a mano, senza Intl.NumberFormat.
 *
 * Motivo: Intl.NumberFormat('it-IT', ...) dipende dai dati ICU installati nel
 * runtime. Il Node del server (SSR) e il motore JS del browser (idratazione client)
 * possono avere build ICU diverse — nel nostro caso il server formattava "1,855 €"
 * (virgola, fallback ICU limitato) mentre il client formattava "1.855 €" o "1855 €"
 * a seconda del browser, causando un mismatch di idratazione React. Una funzione
 * deterministica, senza dipendenze esterne, produce lo stesso output ovunque.
 */

function raggruppaMigliaia(cifre: string): string {
  return cifre.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formattaNumero(valore: number, decimali: number): string {
  const segno = valore < 0 ? '-' : ''
  const arrotondato = Math.abs(valore).toFixed(decimali)
  const [parteIntera, parteDecimale] = arrotondato.split('.')
  const interaRaggruppata = raggruppaMigliaia(parteIntera)
  return parteDecimale
    ? `${segno}${interaRaggruppata},${parteDecimale}`
    : `${segno}${interaRaggruppata}`
}

export function formatEuro(valore: number): string {
  return `${formattaNumero(valore, 0)} €`
}

export function formatEuroPreciso(valore: number): string {
  return `${formattaNumero(valore, 2)} €`
}

export function formatPercentuale(valore: number): string {
  return `${formattaNumero(valore * 100, 1)}%`
}

export function formatNumero(valore: number): string {
  return formattaNumero(valore, 0)
}
