import { apiService } from './api';
import type { Servico } from './servico.service';
import { PaginatedResponse } from '@/types/pagination';

export interface CargoServicoPivot {
  cargoId: string;
  servicoId: string;
  servico?: Servico;
}

export interface Cargo {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  servicos?: CargoServicoPivot[];
}

export interface CreateCargoDto {
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export interface UpdateCargoDto {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}

class CargoService {
  async getCargos(
    arg1?: string | { search?: string; status?: string; page?: number; limit?: number; } | AbortSignal, 
    arg2?: string | AbortSignal, 
    arg3?: number, 
    arg4?: number, 
    arg5?: AbortSignal
  ): Promise<PaginatedResponse<Cargo> & { stats: any }> {
    let search: string | undefined;
    let status: string | undefined;
    let page: number = 1;
    let limit: number = 10;
    let finalSignal: AbortSignal | undefined;

    // Caso 1: Primeiro argumento é um objeto de parâmetros
    if (arg1 && typeof arg1 === 'object' && !(arg1 instanceof AbortSignal)) {
      const p = arg1 as any;
      search = p.search;
      status = p.status;
      page = p.page || 1;
      limit = p.limit || 10;
      finalSignal = arg2 instanceof AbortSignal ? arg2 : undefined;
    } 
    // Caso 2: Argumentos posicionais (legado)
    else {
      search = typeof arg1 === 'string' ? arg1 : undefined;
      status = typeof arg2 === 'string' ? arg2 : (arg2 instanceof AbortSignal ? undefined : undefined);
      page = typeof arg3 === 'number' ? arg3 : 1;
      limit = typeof arg4 === 'number' ? arg4 : 10;
      
      // Detectar signal em qualquer das posições possíveis
      if (arg1 instanceof AbortSignal) finalSignal = arg1;
      else if (arg2 instanceof AbortSignal) finalSignal = arg2;
      else if (arg5 instanceof AbortSignal) finalSignal = arg5;
    }

    // Determinar endpoint baseado na necessidade de paginação/filtro
    const isBasic = !search && page === 1 && (!status || status === 'todos');
    const endpoint = isBasic ? '/cargos' : '/cargos/paginado';

    const response = await apiService.get<any>(endpoint, { 
      params: { search, status, page, limit },
      signal: finalSignal 
    });

    if (response && response.data && response.pagination) {
        return {
            dados: response.data,
            total: response.pagination.total,
            page: response.pagination.page,
            lastPage: response.pagination.totalPages,
            stats: response.stats
        };
    }

    return response;
  }
  async getCargosInativos(): Promise<Cargo[]> {
    const response = await apiService.get<Cargo[]>('/cargos/inativos');
    return response;
  }

  async getCargoById(id: string): Promise<Cargo> {
    const response = await apiService.get<Cargo>(`/cargos/${id}`);
    return response;
  }

  async createCargo(data: CreateCargoDto): Promise<Cargo> {
    const response = await apiService.post<Cargo>('/cargos', data);
    return response;
  }

  async updateCargo(id: string, data: UpdateCargoDto): Promise<Cargo> {
    const response = await apiService.put<Cargo>(`/cargos/${id}`, data);
    return response;
  }

  async activateCargo(id: string): Promise<void> {
    await apiService.put(`/cargos/${id}/activate`, {});
  }

  async deleteCargo(id: string): Promise<void> {
    await apiService.delete(`/cargos/${id}`);
  }

  async getServicosDoCargo(id: string): Promise<CargoServicoPivot[]> {
    return await apiService.get<CargoServicoPivot[]>(`/cargos/${id}/servicos`);
  }

  async setServicosDoCargo(id: string, servicoIds: string[]): Promise<CargoServicoPivot[]> {
    return await apiService.post<CargoServicoPivot[]>(`/cargos/${id}/servicos`, { servicoIds });
  }

  async addServicoAoCargo(id: string, servicoId: string): Promise<CargoServicoPivot> {
    return await apiService.post<CargoServicoPivot>(`/cargos/${id}/servicos/${servicoId}`, {});
  }

  async removeServicoDoCargo(id: string, servicoId: string): Promise<void> {
    await apiService.delete(`/cargos/${id}/servicos/${servicoId}`);
  }
}

export const cargoService = new CargoService();
