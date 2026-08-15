import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { CreditCard, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  paymentGatewayService,
  PaymentGatewayConfig,
} from '@/services/payment-gateway.service';

/**
 * Roteamento de gateway das ASSINATURAS (quem cobra a mensalidade do salão).
 *
 * Não confunda com o card de recebimento online, que trata do dinheiro que o
 * salão recebe do cliente final — são dois eixos independentes.
 */
export default function GatewayPagamentoCard() {
  const [config, setConfig] = useState<PaymentGatewayConfig | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    paymentGatewayService
      .getConfig()
      .then(setConfig)
      .catch(() => toast.error('Não foi possível carregar o roteamento de gateway.'));
  }, []);

  const salvar = async () => {
    if (!config) return;
    setSalvando(true);
    try {
      setConfig(await paymentGatewayService.updateConfig(config));
      toast.success('Roteamento de gateway salvo.');
    } catch (erro: any) {
      toast.error(erro?.message || 'Erro ao salvar o roteamento.');
    } finally {
      setSalvando(false);
    }
  };

  if (!config) return null;

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="bg-white dark:bg-gray-800">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Gateway de Pagamento (Assinaturas)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
            Gateway padrão dos novos checkouts
          </label>
          <select
            value={config.gateway_padrao}
            onChange={(e) =>
              setConfig({ ...config, gateway_padrao: e.target.value as 'asaas' | 'woovi' })
            }
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="asaas">Asaas (padrão atual)</option>
            <option value="woovi">Woovi — Pix Automático</option>
          </select>
          <p className="text-[10px] text-gray-400 mt-2">
            Vale só para assinaturas <strong>novas</strong>. Quem já assina continua no gateway
            gravado na própria assinatura — trocar aqui nunca migra a base existente.
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Modo Piloto (Beta)</p>
              <p className="text-xs text-gray-500">
                Se ativo, apenas os e-mails abaixo caem na Woovi. Todo o resto segue no gateway
                padrão.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.piloto_habilitado}
                onChange={(e) => setConfig({ ...config, piloto_habilitado: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {config.piloto_habilitado && (
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                E-mails das contas no piloto (um por linha)
              </label>
              <textarea
                value={config.emails_piloto.join('\n')}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    emails_piloto: e.target.value
                      .split('\n')
                      .map((em) => em.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm min-h-[100px] font-mono"
                placeholder="teste1@salao.com&#10;teste2@salao.com"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Casa com o e-mail de <strong>login</strong> de qualquer usuário da conta (ou o
                e-mail da empresa, quando houver). A conta precisa estar{' '}
                <strong>sem assinatura ativa</strong>, senão o checkout é bloqueado antes de chegar
                na escolha do gateway.
              </p>
            </div>
          )}
        </div>

        <Button onClick={salvar} disabled={salvando}>
          <Save className="w-4 h-4 mr-2" />
          {salvando ? 'Salvando...' : 'Salvar roteamento'}
        </Button>
      </CardContent>
    </Card>
  );
}
