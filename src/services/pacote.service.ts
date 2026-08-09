import { apiService } from './api';
import type { Servico } from './servico.service';
import type { Produto } from './produto.service';
import type { Cliente } from './cliente.service';

export interface PacoteServico {
    servicoId: string;
    quantidade: number;
    servico?: Servico;
}

export interface PacoteProduto {
    produtoId: string;
    quantidade: number;
    produto?: Produto;
}

export interface Pacote {
    id: string;
    nome: string;
    descricao?: string;
    preco: number;
    ativo: boolean;
    empresaId: string;
    createdAt: string;
    updatedAt: string;
    servicos: PacoteServico[];
    produtos: PacoteProduto[];
    _count?: {
        cliente_pacotes: number;
        cliente_pacotes_total?: number;
    };
}

export interface ClientePacoteSessao {
    id: string;
    clientePacoteId: string;
    servicoId: string;
    servico?: Servico;
    quantidade_total: number;
    quantidade_restante: number;
}

export interface ClientePacoteHistoricoUso {
    id: string;
    clientePacoteId: string;
    servicoId: string;
    servico?: Servico;
    agendamentoId: string;
    agendamento?: {
        id: string;
        data_hora_inicio: string;
    };
    colaboradorId: string;
    colaborador?: {
        id: string;
        nome: string;
    };
    quantidade_usada: number;
    valor_alocado: number;
    data_uso: string;
}

export interface ClientePacote {
    id: string;
    clienteId: string;
    cliente?: Cliente;
    pacoteId: string;
    pacote?: Pacote;
    empresaId: string;
    comandaId?: string;
    status: string;
    valor_pago: number;
    validade?: string;
    data_compra?: string;
    createdAt: string;
    sessoes: ClientePacoteSessao[];
    historicoUso?: ClientePacoteHistoricoUso[];
    /** Agendamentos não finalizados (pendentes/confirmados) vinculados ao pacote */
    agendamentos?: { id: string; data_hora_inicio: string; status: string }[];
    /** Comanda de cobrança vinculada (quando há). status 'fechada' = pago */
    comanda?: { id: string; status: string; metodo_pagamento?: string | null } | null;
    /** true quando a venda já foi efetivamente paga (comanda fechada) */
    pago?: boolean;
}

export interface CreatePacoteData {
    nome: string;
    descricao?: string;
    preco: number;
    ativo?: boolean;
    servicos: { servicoId: string; quantidade?: number }[];
    produtos?: { produtoId: string; quantidade: number }[];
}

export interface UpdatePacoteData {
    nome?: string;
    descricao?: string;
    preco?: number;
    ativo?: boolean;
    servicos?: { servicoId: string; quantidade?: number }[];
    produtos?: { produtoId: string; quantidade: number }[];
}

interface CacheData<T> {
    data: T;
    timestamp: number;
}

export interface VenderPacoteData {
    clienteId: string;
    pacoteId: string;
    preco_pago: number;
    metodo_pagamento?: string;
    agendamentoId?: string;
    abrirComanda?: boolean;
}

class PacoteService {
    private cachePacotes: CacheData<Pacote[]> | null = null;
    private readonly CACHE_TTL = 1000 * 60 * 15; // 15 minutos

    private invalidateCache() {
        this.cachePacotes = null;
    }

    async getPacotes(filters?: { search?: string; ativo?: boolean; sortKey?: string; sortOrder?: string }, signal?: AbortSignal): Promise<Pacote[]> {
        const agora = Date.now();
        // Se houver filtros, evitamos o cache simples por enquanto para garantir que a busca funcione
        if (!filters && this.cachePacotes && (agora - this.cachePacotes.timestamp < this.CACHE_TTL) && this.cachePacotes.data.length > 0) {
            return this.cachePacotes.data;
        }

        const data = await apiService.get<Pacote[]>('/pacotes', { params: filters, signal });
        
        if (!filters) {
            this.cachePacotes = { data, timestamp: agora };
        }
        
        return data;
    }

    async getPacote(id: string): Promise<Pacote> {
        return await apiService.get<Pacote>(`/pacotes/${id}`);
    }

    async createPacote(data: CreatePacoteData): Promise<Pacote> {
        const result = await apiService.post<Pacote>('/pacotes', data);
        this.invalidateCache();
        return result;
    }

    async updatePacote(id: string, data: UpdatePacoteData): Promise<Pacote> {
        const result = await apiService.put<Pacote>(`/pacotes/${id}`, data);
        this.invalidateCache();
        return result;
    }

    async deletePacote(id: string): Promise<void> {
        await apiService.delete(`/pacotes/${id}`);
        this.invalidateCache();
    }

    async getPacotesCliente(clienteId: string): Promise<ClientePacote[]> {
        return await apiService.get<ClientePacote[]>(`/pacotes/cliente/${clienteId}`);
    }

    async getPacotesVendidos(filters?: { search?: string; startDate?: string; endDate?: string; sortBy?: string }): Promise<ClientePacote[]> {
        return await apiService.get<ClientePacote[]>('/pacotes/vendidos', { params: filters });
    }

    async venderPacote(data: VenderPacoteData): Promise<ClientePacote> {
        return await apiService.post<ClientePacote>('/pacotes/vender', data);
    }

    async cancelarVendaPacote(id: string, data: { estorno: boolean; valor_estorno?: number; motivo_estorno?: string; metodo_pagamento?: string }): Promise<void> {
        await apiService.post(`/pacotes/venda/${id}/cancelar`, data);
    }
}

export const pacoteService = new PacoteService();
