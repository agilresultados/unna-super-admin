import { apiService } from './api'

/**
 * Unna Pay — lado superadmin: fila de análise das subcontas Asaas.
 *
 * Todas as rotas aqui são `@AdminScope()` no backend: só token do painel
 * superadmin passa. Um token de empresa recebe 401.
 */

export type StatusSubconta =
  | 'nao_solicitado'
  | 'solicitado'
  | 'rejeitado_unna'
  | 'criando_conta'
  | 'em_analise_asaas'
  | 'aprovado'
  | 'rejeitado_asaas'
  | 'desabilitado'

export interface SubcontaResumo {
  id: string
  empresaId: string
  status: StatusSubconta
  solicitado_em?: string | null
  analisado_em?: string | null
  motivo_rejeicao?: string | null
  motivo_pendencia?: string | null
  taxa_percentual?: number | null
  asaas_account_id?: string | null
  /** Só os 4 últimos caracteres — a credencial nunca sai do backend. */
  api_key_last4?: string | null
  empresa?: {
    nome_negocio: string
    email?: string | null
    createdAt: string
  }
}

export interface SubcontaDossie extends SubcontaResumo {
  status_comercial?: string | null
  status_documentacao?: string | null
  status_conta_bancaria?: string | null
  asaas_wallet_id?: string | null
  dados_kyc?: Record<string, any> | null
  /** Derivado: indica que a apiKey está guardada, sem expô-la. */
  credencial_armazenada?: boolean
  webhook_configurado?: boolean
  empresa?: any
}

export interface UnnaPayConfig {
  /** Kill switch global: desliga a emissão de cobrança em toda a base. */
  habilitado: boolean
  taxa_percentual_padrao: number
}

export const ROTULO_STATUS_SUBCONTA: Record<StatusSubconta, string> = {
  nao_solicitado: 'Não solicitado',
  solicitado: 'Aguardando análise da Unna',
  rejeitado_unna: 'Recusado pela Unna',
  criando_conta: 'Criando conta',
  em_analise_asaas: 'Em análise pelo Asaas',
  aprovado: 'Ativa',
  rejeitado_asaas: 'Reprovada pelo Asaas',
  desabilitado: 'Desabilitada',
}

class UnnaPayAdminService {
  listar(status?: string): Promise<SubcontaResumo[]> {
    return apiService.get<SubcontaResumo[]>('/super-admin/subcontas', {
      params: status ? { status } : undefined,
    })
  }

  getDossie(empresaId: string): Promise<SubcontaDossie> {
    return apiService.get<SubcontaDossie>(`/super-admin/subcontas/${empresaId}`)
  }

  /**
   * Cria a conta White Label no Asaas. Irreversível: a apiKey é devolvida uma
   * única vez e não existe endpoint para apagar uma subconta.
   */
  aprovar(empresaId: string): Promise<SubcontaDossie> {
    return apiService.post<SubcontaDossie>(`/super-admin/subcontas/${empresaId}/aprovar`)
  }

  rejeitar(empresaId: string, motivo: string): Promise<SubcontaDossie> {
    return apiService.post<SubcontaDossie>(`/super-admin/subcontas/${empresaId}/rejeitar`, { motivo })
  }

  desabilitar(empresaId: string, motivo?: string): Promise<SubcontaDossie> {
    return apiService.post<SubcontaDossie>(`/super-admin/subcontas/${empresaId}/desabilitar`, { motivo })
  }

  reabilitar(empresaId: string): Promise<SubcontaDossie> {
    return apiService.post<SubcontaDossie>(`/super-admin/subcontas/${empresaId}/reabilitar`)
  }

  /** `null` devolve a empresa para a taxa global. */
  definirTaxa(empresaId: string, taxa: number | null): Promise<SubcontaDossie> {
    return apiService.put<SubcontaDossie>(`/super-admin/subcontas/${empresaId}/taxa`, {
      taxa_percentual: taxa,
    })
  }

  /** Reparo para quando a conta existe mas o webhook falhou (sem baixa automática). */
  reprovisionarWebhook(empresaId: string): Promise<{ webhook_id: string; url: string }> {
    return apiService.post(`/super-admin/subcontas/${empresaId}/reprovisionar-webhook`)
  }

  getConfig(): Promise<UnnaPayConfig> {
    return apiService.get<UnnaPayConfig>('/super-admin/unna-pay/config')
  }

  updateConfig(patch: Partial<UnnaPayConfig>): Promise<UnnaPayConfig> {
    return apiService.put<UnnaPayConfig>('/super-admin/unna-pay/config', patch)
  }
}

export const unnaPayAdminService = new UnnaPayAdminService()
