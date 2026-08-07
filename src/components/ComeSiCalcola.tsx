'use client'

import { useState } from 'react'

export function ComeSiCalcola() {
  const [aperto, setAperto] = useState(false)

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
      <button
        type="button"
        onClick={() => setAperto((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={aperto}
      >
        <h2 className="text-lg font-semibold text-ink">Come si calcola</h2>
        <span className={`transition-transform text-xl ${aperto ? 'rotate-45' : ''}`} aria-hidden>
          +
        </span>
      </button>

      {aperto && (
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink/85">
          <div>
            <h3 className="font-semibold text-ink mb-2">Il caso standard</h3>
            <p>
              Il calcolatore assume un impiegato a tempo indeterminato, residente a Milano,
              senza familiari a carico né agevolazioni particolari, con contratto attivo
              per l&apos;intero anno d&apos;imposta 2026. È il caso descritto nel brief; ogni
              altra combinazione (part-time, contratto infra-annuale, altri redditi) esce
              dallo scope dichiarato di questo prototipo.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink mb-2">La catena di calcolo</h3>
            <p>
              Dalla RAL si sottraggono i contributi INPS a carico del dipendente, ottenendo
              l&apos;imponibile fiscale. Su questo si calcola l&apos;IRPEF lorda per scaglioni,
              ridotta dalle detrazioni per lavoro dipendente e dall&apos;ulteriore detrazione da
              cuneo fiscale. Si sottraggono poi le addizionali regionale e comunale. Infine si
              sommano — non si sottraggono — il trattamento integrativo e la somma integrativa
              da cuneo fiscale, che sono crediti erogati in busta paga, non riduzioni
              d&apos;imposta.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink mb-2">Quattro cose che i calcolatori online spesso sbagliano</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Trattamento integrativo e somma integrativa si <em>sommano</em> al netto: non
                sono trattenute, e la loro base è il reddito di lavoro dipendente, non
                l&apos;imponibile su cui gira l&apos;IRPEF.
              </li>
              <li>
                Le addizionali regionale e comunale per legge si calcolano sul reddito
                dell&apos;anno precedente e si versano in 11 rate l&apos;anno successivo. In una
                proiezione annuale come questa si semplifica assumendo lo stesso anno
                d&apos;imposta.
              </li>
              <li>
                Il netto mensile dipende dalle mensilità del CCNL (12, 13 o 14): dividere
                sempre per 12 produce un numero sbagliato.
              </li>
              <li>
                <strong>Appena sopra i 15.000 € di reddito il netto annuo può scendere pur
                salendo la RAL.</strong> Non è un bug: la detrazione lavoro dipendente salta
                da 1.955 € a circa 3.100 € (guadagno fiscale parziale, vale come sconto
                sull&apos;aliquota marginale), ma si perde interamente il trattamento
                integrativo di 1.200 € (soglia netta, non graduale). Il secondo effetto vince
                sul primo. È un effetto soglia reale e documentato della normativa italiana
                sul lavoro dipendente.
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-ink mb-2">Fuori scope, dichiarato</h3>
            <p>
              Familiari a carico, premi di risultato e welfare, fringe benefit, addizionali
              di comuni diversi da Milano, sterilizzazione delle detrazioni per redditi oltre
              200.000 €, INAIL nel costo azienda (variabile per rischio di settore), ratei di
              13ª/14ª con tassazione separata, conguaglio di fine anno, part-time e periodi
              infra-annuali, massimale contributivo per iscritti dal 1996 (122.295 € nel
              2026, rilevante solo su RAL molto alte).
            </p>
          </div>

          <p className="text-xs text-muted pt-2 border-t border-border">
            Ogni fonte citata in questa pagina è un documento istituzionale (Normattiva,
            Agenzia delle Entrate, Dipartimento delle Finanze, INPS) — mai un portale fiscale
            commerciale. Il dettaglio completo, con bibliografia e casi di validazione, è nel
            PDF metodologico linkato nel README del repository.
          </p>
        </div>
      )}
    </section>
  )
}
