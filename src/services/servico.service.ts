import { apiService } from './api';
import type { Cargo } from './cargo.service';

export interface ServicoCargoPivot {
  cargoId: string;
  servicoId: string;
  cargo?: Cargo;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracao_minutos: number;
  empresaId: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  tipo_comissao_padrao: string;
  valor_comissao_padrao: number;
  ciclo_manutencao_dias?: number;
  imagem_url?: string;
  cargos?: ServicoCargoPivot[];
  bloqueado_agendamento_externo?: boolean;
}

export interface CreateServicoData {
  nome: string;
  descricao?: string;
  preco: number;
  duracao_minutos: number;
  empresaId: string;
  ativo?: boolean;
  tipo_comissao_padrao?: string;
  valor_comissao_padrao?: number;
  ciclo_manutencao_dias?: number;
  imagem_url?: string;
  bloqueado_agendamento_externo?: boolean;
}

export interface UpdateServicoData {
  nome?: string;
  descricao?: string;
  preco?: number;
  duracao_minutos?: number;
  ativo?: boolean;
  tipo_comissao_padrao?: string;
  valor_comissao_padrao?: number;
  ciclo_manutencao_dias?: number;
  imagem_url?: string;
  bloqueado_agendamento_externo?: boolean;
}

interface CacheData<T> {
  data: T;
  timestamp: number;
}

class ServicoService {
  private cacheServicosTodos: CacheData<Servico[]> | null = null;
  private cacheServicosAtivos: CacheData<Servico[]> | null = null;
  private readonly CACHE_TTL = 1000 * 60 * 15; // 15 minutos

  private invalidateCache() {
    this.cacheServicosTodos = null;
    this.cacheServicosAtivos = null;
  }
  async getServicos(
    arg1?: string | { search?: string; status?: string; page?: number; limit?: number; empresaId?: string; } | AbortSignal, 
    arg2?: string | AbortSignal,
    arg3?: number,
    arg4?: number,
    arg5?: AbortSignal
  ): Promise<any> {
    const agora = Date.now();
    let search: string | undefined;
    let status: string | undefined;
    let page: number = 1;
    let limit: number = 10;
    let empresaId: string | undefined;
    let finalSignal: AbortSignal | undefined;

    // Caso 1: Primeiro argumento é um objeto de parâmetros
    if (arg1 && typeof arg1 === 'object' && !(arg1 instanceof AbortSignal)) {
      const p = arg1 as any;
      search = p.search;
      status = p.status;
      page = p.page || 1;
      limit = p.limit || 10;
      empresaId = p.empresaId;
      finalSignal = arg2 instanceof AbortSignal ? arg2 : undefined;
    } 
    // Caso 2: Argumentos posicionais (legado)
    else {
      search = typeof arg1 === 'string' ? arg1 : undefined;
      status = typeof arg2 === 'string' ? arg2 : undefined;
      page = typeof arg3 === 'number' ? arg3 : 1;
      limit = typeof arg4 === 'number' ? arg4 : 10;
      
      if (arg1 instanceof AbortSignal) finalSignal = arg1;
      else if (arg2 instanceof AbortSignal) finalSignal = arg2;
      else if (arg5 instanceof AbortSignal) finalSignal = arg5;
    }

    if (!search && !status && page === 1) {
      if (this.cacheServicosTodos && (agora - this.cacheServicosTodos.timestamp < this.CACHE_TTL) && this.cacheServicosTodos.data.length > 0) {
        return this.cacheServicosTodos.data;
      }
    }

    const response = await apiService.get<any>('/servicos', { 
      params: { 
        search, 
        status, 
        // Apenas enviar página/limite se houver busca ou filtro ou se NÃO for legado (empresaId presente)
        ...( (search || (status && status !== 'todos') || !empresaId) ? { page, limit } : {} ),
        empresaId 
      },
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

    if (Array.isArray(response)) {
      this.cacheServicosTodos = { data: response, timestamp: agora };
    }
    return response;
  }

  async getServicosAtivos(empresaId?: string): Promise<Servico[]> {
    const agora = Date.now();
    if (this.cacheServicosAtivos && (agora - this.cacheServicosAtivos.timestamp < this.CACHE_TTL) && this.cacheServicosAtivos.data.length > 0) {
      return this.cacheServicosAtivos.data;
    }

    const data = await apiService.get<Servico[]>('/servicos/ativos', {
      params: { empresaId }
    });
    this.cacheServicosAtivos = { data, timestamp: agora };
    return data;
  }

  async getServicosSuperadmin(empresaId: string): Promise<Servico[]> {
    return await apiService.get<Servico[]>(`/servicos/superadmin/ativos?empresaId=${empresaId}`);
  }

  async getServico(id: string): Promise<Servico> {
    return await apiService.get<Servico>(`/servicos/${id}`);
  }

  async createServico(data: CreateServicoData): Promise<Servico> {
    const result = await apiService.post<Servico>('/servicos', data);
    this.invalidateCache();
    return result;
  }

  async updateServico(id: string, data: UpdateServicoData): Promise<Servico> {
    const result = await apiService.put<Servico>(`/servicos/${id}`, data);
    this.invalidateCache();
    return result;
  }

  async deleteServico(id: string): Promise<void> {
    await apiService.delete(`/servicos/${id}`);
    this.invalidateCache();
  }

  async toggleStatus(id: string): Promise<Servico> {
    const result = await apiService.put<Servico>(`/servicos/${id}/toggle-status`, {});
    this.invalidateCache();
    return result;
  }

  async syncAllToRoles(): Promise<{ count: number }> {
    const result = await apiService.post<{ count: number }>('/servicos/sync-all-to-roles', {});
    this.invalidateCache();
    return result;
  }

  async uploadLote(servicos: any[]): Promise<any> {
    const result = await apiService.post<any>('/servicos/upload-lote', { servicos });
    this.invalidateCache();
    return result;
  }

  async uploadImage(id: string, file: File): Promise<{ url: string }> {
    const result = await apiService.uploadFile<{ url: string }>(`/servicos/${id}/upload-image`, file);
    this.invalidateCache();
    return result;
  }

  async deleteImage(id: string): Promise<void> {
    await apiService.delete(`/servicos/${id}/image`);
    this.invalidateCache();
  }
}

export const servicoService = new ServicoService();