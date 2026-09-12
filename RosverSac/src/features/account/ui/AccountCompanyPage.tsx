import { useAuth } from '@/features/auth'
import {
  asPeruDocType,
  cnField,
  digitsOnly,
  docNumberError,
  isDocReady,
  type PeruDocType,
} from '@/shared/lib'
import { api, ApiError } from '@/shared/lib/api'
import { useFormToasts } from '@/shared/hooks/use-form-toasts'
import { FloatingToasts } from '@/shared/ui/floating-toasts'
import { SelectCombobox } from '@/shared/ui/select-combobox'
import { Search } from 'cssvg-icons'
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

const inputClass =
  'min-h-12 w-full rounded-xl border border-rosver-line bg-rosver-soft/50 px-3.5 py-2.5 text-sm text-rosver-ink outline-none transition placeholder:text-rosver-muted/80 focus:border-rosver-red/35 focus:bg-white focus:ring-2 focus:ring-rosver-red/10'

const DOC_OPTIONS: { value: PeruDocType; label: string }[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'RUC', label: 'RUC' },
]

type FieldKey = 'docNumber' | 'fullName' | 'companyName'
type FieldErrors = Partial<Record<FieldKey, string>>

/**
 * Datos fiscales / empresa del cliente (DNI-RUC + Decolecta al blur).
 * Se reutilizan en Contacto y Cotizar sin volver a consultar.
 */
