import { Link } from 'react-router-dom'

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: { label: string; to: string }
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-rosver-line pb-3 sm:mb-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-rosver-ink uppercase sm:text-xl">
          {title}
        </h2>
        <span className="mt-1 block h-0.5 w-10 bg-rosver-red" aria-hidden />
        {subtitle ? (
          <p className="mt-2 max-w-xl text-sm text-rosver-muted">{subtitle}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          to={action.to}
          className="shrink-0 text-sm font-bold text-rosver-red transition hover:text-rosver-red-dark"
        >
          {action.label} →
        </Link>
      ) : null}
    </div>
  )
}
