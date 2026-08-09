import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import {
  Building2, Users, CreditCard, Clock, MessageCircle, Phone,
  Mail, Search, Filter, ChevronRight, ChevronLeft, RefreshCw,
  CheckCircle, XCircle, AlertCircle, TrendingUp, Eye, Plus,
  Calendar, FileText, MessageSquareText, Copy, Send,
  CalendarPlus, Ban, RotateCcw, CheckSquare, Square, Ticket
} from 'lucide-react';
import {
  sdrService, SdrDashboardStats, SdrLead, SdrTrackingEntry, SegmentoLead, WinbackCandidato,
} from '@/services/sdr.service';
import {
  SDR_SEGMENTS, SdrSegmentKey, detectSegment, fillTemplate,
} from '@/data/sdrTemplates';

const STATUS_COLORS: Record<string, string> = {
  TRIAL: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-200 text-gray-700',
  PENDING: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Ativo',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendente',
};

const SDR_STATUS_COLORS: Record<string, string> = {
  NOVO: 'bg-blue-100 text-blue-700',
  CONTATADO: 'bg-amber-100 text-amber-700',
  EM_NEGOCIACAO: 'bg-purple-100 text-purple-700',
  RECUPERADO: 'bg-green-100 text-green-700',
  PERDIDO: 'bg-red-100 text-red-700',
};

const SDR_STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  CONTATADO: 'Contatado',
  EM_NEGOCIACAO: 'Em Negociação',
  RECUPERADO: 'Recuperado',
  PERDIDO: 'Perdido',
};

const RECUP_STATUS_COLORS: Record<string, string> = {
  ATIVO: 'bg-orange-100 text-orange-700',
  CONVERTIDO: 'bg-green-100 text-green-700',
  RECUSADO: 'bg-gray-200 text-gray-700',
  SUSPENSO: 'bg-red-100 text-red-700',
};

const RECUP_STATUS_LABELS: Record<string, string> = {
  ATIVO: 'Na régua',
  CONVERTIDO: 'Convertido',
  RECUSADO: 'Recusou',
  SUSPENSO: 'Suspensa',
};

/** Etapas da régua automática, na ordem em que o lead as recebe. */
const RECUP_ETAPA_LABELS: Record<string, string> = {
  trial_d0: 'Último dia do teste',
  pos_trial_d1: 'D+1 após o teste',
  pos_trial_d3: 'D+3 — aviso de encerramento',
  encerramento: 'Encerramento',
  aguardando_humano: 'Pediu atendimento',
};

const SEGMENTO_LABELS: Record<string, string> = {
  trial: 'Trial não convertido',
  pendente: 'Pagamento pendente',
  cancelado_recente: 'Cancelado recente',
  cancelado_antigo: 'Cancelado antigo',
  sem_assinatura: 'Nunca assinou',
};

/** Segmentos que têm template de winback aprovado — trial é da régua automática. */
const SEGMENTOS_WINBACK: SegmentoLead[] = [
  'cancelado_recente',
  'sem_assinatura',
  'pendente',
  'cancelado_antigo',
];

