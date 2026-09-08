import argon2 from 'argon2'
import { createHash, randomBytes, randomInt } from 'node:crypto'

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id })
}

export async function verifyPassword(hash: string, password: string) {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function randomOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function pickDefaultAvatar(seed?: string) {
  const n = seed
    ? (Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0) % 5) + 1
    : randomInt(1, 6)
  return `/avatars/default-${n}.svg`
}
