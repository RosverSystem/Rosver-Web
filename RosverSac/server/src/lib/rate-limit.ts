import { getRedisClient } from './redis.js'

/**
 * Limitador de intentos (ventana fija). Usa Redis cuando está configurado
 * (`REDIS_URL`) para que el límite sea compartido entre instancias del API;
 * si Redis no está disponible o falla, se degrada a un contador en memoria
 * del propio proceso (sigue frenando fuerza bruta básica, pero por instancia).
 */
type LockResult = { locked: boolean; retryAfterSec?: number }

type Bucket = { failures: number; firstFailureAt: number; lockedUntil: number | null }

class MemoryAttemptLimiter {
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

  isLocked(key: string): LockResult {
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

class AttemptLimiter {
  private memory: MemoryAttemptLimiter
  private prefix: string

  constructor(
    name: string,
    private readonly maxFailures: number,
    private readonly windowMs: number,
    private readonly lockoutMs: number,
  ) {
    this.memory = new MemoryAttemptLimiter(maxFailures, windowMs, lockoutMs)
    this.prefix = `rosver:ratelimit:${name}:`
  }

  async isLocked(key: string): Promise<LockResult> {
    const r = getRedisClient()
    if (!r) return this.memory.isLocked(key)
    try {
      const pttl = await r.pttl(`${this.prefix}${key}:locked`)
      if (pttl > 0) return { locked: true, retryAfterSec: Math.ceil(pttl / 1000) }
      return { locked: false }
    } catch {
      return this.memory.isLocked(key)
    }
  }

  async recordFailure(key: string) {
    const r = getRedisClient()
    if (!r) return this.memory.recordFailure(key)
    try {
      const countKey = `${this.prefix}${key}:count`
      const failures = await r.incr(countKey)
      if (failures === 1) await r.pexpire(countKey, this.windowMs)
      if (failures >= this.maxFailures) {
        await r.set(`${this.prefix}${key}:locked`, '1', 'PX', this.lockoutMs)
      }
    } catch {
      this.memory.recordFailure(key)
    }
  }

  async recordSuccess(key: string) {
    const r = getRedisClient()
    if (!r) return this.memory.recordSuccess(key)
    try {
      await r.del(`${this.prefix}${key}:count`, `${this.prefix}${key}:locked`)
    } catch {
      this.memory.recordSuccess(key)
    }
  }
}

/** Por cuenta: 5 fallos en 10 min → bloqueo 5 min. */
export const loginLimiterByEmail = new AttemptLimiter('login-email', 5, 10 * 60 * 1000, 5 * 60 * 1000)
/** Por IP: 20 fallos en 10 min (protege contra spray de credenciales) → bloqueo 5 min. */
export const loginLimiterByIp = new AttemptLimiter('login-ip', 20, 10 * 60 * 1000, 5 * 60 * 1000)

export const loginLimiter = {
  async check(email: string, ip: string): Promise<LockResult> {
    const byEmail = await loginLimiterByEmail.isLocked(email)
    if (byEmail.locked) return byEmail
    return loginLimiterByIp.isLocked(ip)
  },
  async recordFailure(email: string, ip: string) {
    await Promise.all([loginLimiterByEmail.recordFailure(email), loginLimiterByIp.recordFailure(ip)])
  },
  async recordSuccess(email: string, ip: string) {
    await Promise.all([loginLimiterByEmail.recordSuccess(email), loginLimiterByIp.recordSuccess(ip)])
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
