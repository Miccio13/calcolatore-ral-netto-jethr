'use client'

import { useState } from 'react'
import { formatNumero } from '@/lib/format'
import { COMUNI_2026 } from '@/lib/tax/comuni-2026'
import type { TipoContratto } from '@/lib/tax/contratto'
import { REGIONI_2026 } from '@/lib/tax/regioni-2026'
import type { AliquotaInps, ComuneScelto, Input, Mensilita, Settore } from '@/lib/tax/types'

type Props = {
  input: Input
  onCalcola: (input: Input) => void
}

const COMUNE_PERSONALIZZATO = 'personalizzato'

export function InputPanel({ input, onCalcola }: Props) {
  const [ral, setRal] = useState(input.ral)
  const [mensilita, setMensilita] = useState<Mensilita>(input.mensilita)
  const [giorniLavorati, setGiorniLavorati] = useState(input.giorniLavorati)
  const [tipoContratto, setTipoContratto] = useState<TipoContratto>(input.tipoContratto)
  const [aliquotaInps, setAliquotaInps] = useState<AliquotaInps>(input.aliquotaInps)
  const [regioneId, setRegioneId] = useState(input.regioneId)
  const [comuneId, setComuneId] = useState(
    input.comune.tipo === 'preset' ? input.comune.id : COMUNE_PERSONALIZZATO
  )
  const [comunePersonalizzatoNome, setComunePersonalizzatoNome] = useState(
    input.comune.tipo === 'personalizzato' ? input.comune.nome : ''
  )
  const [comunePersonalizzatoAliquota, setComunePersonalizzatoAliquota] = useState(
    input.comune.tipo === 'personalizzato' ? input.comune.aliquota * 100 : 0.8
  )
  const [comunePersonalizzatoSoglia, setComunePersonalizzatoSoglia] = useState(
    input.comune.tipo === 'personalizzato' ? input.comune.soglia : 0
  )
  const [coniugeACarico, setConiugeACarico] = useState(input.coniugeACarico)
  const [figliACarico, setFigliACarico] = useState(input.figliACarico)
  const [quotaFigliACarico, setQuotaFigliACarico] = useState<50 | 100>(input.quotaFigliACarico)
  const [altriFamiliariACarico, setAltriFamiliariACarico] = useState(input.altriFamiliariACarico)
  const [welfareAnnuo, setWelfareAnnuo] = useState(input.welfareAnnuo)
  const [settore, setSettore] = useState<Settore>(input.settore)

  function handleRalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const soloCifre = e.target.value.replace(/\D/g, '')
    setRal(soloCifre ? Number(soloCifre) : 0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (ral <= 0) return

    const comune: ComuneScelto =
      comuneId === COMUNE_PERSONALIZZATO
        ? {
            tipo: 'personalizzato',
            nome: comunePersonalizzatoNome || 'Comune personalizzato',
            aliquota: comunePersonalizzatoAliquota / 100,
            soglia: comunePersonalizzatoSoglia,
          }
        : { tipo: 'preset', id: comuneId }

    onCalcola({
      ral,
      mensilita,
      tipoContratto,
      aliquotaInps,
      giorniLavorati: Math.min(365, Math.max(1, giorniLavorati)),
      regioneId,
      comune,
      coniugeACarico,
      figliACarico: Math.max(0, figliACarico),
      quotaFigliACarico,
      altriFamiliariACarico: Math.max(0, altriFamiliariACarico),
      welfareAnnuo: Math.max(0, welfareAnnuo),
      settore,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-7"
    >
      <div>
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
      </div>

      <Sezione titolo="Situazione lavorativa">
        <Campo label="Tipo di contratto">
          <select
            value={tipoContratto}
            onChange={(e) => setTipoContratto(e.target.value as TipoContratto)}
            className={selectClass}
          >
            <option value="standard">Tempo indeterminato (default)</option>
            <option value="apprendistato">Apprendistato</option>
          </select>
        </Campo>

        <Campo label="Aliquota INPS dipendente" disabilitato={tipoContratto === 'apprendistato'}>
          <select
            value={aliquotaInps}
            onChange={(e) => setAliquotaInps(Number(e.target.value) as AliquotaInps)}
            disabled={tipoContratto === 'apprendistato'}
            className={selectClass}
          >
            <option value={0.0919}>9,19% (default)</option>
            <option value={0.0949}>9,49% (azienda &gt;15 dip.)</option>
          </select>
          {tipoContratto === 'apprendistato' && (
            <span className="mt-1 block text-xs text-muted">
              Sostituita da 5,84% flat, propria dell&apos;apprendistato
            </span>
          )}
        </Campo>

        <Campo label="Mensilità">
          <select
            value={mensilita}
            onChange={(e) => setMensilita(Number(e.target.value) as Mensilita)}
            className={selectClass}
          >
            <option value={12}>12</option>
            <option value={13}>13 (default)</option>
            <option value={14}>14</option>
          </select>
        </Campo>

        <Campo label="Giorni lavorati nell'anno">
          <input
            type="number"
            min={1}
            max={365}
            value={giorniLavorati}
            onChange={(e) => setGiorniLavorati(Number(e.target.value) || 365)}
            className={selectClass}
          />
        </Campo>
      </Sezione>

      <Sezione titolo="Residenza fiscale">
        <Campo label="Regione">
          <select
            value={regioneId}
            onChange={(e) => setRegioneId(e.target.value)}
            className={selectClass}
          >
            {REGIONI_2026.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
                {r.id === 'lombardia' ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Comune">
          <select
            value={comuneId}
            onChange={(e) => setComuneId(e.target.value)}
            className={selectClass}
          >
            {COMUNI_2026.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.id === 'milano' ? ' (default)' : ''}
              </option>
            ))}
            <option value={COMUNE_PERSONALIZZATO}>Altro comune (inserisci aliquota)</option>
          </select>
          <span className="mt-1 block text-xs text-muted">
            Copertura su 11 capoluoghi verificati singolarmente; per gli altri comuni usa
            &quot;Altro comune&quot;.
          </span>
        </Campo>

        {comuneId === COMUNE_PERSONALIZZATO && (
          <>
            <Campo label="Nome comune">
              <input
                type="text"
                value={comunePersonalizzatoNome}
                onChange={(e) => setComunePersonalizzatoNome(e.target.value)}
                placeholder="Es. Bergamo"
                className={selectClass}
              />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Aliquota comunale (%)">
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={comunePersonalizzatoAliquota}
                  onChange={(e) => setComunePersonalizzatoAliquota(Number(e.target.value) || 0)}
                  className={selectClass}
                />
              </Campo>
              <Campo label="Soglia esenzione (€)">
                <input
                  type="number"
                  min={0}
                  value={comunePersonalizzatoSoglia}
                  onChange={(e) => setComunePersonalizzatoSoglia(Number(e.target.value) || 0)}
                  className={selectClass}
                />
              </Campo>
            </div>
          </>
        )}
      </Sezione>

      <Sezione titolo="Famiglia">
        <Campo label="Coniuge a carico">
          <select
            value={coniugeACarico ? 'si' : 'no'}
            onChange={(e) => setConiugeACarico(e.target.value === 'si')}
            className={selectClass}
          >
            <option value="no">No (default)</option>
            <option value="si">Sì</option>
          </select>
        </Campo>

        <Campo label="Figli 21-30 non disabili a carico">
          <input
            type="number"
            min={0}
            value={figliACarico}
            onChange={(e) => setFigliACarico(Number(e.target.value) || 0)}
            className={selectClass}
          />
        </Campo>

        <Campo label="Quota detrazione figli" disabilitato={figliACarico === 0}>
          <select
            value={quotaFigliACarico}
            onChange={(e) => setQuotaFigliACarico(Number(e.target.value) as 50 | 100)}
            disabled={figliACarico === 0}
            className={selectClass}
          >
            <option value={100}>100% (default)</option>
            <option value={50}>50%</option>
          </select>
        </Campo>

        <Campo label="Altri familiari a carico">
          <input
            type="number"
            min={0}
            value={altriFamiliariACarico}
            onChange={(e) => setAltriFamiliariACarico(Number(e.target.value) || 0)}
            className={selectClass}
          />
        </Campo>
      </Sezione>

      <Sezione titolo="Welfare">
        <Campo label="Fringe benefit annuo (€)">
          <input
            type="number"
            min={0}
            value={welfareAnnuo}
            onChange={(e) => setWelfareAnnuo(Number(e.target.value) || 0)}
            className={selectClass}
          />
          <span className="mt-1 block text-xs text-muted">
            Esente fino a 1.000 € (2.000 € con figli a carico); oltre soglia l&apos;intero
            importo diventa imponibile.
          </span>
        </Campo>
      </Sezione>

      <details className="border-t border-border pt-4">
        <summary className="cursor-pointer text-sm font-medium text-muted hover:text-ink transition">
          Settore (solo per il costo azienda, non incide sul netto)
        </summary>
        <div className="mt-3 max-w-xs">
          <Campo label="Settore">
            <select
              value={settore}
              onChange={(e) => setSettore(e.target.value as Settore)}
              className={selectClass}
            >
              <option value="terziario">Terziario (default)</option>
              <option value="industria">Industria</option>
            </select>
          </Campo>
        </div>
      </details>
    </form>
  )
}

const selectClass =
  'w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm outline-none focus:border-ink disabled:opacity-50'

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">{titolo}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Campo({
  label,
  children,
  disabilitato,
}: {
  label: string
  children: React.ReactNode
  disabilitato?: boolean
}) {
  return (
    <label className={`block ${disabilitato ? 'opacity-60' : ''}`}>
      <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>
      {children}
    </label>
  )
}
