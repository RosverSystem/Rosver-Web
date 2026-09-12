/**
 * Prueba real de SMTP Hostinger (misma config que producción).
 * Uso: npx tsx server/scripts/test-smtp-send.ts [email]
 */
import nodemailer from 'nodemailer'
import { config } from '../src/config.js'

const to = process.argv[2] || 'acosta.wp076@gmail.com'

async function trySend(label: string, opts: Record<string, unknown>) {
  console.log(`\n==> ${label}`)
  console.log(
    JSON.stringify(
      {
        host: opts.host,
        port: opts.port,
        secure: opts.secure,
        requireTLS: opts.requireTLS,
        family: opts.family,
        user: config.smtp.user,
        passLen: config.smtp.pass?.length ?? 0,
      },
      null,
      2,
    ),
  )
  const t = nodemailer.createTransport({
    ...opts,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 25_000,
  } as nodemailer.TransportOptions)
  try {
    await t.verify()
    console.log('verify: OK')
  } catch (e) {
    console.error('verify FAIL:', e instanceof Error ? e.message : e)
  }
  try {
    const info = await t.sendMail({
      from: config.smtp.from,
      to,
      subject: `Rosver SMTP test ${label} ${new Date().toISOString()}`,
      text: `Prueba de envío SMTP (${label}) desde Rosver. Si ves esto, el correo funciona.`,
    })
    console.log('send: OK', info.messageId)
    return true
  } catch (e) {
    console.error('send FAIL:', e instanceof Error ? e.message : e)
    return false
  }
}

async function main() {
  if (!config.smtp.pass) {
    console.error('Falta SMTP_PASS')
    process.exit(1)
  }
  console.log('To:', to)
  const a = await trySend('587 STARTTLS IPv4', {
    host: config.smtp.host,
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
  })
  if (a) {
    console.log('\nÉXITO con 587/IPv4')
    process.exit(0)
  }
  const b = await trySend('465 SSL IPv4', {
    host: config.smtp.host,
    port: 465,
    secure: true,
    family: 4,
  })
  if (b) {
    console.log('\nÉXITO con 465/IPv4')
    process.exit(0)
  }
  // Direct to Cloudflare IP (A record)
  const c = await trySend('587 via 172.65.255.143 IPv4', {
    host: '172.65.255.143',
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    tls: { servername: 'smtp.hostinger.com' },
  })
  if (c) {
    console.log('\nÉXITO con IP directa')
    process.exit(0)
  }
  console.error('\nTODOS los intentos fallaron')
  process.exit(2)
}

main()
