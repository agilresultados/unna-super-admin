import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
    Wallet,
    ShieldCheck,
    ShieldAlert,
    Loader2,
    Percent,
    RefreshCw,
    Ban,
    Play,
    AlertTriangle,
} from 'lucide-react';
import {
    unnaPayAdminService,
    ROTULO_STATUS_SUBCONTA,
    type SubcontaResumo,
    type SubcontaDossie,
    type UnnaPayConfig,
} from '@/services/unna-pay.service';

const FILTROS = [
    { valor: 'solicitado', rotulo: 'Aguardando análise' },
    { valor: 'em_analise_asaas', rotulo: 'Em análise (Asaas)' },
    { valor: 'aprovado', rotulo: 'Ativas' },
    { valor: 'rejeitado_unna', rotulo: 'Recusadas' },
    { valor: 'desabilitado', rotulo: 'Desabilitadas' },
    { valor: '', rotulo: 'Todas' },
];

/**
 * Fila de análise das subcontas do Unna Pay.
 *
 * Aprovar aqui CRIA a conta no Asaas e é irreversível: a apiKey vem uma única
 * vez e não há como apagar uma subconta. Por isso a ação pede confirmação
 * explícita e o dossiê mostra os dados antes.
 */
export default function Subcontas() {
    const [filtro, setFiltro] = useState('solicitado');
    const [lista, setLista] = useState<SubcontaResumo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [dossie, setDossie] = useState<SubcontaDossie | null>(null);
    const [agindo, setAgindo] = useState(false);
    const [config, setConfig] = useState<UnnaPayConfig | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => { carregar(); }, [filtro]);
    useEffect(() => { carregarConfig(); }, []);

    const carregar = async () => {
        try {
            setCarregando(true);
            setErro(null);
            setLista(await unnaPayAdminService.listar(filtro || undefined));
        } catch (e: any) {
            setErro(e?.message || 'Erro ao carregar subcontas');
        } finally {
            setCarregando(false);
        }
    };

    const carregarConfig = async () => {
        try {
            setConfig(await unnaPayAdminService.getConfig());
        } catch {
            // Config indisponível não impede analisar a fila.
        }
    };

    const abrirDossie = async (empresaId: string) => {
        try {
            setDossie(await unnaPayAdminService.getDossie(empresaId));
        } catch (e: any) {
            setErro(e?.message || 'Erro ao carregar o dossiê');
        }
    };

    const aprovar = async (empresaId: string, nome?: string) => {
        const ok = window.confirm(
            `Aprovar a conta de recebimento de "${nome || empresaId}"?\n\n` +
            'Isto CRIA uma conta no Asaas. A credencial é devolvida uma única vez e ' +
            'a conta não pode ser apagada depois. Confirme só se os dados estiverem certos.',
        );
        if (!ok) return;

        try {
            setAgindo(true);
            setErro(null);
            const atualizado = await unnaPayAdminService.aprovar(empresaId);
            setDossie(atualizado);
            await carregar();
        } catch (e: any) {
            setErro(e?.message || 'Falha ao aprovar');
        } finally {
            setAgindo(false);
        }
    };

    const rejeitar = async (empresaId: string) => {
        const motivo = window.prompt('Motivo da recusa (a empresa vai ler isto):');
        if (!motivo?.trim()) return;

        try {
            setAgindo(true);
            setDossie(await unnaPayAdminService.rejeitar(empresaId, motivo.trim()));
            await carregar();
        } catch (e: any) {
            setErro(e?.message || 'Falha ao recusar');
        } finally {
            setAgindo(false);
        }
    };

    const alternarHabilitacao = async (sub: SubcontaDossie) => {
        try {
            setAgindo(true);
            if (sub.status === 'desabilitado') {
                setDossie(await unnaPayAdminService.reabilitar(sub.empresaId));
            } else {
                const motivo = window.prompt('Motivo da desabilitação (opcional):') || undefined;
                setDossie(await unnaPayAdminService.desabilitar(sub.empresaId, motivo));
            }
            await carregar();
        } catch (e: any) {
            setErro(e?.message || 'Falha ao alterar a habilitação');
        } finally {
            setAgindo(false);
        }
    };

    const definirTaxa = async (empresaId: string, atual?: number | null) => {
        const entrada = window.prompt(
            'Taxa da Unna para esta empresa (%). Deixe vazio para usar a taxa global.',
            atual != null ? String(atual) : '',
        );
        if (entrada === null) return;

        try {
            setAgindo(true);
            const taxa = entrada.trim() === '' ? null : Number(entrada.replace(',', '.'));
            setDossie(await unnaPayAdminService.definirTaxa(empresaId, taxa));
            await carregar();
        } catch (e: any) {
            setErro(e?.message || 'Falha ao definir a taxa');
        } finally {
            setAgindo(false);
        }
    };

    const reprovisionar = async (empresaId: string) => {
        try {
            setAgindo(true);
            await unnaPayAdminService.reprovisionarWebhook(empresaId);
            setDossie(await unnaPayAdminService.getDossie(empresaId));
        } catch (e: any) {
            setErro(e?.message || 'Falha ao reprovisionar o webhook');
        } finally {
            setAgindo(false);
        }
    };

    const salvarConfig = async (patch: Partial<UnnaPayConfig>) => {
        try {
            setConfig(await unnaPayAdminService.updateConfig(patch));
        } catch (e: any) {
            setErro(e?.message || 'Falha ao salvar a configuração');
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Wallet className="w-6 h-6" />
                    Unna Pay — Subcontas
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Empresas recebendo do cliente final. Aprovar cria a conta no Asaas e guarda a
                    credencial cifrada — ação irreversível.
                </p>
            </div>

            {erro && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{erro}</span>
                </div>
            )}

            {config && (
                <Card>
                    <CardContent className="flex flex-wrap items-end gap-6 py-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={config.habilitado}
                                onChange={(e) => salvarConfig({ habilitado: e.target.checked })}
                            />
                            <span>
                                <strong>Unna Pay ativo</strong>
                                <span className="block text-xs text-muted-foreground">
                                    Desligar corta a emissão de cobrança em toda a base.
                                </span>
                            </span>
                        </label>

                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                                Taxa padrão (%)
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    className="w-28"
                                    defaultValue={config.taxa_percentual_padrao}
                                    onBlur={(e: any) =>
                                        salvarConfig({ taxa_percentual_padrao: Number(e.target.value) })
                                    }
                                />
                                <Percent className="w-4 h-4 self-center text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-wrap gap-2">
                {FILTROS.map((f) => (
                    <button
                        key={f.valor || 'todas'}
                        onClick={() => setFiltro(f.valor)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${filtro === f.valor
                                ? 'bg-primary text-white border-primary'
                                : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        {f.rotulo}
                    </button>
                ))}
                <Button variant="outline" onClick={carregar} className="ml-auto">
                    <RefreshCw className={`w-4 h-4 mr-2 ${carregando ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {carregando ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
            ) : lista.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Nenhuma subconta neste filtro.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {lista.map((sub) => (
                        <Card key={sub.id}>
                            <CardContent className="flex flex-wrap items-center gap-4 py-4">
                                <div className="flex-1 min-w-[200px]">
                                    <p className="font-medium">{sub.empresa?.nome_negocio || sub.empresaId}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {sub.empresa?.email || 'sem e-mail'}
                                        {sub.solicitado_em &&
                                            ` · solicitado em ${new Date(sub.solicitado_em).toLocaleDateString('pt-BR')}`}
                                    </p>
                                </div>

                                <BadgeStatus status={sub.status} />

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => abrirDossie(sub.empresaId)}>
                                        Ver dossiê
                                    </Button>
                                    {sub.status === 'solicitado' && (
                                        <>
                                            <Button
                                                onClick={() => aprovar(sub.empresaId, sub.empresa?.nome_negocio)}
                                                disabled={agindo}
                                            >
                                                <ShieldCheck className="w-4 h-4 mr-1" />
                                                Aprovar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => rejeitar(sub.empresaId)}
                                                disabled={agindo}
                                            >
                                                <ShieldAlert className="w-4 h-4 mr-1" />
                                                Recusar
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {dossie && (
                <ModalDossie
                    dossie={dossie}
                    agindo={agindo}
                    onFechar={() => setDossie(null)}
                    onAprovar={() => aprovar(dossie.empresaId, dossie.empresa?.nome_negocio)}
                    onRejeitar={() => rejeitar(dossie.empresaId)}
                    onAlternar={() => alternarHabilitacao(dossie)}
                    onTaxa={() => definirTaxa(dossie.empresaId, dossie.taxa_percentual)}
                    onReprovisionar={() => reprovisionar(dossie.empresaId)}
                />
            )}
        </div>
    );
}

function BadgeStatus({ status }: { status: string }) {
    const tons: Record<string, string> = {
        aprovado: 'bg-green-100 text-green-700',
        solicitado: 'bg-amber-100 text-amber-700',
        em_analise_asaas: 'bg-blue-100 text-blue-700',
        criando_conta: 'bg-blue-100 text-blue-700',
        rejeitado_unna: 'bg-red-100 text-red-700',
        rejeitado_asaas: 'bg-red-100 text-red-700',
        desabilitado: 'bg-gray-200 text-gray-700',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tons[status] || 'bg-gray-100 text-gray-600'}`}>
            {ROTULO_STATUS_SUBCONTA[status as keyof typeof ROTULO_STATUS_SUBCONTA] || status}
        </span>
    );
}

function ModalDossie({
    dossie,
    agindo,
    onFechar,
    onAprovar,
    onRejeitar,
    onAlternar,
    onTaxa,
    onReprovisionar,
}: {
    dossie: SubcontaDossie;
    agindo: boolean;
    onFechar: () => void;
    onAprovar: () => void;
    onRejeitar: () => void;
    onAlternar: () => void;
    onTaxa: () => void;
    onReprovisionar: () => void;
}) {
    const kyc = dossie.dados_kyc || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-4">
                    <div>
                        <h3 className="font-semibold">{dossie.empresa?.nome_negocio || dossie.empresaId}</h3>
                        <BadgeStatus status={dossie.status} />
                    </div>
                    <Button variant="outline" onClick={onFechar}>Fechar</Button>
                </div>

                <div className="p-5 space-y-5">
                    <Secao titulo="Dados do titular">
                        <Linha rotulo="Nome / razão social" valor={kyc.nome_titular} />
                        <Linha rotulo="CPF / CNPJ" valor={kyc.cpf_cnpj} />
                        <Linha rotulo="E-mail" valor={kyc.email} />
                        <Linha rotulo="Celular" valor={kyc.telefone_celular} />
                        <Linha rotulo="Nascimento" valor={kyc.data_nascimento} />
                        <Linha rotulo="Tipo de empresa" valor={kyc.tipo_empresa} />
                        <Linha
                            rotulo="Faturamento estimado"
                            valor={kyc.faturamento_mensal ? `R$ ${Number(kyc.faturamento_mensal).toFixed(2)}` : null}
                        />
                        <Linha
                            rotulo="Endereço"
                            valor={
                                kyc.logradouro
                                    ? `${kyc.logradouro}, ${kyc.numero} — ${kyc.bairro} · ${kyc.cep}`
                                    : null
                            }
                        />
                    </Secao>

                    <Secao titulo="Conta no Asaas">
                        <Linha rotulo="Account ID" valor={dossie.asaas_account_id} />
                        <Linha rotulo="Wallet" valor={dossie.asaas_wallet_id} />
                        <Linha
                            rotulo="Credencial guardada"
                            valor={dossie.credencial_armazenada ? `sim (····${dossie.api_key_last4 || '????'})` : 'não'}
                        />
                        <Linha rotulo="Webhook" valor={dossie.webhook_configurado ? 'configurado' : 'não configurado'} />
                        <Linha rotulo="Análise comercial" valor={dossie.status_comercial} />
                        <Linha rotulo="Documentação" valor={dossie.status_documentacao} />
                        <Linha rotulo="Conta bancária" valor={dossie.status_conta_bancaria} />
                        <Linha
                            rotulo="Taxa da Unna"
                            valor={dossie.taxa_percentual != null ? `${dossie.taxa_percentual}%` : 'taxa global'}
                        />
                    </Secao>

                    {(dossie.motivo_rejeicao || dossie.motivo_pendencia) && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                            {dossie.motivo_rejeicao || dossie.motivo_pendencia}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {dossie.status === 'solicitado' && (
                            <>
                                <Button onClick={onAprovar} disabled={agindo}>
                                    <ShieldCheck className="w-4 h-4 mr-1" />
                                    Aprovar e criar conta
                                </Button>
                                <Button variant="outline" onClick={onRejeitar} disabled={agindo}>
                                    Recusar
                                </Button>
                            </>
                        )}

                        {dossie.asaas_account_id && (
                            <>
                                <Button variant="outline" onClick={onTaxa} disabled={agindo}>
                                    <Percent className="w-4 h-4 mr-1" />
                                    Definir taxa
                                </Button>
                                <Button variant="outline" onClick={onReprovisionar} disabled={agindo}>
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    Reprovisionar webhook
                                </Button>
                                <Button variant="outline" onClick={onAlternar} disabled={agindo}>
                                    {dossie.status === 'desabilitado' ? (
                                        <><Play className="w-4 h-4 mr-1" />Reabilitar</>
                                    ) : (
                                        <><Ban className="w-4 h-4 mr-1" />Desabilitar</>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className="text-sm font-semibold mb-2">{titulo}</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">{children}</dl>
        </div>
    );
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
    if (!valor) return null;
    return (
        <div className="flex justify-between gap-3 text-sm py-0.5">
            <dt className="text-muted-foreground">{rotulo}</dt>
            <dd className="font-medium text-right break-all">{valor}</dd>
        </div>
    );
}
