'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { formatNumero, formatPercentuale } from '@/lib/format'
import { calcola } from '@/lib/tax/calcola'
import { INPUT_DEFAULT } from '@/lib/tax/types'
import { AnimatedEuro } from './AnimatedEuro'
import { Waterfall } from './Waterfall'

/**
 * Versione semplificata del calcolatore: un solo input (la RAL), tutto il resto
 * fissato al caso standard di INPUT_DEFAULT — impiegato a tempo indeterminato,
 * CCNL terziario, 13 mensilità, residente a Milano, anno intero, nessun carico
 * familiare né fringe benefit. Il motore è lo stesso della versione completa.
 */

/**
 * Lo stato del campo è una stringa: la casella può essere davvero vuota mentre
 * si digita. Con uno stato `number` lo zero iniziale resta sempre renderizzato
 * e digitare "3213" produce "03213".
 */
function numero(valore: string): number {
  const parsed = Number(valore.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Solo cifre, senza zeri iniziali: digitare su un campo che mostra "0" non
 * deve produrre "03213".
 */
function soloInteri(valore: string): string {
  return valore.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
}

export function CalculatorSemplice() {
  const [ral, setRal] = useState(String(INPUT_DEFAULT.ral))
  const ralDigitata = numero(ral)

  // RAL vuota o zero: si mantiene l'ultimo valore valido invece di mostrare
  // uno zero lampeggiante mentre si cancella il campo per riscriverlo.
  const ultimaRalValida = useRef(INPUT_DEFAULT.ral)
  if (ralDigitata > 0) ultimaRalValida.current = ralDigitata
  const ralValida = ultimaRalValida.current

  const risultato = useMemo(() => calcola({ ...INPUT_DEFAULT, ral: ralValida }), [ralValida])

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
      <header className="mb-8 flex items-center gap-3">
        {/* next/image non applica automaticamente basePath agli SVG (serviti
            "unoptimized"): src assoluto verso questo stesso dominio, stessa
            tecnica di assetPrefix in next.config.ts, per risolvere correttamente
            sia in standalone che montato sotto /AI-builder-jethr via rewrite. */}
        <Image
          src="https://calcolatore-ral-netto-jethr.vercel.app/AI-builder-jethr/brand/jethr-pictogram.svg"
          alt=""
          width={32}
          height={32}
          className="shrink-0"
          unoptimized
        />
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            Jet HR · prototipo Product Builder
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink">
            Calcolatore RAL Netto, versione semplice
          </h1>
        </div>
      </header>

      <div className="space-y-6">
        <section
          aria-label="Retribuzione annua lorda"
          className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm"
        >
          <label htmlFor="ral" className="block text-sm font-medium text-muted mb-2">
            Retribuzione Annua Lorda (RAL)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted">
              €
            </span>
            <input
              id="ral"
              type="text"
              inputMode="numeric"
              value={ral ? formatNumero(numero(ral)) : ''}
              onChange={(e) => setRal(soloInteri(e.target.value))}
              className="w-full rounded-2xl border border-border bg-cream pl-11 pr-4 py-4 text-2xl sm:text-3xl font-semibold tabular-nums text-ink outline-none transition focus:border-ink focus:bg-surface"
              placeholder="35.000"
              aria-label="RAL in euro"
            />
          </div>
          <p className="mt-2 text-xs text-muted">I risultati si aggiornano mentre digiti.</p>
        </section>

        <section className="rounded-3xl border border-border bg-ink text-cream p-6 sm:p-8">
          <div className="grid gap-x-4 gap-y-6 grid-cols-1 sm:grid-cols-3">
            <Kpi label="Netto annuo">
              <AnimatedEuro value={risultato.nettoAnnuo} className={VALORE_CLASS} />
            </Kpi>
            <Kpi label="Netto mensile (13 mensilità)">
              <AnimatedEuro value={risultato.nettoMensile} className={VALORE_CLASS} />
            </Kpi>
            <Kpi label="Tasse e contributi totali">
              <AnimatedEuro value={risultato.totaleTrattenute} className={VALORE_CLASS} />
            </Kpi>
          </div>
          <p className="mt-6 text-sm text-cream/70">
            Aliquota effettiva {formatPercentuale(risultato.totaleTrattenute / ralValida)} sulla
            RAL di {formatNumero(ralValida)} €.
          </p>
        </section>

        <Waterfall voci={risultato.breakdown} base={ralValida} />

        <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Ipotesi del caso standard
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Questa versione calcola un unico caso: impiegato a tempo indeterminato, CCNL
            terziario con 13 mensilità, residente a Milano, in forza per l&apos;intero anno,
            senza familiari a carico né fringe benefit. Per cambiare questi parametri usa la{' '}
            <Link href="/" className="text-accent underline underline-offset-2 hover:opacity-80">
              versione completa
            </Link>
            .
          </p>
        </section>

        <footer className="text-xs text-muted text-center pt-4">
          Prototipo per anno d&apos;imposta 2026, Comune di Milano. Ipotesi dichiarate qui sopra.
          Non costituisce consulenza fiscale.
        </footer>
      </div>
    </main>
  )
}

const VALORE_CLASS = 'font-semibold tabular-nums text-3xl'

function Kpi({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-cream/60 mb-1 text-xs">{label}</p>
      {children}
    </div>
  )
}
