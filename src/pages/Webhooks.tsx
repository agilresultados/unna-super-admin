import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
    Activity,
    Search,
    Eye,
    Calendar,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Building2,
    FileJson
} from 'lucide-react';
import { superAdminService } from '@/services/super-admin.service';

interface WebhookLog {
    id: string;
    event: string;
    payload: any;
    processed: boolean;
    error: string | null;
    empresaId: string | null;
    createdAt: string;
    empresa?: {
        nome_negocio: string;
    };
}

const Webhooks = () => {
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    });

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const data = await superAdminService.getWebhookLogs({ page });
            setLogs(data.logs);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Erro ao buscar logs:', err);
            setError('Erro ao carregar logs de webhook.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getStatusBadge = (processed: boolean, error: string | null) => {
        if (error) {
            return (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">
                    <XCircle size={12} />
                    Erro
                </span>
            );
        }
        if (processed) {
            return (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                    <CheckCircle2 size={12} />
                    Processado
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700">
                <Clock size={12} />
                Pendente
            </span>
        );
    };

    const formatPayload = (payload: any) => {
        return JSON.stringify(payload, null, 2);
    };

    return (
        <div className="w-full min-w-0 max-w-full space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Monitoramento de Webhooks</h1>
                    <p className="text-sm text-gray-500">Histórico de eventos recebidos do Asaas</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => fetchLogs(pagination.page)} variant="outline" size="sm">
                        Atualizar
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Tabela de Logs */}
            <Card className="bg-white shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-4 py-3">Data / Hora</th>
                                <th className="px-4 py-3">Evento</th>
                                <th className="px-4 py-3">Empresa</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
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
                                        Nenhum webhook recebido ainda.
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group text-sm">
                                    <td className="px-4 py-3 text-gray-600">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{new Date(log.createdAt).toLocaleDateString('pt-BR')}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-[11px] font-semibold text-primary bg-primary/5 px-2 py-1 rounded">
                                            {log.event}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.empresa ? (
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-gray-400" />
                                                <span className="text-gray-900 font-medium">{log.empresa.nome_negocio}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">Desconhecida</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getStatusBadge(log.processed, log.error)}
                                        {log.error && <p className="text-[10px] text-red-500 mt-1 truncate max-w-[150px]">{log.error}</p>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 gap-2 text-primary"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <FileJson size={14} />
                                                Payload
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
                    <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Total: {pagination.total} logs
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
                            <span className="text-sm px-4 py-1">
                                Página {pagination.page} de {pagination.totalPages}
                            </span>
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

            {/* Modal de Payload */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2">
                                <FileJson className="text-primary" size={20} />
                                <h3 className="font-bold text-gray-900">Conteúdo do Webhook</h3>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                                Fechar
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            <div className="max-h-[70vh] overflow-y-auto bg-gray-950 p-6">
                                <pre className="text-green-400 font-mono text-xs leading-relaxed">
                                    {formatPayload(selectedLog.payload)}
                                </pre>
                            </div>
                        </CardContent>
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <Button onClick={() => setSelectedLog(null)}>Entendido</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Webhooks;
