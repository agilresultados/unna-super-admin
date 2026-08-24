import { apiService } from './api';

export interface Campanha {
    id: string;
    titulo: string;
    descricao?: string;
    imagem_url: string;
    link_url?: string;
    tipo: 'FLUTUANTE' | 'FLUTUANTE_9_16' | 'FIXA_MENU';
    empresaId?: string;
}

export const campanhaService = {
    findActive: async (empresaId?: string) => {
        const qs = empresaId ? `?empresaId=${empresaId}` : '';
        return apiService.get<Campanha[]>(`/campanhas/ativas${qs}`);
    },

    track: async (campanhaId: string, tipo: 'VISTA' | 'CLIQUE') => {
        return apiService.post(`/campanhas/${campanhaId}/track`, { tipo });
    },

    // Admin methods
    findAll: async () => {
        return apiService.get<Campanha[]>('/campanhas');
    },

    create: async (data: any) => {
        return apiService.post('/campanhas', data);
    },

    update: async (id: string, data: any) => {
        return apiService.put(`/campanhas/${id}`, data);
    },

    remove: async (id: string) => {
        return apiService.delete(`/campanhas/${id}`);
    },

    getMetrics: async (id: string) => {
        return apiService.get(`/campanhas/${id}/metrics`);
    }
};
