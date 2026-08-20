import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { Wallet, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  recebimentoOnlineService,
  RecebimentoOnlineConfig,
} from '@/services/recebimento-online.service';

/** Texto cru do textarea -> lista de e-mails. Só roda no salvar, nunca a cada tecla. */
function parseEmails(texto: string): string[] {
  return texto
    .split('\n')
    .map((em) => em.trim())
    .filter(Boolean);
}

/**
 * Quem pode RECEBER pagamento online — o Pix que o cliente final paga direto na
 * conta do Mercado Pago do salão.
 *
 * Eixo diferente do card de gateway de assinatura: lá é a Unna cobrando o salão,
 * aqui é o salão cobrando a cliente dele.
 */
export default function RecebimentoOnlineCard() {
  const [config, setConfig] = useState<RecebimentoOnlineConfig | null>(null);
  // O textarea guarda o texto cru: se derivarmos o value da lista já filtrada,
  // a linha vazia recém-criada some no mesmo render e o Enter não funciona.
  const [emailsTexto, setEmailsTexto] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    recebimentoOnlineService
      .getConfig()
      .then((cfg) => {
        setConfig(cfg);
        setEmailsTexto(cfg.emails_liberados.join('\n'));
      })
      .catch(() => toast.error('Não foi possível carregar a liberação de recebimento online.'));
  }, []);

  const salvar = async () => {
    if (!config) return;
    setSalvando(true);
    try {
      const salvo = await recebimentoOnlineService.updateConfig({
        ...config,
        emails_liberados: parseEmails(emailsTexto),
      });
      setConfig(salvo);
      setEmailsTexto(salvo.emails_liberados.join('\n'));
      toast.success('Liberação de recebimento online salva.');
    } catch (erro: any) {
      toast.error(erro?.message || 'Erro ao salvar a liberação.');
    } finally {
      setSalvando(false);
    }
  };

  if (!config) return null;

  const ninguemLiberado = !config.liberado_para_todos && parseEmails(emailsTexto).length === 0;

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="bg-white dark:bg-gray-800">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Pagamentos Online (Salões)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-xs text-gray-500">
          Controla quais salões podem conectar a conta do Mercado Pago e cobrar a cliente por Pix
          (sinal de agendamento, comanda, pacote). Fora da liberação, a aba nem aparece no painel
          do salão e o backend recusa cobrar.
        </p>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Liberar para toda a base</p>
              <p className="text-xs text-gray-500">
                Com isto ligado a lista abaixo é ignorada (mas fica guardada).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.liberado_para_todos}
                onChange={(e) => setConfig({ ...config, liberado_para_todos: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {!config.liberado_para_todos && (
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                Contas liberadas (um e-mail por linha)
              </label>
              <textarea
                value={emailsTexto}
                onChange={(e) => setEmailsTexto(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm min-h-[100px] font-mono"
                placeholder="dona@salao.com&#10;outra@salao.com"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Casa com o e-mail de <strong>login</strong> de qualquer usuário da conta (ou o
                e-mail da empresa, quando houver). Lista vazia = <strong>ninguém</strong> recebe
                online.
              </p>
            </div>
          )}
        </div>

        {ninguemLiberado && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Nenhuma conta está liberada. Salões que já conectaram o Mercado Pago param de
              conseguir gerar cobrança — inclusive o sinal do agendamento pelo site.
            </p>
          </div>
        )}

        <Button onClick={salvar} disabled={salvando}>
          <Save className="w-4 h-4 mr-2" />
          {salvando ? 'Salvando...' : 'Salvar liberação'}
        </Button>
      </CardContent>
    </Card>
  );
}
