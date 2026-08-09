// Serviço WhatsApp usando UUID diretamente (nova implementação)
// O empresaId é usado como UUID para identificar a sessão WhatsApp

// URL base do serviço WhatsApp (same backend as the main API, without /api prefix)
const WHATSAPP_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3090').replace(/\/api\/?$/, '');

// Provedor da sessão WhatsApp não-oficial (UnnaZap)
export type WhatsAppProvider = 'waha' | 'evolution' | 'oficial';

// Interface para status de conexão
export interface WhatsAppConnectionStatus {
  success: boolean;
  uuid?: string;
  sessionExists?: boolean;
  status?: {
    status: 'not_found' | 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
    qr?: string;
    user?: {
      id: string;
      name?: string;
    } | null;
    error?: string;
    message?: string;
  };
}

// Interface para QR Code
export interface WhatsAppQRCode {
  success: boolean;
  qr?: string;
  timestamp?: number;
  error?: string;
}

// Interface para Health do WAHA (SuperAdmin)
export interface WahaHealthResponse {
  success: boolean;
  wahaUrl: string;
  wahaReachable: boolean;
  singleSessionEnabled?: boolean;
  singleSessionUuid?: string;
  sessionsCount: number;
  sessions: Array<{
    name: string; // Este é o UUID da empresa
    status: string;
    me?: {
      id: string;
      pushName?: string;
    };
  }>;
  error?: string;
}

