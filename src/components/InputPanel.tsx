'use client'

import { useState } from 'react'
import { formatNumero } from '@/lib/format'
import type { AliquotaInps, Input, Mensilita, Settore } from '@/lib/tax/types'

type Props = {
  input: Input
  onCalcola: (input: Input) => void
}

export function InputPanel({ input, onCalcola }: Props) {
  const [ral, setRal] = useState(input.ral)
  const [mensilita, setMensilita] = useState<Mensilita>(input.mensilita)
  const [aliquotaInps, setAliquotaInps] = useState<AliquotaInps>(input.aliquotaInps)
  const [settore, setSettore] = useState<Settore>(input.settore)
  const [parametriAperti, setParametriAperti] = useState(false)

  function handleRalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const soloCifre = e.target.value.replace(/\D/g, '')
    setRal(soloCifre ? Number(soloCifre) : 0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (ral <= 0) return
    onCalcola({ ral, mensilita, aliquotaInps, settore })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm"
    >
      <label htmlFor="ral" className="block text-sm font-medium text-muted mb-2">
        Retribuzione Annua Lorda (RAL)
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted">
            €
          </span>
          <input
            id="ral"
            inputMode="numeric"
            value={ral ? formatNumero(ral) : ''}
            onChange={handleRalChange}
            className="w-full rounded-2xl border border-border bg-cream pl-11 pr-4 py-4 text-2xl sm:text-3xl font-semibold tabular-nums text-ink outline-none transition focus:border-ink focus:bg-surface"
            placeholder="35.000"
            aria-label="RAL in euro"
          />
        </div>
        <button
          type="submit"
          className="rounded-2xl bg-ink px-8 py-4 text-lg font-semibold text-cream transition hover:opacity-90 active:scale-[0.98]"
        >
          Calcola
        </button>
      </div>

      <button
        type="button"
        onClick={() => setParametriAperti((v) => !v)}
        className="mt-5 flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition"
        aria-expanded={parametriAperti}
      >
        <span
          className={`inline-block transition-transform ${parametriAperti ? 'rotate-90' : ''}`}
          aria-hidden
        >
          ›
        </span>
        Parametri avanzati
      </button>

      {parametriAperti && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-5">
          <Campo label="Mensilità">
            <select
              value={mensilita}
              onChange={(e) => setMensilita(Number(e.target.value) as Mensilita)}
              className="w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm outline-none focus:border-ink"
            >
              <option value={12}>12</option>
              <option value={13}>13</option>
              <option value={14}>14 (default)</option>
            </select>
          </Campo>

          <Campo label="Aliquota INPS dipendente">
            <select
              value={aliquotaInps}
              onChange={(e) => setAliquotaInps(Number(e.target.value) as AliquotaInps)}
              className="w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm outline-none focus:border-ink"
            >
              <option value={0.0919}>9,19% (default)</option>
              <option value={0.0949}>9,49% (azienda &gt;15 dip.)</option>
            </select>
          </Campo>

          <Campo label="Settore (costo azienda)">
            <select
              value={settore}
              onChange={(e) => setSettore(e.target.value as Settore)}
              className="w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm outline-none focus:border-ink"
            >
              <option value="terziario">Terziario (default)</option>
              <option value="industria">Industria</option>
            </select>
          </Campo>
        </div>
      )}
    </form>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>
      {children}
    </label>
  )
}
