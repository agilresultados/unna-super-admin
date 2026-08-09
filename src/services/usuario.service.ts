import { apiService } from './api';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'FUNCIONARIO';
  is_limited?: boolean;
  empresa?: {
    id: string;
    nome_negocio: string;
    cnpj?: string;
    assinatura?: {
      status: string;
      plano?: {
        nome: string;
        preco_mensal: number;
        tipo: string;
      };
    };
    endereco?: {
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  telefone?: string;
  createdAt: string;
  lastLogin?: string;
  auth_provider?: string;
  fcm_token?: string;
  colaborador?: {
    id: string;
    nome: string;
    avatar_url?: string;
    bio?: string;
    horario_trabalho?: any;
    status: string;
    comissao?: number;
    especialidades?: string[];
    cargo?: {
      id: string;
      nome: string;
      servicos: Array<{
        servico: {
          id: string;
          nome: string;
          preco: number;
          duracao: number;
        }
      }>;
    };
  };
}

export interface CreateUsuarioData {
  nome: string;
  email: string;
  senha: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'FUNCIONARIO';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  empresaId?: string;
  is_limited?: boolean;
}

export interface UpdateUsuarioData {
  nome?: string;
  email?: string;
  senha?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'FUNCIONARIO';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  empresaId?: string;
  telefone?: string;
  is_limited?: boolean;
}

class UsuarioService {
  async getAllUsuarios(params?: { page?: number; limit?: number; search?: string; empresaId?: string }): Promise<{ data: Usuario[]; total: number; pages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.empresaId) queryParams.append('empresaId', params.empresaId);

    return apiService.get<{ data: Usuario[]; total: number; pages: number }>(`/usuarios?${queryParams.toString()}`);
  }

  async getUsuario(id: string): Promise<Usuario> {
    return apiService.get<Usuario>(`/usuarios/${id}`);
  }

  async createUsuario(data: CreateUsuarioData): Promise<Usuario> {
    return apiService.post<Usuario>('/usuarios', data);
  }

  async updateUsuario(id: string, data: UpdateUsuarioData): Promise<Usuario> {
    return apiService.put<Usuario>(`/usuarios/${id}`, data);
  }

  async deleteUsuario(id: string): Promise<void> {
    return apiService.delete(`/usuarios/${id}`);
  }

  async purgeUsuario(id: string): Promise<void> {
    return apiService.delete(`/super-admin/usuarios/${id}/purge`);
  }

  async purgeMe(password: string): Promise<void> {
    return apiService.delete('/usuarios/me/purge', { password });
  }

  async getUsuariosByEmpresa(empresaId: string, params?: { page?: number; limit?: number; search?: string }): Promise<{ data: Usuario[]; total: number; pages: number }> {
    const queryParams = new URLSearchParams();
    queryParams.append('empresaId', empresaId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiService.get<{ data: Usuario[]; total: number; pages: number }>(`/usuarios?${queryParams.toString()}`);
  }
}

export const usuarioService = new UsuarioService(); 