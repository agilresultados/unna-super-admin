import React, { useCallback, useEffect, useState } from 'react';
import { Check, CheckCheck, ChevronDown, Clock, Reply, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  sdrService,
  WinbackCampanhaDetalhe,
  WinbackCampanhaResumo,
  WinbackDestinatario,
} from '@/services/sdr.service';
import { formatDateTime, formatHora } from './sdrUi';

type DestFiltro = 'todos' | 'entregues' | 'lidos' | 'responderam' | 'falhas';

type DestVisual = 'falha' | 'fila' | 'enviada' | 'entregue' | 'lida' | 'respondeu';

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

interface SdrCampanhaPanelProps {
  focusId: string | null;
  focusNonce: number;
}

const SdrCampanhaPanel: React.FC<SdrCampanhaPanelProps> = ({ focusId, focusNonce }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [campanhas, setCampanhas] = useState<WinbackCampanhaResumo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<WinbackCampanhaDetalhe | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<DestFiltro>('todos');

  const loadList = useCallback(async () => {
    try {
      const list = await sdrService.getCampanhasWinback(20);
      setCampanhas(list);
      return list;
    } catch {
      toast.error('Erro ao carregar campanhas de winback');
      return [] as WinbackCampanhaResumo[];
    }
  }, []);

  const loadDetalhe = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await sdrService.getCampanhaWinback(id);
      setDetalhe(data);
    } catch {
      toast.error('Erro ao carregar a campanha');
      setDetalhe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList().then((list) => {
      if (!selectedId && list[0]) setSelectedId(list[0].id);
    });
  }, [loadList]);

  useEffect(() => {
    if (!focusId) return;
    setCollapsed(false);
    setSelectedId(focusId);
    void loadList();
  }, [focusId, focusNonce, loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetalhe(null);
      return;
    }
    void loadDetalhe(selectedId);
  }, [selectedId, loadDetalhe]);

  // Para quando o dispatcher termina — status deixa de ser 'enviando'.
  useEffect(() => {
    if (!selectedId || detalhe?.status !== 'enviando') return;
    const t = window.setInterval(() => {
      void sdrService.getCampanhaWinback(selectedId).then((data) => {
        setDetalhe(data);
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

  const destinatarios = detalhe?.destinatarios ?? [];
  const filtrados = destinatarios.filter((d) => matchFiltro(d, filtro));
  const processados = detalhe ? detalhe.enviados + detalhe.falhas : 0;
  const pct = detalhe && detalhe.total > 0 ? Math.min(100, Math.round((processados / detalhe.total) * 100)) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Campanha de winback</h2>
          {detalhe && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {detalhe.templateName || 'Campanha'} · {formatDateTime(detalhe.createdAt)}
            </p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="h-9 w-full px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 dark:text-white"
          >
            {campanhas.length === 0 && <option value="">Nenhuma campanha ainda</option>}
            {campanhas.map((c) => (
              <option key={c.id} value={c.id}>
                {formatDateTime(c.createdAt)} · {c.templateName || 'winback'} · {c.total} dest. · {c.status}
              </option>
            ))}
          </select>

          {loading && !detalhe ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !detalhe ? (
            <p className="text-sm text-gray-500 py-6 text-center">Dispare uma campanha para acompanhar quem recebeu, leu e respondeu.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                {[
                  { label: 'Total', value: detalhe.total },
                  { label: 'Enviadas', value: detalhe.enviados },
                  { label: 'Entregues', value: detalhe.entregues },
                  { label: 'Lidas', value: detalhe.lidos },
                  { label: 'Responderam', value: detalhe.respondidos },
                  { label: 'Falhas', value: detalhe.falhas },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{m.label}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${detalhe.status === 'enviando' ? 'bg-primary' : 'bg-green-600'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400">
                {pct}% processado
                {detalhe.status === 'enviando' ? ' · enviando…' : ` · ${detalhe.status}`}
              </p>

              <div className="flex gap-1 overflow-x-auto pb-1">
                {([
                  ['todos', 'Todos'],
                  ['entregues', 'Entregues'],
                  ['lidos', 'Lidos'],
                  ['responderam', 'Responderam'],
                  ['falhas', 'Falhas'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFiltro(key)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      filtro === key
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {filtrados.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Nenhum destinatário neste filtro.</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filtrados.map((d) => {
                      const v = destVisual(d);
                      const hora = v === 'respondeu'
                        ? formatHora(d.respondeuEm)
                        : v === 'lida'
                          ? formatHora(d.lidoEm)
                          : v === 'entregue'
                            ? formatHora(d.entregueEm)
                            : '';
                      const respostas = d.respostas?.length
                        ? d.respostas
                        : d.respostaTexto
                          ? [{ em: d.respondeuEm || '', texto: d.respostaTexto, tipo: 'text' }]
                          : [];
                      return (
                        <div key={d.id} className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            <DestStatusIcon d={d} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {d.nomeEmpresa || d.nomeDestinatario || '—'}
                              </div>
                              <div className="text-[10px] text-gray-500 truncate">{d.telefone}</div>
                            </div>
                            {hora && (
                              <span className={`text-[10px] shrink-0 ${v === 'respondeu' ? 'text-purple-600' : 'text-gray-400'}`}>
                                {hora}
                              </span>
                            )}
                          </div>
                          {respostas.length > 0 && (
                            <div className="mt-1 ml-7 space-y-1">
                              {respostas.map((r, i) => (
                                <div
                                  key={`${d.id}-${i}`}
                                  className="rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/40 px-2 py-1"
                                >
                                  <p className="text-[11px] text-purple-900 dark:text-purple-100 whitespace-pre-wrap break-words">
                                    {r.texto || '(sem texto)'}
                                  </p>
                                  {r.em && (
                                    <p className="text-[9px] text-purple-400 mt-0.5">{formatHora(r.em)}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SdrCampanhaPanel;
