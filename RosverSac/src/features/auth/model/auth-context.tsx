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

type LoginResult =
  | { ok: true; user: AuthUser }
  | {
      ok: false
      requiresEmailVerification?: boolean
      requiresTotp?: boolean
      challengeToken?: string
      email?: string
      message?: string
    }

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<LoginResult>
  loginTotp: (challengeToken: string, code: string) => Promise<AuthUser>
  register: (input: {
    fullName: string
    email: string
    phone: string
    password: string
  }) => Promise<{ email: string }>
  verifyEmail: (email: string, code: string) => Promise<AuthUser>
  resendOtp: (email: string, purpose: 'email_verify' | 'login' | 'reset_password') => Promise<void>
  logout: () => Promise<void>
  updateProfile: (patch: Record<string, unknown>) => Promise<AuthUser>
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

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<LoginResult & { user?: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if ('ok' in data && data.ok && data.user) {
      setUser(data.user)
      return { ok: true as const, user: data.user }
    }
    return data as LoginResult
  }, [])

  const loginTotp = useCallback(async (challengeToken: string, code: string) => {
    const data = await api<{ user: AuthUser }>('/api/auth/login/totp', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, code }),
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
      const data = await api<{ email: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return { email: data.email }
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
    async (email: string, purpose: 'email_verify' | 'login' | 'reset_password') => {
      await api('/api/auth/otp/resend', {
        method: 'POST',
        body: JSON.stringify({ email, purpose }),
      })
    },
    [],
  )

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refresh,
      login,
      loginTotp,
      register,
      verifyEmail,
      resendOtp,
      logout,
      updateProfile,
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
      register,
      verifyEmail,
      resendOtp,
      logout,
      updateProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
