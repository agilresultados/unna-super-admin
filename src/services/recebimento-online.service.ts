import { apiService as api } from './api';

export interface RecebimentoOnlineConfig {
  /** Libera para toda a base. Desligado, vale só a lista. */
  liberado_para_todos: boolean;
  /** E-mails com acesso liberado (minúsculas, sem duplicata). */
  emails_liberados: string[];
}

/**
 * Rollout do recebimento de pagamentos online — quais salões podem cobrar o
 * cliente final por Pix na própria conta do Mercado Pago.
 *
 * Rotas restritas ao super admin. O padrão do backend é NINGUÉM: sem nada salvo
 * aqui, nenhuma empresa recebe online.
 */
export const recebimentoOnlineService = {
  getConfig: async (): Promise<RecebimentoOnlineConfig> => {
    return await api.get<RecebimentoOnlineConfig>('/recebimento-online/config');
  },

  updateConfig: async (
    data: Partial<RecebimentoOnlineConfig>,
  ): Promise<RecebimentoOnlineConfig> => {
    return await api.put<RecebimentoOnlineConfig>('/recebimento-online/config', data);
  },
};
