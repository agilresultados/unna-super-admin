import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    ShieldCheck,
    Cpu,
    HardDrive,
    Server,
    FileJson,
    RefreshCw,
    Search
} from 'lucide-react';
import { superAdminService, CronLog, WorkerHealth } from '@/services/super-admin.service';
import Input from '@/components/ui/Input';

const WorkerMonitoring = () => {
    const [logs, setLogs] = useState<CronLog[]>([]);
    const [health, setHealth] = useState<WorkerHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<CronLog | null>(null);
    
    // Filters
    const [jobFilter, setJobFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
    });

    const fetchHealth = async () => {
        try {
            const data = await superAdminService.getWorkerHealth();
            setHealth(data);
        } catch (err) {
            console.error('Erro ao buscar health:', err);
        }
    };

    const fetchLogs = async (page = 1) => {
        try {
            setLogsLoading(true);
            const data = await superAdminService.getCronLogs({ 
                page, 
                limit: pagination.limit,
                job: jobFilter || undefined,
                status: statusFilter || undefined
            });
            setLogs(data.data);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Erro ao buscar logs:', err);
            setError('Erro ao carregar logs de cron.');
        } finally {
            setLogsLoading(false);
        }
    };

    const initialize = async () => {
        setLoading(true);
        await Promise.all([fetchHealth(), fetchLogs(1)]);
        setLoading(false);
    };

    useEffect(() => {
        initialize();
    }, []);

    const handleSearch = () => {
        fetchLogs(1);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                        <CheckCircle2 size={12} />
                        Sucesso
                    </span>
                );
            case 'failed':
                return (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">
                        <XCircle size={12} />
                        Falha
                    </span>
                );
            case 'running':
                return (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700">
                        <Clock size={12} />
                        Executando
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                        {status}
                    </span>
                );
        }
    };

    const formatDuration = (ms?: number) => {
        if (ms === undefined || ms === null) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds?: number) => {
        if (!seconds) return '-';
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 || parts.length === 0) parts.push(`${s}s`);
        
        return parts.join(' ');
    };

    return (
        <div className="w-full min-w-0 max-w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Monitoramento do Sistema</h1>
                    <p className="text-sm text-gray-500">Status do microserviço Worker e histórico de tarefas automáticas</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={initialize} variant="outline" size="sm" className="gap-2">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Atualizar Tudo
                    </Button>
                </div>
            </div>

            {/* Health Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-none shadow-sm overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${health?.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                <Server size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Status Worker</p>
                                <p className={`text-xl font-bold uppercase ${health?.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                                    {health?.status || 'Offline'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Uptime</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatUptime(health?.uptime)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                                <Cpu size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Memória (Heap)</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {health?.memoryUsage ? formatBytes(health.memoryUsage.heapUsed) : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Versão</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {health?.version || '1.0.0'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Logs Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="text-primary" size={20} />
                        Histórico de Cron Jobs
                    </h2>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Input
                                placeholder="Filtrar por Job..."
                                value={jobFilter}
                                onChange={(e) => setJobFilter(e.target.value)}
                                className="pl-9"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                        <select 
                            className="bg-white border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Todos Status</option>
                            <option value="success">Sucesso</option>
                            <option value="failed">Falha</option>
                            <option value="running">Executando</option>
                        </select>
                        <Button onClick={handleSearch} size="sm">Filtrar</Button>
                    </div>
                </div>

                <Card className="bg-white shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                                    <th className="px-4 py-3">Início</th>
                                    <th className="px-4 py-3">Tarefa (Job)</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Duração</th>
                                    <th className="px-4 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logsLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                Carregando...
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500 text-sm">
                                            Nenhum log encontrado para esses filtros.
                                        </td>
                                    </tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group text-sm">
                                        <td className="px-4 py-3 text-gray-600">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{new Date(log.started_at).toLocaleDateString('pt-BR')}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(log.started_at).toLocaleTimeString('pt-BR')}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-[11px] font-semibold text-primary bg-primary/5 px-2 py-1 rounded">
                                                {log.job_name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(log.status)}
                                            {log.error_message && (
                                                <p className="text-[10px] text-red-500 mt-1 truncate max-w-[200px]" title={log.error_message}>
                                                    {log.error_message}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {formatDuration(log.duration_ms)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-2 text-primary"
                                                    onClick={() => setSelectedLog(log)}
                                                    disabled={!log.details && !log.error_message}
                                                >
                                                    <FileJson size={14} />
                                                    Detalhes
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-xs text-gray-500">
                                Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} registros total)
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page <= 1}
                                    onClick={() => fetchLogs(pagination.page - 1)}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => fetchLogs(pagination.page + 1)}
                                >
                                    Próxima
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal de Detalhes */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2">
                                <FileJson className="text-primary" size={20} />
                                <h3 className="font-bold text-gray-900">Detalhes da Execução</h3>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                                Fechar
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            <div className="max-h-[70vh] overflow-y-auto bg-gray-950 p-6">
                                {selectedLog.error_message && (
                                    <div className="mb-4">
                                        <p className="text-red-400 font-bold text-xs uppercase mb-2">Erro:</p>
                                        <pre className="text-red-300 font-mono text-xs whitespace-pre-wrap bg-red-950/30 p-3 rounded border border-red-900/50">
                                            {selectedLog.error_message}
                                        </pre>
                                    </div>
                                )}
                                {selectedLog.details && (
                                    <div>
                                        <p className="text-green-400 font-bold text-xs uppercase mb-2">Payload / Detalhes:</p>
                                        <pre className="text-green-300 font-mono text-xs leading-relaxed">
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <Button onClick={() => setSelectedLog(null)}>Fechar</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default WorkerMonitoring;
