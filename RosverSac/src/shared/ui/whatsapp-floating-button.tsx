import { WHATSAPP_LINK } from '@/shared/lib'
import { IconWhatsApp } from '@/shared/ui/icons'

export function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="group fixed right-4 bottom-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out hover:scale-110 hover:bg-[#20bd5a] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] sm:right-6 sm:bottom-6"
    >
      <IconWhatsApp
        className="size-7 transition-transform duration-300 ease-out group-hover:rotate-6"
        aria-hidden
      />
    </a>
  )
}
