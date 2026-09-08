import {
  generateSecret,
  generateURI,
  verify,
} from 'otplib'
import QRCode from 'qrcode'

export function generateTotpSecret() {
  return generateSecret()
}

export function buildOtpauthUrl(params: {
  email: string
  secret: string
  issuer?: string
}) {
  return generateURI({
    issuer: params.issuer ?? 'Rosver SAC',
    label: params.email,
    secret: params.secret,
  })
}

export async function verifyTotpCode(secret: string, code: string) {
  const result = await verify({ secret, token: code.trim() })
  return Boolean(result.valid)
}

export async function totpQrDataUrl(otpauthUrl: string) {
  return QRCode.toDataURL(otpauthUrl, {
    margin: 1,
    width: 220,
    color: { dark: '#0D0D0D', light: '#FFFFFF' },
  })
}
