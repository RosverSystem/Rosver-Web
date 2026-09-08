const UNITS = [
  '',
  'UNO',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
]
const TEENS = [
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
]
const TENS = [
  '',
  '',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
]
const VEINTI = [
  '',
  'VEINTIUNO',
  'VEINTIDÓS',
  'VEINTITRÉS',
  'VEINTICUATRO',
  'VEINTICINCO',
  'VEINTISÉIS',
  'VEINTISIETE',
  'VEINTIOCHO',
  'VEINTINUEVE',
]
const HUNDREDS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
]

function underThousand(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'CIEN'
  const h = Math.floor(n / 100)
  const r = n % 100
  const parts: string[] = []
  if (h > 0) parts.push(HUNDREDS[h]!)
  if (r >= 10 && r < 20) {
    parts.push(TEENS[r - 10]!)
  } else if (r >= 20 && r < 30) {
    const u = r % 10
    parts.push(u === 0 ? 'VEINTE' : VEINTI[u]!)
  } else {
    const t = Math.floor(r / 10)
    const u = r % 10
    if (t > 0) parts.push(TENS[t]!)
    if (u > 0) {
      if (t > 0) parts.push('Y')
      parts.push(UNITS[u]!)
    }
  }
  return parts.filter(Boolean).join(' ')
}

/** Monto en letras PE: "SEISCIENTOS DIEZ CON 00/100 SOLES" */
export function amountToWordsEs(amount: number): string {
  const safe = Math.max(0, Math.round(amount * 100) / 100)
  const ints = Math.floor(safe)
  const cents = Math.round((safe - ints) * 100)
  const centStr = String(cents).padStart(2, '0')

  if (ints === 0) return `CERO CON ${centStr}/100 SOLES`

  const millions = Math.floor(ints / 1_000_000)
  const thousands = Math.floor((ints % 1_000_000) / 1000)
  const rest = ints % 1000
  const parts: string[] = []

  if (millions > 0) {
    parts.push(
      millions === 1 ? 'UN MILLÓN' : `${underThousand(millions)} MILLONES`,
    )
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'MIL' : `${underThousand(thousands)} MIL`)
  }
  if (rest > 0) parts.push(underThousand(rest))

  return `${parts.join(' ')} CON ${centStr}/100 SOLES`
}
