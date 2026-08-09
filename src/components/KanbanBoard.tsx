import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Feature } from '@/services/feature.service';
import FeatureColumn from '@/components/FeatureColumn';
import DraggableFeatureCard from '@/components/DraggableFeatureCard';

interface KanbanBoardProps {
  features: Feature[];
  onVote: (featureId: string) => void;
  onMove: (featureId: string, newStatus: Feature['status']) => void;
  canVote?: boolean;
  canMove?: boolean;
  canCreate?: boolean;
  onCreateFeature?: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  features,
  onVote,
  onMove,
  canVote = false,
  canMove = false,
  canCreate = false,
  onCreateFeature
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const featureId = active.id as string;
    const newStatus = over.id as Feature['status'];

    // Verificar se o status realmente mudou
    const feature = features.find(f => f.id === featureId);
    if (feature && feature.status !== newStatus) {
      onMove(featureId, newStatus);
    }
  };

  const getStatusFromId = (id: string): Feature['status'] => {
    switch (id) {
      case 'pending':
        return 'pending';
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      default:
        return 'pending';
    }
  };

  const getColumnTitle = (status: Feature['status']): string => {
    switch (status) {
      case 'pending':
        return 'Backlog';
      case 'in_progress':
        return 'Em Progresso';
      case 'completed':
        return 'Concluído';
      default:
        return 'Backlog';
    }
  };

  // Componente de coluna droppable
  const DroppableColumn: React.FC<{ status: Feature['status'] }> = ({ status }) => {
    const { setNodeRef } = useDroppable({
      id: status,
    });

    const statusFeatures = features.filter(feature => feature.status === status);

    return (
      <div ref={setNodeRef} className="flex-1 min-w-0">
        <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
          status === 'pending' ? 'bg-green-100 text-green-800' :
          status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          <div className="flex items-center gap-2">
            {status === 'pending' && <span className="text-lg">🏃</span>}
            {status === 'in_progress' && <span className="text-lg">👨‍🍳</span>}
            {status === 'completed' && <span className="text-lg">⭐</span>}
            <h2 className="font-semibold text-sm">{getColumnTitle(status)}</h2>
          </div>
          <span className="ml-auto text-xs font-medium">
            {statusFeatures.length}
          </span>
        </div>
        
        <SortableContext
          items={statusFeatures.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[200px]">
            {statusFeatures.map((feature) => (
              <DraggableFeatureCard
                key={feature.id}
                feature={feature}
                onVote={onVote}
                canVote={canVote}
                canMove={canMove}
              />
            ))}
            
            {canCreate && (
              <button
                onClick={onCreateFeature}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">➕</span>
                <span className="text-sm">Adicionar Feature</span>
              </button>
            )}
          </div>
        </SortableContext>
      </div>
    );
  };

  const activeFeature = activeId ? features.find(f => f.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['pending', 'in_progress', 'completed'] as const).map((status) => (
          <DroppableColumn key={status} status={status} />
        ))}
      </div>

      <DragOverlay>
        {activeFeature ? (
          <div className="opacity-50">
            <DraggableFeatureCard
              feature={activeFeature}
              onVote={() => {}}
              canVote={false}
              canMove={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
