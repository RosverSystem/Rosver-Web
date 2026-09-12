import {
  buildClientOfferMessage,
  fetchClientDetail,
  phoneToWaE164,
} from '@/features/admin-clients/model/api'
import type {
  ClientDetail,
  ClientInterestProduct,
} from '@/features/admin-clients/model/types'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { ApiError } from '@/shared/lib/api'
import { buildFixedWhatsAppLink, cn } from '@/shared/lib'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { ArrowRight, Message, Phone, Search } from 'cssvg-icons'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const DATE_FMT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Ficha de cliente: interés, últimos vistos, contacto para ofertas.
 */
export function AdminClientDetailPage() {
  const { id } = useParams()
  const { toasts, showErrors, dismiss } = useFormToasts()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'frequent' | 'recent'>('frequent')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    void fetchClientDetail(id)
      .then((res) => {
        if (!cancelled) setClient(res.client)
      })
      .catch((err) => {
        if (!cancelled) {
          showErrors([
            err instanceof ApiError
              ? err.message
              : 'No se pudo cargar el cliente.',
          ])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const interest = tab === 'frequent' ? client?.frequentProducts : client?.recentProducts
  const offerProducts = useMemo(
    () => client?.frequentProducts?.slice(0, 5) ?? [],
    [client],
  )

  const waE164 = phoneToWaE164(client?.phone ?? null)
  const offerMsg = buildClientOfferMessage(
    client?.fullName ?? null,
    offerProducts,
  )
  const waHref = waE164
    ? buildFixedWhatsAppLink(waE164, offerMsg)
    : null
  const mailHref = client?.email
    ? `mailto:${client.email}?subject=${encodeURIComponent('Oferta Rosver para ti')}&body=${encodeURIComponent(offerMsg)}`
    : null

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-rosver-muted">Cargando…</p>
    )
  }

  if (!client) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-rosver-muted">Cliente no encontrado.</p>
        <Link
          to="/admin/clientes"
          className="mt-3 inline-block text-sm font-bold text-rosver-red"
        >
          Volver al listado
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-10">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-wrap items-center gap-2 text-sm text-rosver-muted">
        <Link to="/admin/clientes" className="font-semibold hover:text-rosver-red">
          Clientes
        </Link>
        <span>/</span>
        <span className="font-semibold text-rosver-ink">
          {client.fullName || client.email}
        </span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-rosver-line bg-white shadow-[0_12px_36px_-28px_rgba(13,13,13,0.4)]">
        <div className="border-b border-rosver-line bg-gradient-to-r from-rosver-soft/80 to-white px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rosver-ink text-lg font-bold text-white">
                {(client.fullName || client.email).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="truncate font-display text-xl font-bold text-rosver-ink sm:text-2xl">
                  {client.fullName || 'Sin nombre'}
                </h1>
                <p className="mt-0.5 truncate text-sm text-rosver-muted">
                  {client.email}
                  {client.companyName ? ` · ${client.companyName}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <Badge
                    ok={client.status === 'active'}
                    label={client.status === 'active' ? 'Activo' : 'Inactivo'}
                  />
                  <Badge
                    ok={client.emailVerified}
                    label={client.emailVerified ? 'Email OK' : 'Email pendiente'}
                  />
                  {client.documentNumber ? (
                    <span className="rounded-full bg-rosver-soft px-2 py-0.5 font-semibold text-rosver-muted">
                      {client.documentType || 'Doc'}: {client.documentNumber}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-bold text-white hover:brightness-95"
                >
                  <Phone size={16} color="currentColor" strokeWidth={2} />
                  WhatsApp oferta
                </a>
              ) : (
                <span className="rounded-xl border border-rosver-line px-3 py-2 text-xs text-rosver-muted">
                  Sin teléfono para WhatsApp
                </span>
              )}
              {mailHref ? (
                <a
                  href={mailHref}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rosver-line bg-white px-3.5 py-2 text-sm font-bold text-rosver-ink hover:border-rosver-ink/30"
                >
                  <Message size={16} color="currentColor" strokeWidth={2} />
                  Email oferta
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
          <Stat label="Productos vistos" value={client.frequentProducts.length} />
          <Stat label="Pedidos" value={client.orders.length} />
          <Stat label="Cotizaciones" value={client.quotes.length} />
        </div>
      </section>

      <section className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-rosver-ink">Interés en productos</h2>
            <p className="text-xs text-rosver-muted">
              Usa estos datos para armar ofertas y contactar al cliente.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-rosver-line bg-rosver-soft/50 p-1">
            <TabBtn
              active={tab === 'frequent'}
              onClick={() => setTab('frequent')}
              label="Más frecuentes"
            />
            <TabBtn
              active={tab === 'recent'}
              onClick={() => setTab('recent')}
              label="Últimos vistos"
            />
          </div>
        </div>

        {!interest?.length ? (
          <EmptyInterest />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {interest.map((p) => (
              <InterestRow key={p.id} product={p} mode={tab} />
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DocList
          title="Pedidos recientes"
          empty="Sin pedidos ligados a esta cuenta."
          items={client.orders.map((o) => ({
            id: o.id,
            title: o.code,
            sub: o.businessName || o.status,
            date: o.createdAt,
            href: `/admin/pedidos`,
          }))}
        />
        <DocList
          title="Cotizaciones recientes"
          empty="Sin cotizaciones ligadas a esta cuenta."
          items={client.quotes.map((q) => ({
            id: q.id,
            title: q.code,
            sub: q.businessName || q.status,
            date: q.createdAt,
            href: `/admin/cotizaciones`,
          }))}
        />
      </div>
    </div>
  )
}

function InterestRow({
  product,
  mode,
}: {
  product: ClientInterestProduct
  mode: 'frequent' | 'recent'
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-rosver-line bg-rosver-soft/30 p-3 transition hover:border-rosver-ink/20 hover:bg-white">
      <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-rosver-line bg-white">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            width={56}
            height={56}
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[10px] font-bold text-rosver-muted">
            SKU
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to={`/producto/${product.slug}`}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 text-sm font-bold text-rosver-ink hover:text-rosver-red"
        >
          {product.name}
        </Link>
        <p className="mt-0.5 text-[11px] text-rosver-muted">
          {product.sku}
          {product.price != null ? ` · S/ ${product.price.toFixed(2)}` : ''}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-rosver-blue">
          {mode === 'frequent'
            ? `${product.viewCount} vista${product.viewCount === 1 ? '' : 's'}`
            : `Última: ${DATE_FMT.format(new Date(product.lastViewedAt))}`}
        </p>
      </div>
      <Link
        to={`/producto/${product.slug}`}
        target="_blank"
        rel="noreferrer"
        className="self-center text-rosver-muted hover:text-rosver-red"
        aria-label="Ver producto"
      >
        <ArrowRight size={18} color="currentColor" strokeWidth={2} />
      </Link>
    </li>
  )
}

function DocList({
  title,
  empty,
  items,
}: {
  title: string
  empty: string
  items: { id: string; title: string; sub: string; date: string; href: string }[]
}) {
  return (
    <section className="rounded-2xl border border-rosver-line bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-rosver-ink">{title}</h2>
      {!items.length ? (
        <p className="text-sm text-rosver-muted">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                to={it.href}
                className="flex items-center justify-between gap-2 rounded-xl border border-rosver-line px-3 py-2 text-sm transition hover:border-rosver-red/40"
              >
                <span>
                  <span className="font-bold text-rosver-ink">{it.title}</span>
                  <span className="mt-0.5 block text-[11px] text-rosver-muted">
                    {it.sub}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-rosver-muted">
                  {DATE_FMT.format(new Date(it.date))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-rosver-line bg-rosver-soft/40 px-3 py-3">
      <p className="text-[11px] font-bold tracking-wide text-rosver-muted uppercase">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-rosver-ink">
        {value}
      </p>
    </div>
  )
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 font-bold',
        ok ? 'bg-rosver-success/15 text-rosver-success' : 'bg-rosver-soft text-rosver-muted',
      )}
    >
      {label}
    </span>
  )
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-xs font-bold transition',
        active
          ? 'bg-white text-rosver-ink shadow-sm'
          : 'text-rosver-muted hover:text-rosver-ink',
      )}
    >
      {label}
    </button>
  )
}

function EmptyInterest() {
  return (
    <div className="rounded-xl border border-dashed border-rosver-line bg-rosver-soft/40 px-4 py-10 text-center">
      <Search size={28} color="currentColor" strokeWidth={2} />
      <p className="mt-2 text-sm font-semibold text-rosver-ink">
        Aún no hay vistas registradas
      </p>
      <p className="mt-1 text-xs text-rosver-muted">
        Cuando el cliente entre con su cuenta y abra fichas de producto,
        aparecerán aquí.
      </p>
    </div>
  )
}
