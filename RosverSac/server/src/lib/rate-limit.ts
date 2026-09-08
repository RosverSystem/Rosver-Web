/**
 * Limitador de intentos en memoria (ventana deslizante simple).
 * No requiere Redis; se degrada por instancia si el proceso corre en
 * múltiples réplicas, pero sigue frenando fuerza bruta básica contra
 * login/OTP. Si en el futuro se necesita HA real, mover a Redis (ya
 * está disponible como dependencia opcional en lib/redis.ts).
 */
type Bucket = { failures: number; firstFailureAt: number; lockedUntil: number | null }

class AttemptLimiter {
  private buckets = new Map<string, Bucket>()

  constructor(
    private readonly maxFailures: number,
    private readonly windowMs: number,
    private readonly lockoutMs: number,
  ) {}

  private prune(now: number) {
    if (this.buckets.size < 5000) return
    for (const [key, bucket] of this.buckets) {
      const expired =
        (bucket.lockedUntil && bucket.lockedUntil < now) ||
        (!bucket.lockedUntil && now - bucket.firstFailureAt > this.windowMs)
      if (expired) this.buckets.delete(key)
    }
  }

  /** true si la clave está bloqueada por demasiados intentos fallidos. */
  isLocked(key: string): { locked: boolean; retryAfterSec?: number } {
    const bucket = this.buckets.get(key)
    if (!bucket?.lockedUntil) return { locked: false }
    const now = Date.now()
    if (bucket.lockedUntil <= now) {
      this.buckets.delete(key)
      return { locked: false }
    }
    return { locked: true, retryAfterSec: Math.ceil((bucket.lockedUntil - now) / 1000) }
  }

  recordFailure(key: string) {
    const now = Date.now()
    this.prune(now)
    const bucket = this.buckets.get(key)
    if (!bucket || now - bucket.firstFailureAt > this.windowMs) {
      this.buckets.set(key, { failures: 1, firstFailureAt: now, lockedUntil: null })
      return
    }
    bucket.failures += 1
    if (bucket.failures >= this.maxFailures) {
      bucket.lockedUntil = now + this.lockoutMs
    }
  }

  recordSuccess(key: string) {
    this.buckets.delete(key)
  }
}

/** Por cuenta: 5 fallos en 10 min → bloqueo 5 min. */
export const loginLimiterByEmail = new AttemptLimiter(5, 10 * 60 * 1000, 5 * 60 * 1000)
/** Por IP: 20 fallos en 10 min (protege contra spray de credenciales) → bloqueo 5 min. */
export const loginLimiterByIp = new AttemptLimiter(20, 10 * 60 * 1000, 5 * 60 * 1000)

export const loginLimiter = {
  check(email: string, ip: string) {
    const byEmail = loginLimiterByEmail.isLocked(email)
    if (byEmail.locked) return byEmail
    return loginLimiterByIp.isLocked(ip)
  },
  recordFailure(email: string, ip: string) {
    loginLimiterByEmail.recordFailure(email)
    loginLimiterByIp.recordFailure(ip)
  },
  recordSuccess(email: string, ip: string) {
    loginLimiterByEmail.recordSuccess(email)
    loginLimiterByIp.recordSuccess(ip)
  },
}

export function requestIp(headers: {
  get(name: string): string | null | undefined
}): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  )
}
