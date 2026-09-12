import nodemailer, { type Transporter } from 'nodemailer'
import { config } from '../config.js'
import { absoluteBrandUrl, BRAND_KEYS } from './brand-assets.js'

let transporter: Transporter | null = null

/** Hostinger/Railway: forzar IPv4 (evita ENETUNREACH en AAAA de Cloudflare). */
const smtpSocket = { family: 4 as const }

function getTransporter() {
  if (!config.smtp.pass) return null
  if (!transporter) {
    const port = config.smtp.port
    const secure = config.smtp.secure
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port,
      secure,
      requireTLS: !secure && port === 587,
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
      ...smtpSocket,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    })
  }
  return transporter
}

export function resetMailTransporter() {
  transporter = null
}

async function sendViaResend(opts: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<boolean> {
  const key = config.resendApiKey
  if (!key) return false
  const from = config.resendFrom || 'Rosver SAC <onboarding@resend.dev>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[mail] Resend HTTP', res.status, body.slice(0, 500))
      return false
    }
    console.info('[mail] enviado vía Resend HTTPS →', opts.to)
    return true
  } catch (err) {
    console.error('[mail] Resend falló:', err)
    return false
  }
}

function siteBaseUrl() {
  return (config.appUrl || 'https://rosversac.com').replace(/\/$/, '')
}

/** Estilos compartidos + motion (Apple Mail / clientes WebKit). */
function emailHead(title: string) {
  return `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${title}</title>
<style type="text/css">
  @media only screen and (max-width: 620px) {
    .rv-card { width: 100% !important; }
    .rv-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .rv-digit { width: 40px !important; height: 48px !important; font-size: 22px !important; }
  }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes rv-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(227,6,19,0.35); }
      50% { box-shadow: 0 0 0 10px rgba(227,6,19,0); }
    }
    @keyframes rv-rise {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes rv-shimmer {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }
    .rv-animate-rise { animation: rv-rise 0.7s ease-out both; }
    .rv-animate-glow { animation: rv-glow 2.4s ease-in-out infinite; }
    .rv-header-shine {
      background-size: 200% 200% !important;
      animation: rv-shimmer 4s linear infinite;
    }
  }
</style>`
}

function codeDigitCells(codeDigits: string) {
  return codeDigits
    .split('')
    .map(
      (d, i) => `
      <td class="rv-digit rv-animate-rise" align="center" style="width:44px;height:52px;background:#FFFFFF;border:1.5px solid #E5E7EB;border-radius:12px;font-size:24px;font-weight:800;color:#0D0D0D;font-family:Consolas,'Courier New',monospace;animation-delay:${i * 0.08}s;">
        ${d}
      </td>
      ${i < codeDigits.length - 1 ? '<td style="width:6px;font-size:0;">&nbsp;</td>' : ''}`,
    )
    .join('')
}

const PURPOSE_LABEL: Record<string, string> = {
  email_verify: 'verificar tu correo',
  login: 'iniciar sesión',
  reset_password: 'restablecer tu contraseña',
}

const PURPOSE_TITLE: Record<string, string> = {
  email_verify: 'Verifica tu correo',
  login: 'Tu código de acceso',
  reset_password: 'Restablece tu contraseña',
}

