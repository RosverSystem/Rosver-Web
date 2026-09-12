import { api } from '@/shared/lib/api'
import { SelectCombobox, type SelectOption } from '@/shared/ui/select-combobox'
import { useEffect, useState } from 'react'

export type UbigeoValue = {
  departmentCode: string
  departmentName: string
  provinceCode: string
  provinceName: string
  districtCode: string
  districtName: string
}

type PeruUbigeoFieldsProps = {
  idPrefix: string
  value: UbigeoValue
  onChange: (next: UbigeoValue) => void
  invalid?: Partial<Record<'department' | 'province' | 'district', boolean>>
  disabled?: boolean
}

type UbigeoItem = { code: string; name: string }

/**
 * Cascada Perú: departamento → provincia → distrito (SelectCombobox + /api/peru).
 */
export function PeruUbigeoFields({
  idPrefix,
  value,
  onChange,
  invalid,
  disabled,
}: PeruUbigeoFieldsProps) {
  const [departments, setDepartments] = useState<SelectOption[]>([])
  const [provinces, setProvinces] = useState<SelectOption[]>([])
  const [districts, setDistricts] = useState<SelectOption[]>([])
  const [busyProv, setBusyProv] = useState(false)
  const [busyDist, setBusyDist] = useState(false)

  useEffect(() => {
    let cancelled = false
    void api<{ items: UbigeoItem[] }>('/api/peru/departments')
      .then((data) => {
        if (cancelled) return
        setDepartments(
          data.items.map((i) => ({ value: i.code, label: i.name })),
        )
      })
      .catch(() => {
        if (!cancelled) setDepartments([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!value.departmentCode) {
      setProvinces([])
      return
    }
    let cancelled = false
    setBusyProv(true)
    void api<{ items: UbigeoItem[] }>(
      `/api/peru/provinces?department=${encodeURIComponent(value.departmentCode)}`,
    )
      .then((data) => {
        if (cancelled) return
        setProvinces(data.items.map((i) => ({ value: i.code, label: i.name })))
      })
      .catch(() => {
        if (!cancelled) setProvinces([])
      })
      .finally(() => {
        if (!cancelled) setBusyProv(false)
      })
    return () => {
      cancelled = true
    }
  }, [value.departmentCode])

  useEffect(() => {
    if (!value.provinceCode) {
      setDistricts([])
      return
    }
    let cancelled = false
    setBusyDist(true)
    void api<{ items: UbigeoItem[] }>(
      `/api/peru/districts?province=${encodeURIComponent(value.provinceCode)}`,
    )
      .then((data) => {
        if (cancelled) return
        setDistricts(data.items.map((i) => ({ value: i.code, label: i.name })))
      })
      .catch(() => {
        if (!cancelled) setDistricts([])
      })
      .finally(() => {
        if (!cancelled) setBusyDist(false)
      })
    return () => {
      cancelled = true
    }
  }, [value.provinceCode])

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold text-rosver-ink">Departamento</span>
        <SelectCombobox
          id={`${idPrefix}-dep`}
          value={value.departmentCode}
          options={departments}
          placeholder="Elegir…"
          disabled={disabled}
          invalid={invalid?.department}
          onValueChange={(code) => {
            const name = departments.find((o) => o.value === code)?.label ?? ''
            onChange({
              departmentCode: code,
              departmentName: name,
              provinceCode: '',
              provinceName: '',
              districtCode: '',
              districtName: '',
            })
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold text-rosver-ink">Provincia</span>
        <SelectCombobox
          id={`${idPrefix}-prov`}
          value={value.provinceCode}
          options={provinces}
          placeholder={busyProv ? 'Cargando…' : 'Elegir…'}
          disabled={disabled || !value.departmentCode || busyProv}
          invalid={invalid?.province}
          onValueChange={(code) => {
            const name = provinces.find((o) => o.value === code)?.label ?? ''
            onChange({
              ...value,
              provinceCode: code,
              provinceName: name,
              districtCode: '',
              districtName: '',
            })
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold text-rosver-ink">Distrito</span>
        <SelectCombobox
          id={`${idPrefix}-dist`}
          value={value.districtCode}
          options={districts}
          placeholder={busyDist ? 'Cargando…' : 'Elegir…'}
          disabled={disabled || !value.provinceCode || busyDist}
          invalid={invalid?.district}
          onValueChange={(code) => {
            const name = districts.find((o) => o.value === code)?.label ?? ''
            onChange({
              ...value,
              districtCode: code,
              districtName: name,
            })
          }}
        />
      </div>
    </div>
  )
}

export const emptyUbigeo = (): UbigeoValue => ({
  departmentCode: '',
  departmentName: '',
  provinceCode: '',
  provinceName: '',
  districtCode: '',
  districtName: '',
})
