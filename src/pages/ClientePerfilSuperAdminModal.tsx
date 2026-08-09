import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Clock, User, Activity, Loader2, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { superAdminService } from '@/services/super-admin.service';
import { pacoteService, ClientePacote } from '@/services/pacote.service';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { formatCurrencyDynamic } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';

interface ClientePerfilSuperAdminModalProps {
    clienteId: string;
    isOpen: boolean;
    onClose: () => void;
    zIndex?: number;
}

const ClientePerfilSuperAdminModal: React.FC<ClientePerfilSuperAdminModalProps> = ({ clienteId, isOpen, onClose, zIndex }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'packages'>('overview');
    const [profile, setProfile] = useState<any>(null);
    const [pacotes, setPacotes] = useState<ClientePacote[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (isOpen && clienteId) {
            loadProfile();
        }
    }, [isOpen, clienteId]);

    const loadProfile = async (start?: string, end?: string) => {
        try {
            setLoading(true);
            const [profileData, packagesData] = await Promise.all([
                superAdminService.getClienteProfile(clienteId, start, end),
                pacoteService.getPacotesCliente(clienteId)
            ]);
            setProfile(profileData);
            setPacotes(packagesData || []);
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            toast.error('Não foi possível carregar os dados do cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        setActiveTab('overview');
    };

    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={cn(
                "flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs transition-all",
                activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            )}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={profile ? `${profile.cliente.nome} ${profile.cliente.sobrenome || ''}` : 'Perfil do Cliente (Super Admin)'}
            subtitle={profile ? `Empresa ID: ${profile.cliente.empresaId} • CPF: ${profile.cliente.cpf || '---'}` : 'Visão administrativa do histórico do cliente'}
            icon={<User size={24} />}
            size="5xl"
            className="p-0"
            zIndex={zIndex}
        >
            {loading ? (
                <div className="flex items-center justify-center p-20 min-h-[300px]">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <div className="flex flex-col p-1 min-h-[600px]">
                    <div className="flex items-center border-b dark:border-gray-800 mb-6 px-4">
                        <TabButton id="overview" label="Histórico e Resumo" icon={Activity} />
                        <TabButton id="packages" label="Pacotes" icon={Package} />
                    </div>

                    <div className="px-4 pb-4">
                        {activeTab === 'overview' && (
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm overflow-hidden ring-1 ring-gray-100/50 dark:ring-gray-700/50">
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <div className="p-2 bg-primary/5 text-primary rounded-lg mb-2">
                                                <DollarSign size={18} />
                                            </div>
                                            <span className="text-sm font-bold mb-0.5">Total Gasto</span>
                                            <span className="text-lg font-black text-gray-900 dark:text-white">
                                                {formatCurrencyDynamic(profile?.stats?.totalGasto || 0)}
                                            </span>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm overflow-hidden ring-1 ring-gray-100/50 dark:ring-gray-700/50">
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <div className="p-2 bg-primary/5 text-primary rounded-lg mb-2">
                                                <Calendar size={18} />
                                            </div>
                                            <span className="text-sm font-bold mb-0.5">Última Visita</span>
                                            <span className="text-md font-black text-gray-900 dark:text-white">
                                                {profile?.stats?.ultimaVisita ? new Date(profile?.stats?.ultimaVisita).toLocaleDateString('pt-BR') : 'Nunca'}
                                            </span>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm overflow-hidden ring-1 ring-gray-100/50 dark:ring-gray-700/50">
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <div className="p-2 bg-primary/5 text-primary rounded-lg mb-2">
                                                <Clock size={18} />
                                            </div>
                                            <span className="text-sm font-bold mb-0.5">Dias Afastada</span>
                                            <span className="text-md font-black text-gray-900 dark:text-white">
                                                {profile?.stats?.diasDesdeUltimaVisita ?? '-'}
                                            </span>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm overflow-hidden ring-1 ring-gray-100/50 dark:ring-gray-700/50">
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <div className="p-2 bg-primary/5 text-primary rounded-lg mb-2">
                                                <Activity size={18} />
                                            </div>
                                            <span className="text-sm font-bold mb-0.5">Frequência</span>
                                            <span className="text-md font-black text-gray-900 dark:text-white">
                                                {profile?.stats?.totalAgendamentos || 0}
                                            </span>
                                        </CardContent>
                                    </Card>

                                    <Card className={cn(
                                        "shadow-sm overflow-hidden ring-1",
                                        (profile?.cliente?.saldoDevedor || 0) > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-100"
                                    )}>
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <div className={cn("p-2 rounded-lg mb-1.5", (profile?.cliente?.saldoDevedor || 0) > 0 ? "bg-red-100 text-red-600" : "bg-gray-50 text-gray-400")}>
                                                <AlertCircle size={18} />
                                            </div>
                                            <span className="text-sm font-bold mb-0.5">Débito</span>
                                            <span className={cn("text-md font-black", (profile?.cliente?.saldoDevedor || 0) > 0 ? "text-red-700" : "text-gray-400")}>
                                                {formatCurrencyDynamic(profile?.cliente?.saldoDevedor || 0)}
                                            </span>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    <div className="lg:col-span-8 space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-md font-bold flex items-center gap-2 dark:text-white">
                                                Histórico de Atendimentos ({profile?.stats?.totalAgendamentos || 0})
                                            </h3>

                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-xl border dark:border-gray-700 shadow-sm">
                                                    <input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => {
                                                            setStartDate(e.target.value);
                                                            if (e.target.value && endDate) loadProfile(e.target.value, endDate);
                                                        }}
                                                        className="text-[10px] bg-transparent border-none focus:ring-0 outline-none p-1 font-bold"
                                                    />
                                                    <span className="text-gray-400 text-[10px] font-bold"> até </span>
                                                    <input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => {
                                                            setEndDate(e.target.value);
                                                            if (startDate && e.target.value) loadProfile(startDate, e.target.value);
                                                        }}
                                                        className="text-[10px] bg-transparent border-none focus:ring-0 outline-none p-1 font-bold"
                                                    />
                                                </div>
                                                {(!startDate && !endDate && (profile?.stats?.totalAgendamentos > 50)) && (
                                                    <span className="text-[9px] text-amber-500 font-bold">
                                                        Exibindo os últimos 50. Use o filtro para ver períodos anteriores.
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <Card className="border dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-gray-800 rounded-2xl">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                                                            <th className="px-4 py-3 text-left text-xs font-bold">Data / Hora</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold">Profissional</th>
                                                            <th className="px-4 py-3 text-left text-xs font-bold">Serviços</th>
                                                            <th className="px-4 py-3 text-center text-xs font-bold">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                        {profile?.historico?.map((ag: any) => (
                                                            <tr key={ag.id} className="hover:bg-primary/[0.01] transition-colors">
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-xs font-bold">{new Date(ag.data_hora_inicio).toLocaleDateString('pt-BR')}</span>
                                                                        <span className="text-[9px] text-gray-400 font-bold">{new Date(ag.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="text-[12px] font-bold text-gray-600 dark:text-gray-300">
                                                                        {ag.colaborador.nome}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <p className="text-[11px] font-bold text-gray-500 max-w-[200px] truncate">
                                                                        {ag.servicos.map((s: any) => s.servico.nome).join(', ')}
                                                                    </p>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className={cn(
                                                                        "inline-flex px-2 py-1 rounded-lg text-[8px] font-black uppercase",
                                                                        ag.status === 'concluido' ? 'bg-green-100 text-green-700' :
                                                                        ag.status === 'cancelado' ? 'bg-red-100 text-red-700' : 
                                                                        ag.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                                                                        ag.status === 'confirmado' ? 'bg-blue-100 text-blue-700' :
                                                                        ag.status === 'nao_compareceu' ? 'bg-purple-100 text-purple-700' :
                                                                        'bg-gray-100 text-gray-600'
                                                                    )}>
                                                                        {ag.status === 'nao_compareceu' ? 'faltou' : ag.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="lg:col-span-4 space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold flex items-center gap-2 dark:text-white px-1">
                                                <TrendingUp size={16} className="text-primary" /> Top Serviços
                                            </h3>
                                            <Card className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border">
                                                <div className="space-y-3">
                                                    {profile?.stats?.servicosMaisConsumidos?.map((s: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-[11px] font-bold">
                                                            <span className="text-gray-600 dark:text-gray-300">{s.nome}</span>
                                                            <span className="text-primary">{s.quantidade}x</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'packages' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pacotes.map((cp) => (
                                    <Card key={cp.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border">
                                        <h4 className="font-black text-[11px] mb-3">{cp.pacote?.nome}</h4>
                                        <div className="space-y-2">
                                            {cp.sessoes?.map((sessao, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl">
                                                    <span className="text-[10px] font-black uppercase text-gray-600">{sessao.servico?.nome}</span>
                                                    <span className="text-[11px] font-black text-primary">{sessao.quantidade_restante}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ClientePerfilSuperAdminModal;
