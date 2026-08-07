'use client'

import { animate } from 'motion'
import { useEffect, useRef, useState } from 'react'
import { formatEuro } from '@/lib/format'

/**
 * Numero animato in euro. Anima da valore corrente a nuovo valore ogni volta che
 * `value` cambia (ricalcolo dopo "Calcola"). Nessuna dipendenza da librerie di stato
 * esterne: solo motion + useState.
 */
export function AnimatedEuro({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(value)

  useEffect(() => {
    const controls = animate(displayRef.current, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        displayRef.current = latest
        setDisplay(latest)
      },
    })
    return () => controls.stop()
  }, [value])

  return <span className={className}>{formatEuro(display)}</span>
}
