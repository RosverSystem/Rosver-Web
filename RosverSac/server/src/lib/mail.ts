import nodemailer, { type Transporter } from 'nodemailer'
import { config } from '../config.js'

let transporter: Transporter | null = null

function getTransporter() {
  if (!config.smtp.pass) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    })
  }
  return transporter
}

const PURPOSE_LABEL: Record<string, string> = {
  email_verify: 'verificar tu correo',
  login: 'iniciar sesión',
  reset_password: 'restablecer tu contraseña',
}

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: string,
) {
  const label = PURPOSE_LABEL[purpose] ?? 'continuar'
  const subject = `Código Rosver SAC: ${code}`
  const text = `Tu código para ${label} es: ${code}\n\nVálido 10 minutos. Si no pediste esto, ignora el mensaje.`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#E30613;margin:0 0 12px">Rosver SAC</h2>
      <p style="color:#0D0D0D">Tu código para <strong>${label}</strong>:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;color:#0D0D0D">${code}</p>
      <p style="color:#6B7280;font-size:13px">Válido 10 minutos. Si no pediste esto, ignora el mensaje.</p>
    </div>
  `

  const tx = getTransporter()
  if (!tx) {
    console.info(`[mail:dev] → ${to} | ${purpose} | OTP ${code}`)
    return { delivered: false, mode: 'console' as const }
  }

  try {
    await tx.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html,
    })
    return { delivered: true, mode: 'smtp' as const }
  } catch (err) {
    // No dejar que un SMTP caído/mal configurado tumbe el flujo de auth
    // (registro, login, reset). El código sigue quedando disponible por
    // consola para no bloquear al usuario mientras se resuelve SMTP.
    console.error('[mail] envío falló, degradando a consola:', err)
    console.info(`[mail:dev] → ${to} | ${purpose} | OTP ${code}`)
    return { delivered: false, mode: 'console' as const }
  }
}
