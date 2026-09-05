import React, { useState, useEffect } from 'react';
import {
    Users, DollarSign, TrendingUp, Settings, Check, X, Loader2, RefreshCw,
    ArrowDownCircle, ToggleLeft, ToggleRight, Save, ExternalLink, ChevronDown, ChevronUp, ChevronRight, Receipt
} from 'lucide-react';
import {
    afiliadoService, AfiliadoConfig, Afiliado, SaqueAfiliado, MetricasGerais, ReconciliacaoGeral
} from '@/services/afiliado.service';
import { formatCurrencyDynamic, getCurrencyConfig } from '@/utils/currencyUtils';
import AfiliadoIndicacoesTreeView from '@/components/superadmin/AfiliadoIndicacoesTreeView';
import ExtratoAfiliado from '@/components/superadmin/ExtratoAfiliado';

interface ModalProcessar {
    saqueId: string;
    valor: number;
    empresa: string;
    aprovando: boolean;
}

const AfiliadosSuperAdmin: React.FC = () => {
    const [tab, setTab] = useState<'metricas' | 'config' | 'afiliados' | 'conferencia' | 'saques'>('metricas');
    const [config, setConfig] = useState<AfiliadoConfig | null>(null);
    const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
    const [saques, setSaques] = useState<SaqueAfiliado[]>([]);
    const [metricas, setMetricas] = useState<MetricasGerais | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filtroStatus, setFiltroStatus] = useState('');
    const [filtroSaqueStatus, setFiltroSaqueStatus] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Conferência do cache contra o livro-caixa. Roda sob demanda: varre todos
    // os afiliados, então não é coisa para disparar a cada troca de aba.
    const [reconciliacao, setReconciliacao] = useState<ReconciliacaoGeral | null>(null);
    const [reconciliando, setReconciliando] = useState(false);

    /** Qual afiliado está com o extrato aberto na lista. */
    const [extratoAberto, setExtratoAberto] = useState<string | null>(null);

    // Modal de processamento
    const [modal, setModal] = useState<ModalProcessar | null>(null);
    const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
    const [observacao, setObservacao] = useState('');
    const [processando, setProcessando] = useState(false);

    // Saques expandidos (para mostrar detalhes)
    const [expandido, setExpandido] = useState<string | null>(null);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [configData, metricasData] = await Promise.all([
                afiliadoService.getConfig(),
                afiliadoService.getMetricasGerais(),
            ]);
            setConfig(configData);
            setMetricas(metricasData);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoading(false);
        }
    };

    const carregarAfiliados = async (status?: string) => {
        try {
            const data = await afiliadoService.listarAfiliados(status || undefined);
            setAfiliados(data);
        } catch (err) {
            console.error('Erro ao carregar afiliados:', err);
        }
    };

    /**
     * Confere todos os saldos contra o livro-caixa.
     *
     * Sob demanda de propósito: varre afiliado por afiliado somando lançamentos,
     * então não é coisa para disparar sozinho a cada troca de aba.
     */
    const carregarReconciliacao = async () => {
        setReconciliando(true);
        setError('');
        try {
            setReconciliacao(await afiliadoService.reconciliar());
        } catch (err) {
            console.error('Erro ao conferir saldos:', err);
            setError('Não foi possível conferir os saldos.');
        } finally {
            setReconciliando(false);
        }
    };

    const carregarSaques = async (status?: string) => {
        try {
            const data = await afiliadoService.listarSaques(status || undefined);
            setSaques(data);
        } catch (err) {
            console.error('Erro ao carregar saques:', err);
        }
    };

    useEffect(() => {
        if (tab === 'afiliados') carregarAfiliados(filtroStatus);
    }, [tab, filtroStatus]);

    useEffect(() => {
        if (tab === 'saques') carregarSaques(filtroSaqueStatus);
    }, [tab, filtroSaqueStatus]);

    const salvarConfig = async () => {
        if (!config) return;
        try {
            setSaving(true);
            setError('');
            await afiliadoService.updateConfig(config);
            setSuccess('Configurações salvas com sucesso!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const abrirModal = (saque: SaqueAfiliado, aprovando: boolean) => {
        setModal({
            saqueId: saque.id,
            valor: saque.valor,
            empresa: saque.afiliado?.empresa?.nome_negocio || 'Empresa',
            aprovando,
        });
        setComprovanteFile(null);
        setObservacao('');
    };

    const fecharModal = () => {
        setModal(null);
        setComprovanteFile(null);
        setObservacao('');
    };

    const confirmarProcessamento = async () => {
        if (!modal) return;
        if (modal.aprovando && !comprovanteFile) {
            setError('Selecione o comprovante de transferência para aprovar o saque.');
            return;
        }
        try {
            setProcessando(true);
            setError('');
            await afiliadoService.processarSaque(
                modal.saqueId,
                modal.aprovando,
                modal.aprovando ? (comprovanteFile || undefined) : undefined,
                observacao.trim() || undefined
            );
            setSuccess(modal.aprovando ? 'Saque aprovado e notificação enviada!' : 'Saque rejeitado e valor devolvido ao afiliado.');
            setTimeout(() => setSuccess(''), 4000);
            fecharModal();
            await carregarSaques(filtroSaqueStatus);
            await carregarDados();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Erro ao processar saque');
        } finally {
            setProcessando(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Programa de Afiliados</h1>
                    <p className="text-muted-foreground text-sm mt-1">Gerenciamento global do programa de indicação</p>
                </div>
                <button onClick={carregarDados} className="p-2 rounded-lg hover:bg-accent transition-colors" title="Atualizar">
                    <RefreshCw size={16} className="text-muted-foreground" />
                </button>
            </div>

            {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">{error}</div>}
            {success && <div className="bg-green-500/10 text-green-600 p-3 rounded-lg text-sm">{success}</div>}

            {/* Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
                {(['metricas', 'config', 'afiliados', 'conferencia', 'saques'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t === 'metricas' ? 'Métricas' : t === 'config' ? 'Configurações' : t === 'afiliados' ? 'Afiliados' : t === 'conferencia' ? 'Conferência' : (
                            <span className="flex items-center justify-center gap-1">
                                Saques
                                {metricas && metricas.saquesPendentes > 0 && (
                                    <span className="bg-destructive text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {metricas.saquesPendentes}
                                    </span>
                                )}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Métricas */}
            {tab === 'metricas' && metricas && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-blue-500" />
                            <span className="text-xs text-muted-foreground">Total Afiliados</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{metricas.totalAfiliados}</p>
                        <p className="text-xs text-green-600">{metricas.afiliadosAtivos} ativos</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={16} className="text-green-500" />
                            <span className="text-xs text-muted-foreground">Indicações</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{metricas.totalIndicacoes}</p>
                        <p className="text-xs text-green-600">{metricas.indicacoesConfirmadas} confirmadas</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={16} className="text-purple-500" />
                            <span className="text-xs text-muted-foreground">Descontos Dados</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrencyDynamic(metricas.totalDescontoDistribuido)}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ArrowDownCircle size={16} className="text-orange-500" />
                            <span className="text-xs text-muted-foreground">Saques</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{metricas.totalSaques}</p>
                        <p className="text-xs text-yellow-600">{metricas.saquesPendentes} pendente(s)</p>
                    </div>
                </div>
            )}

            {/* Configurações */}
            {tab === 'config' && config && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setConfig({ ...config, habilitado: !config.habilitado })}
                                className="text-primary"
                            >
                                {config.habilitado ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                            </button>
                            <div>
                                <p className="font-semibold text-foreground">Programa {config.habilitado ? 'Ativo' : 'Desativado'}</p>
                                <p className="text-xs text-muted-foreground">Habilitar/desabilitar o programa de afiliados</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-xl border border-border mt-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setConfig({ ...config, restrito_beta: !config.restrito_beta })}
                                className="text-primary"
                            >
                                {config.restrito_beta ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                            </button>
                            <div>
                                <p className="font-semibold text-foreground">Modo Restrito (Beta)</p>
                                <p className="text-xs text-muted-foreground">Se ativo, apenas os e-mails abaixo poderão acessar o sistema de afiliados.</p>
                            </div>
                        </div>

                        {config.restrito_beta && (
                            <div className="mt-2">
                                <label className="text-sm font-medium text-foreground block mb-1">E-mails Permitidos (Um por linha)</label>
                                <textarea
                                    value={config.emails_permitidos?.join('\n') || ''}
                                    onChange={(e) => {
                                        const emails = e.target.value.split('\n').map(em => em.trim()).filter(Boolean);
                                        setConfig({ ...config, emails_permitidos: emails });
                                    }}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground min-h-[100px]"
                                    placeholder="empresa1@email.com&#10;empresa2@email.com"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mt-6">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Tipo de Recompensa</label>
                            <select
                                value={config.tipo_recompensa}
                                onChange={(e) => setConfig({ ...config, tipo_recompensa: e.target.value as 'fixo' | 'porcentagem' })}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
                            >
                                <option value="fixo">Valor Fixo ({getCurrencyConfig().symbol})</option>
                                <option value="porcentagem">Porcentagem (%)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">
                                Valor da Recompensa ({config.tipo_recompensa === 'fixo' ? getCurrencyConfig().symbol : '%'})
                            </label>
                            <input
                                type="number"
                                value={config.valor_recompensa}
                                onChange={(e) => setConfig({ ...config, valor_recompensa: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Valor Mínimo para Saque ({getCurrencyConfig().symbol})</label>
                            <input
                                type="number"
                                value={config.saque_minimo}
                                onChange={(e) => setConfig({ ...config, saque_minimo: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
                                step="1"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Dias de Inatividade para Perder Afiliação</label>
                            <input
                                type="number"
                                value={config.dias_inatividade}
                                onChange={(e) => setConfig({ ...config, dias_inatividade: parseInt(e.target.value) || 30 })}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setConfig({ ...config, zerar_saldo_inatividade: !config.zerar_saldo_inatividade })}
                            className="text-primary"
                        >
                            {config.zerar_saldo_inatividade ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-muted-foreground" />}
                        </button>
                        <div>
                            <p className="text-sm font-medium text-foreground">Zerar saldo de cashback na inatividade</p>
                            <p className="text-xs text-muted-foreground">Se ativo, o cashback acumulado também é zerado quando o afiliado fica inativo</p>
                        </div>
                    </div>

                    <button
                        onClick={salvarConfig}
                        disabled={saving}
                        className="bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Salvar Configurações
                    </button>
                </div>
            )}

            {/* Lista de Afiliados */}
            {tab === 'afiliados' && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Afiliados</h3>
                        <select
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                            className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
                        >
                            <option value="">Todos</option>
                            <option value="ATIVO">Ativos</option>
                            <option value="INATIVO">Inativos</option>
                            <option value="SUSPENSO">Suspensos</option>
                        </select>
                    </div>
                    {!afiliados.length ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Users size={40} className="mx-auto mb-3 opacity-30" />
                            <p>Nenhum afiliado encontrado</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {afiliados.map((af) => (
                                <div key={af.id}>
                                    <div className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">{af.empresa?.nome_negocio || 'Empresa'}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{af.codigo_referencia}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <div>
                                                <p className="text-sm text-foreground">{af._count?.indicacoes || 0} indicações</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Desc: {formatCurrencyDynamic(af.desconto_acumulado)} · CB: {formatCurrencyDynamic(af.saldo_cashback)}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${af.status === 'ATIVO' ? 'bg-green-500/10 text-green-600'
                                                        : af.status === 'INATIVO' ? 'bg-red-500/10 text-red-600'
                                                            : 'bg-yellow-500/10 text-yellow-600'
                                                    }`}
                                            >
                                                {af.status}
                                            </span>
                                            <button
                                                onClick={() => setExtratoAberto(extratoAberto === af.id ? null : af.id)}
                                                title="Ver extrato do livro-caixa"
                                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1.5 transition-colors"
                                            >
                                                <Receipt size={14} />
                                                {extratoAberto === af.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    {extratoAberto === af.id && (
                                        <div className="bg-muted/30 border-t border-border">
                                            <ExtratoAfiliado afiliadoId={af.id} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Conferência: cache vs livro-caixa */}
            {tab === 'conferencia' && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-foreground">Conferência de saldos</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Compara <code className="font-mono">saldo_cashback</code> com a soma dos lançamentos.
                                Divergência significa saldo alterado por fora do livro-caixa — investigue, não "corrija" no banco.
                            </p>
                        </div>
                        <button
                            onClick={carregarReconciliacao}
                            disabled={reconciliando}
                            className="shrink-0 flex items-center gap-2 bg-muted hover:bg-muted/70 text-foreground px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                        >
                            {reconciliando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            Conferir
                        </button>
                    </div>

                    {!reconciliacao ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            Clique em <strong>Conferir</strong> para rodar a checagem.
                        </div>
                    ) : reconciliacao.total_divergentes === 0 ? (
                        <div className="p-8 text-center">
                            <Check size={40} className="mx-auto mb-3 text-green-600" />
                            <p className="text-foreground font-medium">
                                {reconciliacao.total_afiliados} afiliado(s) conferidos, todos batendo.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Cada saldo é exatamente a soma dos seus lançamentos.</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 bg-destructive/10 border-b border-border">
                                <p className="text-sm font-medium text-destructive">
                                    {reconciliacao.total_divergentes} de {reconciliacao.total_afiliados} afiliado(s) não fecham.
                                </p>
                            </div>
                            <div className="divide-y divide-border">
                                {reconciliacao.divergentes.map((linha) => (
                                    <div key={linha.afiliadoId} className="p-4 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground truncate">{linha.nome_negocio || 'Empresa'}</p>
                                            <p className="text-xs text-muted-foreground font-mono truncate">{linha.afiliadoId}</p>
                                        </div>
                                        <div className="text-right shrink-0 text-xs">
                                            <p className="text-muted-foreground">
                                                Cache: <span className="text-foreground font-medium">{formatCurrencyDynamic(linha.saldo_cache)}</span>
                                            </p>
                                            <p className="text-muted-foreground">
                                                Livro-caixa: <span className="text-foreground font-medium">{formatCurrencyDynamic(linha.saldo_ledger)}</span>
                                            </p>
                                            <p className="text-destructive font-semibold mt-0.5">
                                                Diferença: {formatCurrencyDynamic(linha.divergencia)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Saques */}
            {tab === 'saques' && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Saques</h3>
                        <select
                            value={filtroSaqueStatus}
                            onChange={(e) => setFiltroSaqueStatus(e.target.value)}
                            className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
                        >
                            <option value="">Todos</option>
                            <option value="SOLICITADO">Pendentes</option>
                            <option value="PAGO">Pagos</option>
                            <option value="REJEITADO">Rejeitados</option>
                        </select>
                    </div>
                    {!saques.length ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
                            <p>Nenhum saque encontrado</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {saques.map((saque) => (
                                <div key={saque.id}>
                                    <div 
                                        className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${expandido === saque.id ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''}`}
                                        onClick={() => setExpandido(expandido === saque.id ? null : saque.id)}
                                    >
                                        <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                                            <div className="mt-1 md:mt-0 text-gray-400">
                                                {expandido === saque.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground flex items-center gap-2">
                                                    <span className="text-lg font-bold text-green-600">{formatCurrencyDynamic(saque.valor)}</span>
                                                    <span className="text-gray-300 hidden sm:inline">•</span>
                                                    <span className="text-sm sm:text-base">{saque.afiliado?.empresa?.nome_negocio || 'Empresa'}</span>
                                                </p>
                                                
                                                <div className="mt-2 flex flex-col gap-1">
                                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                        <span className="font-semibold uppercase tracking-wider text-gray-500">Solicitado em:</span> 
                                                        {new Date(saque.createdAt).toLocaleDateString('pt-BR', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                    {saque.processadoEm && (
                                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                            <span className="font-semibold uppercase tracking-wider text-gray-500">Processado em:</span> 
                                                            {new Date(saque.processadoEm).toLocaleDateString('pt-BR', {
                                                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>

                                                {saque.status === 'REJEITADO' && saque.observacao && (
                                                    <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                                                        <p className="text-xs text-red-700"><span className="font-bold">Motivo da Rejeição:</span> {saque.observacao}</p>
                                                    </div>
                                                )}
                                                
                                                {saque.status === 'PAGO' && (
                                                    <div className="mt-2">
                                                        {saque.observacao && (
                                                            <div className="p-2 bg-green-50 rounded-lg border border-green-100 mb-2">
                                                                <p className="text-xs text-green-700"><span className="font-bold">Observação:</span> {saque.observacao}</p>
                                                            </div>
                                                        )}
                                                        {saque.comprovante_url && (
                                                            <a
                                                                href={saque.comprovante_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors w-fit"
                                                            >
                                                                <ExternalLink size={12} /> Ver Comprovante
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:border-l md:border-border md:pl-4">
                                            <span className="text-[10px] text-gray-400 font-mono">ID: {saque.id.substring(0, 8)}</span>
                                            
                                            {saque.status === 'SOLICITADO' ? (
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => abrirModal(saque, true)}
                                                        disabled={processando}
                                                        className="px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                                                        title="Aprovar Saque"
                                                    >
                                                        <Check size={16} /> <span className="text-xs font-bold">Aprovar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => abrirModal(saque, false)}
                                                        disabled={processando}
                                                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                        title="Rejeitar Saque"
                                                    >
                                                        <X size={16} /> <span className="text-xs font-bold">Rejeitar</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span
                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        saque.status === 'PAGO' || saque.status === 'APROVADO'
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : 'bg-red-100 text-red-700 border border-red-200'
                                                        }`}
                                                >
                                                    {saque.status === 'PAGO' ? 'Pago' : saque.status === 'APROVADO' ? 'Aprovado' : 'Rejeitado'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {expandido === saque.id && (
                                        <AfiliadoIndicacoesTreeView afiliadoId={saque.afiliadoId} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de processamento */}
            {modal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-bold text-foreground text-lg mb-1">
                            {modal.aprovando ? 'Aprovar saque' : 'Rejeitar saque'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-5">
                            {modal.empresa} · {formatCurrencyDynamic(modal.valor)}
                        </p>

                        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">{error}</div>}

                        {modal.aprovando ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1">
                                        Comprovante de transferência <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setComprovanteFile(e.target.files?.[0] || null)}
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground mb-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                    <p className="text-xs text-muted-foreground">Envie a imagem ou PDF do comprovante Pix/Transferência.</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1">Motivo / Observação (Opcional)</label>
                                    <textarea
                                        value={observacao}
                                        onChange={(e) => setObservacao(e.target.value)}
                                        placeholder="Ex: Pagamento via Pix"
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-1">Motivo da rejeição</label>
                                <textarea
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                    placeholder="Rejeitado pelo administrador"
                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground mb-1 resize-none"
                                    rows={2}
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground">O valor será devolvido ao saldo do afiliado e ele será notificado.</p>
                            </div>
                        )}

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={fecharModal}
                                disabled={processando}
                                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarProcessamento}
                                disabled={processando || (modal.aprovando && !comprovanteFile)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${modal.aprovando ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}`}
                            >
                                {processando && <Loader2 size={14} className="animate-spin" />}
                                {modal.aprovando ? 'Confirmar aprovação' : 'Confirmar rejeição'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AfiliadosSuperAdmin;
