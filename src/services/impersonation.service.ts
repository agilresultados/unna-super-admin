/**
 * Impersonação cross-app (superadmin ≠ painel do cliente).
 *
 * Fluxo:
 * 1. Superadmin chama POST /super-admin/impersonate/:empresaId
 * 2. Backend devolve access_token (2h, sem refresh) + user + empresa
 * 3. Abrimos o painel do cliente em /auth/impersonate#token=…&user=…&empresa=…
 *    (hash: não vai no access log do servidor; consumido e limpo no client)
 * 4. O front grava a sessão de tenant e entra em /admin
 * 5. "Voltar ao Super Admin" limpa a sessão tenant e redireciona para VITE_SUPERADMIN_URL
 */

const CLIENT_APP_URL = (import.meta.env.VITE_CLIENT_APP_URL || 'http://localhost:5173').replace(/\/$/, '')

export interface ImpersonationResponse {
  access_token: string
  user: {
    id: string
    email: string
    nome?: string
    role: string
    empresaId?: string
  }
  empresa: { id: string; nome: string }
}

class ImpersonationService {
  /**
   * Entrega a sessão de tenant ao painel do cliente (outra origem).
   * Preferimos nova aba; se o browser bloquear popup, cai no mesmo tab.
   */
  start(response: ImpersonationResponse): void {
    if (!response?.access_token || !response?.user || !response?.empresa?.nome) {
      throw new Error('Resposta de impersonação incompleta')
    }

    const hash = new URLSearchParams({
      token: response.access_token,
      user: JSON.stringify(response.user),
      empresa: response.empresa.nome,
      empresa_id: response.empresa.id || '',
    })

    const url = `${CLIENT_APP_URL}/auth/impersonate#${hash.toString()}`

    // Não usar feature "noopener" no 3º arg: no Chrome window.open(..., 'noopener')
    // retorna null mesmo com a aba aberta — o fallback abriria uma 2ª aba.
    const popup = window.open(url, '_blank')
    if (popup) {
      try {
        popup.opener = null
      } catch {
        /* ignore */
      }
    } else {
      // Só se o browser bloqueou de verdade o popup
      window.location.assign(url)
    }
  }

  stop(): void {
    /* Superadmin não carrega sessão de tenant */
  }

  clear(): void {}

  isImpersonating(): boolean {
    return false
  }

  getEmpresaNome(): string | null {
    return null
  }
}

export const impersonationService = new ImpersonationService()
