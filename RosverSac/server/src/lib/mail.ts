import nodemailer, { type Transporter } from 'nodemailer'
import { config } from '../config.js'
import { absoluteBrandUrl, BRAND_KEYS, CANONICAL_SITE } from './brand-assets.js'

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

  async function postTo(to: string, subject: string, text: string, html: string) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
      }),
    })
    const body = await res.text().catch(() => '')
    return { ok: res.ok, status: res.status, body }
  }

  try {
    const first = await postTo(opts.to, opts.subject, opts.text, opts.html)
    if (first.ok) {
      console.info('[mail] enviado vía Resend HTTPS →', opts.to)
      return true
    }
    console.error('[mail] Resend HTTP', first.status, first.body.slice(0, 500))

    // Free sin dominio: solo deja enviar al email de la cuenta Resend.
    const testTo = (config.resendTestTo || '').toLowerCase().trim()
    const restricted =
      first.status === 403 &&
      /only send testing emails to your own email/i.test(first.body)
    if (restricted && testTo && testTo !== opts.to.toLowerCase()) {
      const relaySubject = `[Rosver] ${opts.subject} · para ${opts.to}`
      const relayText =
        `Este código es para la cuenta ${opts.to}.\n\n` +
        `(Resend Free aún no tiene dominio verificado; se entregó a ${testTo}.)\n\n` +
        opts.text
      const relayHtml =
        `<div style="padding:12px 16px;margin:0 0 16px;background:#FEF3C7;border:1px solid #F2B705;border-radius:12px;font-family:Arial,sans-serif;font-size:13px;color:#0D0D0D;">` +
        `<strong>Código para:</strong> ${opts.to}<br/>` +
        `<span style="color:#6B7280;">Entrega temporal a ${testTo} (verifica el dominio en Resend para enviar directo).</span>` +
        `</div>` +
        opts.html
      const second = await postTo(testTo, relaySubject, relayText, relayHtml)
      if (second.ok) {
        console.info(
          `[mail] Resend relay OK → ${testTo} (destinatario original ${opts.to})`,
        )
        return true
      }
      console.error(
        '[mail] Resend relay falló',
        second.status,
        second.body.slice(0, 400),
      )
    }
    return false
  } catch (err) {
    console.error('[mail] Resend falló:', err)
    return false
  }
}

function siteBaseUrl() {
  const raw = (config.appUrl || CANONICAL_SITE).replace(/\/$/, '')
  // Correos deben apuntar al dominio público (Cloudflare), no a .up.railway.app
  if (/localhost|127\.0\.0\.1|\.up\.railway\.app/i.test(raw)) {
    return CANONICAL_SITE
  }
  return raw
}

/** Estilos compartidos (plantilla clara tipo Miro + acento Rosver). */
function emailHead(title: string) {
  return `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${title}</title>
<style type="text/css">
  @media only screen and (max-width: 620px) {
    .rv-card { width: 100% !important; }
    .rv-pad { padding-left: 22px !important; padding-right: 22px !important; }
    .rv-hide-sm { display: none !important; }
  }
</style>`
}

const PURPOSE_LABEL: Record<string, string> = {
  email_verify: 'verificar tu correo',
  login: 'iniciar sesión',
  reset_password: 'restablecer tu contraseña',
}

const PURPOSE_TITLE: Record<string, string> = {
  email_verify: 'Completa tu registro',
  login: 'Confirma tu acceso',
  reset_password: 'Restablece tu contraseña',
}

const PURPOSE_CTA: Record<string, string> = {
  email_verify: 'Confirmar correo',
  login: 'Continuar en Rosver',
  reset_password: 'Restablecer contraseña',
}

