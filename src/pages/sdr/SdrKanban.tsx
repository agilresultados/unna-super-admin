import React, { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { Building2, GripVertical } from 'lucide-react';
import Button from '@/components/ui/Button';
import { sdrService, SdrLead } from '@/services/sdr.service';
import {
  AlcanceIcon,
  LeadActions,
  LeadActionsProps,
  PIPELINE_COLUMNS,
  PipelineStatus,
  SDR_STATUS_COLORS,
  SDR_STATUS_LABELS,
  SegmentoBadge,
  formatDate,
} from './sdrUi';

interface ColumnState {
  leads: SdrLead[];
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
}

const emptyColumn = (): ColumnState => ({
  leads: [],
  page: 1,
  totalPages: 1,
  total: 0,
  loading: false,
});

function colId(status: PipelineStatus) {
  return `col:${status}`;
}

interface SdrKanbanProps {
  segmento?: string;
  dataInicio?: string;
  dataFim?: string;
  alcance?: string;
  search?: string;
  pipelineCounts?: Record<string, number>;
  refreshEpoch: number;
  actions: Omit<LeadActionsProps, 'lead' | 'variant'>;
  onMoved: () => void;
}

function KanbanCard({
  lead,
  actions,
  overlay,
}: {
  lead: SdrLead;
  actions: Omit<LeadActionsProps, 'lead' | 'variant'>;
  overlay?: boolean;
}) {
  const phone = lead.telefone || lead.admin?.telefone || '—';
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 shadow-sm ${overlay ? 'rotate-1 shadow-lg' : ''}`}>
      <div className="flex items-start gap-1.5 mb-1.5">
        {!overlay && <GripVertical className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-gray-900 dark:text-white leading-tight truncate">{lead.nome_negocio}</div>
          <div className="text-[10px] text-gray-400 truncate">{phone}</div>
        </div>
        <span title={lead.alcance?.status || 'sem envio'}>
          <AlcanceIcon status={lead.alcance?.status} />
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        <SegmentoBadge segmento={lead.segmento} />
      </div>
      <div className="text-[10px] text-gray-400 mb-2">
        Último contato: {lead.sdr.ultimo_contato ? formatDate(lead.sdr.ultimo_contato) : 'nunca'}
      </div>
      <LeadActions lead={lead} variant="compact" {...actions} />
    </div>
  );
}

function DraggableCard({
  lead,
  column,
  actions,
}: {
  lead: SdrLead;
  column: PipelineStatus;
  actions: Omit<LeadActionsProps, 'lead' | 'variant'>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { column, lead },
  });
  const { setNodeRef: setDropRef } = useDroppable({
    id: `card:${lead.id}`,
    data: { column, lead },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <KanbanCard lead={lead} actions={actions} />
    </div>
  );
}

function DroppableColumn({
  status,
  state,
  count,
  actions,
  onLoadMore,
}: {
  status: PipelineStatus;
  state: ColumnState;
  count: number;
  actions: Omit<LeadActionsProps, 'lead' | 'variant'>;
  onLoadMore: (status: PipelineStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: colId(status),
    data: { column: status },
  });

  return (
    <div className="w-72 shrink-0 flex flex-col bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700 min-h-[280px] max-h-[70vh]">
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${SDR_STATUS_COLORS[status] || 'bg-gray-100'}`}>
        <span className="text-[10px] font-bold uppercase tracking-wider">{SDR_STATUS_LABELS[status]}</span>
        <span className="text-[10px] font-bold">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px] ${isOver ? 'bg-primary/5' : ''}`}
      >
        {state.loading && state.leads.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
          </div>
        ) : state.leads.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-1" />
            <p className="text-[10px] text-gray-400">Nenhum lead</p>
          </div>
        ) : (
          state.leads.map((lead) => (
            <DraggableCard key={lead.id} lead={lead} column={status} actions={actions} />
          ))
        )}
        {state.page < state.totalPages && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-[10px]"
            disabled={state.loading}
            onClick={() => onLoadMore(status)}
          >
            {state.loading ? 'Carregando…' : 'Carregar mais'}
          </Button>
        )}
      </div>
    </div>
  );
}

const SdrKanban: React.FC<SdrKanbanProps> = ({
  segmento,
  dataInicio,
  dataFim,
  alcance,
  search,
  pipelineCounts,
  refreshEpoch,
  actions,
  onMoved,
}) => {
  const [columns, setColumns] = useState<Record<PipelineStatus, ColumnState>>(() => {
    const init = {} as Record<PipelineStatus, ColumnState>;
    for (const col of PIPELINE_COLUMNS) init[col] = emptyColumn();
    return init;
  });
  const [activeLead, setActiveLead] = useState<SdrLead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const fetchColumn = useCallback(async (status: PipelineStatus, page: number, append: boolean) => {
    setColumns((prev) => ({
      ...prev,
      [status]: { ...prev[status], loading: true },
    }));
    try {
      const res = await sdrService.getLeads({
        page,
        limit: 15,
        search: search || undefined,
        sdrStatus: status,
        segmento,
        dataInicio,
        dataFim,
        alcance,
      });
      setColumns((prev) => ({
        ...prev,
        [status]: {
          leads: append ? [...prev[status].leads, ...res.data.filter((l) => !prev[status].leads.some((x) => x.id === l.id))] : res.data,
          page,
          totalPages: res.pagination.totalPages,
          total: res.pagination.total,
          loading: false,
        },
      }));
    } catch {
      setColumns((prev) => ({ ...prev, [status]: { ...prev[status], loading: false } }));
    }
  }, [alcance, dataFim, dataInicio, search, segmento]);

  useEffect(() => {
    for (const col of PIPELINE_COLUMNS) {
      void fetchColumn(col, 1, false);
    }
  }, [fetchColumn, refreshEpoch]);

  const handleLoadMore = (status: PipelineStatus) => {
    const next = columns[status].page + 1;
    void fetchColumn(status, next, true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const lead = event.active.data.current?.lead as SdrLead | undefined;
    setActiveLead(lead ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const from = active.data.current?.column as PipelineStatus | undefined;
    const overColumn = (over.data.current?.column as PipelineStatus | undefined)
      || (String(over.id).startsWith('col:') ? String(over.id).slice(4) as PipelineStatus : undefined);
    if (!from || !overColumn || from === overColumn) return;

    const leadId = String(active.id);
    const lead = columns[from].leads.find((l) => l.id === leadId);
    if (!lead) return;

    setColumns((prev) => ({
      ...prev,
      [from]: { ...prev[from], leads: prev[from].leads.filter((l) => l.id !== leadId), total: Math.max(0, prev[from].total - 1) },
      [overColumn]: { ...prev[overColumn], leads: [{ ...lead, sdr: { ...lead.sdr, status: overColumn } }, ...prev[overColumn].leads], total: prev[overColumn].total + 1 },
    }));

    try {
      await sdrService.updateLeadStatus(leadId, { status: overColumn });
      await Promise.all([fetchColumn(from, 1, false), fetchColumn(overColumn, 1, false)]);
      onMoved();
    } catch {
      toast.error('Não foi possível mover o lead');
      await Promise.all([fetchColumn(from, 1, false), fetchColumn(overColumn, 1, false)]);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={(e) => { void handleDragEnd(e); }}
      onDragCancel={() => setActiveLead(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {PIPELINE_COLUMNS.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            state={columns[status]}
            count={pipelineCounts?.[status] ?? columns[status].total}
            actions={actions}
            onLoadMore={handleLoadMore}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <KanbanCard lead={activeLead} actions={actions} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SdrKanban;