class WhatsAppService {
  // Obter UUID da empresa (empresaId)
  private getUUID(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.empresaId || null;
    } catch (error) {
      console.error('Erro ao obter UUID:', error);
      return null;
    }
  }

  // Obter token JWT do localStorage
  private getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  // Helper para headers com autenticação
  private getHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Ativar sessão WhatsApp (cria ou restaura sessão)
  async activateSession(prefix: string = '/'): Promise<WhatsAppConnectionStatus> {
    try {
      const uuid = this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/activate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ uuid, prefix }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao ativar sessão WhatsApp');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao ativar sessão WhatsApp:', error);
      throw error;
    }
  }

  // Solicitar código de pareamento por número de telefone (alternativa ao QR)
  // phoneNumber: número completo com DDI, ex.: "5511999998888" (só dígitos)
  async requestPairingCode(phoneNumber: string): Promise<{ success: boolean; code?: string; error?: string; alreadyConnected?: boolean }> {
    try {
      const uuid = this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/request-code`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ uuid, phoneNumber: phoneNumber.replace(/\D/g, '') }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || data.error || 'Erro ao gerar código de pareamento' };
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao solicitar código de pareamento:', error);
      return { success: false, error: error.message };
    }
  }

  // Desativar sessão WhatsApp (mantém credenciais)
  async deactivateSession(targetUuid?: string): Promise<{ success: boolean; message: string }> {
    try {
      const uuid = targetUuid || this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado.');
      }

      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/deactivate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ uuid }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao desativar sessão WhatsApp');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao desativar sessão WhatsApp:', error);
      throw error;
    }
  }

  // Remover dispositivo completamente (deleta pasta auth)
  async removeSessionCompletely(targetUuid?: string): Promise<{ success: boolean; message: string }> {
    try {
      const uuid = targetUuid || this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado.');
      }

      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/remove`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ uuid }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover dispositivo WhatsApp');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao remover dispositivo WhatsApp:', error);
      throw error;
    }
  }

  // Obter status da sessão (ativa automaticamente se não existir)
  async getSessionStatus(autoActivate: boolean = false): Promise<WhatsAppConnectionStatus> {
    try {
      const uuid = this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/status/${uuid}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se sessão não existe e autoActivate está habilitado, criar automaticamente
        if (response.status === 404 && autoActivate) {
          return await this.activateSession();
        }

        // Se sessão não existe, retornar status desconectado
        if (response.status === 404) {
          return {
            success: true,
            uuid,
            status: {
              status: 'disconnected',
              message: 'Sessão não encontrada ou não ativa',
            },
          };
        }
        throw new Error(data.error || 'Erro ao obter status da sessão');
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        uuid: '',
        status: {
          status: 'disconnected',
          message: error.message,
        },
      };
    }
  }

  // Verificar se sessão existe (sem ativar automaticamente)
  async checkSessionExists(): Promise<boolean> {
    try {
      const uuid = this.getUUID();
      if (!uuid) {
        return false;
      }

      const result = await this.getSessionStatus(false);
      return result.sessionExists === true;
    } catch (error) {
      console.error('Erro ao verificar se sessão existe:', error);
      return false;
    }
  }

  // Obter QR Code como imagem (data URL)
  async getQRCodeImage(): Promise<string | null> {
    try {
      const uuid = this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/qr/${uuid}/json`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      // Fallback for image endpoint if needed, but we use the JSON endpoint mainly now.
      // If we use the raw image endpoint:
      // const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/qr/${uuid}`, { headers: this.getHeaders() });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // QR Code não disponível
        }
        throw new Error('Erro ao obter QR Code');
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error('Erro ao obter QR Code (imagem):', error);
      return null;
    }
  }

  // Obter QR Code como JSON (string do QR)
  async getQRCodeJSON(): Promise<WhatsAppQRCode> {
    try {
      const uuid = this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/qr/${uuid}/json`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'QR Code não disponível',
          };
        }
        throw new Error(data.error || 'Erro ao obter QR Code');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao obter QR Code (JSON):', error);
      return {
        success: false,
        error: error.message || 'Erro ao obter QR Code',
      };
    }
  }

  // Conectar WhatsApp (ativa sessão se necessário)
  async connectWhatsApp(): Promise<{ success: boolean; message: string; isConnected: boolean }> {
    try {
      // Primeiro verifica se já existe sessão ativa (sem ativar automaticamente)
      let status = await this.getSessionStatus(false);

      // Se não existe sessão ou está desconectada, ativa
      if (!status.status || status.status.status === 'disconnected') {
        status = await this.activateSession();
      }

      const isConnected = status.status?.status === 'connected';
      const hasQRCode = status.status?.status === 'qr_ready';

      return {
        success: true,
        message: isConnected
          ? 'WhatsApp já está conectado'
          : hasQRCode
            ? 'QR Code disponível. Escaneie para conectar.'
            : 'Conectando ao WhatsApp...',
        isConnected,
      };
    } catch (error: any) {
      console.error('Erro ao conectar WhatsApp:', error);
      throw error;
    }
  }

  // Desconectar WhatsApp (mantém sessão salva)
  async disconnectWhatsAppSimple(): Promise<{ success: boolean; message: string; whatsappNumber?: string }> {
    try {
      // Apenas desativa a sessão, mantendo credenciais salvas
      const result = await this.deactivateSession();
      return {
        success: result.success,
        message: result.message || 'WhatsApp desconectado. Sessão mantida para reconexão rápida.',
      };
    } catch (error: any) {
      console.error('Erro ao desconectar WhatsApp (simples):', error);
      throw error;
    }
  }

  // Encerrar sessão WhatsApp completamente (remove credenciais)
  async disconnectWhatsApp(): Promise<{ success: boolean; message: string; whatsappNumber?: string }> {
    try {
      // Remove completamente (deleta pasta auth e banco de dados)
      const result = await this.removeSessionCompletely();
      return {
        success: result.success,
        message: result.message || 'WhatsApp removido completamente. Todas as credenciais foram deletadas.',
      };
    } catch (error: any) {
      console.error('Erro ao remover WhatsApp:', error);
      throw error;
    }
  }

  // Verificar status da conexão (compatibilidade com código antigo)
  async getConnectionStatus(): Promise<{
    success: boolean;
    isConnected: boolean;
    hasQRCode: boolean;
    hasSavedSession?: boolean;
  }> {
    try {
      // Não ativa automaticamente, apenas verifica
      const status = await this.getSessionStatus(false);

      return {
        success: true,
        isConnected: status.status?.status === 'connected',
        hasQRCode: status.status?.status === 'qr_ready',
        hasSavedSession: status.status?.status !== 'disconnected' && status.uuid !== undefined,
      };
    } catch (error: any) {
      console.error('Erro ao verificar status da conexão:', error);
      throw error;
    }
  }

  // Enviar mensagem programaticamente
  async sendMessage(number: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string; key?: string }> {
    try {
      const uuid = this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${WHATSAPP_API_BASE_URL}/api/${uuid}/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          to: number,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Obter chats
  async getChats(): Promise<{ success: boolean; chats: any[] }> {
    try {
      const uuid = this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${WHATSAPP_API_BASE_URL}/api/${uuid}/chats`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao obter chats');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao obter chats:', error);
      throw error;
    }
  }

  // Obter mensagens de um chat
  async getChatMessages(chatId: string): Promise<{ success: boolean; messages: any[] }> {
    try {
      const uuid = this.getUUID();
      if (!uuid) {
        throw new Error('UUID não encontrado. Faça login novamente.');
      }

      const encodedChatId = encodeURIComponent(chatId);
      const response = await fetch(`${WHATSAPP_API_BASE_URL}/api/${uuid}/chats/${encodedChatId}/messages`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao obter mensagens');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao obter mensagens do chat:', error);
      throw error;
    }
  }

  // Obter preview da mensagem de agendamento
  async getMessagePreview(agendamentoId: string): Promise<any> {
    try {
      // Note: WHATSAPP_API_BASE_URL might need /api prefix depending on backend route
      // The controller is @Controller('message-template-test'), so it's usually at /api/message-template-test
      // But WhatsAppController is @Controller() and its routes are /whatsapp/... and /api/...
      // Let's assume the standard /api prefix for message-template-test
      const response = await fetch(`${WHATSAPP_API_BASE_URL}/api/message-template-test/real/${agendamentoId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao obter preview da mensagem');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao obter preview da mensagem:', error);
      throw error;
    }
  }

  // Verificar se WhatsApp já está sendo usado (compatibilidade - não necessário com UUID)
  async checkWhatsAppInUse(): Promise<{
    success: boolean;
    inUse: boolean;
    message: string;
    whatsappNumber?: string;
    activeConnections?: Array<{
      whatsappNumber: string;
      tenantId: string;
      isOtherTenant: boolean;
    }>;
  }> {
    // Com UUID, cada empresa tem sua própria sessão isolada
    // Não há necessidade de verificar se está em uso por outro tenant
    const status = await this.getConnectionStatus();

    return {
      success: true,
      inUse: status.isConnected,
      message: status.isConnected
        ? 'WhatsApp está conectado para esta empresa'
        : 'WhatsApp não está conectado',
    };
  }

  // Obter canal WhatsApp da empresa do usuário logado
  // Provedor da sessão não-oficial (UnnaZap): 'waha' (default) ou 'evolution'
  async getProvider(): Promise<{ success: boolean; provider: WhatsAppProvider }> {
    try {
      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/provider`, {
        headers: this.getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, provider: 'waha' };
      }
      return data;
    } catch {
      return { success: false, provider: 'waha' };
    }
  }

  // Troca o provedor — a sessão do provedor anterior é DESTRUÍDA no backend
  async setProvider(provider: WhatsAppProvider): Promise<{ success: boolean; provider?: WhatsAppProvider; changed?: boolean; error?: string }> {
    try {
      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/provider`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ provider }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || data.error || 'Falha ao trocar o provedor' };
      }
      return data;
    } catch (error: any) {
      console.error('Erro ao trocar provedor WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  async getMyChannel(): Promise<{ success: boolean; channel?: { id: string; name: string; phoneNumberId: string; status: string } | null }> {
    try {
      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/my-channel`, {
        headers: this.getHeaders(),
      });
      return response.json();
    } catch {
      return { success: false, channel: null };
    }
  }

  // Conecta o WhatsApp oficial via Embedded Signup (Coexistence)
  async onboardWhatsapp(payload: { code: string; wabaId: string; phoneNumberId: string }): Promise<{ success: boolean; channel?: { id: string; name: string; phoneNumberId: string; status: string }; error?: string }> {
    try {
      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/official/onboard`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || data.error || 'Falha no onboarding' };
      }
      return { success: true, channel: data.channel };
    } catch (error: any) {
      console.error('Erro no onboarding WhatsApp oficial:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar template WhatsApp usando o canal da empresa do usuário logado
  async sendTemplateAsAdmin(to: string, templateName: string, languageCode: string = 'pt_BR'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/send-template`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ to, templateName, languageCode }),
      });
      const data = await response.json();
      // O backend responde 200 mesmo quando a Meta recusa (payload { success:false }).
      if (!response.ok || data?.success === false) {
        const detail = data?.details?.error?.message || data?.error || data?.message || 'Erro ao enviar template';
        return { success: false, error: detail };
      }
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Testar API Oficial
  async testOfficialApi(to: string, templateName: string, channelId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/official/test`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ to, templateName, channelId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || data.error || 'Erro ao testar API Oficial' 
        };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao testar API Oficial:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter health do WAHA (SuperAdmin)
  async getWahaHealth(): Promise<WahaHealthResponse> {
    try {
      const response = await fetch(`${WHATSAPP_API_BASE_URL}/whatsapp/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao obter health do WAHA');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao obter health do WAHA:', error);
      return {
        success: false,
        wahaUrl: '',
        wahaReachable: false,
        sessionsCount: 0,
        sessions: [],
        error: error.message
      };
    }
  }
}

// Função utilitária para configurar WhatsApp (compatibilidade)
// Não é mais necessária, mas mantida para compatibilidade
export const configureWhatsAppAccount = async (email: string, name: string): Promise<{
  success: boolean;
  message: string;
  token?: string;
}> => {
  // Com a nova implementação, não há mais registro/login
  // A sessão é ativada automaticamente quando necessário
  return {
    success: true,
    message: 'Conta WhatsApp configurada. Use connectWhatsApp() para conectar.',
  };
};

export const whatsappService = new WhatsAppService();
