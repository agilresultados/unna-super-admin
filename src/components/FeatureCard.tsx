import React from 'react';
import { ThumbsUp, Clock, ChefHat, Star } from 'lucide-react';
import { Feature } from '@/services/feature.service';

interface FeatureCardProps {
  feature: Feature;
  onVote: (featureId: string) => void;
  canVote?: boolean;
  canMove?: boolean;
  onMove?: (featureId: string, newStatus: Feature['status']) => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  onVote,
  canVote = false,
  canMove = false,
  onMove
}) => {
  const getStatusIcon = (status: Feature['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <ChefHat className="w-4 h-4" />;
      case 'completed':
        return <Star className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Feature['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor(feature.status)} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
        <div className="flex items-center gap-1 text-gray-500">
          {getStatusIcon(feature.status)}
        </div>
      </div>
      
      <p className="text-gray-600 text-xs mb-3 leading-relaxed">
        {feature.description}
      </p>
      
      <div className="flex items-center justify-between">
        <button
          onClick={() => onVote(feature.id)}
          disabled={!canVote || feature.hasUserVoted}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            feature.hasUserVoted
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : canVote
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ThumbsUp className="w-3 h-3" />
          <span>{feature.votes}</span>
        </button>
        
        {canMove && (
          <div className="flex gap-1">
            {feature.status !== 'pending' && (
              <button
                onClick={() => onMove?.(feature.id, 'pending')}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Pendente
              </button>
            )}
            {feature.status !== 'in_progress' && (
              <button
                onClick={() => onMove?.(feature.id, 'in_progress')}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Em Progresso
              </button>
            )}
            {feature.status !== 'completed' && (
              <button
                onClick={() => onMove?.(feature.id, 'completed')}
                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
              >
                Concluído
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureCard;
