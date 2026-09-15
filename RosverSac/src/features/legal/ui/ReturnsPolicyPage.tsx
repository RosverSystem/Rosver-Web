import { ROSVER_COMPANY, WHATSAPP_LINES } from '@/shared/lib'
import { Link } from 'react-router-dom'

/**
 * Política de devoluciones y cambios — página pública para Merchant Center y clientes.
 */
export function ReturnsPolicyPage() {
  const co = ROSVER_COMPANY
  const updated = '14 de septiembre de 2026'

  return (
    <main className="bg-rosver-soft/40">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <p className="text-[11px] font-bold tracking-[0.18em] text-rosver-red uppercase">
          Rosver SAC
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-rosver-ink sm:text-4xl">
          Política de devoluciones
        </h1>
        <p className="mt-3 text-sm text-rosver-muted">
          Última actualización: {updated}
        </p>

        <article className="mt-8 space-y-8 rounded-2xl border border-rosver-line bg-white p-5 shadow-sm sm:p-8">
          <section className="space-y-3 text-sm leading-relaxed text-rosver-ink/90">
            <h2 className="font-display text-lg font-bold text-rosver-ink">
              1. Quiénes somos
            </h2>
            <p>
              Esta política aplica a las compras realizadas a{' '}
              <strong>{co.legalName}</strong> (RUC {co.ruc}), con nombre
              comercial {co.tradeName}, con domicilio en {co.localAddress}, Perú.
              Correo: {co.email}. Teléfonos: {co.phones}.
            </p>
            <p>
              Nos dedicamos a la importación y venta al por mayor de herramientas,
              ferretería, electrónica, materiales de construcción e insumos
              afines a través de{' '}
              <a
                href="https://rosversac.com"
                className="font-semibold text-rosver-red hover:underline"
              >
                rosversac.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-rosver-ink/90">
            <h2 className="font-display text-lg font-bold text-rosver-ink">
              2. Plazo para devoluciones o cambios
            </h2>
            <p>
              Puedes solicitar una <strong>devolución o cambio</strong> dentro de
              los <strong>7 días calendario</strong> siguientes a la recepción del
              pedido, siempre que el producto cumpla las condiciones del apartado
              3.
            </p>
            <p>
              Si el producto llegó dañado, incompleto o distinto a lo pedido,
              debes avisarnos dentro de las <strong>48 horas</strong> de recibido,
              con fotos o video de evidencia.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-rosver-ink/90">
            <h2 className="font-display text-lg font-bold text-rosver-ink">
              3. Condiciones del producto
            </h2>
            <p>Aceptamos devoluciones o cambios cuando el producto:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Está sin usar y en buen estado.</li>
              <li>Conserva empaque original, etiquetas y accesorios.</li>
              <li>No presenta daños por mal uso, instalación incorrecta o
                manipulación indebida.</li>
              <li>Coincide con el número de pedido / factura o boleta.</li>
            </ul>
            <p>No aplican devoluciones en estos casos (salvo falla de fábrica
              demostrable o error nuestro de despacho):</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Productos personalizados o pedidos especiales bajo pedido.</li>
              <li>Artículos de higiene o sellados que hayan sido abiertos, si
                la normativa o el fabricante lo prohíben.</li>
              <li>Mercadería con signos de uso, montaje o instalación.</li>
              <li>Faltantes reportados fuera del plazo de 48 horas sin evidencia.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-rosver-ink/90">
            <h2 className="font-display text-lg font-bold text-rosver-ink">
              4. Cómo solicitar la devolución
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Escríbenos a{' '}
                <a
                  href={`mailto:${co.email}`}
                  className="font-semibold text-rosver-red hover:underline"
                >
                  {co.email}
                </a>{' '}
                o por WhatsApp ({WHATSAPP_LINES.map((l) => l.display).join(' / ')})
                indicando: número de pedido, producto, motivo y fotos.
              </li>
              <li>
                Nuestro equipo revisará el caso y te confirmará si procede
                devolución, cambio o crédito a favor.
              </li>
              <li>
                Coordinaremos la devolución física (agencia, recojo o entrega en
                nuestro local, según el caso).
              </li>
            </ol>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-rosver-ink/90">
            <h2 className="font-display text-lg font-bold text-rosver-ink">
              5. Costos de envío
            </h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Si el error o daño es responsabilidad de Rosver (producto
                incorrecto, defecto de fábrica o daño en el despacho nuestro),{' '}
                <strong>nosotros asumimos</strong> el costo del envío de
                devolución y del reenvío.
              </li>
              <li>
                Si la devolución es por arrepentimiento o cambio de preferencia
                (dentro del plazo y con producto en condiciones), el costo de
                envío de ida y/o retorno puede correr{' '}
                <strong>por cuenta del cliente</strong>, salvo acuerdo distinto
                por escrito.
              </li>
            </ul>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-rosver-ink/90">
            <h2 className="font-display text-lg font-bold text-rosver-ink">
              6. Reembolsos
            </h2>
            <p>
              Una vez recibido y verificado el producto, procesamos el reembolso
              o el abono a favor en un plazo estimado de{' '}
              <strong>7 a 15 días hábiles</strong>, según el medio de pago
              original (transferencia, depósito u otro canal acordado).
            </p>
            <p>
              En ventas B2B al por mayor, también podemos ofrecer{' '}
              <strong>nota de crédito</strong> o reposición del mismo producto /
              equivalente, según lo coordinado contigo.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-rosver-ink/90">
            <h2 className="font-display text-lg font-bold text-rosver-ink">
              7. Garantía del fabricante
            </h2>
            <p>
              Algunos productos incluyen garantía del fabricante o importador.
              Esa garantía es independiente de esta política de devoluciones y
              se gestiona según los términos del fabricante. Te ayudamos a
              orientar el trámite cuando aplique.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-rosver-ink/90">
            <h2 className="font-display text-lg font-bold text-rosver-ink">
              8. Reclamaciones
            </h2>
            <p>
              Si no estás conforme con la atención de tu caso, puedes usar
              nuestro{' '}
              <Link
                to="/libro-reclamaciones"
                className="font-semibold text-rosver-red hover:underline"
              >
                Libro de reclamaciones digital
              </Link>
              , de acuerdo con la normativa peruana aplicable.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-rosver-ink/90">
            <h2 className="font-display text-lg font-bold text-rosver-ink">
              9. Contacto
            </h2>
            <p>
              {co.legalName} · RUC {co.ruc}
              <br />
              {co.localAddress}
              <br />
              Correo:{' '}
              <a
                href={`mailto:${co.email}`}
                className="font-semibold text-rosver-red hover:underline"
              >
                {co.email}
              </a>
              <br />
              WhatsApp / teléfonos: {co.phones}
            </p>
            <p className="text-rosver-muted">
              Esta página es la URL oficial de nuestra política de devoluciones
              para clientes y para plataformas como Google Merchant Center.
            </p>
          </section>
        </article>

        <p className="mt-6 text-center text-sm text-rosver-muted">
          <Link to="/" className="font-semibold text-rosver-red hover:underline">
            Volver al inicio
          </Link>
          {' · '}
          <Link
            to="/contacto"
            className="font-semibold text-rosver-red hover:underline"
          >
            Contacto
          </Link>
        </p>
      </div>
    </main>
  )
}
