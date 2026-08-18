import { apiClient } from '@/api/client'

export interface TencentChatCredentials {
  configured: boolean
  sdkAppId?: number | null
  userId?: string
  userSig?: string
  nick?: string
  expire?: number
  role?: 'customer' | 'agent'
  supportUserId?: string
  message?: string
}

export function getAgentCredentials() {
  return apiClient.get<TencentChatCredentials>('/chat/agent/credentials')
}

export interface TencentChatContato {
  tencentUserId: string
  usuarioId: string
  usuarioNome: string
  usuarioEmail: string | null
  usuarioTelefone: string | null
  empresaId: string | null
  empresaNome: string | null
}

export async function getChatContatos(ids: string[]) {
  if (ids.length === 0) return [] as TencentChatContato[]
  const res = await apiClient.get<{ contatos: TencentChatContato[] }>(
    `/chat/agent/contatos?ids=${encodeURIComponent(ids.join(','))}`,
  )
  return res?.contatos || []
}