function buildOtpHtml(code: string, purpose: string) {
  const label = PURPOSE_LABEL[purpose] ?? 'continuar'
  const title = PURPOSE_TITLE[purpose] ?? 'Tu código Rosver'
  const cta = PURPOSE_CTA[purpose] ?? 'Ir a Rosver'
  // Logo con fondo claro (mejor en correo blanco; sinfondo a veces se ve roto/invisible).
  const logoUrl = absoluteBrandUrl(BRAND_KEYS.logoConfondo)
  const siteUrl = siteBaseUrl()
  const codeDigits = code.replace(/\D/g, '')
  const year = new Date().getFullYear()
  const loginUrl = `${siteUrl}/login`

  return `<!DOCTYPE html>
<html lang="es">
<head>
${emailHead(title)}
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Tu código Rosver ${codeDigits} · válido 5 minutos
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F4F6;padding:36px 16px;">
    <tr>
      <td align="center">
        <!-- Card con borde rojo Rosver -->
        <table role="presentation" class="rv-card" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:2px solid #E30613;border-radius:16px;overflow:hidden;">

          <!-- Top bar: logo + Ir a Rosver -->
          <tr>
            <td class="rv-pad" style="padding:22px 28px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${siteUrl}" style="text-decoration:none;">
                      <img src="${logoUrl}" alt="Rosver SAC" width="120" height="40" style="display:block;height:40px;width:auto;max-width:140px;border:0;" />
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <a href="${loginUrl}" style="display:inline-block;padding:8px 14px;font-size:13px;font-weight:700;color:#E30613;text-decoration:none;border:1.5px solid #E30613;border-radius:8px;">
                      Ir a Rosver
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Título + instrucción -->
          <tr>
            <td class="rv-pad" style="padding:20px 28px 8px;">
              <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#0D0D0D;font-weight:800;">
                ${title}
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.55;color:#6B7280;">
                Ingresa este código en la ventana donde empezaste a ${label}:
              </p>
            </td>
          </tr>

          <!-- Código en caja suave + borde rojo -->
          <tr>
            <td class="rv-pad" style="padding:20px 28px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F9FB;border:1.5px solid #E30613;border-radius:12px;">
                <tr>
                  <td align="center" style="padding:22px 16px;">
                    <p style="margin:0;font-size:32px;letter-spacing:0.28em;font-weight:800;color:#0D0D0D;font-family:Consolas,'Courier New',monospace;">
                      ${codeDigits}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:13px;line-height:1.5;color:#6B7280;">
                Válido <strong style="color:#E30613;">5 minutos</strong>. No lo compartas con nadie.
              </p>
            </td>
          </tr>

          <!-- CTA rojo -->
          <tr>
            <td class="rv-pad" style="padding:22px 28px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="border-radius:10px;background:#E30613;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:800;color:#FFFFFF;text-decoration:none;border-radius:10px;">
                      ${cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Footer fuera de la card -->
        <table role="presentation" class="rv-card" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:20px 12px 0;">
              <p style="margin:0;font-size:12px;line-height:1.55;color:#9CA3AF;text-align:center;">
                Si no pediste este código en Rosver SAC, ignora este mensaje.<br />
                © ${year} Rosver SAC ·
                <a href="${siteUrl}" style="color:#E30613;text-decoration:none;">Abrir sitio</a>
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
  const logoUrl = absoluteBrandUrl(BRAND_KEYS.logoConfondo)
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
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F4F6;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="rv-card" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:2px solid #E30613;border-radius:16px;overflow:hidden;">
          <tr>
            <td class="rv-pad" style="padding:22px 28px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${siteUrl}" style="text-decoration:none;">
                      <img src="${logoUrl}" alt="Rosver SAC" width="120" height="40" style="display:block;height:40px;width:auto;max-width:140px;border:0;" />
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <a href="${siteUrl}/contacto" style="display:inline-block;padding:8px 14px;font-size:13px;font-weight:700;color:#E30613;text-decoration:none;border:1.5px solid #E30613;border-radius:8px;">
                      Ir a Rosver
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="rv-pad" style="padding:20px 28px 8px;">
              <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#0D0D0D;font-weight:800;">
                Hola ${safeName}, recibimos tu mensaje
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#6B7280;">
                Gracias por escribir a Rosver SAC. Te responderemos a la brevedad (9:00 a.&nbsp;m. – 8:00 p.&nbsp;m.).
              </p>
            </td>
          </tr>
          <tr>
            <td class="rv-pad" style="padding:18px 28px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F9FB;border:1.5px solid #E30613;border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.12em;color:#9CA3AF;text-transform:uppercase;">Nº de solicitud</p>
                    <p style="margin:0;font-size:18px;font-weight:800;color:#E30613;font-family:Consolas,'Courier New',monospace;">${p.code}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 18px 16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.12em;color:#9CA3AF;text-transform:uppercase;">Tu mensaje</p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:#374151;">${preview}${p.messagePreview.length > 280 ? '…' : ''}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="rv-pad" style="padding:18px 28px 8px;">
              <p style="margin:0 0 12px;font-size:13px;color:#6B7280;">¿Necesitas respuesta más rápida?</p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:10px;background:#25D366;">
                    <a href="${waUrl}" style="display:inline-block;padding:12px 18px;font-size:14px;font-weight:800;color:#FFFFFF;text-decoration:none;">
                      <img src="${waIconUrl}" alt="" width="20" height="20" style="vertical-align:middle;border:0;margin:0 8px 0 0;" />
                      <span style="vertical-align:middle;">WhatsApp</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="rv-pad" style="padding:20px 28px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:10px;background:#E30613;">
                    <a href="${siteUrl}/catalogo" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:800;color:#FFFFFF;text-decoration:none;">Ver catálogo</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:20px 12px 0;">
              <p style="margin:0;font-size:12px;line-height:1.55;color:#9CA3AF;">
                © ${year} Rosver SAC ·
                <a href="${siteUrl}" style="color:#E30613;text-decoration:none;">Abrir sitio</a>
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
