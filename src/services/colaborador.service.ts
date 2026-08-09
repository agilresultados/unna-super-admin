import { apiService } from './api';
import { Servico } from './servico.service';
import type { Cargo } from './cargo.service';

export interface ColaboradorServico {
  servicoId: string;
  servico?: Servico;
  tipo_comissao: string;
  valor_comissao: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ColaboradorCargo {
  cargoId: string;
  cargo?: Cargo;
}

export interface Colaborador {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
  salario: number;
  dataAdmissao?: string;
  valor_comissao?: number;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
  tipo_comissao: string;
  senha_hash?: string;
  senha?: string; // Campo para senha em texto plano (apenas para envio)
  status: string;
  canReceiveAppointments?: boolean | null; // null/undefined = herda da função
  role?: {
    id: string;
    nome: string;
    descricao?: string;
    isDefault: boolean;
    canReceiveAppointments?: boolean;
  };
  avatar_url?: string;
  usuario?: {
    id: string;
    role: string;
    status: string;
  };
  servicos?: ColaboradorServico[];
  cargos?: ColaboradorCargo[];
  _count?: {
    agendamentos: number;
    comissoes: number;
    transacoes_caixa: number;
  };
}

export interface ColaboradorPerfil extends Colaborador {
  servicosDisponiveis: Servico[];
  servicosPersonalizados: ColaboradorServico[];
}

export interface CreateColaboradorData {
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
  salario: number;
  dataAdmissao?: string;
  empresaId: string;
  tipo_comissao: string;
  valor_comissao: number;
  status: string; // Adicionado campo status
  canReceiveAppointments?: boolean | null; // null = herda da função
  senha: string; // Senha obrigatória para criação
  senha_hash?: string;
  servicos?: Array<{ servicoId: string; tipo_comissao?: string; valor_comissao: number }>;
  cargoIds?: string[];
  roleId?: string;
}

export interface UpdateColaboradorData {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  dataNascimento?: string;
  salario?: number;
  dataAdmissao?: string;
  valor_comissao?: number;
  tipo_comissao?: string;
  senha?: string; // Senha opcional para atualização
  senha_hash?: string;
  status?: string;
  canReceiveAppointments?: boolean | null; // null = herda da função
  avatar_url?: string;
  servicos?: Array<{ servicoId: string; tipo_comissao?: string; valor_comissao: number }>;
  cargoIds?: string[];
  roleId?: string;
}

/**
 * Regra efetiva de recebimento de agendamentos.
 * Override do colaborador tem prioridade; senão usa o padrão da função; senão true.
 */
export const colaboradorRecebeAgendamento = (c: any): boolean =>
  (c?.canReceiveAppointments ?? c?.role?.canReceiveAppointments ?? true) !== false;

interface CacheData<T> {
  data: T;
  timestamp: number;
}

class ColaboradorService {
  private cacheColaboradores: CacheData<Colaborador[]> | null = null;
  private readonly CACHE_TTL = 1000 * 60 * 15; // 15 minutos

  public invalidateCache() {
    this.cacheColaboradores = null;
  }

