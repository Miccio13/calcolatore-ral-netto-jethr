import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Montato anche sotto mariglianosimone.design/AI-builder-jethr via rewrite nel
  // portfolio (pattern "Next.js Multi Zones"): senza basePath, gli asset /_next/*
  // vengono richiesti dal dominio del portfolio invece che da questa app, e la
  // pagina appare senza stile. Con basePath, sia il deploy standalone
  // (calcolatore-ral-netto-jethr.vercel.app/AI-builder-jethr) sia il rewrite
  // risolvono gli asset correttamente sotto lo stesso prefisso.
  basePath: '/AI-builder-jethr',
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
