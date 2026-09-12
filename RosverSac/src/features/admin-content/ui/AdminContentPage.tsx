import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { useEffect, useState } from 'react'

type HeroSlide = {
  id: string
  tag?: string
  title: string
  subtitle?: string
  cta?: string
  ctaLink?: string
}

type HeroValue = { slides: HeroSlide[] }

const inputCls =
  'rounded-xl border border-rosver-line px-3 py-2 text-sm outline-none focus:border-rosver-red/40'

export function AdminContentPage() {
  const { toasts, showErrors, showSuccess, dismiss } = useFormToasts()
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api<{ value: HeroValue }>('/api/admin/content/home_hero')
      setSlides(Array.isArray(res.value?.slides) ? res.value.slides : [])
    } catch (err) {
      showErrors([
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el contenido.',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateSlide(i: number, patch: Partial<HeroSlide>) {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    )
  }

  async function save() {
    setBusy(true)
    try {
      await api('/api/admin/content/home_hero', {
        method: 'PATCH',
        body: JSON.stringify({ value: { slides } }),
      })
      showSuccess(['Contenido guardado en la base de datos.'])
    } catch (err) {
      showErrors([
        err instanceof ApiError ? err.message : 'No se pudo guardar.',
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-10">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <header>
        <p className="text-[11px] font-bold tracking-[0.18em] text-rosver-red uppercase">
          SystemRSV
        </p>
        <h1 className="font-display text-2xl font-bold text-rosver-ink">
          Contenido web
        </h1>
        <p className="mt-1 text-sm text-rosver-muted">
          Hero del inicio (persistido en Postgres)
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-rosver-muted">Cargando…</p>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.id || i}
              className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm"
            >
              <p className="mb-2 text-[11px] font-bold text-rosver-muted uppercase">
                Slide {i + 1}
              </p>
              <div className="flex flex-col gap-2">
                <input
                  value={slide.tag ?? ''}
                  onChange={(e) => updateSlide(i, { tag: e.target.value })}
                  placeholder="Etiqueta"
                  className={inputCls}
                />
                <input
                  value={slide.title}
                  onChange={(e) => updateSlide(i, { title: e.target.value })}
                  placeholder="Título"
                  className={`${inputCls} font-semibold`}
                />
                <textarea
                  value={slide.subtitle ?? ''}
                  onChange={(e) => updateSlide(i, { subtitle: e.target.value })}
                  rows={2}
                  placeholder="Subtítulo"
                  className={inputCls}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={slide.cta ?? ''}
                    onChange={(e) => updateSlide(i, { cta: e.target.value })}
                    placeholder="Texto CTA"
                    className={inputCls}
                  />
                  <input
                    value={slide.ctaLink ?? ''}
                    onChange={(e) =>
                      updateSlide(i, { ctaLink: e.target.value })
                    }
                    placeholder="Link CTA"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-xl bg-rosver-red px-5 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60"
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}
    </div>
  )
}
