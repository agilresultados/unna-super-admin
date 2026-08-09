import { apiService } from './api';

export interface Plano {
  id: string;
  nome: string;
  tipo: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  preco_mensal: number;
  preco_anual: number;
  max_colaboradores: number;
  max_clientes: number;
  recursos: any;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanoData {
  nome: string;
  tipo: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  preco_mensal: number;
  preco_anual: number;
  max_colaboradores: number;
  max_clientes: number;
  recursos: any;
  ativo?: boolean;
}

export interface UpdatePlanoData {
  nome?: string;
  tipo?: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  preco_mensal?: number;
  preco_anual?: number;
  max_colaboradores?: number;
  max_clientes?: number;
  recursos?: any;
  ativo?: boolean;
}

class PlanoService {
  async getPlanos(onlyActive = false): Promise<Plano[]> {
    const url = onlyActive ? '/planos?ativos=true' : '/planos';
    return await apiService.get<Plano[]>(url);
  }

  async getPlano(id: string): Promise<Plano> {
    return await apiService.get<Plano>(`/planos/${id}`);
  }

  async createPlano(data: CreatePlanoData): Promise<Plano> {
    return await apiService.post<Plano>('/planos', data);
  }

  async updatePlano(id: string, data: UpdatePlanoData): Promise<Plano> {
    return await apiService.put<Plano>(`/planos/${id}`, data);
  }

  async deletePlano(id: string): Promise<void> {
    await apiService.delete(`/planos/${id}`);
  }

  async togglePlanoStatus(id: string): Promise<Plano> {
    return await apiService.patch<Plano>(`/planos/${id}/toggle-status`);
  }
}

export const planoService = new PlanoService(); 