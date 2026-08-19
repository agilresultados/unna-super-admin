import React from 'react';
import Button from '@/components/ui/Button';
import {
  Ban, CalendarPlus, Check, CheckCheck, Clock, Eye, MessageCircle,
  MessageSquareText, Plus, Reply, RotateCcw, Ticket, X,
} from 'lucide-react';
import type { SdrLead, StatusAlcance } from '@/services/sdr.service';

export const STATUS_COLORS: Record<string, string> = {
  TRIAL: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-200 text-gray-700',
  PENDING: 'bg-blue-100 text-blue-700',
};

export const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Ativo',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendente',
};

export const SDR_STATUS_COLORS: Record<string, string> = {
  NOVO: 'bg-blue-100 text-blue-700',
  CONTATADO: 'bg-amber-100 text-amber-700',
  EM_NEGOCIACAO: 'bg-purple-100 text-purple-700',
  RECUPERADO: 'bg-green-100 text-green-700',
  PERDIDO: 'bg-red-100 text-red-700',
};

export const SDR_STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  CONTATADO: 'Contatado',
  EM_NEGOCIACAO: 'Em Negociação',
  RECUPERADO: 'Recuperado',
  PERDIDO: 'Perdido',
};

export const RECUP_STATUS_COLORS: Record<string, string> = {
  ATIVO: 'bg-orange-100 text-orange-700',
  CONVERTIDO: 'bg-green-100 text-green-700',
  RECUSADO: 'bg-gray-200 text-gray-700',
  SUSPENSO: 'bg-red-100 text-red-700',
};

export const RECUP_STATUS_LABELS: Record<string, string> = {
  ATIVO: 'Na régua',
  CONVERTIDO: 'Convertido',
  RECUSADO: 'Recusou',
  SUSPENSO: 'Suspensa',
};

export const RECUP_ETAPA_LABELS: Record<string, string> = {
  trial_d0: 'Último dia do teste',
  pos_trial_d1: 'D+1 após o teste',
  pos_trial_d3: 'D+3 — aviso de encerramento',
  encerramento: 'Encerramento',
  aguardando_humano: 'Pediu atendimento',
};

export const SEGMENTO_LABELS: Record<string, string> = {
  novos: 'Novos',
  trial: 'Trial',
  pendente: 'Pendente',
  cancelado_recente: 'Cancelado recente',
  cancelado_antigo: 'Cancelado antigo',
  sem_assinatura: 'Nunca assinou',
};

export const PIPELINE_COLUMNS = ['NOVO', 'CONTATADO', 'EM_NEGOCIACAO', 'RECUPERADO', 'PERDIDO'] as const;
export type PipelineStatus = (typeof PIPELINE_COLUMNS)[number];

export type FunilFiltro = 'entregues' | 'lidos' | 'responderam' | 'negociacao' | 'convertidos';

export function dateToIsoStart(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

export function dateToIsoEnd(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

export function isoFromDateInputs(dataInicio: string, dataFim: string): { dataInicio?: string; dataFim?: string } {
  return {
    dataInicio: dataInicio ? dateToIsoStart(dataInicio) : undefined,
    dataFim: dataFim ? dateToIsoEnd(dataFim) : undefined,
  };
}

export function formatDate(d: string | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '-';
}

export function formatDateTime(d: string | null | undefined): string {
  return d ? new Date(d).toLocaleString('pt-BR') : '-';
}

export function formatHora(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysSince(d: string | null | undefined): number | null {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export function alcanceTabelaLabel(status: StatusAlcance | undefined): string {
  if (status === 'respondeu') return 'respondeu';
  if (status === 'lido') return 'leu';
  if (status === 'entregue') return 'recebeu';
  if (status === 'falha') return 'falhou';
  return '—';
}

export function AlcanceIcon({ status, className = 'w-3.5 h-3.5' }: { status?: StatusAlcance; className?: string }) {
  if (status === 'falha') return <X className={`${className} text-red-500`} />;
  if (status === 'pendente' || status === 'nao_enviado') return <Clock className={`${className} text-gray-400`} />;
  if (status === 'enviado') return <Check className={`${className} text-gray-400`} />;
  if (status === 'entregue') return <CheckCheck className={`${className} text-gray-400`} />;
  if (status === 'lido') return <CheckCheck className={`${className} text-blue-500`} />;
  if (status === 'respondeu') return <Reply className={`${className} text-purple-600`} />;
  return <span className="text-gray-300">—</span>;
}

export function SegmentoBadge({ segmento }: { segmento?: string }) {
  if (!segmento) return <span className="text-[10px] text-gray-300">—</span>;
  return (
    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-[10px] font-bold uppercase text-gray-600 dark:text-gray-200">
      {SEGMENTO_LABELS[segmento] || segmento}
    </span>
  );
}

export function renderRecuperacao(lead: SdrLead) {
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
}

export interface LeadActionsProps {
  lead: SdrLead;
  variant?: 'icons' | 'grid' | 'compact';
  onWhatsApp: (lead: SdrLead) => void;
  onApproach: (lead: SdrLead) => void;
  onContact: (lead: SdrLead) => void;
  onHistory: (lead: SdrLead) => void;
  onEstender: (lead: SdrLead) => void;
  onSuspender: (lead: SdrLead) => void;
  onReativar: (lead: SdrLead) => void;
}

export function LeadActions({
  lead,
  variant = 'icons',
  onWhatsApp,
  onApproach,
  onContact,
  onHistory,
  onEstender,
  onSuspender,
  onReativar,
}: LeadActionsProps) {
  if (variant === 'grid') {
    return (
      <div onPointerDown={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-green-600" onClick={() => onWhatsApp(lead)}>
            <MessageCircle className="w-4 h-4" />
            <span className="text-[9px]">WhatsApp</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-purple-600" onClick={() => onApproach(lead)}>
            <MessageSquareText className="w-4 h-4" />
            <span className="text-[9px]">Abordagem</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-blue-600" onClick={() => onContact(lead)}>
            <Plus className="w-4 h-4" />
            <span className="text-[9px]">Contato</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-gray-600" onClick={() => onHistory(lead)}>
            <Eye className="w-4 h-4" />
            <span className="text-[9px]">Histórico</span>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {lead.status === 'suspended' ? (
            <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-green-700 col-span-2" onClick={() => onReativar(lead)}>
              <RotateCcw className="w-4 h-4" />
              <span className="text-[9px]">Reativar conta</span>
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-amber-600" onClick={() => onEstender(lead)}>
                <CalendarPlus className="w-4 h-4" />
                <span className="text-[9px]">+7 dias</span>
              </Button>
              <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5 text-red-600" onClick={() => onSuspender(lead)}>
                <Ban className="w-4 h-4" />
                <span className="text-[9px]">Suspender</span>
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const btn = variant === 'compact' ? 'h-6 w-6 p-0' : 'h-7 w-7 p-0';

  return (
    <div className="flex items-center justify-end gap-0.5 flex-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="sm" className={`${btn} text-green-600`} onClick={() => onWhatsApp(lead)} title="WhatsApp">
        <MessageCircle className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className={`${btn} text-purple-600`} onClick={() => onApproach(lead)} title="Modelos de Abordagem">
        <MessageSquareText className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className={`${btn} text-blue-600`} onClick={() => onContact(lead)} title="Registrar Contato">
        <Plus className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className={`${btn} text-gray-600`} onClick={() => onHistory(lead)} title="Histórico">
        <Eye className="w-3.5 h-3.5" />
      </Button>
      {lead.status === 'suspended' ? (
        <Button variant="ghost" size="sm" className={`${btn} text-green-700`} onClick={() => onReativar(lead)} title="Reativar conta">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      ) : (
        <>
          <Button variant="ghost" size="sm" className={`${btn} text-amber-600`} onClick={() => onEstender(lead)} title="Liberar +7 dias de acesso">
            <CalendarPlus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className={`${btn} text-red-600`} onClick={() => onSuspender(lead)} title="Suspender conta (dados preservados)">
            <Ban className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}
