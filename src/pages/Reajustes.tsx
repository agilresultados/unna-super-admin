import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/Badge';
import { planoService, Plano } from '@/services/plano.service';
import {
  reajusteService,
  BillingCycle,
  Reajuste,
  ReajusteDetalhe,
  ReajusteParams,
  ReajustePreview,
  ReajusteStatus,
} from '@/services/reajuste.service';
import { formatCurrencyDynamic } from '@/utils/currencyUtils';

const AVISO_PREVIO_DIAS = 30;

const dataISO = (d: Date) => d.toISOString().slice(0, 10);

const emDias = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return dataISO(d);
};

const formatarData = (valor?: string | null) =>
  valor ? new Date(valor).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—';

const mensagemDeErro = (erro: any, fallback: string) =>
  erro?.messages?.join(' ') || erro?.message || fallback;

const TONE_STATUS: Record<ReajusteStatus, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  AGENDADO: 'warning',
  AVISADO: 'accent',
  APLICADO: 'success',
  CANCELADO: 'danger',
};

const TONE_ITEM: Record<string, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  PENDENTE: 'default',
  APLICADO: 'success',
  PULADO: 'warning',
  FALHOU: 'danger',
};

// ==================== NOVO REAJUSTE ====================

interface NovoReajusteProps {
  isOpen: boolean;
  planos: Plano[];
  onClose: () => void;
  onCriado: () => void;
}

