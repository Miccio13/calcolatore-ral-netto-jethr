import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Montato anche sotto mariglianosimone.design/AI-builder-jethr via rewrite nel
  // portfolio (pattern "Next.js Multi Zones"). basePath allinea le route di
  // pagina al prefisso del rewrite. assetPrefix è la parte che conta per lo
  // stile: senza, il browser richiederebbe /_next/static/* passando dal
  // rewrite del portfolio, che per gli asset restituisce 404 (limite noto di
  // Vercel: i rewrite verso un'origine esterna non instradano bene i path
  // /_next annidati). Con assetPrefix assoluto, gli asset vengono richiesti
  // DIRETTAMENTE dal dominio di questa app, bypassando il rewrite.
  //
  // IMPORTANTE: assetPrefix e basePath NON si combinano automaticamente —
  // verificato in produzione (404 su tutti i chunk con solo il dominio bare).
  // I file sono serviti sotto /AI-builder-jethr/_next/... (basePath sposta
  // anche il file serving), quindi assetPrefix deve includere lo stesso
  // prefisso esplicitamente.
  //
  // Solo in produzione: in `next dev` un assetPrefix assoluto farebbe scaricare
  // al browser i chunk dal dominio deployato invece che da localhost, e si
  // finirebbe a testare la build online credendo di testare le modifiche locali.
  basePath: '/AI-builder-jethr',
  assetPrefix:
    process.env.NODE_ENV === 'production'
      ? 'https://calcolatore-ral-netto-jethr.vercel.app/AI-builder-jethr'
      : undefined,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
