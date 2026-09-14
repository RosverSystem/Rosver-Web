import { useAuth } from '@/features/auth'
import { useOptionalFavorites } from '../model/favorites-store'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { Heart } from 'cssvg-icons'
import { useState } from 'react'
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

  const active = Boolean(fav?.isFavorite(productId))

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

    setBusy(true)
    try {
      const res = await fav.toggleFavorite({
        productId: /^[0-9a-f-]{36}$/i.test(productId) ? productId : undefined,
        slug,
      })
      onToggled?.(res.favorited)
      if (!quiet) {
        showSuccess([
          res.favorited ? 'Agregado a favoritos' : 'Quitado de favoritos',
        ])
      }
    } catch (err) {
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
          'bg-white/95 text-rosver-ink shadow-sm hover:text-rosver-red',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rosver-red',
          'disabled:opacity-60',
          active && 'text-rosver-red',
          className,
        )}
      >
        <Heart
          size={size}
          color="currentColor"
          strokeWidth={active ? 2.25 : 2}
        />
      </button>
    </>
  )
}
