import type { Metadata } from 'next'
import { Wix_Madefor_Display } from 'next/font/google'
import './globals.css'

const wixMadeforDisplay = Wix_Madefor_Display({
  variable: '--font-wix-madefor',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Calcolatore RAL → Netto | Jet HR',
  description:
    'Prototipo Jet HR: dalla RAL al netto annuo e mensile, con tutte le voci trattenute al lordo e le fonti normative di ogni calcolo.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it" className={`${wixMadeforDisplay.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
