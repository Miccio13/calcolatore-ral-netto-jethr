'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatNumero } from '@/lib/format'
import { COMUNI_2026 } from '@/lib/tax/comuni-2026'
import type { TipoContratto } from '@/lib/tax/contratto'
import { WELFARE_2026 } from '@/lib/tax/constants-2026'
import { REGIONI_2026 } from '@/lib/tax/regioni-2026'
import type { AliquotaInps, ComuneScelto, Input, Mensilita, Settore } from '@/lib/tax/types'

type Props = {
  input: Input
  onCalcola: (input: Input) => void
  /**
   * Card dei risultati, renderizzata fra il campo RAL e i parametri di
   * dettaglio: così è dentro il primo viewport al caricamento, subito sotto
   * l'unico input che conta davvero.
   */
  risultati: React.ReactNode
}

const COMUNE_PERSONALIZZATO = 'personalizzato'
const DEBOUNCE_MS = 300

/**
 * Solo cifre, senza zeri iniziali: i campi partono da "0" e digitare "3213" su
 * un campo che mostra "0" non deve produrre "03213".
 */
function soloInteri(valore: string): string {
  return valore.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
}

/** Cifre più un separatore decimale, per l'aliquota comunale personalizzata. */
function soloDecimali(valore: string): string {
  return valore.replace(/[^\d.,]/g, '').replace(/^0+(?=\d)/, '')
}

/**
 * I campi numerici tengono lo stato come stringa, non come number: solo così la
 * casella può essere davvero vuota mentre si digita. Con uno stato `number` lo
 * zero iniziale resta sempre renderizzato e digitare "3213" produce "03213".
 */
