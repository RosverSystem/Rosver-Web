import { api, ApiError } from '@/shared/lib/api'
import { cn, formatInternalCode } from '@/shared/lib'
import { gsap } from '@/shared/lib/gsap'
import { AdminModal } from '@/shared/ui/admin-modal'
import { Upload } from 'cssvg-icons'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react'

type ImportPriceLine = {
  unitCode: 'unidad' | 'docena' | 'caja'
  contentQty: number
  label: string
  listAmount: number | null
  wholesaleAmount: number | null
}

type ImportProductDraft = {
  sku: string
  code?: number | null
  name: string
  brandName: string
  contentPerBox: number | null
  prices: ImportPriceLine[]
  sourceSheet: string
  warnings: string[]
}

type SkipIssue = {
  row: number
  cell?: string
  sheet?: string
  reason: string
  raw?: string
}

type ParseResult = {
  sourceFileName: string
  sheetUsed: string
  products: ImportProductDraft[]
  skipped: SkipIssue[]
  stats: {
    totalRows: number
    products: number
    withPrices: number
    warnings: number
  }
}

type OverwriteItem = {
  id: string
  sku: string
  name: string
  code: number
  codeLabel: string
  matchBy?: 'sku' | 'code'
}

type CommitErrorItem = { sku: string; error: string }

type Phase =
  | 'pick'
  | 'console'
  | 'parse-issues'
  | 'preview'
  | 'committing'
  | 'done'
  | 'error'

type Props = {
  open: boolean
  onClose: () => void
  onImported: () => void
}

function TerminalShell({
  title,
  children,
  progress,
}: {
  title: string
  children: ReactNode
  progress: number
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d10] shadow-2xl shadow-rosver-ink/40">
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#14181f] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <p className="ml-2 truncate font-mono text-[11px] text-white/55">
          {title}
        </p>
      </div>
      <div className="h-1.5 bg-white/5">
        <div
          className="h-full bg-rosver-red"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      <div className="max-h-[42vh] min-h-[220px] overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-white/90 sm:text-[13px]">
        {children}
      </div>
    </div>
  )
}

/**
 * Modal grande: subir Excel ELFA → consola animada → preview → confirmar.
 */
