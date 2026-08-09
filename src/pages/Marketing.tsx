import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/select';
import {
  Target, Search, Trash2, RefreshCw, ChevronLeft, ChevronRight,
  Building2, Users, UserCheck, Calendar, Clock, Mail, Send,
  CheckSquare, Square, X, Filter, TrendingUp, AlertCircle,
  MessageCircle, Crown, Ban, HelpCircle, FileText
} from 'lucide-react';
import {
  marketingService, EmpresaMarketing, EmailTemplate
} from '@/services/marketing.service';
import TemplatesTab from './TemplatesTab';
import LeadsTab from './LeadsTab';
import { toast } from 'sonner';

/* ─── helpers ─── */
const statusBadge = (s: string) => {
  const m: Record<string, string> = { active: 'bg-green-100 text-green-700', suspended: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700', PENDING_VERIFICATION: 'bg-orange-100 text-orange-700' };
  const l: Record<string, string> = { active: 'Ativo', suspended: 'Suspenso', cancelled: 'Cancelado', PENDING_VERIFICATION: 'Pend. Verificação' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${m[s] ?? 'bg-gray-100 text-gray-600'}`}>{l[s] ?? s}</span>;
};

const subBadge = (s?: string) => {
  if (!s) return <span className="text-[10px] text-gray-400 italic">Sem assinatura</span>;
  const m: Record<string, string> = { ACTIVE: 'bg-blue-100 text-blue-700', TRIAL: 'bg-purple-100 text-purple-700', CANCELLED: 'bg-red-100 text-red-700', PENDING: 'bg-yellow-100 text-yellow-700', EXPIRED: 'bg-orange-100 text-orange-700' };
  const l: Record<string, string> = { ACTIVE: 'Ativa', TRIAL: 'Trial', CANCELLED: 'Cancelada', PENDING: 'Pendente', EXPIRED: 'Expirada' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${m[s] ?? 'bg-gray-100 text-gray-600'}`}>{l[s] ?? s}</span>;
};

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : <span className="text-gray-300">—</span>;

/* ─── Email Modal (com seleção de template) ─── */
const EmailModal = ({ empresas, onClose }: { empresas: EmpresaMarketing[]; onClose: () => void }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resultado, setResultado] = useState<{ enviados: number; pulados: number; erros: number } | null>(null);

  useEffect(() => {
    marketingService.listarTemplates().then(t => { setTemplates(t.filter(tp => tp.ativo)); setLoading(false); });
  }, []);

  const selectedTemplate = templates.find(t => t.id === templateId);
  const semEmail = empresas.filter(e => !e.email);

  const handleSend = async () => {
    if (!templateId) { toast.error('Selecione um template.'); return; }
    try {
      setSending(true);
      const res = await marketingService.enviarCampanha(templateId, empresas.map(e => e.id));
      setResultado(res);
      toast.success(`Campanha concluída: ${res.enviados} enviado(s), ${res.pulados} pulado(s), ${res.erros} erro(s)`);
    } catch { toast.error('Erro ao enviar campanha.'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-primary"><Send size={18} /><h2 className="font-bold">Envio em Massa</h2></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {resultado ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[{ label: 'Enviados', value: resultado.enviados, color: 'bg-green-50 text-green-700' },
                { label: 'Pulados', value: resultado.pulados, color: 'bg-yellow-50 text-yellow-700' },
                { label: 'Erros', value: resultado.erros, color: 'bg-red-50 text-red-700' }].map(k => (
                  <div key={k.label} className={`${k.color} rounded-xl p-4 text-center`}>
                    <p className="text-2xl font-black">{k.value}</p>
                    <p className="text-xs font-bold uppercase mt-1">{k.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">Os "pulados" já haviam recebido este template anteriormente.</p>
              <Button className="w-full bg-primary text-white" onClick={onClose}>Fechar</Button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span><strong>{empresas.length}</strong> empresa(s) selecionada(s). Cada empresa recebe cada template apenas 1 vez.</span>
              </div>

              {semEmail.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-700">
                  <strong>{semEmail.length}</strong> empresa(s) sem e-mail serão puladas automaticamente.
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Template de E-mail</label>
                {loading ? <p className="text-xs text-gray-400">Carregando templates...</p> : (
                  <Select value={templateId} onChange={(e: any) => setTemplateId(e.target.value)}>
                    <option value="">Selecionar template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.nome} {t.categoria ? `(${t.categoria})` : ''}</option>
                    ))}
                  </Select>
                )}
              </div>

              {selectedTemplate && (
                <div className="bg-gray-50 border rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-gray-700">{selectedTemplate.assunto}</p>
                  {selectedTemplate.variaveis.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTemplate.variaveis.map(v => (
                        <code key={v} className="text-[9px] bg-white border text-blue-600 px-1.5 py-0.5 rounded font-mono">{v}</code>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="max-h-32 overflow-y-auto space-y-1 border rounded-xl p-2">
                {empresas.map(e => (
                  <div key={e.id} className="text-xs text-gray-600 flex items-center gap-2 px-1">
                    <Building2 size={10} className="text-gray-300 shrink-0" />
                    <span className="font-medium truncate">{e.nome_negocio}</span>
                    {e.email ? <span className="text-gray-400 ml-auto truncate">{e.email}</span>
                      : <span className="text-red-400 italic ml-auto">sem e-mail</span>}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                <Button className="flex-1 bg-primary text-white" onClick={handleSend} disabled={sending || !templateId}>
                  {sending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
                  {sending ? 'Enviando...' : 'Disparar Campanha'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Aba de Empresas ─── */
const EmpresasTab = () => {
  const [empresas, setEmpresas] = useState<EmpresaMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [subscriptionStatus, setSubscriptionStatus] = useState('all');
  const [semAssinatura, setSemAssinatura] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const r = await marketingService.getEmpresasMarketing({ page, limit: 600, search, status, subscriptionStatus, semAssinatura, dateFrom, dateTo, sortBy });
      setEmpresas(r.data); setTotal(r.total); setPages(r.pages);
    } catch { toast.error('Erro ao carregar empresas.'); }
    finally { setLoading(false); }
  }, [page, search, status, subscriptionStatus, semAssinatura, dateFrom, dateTo, sortBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => { setSearch(''); setStatus('all'); setSubscriptionStatus('all'); setSemAssinatura(false); setDateFrom(''); setDateTo(''); setSortBy('newest'); setPage(1); };
  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === empresas.length ? new Set() : new Set(empresas.map(e => e.id)));

  const kpiAtivas = empresas.filter(e => e.assinatura?.status === 'ACTIVE').length;
  const kpiTrial = empresas.filter(e => e.assinatura?.status === 'TRIAL').length;
  const kpiSem = empresas.filter(e => !e.assinatura).length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, icon: <Building2 size={16} />, c: 'bg-blue-50 text-blue-600' },
          { label: 'Assin. Ativa', value: kpiAtivas, icon: <Crown size={16} />, c: 'bg-green-50 text-green-600' },
          { label: 'Trial', value: kpiTrial, icon: <Clock size={16} />, c: 'bg-purple-50 text-purple-600' },
          { label: 'Sem Assin.', value: kpiSem, icon: <Ban size={16} />, c: 'bg-red-50 text-red-500' },
        ].map(k => (
          <Card key={k.label} className="bg-white shadow-sm border-0">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-gray-400 uppercase">{k.label}</p><p className="text-2xl font-black text-gray-900">{k.value}</p></div>
              <div className={`w-9 h-9 rounded-full ${k.c} flex items-center justify-center`}>{k.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-primary" />
            <span className="text-sm font-bold text-gray-700">Filtros</span>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <form className="flex-1 relative" onSubmit={e => { e.preventDefault(); setPage(1); fetchData(); }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Nome, e-mail ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 text-sm" />
            </form>
            <Button variant="outline" size="sm" className="h-10" onClick={clearFilters}><Trash2 size={13} className="mr-1" />Limpar</Button>
            <Button variant="outline" size="sm" className="h-10" onClick={() => { setPage(1); fetchData(); }} disabled={loading}><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><label className="text-[10px] font-bold text-gray-400 uppercase px-1 block mb-1">Status</label>
              <Select value={status} onChange={(e: any) => { setStatus(e.target.value); setPage(1); }}>
                <option value="all">Todos</option><option value="active">Ativo</option><option value="suspended">Suspenso</option><option value="cancelled">Cancelado</option><option value="PENDING_VERIFICATION">Pend. Verif.</option>
              </Select>
            </div>
            <div><label className="text-[10px] font-bold text-gray-400 uppercase px-1 block mb-1">Assinatura</label>
              <Select value={subscriptionStatus} onChange={(e: any) => { setSubscriptionStatus(e.target.value); setSemAssinatura(false); setPage(1); }} disabled={semAssinatura}>
                <option value="all">Todas</option><option value="ACTIVE">Ativa</option><option value="TRIAL">Trial</option><option value="CANCELLED">Cancelada</option><option value="PENDING">Pendente</option><option value="EXPIRED">Expirada</option>
              </Select>
            </div>
            <div><label className="text-[10px] font-bold text-gray-400 uppercase px-1 block mb-1">De</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div><label className="text-[10px] font-bold text-gray-400 uppercase px-1 block mb-1">Até</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div><label className="text-[10px] font-bold text-gray-400 uppercase px-1 block mb-1">Ordenar</label>
              <Select value={sortBy} onChange={(e: any) => { setSortBy(e.target.value); setPage(1); }}>
                <option value="newest">Mais Recentes</option><option value="oldest">Mais Antigas</option><option value="name_asc">Nome A-Z</option><option value="name_desc">Nome Z-A</option>
                <option value="clientes_desc">Mais Clientes</option><option value="agendamentos_desc">Mais Agendamentos</option><option value="dias_ativo_desc">Mais Tempo Ativo</option>
              </Select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={semAssinatura} onChange={e => { setSemAssinatura(e.target.checked); setSubscriptionStatus('all'); setPage(1); }} className="w-4 h-4 accent-primary" />
              Apenas sem assinatura
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="bg-primary text-white rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-lg">
          <CheckSquare size={15} />
          <span className="text-sm font-bold">{selected.size} empresa(s)</span>
          <button onClick={toggleAll} className="text-xs underline opacity-80">{selected.size === empresas.length ? 'Desmarcar' : 'Selecionar página'}</button>
          <div className="flex-1" />
          <Button size="sm" className="bg-white text-primary font-bold hover:bg-gray-100 flex items-center gap-1" onClick={() => setEmailModalOpen(true)}>
            <Mail size={13} /> Enviar E-mail em Massa
          </Button>
          <button onClick={() => setSelected(new Set())} className="p-1 rounded hover:bg-white/20"><X size={15} /></button>
        </div>
      )}

      {/* Paginação */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-500">Total: <strong>{total}</strong></p>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={15} /></Button>
          <span className="text-xs font-bold bg-white border px-3 h-8 flex items-center rounded-lg">{page}/{pages || 1}</span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}><ChevronRight size={15} /></Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-[11px] uppercase text-gray-400 font-bold">
                <th className="px-4 py-3 w-8"><button onClick={toggleAll}>{selected.size === empresas.length && empresas.length > 0 ? <CheckSquare size={15} className="text-primary" /> : <Square size={15} className="text-gray-300" />}</button></th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assinatura</th>
                <th className="px-4 py-3 text-center"><span className="flex items-center gap-1 justify-center"><Users size={10} />Clientes</span></th>
                <th className="px-4 py-3 text-center"><span className="flex items-center gap-1 justify-center"><UserCheck size={10} />Func.</span></th>
                <th className="px-4 py-3 text-center"><span className="flex items-center gap-1 justify-center"><Calendar size={10} />Agend.</span></th>
                <th className="px-4 py-3 text-center">Último Agend.</th>
                <th className="px-4 py-3 text-center"><span className="flex items-center gap-1 justify-center"><Clock size={10} />Dias</span></th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3 text-right">Contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={12} className="py-16 text-center"><RefreshCw size={22} className="animate-spin text-primary mx-auto" /></td></tr>
              ) : empresas.length === 0 ? (
                <tr><td colSpan={12} className="py-12 text-center text-sm text-gray-400">Nenhuma empresa encontrada.</td></tr>
              ) : empresas.map(e => {
                const sel = selected.has(e.id);
                return (
                  <tr key={e.id} className={`hover:bg-blue-50/30 transition-colors group ${sel ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3"><button onClick={() => toggleSelect(e.id)}>{sel ? <CheckSquare size={15} className="text-primary" /> : <Square size={15} className="text-gray-300 group-hover:text-gray-400" />}</button></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors"><Building2 size={13} /></div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{e.nome_negocio}</p>
                            {e.marketing_optout && <span className="text-[9px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-bold shrink-0" title={e.marketing_optout_at ? `Descadastrado em ${new Date(e.marketing_optout_at).toLocaleDateString('pt-BR')}` : 'Descadastrado de marketing'}>OPT-OUT</span>}
                          </div>
                          <p className="text-[9px] text-gray-400 font-mono">{e.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(e.status)}</td>
                    <td className="px-4 py-3"><div className="flex flex-col gap-0.5">{subBadge(e.assinatura?.status)}{e.assinatura?.plano && <span className="text-[9px] text-gray-400">{e.assinatura.plano.nome}</span>}</div></td>
                    <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><Users size={11} className="text-blue-400" /><span className="text-sm font-bold text-gray-800">{e.total_clientes}</span></div></td>
                    <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><UserCheck size={11} className="text-green-500" /><span className="text-sm font-bold text-gray-800">{e.total_colaboradores}</span></div></td>
                    <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><Calendar size={11} className="text-purple-500" /><span className="text-sm font-bold text-gray-800">{e.total_agendamentos}</span></div></td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(e.ultimo_agendamento)}</td>
                    <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><TrendingUp size={11} className={e.dias_ativo > 30 ? 'text-green-500' : 'text-orange-400'} /><span className="text-sm font-bold text-gray-700">{e.dias_ativo}</span></div></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(e.registered_at)}</td>
                    <td className="px-4 py-3">{!e.email ? <span className="flex items-center gap-1 text-[10px] text-red-400 italic"><HelpCircle size={10} />sem e-mail</span> : <span className="text-xs text-gray-600 truncate max-w-[150px] block">{e.email}</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {e.telefone && <a href={`https://wa.me/${e.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="WhatsApp"><MessageCircle size={13} /></a>}
                        {e.email && <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Enviar e-mail" onClick={() => { setSelected(new Set([e.id])); setEmailModalOpen(true); }}><Mail size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {emailModalOpen && (
        <EmailModal empresas={empresas.filter(e => selected.has(e.id))} onClose={() => { setEmailModalOpen(false); setSelected(new Set()); }} />
      )}
    </div>
  );
};

/* ─── Página principal com 2 abas ─── */
const Marketing = () => {
  const [tab, setTab] = useState<'empresas' | 'templates' | 'leads'>('empresas');

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Target size={18} className="text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-sm text-gray-400">Segmente empresas, gerencie templates e dispare campanhas para leads</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('empresas')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'empresas' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
          <Building2 size={15} /> Empresas
        </button>
        <button onClick={() => setTab('templates')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'templates' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
          <FileText size={15} /> Templates
        </button>
        <button onClick={() => setTab('leads')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'leads' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
          <Users size={15} /> Leads Externos
        </button>
      </div>

      {tab === 'empresas' ? <EmpresasTab /> : tab === 'templates' ? <TemplatesTab /> : <LeadsTab />}
    </div>
  );
};

export default Marketing;
