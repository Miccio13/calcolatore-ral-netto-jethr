'use client'

import { useState } from 'react'
import { formatEuroPreciso, formatPercentuale } from '@/lib/format'
import type { VoceBreakdown } from '@/lib/tax/types'

export function Waterfall({ voci, base }: { voci: VoceBreakdown[]; base: number }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wide px-2 mb-3">
        Tutte le voci trattenute e aggiunte al lordo
      </h3>
      <ul className="divide-y divide-border">
        {voci.map((voce) => (
          <WaterfallRow key={voce.id} voce={voce} base={base} />
        ))}
      </ul>
    </div>
  )
}

function WaterfallRow({ voce, base }: { voce: VoceBreakdown; base: number }) {
  const [aperto, setAperto] = useState(false)
  const larghezzaBarra = Math.min(100, (voce.importo / base) * 100)
  const isAggiunta = voce.segno === 'aggiunta'

  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => setAperto((v) => !v)}
        className="w-full text-left px-2 py-1 rounded-xl transition hover:bg-cream"
        aria-expanded={aperto}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm sm:text-base font-medium text-ink">{voce.label}</span>
          <span
            className={`text-sm sm:text-base font-semibold tabular-nums ${isAggiunta ? 'text-accent' : 'text-ink'}`}
          >
            {isAggiunta ? '+' : '−'}
            {formatEuroPreciso(voce.importo)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-cream overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isAggiunta ? 'bg-accent' : 'bg-ink'}`}
              style={{ width: `${larghezzaBarra}%` }}
            />
          </div>
          <span className="text-xs text-muted tabular-nums w-12 text-right">
            {formatPercentuale(voce.importo / base)}
          </span>
        </div>
      </button>

      {aperto && (
        <div className="mt-3 mx-2 rounded-2xl bg-cream p-4 text-sm text-muted space-y-2">
          <p className="font-mono text-xs text-ink/70 break-words">{voce.formula}</p>
          <p>
            <span className="font-medium text-ink">{voce.fonte.norma}</span> — {voce.fonte.descrizione}
          </p>
          <a
            href={voce.fonte.url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-accent underline underline-offset-2 hover:opacity-80"
          >
            Consulta la fonte ↗
          </a>
        </div>
      )}
    </li>
  )
}
