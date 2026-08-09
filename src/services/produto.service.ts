import { apiService } from './api';

export interface Produto {
  id: string;
  nome: string;
  custo: number;
  preco_venda: number;
  quantidade: number;
  quantidade_minima: number;
  data_validade?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  categoriaId: string;
  descricao?: string;
  categoria?: {
    nome: string;
  };
}

export interface ItemVendaData {
  produtoId: string;
  quantidade: number;
  preco_unitario: number;
}

export interface VenderProdutoData {
  clienteId?: string;
  metodo_pagamento: string;
  itens: ItemVendaData[];
  preco_venda: number;
  desconto?: number;
}

export interface CreateProdutoData {
  nome: string;
  custo: number;
  preco_venda: number;
  quantidade: number;
  quantidade_minima: number;
  data_validade?: string;
  categoriaId: string;
  descricao?: string;
  empresaId: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  stats?: {
    totalProdutos: number;
    estoqueTotal: number;
    baixoEstoque: number;
    semEstoque: number;
  };
}

export interface UpdateProdutoData {
  nome?: string;
  custo?: number;
  preco_venda?: number;
  quantidade?: number;
  quantidade_minima?: number;
  data_validade?: string;
  categoriaId?: string;
  descricao?: string;
  ativo?: boolean;
}

class ProdutoService {
  async getProdutos(filters?: { search?: string; categoriaId?: string; ativo?: boolean; page?: number; limit?: number; sortKey?: string; sortOrder?: string }, signal?: AbortSignal): Promise<PaginatedResult<Produto>> {
    const response = await apiService.get<PaginatedResult<Produto>>('/produtos', { params: filters, signal });
    return response as any;
  }

  async getProdutosAtivos(empresaId?: string, signal?: AbortSignal): Promise<PaginatedResult<Produto>> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await apiService.get<PaginatedResult<Produto>>(`/produtos/ativos${params}`, { signal });
    return response as any;
  }

  async getProduto(id: string): Promise<Produto> {
    return await apiService.get<Produto>(`/produtos/${id}`);
  }

  async createProduto(data: Omit<CreateProdutoData, 'empresaId'>): Promise<Produto> {
    // Get empresaId from user context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const empresaId = user.empresaId;

    if (!empresaId) {
      throw new Error('EmpresaId não encontrado. Usuário não está associado a uma empresa.');
    }

    return await apiService.post<Produto>('/produtos', {
      ...data,
      empresaId
    });
  }

  async updateProduto(id: string, data: UpdateProdutoData): Promise<Produto> {
    return await apiService.put<Produto>(`/produtos/${id}`, data);
  }

  async deleteProduto(id: string): Promise<void> {
    await apiService.delete(`/produtos/${id}`);
  }

  async getProdutosEstoqueBaixo(): Promise<Produto[]> {
    const response = await apiService.get<PaginatedResult<Produto>>('/produtos/estoque-baixo');
    return response?.data || [];
  }

  async getProdutosVencimentoProximo(): Promise<Produto[]> {
    const response = await apiService.get<PaginatedResult<Produto>>('/produtos/vencimento-proximo');
    return response?.data || [];
  }

  async venderProduto(data: VenderProdutoData): Promise<any> {
    return await apiService.post('/produtos/vender', data);
  }

  async getVendasRecentes(filters?: { search?: string; startDate?: string; endDate?: string; sortKey?: string; sortOrder?: string }): Promise<any[]> {
    return await apiService.get('/produtos/vendas-recentes', { params: filters });
  }

  async cancelarVenda(id: string): Promise<any> {
    return await apiService.post(`/produtos/venda/${id}/cancelar`, {});
  }

}

export const produtoService = new ProdutoService(); 