import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage'
import { normalizeError, ApiError } from './errors'
import type { AuthResponse } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3090'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
  auth?: boolean
}

let onSessionExpired: (() => void) | null = null

export function setOnSessionExpired(callback: () => void): void {
  onSessionExpired = callback
}

let refreshInFlight: Promise<AuthResponse> | null = null

async function refreshSession(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new ApiError(401, ['Sessão expirada.'])
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    throw normalizeError(res.status, await res.json().catch(() => null))
  }

  const data = (await res.json()) as AuthResponse
  setTokens(data.access_token, data.refresh_token)
  return data
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  if (!params) return url

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url
}

export async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = 'GET', body, params, auth = true } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (auth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth && !isRetry) {
    try {
      refreshInFlight ??= refreshSession().finally(() => {
        refreshInFlight = null
      })
      await refreshInFlight
    } catch (error) {
      clearTokens()
      onSessionExpired?.()
      throw error
    }
    return request<T>(path, options, true)
  }

  if (!res.ok) {
    throw normalizeError(res.status, await res.json().catch(() => null))
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
