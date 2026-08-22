import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, CheckSquare, ChevronLeft, ChevronRight, RefreshCw, Send, Square,
} from 'lucide-react';
import {
  sdrService, SegmentoLead, WinbackCandidato,
} from '@/services/sdr.service';
import { SEGMENTO_LABELS, formatDate } from '@/pages/sdr/sdrUi';

const SEGMENTOS_WINBACK: SegmentoLead[] = [
  'cancelado_recente',
  'cancelado_antigo',
  'sem_assinatura',
];

/** Tamanhos de lote: o SDR percorre a base em levas e observa a qualidade do número entre elas. */
const TAMANHOS_LOTE = [20, 50, 100, 200];

/**
 * Campanha de winback sobre a base histórica.
 *
 * Página (e não modal) porque a base é grande demais para uma prévia única: o
 * SDR precisa navegar por lotes, disparar uma leva e voltar para a seguinte sem
 * perder o contexto da tela.
 */
export default function SdrWinback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // O painel manda o segmento que o SDR já estava olhando, quando ele é de winback.
  const segmentoInicial = SEGMENTOS_WINBACK.includes(searchParams.get('segmento') as SegmentoLead)
    ? (searchParams.get('segmento') as SegmentoLead)
    : 'cancelado_recente';

  const [segmento, setSegmento] = useState<SegmentoLead>(segmentoInicial);
  const [tamanhoLote, setTamanhoLote] = useState(50);
  const [offset, setOffset] = useState(0);

  const [candidatos, setCandidatos] = useState<WinbackCandidato[]>([]);
  /** Elegíveis no segmento inteiro — menor que a contagem bruta do chip no painel. */
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const carregar = useCallback(async (seg: SegmentoLead, limite: number, inicio: number) => {
    setLoading(true);
    try {
      const data = await sdrService.getWinbackCandidatos(seg, limite, undefined, inicio);
      setCandidatos(data.candidatos);
      setTotal(data.total);
      // Seleção não atravessa lote: cada leva é uma decisão separada.
      setSelecionados(new Set());
    } catch {
      toast.error('Erro ao carregar os candidatos da campanha');
      setCandidatos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar(segmento, tamanhoLote, offset);
  }, [carregar, segmento, tamanhoLote, offset]);

  const handleSegmento = (seg: SegmentoLead) => {
    setOffset(0);
    setSegmento(seg);
  };

  const handleTamanhoLote = (n: number) => {
    setOffset(0);
    setTamanhoLote(n);
  };

  const toggleSelecao = (empresaId: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(empresaId)) next.delete(empresaId);
      else next.add(empresaId);
      return next;
    });
  };

  const todosDoLoteSelecionados = candidatos.length > 0 && selecionados.size === candidatos.length;

  const toggleSelecionarLote = () => {
    setSelecionados(todosDoLoteSelecionados
      ? new Set()
      : new Set(candidatos.map((c) => c.empresaId)));
  };

  const paginaAtual = Math.floor(offset / tamanhoLote) + 1;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanhoLote));
  const fim = Math.min(offset + candidatos.length, total);

  const avisoBaseFria = segmento === 'cancelado_antigo';

  const handleDisparar = async () => {
    if (selecionados.size === 0) {
      toast.error('Selecione ao menos uma empresa');
      return;
    }
    if (!confirm(
      `Disparar a campanha para ${selecionados.size} empresa(s)?\n\n`
      + 'O envio respeita a janela de 08h às 20h e o ritmo do disparador.',
    )) return;

    setEnviando(true);
    try {
      const res = await sdrService.dispararWinback(segmento, Array.from(selecionados));
      toast.success(`Campanha enfileirada para ${res.total} empresa(s)`);
      // Quem recebeu sai da base elegível, então o lote seguinte já vem limpo.
      await carregar(segmento, tamanhoLote, offset);
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
        ? e.message
        : 'Erro ao disparar a campanha';
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  const resumo = useMemo(() => {
    if (total === 0) return 'Nenhuma empresa elegível neste segmento';
    return `${offset + 1}–${fim} de ${total} elegíveis`;
  }, [offset, fim, total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9" onClick={() => navigate('/sdr')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Painel SDR
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Campanha de Winback</h1>
            <p className="text-xs text-gray-500">
              Base histórica — disparo pela API Oficial, sem suspensão automática
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="h-9"
          onClick={() => { void carregar(segmento, tamanhoLote, offset); }}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Segmento</label>
              <select
                value={segmento}
                onChange={(e) => handleSegmento(e.target.value as SegmentoLead)}
                className="h-9 w-full px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 dark:text-white"
              >
                {SEGMENTOS_WINBACK.map((s) => (
                  <option key={s} value={s}>{SEGMENTO_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Enviar de</label>
              <div className="flex gap-1">
                {TAMANHOS_LOTE.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleTamanhoLote(n)}
                    className={`h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      tamanhoLote === n
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="h-9"
              onClick={toggleSelecionarLote}
              disabled={candidatos.length === 0}
            >
              {todosDoLoteSelecionados ? 'Limpar seleção' : `Selecionar o lote (${candidatos.length})`}
            </Button>
          </div>

          {avisoBaseFria && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Base fria.</strong> Esse segmento tem o maior risco de bloqueio e denúncia — o
                template só faz uma pergunta, sem oferta. Dispare em lotes pequenos e acompanhe a
                qualidade do número no Business Manager entre as levas.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>{loading ? 'Carregando…' : resumo}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-8 px-2"
                onClick={() => setOffset(Math.max(0, offset - tamanhoLote))}
                disabled={loading || offset === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="tabular-nums">{paginaAtual} / {totalPaginas}</span>
              <Button
                variant="outline"
                className="h-8 px-2"
                onClick={() => setOffset(offset + tamanhoLote)}
                disabled={loading || fim >= total}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : candidatos.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma empresa elegível neste lote.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {candidatos.map((c, i) => {
                  const selecionado = selecionados.has(c.empresaId);
                  return (
                    <button
                      key={c.empresaId}
                      type="button"
                      onClick={() => toggleSelecao(c.empresaId)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      {selecionado
                        ? <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                        : <Square className="w-4 h-4 text-gray-300 shrink-0" />}
                      <span className="text-[10px] text-gray-400 tabular-nums w-10 shrink-0">
                        {offset + i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.nomeEmpresa}</div>
                        <div className="text-[10px] text-gray-500">
                          {c.nomeAdmin || 'sem contato'} · {c.telefone}
                          {c.acessoFim && ` · inativa desde ${formatDate(c.acessoFim)}`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500">
              {selecionados.size} de {candidatos.length} selecionada(s) neste lote
            </span>
            <Button
              onClick={() => { void handleDisparar(); }}
              isLoading={enviando}
              disabled={selecionados.size === 0 || enviando}
            >
              <Send className="w-4 h-4 mr-2" /> Disparar lote
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
