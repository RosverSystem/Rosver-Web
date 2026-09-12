import nodemailer, { type Transporter } from 'nodemailer'
import { config } from '../config.js'
import { absoluteBrandUrl, BRAND_KEYS } from './brand-assets.js'

let transporter: Transporter | null = null

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
  const siteUrl = (config.appUrl || 'https://rosver-web-production.up.railway.app').replace(
    /\/$/,
    '',
  )
  // Sin espacios reales: el letter-spacing separa visualmente; al copiar sale continuo.
  const codeDigits = code.replace(/\D/g, '')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#EEF0F3;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#EEF0F3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 22px;">
              <a href="${siteUrl}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Rosver SAC" width="132" height="52" style="display:block;margin:0 auto;height:52px;width:auto;max-width:160px;border:0;" />
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(13,13,13,0.10);">
              <!-- Red header band -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#E30613 0%,#90040D 100%);background-color:#E30613;padding:28px 24px 24px;">
                    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;font-weight:700;color:rgba(255,255,255,0.85);text-transform:uppercase;">
                      Seguridad Rosver
                    </p>
                    <h1 style="margin:0;font-size:24px;line-height:1.25;color:#FFFFFF;font-weight:700;">
                      ${title}
                    </h1>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:28px 28px 8px;">
                    <p style="margin:0;font-size:15px;line-height:1.55;color:#6B7280;text-align:center;">
                      Usa este código para <strong style="color:#0D0D0D;">${label}</strong><br />en tu cuenta Rosver SAC.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:18px 28px 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="background:#F8F9FB;border:1px solid #E5E7EB;border-radius:14px;padding:22px 28px;min-width:240px;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#9CA3AF;text-transform:uppercase;">
                            Tu código
                          </p>
                          <p style="margin:0;font-size:34px;letter-spacing:0.28em;font-weight:700;color:#0D0D0D;font-family:Consolas,'Courier New',monospace;text-align:center;">
                            ${codeDigits}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:14px 28px 6px;">
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#6B7280;text-align:center;">
                      Válido <strong style="color:#E30613;">5 minutos</strong>. Si no pediste este código, ignora el mensaje.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:22px 28px 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="border-radius:999px;background:#E30613;">
                          <a href="${siteUrl}/login" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;">
                            Ir a Rosver
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 12px 8px;">
              <p style="margin:0 0 8px;font-size:13px;color:#6B7280;text-align:center;">
                Herramientas y soluciones para profesionales
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#9CA3AF;text-align:center;">
                © Rosver SAC · No compartas este código con nadie.<br />
                <a href="${siteUrl}" style="color:#1E3A5F;text-decoration:none;">Visitar sitio</a>
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
  const siteUrl = (config.appUrl || 'https://rosver-web-production.up.railway.app').replace(
    /\/$/,
    '',
  )
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
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Recibimos tu mensaje — Rosver</title>
</head>
<body style="margin:0;padding:0;background:#EEF0F3;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#EEF0F3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:0 0 22px;">
              <a href="${siteUrl}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Rosver SAC" width="132" height="52" style="display:block;margin:0 auto;height:52px;width:auto;max-width:160px;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(13,13,13,0.10);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="height:5px;background:linear-gradient(90deg,#E30613 0%,#90040D 100%);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:28px 28px 8px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.16em;color:#E30613;text-transform:uppercase;">
                      Confirmación de contacto
                    </p>
                    <h1 style="margin:0;font-size:22px;line-height:1.3;color:#0D0D0D;font-weight:700;">
                      Hola ${safeName}, recibimos tu solicitud
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 28px 0;">
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#4B5563;">
                      Gracias por escribir a <strong style="color:#0D0D0D;">Rosver SAC</strong>.
                      Nuestro equipo comercial revisará tu mensaje y te responderá a la brevedad
                      en horario de atención (9:00 a.&nbsp;m. – 8:00 p.&nbsp;m.).
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F9FB;border:1px solid #E5E7EB;border-radius:14px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#9CA3AF;text-transform:uppercase;">
                            Nº de solicitud
                          </p>
                          <p style="margin:0;font-size:18px;font-weight:700;color:#0D0D0D;font-family:Consolas,'Courier New',monospace;letter-spacing:0.06em;">
                            ${p.code}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 18px 16px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#9CA3AF;text-transform:uppercase;">
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
                  <td style="padding:18px 28px 4px;">
                    <p style="margin:0 0 14px;font-size:13px;line-height:1.55;color:#6B7280;">
                      Si necesitas una respuesta más rápida, escríbenos por WhatsApp:
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left" style="border-radius:12px;background:#25D366;">
                          <a href="${waUrl}" target="_blank" style="display:inline-block;padding:11px 18px;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:12px;line-height:20px;">
                            <!--[if mso]><i style="mso-font-width:150%;mso-text-raise:100%;" hidden>&emsp;</i><![endif]-->
                            <img src="${waIconUrl}" alt="WhatsApp" width="22" height="22" style="display:inline-block;vertical-align:middle;border:0;outline:none;text-decoration:none;margin:0 10px 0 0;" />
                            <span style="display:inline-block;vertical-align:middle;color:#FFFFFF;">WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:22px 28px 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="border-radius:999px;background:#E30613;">
                          <a href="${siteUrl}/catalogo" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;">
                            Ver catálogo
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
            <td align="center" style="padding:22px 8px 0;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9CA3AF;text-align:center;">
                © ${year} Rosver SAC · Importación y mayoreo<br />
                <a href="${siteUrl}" style="color:#1E3A5F;text-decoration:none;">rosver.pe</a>
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