const SdrPanel = () => {
  const [stats, setStats] = useState<SdrDashboardStats | null>(null);
  const [leads, setLeads] = useState<SdrLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [sdrStatusFilter, setSdrStatusFilter] = useState('all');
  const [recuperacaoFilter, setRecuperacaoFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Campanha de winback (trilha manual sobre a base histórica)
  const [winbackOpen, setWinbackOpen] = useState(false);
  const [winbackSegment, setWinbackSegment] = useState<SegmentoLead>('cancelado_recente');
  const [winbackCandidates, setWinbackCandidates] = useState<WinbackCandidato[]>([]);
  const [winbackSelected, setWinbackSelected] = useState<Set<string>>(new Set());
  const [winbackLoading, setWinbackLoading] = useState(false);
  const [winbackSending, setWinbackSending] = useState(false);

  // Modals
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [approachModalOpen, setApproachModalOpen] = useState(false);
  const [approachSegment, setApproachSegment] = useState<SdrSegmentKey>('trial');
  const [selectedLead, setSelectedLead] = useState<SdrLead | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<SdrTrackingEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Contact form
  const [contactForm, setContactForm] = useState({
    tipo_contato: 'whatsapp',
    resultado: '',
    notas: '',
    proximo_contato: '',
    status: 'CONTATADO',
  });

  const fetchStats = useCallback(async () => {
    try {
      const data = await sdrService.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Erro stats SDR:', e);
    }
  }, []);

  const fetchLeads = useCallback(async (p = page) => {
    try {
      setLoadingLeads(true);
      const res = await sdrService.getLeads({
        page: p,
        limit: 20,
        search: search || undefined,
        subscriptionStatus: subscriptionFilter !== 'all' ? subscriptionFilter : undefined,
        sdrStatus: sdrStatusFilter !== 'all' ? sdrStatusFilter : undefined,
        recuperacaoStatus: recuperacaoFilter !== 'all' ? recuperacaoFilter : undefined,
        sortOrder,
      });
      setLeads(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch (e) {
      console.error('Erro leads SDR:', e);
    } finally {
      setLoadingLeads(false);
    }
  }, [page, search, subscriptionFilter, sdrStatusFilter, recuperacaoFilter, sortOrder]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchLeads(1)]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading) fetchLeads(page);
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchLeads(1);
  };

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => { setPage(1); fetchLeads(1); }, 400);
      return () => clearTimeout(t);
    }
  }, [subscriptionFilter, sdrStatusFilter, recuperacaoFilter]);

  useEffect(() => {
    if (!loading) { setPage(1); fetchLeads(1); }
  }, [sortOrder]);

  const openContactModal = (lead: SdrLead) => {
    setSelectedLead(lead);
    setContactForm({ tipo_contato: 'whatsapp', resultado: '', notas: '', proximo_contato: '', status: 'CONTATADO' });
    setContactModalOpen(true);
  };

  const openHistoryModal = async (lead: SdrLead) => {
    setSelectedLead(lead);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const data = await sdrService.getTrackingHistory(lead.id);
      setTrackingHistory(data);
    } catch (e) {
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmitContact = async () => {
    if (!selectedLead || !contactForm.resultado) {
      toast.error('Preencha o resultado do contato');
      return;
    }
    try {
      await sdrService.createTracking(selectedLead.id, contactForm);
      toast.success('Contato registrado!');
      setContactModalOpen(false);
      fetchLeads(page);
      fetchStats();
    } catch (e) {
      toast.error('Erro ao registrar contato');
    }
  };

  // ---- Régua de recuperação ----

  const handleEstenderAcesso = async (lead: SdrLead) => {
    if (!confirm(`Liberar mais 7 dias de acesso para ${lead.nome_negocio}?`)) return;
    try {
      const res = await sdrService.estenderAcesso(lead.id);
      if (res?.ok === false) {
        const motivos: Record<string, string> = {
          assinatura_ativa: 'Essa empresa já tem assinatura ativa.',
          ja_estendido: 'Essa empresa já recebeu o período extra uma vez.',
          nao_encontrada: 'Empresa não encontrada.',
        };
        toast.error(motivos[res.motivo] || 'Não foi possível estender o acesso');
        return;
      }
      toast.success('Acesso estendido em 7 dias');
      fetchLeads(page);
      fetchStats();
    } catch {
      toast.error('Erro ao estender o acesso');
    }
  };

  const handleSuspender = async (lead: SdrLead) => {
    if (!confirm(`Suspender a conta de ${lead.nome_negocio}?\n\nO login será bloqueado, mas TODOS os dados são preservados e a conta pode ser reativada depois.`)) return;
    try {
      await sdrService.suspenderEmpresa(lead.id, 'Suspensa manualmente pelo painel SDR');
      toast.success('Conta suspensa — dados preservados');
      fetchLeads(page);
      fetchStats();
    } catch {
      toast.error('Erro ao suspender a conta');
    }
  };

  const handleReativar = async (lead: SdrLead) => {
    try {
      await sdrService.reativarEmpresa(lead.id);
      toast.success('Conta reativada');
      fetchLeads(page);
      fetchStats();
    } catch {
      toast.error('Erro ao reativar a conta');
    }
  };

  const loadWinbackCandidates = async (segmento: SegmentoLead) => {
    setWinbackLoading(true);
    setWinbackSelected(new Set());
    try {
      const data = await sdrService.getWinbackCandidatos(segmento, 200);
      setWinbackCandidates(data);
    } catch {
      toast.error('Erro ao carregar a prévia da campanha');
      setWinbackCandidates([]);
    } finally {
      setWinbackLoading(false);
    }
  };

  const openWinbackModal = () => {
    setWinbackOpen(true);
    loadWinbackCandidates(winbackSegment);
  };

  const handleWinbackSegmentChange = (segmento: SegmentoLead) => {
    setWinbackSegment(segmento);
    loadWinbackCandidates(segmento);
  };

  const toggleWinbackSelection = (empresaId: string) => {
    setWinbackSelected((prev) => {
      const next = new Set(prev);
      next.has(empresaId) ? next.delete(empresaId) : next.add(empresaId);
      return next;
    });
  };

  const toggleWinbackSelectAll = () => {
    setWinbackSelected((prev) =>
      prev.size === winbackCandidates.length
        ? new Set()
        : new Set(winbackCandidates.map((c) => c.empresaId)),
    );
  };

  const handleDispararWinback = async () => {
    if (winbackSelected.size === 0) {
      toast.error('Selecione ao menos uma empresa');
      return;
    }
    if (!confirm(`Disparar a campanha para ${winbackSelected.size} empresa(s)?\n\nO envio respeita a janela de 08h às 20h e o ritmo do disparador.`)) return;

    setWinbackSending(true);
    try {
      const res = await sdrService.dispararWinback(winbackSegment, Array.from(winbackSelected));
      toast.success(`Campanha enfileirada para ${res.total} empresa(s)`);
      setWinbackOpen(false);
      fetchLeads(page);
      fetchStats();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao disparar a campanha');
    } finally {
      setWinbackSending(false);
    }
  };

  const openWhatsApp = (lead: SdrLead) => {
    const phone = (lead.telefone || lead.admin?.telefone || '').replace(/\D/g, '');
    if (phone) window.open(`https://wa.me/${phone}`, '_blank');
    else toast.error('Telefone não disponível');
  };

  // Nome do contato: admin mais antigo (vem ordenado do backend), com fallback.
  const leadContactName = (lead: SdrLead | null) =>
    (lead?.admin?.nome || lead?.nome_negocio || '').split(' ')[0] || '';

  // {data} sugerida para ofertas com prazo: +7 dias.
  const suggestedDeadline = () =>
    new Date(Date.now() + 7 * 86400000).toLocaleDateString('pt-BR');

  const templateVars = (lead: SdrLead | null) => ({
    nome: leadContactName(lead),
    plano: lead?.assinatura?.plano || null,
    data: suggestedDeadline(),
  });

  const openApproachModal = (lead: SdrLead) => {
    setSelectedLead(lead);
    const seg = detectSegment({
      assinaturaStatus: lead.assinatura?.status,
      temAssinatura: !!lead.assinatura,
      diasDesdeFim: daysSince(lead.assinatura?.data_fim ?? null),
    });
    setApproachSegment(seg);
    setApproachModalOpen(true);
  };

  const copyMessage = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success('Mensagem copiada!');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const sendWhatsAppMessage = (lead: SdrLead | null, texto: string) => {
    const phone = (lead?.telefone || lead?.admin?.telefone || '').replace(/\D/g, '');
    if (!phone) {
      toast.error('Telefone não disponível');
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
  const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleString('pt-BR') : '-';
  const daysSince = (d: string | null) => {
    if (!d) return null;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  };

  /**
   * Situação do lead na régua. O contador de dias até a suspensão é o dado que
   * define a ordem de prioridade do SDR — por isso vem em destaque e fica
   * vermelho quando faltam 2 dias ou menos.
   */
  const renderRecuperacao = (lead: SdrLead) => {
    const r = lead.recuperacao;
    if (!r) return <span className="text-[10px] text-gray-300">—</span>;

    const dias = r.dias_ate_suspensao;
    const urgente = dias !== null && dias <= 2;

    return (
      <div className="space-y-0.5">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${RECUP_STATUS_COLORS[r.status] || 'bg-gray-100'}`}>
          {RECUP_STATUS_LABELS[r.status] || r.status}
        </span>
        {r.etapa_atual && (
          <div className="text-[10px] text-gray-500">
            {RECUP_ETAPA_LABELS[r.etapa_atual] || r.etapa_atual}
          </div>
        )}
        {r.status === 'ATIVO' && dias !== null && (
          <div className={`text-[10px] font-semibold ${urgente ? 'text-red-600' : 'text-gray-400'}`}>
            {dias <= 0 ? 'Encerra hoje' : `Encerra em ${dias}d`}
          </div>
        )}
        {r.cupom && (
          <div className={`text-[10px] ${r.cupom.resgatado_em ? 'text-green-600 font-semibold' : 'text-blue-600'}`}>
            <Ticket className="w-2.5 h-2.5 inline mr-0.5" />
            {r.cupom.codigo} {r.cupom.resgatado_em ? '(usado)' : ''}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel de Recuperação SDR</h1>
          <p className="text-sm text-gray-500">Gerencie leads e recupere assinaturas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openWinbackModal} variant="default" className="text-sm">
            <Send className="w-4 h-4 mr-2" /> Campanha de Winback
          </Button>
          <Button onClick={() => { fetchStats(); fetchLeads(page); }} variant="outline" className="text-sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Trials Ativos', value: stats.trialsAtivos, color: 'border-amber-500', icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-500' },
            { label: 'Expirados', value: stats.expirados, color: 'border-red-500', icon: XCircle, bg: 'bg-red-50', iconColor: 'text-red-500' },
            { label: 'Cancelados', value: stats.cancelados, color: 'border-gray-500', icon: AlertCircle, bg: 'bg-gray-50', iconColor: 'text-gray-500' },
            { label: 'Pendentes', value: stats.pendentes, color: 'border-blue-500', icon: CreditCard, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
            { label: 'Recuperados (mês)', value: stats.recuperadosEsteMes, color: 'border-green-500', icon: TrendingUp, bg: 'bg-green-50', iconColor: 'text-green-500' },
            { label: 'Contatos Hoje', value: stats.contatosHoje, color: 'border-purple-500', icon: Phone, bg: 'bg-purple-50', iconColor: 'text-purple-500' },
          ].map((card) => (
            <Card key={card.label} className={`bg-white dark:bg-gray-800 shadow-sm border-0 border-l-4 ${card.color}`}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{card.value}</h3>
                  </div>
                  <div className={`p-1.5 ${card.bg} rounded-lg`}>
                    <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Funil da régua automática — métricas da automação, não do SDR */}
      {stats?.recuperacao && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Régua de Recuperação</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Na régua', value: stats.recuperacao.emRecuperacao, color: 'text-orange-600' },
              { label: 'Reativações (mês)', value: stats.recuperacao.reativacoes, color: 'text-green-600' },
              { label: 'Cupons gerados', value: stats.recuperacao.cuponsGerados, color: 'text-blue-600' },
              { label: 'Cupons resgatados', value: stats.recuperacao.cuponsResgatados, color: 'text-purple-600' },
              { label: 'Suspensas (mês)', value: stats.recuperacao.suspensosNoMes, color: 'text-red-600' },
            ].map((m) => (
              <div key={m.label} className="text-center sm:text-left">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{m.label}</p>
                <h3 className={`text-lg font-bold ${m.color}`}>{m.value}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Busca</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Nome, email ou telefone..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
        <div className="w-full sm:w-44">
          <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Assinatura</label>
          <select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value)}
            className="h-9 w-full px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todos</option>
            <option value="TRIAL">Trial</option>
            <option value="EXPIRED">Expirado</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="PENDING">Pendente</option>
            <option value="ACTIVE">Ativo</option>
            <option value="SEM_ASSINATURA">Sem Assinatura</option>
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Pipeline SDR</label>
          <select
            value={sdrStatusFilter}
            onChange={(e) => setSdrStatusFilter(e.target.value)}
            className="h-9 w-full px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todos</option>
            <option value="NOVO">Novo</option>
            <option value="CONTATADO">Contatado</option>
            <option value="EM_NEGOCIACAO">Em Negociação</option>
            <option value="RECUPERADO">Recuperado</option>
            <option value="PERDIDO">Perdido</option>
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Recuperação</label>
          <select
            value={recuperacaoFilter}
            onChange={(e) => setRecuperacaoFilter(e.target.value)}
            className="h-9 w-full px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todos</option>
            <option value="ATIVO">Na régua</option>
            <option value="CONVERTIDO">Convertido</option>
            <option value="RECUSADO">Recusou</option>
            <option value="SUSPENSO">Suspensa</option>
            <option value="NENHUM">Fora da régua</option>
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Ordenar por Registro</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="h-9 w-full px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="desc">Mais recentes primeiro</option>
            <option value="asc">Mais antigos primeiro</option>
          </select>
        </div>
        <Button onClick={handleSearch} className="h-9 px-4" variant="outline">
          <Filter className="w-4 h-4 mr-1" /> Filtrar
        </Button>
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500 px-1">
        {total} empresa(s) encontrada(s)
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loadingLeads ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum lead encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <>
          {/* Desktop: tabela densa */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Assinatura</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3">Pipeline</th>
                  <th className="px-4 py-3">Recuperação</th>
                  <th className="px-4 py-3">Último Contato</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {leads.map((lead) => {
                  const regDays = daysSince(lead.registered_at);
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{lead.nome_negocio}</div>
                        <div className="text-[10px] text-gray-500">{lead.email || lead.admin?.email || '-'}</div>
                        <div className="text-[10px] text-gray-400">{lead.telefone || lead.admin?.telefone || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-[10px] font-medium uppercase">
                          {lead.assinatura?.plano || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {lead.assinatura ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[lead.assinatura.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[lead.assinatura.status] || lead.assinatura.status}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase">
                            Sem Assinatura
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <div>{formatDate(lead.registered_at)}</div>
                        {regDays !== null && (
                          <div className="text-[10px] text-gray-400">
                            {regDays === 0 ? 'Hoje' : regDays === 1 ? 'Ontem' : `Há ${regDays}d`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${SDR_STATUS_COLORS[lead.sdr.status] || 'bg-gray-100'}`}>
                          {SDR_STATUS_LABELS[lead.sdr.status] || lead.sdr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{renderRecuperacao(lead)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {lead.sdr.ultimo_contato ? (
                          <>
                            <div>{formatDate(lead.sdr.ultimo_contato)}</div>
                            <div className="text-[10px] text-gray-400">{lead.sdr.resultado || '-'}</div>
                          </>
                        ) : (
                          <span className="text-gray-400">Nunca</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => openWhatsApp(lead)} title="WhatsApp">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-purple-600" onClick={() => openApproachModal(lead)} title="Modelos de Abordagem">
                            <MessageSquareText className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600" onClick={() => openContactModal(lead)} title="Registrar Contato">
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-600" onClick={() => openHistoryModal(lead)} title="Histórico">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {lead.status === 'suspended' ? (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-700" onClick={() => handleReativar(lead)} title="Reativar conta">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-600" onClick={() => handleEstenderAcesso(lead)} title="Liberar +7 dias de acesso">
                                <CalendarPlus className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleSuspender(lead)} title="Suspender conta (dados preservados)">
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards com ações visíveis (sem scroll horizontal) */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {leads.map((lead) => {
              const regDays = daysSince(lead.registered_at);
              const email = lead.email || lead.admin?.email || '-';
              const telefone = lead.telefone || lead.admin?.telefone || '-';
              return (
                <div key={lead.id} className="p-4">
                  {/* Cabeçalho: nome + badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{lead.nome_negocio}</div>
                      {lead.admin?.nome && (
                        <div className="text-[11px] text-gray-500 truncate">{lead.admin.nome}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {lead.assinatura ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[lead.assinatura.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[lead.assinatura.status] || lead.assinatura.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase">Sem Assinatura</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${SDR_STATUS_COLORS[lead.sdr.status] || 'bg-gray-100'}`}>
                        {SDR_STATUS_LABELS[lead.sdr.status] || lead.sdr.status}
                      </span>
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="text-[11px] text-gray-500 space-y-0.5 mb-2">
                    <div className="flex items-center gap-1"><Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{email}</span></div>
                    <div className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" /> {telefone}</div>
                  </div>

                  {/* Meta: plano / registro / último contato */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400 mb-3">
                    <span>Plano: <strong className="text-gray-600 dark:text-gray-300">{lead.assinatura?.plano || 'N/A'}</strong></span>
                    <span>
                      Registro: {formatDate(lead.registered_at)}
                      {regDays !== null && ` (${regDays === 0 ? 'hoje' : regDays === 1 ? 'ontem' : `há ${regDays}d`})`}
                    </span>
                    <span>Último contato: {lead.sdr.ultimo_contato ? formatDate(lead.sdr.ultimo_contato) : 'nunca'}</span>
                  </div>

                  {/* Situação na régua de recuperação */}
                  {lead.recuperacao && <div className="mb-3">{renderRecuperacao(lead)}</div>}

                  {/* Ações: alvos de toque grandes */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-green-600" onClick={() => openWhatsApp(lead)}>
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-[9px]">WhatsApp</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-purple-600" onClick={() => openApproachModal(lead)}>
                      <MessageSquareText className="w-4 h-4" />
                      <span className="text-[9px]">Abordagem</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-blue-600" onClick={() => openContactModal(lead)}>
                      <Plus className="w-4 h-4" />
                      <span className="text-[9px]">Contato</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-gray-600" onClick={() => openHistoryModal(lead)}>
                      <Eye className="w-4 h-4" />
                      <span className="text-[9px]">Histórico</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {lead.status === 'suspended' ? (
                      <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-green-700 col-span-2" onClick={() => handleReativar(lead)}>
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-[9px]">Reativar conta</span>
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-amber-600" onClick={() => handleEstenderAcesso(lead)}>
                          <CalendarPlus className="w-4 h-4" />
                          <span className="text-[9px]">+7 dias</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-red-600" onClick={() => handleSuspender(lead)}>
                          <Ban className="w-4 h-4" />
                          <span className="text-[9px]">Suspender</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <Modal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} title={`Registrar Contato — ${selectedLead?.nome_negocio || ''}`} size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Tipo de Contato</label>
            <select value={contactForm.tipo_contato} onChange={(e) => setContactForm(f => ({ ...f, tipo_contato: e.target.value }))} className="h-9 w-full px-3 rounded-lg border border-gray-300 text-sm bg-white">
              <option value="whatsapp">WhatsApp</option>
              <option value="telefone">Telefone</option>
              <option value="email">E-mail</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Resultado *</label>
            <select value={contactForm.resultado} onChange={(e) => setContactForm(f => ({ ...f, resultado: e.target.value }))} className="h-9 w-full px-3 rounded-lg border border-gray-300 text-sm bg-white">
              <option value="">Selecione...</option>
              <option value="sem_resposta">Sem Resposta</option>
              <option value="respondeu">Respondeu</option>
              <option value="agendou_callback">Agendou Callback</option>
              <option value="rejeitou">Rejeitou</option>
              <option value="converteu">Converteu</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Status Pipeline</label>
            <select value={contactForm.status} onChange={(e) => setContactForm(f => ({ ...f, status: e.target.value }))} className="h-9 w-full px-3 rounded-lg border border-gray-300 text-sm bg-white">
              <option value="CONTATADO">Contatado</option>
              <option value="EM_NEGOCIACAO">Em Negociação</option>
              <option value="RECUPERADO">Recuperado</option>
              <option value="PERDIDO">Perdido</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Notas</label>
            <textarea value={contactForm.notas} onChange={(e) => setContactForm(f => ({ ...f, notas: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm min-h-[80px] resize-none" placeholder="Observações sobre o contato..." />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Próximo Contato</label>
            <Input type="datetime-local" value={contactForm.proximo_contato} onChange={(e: any) => setContactForm(f => ({ ...f, proximo_contato: e.target.value }))} className="h-9 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmitContact} className="bg-primary text-white">Registrar Contato</Button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title={`Histórico — ${selectedLead?.nome_negocio || ''}`} size="2xl">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : trackingHistory.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum registro de contato ainda.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {trackingHistory.map((entry) => (
              <div key={entry.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${SDR_STATUS_COLORS[entry.status] || 'bg-gray-100'}`}>
                      {SDR_STATUS_LABELS[entry.status] || entry.status}
                    </span>
                    {entry.tipo_contato && entry.tipo_contato !== 'status_change' && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium uppercase">
                        {entry.tipo_contato}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400">{formatDateTime(entry.createdAt)}</span>
                </div>
                {entry.resultado && (
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                    <strong>Resultado:</strong> {entry.resultado}
                  </p>
                )}
                {entry.notas && (
                  <p className="text-xs text-gray-500 italic">{entry.notas}</p>
                )}
                {entry.proximo_contato && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-600">
                    <Calendar className="w-3 h-3" />
                    Próximo contato: {formatDateTime(entry.proximo_contato)}
                  </div>
                )}
                <div className="text-[10px] text-gray-400 mt-1">por {entry.sdrNome}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Approach Templates Modal */}
      <Modal isOpen={approachModalOpen} onClose={() => setApproachModalOpen(false)} title={`Abordagem — ${selectedLead?.nome_negocio || ''}`} size="2xl">
        <div className="space-y-4">
          {/* Contato + seletor de segmento */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Modelo de Abordagem</label>
              <select
                value={approachSegment}
                onChange={(e) => setApproachSegment(e.target.value as SdrSegmentKey)}
                className="h-9 w-full px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 dark:text-white"
              >
                {Object.values(SDR_SEGMENTS).map((seg) => (
                  <option key={seg.key} value={seg.key}>{seg.titulo}</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-gray-500 sm:text-right sm:pb-2">
              Contato: <strong className="text-gray-700 dark:text-gray-200">{leadContactName(selectedLead) || '—'}</strong>
              {selectedLead?.assinatura?.plano && <> · Plano {selectedLead.assinatura.plano}</>}
            </div>
          </div>

          {/* Diagnóstico / oferta do segmento */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3 text-xs space-y-1">
            <p className="text-gray-600 dark:text-gray-300"><strong>Diagnóstico:</strong> {SDR_SEGMENTS[approachSegment].diagnostico}</p>
            <p className="text-gray-600 dark:text-gray-300"><strong>Oferta:</strong> {SDR_SEGMENTS[approachSegment].oferta}</p>
          </div>

          {/* Mensagens preenchidas */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {SDR_SEGMENTS[approachSegment].mensagens.map((msg, i) => {
              const texto = fillTemplate(msg.texto, templateVars(selectedLead));
              return (
                <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase text-purple-600">{msg.label}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500" onClick={() => copyMessage(texto)} title="Copiar">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => sendWhatsAppMessage(selectedLead, texto)} title="Enviar no WhatsApp">
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {msg.quando && (
                    <p className="text-[10px] text-gray-400 italic mb-1.5">Quando: {msg.quando}</p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{texto}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Campanha de winback — base histórica, disparo manual e segmentado */}
      <Modal
        isOpen={winbackOpen}
        onClose={() => setWinbackOpen(false)}
        title="Campanha de Winback"
        subtitle="Base histórica — disparo pela API Oficial, sem suspensão automática"
        size="3xl"
      >
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Segmento</label>
              <select
                value={winbackSegment}
                onChange={(e) => handleWinbackSegmentChange(e.target.value as SegmentoLead)}
                className="h-9 w-full px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 dark:text-white"
              >
                {SEGMENTOS_WINBACK.map((s) => (
                  <option key={s} value={s}>{SEGMENTO_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" className="h-9" onClick={toggleWinbackSelectAll} disabled={winbackCandidates.length === 0}>
              {winbackSelected.size === winbackCandidates.length && winbackCandidates.length > 0
                ? 'Limpar seleção'
                : 'Selecionar todos'}
            </Button>
          </div>

          {winbackSegment === 'cancelado_antigo' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Base fria.</strong> Esse segmento tem o maior risco de bloqueio e denúncia — o
                template só faz uma pergunta, sem oferta. Dispare em lotes pequenos e acompanhe a
                qualidade do número no Business Manager entre as levas.
              </p>
            </div>
          )}

          <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden max-h-[45vh] overflow-y-auto">
            {winbackLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : winbackCandidates.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma empresa elegível neste segmento.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {winbackCandidates.map((c) => {
                  const selecionado = winbackSelected.has(c.empresaId);
                  return (
                    <button
                      key={c.empresaId}
                      type="button"
                      onClick={() => toggleWinbackSelection(c.empresaId)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      {selecionado
                        ? <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                        : <Square className="w-4 h-4 text-gray-300 shrink-0" />}
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
              {winbackSelected.size} de {winbackCandidates.length} selecionada(s)
            </span>
            <Button
              onClick={handleDispararWinback}
              isLoading={winbackSending}
              disabled={winbackSelected.size === 0 || winbackSending}
            >
              <Send className="w-4 h-4 mr-2" /> Disparar campanha
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SdrPanel;
