import { WireBlock, WireImage } from '@/shared/ui/wireframe'

export function AdminContentPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-rosver-ink uppercase">
        Contenido web
      </h1>

      <WireBlock label="Hero de Home">
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
          <WireImage ratio="aspect-[16/10]" />
          <div className="flex flex-col gap-2">
            <input
              type="text"
              defaultValue="Catálogo Rosver Sac"
              className="rounded-lg border border-rosver-line px-3 py-2.5 text-sm outline-none focus:border-rosver-red/50"
            />
            <textarea
              rows={2}
              defaultValue="Herramientas, ferretería y electrónica de importación — al detalle y por mayor."
              className="rounded-lg border border-rosver-line px-3 py-2.5 text-sm outline-none focus:border-rosver-red/50"
            />
          </div>
        </div>
      </WireBlock>

      <WireBlock label="Banda CTA intermedia">
        <input
          type="text"
          defaultValue="¿Necesitas cotizar un pedido grande o por mayor?"
          className="w-full rounded-lg border border-rosver-line px-3 py-2.5 text-sm outline-none focus:border-rosver-red/50"
        />
      </WireBlock>

      <WireBlock label="Datos de la empresa">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            defaultValue="+51 999 999 999"
            placeholder="Teléfono / WhatsApp"
            className="rounded-lg border border-rosver-line px-3 py-2.5 text-sm outline-none focus:border-rosver-red/50"
          />
          <input
            type="email"
            defaultValue="ventas@rosversac.com"
            placeholder="Correo"
            className="rounded-lg border border-rosver-line px-3 py-2.5 text-sm outline-none focus:border-rosver-red/50"
          />
        </div>
      </WireBlock>

      <button
        type="button"
        className="self-start rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white"
      >
        Guardar cambios
      </button>
    </div>
  )
}
