import { apiService } from './api';

// ============== TYPES ==============

export interface AfiliadoConfig {
    habilitado: boolean;
    tipo_recompensa: 'fixo' | 'porcentagem';
    valor_recompensa: number;
    saque_minimo: number;
    /** Dias entre o crédito da comissão e a liberação para saque. */
    dias_carencia: number;
    /** Por quantos meses uma indicação confirmada continua rendendo. */
    meses_recompensa: number;
    restrito_beta?: boolean;
    emails_permitidos?: string[];
}

export interface Afiliado {
    id: string;
    empresaId: string;
    codigo_referencia: string;
    status: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
    total_indicacoes: number;
    desconto_acumulado: number;
    saldo_cashback: number;
    ultima_atividade?: string;
    data_inativacao?: string;
    createdAt: string;
    updatedAt: string;
    empresa?: {
        nome_negocio: string;
        slug?: string;
    };
    indicacoes?: IndicacaoComNome[];
    saques?: SaqueAfiliado[];
    _count?: {
        indicacoes: number;
        saques: number;
    };
}

export interface SolicitacaoAfiliacao {
    id: string;
    empresaId: string;
    status: 'PENDENTE' | 'APROVADA' | 'RECUSADA';
    createdAt: string;
    observacaoDecisao?: string | null;
    empresa: {
        nome_negocio: string;
        email: string | null;
        telefone: string | null;
        assinatura?: { status: string; data_inicio: string } | null;
    };
}

export interface Indicacao {
    id: string;
    afiliadoId: string;
    empresaIndicadaId: string;
    status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA' | 'EXPIRADA';
    valor_recompensa: number;
    tipo_recompensa: string;
    total_recompensas: number;
    createdAt: string;
    updatedAt: string;
    data_confirmacao?: string;
}

export interface IndicacaoComNome extends Indicacao {
    empresa_indicada_nome: string;
}

export interface SaqueAfiliado {
    id: string;
    afiliadoId: string;
    valor: number;
    /** ESTORNADO: repasse que voltou depois de pago; o valor retorna ao saldo. */
    status: 'SOLICITADO' | 'APROVADO' | 'REJEITADO' | 'PAGO' | 'ESTORNADO';
    motivo_rejeicao?: string;
    observacao?: string;
    comprovante_url?: string;
    createdAt: string;
    updatedAt: string;
    processadoEm?: string;
    estornadoEm?: string;
    motivo_estorno?: string;
    /** Destino do repasse no momento do pedido — nunca a chave inteira. */
    pix_tipo?: string | null;
    pix_chave_mascarada?: string | null;
    afiliado?: Afiliado;
}

export interface AfiliadoDashboard {
    ativo: boolean;
    /** Destino do repasse. A chave nunca volta inteira — só mascarada. */
    recebimento?: {
        configurado: boolean;
        pix_tipo: string | null;
        pix_chave_mascarada: string | null;
        titular_nome: string | null;
    };
    /**
     * A empresa pode participar do programa AGORA (assinatura ACTIVE ou TRIAL).
     *
     * Independente de `ativo`: quem ativou a afiliação e depois deixou a
     * assinatura vencer continua `ativo: true` com `elegivel: false` — para na
     * hora de ganhar e de ter o código validado, mas o saldo já ganho continua
     * sacável.
     */
    elegivel?: boolean;
    afiliado: {
        id: string;
        codigo_referencia: string;
        status: string;
        desconto_acumulado: number;
        saldo_cashback: number;
        total_indicacoes: number;
        ultima_atividade?: string;
        createdAt: string;
    } | null;
    metricas?: {
        indicacoes_confirmadas: number;
        indicacoes_pendentes: number;
        /** Sacável agora — comissão em carência não entra. */
        saldo_disponivel: number;
        saldo_em_carencia: number;
        proxima_liberacao: { em: string; valor: number } | null;
        preco_plano: number;
        pode_sacar: boolean;
        saque_minimo: number;
    };
    config?: {
        habilitado: boolean;
        tipo_recompensa: string;
        valor_recompensa: number;
    };
}

export interface MetricasGerais {
    totalAfiliados: number;
    afiliadosAtivos: number;
    totalIndicacoes: number;
    indicacoesConfirmadas: number;
    totalSaques: number;
    saquesPendentes: number;
    totalDescontoDistribuido: number;
    totalCashbackDistribuido: number;
}

export type TipoLancamentoAfiliado =
    | 'SALDO_INICIAL'
    | 'RECOMPENSA'
    | 'SAQUE'
    | 'ESTORNO_SAQUE'
    | 'AJUSTE';