function buildOtpHtml(code: string, purpose: string) {
  const label = PURPOSE_LABEL[purpose] ?? 'continuar'
  const title = PURPOSE_TITLE[purpose] ?? 'Tu código Rosver'
  const logoUrl = absoluteBrandUrl(BRAND_KEYS.logoSinfondo)
  const siteUrl = siteBaseUrl()
  const codeDigits = code.replace(/\D/g, '')
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="es">
<head>
${emailHead(title)}
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Tu código Rosver ${codeDigits} · válido 5 minutos
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#1a0507 0%,#0D0D0D 40%,#111827 100%);background-color:#0D0D0D;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="rv-card" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding:0 0 28px;">
              <a href="${siteUrl}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Rosver SAC" width="140" height="56" style="display:block;margin:0 auto;height:56px;width:auto;max-width:168px;border:0;" />
              </a>
            </td>
          </tr>

          <tr>
            <td class="rv-animate-glow" style="border-radius:24px;padding:2px;background:linear-gradient(135deg,#E30613,#F2B705,#E30613);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border-radius:22px;overflow:hidden;">
                <tr>
                  <td class="rv-header-shine rv-pad" align="center" style="background:linear-gradient(135deg,#E30613 0%,#90040D 45%,#1E3A5F 100%);background-color:#E30613;padding:36px 28px 32px;">
                    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.22em;font-weight:700;color:rgba(255,255,255,0.88);text-transform:uppercase;">
                      Seguridad · Rosver SAC
                    </p>
                    <h1 class="rv-animate-rise" style="margin:0;font-size:28px;line-height:1.2;color:#FFFFFF;font-weight:800;">
                      ${title}
                    </h1>
                    <p style="margin:14px 0 0;font-size:15px;line-height:1.5;color:rgba(255,255,255,0.9);">
                      Usa este código para <strong style="color:#FFFFFF;">${label}</strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td class="rv-pad" align="center" style="padding:36px 28px 12px;background:#F8F9FB;">
                    <p style="margin:0 0 16px;font-size:11px;font-weight:800;letter-spacing:0.18em;color:#6B7280;text-transform:uppercase;">
                      Tu código de un solo uso
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                      <tr>
                        ${codeDigitCells(codeDigits)}
                      </tr>
                    </table>
                    <p style="margin:20px 0 0;font-size:14px;line-height:1.55;color:#6B7280;max-width:360px;">
                      Válido <strong style="color:#E30613;">5 minutos</strong>. No lo compartas con nadie.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td class="rv-pad" align="center" style="padding:24px 28px 36px;background:#F8F9FB;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="border-radius:999px;background:#E30613;box-shadow:0 10px 28px rgba(227,6,19,0.35);">
                          <a href="${siteUrl}/login" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:800;color:#FFFFFF;text-decoration:none;border-radius:999px;letter-spacing:0.02em;">
                            Continuar en Rosver →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:18px 0 0;font-size:12px;color:#9CA3AF;">
                      Si no pediste este código, puedes ignorar este mensaje.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 12px 8px;">
              <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;text-align:center;">
                Herramientas y soluciones para profesionales
              </p>
              <p style="margin:0;font-size:11px;line-height:1.6;color:#6B7280;text-align:center;">
                © ${year} Rosver SAC<br />
                <a href="${siteUrl}" style="color:#F2B705;text-decoration:none;">Abrir sitio web</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: string,
) {
  const label = PURPOSE_LABEL[purpose] ?? 'continuar'
  const subject = `Código Rosver SAC: ${code}`
  const text = `Tu código para ${label} es: ${code}\n\nVálido 5 minutos. Si no pediste esto, ignora el mensaje.`
  const html = buildOtpHtml(code, purpose)

  // Preferir Resend (HTTPS): Railway Trial/Hobby bloquea SMTP outbound.
  if (config.resendApiKey) {
    if (await sendViaResend({ to, subject, text, html })) {
      return { delivered: true, mode: 'smtp' as const }
    }
    // Con Resend configurado no caemos a SMTP (en Railway está bloqueado y solo alarga).
    console.info(`[mail:dev] → ${to} | ${purpose} | OTP ${code}`)
    return { delivered: false, mode: 'console' as const }
  }

  const primary = getTransporter()
  if (!primary) {
    console.info(`[mail:dev] → ${to} | ${purpose} | OTP ${code}`)
    return { delivered: false, mode: 'console' as const }
  }

  try {
    await primary.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html,
    })
    return { delivered: true, mode: 'smtp' as const }
  } catch (err) {
    console.error('[mail] envío falló (primary):', err)

    if (config.smtp.port === 465 || config.smtp.secure) {
      try {
        const fallback = nodemailer.createTransport({
          host: config.smtp.host,
          port: 587,
          secure: false,
          requireTLS: true,
          connectionTimeout: 12_000,
          greetingTimeout: 12_000,
          socketTimeout: 20_000,
          ...smtpSocket,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass,
          },
        })
        await fallback.sendMail({
          from: config.smtp.from,
          to,
          subject,
          text,
          html,
        })
        console.info('[mail] enviado vía fallback :587 STARTTLS')
        return { delivered: true, mode: 'smtp' as const }
      } catch (err2) {
        console.error('[mail] fallback 587 también falló:', err2)
      }
    }

    console.info(`[mail:dev] → ${to} | ${purpose} | OTP ${code}`)
    return { delivered: false, mode: 'console' as const }
  }
}

