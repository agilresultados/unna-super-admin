import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, Check, CheckCheck, Clock, MessageCircle, RefreshCw, Reply, Search,
  Send, X, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  sdrService,
  WinbackCampanhaDetalhe,
  WinbackCampanhaResumo,
  WinbackDestinatario,
} from '@/services/sdr.service';
import { formatDateTime, formatHora } from './sdrUi';

type DestFiltro = 'todos' | 'entregues' | 'lidos' | 'responderam' | 'falhas';
type DestVisual = 'falha' | 'fila' | 'enviada' | 'entregue' | 'lida' | 'respondeu';

const FILTROS: { key: DestFiltro; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'entregues', label: 'Entregues' },
  { key: 'lidos', label: 'Lidos' },
  { key: 'responderam', label: 'Responderam' },
  { key: 'falhas', label: 'Falhas' },
];

function destVisual(d: WinbackDestinatario): DestVisual {
  if (d.alcance === 'falha' || d.status === 'falha' || d.ack_code === -1) return 'falha';
  if (d.alcance === 'respondeu') return 'respondeu';
  if (d.alcance === 'lido') return 'lida';
  if (d.alcance === 'entregue') return 'entregue';
  if (d.alcance === 'enviado') return 'enviada';
  return 'fila';
}

function matchFiltro(d: WinbackDestinatario, filtro: DestFiltro): boolean {
  const v = destVisual(d);
  if (filtro === 'todos') return true;
  if (filtro === 'falhas') return v === 'falha';
  if (filtro === 'responderam') return v === 'respondeu';
  if (filtro === 'lidos') return v === 'lida' || v === 'respondeu';
  if (filtro === 'entregues') return v === 'entregue' || v === 'lida' || v === 'respondeu';
  return true;
}

function DestStatusIcon({ d }: { d: WinbackDestinatario }) {
  const v = destVisual(d);
  if (v === 'falha') return <X className="w-4 h-4 text-red-500 shrink-0" />;
  if (v === 'fila') return <Clock className="w-4 h-4 text-gray-400 shrink-0" />;
  if (v === 'enviada') return <Check className="w-4 h-4 text-gray-400 shrink-0" />;
  if (v === 'entregue') return <CheckCheck className="w-4 h-4 text-gray-400 shrink-0" />;
  if (v === 'lida') return <CheckCheck className="w-4 h-4 text-blue-500 shrink-0" />;
  return <Reply className="w-4 h-4 text-purple-600 shrink-0" />;
}

function visualLabel(d: WinbackDestinatario): string {
  const v = destVisual(d);
  if (v === 'falha') return 'Falhou';
  if (v === 'fila') return 'Na fila';
  if (v === 'enviada') return 'Enviada';
  if (v === 'entregue') return 'Entregue';
  if (v === 'lida') return 'Lida';
  return 'Respondeu';
}

function eventTime(d: WinbackDestinatario): string {
  const v = destVisual(d);
  if (v === 'respondeu') return formatHora(d.respondeuEm);
  if (v === 'lida') return formatHora(d.lidoEm);
  if (v === 'entregue') return formatHora(d.entregueEm);
  if (v === 'enviada') return formatHora(d.enviadoEm);
  return '';
}

function responseList(d: WinbackDestinatario) {
  if (d.respostas?.length) return d.respostas;
  if (d.respostaTexto) return [{ em: d.respondeuEm || '', texto: d.respostaTexto, tipo: 'text' }];
  return [];
}

function normalizeWhatsappNumber(phone?: string | null): string | null {
  const digits = phone?.replace(/\D/g, '') ?? '';
  return digits.length >= 10 ? digits : null;
}

function metricPercent(value: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function CampanhaListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 rounded-lg bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
      ))}
    </div>
  );
}