/** Linha do livro-caixa. Imutável no backend: correção vem como novo lançamento. */
export interface LancamentoAfiliado {
    id: string;
    afiliadoId: string;
    tipo: TipoLancamentoAfiliado;
    direcao: 'CREDITO' | 'DEBITO';
    valor: number;
    descricao: string;
    indicacaoId: string | null;
    pagamentoId: string | null;
    saqueId: string | null;
    chave_idempotencia: string;
    criadoPorUsuarioId: string | null;
    createdAt: string;
}

export interface ExtratoAfiliado {
    lancamentos: LancamentoAfiliado[];
    proximo_cursor: string | null;
}

/** Resposta da consulta pública de código no cadastro. */
export interface ValidacaoCodigo {
    valido: boolean;
    nome_negocio: string | null;
}

export interface ReconciliacaoAfiliado {
    afiliadoId: string;
    nome_negocio: string | null;
    saldo_cache: number;
    saldo_ledger: number;
    total_creditos: number;
    total_debitos: number;
    divergencia: number;
    confere: boolean;
}

export interface ReconciliacaoGeral {
    total_afiliados: number;
    total_divergentes: number;
    divergentes: ReconciliacaoAfiliado[];
}

export type TipoChavePix = 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';

export interface DadosRecebimento {
    pix_tipo: TipoChavePix;
    pix_chave: string;
    titular_nome: string;
    titular_documento: string;
}

export interface SaldoDetalhado {
    saldo_total: number;
    /** O que dá para sacar agora. Comissão em carência não entra. */
    saldo_disponivel: number;
    saldo_em_carencia: number;
    proxima_liberacao: { em: string; valor: number } | null;
}

export interface IndicacaoEmAnalise {
    id: string;
    afiliadoId: string;
    empresaIndicadaId: string;
    status: string;
    motivo_analise: string | null;
    createdAt: string;
    empresa_indicada_nome: string;
    empresa_indicada_criada_em: string | null;
    afiliado: {
        id: string;
        codigo_referencia: string;
        empresa?: { nome_negocio: string };
    };
}

// ============== SERVICE ==============

class AfiliadoService {
    // Admin routes
    async ativarAfiliacao(): Promise<Afiliado> {
        return apiService.post<Afiliado>('/afiliados/ativar', {});
    }

    async getDashboard(signal?: AbortSignal): Promise<AfiliadoDashboard> {
        return apiService.get<AfiliadoDashboard>('/afiliados/dashboard', { signal });
    }

    async getAfiliado(): Promise<Afiliado | null> {
        return apiService.get<Afiliado | null>('/afiliados/meu');
    }

    /** Saldo separado entre disponível e em carência. */
    async getSaldoDetalhado(): Promise<SaldoDetalhado> {
        return apiService.get<SaldoDetalhado>('/afiliados/recebimento');
    }

    /**
     * Define para onde o repasse vai. Obrigatório antes do primeiro saque.
     *
     * O backend valida a chave contra o TIPO declarado e confere o dígito
     * verificador do CPF/CNPJ — não confie só na validação da tela.
     */
    async definirDadosRecebimento(dados: DadosRecebimento): Promise<Afiliado> {
        return apiService.put<Afiliado>('/afiliados/recebimento', dados);
    }

    /** Código aleatório livre, para o botão "gerar outro". */
    async sugerirCodigo(): Promise<{ codigo: string }> {
        return apiService.get<{ codigo: string }>('/afiliados/codigo/sugestao');
    }

    /**
     * Troca o código de indicação pelo escolhido pela cliente.
     *
     * O backend normaliza para maiúsculo e valida o formato — não confie na
     * validação da tela, ela existe só para dar retorno antes do envio.
     *
     * Links já compartilhados com o código anterior param de funcionar. As
     * indicações já atribuídas continuam valendo (apontam para o afiliado, não
     * para o texto do código).
     */
    async definirCodigo(codigo: string): Promise<Afiliado> {
        return apiService.patch<Afiliado>('/afiliados/codigo', { codigo });
    }

    async solicitarSaque(valor: number): Promise<SaqueAfiliado> {
        return apiService.post<SaqueAfiliado>('/afiliados/saque', { valor });
    }

    /** Extrato da própria conta: de onde veio cada centavo do saldo. */
    async getExtrato(limite?: number, cursor?: string): Promise<ExtratoAfiliado> {
        const params = new URLSearchParams();
        if (limite) params.set('limite', String(limite));
        if (cursor) params.set('cursor', cursor);
        const query = params.toString();
        return apiService.get<ExtratoAfiliado>(`/afiliados/extrato${query ? `?${query}` : ''}`);
    }

