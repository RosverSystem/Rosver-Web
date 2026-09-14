import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { AdminField, AdminInput, AdminSelect } from '@/shared/ui/admin-field'
import { AdminImageUpload } from '@/shared/ui/admin-image-upload'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { useEffect, useMemo, useState } from 'react'

type LinkType = 'none' | 'category' | 'product' | 'custom'

type HeroSlide = {
  id: string
  title: string
  badgeLeft: string
  badgeRight: string
  imageUrl: string
  linkType: LinkType
  categoryId: string | null
  subcategoryId: string | null
  productId: string | null
  customHref: string | null
  href: string | null
  visible: boolean
  sortOrder: number
}

type HeroValue = {
  ctaTitle: string
  ctaLabel: string
  autoplayMs: number
  slides: HeroSlide[]
}

type CategoryRow = {
  id: string
  name: string
  slug: string
  parentId: string | null
}

type ProductRow = {
  id: string
  name: string
  slug: string
  sku?: string | null
  categoryId?: string | null
}

function emptySlide(order: number): HeroSlide {
  return {
    id: `slide-${Date.now()}-${order}`,
    title: 'NUEVO PANEL',
    badgeLeft: 'Texto\nrojo',
    badgeRight: 'Texto\nblanco',
    imageUrl: '',
    linkType: 'none',
    categoryId: null,
    subcategoryId: null,
    productId: null,
    customHref: null,
    href: null,
    visible: true,
    sortOrder: order,
  }
}

function normalizeSlide(raw: Partial<HeroSlide>, i: number): HeroSlide {
  return {
    id: String(raw.id || `slide-${i + 1}`),
    title: String(raw.title || 'Rosver'),
    badgeLeft: String(raw.badgeLeft || 'Rosver\nSAC'),
    badgeRight: String(raw.badgeRight || 'Ver\nmás'),
    imageUrl: String(raw.imageUrl || ''),
    linkType:
      raw.linkType === 'category' ||
      raw.linkType === 'product' ||
      raw.linkType === 'custom' ||
      raw.linkType === 'none'
        ? raw.linkType
        : 'none',
    categoryId: raw.categoryId ?? null,
    subcategoryId: raw.subcategoryId ?? null,
    productId: raw.productId ?? null,
    customHref: raw.customHref ?? null,
    href: raw.href ?? null,
    visible: raw.visible !== false,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : i + 1,
  }
}

function resolveHref(
  slide: HeroSlide,
  categories: CategoryRow[],
  products: ProductRow[],
): string | null {
  if (slide.linkType === 'none') return null
  if (slide.linkType === 'custom') {
    const href = (slide.customHref || '').trim()
    return href || null
  }
  if (slide.linkType === 'product') {
    const p = products.find((x) => x.id === slide.productId)
    return p?.slug ? `/producto/${p.slug}` : null
  }
  if (slide.linkType === 'category') {
    const targetId = slide.subcategoryId || slide.categoryId
    const cat = categories.find((x) => x.id === targetId)
    return cat?.slug ? `/catalogo/${cat.slug}` : null
  }
  return null
}

