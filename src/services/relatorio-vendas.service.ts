import { apiService } from './api';

export interface RelatorioVendas {
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: {
    receita_total: number;
    total_assinaturas: number;
    assinaturas_ativas: number;
    assinaturas_trial: number;
    assinaturas_canceladas: number;
    crescimento_receita: number;
    taxa_retencao: number;
  };
  vendas_por_plano: {
    plano: string;
    quantidade: number;
    receita: number;
    percentual: number;
  }[];
  vendas_por_periodo: {
    data: string;
    receita: number;
    assinaturas: number;
  }[];
  top_empresas: {
    empresa: string;
    plano: string;
    valor: number;
    data_inicio: string;
  }[];
}

export interface FiltrosRelatorio {
  data_inicio?: string;
  data_fim?: string;
  plano_id?: string;
  status?: string;
  empresa_id?: string;
}

class RelatorioVendasService {
  async getRelatorioVendas(filtros?: FiltrosRelatorio): Promise<RelatorioVendas> {
    const params = new URLSearchParams();
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/relatorios/vendas?${queryString}` : '/relatorios/vendas';
    
    return await apiService.get<RelatorioVendas>(endpoint);
  }

  async getRelatorioMensal(mes: number, ano: number): Promise<RelatorioVendas> {
    return await apiService.get<RelatorioVendas>(`/relatorios/vendas/mensal/${ano}/${mes}`);
  }

  async getRelatorioAnual(ano: number): Promise<RelatorioVendas> {
    return await apiService.get<RelatorioVendas>(`/relatorios/vendas/anual/${ano}`);
  }

  async exportarRelatorio(filtros?: FiltrosRelatorio, formato: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const params = new URLSearchParams();
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    params.append('formato', formato);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/relatorios/vendas/exportar?${queryString}` : '/relatorios/vendas/exportar';
    
    const { getAccessToken } = await import('@/api/tokenStorage');
    const token = getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3090').replace(/\/api\/?$/, '');
    const response = await fetch(`${base}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Erro ao exportar relatório');
    }

    return response.blob();
  }

  async getMetricasRapidas(): Promise<{
    receita_mes_atual: number;
    receita_mes_anterior: number;
    crescimento_mensal: number;
    assinaturas_ativas: number;
    assinaturas_trial: number;
    assinaturas_canceladas_mes: number;
  }> {
    return await apiService.get('/relatorios/vendas/metricas-rapidas');
  }
}

export const relatorioVendasService = new RelatorioVendasService(); 