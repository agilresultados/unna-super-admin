import React, { useEffect, useState } from 'react';
import { Receipt, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { afiliadoService, LancamentoAfiliado, TipoLancamentoAfiliado } from '@/services/afiliado.service';
import { formatCurrencyDynamic } from '@/utils/currencyUtils';

const PAGINA = 30;

const ROTULOS: Record<TipoLancamentoAfiliado, string> = {
    SALDO_INICIAL: 'Saldo inicial',
    RECOMPENSA: 'Comissão de indicação',
    SAQUE: 'Saque solicitado',
    ESTORNO_SAQUE: 'Saque devolvido',
    AJUSTE: 'Ajuste manual'
};

interface Props {
    afiliadoId: string;
}

/**
 * Extrato de um afiliado, na visão do superadmin.
 *
 * Cada linha é imutável no backend — correção entra como lançamento de sinal
 * oposto, nunca como edição. Por isso o extrato mostra o saque e a devolução em
 * vez de sumir com o saque: num pedido contestado é exatamente esse histórico,
 * com a chave de idempotência de cada operação, que sustenta a resposta.
 */
const ExtratoAfiliado: React.FC<Props> = ({ afiliadoId }) => {
    const [lancamentos, setLancamentos] = useState<LancamentoAfiliado[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let cancelado = false;

        setCarregando(true);
        setErro('');

        afiliadoService
            .getExtratoAfiliadoAdmin(afiliadoId, PAGINA)
            .then((resposta) => {
                if (cancelado) return;
                setLancamentos(resposta.lancamentos);
                setCursor(resposta.proximo_cursor);
            })
            .catch(() => {
                if (!cancelado) setErro('Não foi possível carregar o extrato.');
            })
            .finally(() => {
                if (!cancelado) setCarregando(false);
            });

        return () => {
            cancelado = true;
        };
    }, [afiliadoId]);

    const carregarMais = async () => {
        if (!cursor) return;
        try {
            const resposta = await afiliadoService.getExtratoAfiliadoAdmin(afiliadoId, PAGINA, cursor);
            setLancamentos((atual) => [...atual, ...resposta.lancamentos]);
            setCursor(resposta.proximo_cursor);
        } catch {
            setErro('Não foi possível carregar mais lançamentos.');
        }
    };

    if (carregando) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-muted-foreground" size={20} />
            </div>
        );
    }

    if (erro && !lancamentos.length) {
        return <div className="p-6 text-center text-sm text-muted-foreground">{erro}</div>;
    }

    if (!lancamentos.length) {
        return (
            <div className="p-6 text-center text-muted-foreground text-sm">
                <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                Nenhum lançamento no livro-caixa deste afiliado.
            </div>
        );
    }

    return (
        <div>
            <div className="divide-y divide-border">
                {lancamentos.map((lancamento) => {
                    const credito = lancamento.direcao === 'CREDITO';

                    return (
                        <div key={lancamento.id} className="p-3 flex items-start gap-3">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${credito ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {credito ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{ROTULOS[lancamento.tipo] || lancamento.tipo}</p>
                                <p className="text-xs text-muted-foreground truncate">{lancamento.descricao}</p>
                                <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5 truncate">
                                    {lancamento.chave_idempotencia}
                                </p>
                            </div>

                            <div className="text-right shrink-0">
                                <p className={`text-sm font-semibold ${credito ? 'text-green-600' : 'text-foreground'}`}>
                                    {credito ? '+' : '−'}
                                    {formatCurrencyDynamic(lancamento.valor)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(lancamento.createdAt).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {cursor && (
                <div className="p-3 border-t border-border text-center">
                    <button type="button" onClick={carregarMais} className="text-sm text-primary font-medium hover:underline">
                        Carregar mais
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExtratoAfiliado;
