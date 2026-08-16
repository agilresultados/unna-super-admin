import { apiService as api } from './api';

export interface TermosGeraisConfig {
  /** Liga o bloqueio. Com isto ligado, admin de salão não usa o sistema sem aceitar. */
  exigir_aceite: boolean;
  /** Versão que precisa estar aceita. Vazia = não exige nada. */
  versao: string;
  publicado_em: string | null;
  /** O que mudou. Aparece na tela de aceite do salão. */
  resumo: string | null;
}

/**
 * Exigência de aceite dos termos de uso da plataforma.
 *
 * Rota restrita ao super admin: ligar isto impede TODO administrador de salão de
 * usar o sistema até aceitar. Colaboradoras não são bloqueadas.
 */
export const termosService = {
  getConfig: async (): Promise<TermosGeraisConfig> => {
    return await api.get<TermosGeraisConfig>('/termos/config');
  },

  updateConfig: async (data: Partial<TermosGeraisConfig>): Promise<TermosGeraisConfig> => {
    return await api.put<TermosGeraisConfig>('/termos/config', data);
  },
};
