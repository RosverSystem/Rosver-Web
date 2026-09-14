import { useAuth } from '@/features/auth'
import { useOptionalFavorites } from '../model/favorites-store'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Props = {
  productId: string
  slug?: string
  className?: string
  size?: number
  /** Si true, no muestra toasts (el padre los maneja). */
  quiet?: boolean
  onToggled?: (favorited: boolean) => void
}

/**
 * Corazón favorito: outline ink / relleno rojo sólido al guardar.
 * (cssvg Heart no soporta fill; usamos el mismo path con fill controlado.)
 */
function HeartMark({
  size,
  filled,
}: {
  size: number
  filled: boolean
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      className="block"
    >
      <path
        d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
        transform="translate(8,7.51)"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 1.75 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Botón corazón: guarda / quita favorito. Sin sesión → login.
 */
export function FavoriteButton({
  productId,
  slug,
  className,
  size = 18,
  quiet = false,
  onToggled,
}: Props) {
  const fav = useOptionalFavorites()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toasts, showSuccess, showErrors, dismiss } = useFormToasts()
  const [busy, setBusy] = useState(false)
  /** Feedback inmediato al tocar, antes de que vuelva la API. */
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const [pop, setPop] = useState(false)

  const storeActive = Boolean(
    fav?.isFavorite(productId) || (slug ? fav?.isFavorite(slug) : false),
  )
  const active = optimistic ?? storeActive

  useEffect(() => {
    setOptimistic(null)
  }, [storeActive, productId, slug])

  async function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return

    if (!user) {
      const next = `${location.pathname}${location.search}`
      navigate(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    if (!fav) return

    const nextActive = !active
    setOptimistic(nextActive)
    setPop(true)
    window.setTimeout(() => setPop(false), 220)

    setBusy(true)
    try {
      const res = await fav.toggleFavorite({
        productId: /^[0-9a-f-]{36}$/i.test(productId) ? productId : undefined,
        slug,
      })
      setOptimistic(res.favorited)
      onToggled?.(res.favorited)
      if (!quiet) {
        showSuccess([
          res.favorited ? 'Agregado a favoritos' : 'Quitado de favoritos',
        ])
      }
    } catch (err) {
      setOptimistic(null)
      if (!quiet) {
        showErrors([
          err instanceof ApiError
            ? err.message
            : 'No se pudo actualizar el favorito.',
        ])
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!quiet ? <FloatingToasts toasts={toasts} onDismiss={dismiss} /> : null}
      <button
        type="button"
        aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={active}
        disabled={busy}
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition',
          'bg-white/95 shadow-sm',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rosver-red',
          'disabled:opacity-60',
          active
            ? 'text-rosver-red hover:bg-rosver-red/10'
            : 'text-rosver-ink hover:text-rosver-red',
          pop && 'scale-110',
          className,
        )}
      >
        <HeartMark size={size} filled={active} />
      </button>
    </>
  )
}
