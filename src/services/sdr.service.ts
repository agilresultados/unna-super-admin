import { apiService } from './api';

export interface SdrRecuperacaoStats {
  emRecuperacao: number;
  reativacoes: number;
  cuponsGerados: number;
  cuponsResgatados: number;
  suspensosNoMes: number;
}

export interface SdrDashboardStats {
  trialsAtivos: number;
  expirados: number;
  cancelados: number;
  pendentes: number;
  recuperadosEsteMes: number;
  contatosHoje: number;
  totalEmpresas: number;
  recuperacao?: SdrRecuperacaoStats;
}

export interface SdrLeadAssinatura {
  status: string;
  plano: string;
  plano_tipo: string;
  data_inicio: string;
  data_fim: string | null;
  valor_pago: number | null;
}

export interface SdrLeadAdmin {
  nome: string;
  email: string | null;
  telefone: string | null;
  ultimo_login: string | null;
}

export interface SdrLeadTracking {
  status: string;
  ultimo_contato: string | null;
  resultado: string | null;
  proximo_contato: string | null;
  notas: string | null;
}

/** Segmentos de abordagem — espelham `SDR_SEGMENTS` em `data/sdrTemplates.ts`. */
export type SegmentoLead =
  | 'trial'
  | 'pendente'
  | 'cancelado_recente'
  | 'cancelado_antigo'
  | 'sem_assinatura';

export interface SdrLeadRecuperacao {
  /** 'regua' = automática (termina em suspensão) · 'winback' = campanha manual */
  trilha: 'regua' | 'winback';
  status: 'ATIVO' | 'CONVERTIDO' | 'RECUSADO' | 'SUSPENSO';
  segmento: SegmentoLead | null;
  etapa_atual: string | null;
  acesso_fim: string | null;
  suspender_em: string | null;
  dias_ate_suspensao: number | null;
  cupom: {
    codigo: string;
    valor: number;
    expira_em: string | null;
    resgatado_em: string | null;
  } | null;
}

export interface SdrLead {
  id: string;
  nome_negocio: string;
  email: string | null;
  telefone: string | null;
  registered_at: string;
  status: string;
  assinatura: SdrLeadAssinatura | null;
  admin: SdrLeadAdmin | null;
  sdr: SdrLeadTracking;
  recuperacao: SdrLeadRecuperacao | null;
  suspenso_em: string | null;
  trial_estendido_em: string | null;
}

export interface WinbackCandidato {
  empresaId: string;
  nomeEmpresa: string;
  nomeAdmin: string | null;
  telefone: string;
  segmento: SegmentoLead;
  assinaturaStatus: string | null;
  acessoFim: string | null;
}

export interface SdrTrackingEntry {
  id: string;
  status: string;
  tipo_contato: string | null;
  resultado: string | null;
  notas: string | null;
  proximo_contato: string | null;
  createdAt: string;
  sdrNome: string;
}

class SdrServiceApi {
  async getDashboardStats(): Promise<SdrDashboardStats> {
    return apiService.get<SdrDashboardStats>('/sdr/dashboard-stats');
  }

  async getLeads(params: {
    page?: number;
    limit?: number;
    search?: string;
    subscriptionStatus?: string;
    sdrStatus?: string;
    recuperacaoStatus?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: SdrLead[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.subscriptionStatus) query.set('subscriptionStatus', params.subscriptionStatus);
    if (params.sdrStatus) query.set('sdrStatus', params.sdrStatus);
    if (params.recuperacaoStatus) query.set('recuperacaoStatus', params.recuperacaoStatus);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    return apiService.get(`/sdr/leads?${query.toString()}`);
  }

  async getTrackingHistory(empresaId: string): Promise<SdrTrackingEntry[]> {
    return apiService.get<SdrTrackingEntry[]>(`/sdr/leads/${empresaId}/tracking`);
  }

  async createTracking(empresaId: string, data: {
    status?: string;
    tipo_contato?: string;
    resultado?: string;
    notas?: string;
    proximo_contato?: string;
  }): Promise<any> {
    return apiService.post(`/sdr/leads/${empresaId}/tracking`, data);
  }

  async updateLeadStatus(empresaId: string, data: { status: string; notas?: string }): Promise<any> {
    return apiService.patch(`/sdr/leads/${empresaId}/status`, data);
  }

  async getLeadDetail(empresaId: string): Promise<any> {
    return apiService.get(`/sdr/leads/${empresaId}/detail`);
  }

  // ---- Régua de recuperação ----

  /** Prévia da base histórica elegível a um segmento (trilha winback). */
  async getWinbackCandidatos(segmento: SegmentoLead, limit = 50): Promise<WinbackCandidato[]> {
    return apiService.get<WinbackCandidato[]>(
      `/recuperacao/winback/candidatos?segmento=${segmento}&limit=${limit}`,
    );
  }

  /** Enfileira a campanha. O envio é do dispatcher — respeita janela e ritmo. */
  async dispararWinback(segmento: SegmentoLead, empresaIds: string[]): Promise<{ notificacaoId: string; total: number }> {
    return apiService.post('/recuperacao/winback/disparar', { segmento, empresaIds });
  }

  async estenderAcesso(empresaId: string, dias?: number): Promise<any> {
    return apiService.patch(`/recuperacao/leads/${empresaId}/estender`, { dias });
  }

  async removerDaRecuperacao(empresaId: string, status: 'CONVERTIDO' | 'RECUSADO' = 'RECUSADO'): Promise<any> {
    return apiService.patch(`/recuperacao/leads/${empresaId}/remover`, { status });
  }

  async suspenderEmpresa(empresaId: string, motivo?: string): Promise<any> {
    return apiService.patch(`/super-admin/empresas/${empresaId}/suspender`, { motivo });
  }

  async reativarEmpresa(empresaId: string): Promise<any> {
    return apiService.patch(`/super-admin/empresas/${empresaId}/reativar`, {});
  }
}

export const sdrService = new SdrServiceApi();
