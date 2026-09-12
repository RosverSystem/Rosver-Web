import { useCatalog, type Product } from '@/features/catalog'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { ProductImagePlaceholder } from '@/shared/ui/product-image-placeholder'
import { cn } from '@/shared/lib'
import { attachNestedScrollWheel } from '@/shared/lib/nested-scroll-wheel'
import {
  ArrowRight,
  Clock,
  Message,
  Phone,
  Plus,
  Search,
  Trash,
} from 'cssvg-icons'
import { motion } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../model/cart-store'
import { addInputFromProduct, unitPriceOfLine } from '../model/cart-line'
import { type CartLine, isComboLine } from '../model/mocks'
import { ContinueOrderModal } from './ContinueOrderModal'
import { useCartPromos, promosBySlug } from '../model/use-cart-promos'
import { lineDisplayTotal } from '@/shared/lib/promo-utils'

/** TC referencial mock (fase visual). */
const TC_REFERENCIAL = 3.75

const BENEFITS = [
  {
    icon: Clock,
    title: 'Respuesta en 24 h',
    body: 'Comercial confirma stock y precios en horario hábil.',
  },
  {
    icon: Message,
    title: 'Cotiza sin cuenta',
    body: 'Pasa tu lista a cotización sin registrarte.',
  },
  {
    icon: Phone,
    title: 'TC referencial',
    body: `Tipo de cambio mock S/ ${TC_REFERENCIAL.toFixed(2)} — sujeto a confirmación.`,
  },
] as const

type ResolvedCartRow =
  | {
      kind: 'product'
      line: CartLine
      product: Product
      key: string
      quantity: number
    }
  | {
      kind: 'combo'
      line: CartLine
      key: string
      quantity: number
    }

function resolveLine(line: CartLine, products: Product[]): ResolvedCartRow | null {
  const key = line.packagingId
    ? `${line.productSlug}::${line.packagingId}`
    : isComboLine(line)
      ? `combo::${line.comboId}`
      : line.productSlug

  if (isComboLine(line)) {
    return { kind: 'combo', line, key, quantity: line.quantity }
  }
  const product = products.find((p) => p.slug === line.productSlug)
  if (!product) return null
  return { kind: 'product', line, product, key, quantity: line.quantity }
}

/**
 * Carrito marketplace: lista editable, buscador si vacío (o para agregar), CTAs duales + 24h/TC.
 */
