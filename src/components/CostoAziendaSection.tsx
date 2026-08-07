import { formatEuroPreciso, formatPercentuale } from '@/lib/format'
import type { CostoAzienda } from '@/lib/tax/types'
import { Waterfall } from './Waterfall'

export function CostoAziendaSection({ costoAzienda }: { costoAzienda: CostoAzienda }) {
  return (
    <section className="rounded-3xl border border-border bg-sage-soft p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-ink mb-1">Costo azienda</h2>
      <p className="text-sm text-muted mb-6">
        Quanto costa questo dipendente all&apos;azienda, oltre la RAL: contributi a carico
        del datore di lavoro e TFR accantonato.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-surface border border-border p-5">
          <p className="text-xs text-muted mb-1">Costo azienda totale</p>
          <p className="text-2xl font-semibold text-ink tabular-nums">
            {formatEuroPreciso(costoAzienda.totale)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface border border-border p-5">
          <p className="text-xs text-muted mb-1">Cuneo fiscale complessivo</p>
          <p className="text-2xl font-semibold text-ink tabular-nums">
            {formatPercentuale(costoAzienda.cuneoPercentuale)}
          </p>
        </div>
      </div>

      <Waterfall voci={costoAzienda.breakdown} base={costoAzienda.ral} />
    </section>
  )
}
