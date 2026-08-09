import { apiService } from './api';

// ============== TYPES ==============

export interface AfiliadoConfig {
    habilitado: boolean;
    tipo_recompensa: 'fixo' | 'porcentagem';
    valor_recompensa: number;
    saque_minimo: number;
    dias_inatividade: number;
    zerar_saldo_inatividade: boolean;
    indicacao_confirma_em: 'cadastro' | 'assinatura';
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
    status: 'SOLICITADO' | 'APROVADO' | 'REJEITADO' | 'PAGO';
    motivo_rejeicao?: string;
    observacao?: string;
    comprovante_url?: string;
    createdAt: string;
    updatedAt: string;
    processadoEm?: string;
    afiliado?: Afiliado;
}

export interface AfiliadoDashboard {
    ativo: boolean;
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
        dias_ate_inatividade: number | null;
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

    async solicitarSaque(valor: number): Promise<SaqueAfiliado> {
        return apiService.post<SaqueAfiliado>('/afiliados/saque', { valor });
    }

    // Public route
    async registrarIndicacao(codigo_referencia: string, empresaIndicadaId: string): Promise<Indicacao | null> {
        return apiService.post<Indicacao | null>('/afiliados/indicacao', {
            codigo_referencia,
            empresaIndicadaId,
        });
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

    async getMetricasGerais(): Promise<MetricasGerais> {
        return apiService.get<MetricasGerais>('/afiliados/admin/metricas');
    }
}

export const afiliadoService = new AfiliadoService();
