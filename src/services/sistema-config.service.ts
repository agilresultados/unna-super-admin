import { apiService as api } from './api';

export const sistemaConfigService = {
    getConfig: async (chave: string): Promise<any> => {
        const response = await api.get<any>(`/sistema-config/${chave}`);
        return response;
    },

    getAllConfig: async (): Promise<Record<string, any>> => {
        const response = await api.get<Record<string, any>>('/sistema-config');
        return response || {};
    },

    setConfig: async (chave: string, valor: any): Promise<any> => {
        const response = await api.post<any>(`/sistema-config/${chave}`, { valor });
        return response;
    }
};
