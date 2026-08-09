import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Users,
  Search,
  Edit,
  Trash2,
  Shield,
  User,
  Building2,
  X,
  Save,
  EyeOff,
  Eye,
  AlertCircle,
  MoreVertical,
  Calendar,
  ShieldCheck,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { usuarioService, Usuario, UpdateUsuarioData } from '@/services/usuario.service';
import { useAuth } from '@/contexts/AuthContext';
import { commonDDIs, extractPhoneAndDDI } from '@/constants/phone';
import { masks } from '@/hooks/useMask';
import MaskedInput from '@/components/ui/MaskedInput';
import { Select } from '@/components/ui/select';
import { formatCurrencyDynamic } from '@/utils/currencyUtils';

// --- COMPONENTES DA UI ---
const Switch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-1'
          }`}
      />
    </button>
  );
};

interface EditUsuarioData {
  nome: string;
  email: string;
  telefone?: string;
  senha?: string;
  empresa?: {
    id: string;
    nome_negocio: string;
    cnpj?: string;
  };
  role: 'SUPER_ADMIN' | 'ADMIN' | 'FUNCIONARIO';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  is_limited?: boolean;
}

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingUsuario, setViewingUsuario] = useState<Usuario | null>(null);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [editData, setEditData] = useState<EditUsuarioData>({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    role: 'ADMIN',
    status: 'ACTIVE',
    is_limited: false
  });
  const [ddiValue, setDdiValue] = useState('55');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(15);

  // States para o Purge Nuclear
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgingUsuario, setPurgingUsuario] = useState<Usuario | null>(null);
  const [purgeConfirmation, setPurgeConfirmation] = useState('');
  const [purging, setPurging] = useState(false);



  const { user } = useAuth();

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usuarioService.getAllUsuarios({
        page,
        limit,
        search: searchTerm,
      });
      setUsuarios(response.data);
      setTotalPages(response.pages);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar usuários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [page]);

  const handleEditUsuario = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    const { ddi, phone } = extractPhoneAndDDI(usuario.telefone || '');
    setDdiValue(ddi);
    setEditData({
      nome: usuario.nome,
      email: usuario.email,
      telefone: phone,
      senha: '',
      role: usuario.role,
      status: usuario.status,
      is_limited: usuario.is_limited || false
    });
    setShowEditModal(true);
    setError(null);
  };
  
  const handleViewUsuario = (usuario: Usuario) => {
    setViewingUsuario(usuario);
    setShowViewModal(true);
  };

  const handleSaveUsuario = async () => {
    if (!editingUsuario) return;

    try {
      setSaving(true);
      setError(null);

      const dataToSend: UpdateUsuarioData = { 
        ...editData,
        telefone: ddiValue + editData.telefone
      };
      if (!dataToSend.senha || dataToSend.senha.trim() === '') {
        delete dataToSend.senha;
      }

      // Se a role não for SUPER_ADMIN, a flag is_limited deve ser limpa
      if (dataToSend.role !== 'SUPER_ADMIN') {
        dataToSend.is_limited = false;
      }

      const updatedUsuario = await usuarioService.updateUsuario(editingUsuario.id, dataToSend);

      setUsuarios(prev => prev.map(u =>
        u.id === editingUsuario.id
          ? updatedUsuario
          : u
      ));

      setShowEditModal(false);
      setEditingUsuario(null);
      setEditData({
        nome: '',
        email: '',
        senha: '',
        role: 'ADMIN',
        status: 'ACTIVE',
        is_limited: false
      });
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      setError(error.response?.data?.message || 'Erro ao salvar usuário. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      const newStatus = usuario.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updatedUsuario = await usuarioService.updateUsuario(usuario.id, {
        status: newStatus
      });

      setUsuarios(prev => prev.map(u =>
        u.id === usuario.id
          ? updatedUsuario
          : u
      ));
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      setError('Erro ao alterar status do usuário');
    }
  };

  const handleOpenPurgeModal = (usuario: Usuario) => {
    setPurgingUsuario(usuario);
    setPurgeConfirmation('');
    setShowPurgeModal(true);
  };

  const handlePurgeUsuario = async () => {
    if (!purgingUsuario) return;

    if (purgeConfirmation !== purgingUsuario.email) {
      setError('Confirmação inválida. Digite o e-mail corretamente.');
      return;
    }

    try {
      setPurging(true);
      setError(null);

      await usuarioService.purgeUsuario(purgingUsuario.id);

      setUsuarios(prev => prev.filter(u => u.id !== purgingUsuario.id));

      setShowPurgeModal(false);
      setPurgingUsuario(null);
      setPurgeConfirmation('');
    } catch (error: any) {
      console.error('Erro ao remover dados do usuário:', error);
      setError(error.response?.data?.message || 'Erro ao remover dados do usuário. Verifique as permissões.');
    } finally {
      setPurging(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsuarios();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">Super Admin</span>;
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700">Admin</span>;
      case 'FUNCIONARIO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">Funcionário</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">Ativo</span>;
      case 'INACTIVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">Inativo</span>;
      case 'SUSPENDED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700">Suspenso</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getTitle = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return 'Gerenciar Clientes Assinantes';
    }
    return 'Gerenciar Profissionais';
  };

  const getDescription = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return 'Controle global de usuários e acessos ao sistema';
    }
    return 'Gerencie os colaboradores da sua empresa';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-sm text-gray-500">{getDescription()}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Filtros e Busca */}
      <Card className="bg-white shadow-sm border-0 border-b-2 border-primary/10">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={user?.role === 'SUPER_ADMIN' ? "Buscar por nome, email ou empresa..." : "Buscar colaboradores..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm border-gray-200 focus:ring-primary/20"
                />
              </form>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setStatusFiltro('todos')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${statusFiltro === 'todos' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFiltro('ativos')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${statusFiltro === 'ativos' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Ativos
              </button>
              <button
                onClick={() => setStatusFiltro('inativos')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${statusFiltro === 'inativos' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Inativos
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paginação e Status */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500">
             <span className="font-bold text-gray-900">{totalItems}</span> usuários encontrados
          </p>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg border-gray-200"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft size={16} />
          </Button>
          
          <div className="bg-white border border-gray-200 rounded-lg px-3 h-8 flex items-center shadow-sm">
            <span className="text-[11px] font-bold text-gray-700">
              {page} de {totalPages || 1}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg border-gray-200"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Lista de Usuários - DESKTOP */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Função / Status</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Acesso</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${usuario.role === 'SUPER_ADMIN' ? 'bg-red-500' : usuario.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                        {(usuario.nome || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{usuario.nome}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{usuario.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {getRoleBadge(usuario.role)}
                      {getStatusBadge(usuario.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {usuario.empresa ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Building2 size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-900 font-bold truncate max-w-[150px]">
                            {usuario.empresa.nome_negocio}
                          </span>
                        </div>
                        {usuario.empresa.assinatura?.plano && (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-medium">
                              {usuario.empresa.assinatura.plano.nome} • {formatCurrencyDynamic(usuario.empresa.assinatura.plano.preco_mensal)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Sem empresa</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div className="flex flex-col gap-0.5">
                      <p className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      {usuario.lastLogin && (
                        <p className="text-[10px] text-gray-400">
                          Login: {new Date(usuario.lastLogin).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-1">
                      {/* Status Switch (only for non-admins to avoid self-lock) */}
                      {user?.id !== usuario.id && (
                        <div className="mr-2 pr-2 border-r">
                          <Switch
                            checked={usuario.status === 'ACTIVE'}
                            onChange={() => handleToggleStatus(usuario)}
                            disabled={usuario.role === 'SUPER_ADMIN'}
                          />
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-600"
                        onClick={() => {
                          const phone = usuario.telefone?.replace(/\D/g, '');
                          if (phone) {
                            window.open(`https://wa.me/${phone}`, '_blank');
                          }
                        }}
                        title="Conversar no WhatsApp"
                        disabled={!usuario.telefone}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-primary"
                          onClick={() => handleViewUsuario(usuario)}
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600"
                          onClick={() => handleEditUsuario(usuario)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                      {user?.role === 'SUPER_ADMIN' && usuario.role !== 'SUPER_ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => handleOpenPurgeModal(usuario)}
                          title="Remover Nuclear"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de Usuários - MOBILE */}
      <div className="md:hidden grid gap-3">
        {usuarios.map((usuario) => (
          <Card key={usuario.id} className="bg-white shadow-sm border-0 border-l-4 border-l-primary overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${usuario.role === 'SUPER_ADMIN' ? 'bg-red-500' : usuario.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                    {(usuario.nome || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{usuario.nome}</h3>
                    <p className="text-[11px] text-gray-400">{usuario.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-green-600"
                    onClick={() => {
                      const phone = usuario.telefone?.replace(/\D/g, '');
                      if (phone) {
                        window.open(`https://wa.me/${phone}`, '_blank');
                      }
                    }}
                    title="WhatsApp"
                    disabled={!usuario.telefone}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-primary"
                      onClick={() => handleViewUsuario(usuario)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditUsuario(usuario)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  {user?.role === 'SUPER_ADMIN' && usuario.role !== 'SUPER_ADMIN' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600"
                      onClick={() => handleOpenPurgeModal(usuario)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {getRoleBadge(usuario.role)}
                {getStatusBadge(usuario.status)}
              </div>

              {usuario.empresa && (
                <div className="bg-gray-50 p-2 rounded text-[11px] text-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={12} className="text-gray-400" />
                    <span className="font-bold truncate">{usuario.empresa.nome_negocio}</span>
                  </div>
                  {usuario.empresa.assinatura?.plano && (
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>Plano: {usuario.empresa.assinatura.plano.nome}</span>
                      <span>{formatCurrencyDynamic(usuario.empresa.assinatura.plano.preco_mensal)}/mês</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 pt-3 border-t flex justify-between items-center bg-transparent">
                <div className="text-[10px] text-gray-400">
                  Criado em: {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                </div>
                {user?.id !== usuario.id && usuario.role !== 'SUPER_ADMIN' && (
                  <Switch
                    checked={usuario.status === 'ACTIVE'}
                    onChange={() => handleToggleStatus(usuario)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {usuarios.length === 0 && !loading && (
        <div className="bg-white rounded-xl py-12 text-center border">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum resultado</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Não encontramos nenhum usuário com os termos ou filtros aplicados.
          </p>
        </div>
      )}

      {/* Modal de Confirmação de Purge (Nuclear Delete) */}
      {showPurgeModal && purgingUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-red-100">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <ShieldCheck size={32} />
                <h2 className="text-xl font-bold">Ação Crítica!</h2>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Remover <strong>{purgingUsuario.nome}</strong> apagará permanentemente toda a empresa vinculada, usuários, agendamentos e histórico financeiro.
              </p>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-tight">
                  Confirme o e-mail: <span className="text-red-600 font-mono ml-1">{purgingUsuario.email}</span>
                </label>
                <Input
                  value={purgeConfirmation}
                  onChange={(e) => setPurgeConfirmation(e.target.value)}
                  placeholder="E-mail do usuário"
                  className="border-red-200 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  className="flex-1"
                  variant="ghost"
                  onClick={() => {
                    setShowPurgeModal(false);
                    setPurgingUsuario(null);
                    setPurgeConfirmation('');
                  }}
                  disabled={purging}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handlePurgeUsuario}
                  disabled={purging || purgeConfirmation !== purgingUsuario.email}
                >
                  {purging ? 'Processando...' : 'Remover Tudo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Editar Usuário</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-2">
                  Nome Completo
                </label>
                <Input
                  value={editData.nome}
                  onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                  placeholder="Nome do usuário"
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-2">
                  E-mail de Acesso
                </label>
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="h-10 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-2">
                  Telefone / WhatsApp
                </label>
                <div className="flex items-center gap-0 overflow-hidden rounded-md border border-gray-200 focus-within:ring-2 focus-within:ring-primary transition-all bg-white shadow-sm h-10">
                  <div className="relative h-full flex items-center">
                    <select
                      value={ddiValue}
                      onChange={(e) => setDdiValue(e.target.value)}
                      className="appearance-none bg-gray-50/50 h-full pl-3 pr-8 text-xs font-bold outline-none cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-200"
                    >
                      {commonDDIs.map(ddi => (
                        <option key={ddi.code} value={ddi.code}>
                          {ddi.flag} +{ddi.code}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronRight size={14} className="rotate-90" />
                    </div>
                  </div>
                  <div className="flex-1 h-full">
                    <MaskedInput
                      type="tel"
                      value={editData.telefone}
                      onChange={(val) => setEditData({ ...editData, telefone: val })}
                      mask={ddiValue === '55' ? masks.phone.mask : (val: string) => val}
                      unmask={masks.phone.unmask}
                      maxLength={ddiValue === '55' ? masks.phone.maxLength : 20}
                      placeholder={ddiValue === '55' ? "(00) 00000-0000" : "Telefone"}
                      className="w-full h-full bg-transparent border-none focus:ring-0 text-sm px-4 h-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-2">
                  Senha <span className="text-gray-400 lowercase font-normal">(deixe em branco para não alterar)</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={editData.senha}
                    onChange={(e) => setEditData({ ...editData, senha: e.target.value })}
                    placeholder="Nova senha"
                    className="h-10 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-2">
                    Função (Role)
                  </label>
                  <select
                    value={editData.role}
                    onChange={(e) => setEditData({ ...editData, role: e.target.value as any })}
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="FUNCIONARIO">Funcionário</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-2">
                    Status
                  </label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                    <option value="SUSPENDED">Suspenso</option>
                  </select>
                </div>
              </div>

              {editData.role === 'SUPER_ADMIN' && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 mt-4">
                  <div>
                    <p className="text-xs font-bold text-gray-700">Acesso Limitado (SDR)</p>
                    <p className="text-[10px] text-gray-500">Permite acesso apenas ao Painel de Recuperação SDR</p>
                  </div>
                  <Switch
                    checked={!!editData.is_limited}
                    onChange={() => setEditData({ ...editData, is_limited: !editData.is_limited })}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <Button
                variant="ghost"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="text-xs font-bold uppercase tracking-widest h-10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveUsuario}
                disabled={saving}
                className="h-10 px-6 font-bold uppercase tracking-widest text-xs"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Visualização */}
      {showViewModal && viewingUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-primary`}>
                  {(viewingUsuario.nome || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{viewingUsuario.nome}</h2>
                  <p className="text-xs text-gray-500">{viewingUsuario.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Resumo da Conta</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs py-2 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Role:</span>
                        <div className="font-bold">{getRoleBadge(viewingUsuario.role)}</div>
                      </div>
                      <div className="flex justify-between text-xs py-2 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Status:</span>
                        <div className="font-bold">{getStatusBadge(viewingUsuario.status)}</div>
                      </div>
                      <div className="flex justify-between text-xs py-2 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Telefone:</span>
                        <span className="font-bold text-gray-900">{viewingUsuario.telefone || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between text-xs py-2 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Membro desde:</span>
                        <span className="font-bold text-gray-900">{new Date(viewingUsuario.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Segurança e Acesso</h3>
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs py-2 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Método de Login:</span>
                        <span className="font-bold text-gray-900 uppercase">{viewingUsuario.auth_provider || 'local'}</span>
                      </div>
                      <div className="flex justify-between text-xs py-2 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Notificação Push (FCM):</span>
                        <span className={`font-bold ${viewingUsuario.fcm_token ? 'text-green-600' : 'text-amber-500'}`}>
                          {viewingUsuario.fcm_token ? '✓ Token Ativo' : '✗ Sem Token (Celular)'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs py-2 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Último Acesso:</span>
                        <span className="font-bold text-gray-900">
                          {viewingUsuario.lastLogin ? new Date(viewingUsuario.lastLogin).toLocaleString('pt-BR') : 'Nunca acessou'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Dados da Empresa</h3>
                    {viewingUsuario.empresa ? (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-primary" />
                          <span className="text-sm font-bold text-gray-900">{viewingUsuario.empresa.nome_negocio}</span>
                        </div>
                        {viewingUsuario.empresa.cnpj && (
                           <div className="text-[10px] text-gray-500 font-mono">
                             CNPJ: {viewingUsuario.empresa.cnpj}
                           </div>
                        )}
                        {viewingUsuario.empresa.endereco && (
                           <div className="text-[9px] text-gray-400 border-l-2 border-gray-200 pl-2 leading-relaxed">
                             {viewingUsuario.empresa.endereco.logradouro}, {viewingUsuario.empresa.endereco.numero}<br />
                             {viewingUsuario.empresa.endereco.bairro} - {viewingUsuario.empresa.endereco.cidade}/{viewingUsuario.empresa.endereco.estado}<br />
                             CEP: {viewingUsuario.empresa.endereco.cep}
                           </div>
                        )}
                        {viewingUsuario.empresa.assinatura && (
                          <div className="space-y-2 pt-2 border-t border-gray-200">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500">Plano:</span>
                              <span className="font-black text-primary uppercase">{viewingUsuario.empresa.assinatura.plano?.nome}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500">Valor:</span>
                              <span className="font-bold text-gray-900">{formatCurrencyDynamic(viewingUsuario.empresa.assinatura.plano?.preco_mensal || 0)}/mês</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500">Status Assinatura:</span>
                              <span className={`font-bold px-1.5 py-0.5 rounded ${viewingUsuario.empresa.assinatura.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {viewingUsuario.empresa.assinatura.status}
                              </span>
                            </div>
                            
                            {/* Link Rápido */}
                            <div className="pt-2">
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 className="w-full h-7 text-[9px] font-black uppercase"
                                 onClick={() => window.open(`https://unna.app.br/${(viewingUsuario.empresa as any).slug}/agendar`, '_blank')}
                                 disabled={!(viewingUsuario.empresa as any).slug}
                               >
                                 Ir para Página de Agendamento
                               </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                        Sem empresa vinculada
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Horários de Trabalho (Se for Colaborador) */}
              {viewingUsuario.colaborador && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 p-2 rounded-lg">
                    <Calendar size={12} className="text-primary" />
                    Perfil Profissional e Horários
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Cargo / Função</span>
                        <div className="text-sm font-bold text-gray-900">{viewingUsuario.colaborador.cargo?.nome || 'Não definido'}</div>
                     </div>
                     <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Comissão Padrão</span>
                        <div className="text-sm font-bold text-primary">{viewingUsuario.colaborador.comissao ? `${viewingUsuario.colaborador.comissao}%` : 'Não definida'}</div>
                     </div>
                  </div>

                  {viewingUsuario.colaborador.cargo?.servicos && viewingUsuario.colaborador.cargo.servicos.length > 0 && (
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                       <span className="text-[9px] font-black text-blue-400 uppercase mb-2 block">Serviços Habilitados via Cargo</span>
                       <div className="flex flex-wrap gap-1.5">
                          {viewingUsuario.colaborador.cargo.servicos.map(s => (
                            <span key={s.servico.id} className="px-2 py-0.5 bg-white border border-blue-100 rounded text-[9px] font-bold text-blue-700">
                               {s.servico.nome} ({s.servico.duracao} min)
                            </span>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                     <span className="text-[9px] font-black text-gray-400 uppercase">Especialidades (Tags)</span>
                     <div className="flex flex-wrap gap-1 mt-1">
                           {viewingUsuario.colaborador.especialidades && viewingUsuario.colaborador.especialidades.length > 0 ? (
                             viewingUsuario.colaborador.especialidades.map(esp => (
                               <span key={esp} className="px-1.5 py-0.5 bg-white border rounded text-[8px] font-bold text-gray-600 uppercase">{esp}</span>
                             ))
                           ) : (
                             <span className="text-[10px] text-gray-400">Geral</span>
                           )}
                        </div>
                     </div>

                  {viewingUsuario.colaborador.horario_trabalho ? (
                    <div className="bg-white border rounded-xl overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-gray-50 border-b text-gray-500">
                            <th className="px-4 py-2 font-bold text-left">Dia</th>
                            <th className="px-4 py-2 font-bold text-left">Início</th>
                            <th className="px-4 py-2 font-bold text-left">Fim</th>
                            <th className="px-4 py-2 font-bold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {Object.entries(viewingUsuario.colaborador.horario_trabalho).map(([dia, slots]: [string, any]) => {
                            const isClosed = !slots.inicio || !slots.fim;
                            return (
                              <tr key={dia} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2 font-medium capitalize text-gray-700">{dia}</td>
                                <td className="px-4 py-2 text-gray-600 font-mono">{slots.inicio || '-'}</td>
                                <td className="px-4 py-2 text-gray-600 font-mono">{slots.fim || '-'}</td>
                                <td className="px-4 py-2 text-right text-[9px] font-black tracking-widest">
                                  {isClosed ? (
                                    <span className="text-red-400">FECHADO</span>
                                  ) : (
                                    <span className="text-green-500">ABERTO</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl text-xs text-center text-gray-400 italic">
                      Horários não configurados para este profissional
                    </div>
                  )}

                  {viewingUsuario.colaborador.bio && (
                    <div className="mt-4">
                      <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Bio / Descrição</h3>
                      <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed">
                        {viewingUsuario.colaborador.bio}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <Button
                onClick={() => setShowViewModal(false)}
                className="font-bold uppercase tracking-widest text-xs px-8"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