export function CartPage() {
  const reduce = prefersReducedMotion()
  const { products } = useCatalog()
  const { lines, addItem, updateQuantity, removeLine, clear, lineKey } =
    useCart()
  const { showSuccess } = useFormToasts()
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const { items: promos } = useCartPromos()
  const promoMap = promosBySlug(promos)

  const items = lines
    .map((l) => resolveLine(l, products))
    .filter((l): l is ResolvedCartRow => l !== null)
  const visibleCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => {
    if (item.kind === 'combo') {
      const unit = unitPriceOfLine(item.line)
      return sum + (unit ?? 0) * item.quantity
    }
    const unit = unitPriceOfLine(item.line, item.product)
    if (unit == null) return sum
    const promo = promoMap.get(item.product.slug) ?? null
    const { lineTotal } = lineDisplayTotal(unit, item.quantity, promo)
    return sum + lineTotal
  }, 0)
  const hasConsult = items.some((item) =>
    item.kind === 'combo'
      ? unitPriceOfLine(item.line) === null
      : unitPriceOfLine(item.line, item.product) === null,
  )

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-6 overflow-x-hidden px-4 pb-28 lg:px-6">
      <div className="pt-4 sm:pt-6">
        <CartBanner reduce={reduce} itemCount={visibleCount} />
      </div>

      <section className="rounded-2xl border border-rosver-line bg-white shadow-[0_12px_32px_-24px_rgba(17,17,17,0.4)]">
        <div className="border-b border-rosver-line px-4 py-4 sm:px-5">
          <p className="font-display text-sm font-bold tracking-wide text-rosver-ink uppercase">
            {items.length === 0
              ? 'Agregar productos'
              : `${items.length} producto${items.length === 1 ? '' : 's'} en el carrito`}
          </p>
          <p className="mt-1 text-xs text-rosver-muted sm:text-sm">
            {items.length === 0
              ? 'Busca en el catálogo y arma tu lista aquí.'
              : 'Ajusta cantidades o busca más ítems abajo.'}
          </p>
          <div className="mt-3">
            <CartProductSearcher
              products={products}
              onPick={(product) => {
                addItem(addInputFromProduct(product, 1))
                showSuccess(['Agregado al carrito'])
              }}
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center sm:px-5">
            <span className="flex size-14 items-center justify-center rounded-full bg-rosver-soft text-rosver-muted">
              <Search size={28} color="currentColor" strokeWidth={2} />
            </span>
            <p className="text-sm font-semibold text-rosver-ink">
              Tu carrito está vacío
            </p>
            <p className="max-w-sm text-sm text-rosver-muted">
              Usa el buscador de arriba o ve al catálogo completo.
            </p>
            <Link
              to="/catalogo"
              className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
            >
              Ver catálogo
              <ArrowRight size={16} color="#ffffff" strokeWidth={2} />
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-rosver-line px-4 sm:px-5">
            {items.map((item) => {
              if (item.kind === 'combo') {
                const { line, quantity, key } = item
                const unit = unitPriceOfLine(line)
                const lineTotal = unit != null ? unit * quantity : null
                const nested = line.comboItems ?? []
                return (
                  <li
                    key={key}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                  >
                    <div className="shrink-0">
                      <CartThumb
                        src={line.comboImageUrl}
                        alt={line.comboName || 'Combo'}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-rosver-ink">
                        {line.comboName || 'Combo'}
                      </p>
                      <p className="mt-0.5 text-xs text-rosver-muted">
                        {line.comboSku ? `SKU ${line.comboSku} · ` : ''}
                        Combo
                        {line.comboKind === 'bogo' ? ' 2x1' : ' pack'}
                      </p>
                      {nested.length ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-rosver-muted">
                          {nested
                            .map((n) => `${n.quantity}× ${n.productName}`)
                            .join(' · ')}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm font-bold text-rosver-red">
                        {unit != null ? `S/ ${unit.toFixed(2)}` : 'Consultar'}
                        {unit != null && quantity > 1 ? (
                          <span className="ml-2 text-xs font-semibold text-rosver-muted">
                            × {quantity} = S/ {(lineTotal ?? 0).toFixed(2)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(lineKey(line), quantity - 1)
                        }
                        className="inline-flex size-10 items-center justify-center rounded-full border border-rosver-line text-lg text-rosver-ink transition hover:border-rosver-red/40 hover:text-rosver-red"
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-rosver-ink">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(lineKey(line), quantity + 1)
                        }
                        className="inline-flex size-10 items-center justify-center rounded-full border border-rosver-line text-lg text-rosver-ink transition hover:border-rosver-red/40 hover:text-rosver-red"
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeLine(lineKey(line))
                        showSuccess(['Combo quitado del carrito'])
                      }}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-lg px-2 text-xs font-bold text-rosver-muted transition hover:bg-rosver-soft hover:text-rosver-red sm:self-center"
                    >
                      <Trash size={16} color="currentColor" strokeWidth={2} />
                      Quitar
                    </button>
                  </li>
                )
              }

              const { product, quantity, key, line } = item
              const packagingLabel = line.packagingLabel
              const unit = unitPriceOfLine(line, product)
              const promo = promoMap.get(product.slug) ?? null
              const promoCalc = unit != null
                ? lineDisplayTotal(unit, quantity, promo)
                : null
              const lineTotal = promoCalc ? promoCalc.lineTotal : unit != null ? unit * quantity : null
              return (
                <li
                  key={key}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <Link
                    to={`/producto/${product.slug}`}
                    className="shrink-0"
                    aria-label={`Ver ${product.name}`}
                  >
                    <CartThumb src={product.imageUrl} alt={product.name} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/producto/${product.slug}`}
                      className="text-sm font-semibold text-rosver-ink transition hover:text-rosver-red"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-rosver-muted">
                      {product.sku} · {product.vendor}
                      {packagingLabel ? ` · ${packagingLabel}` : ''}
                      {promo && (
                        <span className="inline-flex items-center rounded-full bg-rosver-yellow px-2 py-0.5 text-[10px] font-bold text-rosver-ink uppercase">
                          {promo.label}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm font-bold text-rosver-red">
                      {unit != null ? `S/ ${unit.toFixed(2)}` : 'Consultar'}
                      {unit != null && quantity > 1 ? (
                        <span className="ml-2 text-xs font-semibold text-rosver-muted">
                          × {quantity} = S/ {(lineTotal ?? 0).toFixed(2)}
                        </span>
                      ) : null}
                      {promoCalc?.hasPromo && promoCalc.savings > 0 && (
                        <span className="ml-2 text-xs font-semibold text-rosver-success">
                          Ahorras S/ {promoCalc.savings.toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(lineKey(line), quantity - 1)
                      }
                      className="inline-flex size-10 items-center justify-center rounded-full border border-rosver-line text-lg text-rosver-ink transition hover:border-rosver-red/40 hover:text-rosver-red"
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-rosver-ink">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(lineKey(line), quantity + 1)
                      }
                      className="inline-flex size-10 items-center justify-center rounded-full border border-rosver-line text-lg text-rosver-ink transition hover:border-rosver-red/40 hover:text-rosver-red"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      removeLine(lineKey(line))
                      showSuccess(['Producto quitado del carrito'])
                    }}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-lg px-2 text-xs font-bold text-rosver-muted transition hover:bg-rosver-soft hover:text-rosver-red sm:self-center"
                  >
                    <Trash size={16} color="currentColor" strokeWidth={2} />
                    Quitar
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {items.length > 0 ? (
          <div className="border-t border-rosver-line bg-rosver-soft/70 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-display text-xs font-bold tracking-wide text-rosver-ink uppercase sm:text-sm">
                  Subtotal estimado
                </p>
                <p className="mt-0.5 text-[11px] text-rosver-muted">
                  TC ref. {TC_REFERENCIAL.toFixed(2)}
                  {hasConsult
                    ? ' · ítems “Consultar” no suman — se confirman al cotizar'
                    : ' · precios sujetos a confirmación'}
                </p>
              </div>
              <p className="font-display text-xl font-bold text-rosver-ink sm:text-2xl">
                S/ {total.toFixed(2)}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {items.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-rosver-soft px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
          <Link
            to="/cotizar"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-rosver-red px-5 py-3 text-sm font-bold text-white transition hover:bg-rosver-red-dark sm:flex-none"
          >
            Solicitar cotización
            <ArrowRight size={16} color="#ffffff" strokeWidth={2} />
          </Link>
          <button
            type="button"
            onClick={() => setOrderModalOpen(true)}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border-2 border-rosver-red bg-white px-5 py-3 text-sm font-bold text-rosver-red transition hover:bg-rosver-red/5 sm:flex-none"
          >
            Continuar pedido
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Vaciar todo el carrito?')) clear()
            }}
            className="inline-flex min-h-11 items-center justify-center gap-1 px-2 text-sm font-bold text-rosver-muted transition hover:text-rosver-red"
          >
            Vaciar carrito
          </button>
          <Link
            to="/catalogo"
            className="inline-flex min-h-11 items-center justify-center gap-1 px-2 text-sm font-bold text-rosver-muted transition hover:text-rosver-ink"
          >
            <Plus size={14} color="currentColor" strokeWidth={2.5} />
            Seguir comprando
          </Link>
        </div>
      ) : null}

      <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-rosver-line bg-white p-4 shadow-[0_10px_28px_-22px_rgba(17,17,17,0.4)]"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rosver-red/10 text-rosver-red">
                <Icon size={20} color="currentColor" strokeWidth={2} />
              </span>
              <div>
                <p className="font-display text-xs font-bold tracking-wide text-rosver-ink uppercase sm:text-sm">
                  {title}
                </p>
                <p className="mt-1 text-sm text-rosver-muted">{body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-[3px] border-rosver-ink bg-rosver-soft p-5 shadow-[4px_4px_0_0_var(--color-rosver-red)]">
        <p className="font-display text-sm font-bold text-rosver-ink uppercase">
          ¿Prefieres cotizar primero?
        </p>
        <p className="mt-1.5 text-sm text-rosver-muted">
          Envíamos tu lista a comercial por WhatsApp. Respuesta en 24 h · TC
          referencial {TC_REFERENCIAL.toFixed(2)}.
        </p>
        <Link
          to="/cotizar"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rosver-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-rosver-red"
        >
          Ir a cotizar
          <ArrowRight size={14} color="#ffffff" strokeWidth={2} />
        </Link>
      </div>
      <ContinueOrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
      />
    </main>
  )
}

function CartBanner({
  reduce,
  itemCount,
}: {
  reduce: boolean
  itemCount: number
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border-[3px] border-rosver-ink bg-white">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[12%] max-sm:w-7"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, var(--color-rosver-red) 0 9px, #fff 9px 18px)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[12%] max-sm:w-7"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--color-rosver-ink) 0 9px, var(--color-rosver-soft) 9px 18px)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(17,17,17,0.14) 1.1px, transparent 1.2px)',
          backgroundSize: '15px 15px',
        }}
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex max-w-2xl flex-col items-center px-10 py-8 text-center sm:px-14 sm:py-10">
        <nav
          className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-rosver-muted"
          aria-label="Ruta"
        >
          <Link to="/" className="hover:text-rosver-red">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <span className="text-rosver-ink">Carrito</span>
        </nav>

        <motion.h1
          className="rotate-[-1deg] border-[3px] border-rosver-ink bg-white px-5 py-3 font-display text-3xl font-bold tracking-tight text-rosver-ink uppercase shadow-[5px_5px_0_0_#111] sm:text-4xl"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          Tu <span className="text-rosver-red">carrito</span>
        </motion.h1>

        <p className="mt-4 max-w-md text-sm text-rosver-muted">
          {itemCount > 0
            ? `${itemCount} unidad${itemCount === 1 ? '' : 'es'} listas para cotizar o pedir.`
            : 'Busca productos y arma tu pedido sin salir de aquí.'}
        </p>
      </div>
    </section>
  )
}

function CartThumb({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <ProductImagePlaceholder className="aspect-square w-16 rounded-xl border border-rosver-line sm:w-[4.5rem]" />
    )
  }

  return (
    <div className="aspect-square w-16 overflow-hidden rounded-xl border border-rosver-line bg-rosver-soft sm:w-[4.5rem]">
      <img
        src={src}
        alt={alt}
        width={72}
        height={72}
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    </div>
  )
}

function CartProductSearcher({
  products,
  onPick,
}: {
  products: Product[]
  onPick: (p: Product) => void
}) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products.filter((p) => p.visible !== false)
    if (q.length < 1) return list.slice(0, 6)
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.vendor.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [query, products])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    return attachNestedScrollWheel(el)
  }, [open, results.length])

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={listId} className="sr-only">
        Buscar producto para el carrito
      </label>
      <div
        className={cn(
          'flex overflow-hidden rounded-xl border border-rosver-line bg-rosver-soft/40 focus-within:border-rosver-red/45 focus-within:bg-white',
        )}
      >
        <span className="flex items-center pl-3 text-rosver-muted">
          <Search size={18} color="currentColor" strokeWidth={2} />
        </span>
        <input
          id={listId}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar producto (nombre, SKU, marca)…"
          className="min-h-11 w-full bg-transparent px-3 py-2.5 text-sm outline-none"
          autoComplete="off"
        />
      </div>
      {open ? (
        <ul
          ref={listRef}
          data-lenis-prevent
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto overscroll-contain rounded-xl border border-rosver-line bg-white py-1 shadow-[0_16px_40px_-20px_rgba(17,17,17,0.35)]"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-rosver-muted">
              Sin coincidencias
            </li>
          ) : (
            results.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-rosver-soft"
                  onClick={() => {
                    onPick(p)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-rosver-ink">
                      {p.name}
                    </span>
                    <span className="block text-xs text-rosver-muted">
                      {p.sku} · {p.vendor}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-rosver-red">
                    {p.price != null ? `S/ ${p.price.toFixed(0)}` : 'Consultar'}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
