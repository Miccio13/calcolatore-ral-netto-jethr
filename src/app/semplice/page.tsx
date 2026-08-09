import type { Metadata } from 'next'
import { CalculatorSemplice } from '@/components/CalculatorSemplice'

export const metadata: Metadata = {
  title: 'Calcolatore RAL → Netto — versione semplice | Jet HR',
  description:
    'Versione semplificata del calcolatore: dalla RAL al netto per il caso standard — impiegato a tempo indeterminato, Milano, nessuna agevolazione.',
}

export default function Semplice() {
  return (
    <div className="min-h-full bg-gradient-to-b from-sage to-cream">
      <CalculatorSemplice />
    </div>
  )
}
