/**
 * Drop-in compatível com front/src/services/api.ts para reutilizar services/pages.
 * Usa storage isolado unna_sa_* e base URL sem prefixo /api.
 */
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/api/tokenStorage'
import { normalizeError } from '@/api/errors'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3090'

export interface SubscriptionErrorData {
  statusCode: number
  message: string
  error: string
  code: string
  hasSubscription: boolean
  isExpired: boolean
  subscriptionStatus: string | null
  expiryWarning: string | null
  daysUntilExpiry: number | null
}

let onUnauthorized: (() => void) | null = null

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorized = callback
}

type RequestOptions = RequestInit & { params?: Record<string, unknown> }

class ApiService {
  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
    if (!params) return url

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const qs = searchParams.toString()
    if (qs) url += (url.includes('?') ? '&' : '?') + qs
    return url
  }

  private authHeaders(isFormData: boolean): HeadersInit {
    const token = getAccessToken()
    const headers: Record<string, string> = {}
    if (!isFormData) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  private handleUnauthorized() {
    clearTokens()
    onUnauthorized?.()
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
    isRetry = false,
  ): Promise<T> {
    const { params, signal, headers: extraHeaders, ...rest } = options || {}
    const isFormData = data instanceof FormData
    const headers = { ...this.authHeaders(isFormData), ...(extraHeaders as Record<string, string>) }

    const res = await fetch(this.buildUrl(endpoint, params), {
      method,
      headers,
      body: data === undefined ? undefined : isFormData ? data : JSON.stringify(data),
      signal,
      ...rest,
    })

    if (res.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refresh = getRefreshToken()
      if (refresh) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refresh }),
          })
          if (refreshRes.ok) {
            const tokens = (await refreshRes.json()) as { access_token: string; refresh_token: string }
            setTokens(tokens.access_token, tokens.refresh_token)
            return this.request<T>(method, endpoint, data, options, true)
          }
        } catch {
          /* fall through */
        }
      }
      this.handleUnauthorized()
      throw normalizeError(401, { message: 'Sessão expirada' })
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const err = normalizeError(res.status, body) as Error & {
        response?: { status: number; data: unknown }
      }
      err.response = { status: res.status, data: body }
      throw err
    }

    if (res.status === 204) return undefined as T
    const text = await res.text()
    if (!text) return undefined as T
    return JSON.parse(text) as T
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>('GET', endpoint, undefined, options)
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>('POST', endpoint, data, options)
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>('PUT', endpoint, data, options)
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>('PATCH', endpoint, data, options)
  }

  delete<T>(endpoint: string, dataOrOptions?: unknown, maybeOptions?: RequestOptions) {
    // Compat: alguns services passam body no delete (ex.: purge com password)
    if (
      dataOrOptions &&
      typeof dataOrOptions === 'object' &&
      !('params' in (dataOrOptions as object)) &&
      !('headers' in (dataOrOptions as object)) &&
      !('signal' in (dataOrOptions as object)) &&
      !('method' in (dataOrOptions as object))
    ) {
      return this.request<T>('DELETE', endpoint, dataOrOptions, maybeOptions)
    }
    return this.request<T>('DELETE', endpoint, undefined, dataOrOptions as RequestOptions | undefined)
  }

  async uploadFile<T>(endpoint: string, file: File, fieldName = 'file'): Promise<T> {
    const form = new FormData()
    form.append(fieldName, file)
    return this.request<T>('POST', endpoint, form)
  }
}

export const apiService = new ApiService()
