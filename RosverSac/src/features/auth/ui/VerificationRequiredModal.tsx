import { OtpVerifyPanel } from '@/features/auth/ui/OtpVerifyPanel'
import { prefersReducedMotion } from '@/shared/lib/gsap'
import { motion } from 'motion/react'

/**
 * Modal bloqueante: cuenta pendiente de verificación (fondo difuminado).
 */
export function VerificationRequiredModal({
  email,
  initialRetryAfterSec = 30,
  initialMailDelivered,
  onVerified,
  onClose,
}: {
  email: string
  initialRetryAfterSec?: number
  initialMailDelivered?: boolean
  onVerified: (user?: { roleCode: string }) => void
  onClose?: () => void
}) {
  const reduce = prefersReducedMotion()

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-required-title"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-rosver-ink/45 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        className="relative z-[1] w-full max-w-md rounded-2xl border border-rosver-line bg-white p-5 shadow-xl sm:p-6"
        initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
      >
        <div className="mb-4 rounded-xl border border-rosver-yellow/40 bg-rosver-yellow/15 px-3 py-2.5 text-sm text-rosver-ink">
          <p id="verify-required-title" className="font-bold">
            Verificación obligatoria
          </p>
          <p className="mt-1 text-rosver-muted">
            Tu cuenta aún no está verificada. Ingresa el código OTP del correo.
            Si no verificas en 24 horas, el registro se elimina.
          </p>
        </div>
        <OtpVerifyPanel
          email={email}
          initialRetryAfterSec={initialRetryAfterSec}
          initialMailDelivered={initialMailDelivered}
          onVerified={onVerified}
        />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-center text-sm font-semibold text-rosver-muted hover:text-rosver-ink"
          >
            Cerrar
          </button>
        ) : null}
      </motion.div>
    </div>
  )
}
