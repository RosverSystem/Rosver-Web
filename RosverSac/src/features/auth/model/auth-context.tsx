import { api } from '@/shared/lib/api'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AuthUser = {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  companyName: string | null
  documentType: string | null
  documentNumber: string | null
  avatarUrl: string
  roleCode: string
  roleName: string
  emailVerified: boolean
  totpEnabled: boolean
  status: string
  permissions: string[]
}

export type OtpSendMeta = {
  mailDelivered?: boolean
  retryAfterSec?: number
  sendsLeft?: number
  message?: string
}

export type LoginResult =
  | { ok: true; user: AuthUser }
  | ({
      ok: false
      requiresEmailVerification?: boolean
      requiresEmailOtp?: boolean
      requiresTotp?: boolean
      challengeToken?: string
      email?: string
      message?: string
    } & OtpSendMeta)

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  login: (
    email: string,
    password?: string,
    opts?: { passwordless?: boolean },
  ) => Promise<LoginResult>
  loginTotp: (challengeToken: string, code: string) => Promise<AuthUser>
  loginEmailOtp: (email: string, code: string) => Promise<AuthUser>
  register: (input: {
    fullName: string
    email: string
    phone: string
    password: string
  }) => Promise<{ email: string } & OtpSendMeta>
  verifyEmail: (email: string, code: string) => Promise<AuthUser>
  resendOtp: (
    email: string,
    purpose: 'email_verify' | 'login' | 'reset_password',
  ) => Promise<OtpSendMeta & { ok?: boolean }>
  resetPasswordStart: (email: string) => Promise<{
    requiresTotp?: boolean
    requiresEmailOtp?: boolean
    challengeToken?: string
    email: string
    message?: string
  } & OtpSendMeta>
  resetPasswordTotp: (
    challengeToken: string,
    code: string,
  ) => Promise<{ email: string; message?: string } & OtpSendMeta>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthUser>
  setup2fa: () => Promise<{ secret: string; qrDataUrl: string; otpauthUrl: string }>
  enable2fa: (code: string) => Promise<void>
  disable2fa: (code: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (patch: Record<string, unknown>) => Promise<AuthUser>
  uploadAvatar: (file: File) => Promise<AuthUser>
  hasPermission: (code: string) => boolean
  isAdmin: boolean
  googleStartUrl: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: AuthUser | null }>('/api/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (
      email: string,
      password?: string,
      opts?: { passwordless?: boolean },
    ) => {
      const data = await api<LoginResult & { user?: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: opts?.passwordless ? undefined : password,
          passwordless: Boolean(opts?.passwordless),
        }),
      })
      if ('ok' in data && data.ok && data.user) {
        setUser(data.user)
        return { ok: true as const, user: data.user }
      }
      return data as LoginResult
    },
    [],
  )

  const loginTotp = useCallback(async (challengeToken: string, code: string) => {
    const data = await api<{ user: AuthUser }>('/api/auth/login/totp', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, code }),
    })
    setUser(data.user)
    return data.user
  }, [])

  const loginEmailOtp = useCallback(async (email: string, code: string) => {
    const data = await api<{ user: AuthUser }>('/api/auth/login/otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(
    async (input: {
      fullName: string
      email: string
      phone: string
      password: string
    }) => {
      const data = await api<{ email: string } & OtpSendMeta>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return data
    },
    [],
  )

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const data = await api<{ user: AuthUser }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
    setUser(data.user)
    return data.user
  }, [])

  const resendOtp = useCallback(
    async (
      email: string,
      purpose: 'email_verify' | 'login' | 'reset_password',
    ) => {
      return api<OtpSendMeta & { ok?: boolean }>('/api/auth/otp/resend', {
        method: 'POST',
        body: JSON.stringify({ email, purpose }),
      })
    },
    [],
  )

  const resetPasswordStart = useCallback(async (email: string) => {
    return api<{
      requiresTotp?: boolean
      requiresEmailOtp?: boolean
      challengeToken?: string
      email: string
      message?: string
    } & OtpSendMeta>('/api/auth/reset-password/start', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }, [])

  const resetPasswordTotp = useCallback(
    async (challengeToken: string, code: string) => {
      return api<{ email: string; message?: string } & OtpSendMeta>(
        '/api/auth/reset-password/totp',
        {
          method: 'POST',
          body: JSON.stringify({ challengeToken, code }),
        },
      )
    },
    [],
  )

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      const data = await api<{ user: AuthUser }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword }),
      })
      setUser(data.user)
      return data.user
    },
    [],
  )

  const setup2fa = useCallback(async () => {
    return api<{ secret: string; qrDataUrl: string; otpauthUrl: string }>(
      '/api/auth/2fa/setup',
      { method: 'POST' },
    )
  }, [])

  const enable2fa = useCallback(async (code: string) => {
    await api('/api/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    await refresh()
  }, [refresh])

  const disable2fa = useCallback(async (code: string) => {
    await api('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    await refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (patch: Record<string, unknown>) => {
    const data = await api<{ user: AuthUser }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setUser(data.user)
    return data.user
  }, [])

  const uploadAvatar = useCallback(async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const data = await api<{ user: AuthUser }>('/api/profile/avatar', {
      method: 'POST',
      body: fd,
    })
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refresh,
      login,
      loginTotp,
      loginEmailOtp,
      register,
      verifyEmail,
      resendOtp,
      resetPasswordStart,
      resetPasswordTotp,
      resetPassword,
      setup2fa,
      enable2fa,
      disable2fa,
      logout,
      updateProfile,
      uploadAvatar,
      hasPermission: (code) => Boolean(user?.permissions.includes(code)),
      isAdmin: user?.roleCode === 'admin',
      googleStartUrl: `${(import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''}/api/auth/google/start`,
    }),
    [
      user,
      loading,
      refresh,
      login,
      loginTotp,
      loginEmailOtp,
      register,
      verifyEmail,
      resendOtp,
      resetPasswordStart,
      resetPasswordTotp,
      resetPassword,
      setup2fa,
      enable2fa,
      disable2fa,
      logout,
      updateProfile,
      uploadAvatar,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
