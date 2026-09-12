const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''

export class ApiError extends Error {
  status: number
  payload: unknown
  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    message?: string
  } & T

  if (!res.ok) {
    throw new ApiError(
      data.error || data.message || 'Error de servidor',
      res.status,
      data,
    )
  }
  return data
}
