import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FileText, Save, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { termosService, TermosGeraisConfig } from '@/services/termos.service';

/**
 * Publicação de nova versão dos Termos de Uso e exigência de aceite.
 *
 * Ligar a exigência BLOQUEIA todo administrador de salão até ele aceitar — por
 * isso o botão pede confirmação e o card avisa o que vai acontecer antes.
 */
export default function TermosAceiteCard() {
  const [config, setConfig] = useState<TermosGeraisConfig | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    termosService
      .getConfig()
      .then(setConfig)
      .catch(() => toast.error('Não foi possível carregar a configuração de termos.'));
  }, []);

  const salvar = async () => {
    if (!config) return;

    // Confirmação só ao LIGAR: desligar nunca deixa ninguém preso.
    if (config.exigir_aceite) {
      const ok = window.confirm(
        `Isto vai impedir TODO administrador de salão de usar o sistema até aceitar a versão ${config.versao || '(sem versão)'}.\n\n` +
        'Colaboradoras continuam trabalhando normalmente. Confirmar?',
      );
      if (!ok) return;
    }

    setSalvando(true);
    try {
      setConfig(await termosService.updateConfig(config));
      toast.success('Configuração de termos salva.');
    } catch (erro: any) {
      toast.error(erro?.message || 'Erro ao salvar a configuração de termos.');
    } finally {
      setSalvando(false);
    }
  };

  if (!config) return null;

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="bg-white dark:bg-gray-800">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Termos de Uso — Aceite Obrigatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-xs text-gray-500">
          Publique uma nova versão dos termos e, quando quiser, exija que os salões aceitem para
          continuar usando o sistema. O bloqueio vale para web e app, porque acontece na API.
        </p>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
              Versão vigente
            </label>
            <Input
              value={config.versao}
              onChange={(e: any) => setConfig({ ...config, versao: e.target.value })}
              placeholder="2026-08-15"
              className="bg-white font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Mude a versão sempre que o texto mudar. Quem aceitou a anterior precisa aceitar de
              novo — é isto que faz o aceite valer alguma coisa.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
              O que mudou (aparece na tela de aceite)
            </label>
            <textarea
              value={config.resumo ?? ''}
              onChange={(e) => setConfig({ ...config, resumo: e.target.value })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm min-h-[70px]"
              placeholder="Inclusão da seção sobre recebimento de pagamentos online."
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="font-semibold text-sm">Exigir aceite para continuar usando</p>
              <p className="text-xs text-gray-500">
                Bloqueia o administrador do salão. Colaboradoras não são afetadas.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.exigir_aceite}
                onChange={(e) => setConfig({ ...config, exigir_aceite: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {config.exigir_aceite && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">
              Com esta opção ligada e salva, <strong>todo administrador de salão</strong> fica sem
              acesso até aceitar a versão <strong>{config.versao || '(sem versão)'}</strong>.
              Publique o texto em <code>/termos</code> antes de ligar.
            </p>
          </div>
        )}

        {!config.exigir_aceite && config.versao && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Versão publicada sem exigir aceite: ninguém é bloqueado, e quem aceitar tem o aceite
              registrado normalmente. Útil para avisar antes de travar.
            </p>
          </div>
        )}

        <Button onClick={salvar} disabled={salvando}>
          <Save className="w-4 h-4 mr-2" />
          {salvando ? 'Salvando...' : 'Salvar configuração'}
        </Button>
      </CardContent>
    </Card>
  );
}
