import React from 'react';
import { Clock, ChefHat, Star, Plus } from 'lucide-react';
import { Feature } from '@/services/feature.service';
import FeatureCard from '@/components/FeatureCard';

interface FeatureColumnProps {
  title: string;
  status: Feature['status'];
  features: Feature[];
  onVote: (featureId: string) => void;
  onMove: (featureId: string, newStatus: Feature['status']) => void;
  canVote?: boolean;
  canMove?: boolean;
  canCreate?: boolean;
  onCreateFeature?: () => void;
}

const FeatureColumn: React.FC<FeatureColumnProps> = ({
  title,
  status,
  features,
  onVote,
  onMove,
  canVote = false,
  canMove = false,
  canCreate = false,
  onCreateFeature
}) => {
  const getStatusIcon = (status: Feature['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'in_progress':
        return <ChefHat className="w-5 h-5" />;
      case 'completed':
        return <Star className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: Feature['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFeatures = features.filter(feature => feature.status === status);

  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        <h2 className="font-semibold text-sm">{title}</h2>
        <span className="ml-auto text-xs font-medium">
          {filteredFeatures.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {filteredFeatures.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            onVote={onVote}
            onMove={onMove}
            canVote={canVote}
            canMove={canMove}
          />
        ))}
        
        {canCreate && (
          <button
            onClick={onCreateFeature}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Adicionar Feature</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FeatureColumn;
