import { api, ApiError } from '@/shared/lib/api'
import { cn, cnField } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { useEffect, useState } from 'react'

type Brand = {
  id: string
  code: number
  sku: string
  name: string
  slug: string
  visible: boolean
}

export function AdminBrandsPage() {
  const { toasts, showMessages, dismiss, clear } = useFormToasts()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await api<{ brands: Brand[] }>('/api/admin/brands')
      setBrands(data.brands)
    } catch (e) {
      showMessages([
        e instanceof ApiError ? e.message : 'No se pudieron cargar marcas',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clear()
    const errors: string[] = []
    if (!name.trim()) errors.push('Nombre de marca obligatorio')
    if (!sku.trim()) errors.push('SKU de marca obligatorio')
    if (errors.length) {
      showMessages(errors)
      return
    }
    setBusy(true)
    try {
      await api('/api/admin/brands', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), sku: sku.trim() }),
      })
      setName('')
      setSku('')
      await load()
    } catch (err) {
      showMessages([
        err instanceof ApiError ? err.message : 'No se pudo crear la marca',
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-rosver-ink">Marcas</h2>
        <p className="mt-1 text-sm text-rosver-muted">
          Código interno auto-incremental + SKU personalizado de la empresa.
        </p>
      </header>

      <form
        noValidate
        onSubmit={onSubmit}
        className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre (ej. Rosver Tools)"
            className={cnField(
              'h-11 rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 text-sm outline-none focus:border-rosver-red/40 focus:ring-2 focus:ring-rosver-red/15',
              false,
            )}
            aria-invalid={false}
          />
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU marca"
            className={cnField(
              'h-11 rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 text-sm uppercase outline-none focus:border-rosver-red/40 focus:ring-2 focus:ring-rosver-red/15',
              false,
            )}
          />
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-xl bg-rosver-red px-4 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-60"
          >
            {busy ? 'Guardando…' : 'Crear marca'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-rosver-line bg-rosver-soft/50 text-xs uppercase tracking-wide text-rosver-muted">
            <tr>
              <th className="px-4 py-3">Cód.</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Visible</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-rosver-muted">
                  Cargando…
                </td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-rosver-muted">
                  Sin marcas aún. Crea la primera.
                </td>
              </tr>
            ) : (
              brands.map((b) => (
                <tr key={b.id} className="border-b border-rosver-line last:border-0">
                  <td className="px-4 py-3 tabular-nums text-rosver-muted">{b.code}</td>
                  <td className="px-4 py-3 font-semibold text-rosver-ink">{b.sku}</td>
                  <td className="px-4 py-3 text-rosver-ink">{b.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        b.visible
                          ? 'bg-rosver-success/15 text-rosver-success'
                          : 'bg-rosver-soft text-rosver-muted',
                      )}
                    >
                      {b.visible ? 'Sí' : 'No'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
