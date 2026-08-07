'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { formatNumero, formatPercentuale } from '@/lib/format'
import { calcola } from '@/lib/tax/calcola'
import { INPUT_DEFAULT } from '@/lib/tax/types'
import type { Input } from '@/lib/tax/types'
import { AnimatedEuro } from './AnimatedEuro'
import { ComeSiCalcola } from './ComeSiCalcola'
import { CostoAziendaSection } from './CostoAziendaSection'
import { InputPanel } from './InputPanel'
import { Waterfall } from './Waterfall'

export function Calculator() {
  const [input, setInput] = useState<Input>(INPUT_DEFAULT)
  const risultato = useMemo(() => calcola(input), [input])

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
      <header className="mb-8 flex items-center gap-3">
        <Image
          src="/brand/jethr-pictogram.svg"
          alt=""
          width={32}
          height={32}
          className="shrink-0"
        />
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            Jet HR — prototipo Product Builder
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink">
            Calcolatore RAL → Netto
          </h1>
        </div>
      </header>

      <div className="space-y-6">
        <InputPanel input={input} onCalcola={setInput} />

        <section className="rounded-3xl border border-border bg-ink p-6 sm:p-8 text-cream">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Kpi label="Netto annuo">
              <AnimatedEuro value={risultato.nettoAnnuo} className="text-3xl font-semibold tabular-nums" />
            </Kpi>
            <Kpi label={`Netto mensile (${input.mensilita} mensilità)`}>
              <AnimatedEuro value={risultato.nettoMensile} className="text-3xl font-semibold tabular-nums" />
            </Kpi>
            <Kpi label="Tasse e contributi totali">
              <AnimatedEuro
                value={risultato.totaleTrattenute}
                className="text-3xl font-semibold tabular-nums"
              />
            </Kpi>
          </div>
          <p className="mt-6 text-sm text-cream/70">
            Aliquota effettiva {formatPercentuale(risultato.aliquotaEffettiva)} sulla RAL di{' '}
            {formatNumero(input.ral)} €.
          </p>
        </section>

        <Waterfall voci={risultato.breakdown} base={input.ral} />

        <CostoAziendaSection costoAzienda={risultato.costoAzienda} />

        <ComeSiCalcola />

        <footer className="text-xs text-muted text-center pt-4">
          Prototipo per anno d&apos;imposta 2026, Comune di Milano. Semplificazioni dichiarate
          nella sezione &quot;Come si calcola&quot;. Non costituisce consulenza fiscale.
        </footer>
      </div>
    </main>
  )
}

function Kpi({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-cream/60 mb-1">{label}</p>
      {children}
    </div>
  )
}
