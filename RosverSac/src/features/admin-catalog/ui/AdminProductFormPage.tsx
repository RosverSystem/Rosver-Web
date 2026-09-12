import { CATEGORIES, PRODUCTS } from '@/features/catalog'
import { cnField } from '@/shared/lib'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { WireBlock, WireImage } from '@/shared/ui/wireframe'
import { type FormEvent, useState } from 'react'
import { useParams } from 'react-router-dom'

type FieldKey = 'name' | 'sku' | 'price'
type FieldErrors = Partial<Record<FieldKey, string>>

const inputClass =
  'rounded-lg border border-rosver-line px-3 py-2.5 text-sm outline-none focus:border-rosver-red/50'

export function AdminProductFormPage() {
  const { id } = useParams()
  const product = id ? PRODUCTS.find((p) => p.slug === id) : undefined
  const { toasts, showErrors, showSuccess, dismiss, clear } = useFormToasts()

  const [name, setName] = useState(product?.name ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [category, setCategory] = useState(
    product?.category ?? CATEGORIES[0]?.slug ?? '',
  )
  const [price, setPrice] = useState(
    product?.price != null ? String(product.price) : '',
  )
  const [origin, setOrigin] = useState(product?.origin ?? '')
  const [moq, setMoq] = useState(product?.moq != null ? String(product.moq) : '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: FieldErrors = {}
    if (!name.trim()) next.name = 'El nombre del producto es obligatorio.'
    if (!sku.trim()) next.sku = 'El SKU es obligatorio.'
    if (!price.trim()) next.price = 'Indica el precio.'
    else if (Number.isNaN(Number(price)) || Number(price) < 0) {
      next.price = 'El precio no es válido.'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, ['name', 'sku', 'price'])
      return
    }
    clear()
    showSuccess(['Producto guardado.'])
  }

  return (
    <div className="flex flex-col gap-4">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
        {product ? `Editar: ${product.name}` : 'Nuevo producto'}
      </h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <WireBlock label="Imágenes">
          <WireImage ratio="aspect-square" />
          <div className="mt-2 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <WireImage key={i} ratio="aspect-square" />
            ))}
          </div>
        </WireBlock>

        <WireBlock label="Datos básicos, precio, categoría y flags">
          <form
            noValidate
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            <input
              type="text"
              value={name}
              placeholder="Nombre del producto"
              aria-invalid={Boolean(errors.name)}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((p) => {
                  const { name: _, ...r } = p
                  return r
                })
              }}
              className={cnField(inputClass, Boolean(errors.name))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={sku}
                placeholder="SKU"
                aria-invalid={Boolean(errors.sku)}
                onChange={(e) => {
                  setSku(e.target.value)
                  setErrors((p) => {
                    const { sku: _, ...r } = p
                    return r
                  })
                }}
                className={cnField(inputClass, Boolean(errors.sku))}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="number"
                value={price}
                placeholder="Precio (S/)"
                aria-invalid={Boolean(errors.price)}
                onChange={(e) => {
                  setPrice(e.target.value)
                  setErrors((p) => {
                    const { price: _, ...r } = p
                    return r
                  })
                }}
                className={cnField(inputClass, Boolean(errors.price))}
              />
              <input
                type="text"
                value={origin}
                placeholder="Origen"
                onChange={(e) => setOrigin(e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                value={moq}
                placeholder="MOQ"
                onChange={(e) => setMoq(e.target.value)}
                className={inputClass}
              />
            </div>
            <textarea
              rows={3}
              value={description}
              placeholder="Descripción"
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-4 text-sm text-rosver-ink">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked /> Visible
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Destacado
              </label>
            </div>
            <button
              type="submit"
              className="self-start rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white"
            >
              Guardar producto
            </button>
          </form>
        </WireBlock>
      </div>
    </div>
  )
}
