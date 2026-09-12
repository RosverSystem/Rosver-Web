import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_LINES } from '@/shared/lib'
import { IconWhatsApp } from '@/shared/ui/icons'

const FALLBACK_HREF = `https://wa.me/${WHATSAPP_LINES[0].e164}`

export function WhatsAppFloatingButton() {
  return (
    <a
      href={FALLBACK_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      onClick={(e) => {
        // Rota el número en cada clic (secuencia 980… ↔ 960…).
        e.currentTarget.href = buildWhatsAppLink(WHATSAPP_DEFAULT_MESSAGE)
      }}
      className="group fixed right-4 bottom-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out hover:scale-110 hover:bg-[#20bd5a] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] sm:right-6 sm:bottom-6"
    >
      <IconWhatsApp
        className="size-7 transition-transform duration-300 ease-out group-hover:rotate-6"
        aria-hidden
      />
    </a>
  )
}