const NovoReajusteModal: React.FC<NovoReajusteProps> = ({ isOpen, planos, onClose, onCriado }) => {
  const [planoId, setPlanoId] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [valorNovo, setValorNovo] = useState(0);
  const [vigenciaEm, setVigenciaEm] = useState(emDias(AVISO_PREVIO_DIAS + 1));
  const [adesaoAte, setAdesaoAte] = useState('');
  const [motivo, setMotivo] = useState('');

  const [preview, setPreview] = useState<ReajustePreview | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const vigenciaMinima = emDias(AVISO_PREVIO_DIAS);

  useEffect(() => {
    if (!isOpen) return;
    setPlanoId('');
    setBillingCycle('MONTHLY');
    setValorNovo(0);
    setVigenciaEm(emDias(AVISO_PREVIO_DIAS + 1));
    setAdesaoAte('');
    setMotivo('');
    setPreview(null);
  }, [isOpen]);

  // Qualquer mudança nos parâmetros invalida a simulação: nunca agendar às cegas.
  useEffect(() => {
    setPreview(null);
  }, [planoId, billingCycle, valorNovo, vigenciaEm, adesaoAte]);

  const planoSelecionado = planos.find((p) => p.id === planoId);
  const precoCatalogo = planoSelecionado
    ? billingCycle === 'YEARLY'
      ? planoSelecionado.preco_anual
      : planoSelecionado.preco_mensal
    : 0;

  const parametros = (): ReajusteParams => ({
    planoId,
    billing_cycle: billingCycle,
    valor_novo: valorNovo,
    vigencia_em: vigenciaEm,
    ...(adesaoAte ? { adesao_ate: adesaoAte } : {}),
    ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
  });

  const podeSimular = Boolean(planoId) && valorNovo > 0 && Boolean(vigenciaEm);

  const simular = async () => {
    if (!podeSimular) return;
    setSimulando(true);
    try {
      setPreview(await reajusteService.preview(parametros()));
    } catch (erro: any) {
      setPreview(null);
      toast.error(mensagemDeErro(erro, 'Não foi possível simular o reajuste'));
    } finally {
      setSimulando(false);
    }
  };

  const agendar = async () => {
    if (!preview || preview.total_alcancadas === 0) return;
    setSalvando(true);
    try {
      await reajusteService.criar(parametros());
      toast.success('Reajuste agendado. Envie o aviso prévio para liberar a aplicação.');
      onCriado();
      onClose();
    } catch (erro: any) {
      toast.error(mensagemDeErro(erro, 'Não foi possível agendar o reajuste'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      title="Novo reajuste de preço"
      subtitle="Alcança quem já assinou. Exige aviso prévio de 30 dias (cláusula 7.1 dos Termos)."
      icon={<TrendingUp className="w-5 h-5" />}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Plano</label>
            <select
              value={planoId}
              onChange={(e) => setPlanoId(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 text-sm"
            >
              <option value="">Selecione um plano</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ciclo de cobrança</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 text-sm"
            >
              <option value="MONTHLY">Mensal</option>
              <option value="YEARLY">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Novo valor</label>
            <CurrencyInput
              value={valorNovo}
              onValueChange={setValorNovo}
            />
            {planoSelecionado && (
              <p className="text-xs text-gray-500 mt-1">
                Preço de catálogo hoje: {formatCurrencyDynamic(precoCatalogo)} — vale só para novas adesões.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vigência</label>
            <Input
              type="date"
              value={vigenciaEm}
              min={vigenciaMinima}
              onChange={(e) => setVigenciaEm(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              No mínimo 30 dias a partir do aviso.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Alcançar quem assinou até (opcional)</label>
            <Input
              type="date"
              value={adesaoAte}
              onChange={(e) => setAdesaoAte(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Motivo (opcional)</label>
            <Input
              value={motivo}
              placeholder="Reajuste anual"
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={simular} disabled={!podeSimular || simulando}>
            {simulando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Simular
          </Button>
        </div>

        {preview && (
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-xs text-gray-500">Assinaturas alcançadas</p>
                <p className="text-xl font-semibold">{preview.total_alcancadas}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-xs text-gray-500">Fora do reajuste</p>
                <p className="text-xl font-semibold">{preview.total_fora}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-xs text-gray-500">Soma atual</p>
                <p className="text-xl font-semibold">{formatCurrencyDynamic(preview.soma_atual)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-xs text-gray-500">Depois do reajuste</p>
                <p className="text-xl font-semibold">{formatCurrencyDynamic(preview.soma_nova)}</p>
                <p className={`text-xs mt-1 ${preview.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {preview.delta >= 0 ? '+' : ''}
                  {formatCurrencyDynamic(preview.delta)}
                </p>
              </div>
            </div>

            {preview.total_alcancadas === 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
                <span>
                  Nenhuma assinatura elegível com esses parâmetros. Confira o plano, o ciclo e o valor.
                </span>
              </div>
            )}

            {preview.alcancadas.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium">Empresa</th>
                      <th className="px-3 py-2 font-medium">Gateway</th>
                      <th className="px-3 py-2 font-medium text-right">De</th>
                      <th className="px-3 py-2 font-medium text-right">Para</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.alcancadas.map((a) => (
                      <tr key={a.assinaturaId} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2">{a.empresa || a.assinaturaId}</td>
                        <td className="px-3 py-2 capitalize">{a.gateway || '—'}</td>
                        <td className="px-3 py-2 text-right">{formatCurrencyDynamic(a.valor_anterior)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrencyDynamic(a.valor_novo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {preview.fora.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Ficam de fora ({preview.fora.length})</p>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {preview.fora.map((f) => (
                    <div key={f.assinaturaId} className="px-3 py-2 text-sm flex justify-between gap-3">
                      <span>{f.empresa}</span>
                      <span className="text-gray-500 text-right">{f.motivo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-800 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={agendar}
            disabled={!preview || preview.total_alcancadas === 0 || salvando}
            isLoading={salvando}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agendar reajuste
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== DETALHE ====================

interface DetalheProps {
  reajusteId: string | null;
  onClose: () => void;
  onMudou: () => void;
}

const DetalheModal: React.FC<DetalheProps> = ({ reajusteId, onClose, onMudou }) => {
  const [detalhe, setDetalhe] = useState<ReajusteDetalhe | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [acao, setAcao] = useState<'aviso' | 'aplicar' | 'cancelar' | null>(null);

  const carregar = useCallback(async () => {
    if (!reajusteId) return;
    setCarregando(true);
    try {
      setDetalhe(await reajusteService.detalhar(reajusteId));
    } catch (erro: any) {
      toast.error(mensagemDeErro(erro, 'Não foi possível carregar o reajuste'));
    } finally {
      setCarregando(false);
    }
  }, [reajusteId]);

  useEffect(() => {
    setDetalhe(null);
    carregar();
  }, [carregar]);

  const enviarAviso = async () => {
    if (!detalhe) return;
    if (!window.confirm(
      `Enviar o aviso de reajuste por e-mail para ${detalhe.itens.length} empresa(s)? ` +
      'Este é o aviso prévio de 30 dias exigido pelos Termos e é o que libera a aplicação.',
    )) return;

    setAcao('aviso');
    try {
      const resultado = await reajusteService.enviarAviso(detalhe.id);
      toast.success(`Aviso enviado para ${resultado.enviados} empresa(s).`);
      if (resultado.falhas.length > 0) {
        toast.warning(`${resultado.falhas.length} empresa(s) não receberam o aviso.`);
      }
      await carregar();
      onMudou();
    } catch (erro: any) {
      toast.error(mensagemDeErro(erro, 'Não foi possível enviar o aviso'));
    } finally {
      setAcao(null);
    }
  };

  const aplicar = async () => {
    if (!detalhe) return;
    if (!window.confirm(
      'Aplicar o reajuste agora? O valor novo é empurrado para a recorrência no gateway e ' +
      'passa a valer nas próximas cobranças. Contas em Pix Automático são puladas: o mandato ' +
      'no banco é de valor fixo e exige nova autorização da cliente.',
    )) return;

    setAcao('aplicar');
    try {
      const resultado = await reajusteService.aplicar(detalhe.id);
      toast.success(
        `Aplicado em ${resultado.aplicados}. Pulados: ${resultado.pulados}. Falhas: ${resultado.falhas}.`,
      );
      await carregar();
      onMudou();
    } catch (erro: any) {
      toast.error(mensagemDeErro(erro, 'Não foi possível aplicar o reajuste'));
    } finally {
      setAcao(null);
    }
  };

  const cancelar = async () => {
    if (!detalhe) return;
    if (!window.confirm('Cancelar este reajuste? A base continua no valor atual.')) return;

    setAcao('cancelar');
    try {
      await reajusteService.cancelar(detalhe.id);
      toast.success('Reajuste cancelado.');
      onMudou();
      onClose();
    } catch (erro: any) {
      toast.error(mensagemDeErro(erro, 'Não foi possível cancelar o reajuste'));
    } finally {
      setAcao(null);
    }
  };

  const encerrado = detalhe?.status === 'APLICADO' || detalhe?.status === 'CANCELADO';
  const podeAplicar = Boolean(
    detalhe?.aviso_enviado_em && detalhe && new Date(detalhe.vigencia_em) <= new Date() && !encerrado,
  );

  return (
    <Modal
      isOpen={Boolean(reajusteId)}
      onClose={onClose}
      size="4xl"
      title="Reajuste"
      subtitle={detalhe ? `${detalhe.plano?.nome || 'Plano'} · ${detalhe.billing_cycle === 'YEARLY' ? 'Anual' : 'Mensal'}` : undefined}
      icon={<CalendarClock className="w-5 h-5" />}
    >
      {carregando && !detalhe ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : detalhe ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs text-gray-500">Status</p>
              <Badge tone={TONE_STATUS[detalhe.status]}>{detalhe.status}</Badge>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs text-gray-500">Novo valor</p>
              <p className="text-lg font-semibold">{formatCurrencyDynamic(detalhe.valor_novo)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs text-gray-500">Vigência</p>
              <p className="text-lg font-semibold">{formatarData(detalhe.vigencia_em)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs text-gray-500">Aviso enviado</p>
              <p className="text-lg font-semibold">{formatarData(detalhe.aviso_enviado_em)}</p>
            </div>
          </div>

          {!detalhe.aviso_enviado_em && !encerrado && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
              <span>
                Sem o aviso prévio carimbado, a aplicação é recusada. O aviso precisa sair com pelo
                menos 30 dias de antecedência da vigência.
              </span>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Empresa</th>
                  <th className="px-3 py-2 font-medium text-right">De</th>
                  <th className="px-3 py-2 font-medium text-right">Para</th>
                  <th className="px-3 py-2 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {detalhe.itens.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 dark:border-gray-800 align-top">
                    <td className="px-3 py-2">
                      {item.assinatura?.empresa?.nome_negocio || item.assinaturaId}
                      <span className="block text-xs text-gray-500">
                        {item.assinatura?.empresa?.email || 'sem e-mail'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrencyDynamic(item.valor_anterior)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrencyDynamic(item.valor_novo)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={TONE_ITEM[item.status] || 'default'}>{item.status}</Badge>
                      {item.detalhe && (
                        <span className="block text-xs text-gray-500 mt-1 max-w-xs">{item.detalhe}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 dark:border-gray-800 pt-4">
            {!encerrado && (
              <Button variant="destructive" onClick={cancelar} isLoading={acao === 'cancelar'}>
                <X className="w-4 h-4 mr-2" />
                Cancelar reajuste
              </Button>
            )}
            {!encerrado && (
              <Button variant="outline" onClick={enviarAviso} isLoading={acao === 'aviso'}>
                <Mail className="w-4 h-4 mr-2" />
                {detalhe.aviso_enviado_em ? 'Reenviar aviso' : 'Enviar aviso prévio'}
              </Button>
            )}
            <Button onClick={aplicar} disabled={!podeAplicar} isLoading={acao === 'aplicar'}>
              <Check className="w-4 h-4 mr-2" />
              Aplicar reajuste
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

// ==================== PÁGINA ====================

const Reajustes: React.FC = () => {
  const [reajustes, setReajustes] = useState<Reajuste[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novoAberto, setNovoAberto] = useState(false);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [lista, listaPlanos] = await Promise.all([
        reajusteService.listar(),
        planoService.getPlanos(),
      ]);
      setReajustes(lista);
      setPlanos(listaPlanos);
    } catch (erro: any) {
      toast.error(mensagemDeErro(erro, 'Não foi possível carregar os reajustes'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const emAndamento = useMemo(
    () => reajustes.filter((r) => r.status === 'AGENDADO' || r.status === 'AVISADO').length,
    [reajustes],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Reajuste de preço
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Mudar o preço em <strong>Planos</strong> vale só para novas adesões — quem já assinou tem o
            valor congelado no contrato. É aqui que a base é reajustada, com aviso prévio de 30 dias
            (cláusula 7.1 dos Termos de Uso).
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl space-y-1.5">
            <p>O fluxo espelha as travas do backend em vez de repeti-las no cliente:</p>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
              <li>
                <span className="font-medium text-gray-700 dark:text-gray-300">Simular antes de agendar:</span>{' '}
                &quot;Agendar reajuste&quot; só habilita após preview com coorte não vazia; mudar plano,
                ciclo, valor, vigência ou data de adesão descarta o preview — nunca se agenda às cegas.
              </li>
              <li>
                <span className="font-medium text-gray-700 dark:text-gray-300">Preview:</span>{' '}
                assinaturas alcançadas, exclusões com motivo (já paga o valor novo / preço vigente há
                menos de 12 meses), soma atual, soma nova, delta e tabela empresa → gateway → de → para.
              </li>
              <li>
                <span className="font-medium text-gray-700 dark:text-gray-300">Vigência:</span>{' '}
                o campo já nasce com min de hoje + 30 dias.
              </li>
              <li>
                <span className="font-medium text-gray-700 dark:text-gray-300">No detalhe:</span>{' '}
                aviso prévio e aplicação com confirmação explícita — aplicar avisa que o valor vai para
                a recorrência no gateway e que Pix Automático é pulado (mandato de valor fixo).
                &quot;Aplicar&quot; fica desabilitado sem <code>aviso_enviado_em</code> ou antes da
                vigência, com alerta explicando isso. Cada item mostra status
                (PENDENTE/APLICADO/PULADO/FALHOU) com o detalhe do backend.
              </li>
            </ul>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={carregar} disabled={carregando}>
            <RefreshCw className={`w-4 h-4 mr-2 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setNovoAberto(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo reajuste
          </Button>
        </div>
      </div>

      {emAndamento > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-sm">
          {emAndamento} reajuste(s) em andamento.
        </div>
      )}

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Ciclo</th>
              <th className="px-4 py-3 font-medium text-right">Novo valor</th>
              <th className="px-4 py-3 font-medium">Vigência</th>
              <th className="px-4 py-3 font-medium">Aviso</th>
              <th className="px-4 py-3 font-medium text-right">Assinaturas</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {carregando && reajustes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </td>
              </tr>
            )}
            {!carregando && reajustes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  Nenhum reajuste registrado.
                </td>
              </tr>
            )}
            {reajustes.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3">{r.plano?.nome || r.planoId}</td>
                <td className="px-4 py-3">{r.billing_cycle === 'YEARLY' ? 'Anual' : 'Mensal'}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrencyDynamic(r.valor_novo)}</td>
                <td className="px-4 py-3">{formatarData(r.vigencia_em)}</td>
                <td className="px-4 py-3">{formatarData(r.aviso_enviado_em)}</td>
                <td className="px-4 py-3 text-right">{r._count?.itens ?? r.total_itens ?? 0}</td>
                <td className="px-4 py-3">
                  <Badge tone={TONE_STATUS[r.status]}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDetalheId(r.id)}>
                    Abrir
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NovoReajusteModal
        isOpen={novoAberto}
        planos={planos}
        onClose={() => setNovoAberto(false)}
        onCriado={carregar}
      />

      <DetalheModal
        reajusteId={detalheId}
        onClose={() => setDetalheId(null)}
        onMudou={carregar}
      />
    </div>
  );
};

export default Reajustes;