async function sendMailSafe(opts: {
  to: string
  subject: string
  text: string
  html: string
  logTag: string
}) {
  if (config.resendApiKey) {
    if (await sendViaResend(opts)) {
      return { delivered: true, mode: 'smtp' as const }
    }
    console.info(`[mail:dev] → ${opts.to} | ${opts.logTag}`)
    return { delivered: false, mode: 'console' as const }
  }
  const primary = getTransporter()
  if (!primary) {
    console.info(`[mail:dev] → ${opts.to} | ${opts.logTag} | ${opts.subject}`)
    return { delivered: false, mode: 'console' as const }
  }
  try {
    await primary.sendMail({
      from: config.smtp.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    })
    return { delivered: true, mode: 'smtp' as const }
  } catch (err) {
    console.error(`[mail] ${opts.logTag} falló:`, err)
    if (config.smtp.port === 465 || config.smtp.secure) {
      try {
        const fallback = nodemailer.createTransport({
          host: config.smtp.host,
          port: 587,
          secure: false,
          requireTLS: true,
          connectionTimeout: 12_000,
          greetingTimeout: 12_000,
          socketTimeout: 20_000,
          ...smtpSocket,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass,
          },
        })
        await fallback.sendMail({
          from: config.smtp.from,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
        })
        return { delivered: true, mode: 'smtp' as const }
      } catch (err2) {
        console.error(`[mail] ${opts.logTag} fallback 587 falló:`, err2)
      }
    }
    console.info(`[mail:dev] → ${opts.to} | ${opts.logTag}`)
    return { delivered: false, mode: 'console' as const }
  }
}

export type ContactConfirmPayload = {
  to: string
  fullName: string
  code: string
  messagePreview: string
  phone?: string | null
}

