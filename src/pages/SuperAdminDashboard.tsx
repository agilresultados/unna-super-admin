import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  Activity,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  Shield,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { superAdminService, DashboardStats, OnlineUser, EngagementStats } from '@/services/super-admin.service';
import { empresaService, Empresa } from '@/services/empresa.service';
import Modal from '@/components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Input from '@/components/ui/Input';
import { formatCurrencyDynamic } from '@/utils/currencyUtils';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmpresas: 0,
    totalUsuarios: 0,
    totalAssinaturas: 0,
    receitaMensal: 0,
    receitaAnual: 0,
    assinaturasAtivas: 0,
    assinaturasTrial: 0,
    assinaturasCanceladas: 0,
    empresasEsteMes: 0,
    usuariosEsteMes: 0,
    usuariosOnline: 0,
    version: ""
  });

  const [recentEmpresas, setRecentEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  // States para o Gráfico
  const [chartData, setChartData] = useState<Array<{ data: string; quantidade: number; acumulado: number }>>([]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingChart, setLoadingChart] = useState(false);
  
  // States para Usuários Online
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(false);

  // States para Engajamento
  const [engagementStats, setEngagementStats] = useState<EngagementStats[]>([]);
  const [filteredEngagementStats, setFilteredEngagementStats] = useState<EngagementStats[]>([]);
  const [engagementSearchTerm, setEngagementSearchTerm] = useState('');
  const [engagementStatusFilter, setEngagementStatusFilter] = useState('all');
  const [isEngagementModalOpen, setIsEngagementModalOpen] = useState(false);
  const [loadingEngagement, setLoadingEngagement] = useState(false);

  const fetchChartData = async (start: string, end: string) => {
    try {
      setLoadingChart(true);
      const data = await superAdminService.getRegistrosPorDia(start, end);
      // Formatar data para exibição mais amigável
      const formattedData = data.map(item => ({
        ...item,
        dataExibicao: new Date(item.data + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }));
      setChartData(formattedData as any);
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardStats, empresasRes] = await Promise.all([
          superAdminService.getDashboardStats(),
          empresaService.getEmpresas({ limit: 50 }) // Pegamos uma amostra maior para ordenar no dash
        ]);
        
        setStats(dashboardStats);
        
        // Garantir que temos um array, lidando com o novo formato paginado
        const empresasArray = Array.isArray(empresasRes) ? empresasRes : (empresasRes.data || []);

        // Sort by createdAt desc and take first 5
        const sorted = [...empresasArray].sort((a, b) =>
          new Date(b.registered_at || b.createdAt).getTime() - new Date(a.registered_at || a.createdAt).getTime()
        ).slice(0, 5);
        setRecentEmpresas(sorted);

        // Buscar dados iniciais do gráfico
        await fetchChartData(startDate, endDate);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Hook para atualizar gráfico quando as datas mudarem
  useEffect(() => {
    if (!loading) { // Evita execução duplicada no mount
      fetchChartData(startDate, endDate);
    }
  }, [startDate, endDate]);
  
  const fetchOnlineUsers = async () => {
    try {
      setLoadingOnlineUsers(true);
      setIsOnlineModalOpen(true);
      const data = await superAdminService.getOnlineUsers();
      setOnlineUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários online:', error);
    } finally {
      setLoadingOnlineUsers(false);
    }
  };

  const getPlanoOnlineBadge = (user: OnlineUser) => {
    if (!user.empresa) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600">—</span>;
    }

    const assinatura = user.empresa.assinatura;
    if (!assinatura) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">Sem plano</span>;
    }

    const vencida = !!assinatura.data_fim && new Date(assinatura.data_fim) < new Date();
    const ativa = (assinatura.status === 'ACTIVE' || assinatura.status === 'TRIAL') && !vencida;

    const rotuloStatus: Record<string, string> = {
      ACTIVE: 'Ativo',
      TRIAL: 'Trial',
      CANCELLED: 'Cancelado',
      EXPIRED: 'Expirado',
      PENDING: 'Pendente',
    };
    const rotulo = vencida ? 'Vencido' : (rotuloStatus[assinatura.status] || assinatura.status);

    const cor = !ativa ? 'bg-red-100 text-red-700'
      : assinatura.status === 'TRIAL' ? 'bg-purple-100 text-purple-700'
      : 'bg-green-100 text-green-700';

    return (
      <div className="flex flex-col items-center gap-1">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cor}`}>
          {rotulo}
        </span>
        {assinatura.plano?.nome && (
          <span className="text-[10px] text-gray-500">{assinatura.plano.nome}</span>
        )}
      </div>
    );
  };

  const fetchEngagementStats = async () => {
    try {
      setLoadingEngagement(true);
      setIsEngagementModalOpen(true);
      const data = await superAdminService.getEngagementStats();
      setEngagementStats(data);
      setFilteredEngagementStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de engajamento:', error);
    } finally {
      setLoadingEngagement(false);
    }
  };

  useEffect(() => {
    let result = engagementStats;
    
    if (engagementSearchTerm) {
      const lower = engagementSearchTerm.toLowerCase();
      result = result.filter(item => 
        item.nome_negocio.toLowerCase().includes(lower) || 
        (item.email && item.email.toLowerCase().includes(lower))
      );
    }

    if (engagementStatusFilter !== 'all') {
      result = result.filter(item => {
        const now = new Date().getTime();
        const lastActive = item.ultimaAtividade ? new Date(item.ultimaAtividade).getTime() : 0;
        const daysSince = lastActive > 0 ? Math.floor((now - lastActive) / (1000 * 60 * 60 * 24)) : 999;
        
        let status = 'active';
        if (daysSince > 7) status = 'inactive';
        else if (daysSince > 3) status = 'warning';

        return status === engagementStatusFilter;
      });
    }

    setFilteredEngagementStats(result);
  }, [engagementSearchTerm, engagementStatusFilter, engagementStats]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center md:flex-row flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Super Admin {stats.version}</h1>
          <p className="text-sm text-gray-500">Visão geral do ecossistema Unna</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/empresas')} className="bg-primary text-white text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-white shadow-sm border-0 border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Empresas</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalEmpresas}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-green-600 font-medium">+{stats.empresasEsteMes}</span>
              <span className="text-gray-400 ml-1">este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Usuários</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalUsuarios}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-green-600 font-medium">+{stats.usuariosEsteMes}</span>
              <span className="text-gray-400 ml-1">este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white shadow-sm border-0 border-l-4 border-pink-500 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={fetchOnlineUsers}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Usuários Online</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.usuariosOnline}</h3>
              </div>
              <div className="p-2 bg-pink-50 rounded-lg">
                <Activity className="h-5 w-5 text-pink-500 animate-pulse" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-500">Clique para ver quem está online</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Valor das Assinaturas Ativas</p>
                <h3 className="text-2xl font-bold text-gray-800">{formatCurrencyDynamic(stats.receitaMensal)}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Crescimento estável</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 border-l-4 border-indigo-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assinaturas Ativas</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.assinaturasAtivas}</h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-amber-600 font-medium">{stats.assinaturasTrial}</span>
              <span className="text-gray-400 ml-1">em trial</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white shadow-sm border-0 border-l-4 border-orange-500 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={fetchEngagementStats}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Última Atividade</p>
                <h3 className="text-2xl font-bold text-gray-800">Engagement</h3>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-gray-500">Clique para ver atividade dos clientes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Período de Análise
          </h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-[10px] font-bold uppercase text-gray-400">De</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e: any) => setStartDate(e.target.value)}
              className="h-9 text-xs py-0 min-w-[140px] focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-[10px] font-bold uppercase text-gray-400">Até</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e: any) => setEndDate(e.target.value)}
              className="h-9 text-xs py-0 min-w-[140px] focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Registros Diários */}
        <Card className="bg-white shadow-sm border-0 overflow-hidden">
          <CardHeader className="border-b pb-4">
            <div>
              <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Novos Registros
              </CardTitle>
              <p className="text-xs text-gray-500">Volume diário de novas empresas</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full relative">
              {loadingChart && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRegistros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="dataExibicao"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    minTickGap={30}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                    labelClassName="font-bold text-gray-800"
                    formatter={(value: any) => [`${value} empresa(s)`, 'Registros']}
                  />
                  <Area
                    type="monotone"
                    dataKey="quantidade"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRegistros)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
            <div>
              <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Crescimento Cumulativo de Empresas
              </CardTitle>
              <p className="text-xs text-gray-500">Total de empresas na base ao longo do tempo</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full relative">
              {loadingChart && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="dataExibicao"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    minTickGap={30}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                    labelClassName="font-bold text-gray-800"
                    formatter={(value: any) => [`${value} empresa(s)`, 'Total Acumulado']}
                  />
                  <Area
                    type="monotone"
                    dataKey="acumulado"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAcumulado)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Novas Empresas (Recent Companies) */}
        <Card className="lg:col-span-2 bg-white shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-base font-semibold text-gray-800">Novas Empresas</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={() => navigate('/empresas')}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentEmpresas.map((empresa) => (
                <div key={empresa.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/empresas')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{empresa.nome_negocio}</p>
                      <p className="text-xs text-gray-500">{new Date(empresa.registered_at || empresa.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${empresa.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {empresa.status === 'active' ? 'Ativo' : empresa.status === 'suspended' ? 'Suspenso' : empresa.status}
                    </span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              ))}
              {recentEmpresas.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Nenhuma empresa cadastrada recentemente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status e Ações */}
        <div className="space-y-6">
          {/* Status das Assinaturas */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">Status das Assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">Ativas ({stats.assinaturasAtivas})</span>
                    <span className="text-gray-400">
                      {Math.round((stats.assinaturasAtivas / (stats.totalAssinaturas || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (stats.assinaturasAtivas / (stats.totalAssinaturas || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">Trial ({stats.assinaturasTrial})</span>
                    <span className="text-gray-400">
                      {Math.round((stats.assinaturasTrial / (stats.totalAssinaturas || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (stats.assinaturasTrial / (stats.totalAssinaturas || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">Canceladas ({stats.assinaturasCanceladas})</span>
                    <span className="text-gray-400">
                      {Math.round((stats.assinaturasCanceladas / (stats.totalAssinaturas || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (stats.assinaturasCanceladas / (stats.totalAssinaturas || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-1">Faturamento Mensal (Ativas)</p>
                  <p className="text-xl font-bold text-gray-800">{formatCurrencyDynamic(stats.receitaMensal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <Button className="w-full justify-start text-xs h-9" variant="outline" onClick={() => navigate('/empresas')}>
                  <Building2 className="w-3.5 h-3.5 mr-2" />
                  Gerenciar Empresas
                </Button>
                <Button className="w-full justify-start text-xs h-9" variant="outline" onClick={() => navigate('/usuarios')}>
                  <Users className="w-3.5 h-3.5 mr-2" />
                  Gerenciar Usuários
                </Button>
                <Button className="w-full justify-start text-xs h-9" variant="outline" onClick={() => navigate('/planos')}>
                  <CreditCard className="w-3.5 h-3.5 mr-2" />
                  Configurar Planos
                </Button>
                <Button 
                  className="w-full justify-start text-xs h-9 text-blue-600 border-blue-100 hover:bg-blue-50" 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      await superAdminService.syncPermissions();
                      toast.success('Permissões sincronizadas com sucesso!');
                    } catch (error) {
                      toast.error('Erro ao sincronizar permissões');
                    }
                  }}
                >
                  <Shield className="w-3.5 h-3.5 mr-2" />
                  Sincronizar Permissões
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Usuários Online */}
      <Modal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        title="Usuários Online no Momento"
        size="2xl"
      >
        {loadingOnlineUsers ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 animate-pulse">Buscando atividade...</p>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum usuário ativo nos últimos 5 minutos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3 text-center">Plano</th>
                  <th className="px-4 py-3 text-center">Perfil</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {onlineUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{user.nome}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {user.empresa?.nome_negocio || 'Administração Unna'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getPlanoOnlineBadge(user)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        user.role === 'SUPER_ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : 'Funcionário'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
              <Activity className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs text-blue-800 font-medium">Como funciona a contagem?</p>
                <p className="text-[10px] text-blue-600 mt-1 leading-relaxed">
                  A plataforma rastreia a atividade de cada usuário em tempo real. Esta lista mostra quem interagiu 
                  com o sistema nos últimos 5 minutos. Após esse período de inatividade, o usuário é removido automaticamente.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Engajamento / Última Atividade */}
      <Modal
        isOpen={isEngagementModalOpen}
        onClose={() => setIsEngagementModalOpen(false)}
        title="Atividade das Assinaturas Ativas"
        size="6xl"
      >
        {loadingEngagement ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 animate-pulse">Calculando métricas de atividade...</p>
          </div>
        ) : engagementStats.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma assinatura ativa encontrada para análise.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-4 flex flex-col sm:flex-row gap-4 px-1">
              <Input
                type="text"
                placeholder="Buscar por empresa ou e-mail..."
                value={engagementSearchTerm}
                onChange={(e: any) => setEngagementSearchTerm(e.target.value)}
                className="flex-1 max-w-sm h-10"
              />
              <select
                className="h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:ring-primary focus:border-primary"
                value={engagementStatusFilter}
                onChange={(e) => setEngagementStatusFilter(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo (≤ 3 dias)</option>
                <option value="warning">Alerta (4-7 dias)</option>
                <option value="inactive">Inativo (&gt; 7 dias)</option>
              </select>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Último Login</th>
                  <th className="px-4 py-3">Último Agend.</th>
                  <th className="px-4 py-3">Último Caixa</th>
                  <th className="px-4 py-3">Geral</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEngagementStats.map((item) => {
                  const now = new Date().getTime();
                  const lastActive = item.ultimaAtividade ? new Date(item.ultimaAtividade).getTime() : 0;
                  const daysSince = lastActive > 0 ? Math.floor((now - lastActive) / (1000 * 60 * 60 * 24)) : 999;
                  
                  let statusColor = "bg-green-100 text-green-700";
                  let statusText = "Ativo";
                  
                  if (daysSince > 7) {
                    statusColor = "bg-red-100 text-red-700";
                    statusText = "Inativo (+7d)";
                  } else if (daysSince > 3) {
                    statusColor = "bg-amber-100 text-amber-700";
                    statusText = "Alerta (+3d)";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">{item.nome_negocio}</div>
                        <div className="text-[10px] text-gray-500">{item.email}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium uppercase">
                          {item.plano}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs">
                        {item.ultimoLogin ? new Date(item.ultimoLogin).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs">
                        {item.ultimoAgendamento ? new Date(item.ultimoAgendamento).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs">
                        {item.ultimaTransacao ? new Date(item.ultimaTransacao).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 text-xs">
                          {item.ultimaAtividade ? new Date(item.ultimaAtividade).toLocaleDateString('pt-BR') : 'Nenhuma'}
                        </div>
                        {item.ultimaAtividade && (
                          <div className="text-[10px] text-gray-500">
                            {daysSince === 0 ? 'Hoje' : daysSince === 1 ? 'Ontem' : `Há ${daysSince} dias`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600"
                          onClick={() => {
                            const phone = item.telefone?.replace(/\D/g, '');
                            if (phone) {
                              window.open(`https://wa.me/${phone}`, '_blank');
                            }
                          }}
                          title="Conversar no WhatsApp"
                          disabled={!item.telefone}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-xs text-orange-800 font-medium">O que define a atividade?</p>
                <p className="text-[10px] text-orange-600 mt-1 leading-relaxed">
                  A data de atividade geral é calculada com base na ação mais recente entre: login de administrador, 
                  criação de agendamentos ou movimentações no caixa. Isso ajuda a identificar quais clientes estão 
                  realmente utilizando a plataforma no dia a dia.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
