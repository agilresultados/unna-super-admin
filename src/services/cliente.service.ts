import { apiService } from './api';

export interface Endereco {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cliente {
  id: string;
  nome: string;
  sobrenome?: string;
  cpf?: string;
  email?: string | null;
  telefone: string;
  data_nascimento?: string;
  endereco?: Endereco;
  empresaId: string;
  status: string;
  bloqueado_agendamento?: boolean;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    visitas: number;
    total_ticket: number;
    avg_ticket: number;
  };
  saldoDevedor?: number;
  saldoCredito?: number;
}

export interface CreateClienteData {
  nome: string;
  sobrenome?: string;
  cpf?: string;
  email?: string;
  telefone: string;
  data_nascimento?: string;
  endereco?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  complemento?: string;
  empresaId?: string;
}
export interface UpdateClienteData extends Partial<CreateClienteData> {
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ClienteFilters {
  page?: number;
  limit?: number;
  status?: 'ativo' | 'inativo';
  search?: string;
  filter?: 'aniversariantes' | 'ausentes' | 'assiduos' | 'em_debito' | 'com_credito';
  startDate?: string;
  endDate?: string;
  sortBy?: 'visitas' | 'avg_ticket' | 'total_ticket' | 'nome';
}

export interface ClienteStats {
  total: number;
  ativos: number;
  inativos: number;
}

interface CacheData<T> {
  data: T;
  timestamp: number;
}

class ClienteService {
  private cacheClientes: CacheData<Cliente[]> | null = null;
  private readonly CACHE_TTL = 1000 * 60 * 15; // 15 minutos

  private invalidateCache() {
    this.cacheClientes = null;
  }
  async getClientes(empresaId?: string, signal?: AbortSignal): Promise<Cliente[]> {
    const agora = Date.now();

    // Retorna do cache se válido
    if (this.cacheClientes && (agora - this.cacheClientes.timestamp < this.CACHE_TTL) && this.cacheClientes.data.length > 0) {
      return this.cacheClientes.data;
    }

    const params = empresaId ? `?empresaId=${empresaId}&limit=1000` : '?limit=1000';
    const response = await apiService.get<any>(`/clientes${params}`, { signal });

    if (response && response.data && Array.isArray(response.data)) {
      this.cacheClientes = { data: response.data, timestamp: agora };
      return response.data;
    }

    const fallbackData = Array.isArray(response) ? response : [];
    this.cacheClientes = { data: fallbackData, timestamp: agora };
    return fallbackData;
  }

  async getClientesPaginated(filters: ClienteFilters = {}, signal?: AbortSignal): Promise<any> {
    const params: Record<string, any> = {};

    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.filter) params.filter = filters.filter;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.sortBy) params.sortBy = filters.sortBy;

    const response = await apiService.get<any>('/clientes', { 
      params,
      signal 
    });

    if (response && response.data && response.pagination) {
      return {
        dados: response.data,
        total: response.pagination.total,
        page: response.pagination.page,
        lastPage: response.pagination.totalPages,
        hasNext: response.pagination.hasNext,
        hasPrev: response.pagination.hasPrev
      };
    }

    return response;
  }

  async getClientesStats(): Promise<ClienteStats> {
    return await apiService.get<ClienteStats>('/clientes/stats');
  }

  async getCliente(id: string): Promise<Cliente> {
    return await apiService.get<Cliente>(`/clientes/${id}`);
  }

  async createCliente(data: CreateClienteData): Promise<Cliente> {
    const result = await apiService.post<Cliente>('/clientes', data);
    this.invalidateCache();
    return result;
  }

  async updateCliente(id: string, data: UpdateClienteData): Promise<Cliente> {
    const result = await apiService.put<Cliente>(`/clientes/${id}`, data);
    this.invalidateCache();
    return result;
  }

  async deleteCliente(id: string): Promise<void> {
    await apiService.delete(`/clientes/${id}`);
    this.invalidateCache();
  }

  /** Bloqueia/desbloqueia o cliente para agendamento online (link público). */
  async setBloqueioAgendamento(id: string, bloqueado: boolean): Promise<Cliente> {
    const result = await apiService.put<Cliente>(`/clientes/${id}/bloqueio-agendamento`, { bloqueado });
    this.invalidateCache();
    return result;
  }

  async deleteClientePermanente(id: string): Promise<void> {
    await apiService.delete(`/clientes/${id}/permanent`);
    this.invalidateCache();
  }

  async limparInativos(): Promise<{ total: number, removidos: number, pulados: number }> {
    const result = await apiService.delete<any>('/clientes/limpar-inativos');
    this.invalidateCache();
    return result;
  }

  async getMembrosClube(empresaId: string): Promise<Cliente[]> {
    return await apiService.get<Cliente[]>(`/clientes/membros-clube?empresaId=${empresaId}`);
  }

  async uploadClientesEmLote(clientes: any[]): Promise<any> {
    const result = await apiService.post<any>('/clientes/upload-lote', { clientes });
    this.invalidateCache();
    return result;
  }

  async getClienteProfile(id: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const url = `/clientes/${id}/profile${queryString ? `?${queryString}` : ''}`;
    return await apiService.get<any>(url);
  }

  async clearCache(): Promise<void> {
    await apiService.delete('/clientes/cache/clear');
    this.invalidateCache();
  }
}

export const clienteService = new ClienteService(); 