function buildContactConfirmHtml(p: ContactConfirmPayload) {
  const logoUrl = absoluteBrandUrl(BRAND_KEYS.logoSinfondo)
  const siteUrl = siteBaseUrl()
  const safeName = p.fullName.replace(/[<>&]/g, '')
  const preview = p.messagePreview
    .slice(0, 280)
    .replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
  const year = new Date().getFullYear()
  const waUrl =
    'https://wa.me/51980202591?text=' +
    encodeURIComponent(
      'Hola Rosver, quiero contactarme para cotizar productos para mi negocio.',
    )
  const waIconUrl = absoluteBrandUrl(BRAND_KEYS.whatsappMark)

  return `<!DOCTYPE html>
<html lang="es">
<head>
${emailHead('Recibimos tu mensaje — Rosver')}
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#1a0507 0%,#0D0D0D 45%,#111827 100%);background-color:#0D0D0D;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="rv-card" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <a href="${siteUrl}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Rosver SAC" width="140" height="56" style="display:block;margin:0 auto;height:56px;width:auto;max-width:168px;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="rv-animate-glow" style="border-radius:24px;padding:2px;background:linear-gradient(135deg,#E30613,#F2B705,#1E3A5F);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border-radius:22px;overflow:hidden;">
                <tr>
                  <td class="rv-header-shine rv-pad" style="background:linear-gradient(135deg,#E30613 0%,#90040D 50%,#1E3A5F 100%);background-color:#E30613;padding:32px 28px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.85);text-transform:uppercase;">
                      Confirmación de contacto
                    </p>
                    <h1 class="rv-animate-rise" style="margin:0;font-size:24px;line-height:1.25;color:#FFFFFF;font-weight:800;">
                      Hola ${safeName}, ya estamos en ello
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="rv-pad rv-animate-rise" style="padding:28px 28px 8px;">
                    <p style="margin:0;font-size:15px;line-height:1.65;color:#4B5563;">
                      Gracias por escribir a <strong style="color:#0D0D0D;">Rosver SAC</strong>.
                      Nuestro equipo comercial revisará tu mensaje y te responderá a la brevedad
                      (horario 9:00 a.&nbsp;m. – 8:00 p.&nbsp;m.).
                    </p>
                  </td>
                </tr>
                <tr>
                  <td class="rv-pad" style="padding:20px 28px 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F9FB;border:1px solid #E5E7EB;border-radius:16px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.14em;color:#9CA3AF;text-transform:uppercase;">
                            Nº de solicitud
                          </p>
                          <p style="margin:0;font-size:20px;font-weight:800;color:#E30613;font-family:Consolas,'Courier New',monospace;letter-spacing:0.08em;">
                            ${p.code}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 20px 18px;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.14em;color:#9CA3AF;text-transform:uppercase;">
                            Tu mensaje
                          </p>
                          <p style="margin:0;font-size:14px;line-height:1.55;color:#374151;">
                            ${preview}${p.messagePreview.length > 280 ? '…' : ''}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="rv-pad" style="padding:20px 28px 8px;">
                    <p style="margin:0 0 14px;font-size:13px;line-height:1.55;color:#6B7280;">
                      ¿Necesitas respuesta más rápida? Escríbenos por WhatsApp:
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left" style="border-radius:14px;background:#25D366;box-shadow:0 8px 20px rgba(37,211,102,0.35);">
                          <a href="${waUrl}" target="_blank" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:800;color:#FFFFFF;text-decoration:none;border-radius:14px;line-height:22px;">
                            <img src="${waIconUrl}" alt="WhatsApp" width="22" height="22" style="display:inline-block;vertical-align:middle;border:0;margin:0 10px 0 0;" />
                            <span style="display:inline-block;vertical-align:middle;color:#FFFFFF;">Abrir WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="rv-pad" align="center" style="padding:26px 28px 36px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="border-radius:999px;background:#E30613;box-shadow:0 10px 28px rgba(227,6,19,0.35);">
                          <a href="${siteUrl}/catalogo" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:800;color:#FFFFFF;text-decoration:none;border-radius:999px;">
                            Ver catálogo →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:26px 8px 0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6B7280;text-align:center;">
                © ${year} Rosver SAC · Importación y mayoreo<br />
                <a href="${siteUrl}" style="color:#F2B705;text-decoration:none;">Abrir sitio web</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Confirmación al cliente tras enviar el formulario de contacto. */
export async function sendContactConfirmationEmail(p: ContactConfirmPayload) {
  const subject = `Recibimos tu mensaje · ${p.code} · Rosver SAC`
  const text = [
    `Hola ${p.fullName},`,
    '',
    'Recibimos tu solicitud de contacto en Rosver SAC.',
    `Nº de solicitud: ${p.code}`,
    '',
    'Nuestro equipo comercial te responderá a la brevedad.',
    'WhatsApp: https://wa.me/51980202591',
    '',
    '— Equipo Rosver',
  ].join('\n')

  return sendMailSafe({
    to: p.to,
    subject,
    text,
    html: buildContactConfirmHtml(p),
    logTag: 'contact-confirm',
  })
}
