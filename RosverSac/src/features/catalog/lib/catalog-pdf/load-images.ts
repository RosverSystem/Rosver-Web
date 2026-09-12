/** Convierte URL de imagen (relativa o absoluta) a data URL para react-pdf. */
export async function urlToDataUrl(
  url: string | undefined | null,
  timeoutMs = 8000,
): Promise<string | null> {
  if (!url?.trim()) return null
  let href = url.trim()
  if (href.startsWith('/')) {
    href = `${window.location.origin}${href}`
  }
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(href, { signal: ctrl.signal, mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/') && blob.type !== 'application/octet-stream') {
      // R2 a veces sin content-type; intentar igual
      if (blob.size < 32) return null
    }
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('read'))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

/** Carga en lotes para no saturar red. */
export async function loadImagesInBatches(
  urls: (string | undefined | null)[],
  batchSize = 6,
  onProgress?: (done: number, total: number) => void,
): Promise<(string | null)[]> {
  const out: (string | null)[] = new Array(urls.length).fill(null)
  let done = 0
  for (let i = 0; i < urls.length; i += batchSize) {
    const slice = urls.slice(i, i + batchSize)
    const part = await Promise.all(slice.map((u) => urlToDataUrl(u)))
    for (let j = 0; j < part.length; j++) {
      out[i + j] = part[j] ?? null
      done++
      onProgress?.(done, urls.length)
    }
  }
  return out
}
