import type { Metadata } from 'next'
import { Wix_Madefor_Display } from 'next/font/google'
import './globals.css'

const wixMadeforDisplay = Wix_Madefor_Display({
  variable: '--font-wix-madefor',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  // Il dominio Vercel ha la bot protection (Security Checkpoint) che può
  // rispondere 403 agli scraper social: l'og.png passa dal portfolio, che
  // serve l'asset via rewrite senza challenge ed è lo stesso dominio di og:url.
  metadataBase: new URL('https://www.mariglianosimone.design/AI-builder-jethr'),
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
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Calcolatore RAL Netto, prototipo Jet HR in una finestra del browser',
      },
    ],
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
