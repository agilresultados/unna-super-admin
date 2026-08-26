import React, { useEffect, useState } from 'react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    Globe2,
    Mail,
    RefreshCw,
    ShieldCheck,
    Smartphone,
    User,
    X
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import {
    AccountDeletionRequest,
    superAdminService
} from '@/services/super-admin.service';

const PAGE_LIMIT = 20;

const AccountDeletionRequests = () => {
    const [requests, setRequests] = useState<AccountDeletionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<AccountDeletionRequest | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: PAGE_LIMIT,
        totalPages: 0
    });

    const fetchRequests = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminService.getAccountDeletionRequests({
                page,
                limit: pagination.limit
            });
            setRequests(response.data);
            setPagination(response.pagination);
        } catch (err) {
            console.error('Erro ao buscar solicitações LGPD:', err);
            setError('Erro ao carregar solicitações LGPD de exclusão de conta.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(1);
    }, []);

    const formatDate = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';

        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const formatCnpj = (cnpj?: string | null) => {
        if (!cnpj) return '-';
        const digits = cnpj.replace(/\D/g, '');
        if (digits.length !== 14) return cnpj;
        return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    };

    const getRequesterName = (request: AccountDeletionRequest) => {
        return request.usuario?.nome || request.usuario?.email || 'Solicitante não informado';
    };

    const renderStatusBadge = () => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
            <Clock size={12} />
            Solicitada
        </span>
    );

    const renderAwareness = (label: string, checked: boolean) => (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <span className="text-sm text-gray-600">{label}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${checked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {checked ? <CheckCircle2 size={12} /> : <X size={12} />}
                {checked ? 'Sim' : 'Não'}
            </span>
        </div>
    );

    const renderRequester = (request: AccountDeletionRequest) => (
        <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{getRequesterName(request)}</p>
            <p className="truncate text-xs text-gray-500">{request.usuario?.email || '-'}</p>
        </div>
    );

    const renderCompany = (request: AccountDeletionRequest) => (
        <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{request.empresa?.nome_negocio || 'Empresa não informada'}</p>
            <p className="truncate text-xs text-gray-500">
                {request.empresa?.assinatura?.plano?.nome || 'Plano não informado'}
                {request.empresa?.assinatura?.status ? ` · ${request.empresa.assinatura.status}` : ''}
            </p>
        </div>
    );

    const renderDate = (createdAt: string) => {
        const formatted = formatDate(createdAt);
        if (typeof formatted === 'string') return <span>-</span>;

        return (
            <div className="flex flex-col">
                <span className="font-medium">{formatted.date}</span>
                <span className="text-[10px] text-gray-400">{formatted.time}</span>
            </div>
        );
    };

    return (
        <div className="w-full min-w-0 max-w-full space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Solicitações LGPD</h1>
                    <p className="text-sm text-gray-500">Pedidos de exclusão de conta recebidos pelo fluxo de privacidade</p>
                </div>
                <Button
                    onClick={() => fetchRequests(pagination.page)}
                    variant="outline"
                    size="sm"
                    className="gap-2 self-start"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Atualizar
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <Card className="hidden overflow-hidden border bg-white py-0 shadow-sm md:flex">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Protocolo</th>
                                <th className="px-4 py-3">Empresa</th>
                                <th className="px-4 py-3">Solicitante</th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">IP</th>
                                <th className="px-4 py-3 text-right">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                                            Carregando...
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                                        Nenhuma solicitação LGPD registrada.
                                    </td>
                                </tr>
                            ) : requests.map((request) => (
                                <tr key={request.id} className="group text-sm transition-colors hover:bg-blue-50/30">
                                    <td className="px-4 py-3">{renderStatusBadge()}</td>
                                    <td className="px-4 py-3">
                                        <span className="rounded bg-primary/5 px-2 py-1 font-mono text-[11px] font-semibold text-primary">
                                            {request.protocolo}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{renderCompany(request)}</td>
                                    <td className="px-4 py-3">{renderRequester(request)}</td>
                                    <td className="px-4 py-3 text-gray-600">{renderDate(request.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-gray-600">{request.ip || '-'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 gap-2 text-primary"
                                                onClick={() => setSelectedRequest(request)}
                                            >
                                                <Eye size={14} />
                                                Ver
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="space-y-3 md:hidden">
                {loading ? (
                    <Card className="border bg-white py-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                                Carregando...
                            </div>
                        </CardContent>
                    </Card>
                ) : requests.length === 0 ? (
                    <Card className="border bg-white py-0 shadow-sm">
                        <CardContent className="p-6 text-center text-sm text-gray-500">
                            Nenhuma solicitação LGPD registrada.
                        </CardContent>
                    </Card>
                ) : requests.map((request) => (
                    <Card key={request.id} className="border bg-white py-0 shadow-sm">
                        <CardContent className="space-y-4 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-2">
                                    {renderStatusBadge()}
                                    <p className="truncate font-mono text-xs font-semibold text-primary">{request.protocolo}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 shrink-0 gap-2 text-primary"
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    <Eye size={14} />
                                    Ver
                                </Button>
                            </div>
                            <div className="grid gap-3 text-sm">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Empresa</p>
                                    {renderCompany(request)}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Solicitante</p>
                                    {renderRequester(request)}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Data</p>
                                        <div className="text-gray-700">{renderDate(request.createdAt)}</div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">IP</p>
                                        <p className="truncate font-mono text-xs text-gray-600">{request.ip || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex flex-col gap-3 rounded-lg border bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-500">
                        Total: {pagination.total} solicitações
                    </span>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1 || loading}
                            onClick={() => fetchRequests(pagination.page - 1)}
                        >
                            Anterior
                        </Button>
                        <span className="px-2 text-sm text-gray-700">
                            Página {pagination.page} de {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages || loading}
                            onClick={() => fetchRequests(pagination.page + 1)}
                        >
                            Próxima
                        </Button>
                    </div>
                </div>
            )}

            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <Card className="max-h-[90vh] w-full max-w-3xl overflow-hidden bg-white py-0 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between gap-4 border-b bg-gray-50 p-4">
                            <div className="flex min-w-0 items-center gap-2">
                                <ShieldCheck className="shrink-0 text-primary" size={20} />
                                <div className="min-w-0">
                                    <h3 className="truncate font-bold text-gray-900">Detalhes da solicitação</h3>
                                    <p className="truncate font-mono text-xs text-primary">{selectedRequest.protocolo}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(null)}>
                                Fechar
                            </Button>
                        </div>

                        <CardContent className="overflow-y-auto p-0">
                            <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
                                <div className="space-y-4 border-b p-5 md:border-b-0 md:border-r">
                                    <div>
                                        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <User size={14} />
                                            Solicitante
                                        </p>
                                        <p className="font-semibold text-gray-900">{getRequesterName(selectedRequest)}</p>
                                        <p className="text-sm text-gray-500">{selectedRequest.usuario?.email || '-'}</p>
                                        <p className="text-sm text-gray-500">{selectedRequest.usuario?.telefone || 'Telefone não informado'}</p>
                                        <p className="mt-1 text-xs text-gray-400">{selectedRequest.usuario?.role || 'Role não informada'}</p>
                                    </div>

                                    <div>
                                        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <Mail size={14} />
                                            Empresa
                                        </p>
                                        <p className="font-semibold text-gray-900">{selectedRequest.empresa?.nome_negocio || 'Empresa não informada'}</p>
                                        <p className="text-sm text-gray-500">{selectedRequest.empresa?.email || '-'}</p>
                                        <p className="text-sm text-gray-500">CNPJ: {formatCnpj(selectedRequest.empresa?.cnpj)}</p>
                                        <p className="mt-1 text-xs text-gray-400">
                                            {selectedRequest.empresa?.assinatura?.plano?.nome || 'Plano não informado'}
                                            {selectedRequest.empresa?.assinatura?.status ? ` · ${selectedRequest.empresa.assinatura.status}` : ''}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                <Calendar size={13} />
                                                Data
                                            </p>
                                            <div className="text-sm text-gray-700">{renderDate(selectedRequest.createdAt)}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                <Globe2 size={13} />
                                                IP
                                            </p>
                                            <p className="truncate font-mono text-xs text-gray-700">{selectedRequest.ip || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-5">
                                    <div>
                                        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <FileText size={14} />
                                            Motivo
                                        </p>
                                        <div className="min-h-24 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
                                            {selectedRequest.motivo || 'Motivo não informado.'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Ciência</p>
                                        {renderAwareness('Ciente do prazo informado', selectedRequest.cientePrazo)}
                                        {renderAwareness('Ciente da irreversibilidade', selectedRequest.cienteIrreversivel)}
                                        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                            <span className="text-sm text-gray-600">Prazo informado</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {selectedRequest.prazoInformadoHoras ?? '-'} horas
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <Smartphone size={14} />
                                            User-agent
                                        </p>
                                        <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-gray-950 p-3">
                                            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-green-400">
                                                {selectedRequest.userAgent || 'Não informado'}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AccountDeletionRequests;
