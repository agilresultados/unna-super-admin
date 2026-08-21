import { apiService } from './api';

/**
 * Reajuste de preço da base assinante (super admin).
 *
 * Mexer no preço do plano em /planos só vale para novas adesões — quem já
 * assinou tem o valor congelado em `Assinatura.valor_contratado`. É por aqui
 * que a base é reajustada, com aviso prévio de 30 dias (cláusula 7.1 dos
 * Termos de Uso).
 */

export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type ReajusteStatus = 'AGENDADO' | 'AVISADO' | 'APLICADO' | 'CANCELADO';
export type ReajusteItemStatus = 'PENDENTE' | 'APLICADO' | 'PULADO' | 'FALHOU';

export interface ReajusteParams {
  planoId: string;
  billing_cycle?: BillingCycle;
  valor_novo: number;
  /** ISO date (YYYY-MM-DD). Mínimo 30 dias a partir de hoje. */
  vigencia_em: string;
  /** Opcional: alcança só quem assinou até esta data. */
  adesao_ate?: string;
  motivo?: string;
}

export interface ReajusteAlcancada {
  assinaturaId: string;
  empresa: string | null;
  valor_anterior: number;
  valor_novo: number;
  gateway: string;
}

export interface ReajusteFora {
  assinaturaId: string;
  empresa: string;
  motivo: string;
}

export interface ReajustePreview {
  total_alcancadas: number;
  total_fora: number;
  soma_atual: number;
  soma_nova: number;
  delta: number;
  vigencia_em: string;
  valor_novo: number;
  alcancadas: ReajusteAlcancada[];
  fora: ReajusteFora[];
}

export interface Reajuste {
  id: string;
  planoId: string;
  plano?: { nome: string };
  billing_cycle: BillingCycle;
  valor_novo: number;
  adesao_ate: string | null;
  vigencia_em: string;
  aviso_enviado_em: string | null;
  aplicado_em: string | null;
  status: ReajusteStatus;
  motivo: string | null;
  criado_por: string | null;
  createdAt: string;
  total_itens?: number;
  _count?: { itens: number };
}

export interface ReajusteItem {
  id: string;
  assinaturaId: string;
  valor_anterior: number;
  valor_novo: number;
  status: ReajusteItemStatus;
  detalhe: string | null;
  aplicado_em: string | null;
  assinatura?: {
    id: string;
    gateway: string | null;
    empresa?: { nome_negocio: string; email: string | null };
  };
}

export interface ReajusteDetalhe extends Reajuste {
  itens: ReajusteItem[];
}

export interface ResultadoAviso {
  enviados: number;
  falhas: { empresa: string; erro: string }[];
}

export interface ResultadoAplicacao {
  aplicados: number;
  pulados: number;
  falhas: number;
  pendentes: number;
}

const BASE = '/super-admin/reajustes';

class ReajusteService {
  async preview(params: ReajusteParams): Promise<ReajustePreview> {
    return await apiService.post<ReajustePreview>(`${BASE}/preview`, params);
  }

  async criar(params: ReajusteParams): Promise<Reajuste> {
    return await apiService.post<Reajuste>(BASE, params);
  }

  async listar(): Promise<Reajuste[]> {
    return await apiService.get<Reajuste[]>(BASE);
  }

  async detalhar(id: string): Promise<ReajusteDetalhe> {
    return await apiService.get<ReajusteDetalhe>(`${BASE}/${id}`);
  }

  async enviarAviso(id: string): Promise<ResultadoAviso> {
    return await apiService.post<ResultadoAviso>(`${BASE}/${id}/aviso`);
  }

  async aplicar(id: string): Promise<ResultadoAplicacao> {
    return await apiService.post<ResultadoAplicacao>(`${BASE}/${id}/aplicar`);
  }

  async cancelar(id: string): Promise<Reajuste> {
    return await apiService.delete<Reajuste>(`${BASE}/${id}`);
  }
}

export const reajusteService = new ReajusteService();
