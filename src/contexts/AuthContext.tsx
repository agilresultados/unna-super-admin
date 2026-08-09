import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import * as authApi from '@/api/auth'
import { clearTokens, hasSession, setTokens } from '@/api/tokenStorage'
import { setOnSessionExpired } from '@/api/client'
import { setUnauthorizedCallback } from '@/services/api'
import { ApiError } from '@/api/errors'
import type { LoginPayload, User } from '@/types/api'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  useEffect(() => {
    setOnSessionExpired(logout)
    setUnauthorizedCallback(logout)
  }, [logout])

  const loadSession = useCallback(async () => {
    const me = await authApi.getMe()
    if (me.role !== 'SUPER_ADMIN') {
      clearTokens()
      setUser(null)
      throw new ApiError(403, ['Acesso restrito a SUPER_ADMIN.'])
    }
    setUser(me)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!hasSession()) {
        setLoading(false)
        return
      }
      try {
        await loadSession()
      } catch {
        if (!cancelled) logout()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [loadSession, logout])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await authApi.login(payload)
      if (data.user.role !== 'SUPER_ADMIN') {
        throw new ApiError(403, ['Acesso restrito a SUPER_ADMIN. Use o painel do cliente.'])
      }
      setTokens(data.access_token, data.refresh_token)
      await loadSession()
    },
    [loadSession],
  )

  const refreshProfile = useCallback(() => loadSession(), [loadSession])

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: user !== null,
    login,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
