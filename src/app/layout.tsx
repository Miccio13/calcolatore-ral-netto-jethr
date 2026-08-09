import type { Metadata } from 'next'
import { Wix_Madefor_Display } from 'next/font/google'
import './globals.css'

const wixMadeforDisplay = Wix_Madefor_Display({
  variable: '--font-wix-madefor',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://calcolatore-ral-netto-jethr.vercel.app/AI-builder-jethr'),
  title: 'Calcolatore RAL Netto | Jet HR',
  description:
    'Prototipo Jet HR: dalla RAL al netto annuo e mensile, con tutte le voci trattenute al lordo e le fonti normative di ogni calcolo.',
  openGraph: {
    title: 'Calcolatore RAL Netto | Jet HR',
    description:
      'Prototipo Jet HR: dalla RAL al netto annuo e mensile, con tutte le voci trattenute al lordo e le fonti normative di ogni calcolo.',
    url: 'https://www.mariglianosimone.design/AI-builder-jethr',
    siteName: 'Calcolatore RAL Netto',
    locale: 'it_IT',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it" className={`${wixMadeforDisplay.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
