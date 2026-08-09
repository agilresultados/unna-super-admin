import { apiService } from './api';

export interface Assinatura {
  id: string;
  empresaId: string;
  planoId: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL' | 'PENDING';
  data_inicio: string;
  data_fim?: string;
  data_cancelamento?: string;
  valor_pago?: number;
  metodo_pagamento?: string;
  asaas_id?: string;
  asaas_customer_id?: string;
  /** Gateway que processa esta assinatura. Ausente = 'asaas' (base legada). */
  gateway?: 'asaas' | 'woovi';
  woovi_subscription_id?: string;
  billing_cycle?: string;
  createdAt: string;
  updatedAt: string;
  empresa?: {
    id: string;
    nome_negocio: string;

    email?: string;
  };
  plano?: {
    id: string;
    nome: string;
    tipo: string;
    preco_mensal: number;
    preco_anual: number;
    max_colaboradores: number;
    max_clientes: number;
  };
  pagamentos?: Pagamento[];
}

export interface Pagamento {
  id: string;
  assinaturaId: string;
  valor: number;
  status: string;
  metodo_pagamento: string;
  referencia_pagamento?: string;
  data_pagamento?: string;
  asaas_payment_id?: string;
  createdAt: string;
}

export interface CreateAssinaturaData {
  empresaId: string;
  planoId: string;
  status?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL' | 'PENDING';
  data_inicio?: string;
  data_fim?: string;
  valor_pago?: number;
  cycle?: 'MONTHLY' | 'YEARLY';
  metodo_pagamento?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode?: string;
    addressNumber?: string;
    addressComplement?: string;
    phone?: string;
    mobilePhone?: string;
  };
  cupomCodigo?: string;
}

export interface UpdateAssinaturaData {
  planoId?: string;
  status?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL' | 'PENDING';
  data_fim?: string;
  data_cancelamento?: string;
  valor_pago?: number;
  cycle?: 'MONTHLY' | 'YEARLY';
  metodo_pagamento?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode?: string;
    addressNumber?: string;
    addressComplement?: string;
    phone?: string;
    mobilePhone?: string;
  };
}

export interface LimitesEmpresa {
  totalColaboradores: number;
  totalClientes: number;
}

export interface CreateAssinaturaResponse extends Partial<Assinatura> {
  requiresAuthorization?: boolean;
  pix?: {
    qrCode: string;
    payload: string;
    expirationDate: string;
    paymentId?: string;
    /** Pix Automático (Woovi): o QR autoriza débito recorrente, não é pagamento avulso. */
    recorrente?: boolean;
    paymentLinkUrl?: string;
  };
  assinatura?: Assinatura;
}

export interface AsaasIntegrationData {
  local: Assinatura;
  asaas_id: string;
  asaas_customer_id: string;
}

export interface FaturaAsaas {
  id: string;
  status: string;
  value: number;
  billingType?: string;
  dueDate?: string;
  paymentDate?: string | null;
  description?: string;
  invoiceUrl?: string;
  dateCreated?: string;
}

export interface FaturasResponse {
  customerId: string | null;
  faturas: FaturaAsaas[];
  hasMore: boolean;
  totalCount: number;
  message?: string;
}

class AssinaturaService {
  async getAssinaturas(): Promise<Assinatura[]> {
    return await apiService.get<Assinatura[]>('/assinaturas');
  }

  async getAssinatura(id: string): Promise<Assinatura> {
    return await apiService.get<Assinatura>(`/assinaturas/${id}`);
  }

  async getAssinaturaByEmpresa(empresaId: string, signal?: AbortSignal): Promise<Assinatura> {
    return await apiService.get<Assinatura>(`/assinaturas/empresa/${empresaId}`, { signal });
  }

  async createAssinatura(data: CreateAssinaturaData): Promise<CreateAssinaturaResponse> {
    return await apiService.post<CreateAssinaturaResponse>('/assinaturas', data);
  }

  async updateAssinatura(id: string, data: UpdateAssinaturaData): Promise<CreateAssinaturaResponse> {
    return await apiService.put<CreateAssinaturaResponse>(`/assinaturas/${id}`, data);
  }

  async getPixData(assinaturaId: string): Promise<any> {
    return await apiService.get<any>(`/assinaturas/${assinaturaId}/pix-data`);
  }

  async cancelarAssinatura(id: string): Promise<Assinatura> {
    return await apiService.patch<Assinatura>(`/assinaturas/${id}/cancel`);
  }

