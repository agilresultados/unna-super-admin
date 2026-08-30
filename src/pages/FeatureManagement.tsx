import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, BarChart3 } from 'lucide-react';
import KanbanBoard from '@/components/KanbanBoard';
import FeatureModal from '@/components/FeatureModal';
import { featureService, Feature, CreateFeatureDto, UpdateFeatureDto, FeatureStats } from '@/services/feature.service';

const FeatureManagement: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<FeatureStats | null>(null);

  // Carregar features da API
  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const data = await featureService.getAllFeatures();
      setFeatures(data);
    } catch (error) {
      console.error('Erro ao carregar features:', error);
      toast.error('Erro ao carregar features. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await featureService.getFeatureStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas. Tente novamente.');
    }
  };

  const handleCreateFeature = async (featureData: CreateFeatureDto) => {
    try {
      setLoading(true);
      
      await featureService.createFeature(featureData);
      
      // Recarregar features
      await loadFeatures();
      
      toast.success('Feature criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar feature:', error);
      toast.error(error.message || 'Erro ao criar feature. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeature = async (featureData: UpdateFeatureDto) => {
    if (!editingFeature) return;

    try {
      setLoading(true);
      
      await featureService.updateFeature(editingFeature.id, featureData);
      
      // Recarregar features
      await loadFeatures();
      
      toast.success('Feature atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar feature:', error);
      toast.error(error.message || 'Erro ao atualizar feature. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta feature?')) return;

    try {
      setLoading(true);
      
      await featureService.deleteFeature(featureId);
      
      // Recarregar features
      await loadFeatures();
      
      toast.success('Feature excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir feature:', error);
      toast.error(error.message || 'Erro ao excluir feature. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveFeature = async (featureId: string, newStatus: Feature['status']) => {
    try {
      setLoading(true);
      
      await featureService.updateFeatureStatus(featureId, newStatus);
      
      // Recarregar features
      await loadFeatures();
      
      toast.success('Status da feature atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao mover feature:', error);
      toast.error(error.message || 'Erro ao atualizar status. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (feature: Feature) => {
    setEditingFeature(feature);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFeature(null);
  };

  const getStats = () => {
    if (!stats) return {
      totalFeatures: 0,
      totalVotes: 0,
      pendingCount: 0,
      inProgressCount: 0,
      completedCount: 0,
      mostVotedFeature: 'Nenhuma',
      mostVotedVotes: 0
    };

    return stats;
  };

  const currentStats = getStats();

  if (loading && features.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando features...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gerenciamento de Features
            </h1>
            <p className="text-gray-600">
              Gerencie o roadmap de features e acompanhe o progresso do desenvolvimento.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowStats(!showStats);
                if (!showStats && !stats) {
                  loadStats();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Estatísticas
            </button>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nova Feature
            </button>
          </div>
        </div>

        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Features</h3>
              <p className="text-2xl font-bold text-gray-900">{currentStats.totalFeatures}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Votos</h3>
              <p className="text-2xl font-bold text-gray-900">{currentStats.totalVotes}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Mais Votada</h3>
              <p className="text-lg font-semibold text-gray-900">{currentStats.mostVotedFeature}</p>
              <p className="text-sm text-gray-500">{currentStats.mostVotedVotes} votos</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Progresso</h3>
              <p className="text-lg font-semibold text-gray-900">
                {currentStats.completedCount}/{currentStats.totalFeatures}
              </p>
              <p className="text-sm text-gray-500">concluídas</p>
            </div>
          </div>
        )}
      </div>

      <KanbanBoard
        features={features}
        onVote={() => {}} // Super admin não vota
        onMove={handleMoveFeature}
        canVote={false}
        canMove={true}
        canCreate={true}
        onCreateFeature={() => setIsModalOpen(true)}
      />

      {/* Lista detalhada para edição/exclusão */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Todas as Features</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {features.map((feature) => (
                  <tr key={feature.id}>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{feature.title}</div>
                        <div className="text-sm text-gray-500">{feature.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        feature.status === 'pending' ? 'bg-green-100 text-green-800' :
                        feature.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {feature.status === 'pending' ? 'Próximos Passos' :
                         feature.status === 'in_progress' ? 'Estamos Cozinhando' :
                         'Tudo Pronto!'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {feature.votes}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(feature)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFeature(feature.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <FeatureModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingFeature ? handleUpdateFeature : handleCreateFeature}
        editingFeature={editingFeature}
      />

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="text-gray-600">Processando...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureManagement;
