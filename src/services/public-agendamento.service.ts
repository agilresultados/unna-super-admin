import { apiService } from './api';

export interface EnderecoPublico {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
}

export interface SitePublicoConfig {
  fotos_estabelecimento?: string[];
  descricao?: string;
  instagram?: string;
  whatsapp_contato?: string;
  formas_pagamento?: string[];
  amenidades?: string[];
  tema?: 'light' | 'dark';
}

export interface EmpresaPublica {
  id: string;
  nome_negocio: string;
  telefone?: string;
  email?: string;
  avatar_url?: string;
  endereco?: EnderecoPublico;
  whatsapp_suporte?: string;
  timezone?: string;
  horario_funcionamento?: {
    [key: string]: { inicio: string | null; fim: string | null };
  };
  site_publico?: SitePublicoConfig;
  aceitar_lista_espera?: boolean;
}

export interface ServicoPublico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracao_minutos: number;
  imagem_url?: string;
}

export interface ColaboradorPublico {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  avatar_url?: string;
  servicos: string[]; // IDs de serviços que o colaborador executa
}

export interface ProdutoPublico {
  id: string;
  nome: string;
  descricao?: string;
  preco_venda: number;
  categoria?: { id: string; nome: string };
}

export interface PacotePublico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  servicos: Array<{ servico: { id: string; nome: string; duracao_minutos: number } }>;
}

export interface PlanoPublico {
  id: string;
  nome: string;
  descricao?: string;
  preco_mensal: number;
  preco_anual?: number;
  beneficios?: string[];
}

export interface AvaliacaoPublica {
  id: string;
  nota_atendimento: number;
  nota_servico: number;
  comentario?: string;
  createdAt: string;
  cliente_nome: string;
  servicos: string;
}

export interface DisponibilidadeResponse {
  data: string;
  duracao_minutos: number;
  slots_disponiveis: Array<{
    horario: string;
    data_hora: string;
    status: 'available' | 'busy' | 'unavailable';
  }>;
  total_slots: number;
}

export interface CriarAgendamentoData {
  cliente: { 
    nome: string; 
    email?: string; 
    telefone: string;
    senha?: string;
    data_nascimento?: string;
    genero?: string;
  };
  colaboradorId: string;
  servicos: Array<{ servicoId: string; preco: number }>;
  pacoteId?: string;
  data: string;
  hora: string;
  observacoes?: string;
  comentario?: string;
  forceListaEspera?: boolean;
}

export interface AgendamentoCriado {
  success: boolean;
  tipo?: 'agendamento' | 'lista_espera';
  message: string;
  agendamento: { id: string; data: string; cliente: any; colaborador: any; servicos: any[] };
}

export interface AgendamentoPageResponse {
  agendamento_ativo: boolean;
  link_publico_ativo: boolean;
  aceitar_lista_espera: boolean;
  antecedencia_minima_horas: number;
  site_ativo: boolean;
  empresa: EmpresaPublica;
  servicos: ServicoPublico[];
  colaboradores: ColaboradorPublico[];
}

class PublicAgendamentoService {
  async buscarEmpresaPorSlug(slug: string): Promise<EmpresaPublica> {
    return await apiService.get<EmpresaPublica>(`/public/agendamento/${slug}`);
  }

  async getAgendamentoPage(slug: string): Promise<AgendamentoPageResponse> {
    return await apiService.get<AgendamentoPageResponse>(`/public/agendamento/${slug}`);
  }

  async getServicos(slug: string): Promise<ServicoPublico[]> {
    return await apiService.get<ServicoPublico[]>(`/public/agendamento/${slug}/servicos`);
  }

  async getColaboradores(slug: string): Promise<ColaboradorPublico[]> {
    return await apiService.get<ColaboradorPublico[]>(`/public/agendamento/${slug}/colaboradores`);
  }

  async getProdutosPublicos(slug: string): Promise<ProdutoPublico[]> {
    return await apiService.get<ProdutoPublico[]>(`/public/agendamento/${slug}/produtos`);
  }

  async getPacotesPublicos(slug: string): Promise<PacotePublico[]> {
    return await apiService.get<PacotePublico[]>(`/public/agendamento/${slug}/pacotes`);
  }

  async getPlanosPublicos(slug: string): Promise<PlanoPublico[]> {
    return await apiService.get<PlanoPublico[]>(`/public/agendamento/${slug}/planos`);
  }

  async getAvaliacoesPublicas(slug: string): Promise<AvaliacaoPublica[]> {
    return await apiService.get<AvaliacaoPublica[]>(`/public/agendamento/${slug}/avaliacoes`);
  }

  async verificarDisponibilidade(
    slug: string,
    colaboradorId: string | null,
    data: string,
    duracao: number
  ): Promise<DisponibilidadeResponse> {
    const params = new URLSearchParams({ data, duracao: duracao.toString() });
    if (colaboradorId) params.append('colaboradorId', colaboradorId);
    return await apiService.get<DisponibilidadeResponse>(
      `/public/agendamento/${slug}/disponibilidade?${params.toString()}`
    );
  }

  async criarAgendamento(slug: string, data: CriarAgendamentoData): Promise<AgendamentoCriado> {
    return await apiService.post<AgendamentoCriado>(`/public/agendamento/${slug}/agendar`, data);
  }

  async getAgendamentoDetail(slug: string, agendamentoId: string): Promise<any> {
    return await apiService.get(`/public/agendamento/${slug}/detalhes/${agendamentoId}`);
  }

  async pesquisarEstabelecimentos(query?: string, city?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (city) params.append('city', city);
    return await apiService.get<any[]>(`/public/agendamento/search/estabelecimentos?${params.toString()}`);
  }
}

export const publicAgendamentoService = new PublicAgendamentoService();
