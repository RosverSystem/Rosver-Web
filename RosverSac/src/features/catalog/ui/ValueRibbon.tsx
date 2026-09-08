import { Check, Compass, Phone, Verified } from 'cssvg-icons'

const RIBBON = [
  { icon: Compass, label: 'Envío nacional' },
  { icon: Verified, label: 'Importación directa' },
  { icon: Check, label: 'Calidad verificada' },
  { icon: Phone, label: 'Asesoría comercial' },
] as const

/** Cinta fina de valor (estilo landing), sin ocupar el Home con bloque grande. */
export function ValueRibbon() {
  return (
    <div className="rounded-2xl border border-rosver-line/80 bg-rosver-soft/50 px-3 py-3 sm:px-6">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {RIBBON.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center justify-center gap-2 text-center sm:justify-start sm:text-left"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-rosver-red shadow-sm">
              <Icon size={16} color="currentColor" strokeWidth={2} />
            </span>
            <span className="text-xs font-bold text-rosver-ink sm:text-[13px]">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
