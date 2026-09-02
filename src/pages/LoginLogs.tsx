import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
    AlertCircle,
    Building2,
    FileJson,
    Search,
    XCircle,
} from 'lucide-react';
import { LoginLog, superAdminService } from '@/services/super-admin.service';

const MOTIVO_LABEL: Record<string, string> = {
    identificador_ausente: 'Sem e-mail/telefone',
    usuario_nao_encontrado: 'Usuário não encontrado',
    senha_incorreta: 'Senha incorreta',
    usuario_inativo: 'Usuário inativo',
    usuario_suspenso: 'Usuário suspenso',
    email_pendente_verificacao: 'E-mail pendente',
    empresa_suspensa: 'Empresa suspensa',
    token_invalido: 'Token inválido',
    oauth_falhou: 'OAuth falhou',
    erro_prisma: 'Erro de banco',
    erro_inesperado: 'Erro inesperado',
};

const LoginLogs = () => {
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<LoginLog | null>(null);
    const [identificador, setIdentificador] = useState('');
    const [motivo, setMotivo] = useState('');
    const [metodo, setMetodo] = useState('');
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
    });

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const data = await superAdminService.getLoginLogs({
                page,
                limit: pagination.limit,
                identificador: identificador || undefined,
                motivo: motivo || undefined,
                metodo: metodo || undefined,
            });
            setLogs(data.data);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Erro ao buscar logs de login:', err);
            setError('Erro ao carregar logs de login.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="w-full min-w-0 max-w-full space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Logs de login</h1>
                    <p className="text-sm text-gray-500">
                        Falhas de autenticação gravadas no banco — motivo real, identificador, IP e o que aconteceu.
                    </p>
                </div>
                <Button onClick={() => fetchLogs(pagination.page)} variant="outline" size="sm">
                    Atualizar
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-2">
                <Input
                    placeholder="E-mail ou telefone tentado"
                    value={identificador}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentificador(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && fetchLogs(1)}
                />
                <select
                    className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                >
                    <option value="">Todos os motivos</option>
                    {Object.entries(MOTIVO_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <select
                    className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    value={metodo}
                    onChange={(e) => setMetodo(e.target.value)}
                >
                    <option value="">Todos os métodos</option>
                    <option value="senha">Senha</option>
                    <option value="google">Google</option>
                    <option value="apple">Apple</option>
                </select>
                <Button onClick={() => fetchLogs(1)} size="sm" className="gap-2">
                    <Search size={14} />
                    Filtrar
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <Card className="bg-white shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-4 py-3">Data / Hora</th>
                                <th className="px-4 py-3">Identificador</th>
                                <th className="px-4 py-3">Motivo</th>
                                <th className="px-4 py-3">Método</th>
                                <th className="px-4 py-3">Empresa</th>
                                <th className="px-4 py-3 text-right">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                                        Nenhuma falha de login registrada ainda.
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-blue-50/30 transition-colors text-sm">
                                    <td className="px-4 py-3 text-gray-600">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{new Date(log.createdAt).toLocaleDateString('pt-BR')}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{log.identificador || '—'}</div>
                                        {log.usuario?.nome && (
                                            <div className="text-[10px] text-gray-400">{log.usuario.nome}</div>
                                        )}
                                        {log.ip && <div className="text-[10px] text-gray-400">{log.ip}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700 w-fit">
                                            <XCircle size={12} />
                                            {MOTIVO_LABEL[log.motivo] || log.motivo}
                                        </span>
                                        {log.mensagem && (
                                            <p className="text-[10px] text-red-500 mt-1 truncate max-w-[220px]">{log.mensagem}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[11px] uppercase">{log.metodo}</td>
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
                                        <div className="flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 gap-2 text-primary"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <FileJson size={14} />
                                                O que aconteceu
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total: {pagination.total} logs</span>
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

            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl bg-white shadow-2xl overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2">
                                <FileJson className="text-primary" size={20} />
                                <h3 className="font-bold text-gray-900">O que aconteceu</h3>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                                Fechar
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            <div className="max-h-[70vh] overflow-y-auto bg-gray-950 p-6">
                                <pre className="text-green-400 font-mono text-xs leading-relaxed">
                                    {JSON.stringify({
                                        motivo: selectedLog.motivo,
                                        metodo: selectedLog.metodo,
                                        identificador: selectedLog.identificador,
                                        mensagem: selectedLog.mensagem,
                                        ip: selectedLog.ip,
                                        userAgent: selectedLog.userAgent,
                                        usuario: selectedLog.usuario,
                                        empresa: selectedLog.empresa,
                                        detalhes: selectedLog.detalhes,
                                        createdAt: selectedLog.createdAt,
                                    }, null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default LoginLogs;