  async getColaboradores(
    arg1?: string | { page?: number; limit?: number; status?: string; search?: string; empresaId?: string; } | AbortSignal, 
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
    // Caso 2: Argumentos posicionais (legado ou simplificado)
    else {
      // Se for string, assume que é empresaId (comportamento original do mobile)
      empresaId = typeof arg1 === 'string' ? arg1 : undefined;
      // Se for string no segundo, assume que é status
      status = typeof arg2 === 'string' ? arg2 : undefined;
      page = typeof arg3 === 'number' ? arg3 : 1;
      limit = typeof arg4 === 'number' ? arg4 : 10;
      
      if (arg1 instanceof AbortSignal) finalSignal = arg1;
      else if (arg2 instanceof AbortSignal) finalSignal = arg2;
      else if (arg5 instanceof AbortSignal) finalSignal = arg5;
    }

    if (!search && !status && page === 1) {
      if (this.cacheColaboradores && (agora - this.cacheColaboradores.timestamp < this.CACHE_TTL) && this.cacheColaboradores.data.length > 0) {
        return this.cacheColaboradores.data;
      }
    }

    const response = await apiService.get<any>('/colaboradores', { 
      params: { 
        search, 
        status, 
        // Apenas enviar página/limite se houver busca, filtro ou se NÃO for uma chamada legada básica
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
      this.cacheColaboradores = { data: response, timestamp: agora };
    }
    return response;
  }

  async getColaboradoresSuperadmin(empresaId: string, status?: string): Promise<Colaborador[]> {
    return await apiService.get<Colaborador[]>(`/colaboradores/superadmin/list?empresaId=${empresaId}${status ? `&status=${status}` : ''}`);
  }

  async getColaborador(id: string): Promise<Colaborador> {
    return await apiService.get<Colaborador>(`/colaboradores/${id}`);
  }

  async getPerfil(id: string): Promise<ColaboradorPerfil> {
    return await apiService.get<ColaboradorPerfil>(`/colaboradores/${id}/perfil`);
  }

  async createColaborador(data: CreateColaboradorData): Promise<Colaborador> {
    const result = await apiService.post<Colaborador>('/colaboradores', data);
    this.invalidateCache();
    return result;
  }

  async updateColaborador(id: string, data: UpdateColaboradorData): Promise<Colaborador> {
    const result = await apiService.put<Colaborador>(`/colaboradores/${id}`, data);
    this.invalidateCache();
    return result;
  }

  async deleteColaborador(id: string): Promise<void> {
    await apiService.delete(`/colaboradores/${id}`);
    this.invalidateCache();
  }

  async permanentDelete(id: string): Promise<void> {
    await apiService.delete(`/colaboradores/${id}/permanent`);
    this.invalidateCache();
  }

  async getMe(): Promise<Colaborador> {
    return await apiService.get<Colaborador>('/colaboradores/me');
  }

  async updateMinhaDisponibilidade(disponibilidade: any): Promise<Colaborador> {
    const result = await apiService.put<Colaborador>('/colaboradores/me/disponibilidade', {
      disponibilidade
    });
    this.invalidateCache();
    return result;
  }

  async updateMeuPerfil(data: {
    nome?: string;
    email?: string;
    telefone?: string;
    senha_atual?: string;
    nova_senha?: string;
  }): Promise<Colaborador> {
    const result = await apiService.put<Colaborador>('/colaboradores/me/perfil', data);
    this.invalidateCache();
    return result;
  }

  async getMinhaDisponibilidade(): Promise<any> {
    try {
      return await apiService.get<any>('/colaboradores/me/disponibilidade');
    } catch (error) {
      console.warn('Erro ao carregar disponibilidade da API, usando dados mock:', error);
      // Retorna dados mock como fallback
      return {
        segunda: { inicio: '09:00', fim: '18:00', disponivel: true },
        terca: { inicio: '09:00', fim: '18:00', disponivel: true },
        quarta: { inicio: '09:00', fim: '18:00', disponivel: true },
        quinta: { inicio: '09:00', fim: '18:00', disponivel: true },
        sexta: { inicio: '09:00', fim: '18:00', disponivel: true },
        sabado: { inicio: '08:00', fim: '17:00', disponivel: true },
        domingo: { inicio: '00:00', fim: '00:00', disponivel: false }
      };
    }
  }

  async getDisponibilidade(id: string): Promise<any> {
    return await apiService.get<any>(`/colaboradores/${id}/disponibilidade`);
  }

  async updateDisponibilidade(id: string, disponibilidade: any): Promise<any> {
    const result = await apiService.put<any>(`/colaboradores/${id}/disponibilidade`, {
      disponibilidade
    });
    this.invalidateCache();
    return result;
  }

  // ===== MÉTODOS PARA SERVIÇOS DO COLABORADOR =====
  async getServicosByColaborador(id: string): Promise<ColaboradorServico[]> {
    return await apiService.get<ColaboradorServico[]>(`/colaboradores/${id}/servicos`);
  }

  async addServicoToColaborador(
    colaboradorId: string,
    servicoId: string,
    tipoComissao: string,
    valorComissao: number
  ): Promise<ColaboradorServico> {
    const result = await apiService.post<ColaboradorServico>(`/colaboradores/${colaboradorId}/servicos`, {
      servicoId,
      tipo_comissao: tipoComissao,
      valor_comissao: valorComissao
    });
    this.invalidateCache();
    return result;
  }

  async removeServicoFromColaborador(colaboradorId: string, servicoId: string): Promise<void> {
    await apiService.delete(`/colaboradores/${colaboradorId}/servicos/${servicoId}`);
    this.invalidateCache();
  }

  async upsertComissaoPersonalizada(
    colaboradorId: string,
    servicoId: string,
    tipoComissao: string,
    valorComissao: number
  ): Promise<ColaboradorServico> {
    const result = await apiService.post<ColaboradorServico>(`/colaboradores/${colaboradorId}/comissoes-personalizadas`, {
      servicoId,
      tipo_comissao: tipoComissao,
      valor_comissao: valorComissao
    });
    this.invalidateCache();
    return result;
  }

  async upsertComissoesPersonalizadasBatch(
    colaboradorId: string,
    servicos: Array<{ servicoId: string; tipo_comissao?: string; valor_comissao: number }>
  ) {
    return await apiService.post<ColaboradorServico[]>(`/colaboradores/${colaboradorId}/comissoes-personalizadas/batch`, {
      servicos
    });
  }

  async removerComissaoPersonalizada(colaboradorId: string, servicoId: string): Promise<void> {
    await apiService.delete(`/colaboradores/${colaboradorId}/comissoes-personalizadas/${servicoId}`);
    this.invalidateCache();
  }

  async getCargos(colaboradorId: string): Promise<ColaboradorCargo[]> {
    return await apiService.get<ColaboradorCargo[]>(`/colaboradores/${colaboradorId}/cargos`);
  }

  async setCargos(colaboradorId: string, cargoIds: string[]): Promise<ColaboradorCargo[]> {
    const result = await apiService.post<ColaboradorCargo[]>(`/colaboradores/${colaboradorId}/cargos`, { cargoIds });
    this.invalidateCache();
    return result;
  }

  async removeCargo(colaboradorId: string, cargoId: string): Promise<void> {
    await apiService.delete(`/colaboradores/${colaboradorId}/cargos/${cargoId}`);
    this.invalidateCache();
  }

  async getColaboradoresByServico(servicoId: string): Promise<Colaborador[]> {
    return await apiService.get<Colaborador[]>(`/colaboradores/by-servico/${servicoId}`);
  }

  async uploadAvatar(id: string, file: File): Promise<{ url: string }> {
    return await apiService.uploadFile<{ url: string }>(`/colaboradores/${id}/upload-avatar`, file);
  }

  async uploadLote(colaboradores: any[]): Promise<any> {
    const result = await apiService.post<any>('/colaboradores/upload-lote', { colaboradores });
    this.invalidateCache();
    return result;
  }
}

export const colaboradorService = new ColaboradorService(); 