export default function SdrCampanhaPanel() {
  const navigate = useNavigate();
  const { campanhaId } = useParams();

  const [campanhas, setCampanhas] = useState<WinbackCampanhaResumo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(campanhaId || null);
  const [detalhe, setDetalhe] = useState<WinbackCampanhaDetalhe | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [filtro, setFiltro] = useState<DestFiltro>('todos');
  const [busca, setBusca] = useState('');
  const [selectedDestinatarioId, setSelectedDestinatarioId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await sdrService.getCampanhasWinback(50);
      setCampanhas(list);
      setSelectedId((current) => current || campanhaId || list[0]?.id || null);
      return list;
    } catch {
      toast.error('Erro ao carregar campanhas de winback');
      setCampanhas([]);
      return [] as WinbackCampanhaResumo[];
    } finally {
      setLoadingList(false);
    }
  }, [campanhaId]);

  const loadDetalhe = useCallback(async (id: string) => {
    setLoadingDetalhe(true);
    try {
      const data = await sdrService.getCampanhaWinback(id);
      setDetalhe(data);
      setSelectedDestinatarioId(data.destinatarios[0]?.id || null);
    } catch {
      toast.error('Erro ao carregar a campanha');
      setDetalhe(null);
    } finally {
      setLoadingDetalhe(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (campanhaId && campanhaId !== selectedId) setSelectedId(campanhaId);
  }, [campanhaId, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetalhe(null);
      return;
    }
    setFiltro('todos');
    setBusca('');
    setSelectedDestinatarioId(null);
    void loadDetalhe(selectedId);
  }, [selectedId, loadDetalhe]);

  useEffect(() => {
    if (!selectedId || detalhe?.status !== 'enviando') return;
    const t = window.setInterval(() => {
      void sdrService.getCampanhaWinback(selectedId).then((data) => {
        setDetalhe(data);
        setSelectedDestinatarioId((current) =>
          current && data.destinatarios.some((d) => d.id === current)
            ? current
            : data.destinatarios[0]?.id || null,
        );
        setCampanhas((prev) =>
          prev.map((c) => (c.id === data.id
            ? {
                ...c,
                status: data.status,
                total: data.total,
                enviados: data.enviados,
                falhas: data.falhas,
                entregues: data.entregues,
                lidos: data.lidos,
                respondidos: data.respondidos,
                naoEntregues: data.naoEntregues,
              }
            : c)),
        );
      }).catch(() => undefined);
    }, 9000);
    return () => window.clearInterval(t);
  }, [selectedId, detalhe?.status]);

  const selectCampanha = (id: string) => {
    setSelectedId(id);
    navigate(`/sdr/winback/campanhas/${id}`, { replace: false });
  };

  const destinatarios = detalhe?.destinatarios ?? [];
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return destinatarios.filter((d) => {
      if (!matchFiltro(d, filtro)) return false;
      if (!q) return true;
      return [
        d.nomeEmpresa,
        d.nomeDestinatario,
        d.telefone,
        d.respostaTexto,
        d.erro,
        d.falhaEntrega,
      ].some((v) => v?.toLowerCase().includes(q));
    });
  }, [busca, destinatarios, filtro]);

  useEffect(() => {
    setSelectedDestinatarioId((current) => {
      if (current && filtrados.some((d) => d.id === current)) return current;
      return filtrados[0]?.id || null;
    });
  }, [filtrados]);

  const processados = detalhe ? detalhe.enviados + detalhe.falhas : 0;
  const progresso = detalhe?.total ? Math.min(100, Math.round((processados / detalhe.total) * 100)) : 0;
  const selectedResumo = campanhas.find((c) => c.id === selectedId);
  const selectedDestinatario = filtrados.find((d) => d.id === selectedDestinatarioId) || null;

  return (
    <div className="min-h-screen space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9" onClick={() => navigate('/sdr')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Painel SDR
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Acompanhamento de winback</h1>
            <p className="text-xs text-gray-500">
              Campanhas, entregas e respostas em leitura de conversa.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9" onClick={() => { void loadList(); }} disabled={loadingList}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingList ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button className="h-9" onClick={() => navigate('/sdr/winback')}>
            <Send className="w-4 h-4 mr-2" /> Nova campanha
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-4 items-start">
        <aside className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 xl:sticky xl:top-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Campanhas</h2>
              <p className="text-[11px] text-gray-400">{campanhas.length} recentes</p>
            </div>
          </div>

          {loadingList ? (
            <CampanhaListSkeleton />
          ) : campanhas.length === 0 ? (
            <div className="text-center py-14 px-4">
              <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Nenhuma campanha ainda</p>
              <p className="text-xs text-gray-500 mt-1">Dispare uma campanha para acompanhar as respostas aqui.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-190px)] overflow-y-auto pr-1">
              {campanhas.map((c) => {
                const selected = c.id === selectedId;
                const replied = c.respondidos > 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCampanha(c.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {c.templateName || 'Winback'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{formatDateTime(c.createdAt)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === 'enviando'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200'
                      }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-[9px] uppercase text-gray-400 font-bold">Total</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{c.total}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-gray-400 font-bold">Lidos</p>
                        <p className="text-sm font-bold text-blue-600">{c.lidos}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-gray-400 font-bold">Resp.</p>
                        <p className={`text-sm font-bold ${replied ? 'text-purple-600' : 'text-gray-500'}`}>{c.respondidos}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-gray-400 font-bold">Falhas</p>
                        <p className="text-sm font-bold text-red-600">{c.falhas}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <main className="space-y-4 min-w-0">
          {!detalhe && !loadingDetalhe ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center py-20 px-4">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {selectedResumo ? 'Selecione uma campanha' : 'Nenhuma campanha selecionada'}
              </p>
              <p className="text-xs text-gray-500 mt-1">As conversas aparecem aqui assim que houver uma campanha carregada.</p>
            </div>
          ) : (
            <>
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {detalhe?.templateName || 'Campanha de winback'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(detalhe?.createdAt)} · {detalhe?.status || 'carregando'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full lg:w-auto">
                    {[
                      { label: 'Total', value: detalhe?.total ?? 0, color: 'text-gray-900 dark:text-white' },
                      { label: 'Enviadas', value: detalhe?.enviados ?? 0, color: 'text-gray-900 dark:text-white' },
                      { label: 'Entregues', value: detalhe?.entregues ?? 0, color: 'text-green-600' },
                      { label: 'Lidas', value: detalhe?.lidos ?? 0, color: 'text-blue-600' },
                      { label: 'Responderam', value: detalhe?.respondidos ?? 0, color: 'text-purple-600' },
                      { label: 'Falhas', value: detalhe?.falhas ?? 0, color: 'text-red-600' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-gray-50 dark:bg-gray-900/40 px-3 py-2 text-center">
                        <p className="text-[9px] font-bold uppercase text-gray-400">{m.label}</p>
                        <p className={`text-lg font-bold leading-tight ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${detalhe?.status === 'enviando' ? 'bg-primary' : 'bg-green-600'}`}
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {progresso}% processado · entregues {metricPercent(detalhe?.entregues ?? 0, detalhe?.total ?? 0)} · respostas {metricPercent(detalhe?.respondidos ?? 0, detalhe?.total ?? 0)}
                  </p>
                </div>
              </section>

              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 space-y-3">
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {FILTROS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFiltro(key)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          filtro === key
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={busca}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
                      placeholder="Buscar por empresa, contato, telefone ou resposta..."
                      className="h-9 pl-9 text-sm"
                    />
                  </div>
                </div>

                {loadingDetalhe ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                  </div>
                ) : filtrados.length === 0 ? (
                  <div className="text-center py-20 px-4">
                    <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Nenhuma conversa neste filtro</p>
                    <p className="text-xs text-gray-500 mt-1">Troque o filtro ou busque por outro termo.</p>
                  </div>
                ) : (
                  <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="divide-y divide-gray-100 border-b border-gray-100 dark:divide-gray-700 dark:border-gray-700 lg:max-h-[calc(100vh-370px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
                      {filtrados.map((d) => {
                        const selected = d.id === selectedDestinatarioId;
                        const label = visualLabel(d);
                        const hora = eventTime(d);
                        const respostas = responseList(d);
                        const whatsappNumber = normalizeWhatsappNumber(d.telefone);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setSelectedDestinatarioId(d.id)}
                            className={`w-full p-4 text-left transition-colors ${
                              selected
                                ? 'bg-primary/5'
                                : 'bg-gray-50/50 hover:bg-gray-50 dark:bg-gray-900/20 dark:hover:bg-gray-700/30'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0">
                                <DestStatusIcon d={d} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {d.nomeEmpresa || d.nomeDestinatario || 'Sem nome'}
                                  </h3>
                                  {respostas.length > 0 && (
                                    <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                      {respostas.length}
                                    </span>
                                  )}
                                </div>
                                {whatsappNumber ? (
                                  <a
                                    href={`https://wa.me/${whatsappNumber}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-0.5 inline-flex max-w-full items-center gap-1 text-[11px] text-green-700 hover:underline dark:text-green-400"
                                  >
                                    <span className="truncate">{d.telefone}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                  </a>
                                ) : (
                                  <p className="text-[11px] text-gray-500 truncate">{d.telefone || 'Sem telefone'}</p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                                    {label}
                                  </span>
                                  {hora && <span className="text-[10px] text-gray-400">{hora}</span>}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="min-w-0 bg-[#f7faf9] dark:bg-gray-900/20">
                      {selectedDestinatario ? (() => {
                        const respostas = responseList(selectedDestinatario);
                        const erro = selectedDestinatario.erro || selectedDestinatario.falhaEntrega;
                        const whatsappNumber = normalizeWhatsappNumber(selectedDestinatario.telefone);
                        return (
                          <div className="flex min-h-full flex-col">
                            <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-800/80">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                                  {selectedDestinatario.nomeEmpresa || selectedDestinatario.nomeDestinatario || 'Sem nome'}
                                </h3>
                                {whatsappNumber ? (
                                  <a
                                    href={`https://wa.me/${whatsappNumber}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-green-700 hover:underline dark:text-green-400"
                                  >
                                    <span className="truncate">{selectedDestinatario.telefone}</span>
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                  </a>
                                ) : (
                                  <p className="mt-1 truncate text-xs text-gray-500">
                                    {selectedDestinatario.telefone || 'Sem telefone'}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-[10px] font-bold uppercase text-gray-500 dark:text-gray-200">
                                {visualLabel(selectedDestinatario)}
                              </span>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto p-4">
                              <div className="flex justify-end">
                                <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/50 px-3 py-2">
                                  <p className="text-xs text-emerald-950 dark:text-emerald-100 whitespace-pre-wrap break-words">
                                    {detalhe?.mensagem || 'Mensagem enviada'}
                                  </p>
                                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-emerald-700 dark:text-emerald-300">
                                    <span>{formatHora(selectedDestinatario.enviadoEm || detalhe?.createdAt)}</span>
                                    <DestStatusIcon d={selectedDestinatario} />
                                  </div>
                                </div>
                              </div>

                              {respostas.length > 0 ? (
                                respostas.map((r, i) => (
                                  <div key={`${selectedDestinatario.id}-${i}`} className="flex justify-start">
                                    <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900/50 px-3 py-2 shadow-sm">
                                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                                        {r.texto || '(sem texto)'}
                                      </p>
                                      <p className="text-[10px] text-purple-500 mt-1">{formatHora(r.em)}</p>
                                    </div>
                                  </div>
                                ))
                              ) : erro ? (
                                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 px-3 py-2">
                                  <p className="text-xs font-semibold text-red-700 dark:text-red-200">Falha no envio</p>
                                  <p className="text-xs text-red-600 dark:text-red-200 mt-0.5">{erro}</p>
                                </div>
                              ) : (
                                <div className="flex justify-start">
                                  <div className="rounded-2xl rounded-tl-md bg-white/70 dark:bg-gray-800/70 border border-dashed border-gray-200 dark:border-gray-700 px-3 py-2">
                                    <p className="text-xs text-gray-500">
                                      Ainda sem resposta deste contato.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="flex min-h-[360px] items-center justify-center p-6 text-center">
                          <div>
                            <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">Selecione um alcançado</p>
                            <p className="text-xs text-gray-500 mt-1">A conversa individual aparece aqui.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
