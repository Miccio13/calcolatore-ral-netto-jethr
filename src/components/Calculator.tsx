'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  const { refSpazio, refCard, agganciata, altezzaEstesa } = useCardAgganciata()

  // Il fringe benefit sopra soglia genera IRPEF che finisce nelle trattenute:
  // rapportarle alla sola RAL gonfia l'aliquota. La quota imponibile del welfare è
  // la differenza fra imponibile fiscale e reddito da lavoro dipendente.
  const welfareImponibile = risultato.imponibileFiscale - risultato.redditoLavoroDipendente
  const baseAliquota = input.ral + welfareImponibile
  const aliquotaSuBase = baseAliquota > 0 ? risultato.totaleTrattenute / baseAliquota : 0

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
            Jet HR — prototipo Product Builder
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink">Calcolatore RAL → Netto</h1>
        </div>
      </header>

      {/* Lo spazio riservato alla card rende il flusso stabile, quindi in teoria
          non c'è nulla da ancorare. `[overflow-anchor:none]` è la cintura: se in
          futuro un elemento sopra il viewport cambierà altezza (un avviso che
          compare, i campi di "Altro comune"), Chrome non compenserà spostando lo
          scroll sotto le dita — il rimbalzo nasceva esattamente da lì. */}
      <div className="space-y-6 [overflow-anchor:none]">
        <InputPanel
          input={input}
          onCalcola={setInput}
          risultati={
            // Lo spazio resta occupato anche quando la card passa a `fixed`: il
            // flusso non cambia mai altezza, quindi il contenuto sotto non si
            // muove e non c'è variazione che possa innescare lo scroll anchoring.
            <div ref={refSpazio} style={altezzaEstesa ? { minHeight: altezzaEstesa } : undefined}>
              {/* Da ancorata replica esattamente il box del <main>: stesso
                  max-w-3xl e stessi px, così la card resta allineata alle altre.
                  Il max-width va sul livello che porta il padding — con
                  box-sizing: border-box lo include. */}
              <section
                className={
                  agganciata ? 'fixed inset-x-0 top-3 z-20 mx-auto max-w-3xl px-4 sm:px-6' : ''
                }
              >
                <div
                  ref={refCard}
                  className={`rounded-3xl border border-border bg-ink text-cream transition-all duration-300 motion-reduce:transition-none ${
                    // Ombra appena percettibile: serve solo a staccare la card dal
                    // contenuto che le scorre sotto. Tinta ink, non nero neutro.
                    agganciata
                      ? 'p-4 shadow-[0_10px_28px_-16px_rgba(17,21,10,0.45)]'
                      : 'p-6 sm:p-8 shadow-none'
                  }`}
                >
                  <div
                    className={`grid gap-x-4 gap-y-6 ${
                      agganciata ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'
                    }`}
                  >
                    <Kpi label="Netto annuo" compatta={agganciata}>
                      <AnimatedEuro
                        value={risultato.nettoAnnuo}
                        className={valoreClass(agganciata)}
                      />
                    </Kpi>
                    {/* Nella forma compatta le label si accorciano: a 375px su tre colonne
                "Netto mensile (13 mensilità)" andrebbe a capo tre volte. */}
                    <Kpi
                      label={
                        agganciata
                          ? 'Netto mensile'
                          : `Netto mensile (${input.mensilita} mensilità)`
                      }
                      compatta={agganciata}
                    >
                      <AnimatedEuro
                        value={risultato.nettoMensile}
                        className={valoreClass(agganciata)}
                      />
                    </Kpi>
                    <Kpi
                      label={agganciata ? 'Tasse e contributi' : 'Tasse e contributi totali'}
                      compatta={agganciata}
                    >
                      <AnimatedEuro
                        value={risultato.totaleTrattenute}
                        className={valoreClass(agganciata)}
                      />
                    </Kpi>
                  </div>
                  <p className={`mt-6 text-sm text-cream/70 ${agganciata ? 'hidden' : ''}`}>
                    Aliquota effettiva {formatPercentuale(aliquotaSuBase)}{' '}
                    {welfareImponibile > 0
                      ? `sulla base imponibile di ${formatNumero(baseAliquota)} € (RAL più fringe benefit imponibile).`
                      : `sulla RAL di ${formatNumero(input.ral)} €.`}
                  </p>
                </div>
              </section>
            </div>
          }
        />

        <Waterfall voci={risultato.breakdown} base={input.ral} />

        <CostoAziendaSection costoAzienda={risultato.costoAzienda} />

        <ComeSiCalcola />

        <footer className="text-xs text-muted text-center pt-4">
          Prototipo per anno d&apos;imposta 2026, Comune di Milano. Semplificazioni dichiarate nella
          sezione &quot;Come si calcola&quot;. Non costituisce consulenza fiscale.
        </footer>
      </div>
    </main>
  )
}