export function AccountCompanyPage() {
  const { user, updateProfile } = useAuth()
  const { toasts, showErrors, showSuccess, dismiss, clear } = useFormToasts()
  const [docType, setDocType] = useState<PeruDocType>('RUC')
  const [docNumber, setDocNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [lookupBusy, setLookupBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const lastLookupRef = useRef('')
  const docRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    const t = asPeruDocType(user.documentType) ?? 'RUC'
    setDocType(t)
    setDocNumber(user.documentNumber ?? '')
    setFullName(user.fullName ?? '')
    setCompanyName(user.companyName ?? '')
    const digits = digitsOnly(user.documentNumber ?? '')
    if (digits && isDocReady(t, digits)) {
      lastLookupRef.current = `${t}:${digits}`
    }
  }, [user])

  function clearKey(key: FieldKey) {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function lookupDocument(
    rawNumber = docNumber,
    type = docType,
    opts?: { silentIncomplete?: boolean },
  ) {
    const digits = digitsOnly(rawNumber)
    const err = docNumberError(type, digits)
    if (err) {
      if (!opts?.silentIncomplete) {
        showErrors({ docNumber: err })
        setErrors((prev) => ({ ...prev, docNumber: err }))
      }
      return
    }
    const lookupKey = `${type}:${digits}`
    if (lookupBusy || lastLookupRef.current === lookupKey) return
    clear()
    clearKey('docNumber')
    setLookupBusy(true)
    try {
      const data = await api<{
        docType: PeruDocType
        fullName?: string
        businessName?: string
      }>('/api/peru/lookup', {
        method: 'POST',
        body: JSON.stringify({ docType: type, docNumber: digits }),
      })
      lastLookupRef.current = lookupKey
      if (data.docType === 'DNI' && data.fullName) {
        setFullName(data.fullName)
        clearKey('fullName')
        showSuccess(['Nombre encontrado'])
      } else if (data.docType === 'RUC' && data.businessName) {
        setCompanyName(data.businessName)
        if (!fullName.trim()) setFullName(data.businessName)
        clearKey('companyName')
        clearKey('fullName')
        showSuccess(['Razón social encontrada'])
      }
    } catch (e) {
      lastLookupRef.current = ''
      showErrors({
        docNumber:
          e instanceof ApiError
            ? e.message
            : 'No se pudo consultar el documento.',
      })
    } finally {
      setLookupBusy(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const digits = digitsOnly(docNumber)
    const next: FieldErrors = {}
    const docErr = docNumberError(docType, digits)
    if (docErr) next.docNumber = docErr
    if (docType === 'DNI' && !fullName.trim()) {
      next.fullName = 'Completa el nombre (búscalo con el DNI).'
    }
    if (docType === 'RUC' && !companyName.trim()) {
      next.companyName = 'Completa la razón social (búscala con el RUC).'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showErrors(next, ['docNumber', 'fullName', 'companyName'])
      docRef.current?.focus()
      return
    }
    clear()
    setBusy(true)
    try {
      if (!user?.phone || digitsOnly(user.phone).length < 9) {
        showErrors({
          fullName:
            'Primero guarda tu WhatsApp/teléfono en Mi perfil (es obligatorio).',
        })
        setBusy(false)
        return
      }
      await updateProfile({
        ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
        phone: user.phone,
        companyName: companyName.trim() || null,
        documentType: docType,
        documentNumber: digits,
      })
      showSuccess([
        'Datos de empresa guardados. Se usarán en Contacto y Cotizar.',
      ])
    } catch (err) {
      showErrors({
        docNumber:
          err instanceof ApiError ? err.message : 'No se pudo guardar.',
      })
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  return (
    <div className="rounded-2xl border border-rosver-line bg-white p-5 shadow-sm sm:p-6">
      <FloatingToasts toasts={toasts} onDismiss={dismiss} />
      <div className="mb-5">
        <p className="text-[11px] font-bold tracking-widest text-rosver-muted uppercase">
          Facturación / mayoreo
        </p>
        <h2 className="font-display text-xl font-bold text-rosver-ink uppercase">
          Mi empresa
        </h2>
        <p className="mt-1 max-w-xl text-sm text-rosver-muted">
          Guarda tu DNI o RUC una vez. Contacto y cotizaciones los rellenan solos
          — sin volver a consultar Decolecta.
        </p>
      </div>

      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-end">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-bold text-rosver-ink">Documento</span>
            <SelectCombobox
              id="empresa-doc-type"
              value={docType}
              invalid={Boolean(errors.docNumber)}
              onValueChange={(next) => {
                const v = next as PeruDocType
                setDocType(v)
                setDocNumber('')
                lastLookupRef.current = ''
                clearKey('docNumber')
              }}
              options={DOC_OPTIONS}
            />
          </div>
          <label className="flex flex-col gap-1.5 text-sm" htmlFor="empresa-doc">
            <span className="font-bold text-rosver-ink">
              {docType === 'RUC' ? 'Nº RUC' : 'Nº DNI'}
            </span>
            <input
              ref={docRef}
              id="empresa-doc"
              inputMode="numeric"
              maxLength={docType === 'RUC' ? 11 : 8}
              placeholder={docType === 'RUC' ? '20123456789' : '12345678'}
              value={docNumber}
              aria-invalid={Boolean(errors.docNumber)}
              onChange={(e) => {
                const v = digitsOnly(e.target.value).slice(
                  0,
                  docType === 'RUC' ? 11 : 8,
                )
                setDocNumber(v)
                lastLookupRef.current = ''
                clearKey('docNumber')
              }}
              onBlur={() => {
                if (isDocReady(docType, docNumber)) {
                  void lookupDocument(docNumber, docType, {
                    silentIncomplete: true,
                  })
                }
              }}
              className={cnField(inputClass, Boolean(errors.docNumber))}
            />
          </label>
          <button
            type="button"
            disabled={lookupBusy}
            aria-label="Buscar documento"
            title="Buscar"
            onClick={() => void lookupDocument()}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-rosver-line bg-white text-rosver-ink transition hover:border-rosver-red/40 hover:text-rosver-red disabled:opacity-60"
          >
            <Search size={20} color="currentColor" strokeWidth={2} />
          </button>
        </div>

        {docType === 'RUC' ? (
          <label className="flex flex-col gap-1.5 text-sm" htmlFor="empresa-razon">
            <span className="font-bold text-rosver-ink">Razón social</span>
            <input
              id="empresa-razon"
              value={companyName}
              placeholder="Se completa al buscar el RUC"
              aria-invalid={Boolean(errors.companyName)}
              onChange={(e) => {
                setCompanyName(e.target.value)
                clearKey('companyName')
              }}
              className={cnField(inputClass, Boolean(errors.companyName))}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5 text-sm" htmlFor="empresa-nombre">
          <span className="font-bold text-rosver-ink">
            {docType === 'DNI' ? 'Nombre completo' : 'Nombre de contacto'}
          </span>
          <input
            id="empresa-nombre"
            value={fullName}
            placeholder={
              docType === 'DNI'
                ? 'Se completa al buscar el DNI'
                : 'Persona de contacto'
            }
            aria-invalid={Boolean(errors.fullName)}
            onChange={(e) => {
              setFullName(e.target.value)
              clearKey('fullName')
            }}
            className={cnField(inputClass, Boolean(errors.fullName))}
          />
        </label>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-rosver-red px-7 text-sm font-bold text-white transition hover:bg-rosver-red-dark disabled:opacity-60"
          >
            {busy ? 'Guardando…' : 'Guardar empresa'}
          </button>
          <p className="text-xs text-rosver-muted sm:text-right">
            Teléfono y foto en{' '}
            <Link
              to="/cuenta/perfil"
              className="font-bold text-rosver-ink underline-offset-2 hover:text-rosver-red hover:underline"
            >
              Mi perfil
            </Link>
            .
          </p>
        </div>
      </form>
    </div>
  )
}
