import { apiService as api } from './api';

export type PaymentGatewayName = 'asaas' | 'woovi';

export interface PaymentGatewayConfig {
  /** Gateway de todo checkout novo que não estiver no piloto. */
  gateway_padrao: PaymentGatewayName;
  /** Liga a allowlist. Desligado, a lista é preservada mas ignorada. */
  piloto_habilitado: boolean;
  /** E-mails das empresas no piloto da Woovi. */
  emails_piloto: string[];
}

/**
 * Roteamento de gateway dos novos checkouts (piloto do Pix Automático da Woovi).
 * Rotas restritas ao super admin — decidem para onde vai o dinheiro.
 */
export const paymentGatewayService = {
  getConfig: async (): Promise<PaymentGatewayConfig> => {
    return await api.get<PaymentGatewayConfig>('/payment-gateway/config');
  },

  updateConfig: async (data: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> => {
    return await api.put<PaymentGatewayConfig>('/payment-gateway/config', data);
  },
};