function Kpi({
  label,
  children,
  compatta,
}: {
  label: string
  children: React.ReactNode
  compatta?: boolean
}) {
  return (
    <div>
      <p className={`text-cream/60 mb-1 ${compatta ? 'text-[10px] leading-tight' : 'text-xs'}`}>
        {label}
      </p>
      {children}
    </div>
  )
}

function valoreClass(compatta: boolean): string {
  return `font-semibold tabular-nums ${compatta ? 'text-lg sm:text-xl' : 'text-3xl'}`
}

/** Corrisponde a `top-3` sulla card: l'offset a cui si aggancia davvero. */
const OFFSET_STICKY_PX = 12

/**
 * La card risultati resta ancorata in alto mentre si scorre il resto della
 * pagina; quando si ancora passa alla forma compatta per non mangiare viewport.
 *
 * Non usa `position: sticky`. Con sticky la card resta nel flusso, e passando da
 * estesa (166px) a compatta (79px) accorciava il documento: Chrome compensava con
 * lo scroll anchoring, lo scroll tornava indietro, la card si riespandeva e il
 * ciclo ripartiva — lo scroll "rimbalzava". Qui la card passa a `fixed` e un
 * wrapper ne conserva l'altezza estesa, così il flusso non cambia mai.
 *
 * `refSpazio` — il wrapper, unico elemento rimasto nel flusso: la sua distanza
 * dal bordo superiore dice quando ancorare. Avendo altezza costante non può
 * innescare il ciclo che misura sé stesso.
 * `refCard` — la card, misurata solo quando è sganciata e ferma, per sapere
 * quanto spazio riservare. Mai durante la transizione: le altezze intermedie
 * abbasserebbero il wrapper e rimetterebbero in moto il contenuto sotto, che è
 * esattamente ciò che si vuole evitare.
 *
 * Lettura del rect throttlata su requestAnimationFrame invece di
 * IntersectionObserver: con uno scroll istantaneo (ancore, cmd+↓, ripristino di
 * posizione) l'observer può non notificare il passaggio e la card resta nella
 * forma estesa mentre è già ancorata. Un getBoundingClientRect per frame, solo
 * durante lo scroll, è comunque trascurabile.
 */
function useCardAgganciata() {
  const refSpazio = useRef<HTMLDivElement>(null)
  const refCard = useRef<HTMLDivElement>(null)
  const [agganciata, setAgganciata] = useState(false)
  const [altezzaEstesa, setAltezzaEstesa] = useState<number>()
  // Specchio di `agganciata` leggibile dai listener senza doverli riagganciare
  // a ogni cambio di stato.
  const agganciataRef = useRef(agganciata)
  useEffect(() => {
    agganciataRef.current = agganciata
  }, [agganciata])

  useEffect(() => {
    let frameId = 0

    const misura = () => {
      frameId = 0
      const nodo = refSpazio.current
      if (!nodo) return
      // <= e non <: ancorata, il wrapper sta esattamente sull'offset.
      setAgganciata(nodo.getBoundingClientRect().top <= OFFSET_STICKY_PX)
    }

    const pianifica = () => {
      if (frameId) return
      frameId = requestAnimationFrame(misura)
    }

    misura()
    window.addEventListener('scroll', pianifica, { passive: true })
    window.addEventListener('resize', pianifica)
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', pianifica)
      window.removeEventListener('resize', pianifica)
    }
  }, [])

  useEffect(() => {
    const nodo = refCard.current
    if (!nodo) return

    const aggiorna = () => {
      if (agganciataRef.current) return
      setAltezzaEstesa(nodo.offsetHeight)
    }

    // Al mount la card è sganciata e già a riposo, quindi misurabile subito.
    // Poi solo a transizione conclusa: `transitionend` scatta una volta per
    // proprietà animata, ma un setState con lo stesso valore non ri-renderizza.
    aggiorna()
    nodo.addEventListener('transitionend', aggiorna)
    window.addEventListener('resize', aggiorna)
    return () => {
      nodo.removeEventListener('transitionend', aggiorna)
      window.removeEventListener('resize', aggiorna)
    }
  }, [])

  return { refSpazio, refCard, agganciata, altezzaEstesa }
}