function numero(valore: string): number {
  const parsed = Number(valore.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export function InputPanel({ input, onCalcola, risultati }: Props) {
  const [ral, setRal] = useState(String(input.ral))
  const [mensilita, setMensilita] = useState<Mensilita>(input.mensilita)
  const [giorniLavorati, setGiorniLavorati] = useState(String(input.giorniLavorati))
  const [tipoContratto, setTipoContratto] = useState<TipoContratto>(input.tipoContratto)
  const [aliquotaInps, setAliquotaInps] = useState<AliquotaInps>(input.aliquotaInps)
  const [regioneId, setRegioneId] = useState(input.regioneId)
  const [comuneId, setComuneId] = useState(
    input.comune.tipo === 'preset' ? input.comune.id : COMUNE_PERSONALIZZATO,
  )
  const [comunePersonalizzatoNome, setComunePersonalizzatoNome] = useState(
    input.comune.tipo === 'personalizzato' ? input.comune.nome : '',
  )
  const [comunePersonalizzatoAliquota, setComunePersonalizzatoAliquota] = useState(
    input.comune.tipo === 'personalizzato' ? String(input.comune.aliquota * 100) : '0.8',
  )
  const [comunePersonalizzatoSoglia, setComunePersonalizzatoSoglia] = useState(
    input.comune.tipo === 'personalizzato' ? String(input.comune.soglia) : '0',
  )
  const [coniugeACarico, setConiugeACarico] = useState(input.coniugeACarico)
  const [figliACarico, setFigliACarico] = useState(String(input.figliACarico))
  const [quotaFigliACarico, setQuotaFigliACarico] = useState<50 | 100>(input.quotaFigliACarico)
  const [altriFamiliariACarico, setAltriFamiliariACarico] = useState(
    String(input.altriFamiliariACarico),
  )
  const [welfareAnnuo, setWelfareAnnuo] = useState(String(input.welfareAnnuo))
  const [settore, setSettore] = useState<Settore>(input.settore)

  const numeroFigli = numero(figliACarico)
  const welfare = numero(welfareAnnuo)
  const sogliaWelfare =
    numeroFigli > 0 ? WELFARE_2026.sogliaConFigliACarico : WELFARE_2026.sogliaGenerale

  const inputCorrente = useMemo<Input>(() => {
    const comune: ComuneScelto =
      comuneId === COMUNE_PERSONALIZZATO
        ? {
            tipo: 'personalizzato',
            nome: comunePersonalizzatoNome || 'Comune personalizzato',
            aliquota: numero(comunePersonalizzatoAliquota) / 100,
            soglia: Math.max(0, numero(comunePersonalizzatoSoglia)),
          }
        : { tipo: 'preset', id: comuneId }

    return {
      ral: numero(ral),
      mensilita,
      tipoContratto,
      aliquotaInps,
      // I clamp vivono qui, non nell'onChange: durante la digitazione il campo
      // deve poter restare vuoto senza saltare al valore di default. Vuoto vale
      // 365, non 1: azzerare i giorni azzererebbe le detrazioni e il netto
      // crollerebbe mentre l'utente sta solo riscrivendo il numero.
      giorniLavorati:
        giorniLavorati === '' ? 365 : Math.min(365, Math.max(1, numero(giorniLavorati))),
      regioneId,
      comune,
      coniugeACarico,
      figliACarico: Math.max(0, numeroFigli),
      quotaFigliACarico,
      altriFamiliariACarico: Math.max(0, numero(altriFamiliariACarico)),
      welfareAnnuo: Math.max(0, welfare),
      settore,
    }
  }, [
    ral,
    mensilita,
    tipoContratto,
    aliquotaInps,
    giorniLavorati,
    regioneId,
    comuneId,
    comunePersonalizzatoNome,
    comunePersonalizzatoAliquota,
    comunePersonalizzatoSoglia,
    coniugeACarico,
    numeroFigli,
    quotaFigliACarico,
    altriFamiliariACarico,
    welfare,
    settore,
  ])

  // Ricalcolo live con debounce: nessun bottone da premere. Il debounce evita di
  // far ripartire l'animazione dei KPI a ogni tasto sulla RAL.
  const onCalcolaRef = useRef(onCalcola)
  useEffect(() => {
    onCalcolaRef.current = onCalcola
  }, [onCalcola])

  useEffect(() => {
    // RAL vuota o zero: si mantiene l'ultimo risultato valido invece di mostrare
    // uno zero lampeggiante mentre si cancella il campo per riscriverlo.
    if (inputCorrente.ral <= 0) return
    const timer = setTimeout(() => onCalcolaRef.current(inputCorrente), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [inputCorrente])

  return (
    // Fragment, non un <form> unico: la card risultati viene renderizzata come
    // fratello fra i due blocchi, così resta figlia diretta del container di
    // pagina e il suo `sticky` copre tutto lo scroll (dentro un form si
    // sgancerebbe alla fine del form). Non c'è nulla da inviare — il ricalcolo
    // è live — quindi l'elemento form non serve.
    <>
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

      {risultati}

      <section
        aria-label="Parametri di dettaglio"
        className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-7"
      >
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
            <CampoNumero value={giorniLavorati} onChange={setGiorniLavorati} />
          </Campo>
        </Sezione>

        <Sezione titolo="Residenza fiscale">
          <Campo label="Regione">
            <select
              value={regioneId}
              onChange={(e) => {
                const nuovaRegioneId = e.target.value
                setRegioneId(nuovaRegioneId)
                // La select comune mostra solo i comuni della regione: un preset
                // fuori regione va resettato, altrimenti il browser cade sulla
                // prima option visibile mentre lo stato React resta sul vecchio
                // comune. "Altro comune" invece sopravvive a ogni regione.
                if (comuneId !== COMUNE_PERSONALIZZATO) {
                  const comuneAttuale = COMUNI_2026.find((c) => c.id === comuneId)
                  if (comuneAttuale?.regioneId !== nuovaRegioneId) {
                    const primoComune = COMUNI_2026.find((c) => c.regioneId === nuovaRegioneId)
                    setComuneId(primoComune?.id ?? COMUNE_PERSONALIZZATO)
                  }
                }
              }}
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
              {COMUNI_2026.filter((c) => c.regioneId === regioneId).map((c) => (
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
                  <CampoNumero
                    value={comunePersonalizzatoAliquota}
                    onChange={setComunePersonalizzatoAliquota}
                    decimale
                  />
                </Campo>
                <Campo label="Soglia esenzione (€)">
                  <CampoNumero
                    value={comunePersonalizzatoSoglia}
                    onChange={setComunePersonalizzatoSoglia}
                    formattaMigliaia
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
            <CampoNumero value={figliACarico} onChange={setFigliACarico} />
          </Campo>

          <Campo label="Quota detrazione figli" disabilitato={numeroFigli === 0}>
            <select
              value={quotaFigliACarico}
              onChange={(e) => setQuotaFigliACarico(Number(e.target.value) as 50 | 100)}
              disabled={numeroFigli === 0}
              className={selectClass}
            >
              <option value={100}>100% (default)</option>
              <option value={50}>50%</option>
            </select>
          </Campo>

          <Campo label="Altri familiari a carico">
            <CampoNumero value={altriFamiliariACarico} onChange={setAltriFamiliariACarico} />
          </Campo>
        </Sezione>

        <Sezione titolo="Welfare">
          <Campo label="Fringe benefit annuo (€)">
            <CampoNumero value={welfareAnnuo} onChange={setWelfareAnnuo} formattaMigliaia />
            <span className="mt-1 block text-xs text-muted">
              Esente fino a {formatNumero(sogliaWelfare)} €
              {numeroFigli > 0 ? ' (soglia raddoppiata: hai figli a carico)' : ''}.
            </span>
            {welfare > sogliaWelfare && (
              <span className="mt-1 block text-xs font-medium text-accent">
                Sopra soglia: l&apos;intero importo diventa imponibile, non solo l&apos;eccedenza.
              </span>
            )}
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
      </section>
    </>
  )
}

const selectClass =
  'w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm outline-none focus:border-ink disabled:opacity-50'

/**
 * Input numerico su `type="text"`: niente frecce spinner e, soprattutto, niente
 * incremento accidentale con la rotellina del mouse mentre si scorre la pagina.
 * Lo stato resta una stringa, quindi il campo può essere vuoto (vedi `numero`).
 */
function CampoNumero({
  value,
  onChange,
  decimale,
  formattaMigliaia,
}: {
  value: string
  onChange: (valore: string) => void
  decimale?: boolean
  formattaMigliaia?: boolean
}) {
  const visualizzato = formattaMigliaia && value ? formatNumero(numero(value)) : value

  return (
    <input
      type="text"
      inputMode={decimale ? 'decimal' : 'numeric'}
      value={visualizzato}
      onChange={(e) =>
        onChange(decimale ? soloDecimali(e.target.value) : soloInteri(e.target.value))
      }
      className={`${selectClass} tabular-nums`}
    />
  )
}

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
