import { apiService } from './api';

export interface EmpresaMarketing {
  id: string;
  nome_negocio: string;
  email?: string;
  telefone?: string;
  cnpj?: string;
  status: string;
  registered_at: string;
  total_clientes: number;
  total_colaboradores: number;
  total_agendamentos: number;
  ultimo_agendamento?: string | null;
  dias_ativo: number;
  assinatura?: {
    status: string;
    data_inicio?: string;
    data_fim?: string;
    plano?: { nome: string; preco_mensal: number };
  } | null;
  marketing_optout?: boolean;
  marketing_optout_at?: string | null;
}

export interface EmpresasMarketingResponse {
  data: EmpresaMarketing[];
  total: number;
  pages: number;
  page: number;
}

export interface MarketingFiltros {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  subscriptionStatus?: string;
  semAssinatura?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
}

export interface EmailTemplate {
  id: string;
  nome: string;
  assunto: string;
  corpo_html: string;
  corpo_texto?: string;
  ativo: boolean;
  variaveis: string[];
  categoria?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { envios: number };
}

export interface EmailCampanhaEnvio {
  id: string;
  templateId: string;
  empresaId: string;
  email_destino: string;
  status: string;
  erro_msg?: string;
  ses_message_id?: string;
  createdAt: string;
  empresa?: { nome_negocio: string; email?: string };
}

export interface LeadInput {
  nome: string;
  email: string;
}

export interface EmailLeadEnvio {
  id: string;
  templateId: string;
  nome_lead: string;
  email_destino: string;
  status: string;
  erro_msg?: string;
  ses_message_id?: string;
  click_token: string;
  clicou_link: boolean;
  clicou_em?: string | null;
  link_destino?: string;
  unsubscribed: boolean;
  createdAt: string;
}

class MarketingService {
  // ─────────── Empresas ───────────
  async getEmpresasMarketing(params: MarketingFiltros = {}): Promise<EmpresasMarketingResponse> {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.search) q.append('search', params.search);
    if (params.status && params.status !== 'all') q.append('status', params.status);
    if (params.subscriptionStatus && params.subscriptionStatus !== 'all')
      q.append('subscriptionStatus', params.subscriptionStatus);
    if (params.semAssinatura) q.append('semAssinatura', 'true');
    if (params.dateFrom) q.append('dateFrom', params.dateFrom);
    if (params.dateTo) q.append('dateTo', params.dateTo);
    if (params.sortBy) q.append('sortBy', params.sortBy);
    return apiService.get<EmpresasMarketingResponse>(`/super-admin/marketing/empresas?${q.toString()}`);
  }

  // ─────────── Templates ───────────
  async listarTemplates(): Promise<EmailTemplate[]> {
    return apiService.get<EmailTemplate[]>('/super-admin/marketing/templates');
  }

  async criarTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    return apiService.post<EmailTemplate>('/super-admin/marketing/templates', data);
  }

  async atualizarTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    return apiService.put<EmailTemplate>(`/super-admin/marketing/templates/${id}`, data);
  }

  async deletarTemplate(id: string): Promise<void> {
    await apiService.delete(`/super-admin/marketing/templates/${id}`);
  }

  async getHistoricoEnvios(templateId: string, page = 1): Promise<{ data: EmailCampanhaEnvio[]; total: number; pages: number }> {
    return apiService.get(`/super-admin/marketing/templates/${templateId}/historico?page=${page}&limit=50`);
  }

  // ─────────── Disparo ───────────
  async enviarCampanha(templateId: string, empresaIds: string[]): Promise<{ enviados: number; pulados: number; erros: number }> {
    return apiService.post('/super-admin/marketing/enviar', { templateId, empresaIds });
  }

  // ─────────── Leads Externos ───────────
  async enviarCampanhaLeads(templateId: string, leads: LeadInput[], linkDestino: string): Promise<{ enviados: number; pulados: number; erros: number }> {
    return apiService.post('/super-admin/marketing/enviar-leads', { templateId, leads, linkDestino });
  }

  async getHistoricoEnviosLead(templateId: string, page = 1): Promise<{ data: EmailLeadEnvio[]; total: number; pages: number }> {
    return apiService.get(`/super-admin/marketing/templates/${templateId}/historico-leads?page=${page}&limit=50`);
  }
}

export const marketingService = new MarketingService();