  async deleteAssinatura(id: string): Promise<void> {
    return await apiService.delete(`/assinaturas/${id}`);
  }

  async reativarAssinatura(id: string): Promise<Assinatura> {
    return await apiService.patch<Assinatura>(`/assinaturas/${id}/reativar`);
  }

  async getPagamentos(assinaturaId: string): Promise<Pagamento[]> {
    return await apiService.get<Pagamento[]>(`/assinaturas/${assinaturaId}/pagamentos`);
  }

  /** Faturas (cobranças Asaas) da assinatura, sob demanda — máximo de 3. */
  async getFaturas(assinaturaId: string): Promise<FaturasResponse> {
    return await apiService.get<FaturasResponse>(`/assinaturas/${assinaturaId}/faturas`);
  }

  async registrarPagamento(assinaturaId: string, data: {
    valor: number;
    status: string;
    metodo_pagamento: string;
    referencia_pagamento?: string;
    data_pagamento?: string;
    asaas_payment_id?: string;
  }): Promise<Pagamento> {
    return await apiService.post<Pagamento>(`/assinaturas/${assinaturaId}/pagamentos`, data);
  }

  // Método para sincronizar assinatura com Asaas
  async sincronizarAssinatura(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<any>(`/assinaturas/${id}/sincronizar`, {});
      return response;
    } catch (error) {
      console.error('Erro ao sincronizar assinatura:', error);
      throw error;
    }
  }

  // Método para obter dados da assinatura no Asaas
  async getAssinaturaAsaas(id: string): Promise<AsaasIntegrationData> {
    try {
      const response = await apiService.get<AsaasIntegrationData>(`/assinaturas/${id}/asaas`);
      return response;
    } catch (error) {
      console.error('Erro ao obter dados da assinatura no Asaas:', error);
      throw error;
    }
  }

  // Método para verificar se pode fazer downgrade
  async verificarDowngrade(empresaId: string, novoPlanoId: string): Promise<{
    podeFazerDowngrade: boolean;
    motivo?: string;
    limitesAtuais?: LimitesEmpresa;
    limitesNovoPlano?: {
      max_colaboradores: number;
      max_clientes: number;
    };
  }> {
    try {
      const response = await apiService.get<any>(`/assinaturas/verificar-downgrade/${empresaId}/${novoPlanoId}`);
      return response;
    } catch (error) {
      console.error('Erro ao verificar downgrade:', error);
      throw error;
    }
  }

  // Método para obter limites da empresa
  async getLimitesEmpresa(empresaId: string): Promise<LimitesEmpresa> {
    try {
      const response = await apiService.get<LimitesEmpresa>(`/assinaturas/limites-empresa/${empresaId}`);
      return response;
    } catch (error) {
      console.error('Erro ao obter limites da empresa:', error);
      throw error;
    }
  }

  // Método para verificar se a assinatura está sincronizada com Asaas
  async verificarSincronizacao(id: string): Promise<boolean> {
    try {
      const assinatura = await this.getAssinatura(id);
      return !!(assinatura.asaas_id && assinatura.asaas_customer_id);
    } catch (error) {
      console.error('Erro ao verificar sincronização:', error);
      return false;
    }
  }

  // Método para obter status detalhado da assinatura
  async getStatusDetalhado(id: string): Promise<{
    assinatura: Assinatura;
    sincronizada: boolean;
    asaasData?: AsaasIntegrationData;
  }> {
    try {
      const assinatura = await this.getAssinatura(id);
      const sincronizada = await this.verificarSincronizacao(id);

      let asaasData: AsaasIntegrationData | undefined;
      if (sincronizada) {
        asaasData = await this.getAssinaturaAsaas(id);
      }

      return {
        assinatura,
        sincronizada,
        asaasData
      };
    } catch (error) {
      console.error('Erro ao obter status detalhado:', error);
      throw error;
    }
  }

  async checarStatusPagamento(paymentId: string): Promise<any> {
    return await apiService.get<any>(`/assinaturas/pagamentos/status/${paymentId}`);
  }

  async getUpgradeProrata(id: string, novoPlanoId: string): Promise<{ valor: number }> {
    return await apiService.get<{ valor: number }>(`/assinaturas/${id}/upgrade-prorata/${novoPlanoId}`);
  }
}

export const assinaturaService = new AssinaturaService();