import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { planoService, Plano, CreatePlanoData, UpdatePlanoData } from '@/services/plano.service';
import { formatCurrencyDynamic, getCurrencyConfig } from '@/utils/currencyUtils';

interface EditModalProps {
  plano: Plano | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdatePlanoData) => Promise<void>;
}

const EditModal: React.FC<EditModalProps> = ({ plano, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<UpdatePlanoData>({});
  const [loading, setLoading] = useState(false);
  const [recursos, setRecursos] = useState<string[]>([]);
  const [novoRecurso, setNovoRecurso] = useState('');

  useEffect(() => {
    if (plano) {
      setFormData({
        nome: plano.nome,
        tipo: plano.tipo,
        preco_mensal: plano.preco_mensal,
        preco_anual: plano.preco_anual,
        max_colaboradores: plano.max_colaboradores,
        max_clientes: plano.max_clientes,
        recursos: plano.recursos,
        ativo: plano.ativo
      });

      if (typeof plano.recursos === 'object' && plano.recursos.recursos) {
        setRecursos(plano.recursos.recursos);
      } else {
        setRecursos([]);
      }
    }
  }, [plano]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        recursos: { recursos }
      };
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRecurso = () => {
    if (novoRecurso.trim()) {
      setRecursos([...recursos, novoRecurso.trim()]);
      setNovoRecurso('');
    }
  };

  const removeRecurso = (index: number) => {
    setRecursos(recursos.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Editar Plano</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <Input
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={formData.tipo || ''}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="FREE">FREE</option>
                <option value="BASIC">BASIC</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>

            <CurrencyInput
              label={`Preço Mensal (${getCurrencyConfig().symbol})`}
              value={formData.preco_mensal}
              onValueChange={(val) => setFormData({ ...formData, preco_mensal: val })}
              required
            />

            <CurrencyInput
              label={`Preço Anual (${getCurrencyConfig().symbol})`}
              value={formData.preco_anual}
              onValueChange={(val) => setFormData({ ...formData, preco_anual: val })}
              required
            />

            <div>
              <label className="block text-sm font-medium mb-2">Max Profissionais (-1 para ilimitado)</label>
              <Input
                type="number"
                value={formData.max_colaboradores || ''}
                onChange={(e) => setFormData({ ...formData, max_colaboradores: parseInt(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Clientes (-1 para ilimitado)</label>
              <Input
                type="number"
                value={formData.max_clientes || ''}
                onChange={(e) => setFormData({ ...formData, max_clientes: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recursos</label>
            <div className="space-y-2">
              {recursos.map((recurso, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 p-2 bg-gray-100 rounded">{recurso}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRecurso(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  value={novoRecurso}
                  onChange={(e) => setNovoRecurso(e.target.value)}
                  placeholder="Novo recurso"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecurso())}
                />
                <Button type="button" onClick={addRecurso}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo || false}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            />
            <label htmlFor="ativo" className="text-sm font-medium">Plano ativo</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePlanoData) => Promise<void>;
}

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<CreatePlanoData>({
    nome: '',
    tipo: 'BASIC',
    preco_mensal: 0,
    preco_anual: 0,
    max_colaboradores: 3,
    max_clientes: 100,
    recursos: { recursos: [] },
    ativo: true
  });
  const [loading, setLoading] = useState(false);
  const [recursos, setRecursos] = useState<string[]>([]);
  const [novoRecurso, setNovoRecurso] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        recursos: { recursos }
      };
      await onSave(dataToSave);
      onClose();
      // Reset form
      setFormData({
        nome: '',
        tipo: 'BASIC',
        preco_mensal: 0,
        preco_anual: 0,
        max_colaboradores: 3,
        max_clientes: 100,
        recursos: { recursos: [] },
        ativo: true
      });
      setRecursos([]);
    } catch (error) {
      console.error('Erro ao criar plano:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRecurso = () => {
    if (novoRecurso.trim()) {
      setRecursos([...recursos, novoRecurso.trim()]);
      setNovoRecurso('');
    }
  };

  const removeRecurso = (index: number) => {
    setRecursos(recursos.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Novo Plano</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="FREE">FREE</option>
                <option value="BASIC">BASIC</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>

            <CurrencyInput
              label={`Preço Mensal (${getCurrencyConfig().symbol})`}
              value={formData.preco_mensal}
              onChange={(e: any) => setFormData({ ...formData, preco_mensal: e.target.value })}
              required
            />

            <CurrencyInput
              label={`Preço Anual (${getCurrencyConfig().symbol})`}
              value={formData.preco_anual}
              onChange={(e: any) => setFormData({ ...formData, preco_anual: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium mb-2">Max Profissionais (-1 para ilimitado)</label>
              <Input
                type="number"
                value={formData.max_colaboradores}
                onChange={(e) => setFormData({ ...formData, max_colaboradores: parseInt(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Clientes (-1 para ilimitado)</label>
              <Input
                type="number"
                value={formData.max_clientes}
                onChange={(e) => setFormData({ ...formData, max_clientes: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recursos</label>
            <div className="space-y-2">
              {recursos.map((recurso, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 p-2 bg-gray-100 rounded">{recurso}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRecurso(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  value={novoRecurso}
                  onChange={(e) => setNovoRecurso(e.target.value)}
                  placeholder="Novo recurso"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecurso())}
                />
                <Button type="button" onClick={addRecurso}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo-create"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            />
            <label htmlFor="ativo-create" className="text-sm font-medium">Plano ativo</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Plano
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Planos = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingPlano, setDeletingPlano] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanos = async () => {
      try {
        setLoading(true);
        setError(null);

        const planosData = await planoService.getPlanos();
        setPlanos(planosData);
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
        setError('Erro ao carregar planos. Tente novamente.');

        // Dados de exemplo para desenvolvimento
        setPlanos([
          {
            id: '1',
            nome: 'Básico',
            tipo: 'BASIC',
            preco_mensal: 29.90,
            preco_anual: 299.90,
            max_colaboradores: 3,
            max_clientes: 100,
            recursos: {
              recursos: [
                'Até 3 colaboradores',
                'Agendamento online',
                'Gestão de clientes',
                'Relatórios básicos',
                'Suporte por email'
              ]
            },
            ativo: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          {
            id: '2',
            nome: 'Premium',
            tipo: 'PREMIUM',
            preco_mensal: 59.90,
            preco_anual: 599.90,
            max_colaboradores: 10,
            max_clientes: 500,
            recursos: {
              recursos: [
                'Até 10 colaboradores',
                'Agendamento online',
                'Gestão de clientes',
                'Relatórios avançados',
                'Gestão de estoque',
                'Integração com pagamentos',
                'Suporte prioritário'
              ]
            },
            ativo: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          {
            id: '3',
            nome: 'Enterprise',
            tipo: 'ENTERPRISE',
            preco_mensal: 99.90,
            preco_anual: 999.90,
            max_colaboradores: -1,
            max_clientes: -1,
            recursos: {
              recursos: [
                'Profissionais ilimitados',
                'Agendamento online',
                'Gestão de clientes',
                'Relatórios personalizados',
                'Gestão de estoque avançada',
                'Integração com pagamentos',
                'API personalizada',
                'Suporte 24/7',
                'Treinamento incluído'
              ]
            },
            ativo: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanos();
  }, []);

  const handleEditPlano = (plano: Plano) => {
    setEditingPlano(plano);
    setIsEditModalOpen(true);
  };

  const handleSavePlano = async (data: UpdatePlanoData) => {
    if (!editingPlano) return;

    try {
      const updatedPlano = await planoService.updatePlano(editingPlano.id, data);
      setPlanos(planos.map(p => p.id === editingPlano.id ? updatedPlano : p));
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      throw error;
    }
  };

  const handleCreatePlano = async (data: CreatePlanoData) => {
    try {
      const newPlano = await planoService.createPlano(data);
      setPlanos([newPlano, ...planos]);
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      throw error;
    }
  };

  const handleDeletePlano = async (planoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeletingPlano(planoId);
      await planoService.deletePlano(planoId);
      setPlanos(planos.filter(p => p.id !== planoId));
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      alert('Erro ao excluir plano. Verifique se não há assinaturas ativas para este plano.');
    } finally {
      setDeletingPlano(null);
    }
  };



  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'BASIC':
        return 'text-blue-600 bg-blue-100';
      case 'PREMIUM':
        return 'text-purple-600 bg-purple-100';
      case 'ENTERPRISE':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (ativo: boolean) => {
    return ativo
      ? 'text-green-600 bg-green-100'
      : 'text-red-600 bg-red-100';
  };

  const getRecursos = (plano: Plano): string[] => {
    if (typeof plano.recursos === 'object' && plano.recursos.recursos) {
      return plano.recursos.recursos;
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Gerenciar Planos</h1>
        <Button onClick={() => setIsCreateModalOpen(true)} className="w-full shrink-0 sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Planos */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {planos.map((plano) => (
          <Card key={plano.id} className="min-w-0 bg-white border-0 shadow-sm transition-shadow duration-200 hover:shadow-lg">
            <CardContent className="p-4 sm:p-6">
              {/* Header do Card */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0">
                      <CreditCard className="w-8 h-8 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 truncate">{plano.nome}</h3>
                      <p className="text-sm text-gray-600">Plano {plano.tipo.toLowerCase()}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoColor(plano.tipo)}`}>
                      {plano.tipo}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(plano.ativo)}`}>
                      {plano.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlano(plano)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeletePlano(plano.id)}
                    disabled={deletingPlano === plano.id}
                  >
                    {deletingPlano === plano.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Informações de Preço */}
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-gray-600 font-medium mb-1">Preço Mensal</p>
                      <p className="text-xl font-bold text-green-700">
                        {formatCurrencyDynamic(plano.preco_mensal)}
                      </p>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-gray-600 font-medium mb-1">Preço Anual</p>
                      <p className="text-xl font-bold text-green-700">
                        {formatCurrencyDynamic(plano.preco_anual)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Limites */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 font-medium mb-1">Profissionais</p>
                  <p className="text-lg font-bold text-blue-700">
                    {plano.max_colaboradores === -1 ? '∞' : plano.max_colaboradores}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 font-medium mb-1">Clientes</p>
                  <p className="text-lg font-bold text-purple-700">
                    {plano.max_clientes === -1 ? '∞' : plano.max_clientes}
                  </p>
                </div>
              </div>

              {/* Recursos */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Recursos Incluídos
                </h4>
                <div className="space-y-2">
                  {getRecursos(plano).length > 0 ? (
                    getRecursos(plano).map((recurso, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">{recurso}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Nenhum recurso específico listado
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Edição */}
      <EditModal
        plano={editingPlano}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlano(null);
        }}
        onSave={handleSavePlano}
      />

      {/* Modal de Criação */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreatePlano}
      />
    </div>
  );
};

export default Planos; 