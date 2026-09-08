import { cn } from '@/shared/lib'

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-rosver-soft text-rosver-muted',
  info: 'bg-rosver-blue/10 text-rosver-blue',
  success: 'bg-rosver-success/15 text-rosver-success',
  warning: 'bg-rosver-yellow/30 text-rosver-ink',
  danger: 'bg-rosver-red/10 text-rosver-red',
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone
  children: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase',
        TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  )
}