    // Public route
    /**
     * Confere um código de indicação no cadastro.
     *
     * Substituiu `registrarIndicacao`: a atribuição agora acontece dentro da
     * transação de `POST /empresas/register` (campo `codigo_indicacao`), e não
     * mais numa segunda chamada que se perdia quando a rede falhava.
     */
    async validarCodigo(codigo: string): Promise<ValidacaoCodigo> {
        return apiService.get<ValidacaoCodigo>(`/afiliados/validar/${encodeURIComponent(codigo)}`);
    }

    // SuperAdmin routes
    async getConfig(): Promise<AfiliadoConfig> {
        return apiService.get<AfiliadoConfig>('/afiliados/config');
    }

    async updateConfig(data: Partial<AfiliadoConfig>): Promise<AfiliadoConfig> {
        return apiService.put<AfiliadoConfig>('/afiliados/config', data);
    }

    async listarAfiliados(status?: string): Promise<Afiliado[]> {
        const params = status ? `?status=${status}` : '';
        return apiService.get<Afiliado[]>(`/afiliados/admin/todos${params}`);
    }

    async listarSolicitacoesAfiliacao(status = 'PENDENTE'): Promise<SolicitacaoAfiliacao[]> {
        return apiService.get<SolicitacaoAfiliacao[]>(`/afiliados/admin/solicitacoes?status=${status}`);
    }

    async decidirSolicitacaoAfiliacao(id: string, aprovada: boolean): Promise<SolicitacaoAfiliacao> {
        return apiService.patch<SolicitacaoAfiliacao>(`/afiliados/admin/solicitacoes/${id}`, { aprovada });
    }

    async getIndicacoesAfiliadoAdmin(afiliadoId: string): Promise<IndicacaoComNome[]> {
        return apiService.get<IndicacaoComNome[]>(`/afiliados/admin/afiliados/${afiliadoId}/indicacoes`);
    }

    async listarSaques(status?: string): Promise<SaqueAfiliado[]> {
        const params = status ? `?status=${status}` : '';
        return apiService.get<SaqueAfiliado[]>(`/afiliados/admin/saques${params}`);
    }

    async processarSaque(saqueId: string, aprovado: boolean, file?: File, observacao?: string): Promise<SaqueAfiliado> {
        const formData = new FormData();
        formData.append('aprovado', aprovado ? 'true' : 'false');
        if (file) {
            formData.append('comprovante', file);
        }
        if (observacao) {
            formData.append('observacao', observacao);
        }
        return apiService.patch<SaqueAfiliado>(`/afiliados/admin/saques/${saqueId}`, formData);
    }

    async getExtratoAfiliadoAdmin(afiliadoId: string, limite?: number, cursor?: string): Promise<ExtratoAfiliado> {
        const params = new URLSearchParams();
        if (limite) params.set('limite', String(limite));
        if (cursor) params.set('cursor', cursor);
        const query = params.toString();
        return apiService.get<ExtratoAfiliado>(
            `/afiliados/admin/afiliados/${afiliadoId}/extrato${query ? `?${query}` : ''}`,
        );
    }

    /** Confere os saldos contra o livro-caixa. Divergência = saldo mexido por fora. */
    async reconciliar(): Promise<ReconciliacaoGeral> {
        return apiService.get<ReconciliacaoGeral>('/afiliados/admin/reconciliacao');
    }

    /** Fila do antifraude: indicações retidas esperando decisão humana. */
    async listarIndicacoesEmAnalise(): Promise<IndicacaoEmAnalise[]> {
        return apiService.get<IndicacaoEmAnalise[]>('/afiliados/admin/indicacoes/em-analise');
    }

    /** Liberar devolve para PENDENTE; recusar encerra em CANCELADA. */
    async resolverIndicacaoEmAnalise(id: string, liberar: boolean, observacao?: string): Promise<Indicacao> {
        return apiService.patch<Indicacao>(`/afiliados/admin/indicacoes/${id}/analise`, { liberar, observacao });
    }

    /** Repasse que voltou depois de pago. O valor retorna ao saldo por lançamento. */
    async estornarSaquePago(saqueId: string, motivo: string): Promise<SaqueAfiliado> {
        return apiService.patch<SaqueAfiliado>(`/afiliados/admin/saques/${saqueId}/estorno`, { motivo });
    }

    async getMetricasGerais(): Promise<MetricasGerais> {
        return apiService.get<MetricasGerais>('/afiliados/admin/metricas');
    }
}

export const afiliadoService = new AfiliadoService();
