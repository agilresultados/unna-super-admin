import { apiService } from './api';

/**
 * Acompanhamento dos salões no WhatsApp oficial e lista de liberação (super admin).
 */

export type EstadoCanalOficial = 'preparando' | 'ativo' | 'pausado' | 'desconectado';
export type MotivoPausa = 'sem_saldo' | 'pagamento_meta';

export interface SalaoOficial {
  empresaId: string;
  nome: string | null;
  numero: string | null;
  estado: EstadoCanalOficial;
  motivoPausa: MotivoPausa | null;
  templates: {
    aprovados: number;
    total: number;
    rejeitados: { nome: string; motivo: string | null }[];
  };
  saldo: number;
  enviados7d: number;
  falhas7d: number;
}

export interface LiberacaoOficial {
  liberado_para_todos: boolean;
  emails_liberados: string[];
}

export interface PainelSaloesOficial {
  liberacao: LiberacaoOficial;
  saloes: SalaoOficial[];
}

class WhatsappOficialService {
  async listarSaloes(): Promise<PainelSaloesOficial> {
    return await apiService.get<PainelSaloesOficial>('/whatsapp/oficial/admin/saloes');
  }

  async atualizarLiberacao(liberacao: LiberacaoOficial): Promise<LiberacaoOficial> {
    return await apiService.put<LiberacaoOficial>('/whatsapp/oficial/admin/liberacao', liberacao);
  }
}

export const whatsappOficialService = new WhatsappOficialService();
