import { cn } from '@/shared/lib'
import { attachNestedScrollWheel } from '@/shared/lib/nested-scroll-wheel'
import { IconChevronDown } from '@/shared/ui/icons'
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectComboboxProps = {
  id?: string
  value: string
  options: SelectOption[]
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  /** sm = filas densas (cotizar); md = forms (~48px) */
  size?: 'sm' | 'md'
  'aria-label'?: string
  'aria-labelledby'?: string
}

/**
 * Select / combobox Rosver (lista custom).
 * El menú se renderiza en portal para no quedar cortado dentro de AdminModal.
 */
export function SelectCombobox({
  id,
  value,
  options,
  onValueChange,
  placeholder = 'Elegir…',
  disabled,
  invalid,
  className,
  size = 'md',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectComboboxProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [menuBox, setMenuBox] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const selected = options.find((o) => o.value === value)
  const sm = size === 'sm'

  function updateMenuBox() {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const maxH = 224
    const spaceBelow = window.innerHeight - r.bottom - 8
    const openUp = spaceBelow < Math.min(maxH, 120) && r.top > spaceBelow
    setMenuBox({
      top: openUp ? Math.max(8, r.top - maxH - 6) : r.bottom + 6,
      left: r.left,
      width: r.width,
    })
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null)
      return
    }
    updateMenuBox()
    function onWin() {
      updateMenuBox()
    }
    window.addEventListener('resize', onWin)
    window.addEventListener('scroll', onWin, true)
    return () => {
      window.removeEventListener('resize', onWin)
      window.removeEventListener('scroll', onWin, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (listRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    return attachNestedScrollWheel(el)
  }, [open, options.length])

  function pick(next: string) {
    onValueChange(next)
    setOpen(false)
  }

  function onTriggerKeyDown(e: KeyboardEvent) {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const menu =
    open && menuBox
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={id}
            className={cn(
              'fixed z-[200] max-h-56 overflow-y-auto overscroll-contain border border-rosver-line bg-white py-1 shadow-[0_14px_36px_-18px_rgba(13,13,13,0.45)]',
              sm ? 'rounded-xl' : 'rounded-xl',
            )}
            style={{
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
            data-lenis-prevent
          >
            {options.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-rosver-muted">
                Sin opciones
              </li>
            ) : (
              options.map((opt) => {
                const active = opt.value === value
                return (
                  <li key={`${opt.value}::${opt.label}`} role="option" aria-selected={active}>
                    <button
                      type="button"
                      disabled={opt.disabled}
                      className={cn(
                        'flex w-full px-3 text-left transition disabled:opacity-40',
                        sm
                          ? 'py-2 text-xs font-semibold uppercase tracking-wide'
                          : 'py-2.5 text-sm font-semibold',
                        active
                          ? 'bg-rosver-ink text-white'
                          : 'text-rosver-ink hover:bg-rosver-soft',
                      )}
                      onClick={() => pick(opt.value)}
                    >
                      {opt.label}
                    </button>
                  </li>
                )
              })
            )}
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'flex w-full items-center justify-between gap-2 border bg-white text-left font-semibold text-rosver-ink shadow-sm outline-none transition',
          'hover:border-rosver-muted/45 focus-visible:border-rosver-red/45 focus-visible:ring-2 focus-visible:ring-rosver-red/15',
          'disabled:cursor-not-allowed disabled:bg-rosver-soft disabled:opacity-70',
          sm
            ? 'min-h-10 rounded-xl border-rosver-line px-2.5 py-1.5 text-xs uppercase tracking-wide'
            : 'min-h-12 rounded-xl border-rosver-line px-3.5 py-2.5 text-sm',
          invalid && 'border-rosver-red/50 focus-visible:ring-rosver-red/25',
          open && 'border-rosver-red/40 ring-2 ring-rosver-red/10',
        )}
      >
        <span
          className={cn(
            'min-w-0 truncate',
            !selected && 'font-medium text-rosver-muted',
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <IconChevronDown
          className={cn(
            'size-3.5 shrink-0 text-rosver-muted transition sm:size-4',
            open && 'rotate-180 text-rosver-red',
          )}
        />
      </button>
      {menu}
    </div>
  )
}

/** Extrae `<option>` de children para wrappers tipo AdminSelect. */
export function optionsFromSelectChildren(children: ReactNode): SelectOption[] {
  const opts: SelectOption[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const typeOk =
      child.type === 'option' ||
      (typeof child.type === 'string' && child.type.toLowerCase() === 'option')
    if (!typeOk) return
    const props = child.props as {
      value?: string | number
      disabled?: boolean
      children?: ReactNode
    }
    const value =
      props.value != null ? String(props.value) : String(props.children ?? '')
    const label =
      typeof props.children === 'string' || typeof props.children === 'number'
        ? String(props.children)
        : value
    opts.push({ value, label, disabled: Boolean(props.disabled) })
  })
  return opts
}

type AdminSelectCompatProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size'
> & {
  invalid?: boolean
  size?: 'sm' | 'md'
}

/**
 * AdminSelect con lista custom Rosver (misma API de `<select>` + children option).
 */
export function AdminSelectCombobox({
  className,
  invalid,
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  id,
  size = 'md',
  'aria-label': ariaLabel,
  ...rest
}: AdminSelectCompatProps) {
  const options = optionsFromSelectChildren(children)
  const controlled = value !== undefined
  const [inner, setInner] = useState(String(defaultValue ?? options[0]?.value ?? ''))
  const current = controlled ? String(value ?? '') : inner

  function emit(next: string) {
    if (!controlled) setInner(next)
    if (onChange) {
      const event = {
        target: { value: next, name: rest.name ?? '', id: id ?? '' },
        currentTarget: { value: next, name: rest.name ?? '', id: id ?? '' },
      } as ChangeEvent<HTMLSelectElement>
      onChange(event)
    }
  }

  return (
    <SelectCombobox
      id={id}
      value={current}
      options={options}
      onValueChange={emit}
      disabled={disabled}
      invalid={invalid}
      className={className}
      size={size}
      aria-label={ariaLabel}
    />
  )
}
