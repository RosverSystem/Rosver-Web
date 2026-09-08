import { cn } from '@/shared/lib'
import type { ReactNode } from 'react'

type Tone = 'primary' | 'secondary' | 'neutral' | 'chrome'

const TONE_BOX: Record<Tone, string> = {
  primary: 'border-rosver-red/60 bg-red-50/70',
  secondary: 'border-emerald-600/50 bg-emerald-50/70',
  neutral: 'border-rosver-line bg-rosver-soft/70',
  chrome: 'border-rosver-line bg-white',
}

const TONE_LABEL: Record<Tone, string> = {
  primary: 'text-rosver-red',
  secondary: 'text-emerald-700',
  neutral: 'text-rosver-muted',
  chrome: 'text-rosver-muted',
}

/**
 * Placeholder de bloque para la fase visual: marca qué representa cada
 * sección (CTA primario/secundario, contenido, chrome) mientras el diseño
 * final no está listo. Ver docs/architecture/05-estructura-informacion-y-captacion.md.
 */
export function WireBlock({
  label,
  tone = 'neutral',
  className,
  children,
}: {
  label?: string
  tone?: Tone
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-dashed p-4 sm:p-5',
        TONE_BOX[tone],
        className,
      )}
    >
      {label ? (
        <p
          className={cn(
            'mb-3 text-[10px] font-bold tracking-widest uppercase',
            TONE_LABEL[tone],
          )}
        >
          {label}
        </p>
      ) : null}
      {children}
    </div>
  )
}

export function WireImage({
  ratio = 'aspect-[4/3]',
  className,
}: {
  ratio?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        ratio,
        'rounded-xl border border-dashed border-rosver-line bg-rosver-soft',
        className,
      )}
      aria-hidden
    />
  )
}

export function WireLine({
  width = 'w-full',
  className,
}: {
  width?: string
  className?: string
}) {
  return (
    <div
      className={cn('h-2 rounded-full bg-rosver-soft', width, className)}
      aria-hidden
    />
  )
}