export function ProductImportModal({ open, onClose, onImported }: Props) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [file, setFile] = useState<File | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [parse, setParse] = useState<ParseResult | null>(null)
  const [compatIssues, setCompatIssues] = useState<SkipIssue[]>([])
  const [commitErrors, setCommitErrors] = useState<CommitErrorItem[]>([])
  const [overwrites, setOverwrites] = useState<OverwriteItem[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [commitSummary, setCommitSummary] = useState<{
    createdCount: number
    updatedCount: number
    errorCount: number
    archiveSaved: boolean
    privateKey?: string
  } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const [receivePct, setReceivePct] = useState(0)
  const consoleRef = useRef<HTMLDivElement>(null)
  const progressObj = useRef({ value: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const dragDepth = useRef(0)
  const aliveRef = useRef(true)
  const tweensRef = useRef<gsap.core.Tween[]>([])

  function killTweens() {
    for (const t of tweensRef.current) t.kill()
    tweensRef.current = []
    if (iconRef.current) gsap.killTweensOf(iconRef.current)
    if (dropRef.current) gsap.killTweensOf(dropRef.current)
    gsap.killTweensOf(progressObj.current)
  }

  function reset() {
    killTweens()
    setPhase('pick')
    setFile(null)
    setLines([])
    setProgress(0)
    setParse(null)
    setCompatIssues([])
    setCommitErrors([])
    setOverwrites([])
    setErrorMsg('')
    setCommitSummary(null)
    setDragging(false)
    setReceiving(false)
    setReceivePct(0)
    progressObj.current.value = 0
    dragDepth.current = 0
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      killTweens()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!open) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!consoleRef.current) return
    consoleRef.current.scrollTop = consoleRef.current.scrollHeight
  }, [lines])

  function animateProgress(to: number, duration = 0.45) {
    const tween = gsap.to(progressObj.current, {
      value: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (!aliveRef.current) return
        setProgress(Math.round(progressObj.current.value))
      },
    })
    tweensRef.current.push(tween)
  }

  /** Una línea completa por tick (sin setState por carácter → evita crash/HMR). */
  async function typeLines(next: string[], opts?: { clear?: boolean; delayMs?: number }) {
    if (opts?.clear && aliveRef.current) setLines([])
    const delay = opts?.delayMs ?? 40
    for (const line of next) {
      if (!aliveRef.current) return
      setLines((prev) => [...prev, line])
      if (delay > 0) await new Promise((r) => setTimeout(r, delay))
    }
  }

  /** Varias líneas en un solo setState (post-API: evita quedar a medias si hay remount). */
  function pushLines(next: string[], opts?: { clear?: boolean }) {
    if (!aliveRef.current) return
    if (opts?.clear) setLines(next)
    else setLines((prev) => [...prev, ...next])
  }

  async function downloadTemplate(kind: 'example' | 'elfa' | 'xlsx') {
    // Excel: archivo estático en public/ (sin API → sin 401 / sesión)
    if (kind === 'xlsx') {
      try {
        const a = document.createElement('a')
        a.href = '/import-templates/rosver-productos-importacion-plantilla.xlsx'
        a.download = 'rosver-productos-importacion-plantilla.xlsx'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setErrorMsg('')
      } catch {
        setErrorMsg('No se pudo descargar la plantilla Excel.')
      }
      return
    }

    const path =
      kind === 'example'
        ? '/api/admin/imports/products/template'
        : '/api/admin/imports/products/elfa-json'
    try {
      const res = await fetch(path, { credentials: 'include' })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(
          data?.error ||
            (res.status === 401
              ? 'Sesión vencida. Vuelve a iniciar sesión.'
              : `No se pudo descargar (${res.status})`),
        )
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        kind === 'example'
          ? 'rosver-products-import.v1.example.json'
          : 'products-elfa-rosver-import.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setErrorMsg('')
    } catch (e) {
      setErrorMsg(
        e instanceof Error
          ? e.message
          : 'No se pudo descargar la plantilla.',
      )
    }
  }

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (f) void acceptFile(f)
    else setFile(null)
  }

  function isImportFile(f: File) {
    return (
      /\.(xlsx?|json|csv)$/i.test(f.name) ||
      f.type.includes('sheet') ||
      f.type.includes('excel') ||
      f.type.includes('json') ||
      f.type === 'text/csv'
    )
  }

  async function acceptFile(f: File) {
    if (!isImportFile(f)) {
      setErrorMsg('Solo archivos .xlsx / .xls / .json / .csv (formato Rosver)')
      setFile(null)
      return
    }
    setErrorMsg('')
    setReceiving(true)
    setReceivePct(0)
    killTweens()

    if (iconRef.current) {
      tweensRef.current.push(
        gsap.fromTo(
          iconRef.current,
          { y: 10, opacity: 0.5 },
          {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out',
            yoyo: true,
            repeat: 2,
          },
        ),
      )
    }

    const proxy = { value: 0 }
    await new Promise<void>((resolve) => {
      const tween = gsap.to(proxy, {
        value: 100,
        duration: 0.85,
        ease: 'power1.inOut',
        onUpdate: () => {
          if (!aliveRef.current) return
          setReceivePct(Math.round(proxy.value))
        },
        onComplete: () => resolve(),
      })
      tweensRef.current.push(tween)
    })

    if (!aliveRef.current) return
    setFile(f)
    setReceiving(false)
    setReceivePct(100)
    killTweens()
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current += 1
    setDragging(true)
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = 0
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void acceptFile(f)
  }

  async function startParse() {
    if (!file) {
      setErrorMsg('Elige un archivo .xlsx, .json o .csv')
      return
    }
    const fmt = /\.json$/i.test(file.name) ? 'rosver-json-v1' : /\.csv$/i.test(file.name) ? 'rosver-csv-v1' : 'elfa-xlsx'
    killTweens()
    setPhase('console')
    setErrorMsg('')
    setParse(null)
    setCompatIssues([])
    setOverwrites([])
    setLines([])
    animateProgress(12)
    await typeLines(
      [
        `rosver@import:~$ prepare --format ${fmt}`,
        `> archivo: ${file.name}`,
        `> tamaño: ${(file.size / 1024).toFixed(1)} KB`,
        fmt === 'elfa-xlsx' ? '> leyendo hojas Excel…' : '> leyendo JSON…',
      ],
      { clear: true, delayMs: 35 },
    )
    animateProgress(35)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api<{ parse: ParseResult; overwrites?: OverwriteItem[] }>(
        '/api/admin/imports/products/parse',
        { method: 'POST', body: fd },
      )
      if (!aliveRef.current) return

      const parsed = res.parse
      if (!parsed?.stats) {
        throw new Error('Respuesta de parse incompleta')
      }
      const ow = Array.isArray(res.overwrites) ? res.overwrites : []
      const skipped = Array.isArray(parsed.skipped) ? parsed.skipped : []

      const resultLines: string[] = [
        `> formato: ${parsed.sheetUsed || fmt}`,
        `> filas: ${parsed.stats.totalRows}`,
        `> productos detectados: ${parsed.stats.products}`,
        `> con precios: ${parsed.stats.withPrices}`,
        ow.length
          ? `> se sobrescribirán: ${ow.length} (SKU ya existe)`
          : '> sin sobrescrituras',
        parsed.stats.warnings
          ? `> avisos: ${parsed.stats.warnings}`
          : '> avisos: 0',
        skipped.length > 0
          ? `! conversión con ${skipped.length} problema(s) — no se pasa a previa aún`
          : '> conversión OK',
      ]

      if (skipped.length > 0) {
        resultLines.push(
          `> avisos de compatibilidad: ${skipped.length}`,
          ...skipped.slice(0, 8).map((s) => {
            const where = s.cell ? `celda ${s.cell}` : `fila ${s.row}`
            const sheet = s.sheet ? ` · ${s.sheet}` : ''
            return `! ${where}${sheet}: ${s.reason}`
          }),
        )
        if (skipped.length > 8) {
          resultLines.push(
            `> …y ${skipped.length - 8} más (ver lista abajo)`,
          )
        } else {
          resultLines.push('> revisa la lista antes de aceptar')
        }
      }

      if (ow.length > 0) {
        resultLines.push(
          `! advertencia: ${ow.length} producto(s) se actualizarán`,
          ...ow.slice(0, 6).map((o) => {
            const label = o.codeLabel || String(o.code ?? '')
            const name = (o.name || '').slice(0, 40)
            return `! SKU ${o.sku} · cód. ${label} · «${name}»`
          }),
        )
        resultLines.push(
          ow.length > 6
            ? `! …y ${ow.length - 6} más`
            : '> confirma en la previa',
        )
      }

      // Un solo setState: si Vite remonta, no nos quedamos a medias en «formato: …»
      pushLines(resultLines)
      animateProgress(100)
      setParse(parsed)
      setOverwrites(ow)
      setCompatIssues(skipped)
      setCommitErrors([])
      await new Promise((r) => setTimeout(r, 280))
      if (!aliveRef.current) return

      // Errores de celdas → se quedan en la 1ª consola (no saltar a previa)
      if (parsed.products.length === 0) {
        setErrorMsg(
          skipped.length
            ? `No hay productos válidos (${skipped.length} problema(s) en el archivo).`
            : 'No se detectaron productos válidos.',
        )
        setPhase('error')
        return
      }
      if (skipped.length > 0) {
        setErrorMsg(
          `Se detectaron ${skipped.length} problema(s) en el Excel. Corrígelos o continúa solo con los ${parsed.products.length} producto(s) válidos.`,
        )
        setPhase('parse-issues')
        return
      }
      setPhase('preview')
    } catch (e) {
      const payload =
        e instanceof ApiError
          ? (e.payload as { parse?: ParseResult; error?: string } | undefined)
          : undefined
      const failedParse = payload?.parse
      const issues = failedParse?.skipped ?? []
      setCompatIssues(issues)
      if (failedParse) setParse(failedParse)

      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'No se pudo convertir el archivo'
      const detail =
        issues.length > 0
          ? `${msg} — ${issues.length} problema(s) en celdas.`
          : msg
      setErrorMsg(detail)

      const issueLines = issues.slice(0, 10).map((s) => {
        const where = s.cell ? `celda ${s.cell}` : `fila ${s.row}`
        return `! ${where}: ${s.reason}`
      })
      await typeLines([
        `! error: ${msg}`,
        ...(issueLines.length
          ? issueLines
          : ['! El archivo no es compatible con el formato ELFA / JSON Rosver.']),
        '> puedes reintentar con otro archivo',
      ])
      animateProgress(100)
      setPhase('error')
    }
  }

  async function commitImport() {
    if (!parse) return
    setPhase('committing')
    setErrorMsg('')
    setCompatIssues([])
    setCommitErrors([])
    animateProgress(8)
    await typeLines(
      [
        'rosver@import:~$ commit --confirm',
        '> modo: agregar al catálogo',
        `> productos a subir: ${parse.products.length}`,
        overwrites.length
          ? `> sobrescrituras: ${overwrites.length}`
          : '> sobrescrituras: 0',
        '> escribiendo en Postgres…',
      ],
      { clear: true },
    )
    animateProgress(40)
    try {
      const res = await api<{
        createdCount: number
        updatedCount?: number
        errorCount: number
        archiveSaved: boolean
        privateArchive: { bucket: string; key: string } | null
      }>('/api/admin/imports/products/commit', {
        method: 'POST',
        body: JSON.stringify({
          products: parse.products,
          sourceFileName: parse.sourceFileName,
        }),
      })
      animateProgress(85)
      await typeLines([
        `> creados: ${res.createdCount}`,
        `> actualizados: ${res.updatedCount ?? 0}`,
        `> errores: ${res.errorCount}`,
        res.archiveSaved
          ? `> archivo privado R2: ${res.privateArchive?.key ?? 'ok'}`
          : '> aviso: JSON no archivado en R2 privado',
        '> listo',
      ])
      animateProgress(100)
      setCommitSummary({
        createdCount: res.createdCount,
        updatedCount: res.updatedCount ?? 0,
        errorCount: res.errorCount,
        archiveSaved: res.archiveSaved,
        privateKey: res.privateArchive?.key,
      })
      setPhase('done')
      onImported()
    } catch (e) {
      const payload =
        e instanceof ApiError
          ? (e.payload as
              | { errors?: CommitErrorItem[]; error?: string }
              | undefined)
          : undefined
      const dbErrors = Array.isArray(payload?.errors) ? payload.errors : []
      setCommitErrors(dbErrors)
      setCompatIssues([])
      const msg =
        e instanceof ApiError ? e.message : 'No se pudo guardar la importación'
      setErrorMsg(msg)
      await typeLines([
        `! error: ${msg}`,
        ...dbErrors
          .slice(0, 8)
          .map((er) => `! SKU ${er.sku}: ${er.error}`),
        dbErrors.length > 8 ? `! …y ${dbErrors.length - 8} más` : '',
        '> reintenta o cancela',
      ].filter(Boolean))
      animateProgress(100)
      setPhase('error')
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={handleClose}
      title="Importar productos"
      size="full"
      closeOnBackdrop={false}
      closeOnEscape={phase !== 'console' && phase !== 'committing'}
      footer={
        <>
          {phase === 'pick' || phase === 'error' || phase === 'parse-issues' ? (
            <button
              type="button"
              onClick={handleClose}
              className="h-11 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
            >
              Cancelar
            </button>
          ) : null}
          {phase === 'pick' ? (
            <button
              type="button"
              onClick={() => void startParse()}
              disabled={!file || receiving}
              className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark disabled:opacity-50"
            >
              Convertir Excel
            </button>
          ) : null}
          {phase === 'parse-issues' && parse && parse.products.length > 0 ? (
            <button
              type="button"
              onClick={() => setPhase('preview')}
              className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark"
            >
              Continuar con {parse.products.length} válido
              {parse.products.length === 1 ? '' : 's'}
            </button>
          ) : null}
          {phase === 'preview' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="h-11 rounded-xl border border-rosver-line px-4 text-sm font-semibold text-rosver-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void commitImport()}
                className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark"
              >
                {overwrites.length > 0
                  ? `Aceptar (${overwrites.length} sobrescritura${overwrites.length === 1 ? '' : 's'})`
                  : 'Aceptar e importar'}
              </button>
            </>
          ) : null}
          {phase === 'error' ? (
            <button
              type="button"
              onClick={() => {
                setPhase('pick')
                setErrorMsg('')
                setCommitErrors([])
              }}
              className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark"
            >
              Elegir otro archivo
            </button>
          ) : null}
          {phase === 'done' ? (
            <button
              type="button"
              onClick={handleClose}
              className="h-11 rounded-xl bg-rosver-red px-5 text-sm font-semibold text-white hover:bg-rosver-red-dark"
            >
              Cerrar
            </button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4">
        {phase === 'pick' ? (
          <div className="space-y-4">
            <p className="text-sm text-rosver-muted">
              Descarga la plantilla Excel completa (columnas + ejemplos),
              complétala y súbela aquí. También acepta JSON Rosver.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void downloadTemplate('xlsx')}
                className="inline-flex h-10 items-center rounded-xl bg-rosver-red px-3 text-xs font-semibold text-white hover:bg-rosver-red-dark"
              >
                Descargar plantilla Excel
              </button>
              <button
                type="button"
                onClick={() => void downloadTemplate('example')}
                className="inline-flex h-10 items-center rounded-xl border border-rosver-line px-3 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
              >
                Plantilla JSON (ejemplo)
              </button>
              <button
                type="button"
                onClick={() => void downloadTemplate('elfa')}
                className="inline-flex h-10 items-center rounded-xl border border-rosver-line px-3 text-xs font-semibold text-rosver-ink hover:border-rosver-red/40 hover:text-rosver-red"
              >
                JSON ELFA guardado
              </button>
            </div>
            <div
              ref={dropRef}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              className={cn(
                'relative overflow-hidden rounded-2xl border-2 border-dashed px-4 py-10 transition',
                dragging
                  ? 'border-rosver-red bg-rosver-red/5'
                  : receiving
                    ? 'border-rosver-red/60 bg-rosver-soft/60'
                    : file
                      ? 'border-rosver-success/50 bg-rosver-success/5'
                      : 'border-rosver-line bg-rosver-soft/40 hover:border-rosver-red/45',
              )}
            >
              {receiving ? (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-rosver-line/60"
                  aria-hidden
                >
                  <div
                    className="h-full bg-rosver-red transition-[width] duration-75"
                    style={{ width: `${receivePct}%` }}
                  />
                </div>
              ) : null}

              <label
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-3',
                  receiving && 'pointer-events-none',
                )}
              >
                <div
                  ref={iconRef}
                  className={cn(
                    'relative flex size-14 items-center justify-center rounded-2xl',
                    receiving
                      ? 'bg-rosver-red text-white'
                      : file
                        ? 'bg-rosver-success/15 text-rosver-success'
                        : 'bg-white text-rosver-red shadow-sm',
                  )}
                >
                  <Upload size={26} color="currentColor" strokeWidth={2} />
                  {receiving ? (
                    <span
                      className="absolute -inset-1 animate-ping rounded-2xl border border-rosver-red/40"
                      aria-hidden
                    />
                  ) : null}
                </div>

                <span className="text-sm font-semibold text-rosver-ink">
                  {receiving
                    ? `Subiendo… ${receivePct}%`
                    : dragging
                      ? 'Suelta el Excel aquí'
                      : file
                        ? file.name
                        : 'Arrastra o elige .xlsx / .json / .csv'}
                </span>
                <span className="text-xs text-rosver-muted">
                  {receiving
                    ? 'Preparando el archivo para convertir'
                    : file
                      ? `${(file.size / 1024).toFixed(1)} KB · listo para convertir`
                      : 'Excel ELFA o formato rosver-products-import'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.json,.csv,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  disabled={receiving}
                  onChange={onPickFile}
                />
              </label>
            </div>
            {errorMsg ? (
              <p className="text-sm font-medium text-rosver-red">{errorMsg}</p>
            ) : null}
          </div>
        ) : null}

        {phase === 'console' ||
        phase === 'parse-issues' ||
        phase === 'committing' ||
        phase === 'error' ||
        phase === 'done' ? (
          <div ref={consoleRef}>
            <TerminalShell
              title={`rosver-import — ${file?.name ?? 'bash'}`}
              progress={progress}
            >
              {lines.map((line, i) => (
                <p
                  key={`${i}-${line.slice(0, 12)}`}
                  className={cn(
                    'whitespace-pre-wrap',
                    line.startsWith('rosver@') && 'text-cyan-300',
                    line.startsWith('!') && 'text-rosver-red',
                    line.startsWith('>') && 'text-white/80',
                  )}
                >
                  {line}
                  {i === lines.length - 1 &&
                  (phase === 'console' || phase === 'committing') ? (
                    <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-white align-middle" />
                  ) : null}
                </p>
              ))}
            </TerminalShell>
            {phase === 'done' && commitSummary ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-rosver-line bg-rosver-soft/50 p-3">
                  <p className="text-[10px] font-bold tracking-wide text-rosver-muted uppercase">
                    Creados
                  </p>
                  <p className="mt-1 text-xl font-bold text-rosver-success">
                    {commitSummary.createdCount}
                  </p>
                </div>
                <div className="rounded-xl border border-rosver-line bg-rosver-soft/50 p-3">
                  <p className="text-[10px] font-bold tracking-wide text-rosver-muted uppercase">
                    Actualizados
                  </p>
                  <p className="mt-1 text-xl font-bold text-rosver-blue">
                    {commitSummary.updatedCount}
                  </p>
                </div>
                <div className="rounded-xl border border-rosver-line bg-rosver-soft/50 p-3">
                  <p className="text-[10px] font-bold tracking-wide text-rosver-muted uppercase">
                    Errores
                  </p>
                  <p className="mt-1 text-xl font-bold text-rosver-red">
                    {commitSummary.errorCount}
                  </p>
                </div>
                <div className="rounded-xl border border-rosver-line bg-rosver-soft/50 p-3">
                  <p className="text-[10px] font-bold tracking-wide text-rosver-muted uppercase">
                    JSON privado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-rosver-ink">
                    {commitSummary.archiveSaved
                      ? commitSummary.privateKey ?? 'Guardado'
                      : 'No guardado'}
                  </p>
                </div>
              </div>
            ) : null}
            {(phase === 'error' || phase === 'parse-issues') && errorMsg ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-rosver-red">{errorMsg}</p>
                {commitErrors.length > 0 ? (
                  <ul className="max-h-40 overflow-auto rounded-xl border border-rosver-red/25 bg-rosver-red/5 p-3 text-xs text-rosver-ink">
                    {commitErrors.map((er, i) => (
                      <li key={`${er.sku}-${i}`} className="py-1">
                        <span className="font-mono font-semibold text-rosver-red">
                          {er.sku}
                        </span>
                        <span className="mt-0.5 block">{er.error}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {compatIssues.length > 0 ? (
                  <ul className="max-h-40 overflow-auto rounded-xl border border-rosver-red/25 bg-rosver-red/5 p-3 text-xs text-rosver-ink">
                    {compatIssues.map((s, i) => (
                      <li key={`${s.cell ?? s.row}-${i}`} className="py-1">
                        <span className="font-mono font-semibold text-rosver-red">
                          {s.cell ?? `fila ${s.row}`}
                        </span>
                        {s.sheet ? (
                          <span className="text-rosver-muted"> · {s.sheet}</span>
                        ) : null}
                        <span className="mt-0.5 block">{s.reason}</span>
                        {s.raw ? (
                          <span className="text-rosver-muted">
                            Valor: «{s.raw}»
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {phase === 'preview' && parse ? (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-rosver-line p-3">
                <p className="text-[10px] font-bold text-rosver-muted uppercase">
                  Productos
                </p>
                <p className="text-xl font-bold text-rosver-ink">
                  {parse.stats.products}
                </p>
              </div>
              <div className="rounded-xl border border-rosver-line p-3">
                <p className="text-[10px] font-bold text-rosver-muted uppercase">
                  Con precios
                </p>
                <p className="text-xl font-bold text-rosver-success">
                  {parse.stats.withPrices}
                </p>
              </div>
              <div className="rounded-xl border border-rosver-yellow/50 bg-rosver-yellow/10 p-3">
                <p className="text-[10px] font-bold text-rosver-muted uppercase">
                  Se sobrescriben
                </p>
                <p className="text-xl font-bold text-rosver-ink">
                  {overwrites.length}
                </p>
              </div>
              <div className="rounded-xl border border-rosver-line p-3">
                <p className="text-[10px] font-bold text-rosver-muted uppercase">
                  Avisos
                </p>
                <p className="text-xl font-bold text-rosver-yellow">
                  {parse.stats.warnings}
                </p>
              </div>
              <div className="rounded-xl border border-rosver-line p-3">
                <p className="text-[10px] font-bold text-rosver-muted uppercase">
                  Omitidos
                </p>
                <p className="text-xl font-bold text-rosver-muted">
                  {parse.skipped.length}
                </p>
              </div>
            </div>

            {overwrites.length > 0 ? (
              <div className="rounded-xl border border-rosver-yellow/50 bg-rosver-yellow/15 p-3">
                <p className="text-sm font-bold text-rosver-ink">
                  Advertencia: {overwrites.length} producto
                  {overwrites.length === 1 ? '' : 's'} se sobrescribir
                  {overwrites.length === 1 ? 'á' : 'án'}
                </p>
                <p className="mt-1 text-xs text-rosver-muted">
                  Coincide el SKU o el código interno. Se actualizan nombre,
                  marca y precios; el código interno se conserva.
                </p>
                <ul className="mt-2 max-h-40 overflow-auto text-xs text-rosver-ink">
                  {overwrites.map((o) => (
                    <li
                      key={o.id}
                      className="border-t border-rosver-line/70 py-1.5 first:border-0"
                    >
                      <span className="font-mono font-semibold">{o.sku}</span>
                      <span className="text-rosver-muted">
                        {' '}
                        · cód. {o.codeLabel}
                        {o.matchBy === 'code' ? ' · por código' : ' · por SKU'}
                      </span>
                      <span className="mt-0.5 block text-rosver-muted">
                        Actual: «{o.name}»
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {parse.skipped.length > 0 ? (
              <div className="rounded-xl border border-rosver-yellow/40 bg-rosver-yellow/10 p-3">
                <p className="text-xs font-bold text-rosver-ink">
                  Problemas de compatibilidad ({parse.skipped.length})
                </p>
                <ul className="mt-2 max-h-36 overflow-auto text-xs text-rosver-ink">
                  {parse.skipped.map((s, i) => (
                    <li key={`${s.cell ?? s.row}-${i}`} className="border-t border-rosver-line/60 py-1.5 first:border-0">
                      <span className="font-mono font-semibold">
                        {s.cell ?? `fila ${s.row}`}
                      </span>
                      {s.sheet ? (
                        <span className="text-rosver-muted"> · {s.sheet}</span>
                      ) : null}
                      <span className="mt-0.5 block text-rosver-muted">
                        {s.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="max-h-[46vh] overflow-auto rounded-xl border border-rosver-line">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-rosver-soft text-xs font-bold tracking-wide text-rosver-muted uppercase">
                  <tr>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Caja</th>
                    <th className="px-3 py-2">Precios</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rosver-line">
                  {parse.products.map((p) => {
                    const ow = overwrites.find(
                      (o) =>
                        o.sku.toUpperCase() === p.sku.toUpperCase() ||
                        (p.code != null && o.code === p.code),
                    )
                    return (
                      <tr
                        key={p.sku}
                        className={cn(
                          'align-top',
                          ow && 'bg-rosver-yellow/10',
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-rosver-ink">
                          {p.sku}
                        </td>
                        <td className="px-3 py-2 text-rosver-ink">
                          {p.name}
                          {p.warnings.length ? (
                            <span className="mt-0.5 block text-[11px] text-rosver-muted">
                              {p.warnings.join(' · ')}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-rosver-muted">
                          {p.contentPerBox ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-rosver-muted">
                          {p.prices
                            .map((pr) => {
                              const list =
                                pr.listAmount != null
                                  ? `P ${pr.listAmount}`
                                  : null
                              const wh =
                                pr.wholesaleAmount != null
                                  ? `Z ${pr.wholesaleAmount}`
                                  : null
                              return `${pr.label}: ${[list, wh].filter(Boolean).join(' / ')}`
                            })
                            .join(' · ')}
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold">
                          {ow ? (
                            <span className="text-rosver-ink">
                              Sobrescribe
                              <span className="mt-0.5 block font-normal text-rosver-muted">
                                {ow.codeLabel}
                              </span>
                            </span>
                          ) : (
                            <span className="text-rosver-success">Nuevo</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-rosver-muted">
              Al aceptar: los nuevos se crean; los que coinciden por SKU o código
              se actualizan (precios se reemplazan). El JSON queda en R2 privado.
              Código interno desde {formatInternalCode(0)}.
            </p>
          </div>
        ) : null}
      </div>
    </AdminModal>
  )
}