export function AdminContentPage() {
  const { toasts, showErrors, showSuccess, dismiss } = useFormToasts()
  const [ctaTitle, setCtaTitle] = useState('DESPACHOS Y CATÁLOGO OFICIAL')
  const [ctaLabel, setCtaLabel] = useState('Descargar PDF')
  const [autoplayMs, setAutoplayMs] = useState(5000)
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const roots = useMemo(
    () => categories.filter((c) => !c.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  )

  async function load() {
    setLoading(true)
    try {
      const [heroRes, catRes, prodRes] = await Promise.all([
        api<{ value: HeroValue }>('/api/admin/content/home_hero'),
        api<{ categories: CategoryRow[] }>('/api/admin/categories'),
        api<{ products: ProductRow[] }>('/api/admin/products'),
      ])
      const v = heroRes.value
      setCtaTitle(v?.ctaTitle || 'DESPACHOS Y CATÁLOGO OFICIAL')
      setCtaLabel(v?.ctaLabel || 'Descargar PDF')
      setAutoplayMs(
        typeof v?.autoplayMs === 'number' && v.autoplayMs >= 0 ? v.autoplayMs : 5000,
      )
      const list = Array.isArray(v?.slides) ? v.slides : []
      setSlides(list.map((s, i) => normalizeSlide(s, i)))
      setCategories(catRes.categories ?? [])
      setProducts(prodRes.products ?? [])
    } catch (err) {
      showErrors([
        err instanceof ApiError ? err.message : 'No se pudo cargar el slider.',
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

  function moveSlide(i: number, dir: -1 | 1) {
    setSlides((prev) => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = prev.slice()
      const tmp = next[i]!
      next[i] = next[j]!
      next[j] = tmp
      return next.map((s, idx) => ({ ...s, sortOrder: idx + 1 }))
    })
  }

  function removeSlide(i: number) {
    setSlides((prev) =>
      prev
        .filter((_, idx) => idx !== i)
        .map((s, idx) => ({ ...s, sortOrder: idx + 1 })),
    )
  }

  function addSlide() {
    setSlides((prev) => [...prev, emptySlide(prev.length + 1)])
  }

  async function save() {
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i]!
      if (!s.imageUrl.trim()) {
        showErrors([`La imagen del panel ${i + 1} es obligatoria.`])
        return
      }
      if (!s.title.trim()) {
        showErrors([`El título del panel ${i + 1} es obligatorio.`])
        return
      }
      if (!s.badgeLeft.trim() || !s.badgeRight.trim()) {
        showErrors([`Completa los textos rojo y blanco del panel ${i + 1}.`])
        return
      }
      if (s.linkType === 'category' && !s.categoryId) {
        showErrors([`Elige una categoría en el panel ${i + 1}.`])
        return
      }
      if (s.linkType === 'product' && !s.productId) {
        showErrors([`Elige un producto en el panel ${i + 1}.`])
        return
      }
      if (s.linkType === 'custom' && !(s.customHref || '').trim()) {
        showErrors([`Escribe el enlace del panel ${i + 1}.`])
        return
      }
    }

    setBusy(true)
    try {
      const payload: HeroValue = {
        ctaTitle: ctaTitle.trim() || 'DESPACHOS Y CATÁLOGO OFICIAL',
        ctaLabel: ctaLabel.trim() || 'Descargar PDF',
        autoplayMs: Math.max(0, Math.min(60_000, Math.round(autoplayMs) || 0)),
        slides: slides.map((s, i) => ({
          ...s,
          title: s.title.trim(),
          badgeLeft: s.badgeLeft.trim(),
          badgeRight: s.badgeRight.trim(),
          imageUrl: s.imageUrl.trim(),
          customHref: s.customHref?.trim() || null,
          href: resolveHref(s, categories, products),
          sortOrder: i + 1,
          categoryId: s.linkType === 'category' ? s.categoryId : null,
          subcategoryId: s.linkType === 'category' ? s.subcategoryId : null,
          productId: s.linkType === 'product' ? s.productId : null,
        })),
      }
      await api('/api/admin/content/home_hero', {
        method: 'PATCH',
        body: JSON.stringify({ value: payload }),
      })
      showSuccess(['Slider guardado. Ya se ve en el inicio.'])
      await load()
    } catch (err) {
      showErrors([
        err instanceof ApiError ? err.message : 'No se pudo guardar el slider.',
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-10">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <header>
        <p className="text-[11px] font-bold tracking-[0.18em] text-rosver-red uppercase">
          SystemRSV
        </p>
        <h1 className="font-display text-2xl font-bold text-rosver-ink">Slider</h1>
        <p className="mt-1 text-sm text-rosver-muted">
          Paneles del inicio: imagen, textos y enlace a categoría, subcategoría o
          producto.
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
          <section className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm">
            <p className="mb-3 text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
              Panel oscuro (PDF)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Título del panel" htmlFor="cta-title">
                <AdminInput
                  id="cta-title"
                  value={ctaTitle}
                  onChange={(e) => setCtaTitle(e.target.value)}
                  placeholder="DESPACHOS Y CATÁLOGO OFICIAL"
                />
              </AdminField>
              <AdminField label="Texto del botón PDF" htmlFor="cta-label">
                <AdminInput
                  id="cta-label"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Descargar PDF"
                />
              </AdminField>
              <AdminField
                label="Giro automático (ms)"
                htmlFor="autoplay-ms"
                className="sm:col-span-2"
              >
                <AdminInput
                  id="autoplay-ms"
                  type="number"
                  min={0}
                  max={60000}
                  step={500}
                  value={autoplayMs}
                  onChange={(e) => setAutoplayMs(Number(e.target.value) || 0)}
                  placeholder="5000 (0 = apagado)"
                />
              </AdminField>
            </div>
            <p className="mt-2 text-xs text-rosver-muted">
              5000 = cada 5 segundos. Pon 0 para que solo gire con las flechas.
            </p>
          </section>

          {slides.map((slide, i) => {
            const children = categories
              .filter((c) => c.parentId === slide.categoryId)
              .sort((a, b) => a.name.localeCompare(b.name))
            const productOptions = products
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))

            return (
              <div
                key={slide.id}
                className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
                    Panel {i + 1}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveSlide(i, -1)}
                      disabled={i === 0}
                      className="h-8 rounded-lg border border-rosver-line px-2.5 text-xs font-semibold text-rosver-ink disabled:opacity-40"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(i, 1)}
                      disabled={i === slides.length - 1}
                      className="h-8 rounded-lg border border-rosver-line px-2.5 text-xs font-semibold text-rosver-ink disabled:opacity-40"
                    >
                      Bajar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(i)}
                      className="h-8 rounded-lg border border-rosver-red/30 px-2.5 text-xs font-semibold text-rosver-red"
                    >
                      Quitar
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <AdminImageUpload
                    folder="slider"
                    value={slide.imageUrl}
                    onChange={(url) => updateSlide(i, { imageUrl: url })}
                    onError={(msg) => showErrors([msg])}
                    label="Foto del panel"
                  />

                  <AdminField label="Título blanco" htmlFor={`title-${i}`}>
                    <AdminInput
                      id={`title-${i}`}
                      value={slide.title}
                      onChange={(e) => updateSlide(i, { title: e.target.value })}
                      placeholder="CATÁLOGO DIGITAL 2026"
                      className="font-semibold uppercase"
                    />
                  </AdminField>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <AdminField label="Texto rojo (pill)" htmlFor={`badge-l-${i}`}>
                      <textarea
                        id={`badge-l-${i}`}
                        value={slide.badgeLeft}
                        onChange={(e) =>
                          updateSlide(i, { badgeLeft: e.target.value })
                        }
                        rows={2}
                        placeholder={'Hoy mismo\nDespacho diario'}
                        className="w-full rounded-xl border border-rosver-line bg-white px-3 py-2 text-sm outline-none focus:border-rosver-red/40"
                      />
                    </AdminField>
                    <AdminField label="Texto blanco (pill)" htmlFor={`badge-r-${i}`}>
                      <textarea
                        id={`badge-r-${i}`}
                        value={slide.badgeRight}
                        onChange={(e) =>
                          updateSlide(i, { badgeRight: e.target.value })
                        }
                        rows={2}
                        placeholder={'A todo\nel Perú'}
                        className="w-full rounded-xl border border-rosver-line bg-white px-3 py-2 text-sm outline-none focus:border-rosver-red/40"
                      />
                    </AdminField>
                  </div>

                  <AdminField label="Vincular a" htmlFor={`link-${i}`}>
                    <AdminSelect
                      id={`link-${i}`}
                      value={slide.linkType}
                      onChange={(e) => {
                        const linkType = e.target.value as LinkType
                        updateSlide(i, {
                          linkType,
                          categoryId:
                            linkType === 'category' ? slide.categoryId : null,
                          subcategoryId:
                            linkType === 'category' ? slide.subcategoryId : null,
                          productId: linkType === 'product' ? slide.productId : null,
                          customHref:
                            linkType === 'custom' ? slide.customHref : null,
                        })
                      }}
                    >
                      <option value="none">Sin enlace</option>
                      <option value="category">Categoría / subcategoría</option>
                      <option value="product">Producto</option>
                      <option value="custom">Enlace personalizado</option>
                    </AdminSelect>
                  </AdminField>

                  {slide.linkType === 'category' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AdminField label="Categoría" htmlFor={`cat-${i}`}>
                        <AdminSelect
                          id={`cat-${i}`}
                          value={slide.categoryId ?? ''}
                          onChange={(e) =>
                            updateSlide(i, {
                              categoryId: e.target.value || null,
                              subcategoryId: null,
                            })
                          }
                        >
                          <option value="">Elegir categoría…</option>
                          {roots.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </AdminSelect>
                      </AdminField>
                      <AdminField
                        label="Subcategoría (opcional)"
                        htmlFor={`sub-${i}`}
                      >
                        <AdminSelect
                          id={`sub-${i}`}
                          value={slide.subcategoryId ?? ''}
                          disabled={!slide.categoryId || children.length === 0}
                          onChange={(e) =>
                            updateSlide(i, {
                              subcategoryId: e.target.value || null,
                            })
                          }
                        >
                          <option value="">Toda la categoría</option>
                          {children.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </AdminSelect>
                      </AdminField>
                    </div>
                  ) : null}

                  {slide.linkType === 'product' ? (
                    <AdminField label="Producto" htmlFor={`prod-${i}`}>
                      <AdminSelect
                        id={`prod-${i}`}
                        value={slide.productId ?? ''}
                        onChange={(e) =>
                          updateSlide(i, { productId: e.target.value || null })
                        }
                      >
                        <option value="">Elegir producto…</option>
                        {productOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.sku ? ` (${p.sku})` : ''}
                          </option>
                        ))}
                      </AdminSelect>
                    </AdminField>
                  ) : null}

                  {slide.linkType === 'custom' ? (
                    <AdminField label="Enlace" htmlFor={`href-${i}`}>
                      <AdminInput
                        id={`href-${i}`}
                        value={slide.customHref ?? ''}
                        onChange={(e) =>
                          updateSlide(i, { customHref: e.target.value })
                        }
                        placeholder="/catalogo o /contacto"
                      />
                    </AdminField>
                  ) : null}

                  <label className="flex items-center gap-2 text-sm text-rosver-ink">
                    <input
                      type="checkbox"
                      checked={slide.visible}
                      onChange={(e) =>
                        updateSlide(i, { visible: e.target.checked })
                      }
                      className="size-4 rounded border-rosver-line text-rosver-red"
                    />
                    Visible en el inicio
                  </label>
                </div>
              </div>
            )
          })}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addSlide}
              className="rounded-xl border border-rosver-line bg-white px-4 py-2.5 text-sm font-bold text-rosver-ink hover:bg-rosver-soft"
            >
              Agregar panel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-rosver-red px-5 py-2.5 text-sm font-bold text-white hover:bg-rosver-red-dark disabled:opacity-60"
            >
              {busy ? 'Guardando…' : 'Guardar slider'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
