import React, { useEffect, useState } from 'react';
import { FileText, Loader2, DollarSign } from 'lucide-react';
import { afiliadoService, type IndicacaoComNome } from '@/services/afiliado.service';
import { formatCurrencyDynamic } from '@/utils/currencyUtils';

interface Props {
    afiliadoId: string;
}

const AfiliadoIndicacoesTreeView: React.FC<Props> = ({ afiliadoId }) => {
    const [indicacoes, setIndicacoes] = useState<IndicacaoComNome[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchIndicacoes = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await afiliadoService.getIndicacoesAfiliadoAdmin(afiliadoId);
                setIndicacoes(data);
            } catch (err: any) {
                console.error('Erro ao carregar indicações:', err);
                setError('Não foi possível carregar as indicações deste afiliado.');
            } finally {
                setLoading(false);
            }
        };

        fetchIndicacoes();
    }, [afiliadoId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Carregando origem dos valores...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50/50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
        );
    }

    if (indicacoes.length === 0) {
        return (
            <div className="p-6 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma indicação confirmada encontrada para justificar o saldo.</p>
            </div>
        );
    }

    const totalRecompensas = indicacoes.reduce((sum, ind) => sum + ind.total_recompensas, 0);

    return (
        <div className="bg-gray-50/80 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800 p-4 rounded-b-xl shadow-inner">
            <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                    <DollarSign size={16} /> Origem do Saldo (Extrato)
                </div>
                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                    Total Histórico: <span className="text-green-600">{formatCurrencyDynamic(totalRecompensas)}</span>
                </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/80">
                        <tr>
                            <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                            <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Empresa Indicada</th>
                            <th className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Gerado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-800">
                        {indicacoes.map((ind) => (
                            <tr key={ind.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                                    {ind.data_confirmacao ? new Date(ind.data_confirmacao).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    }) : '---'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {ind.empresa_indicada_nome}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-right text-green-600 dark:text-green-400">
                                    + {formatCurrencyDynamic(ind.total_recompensas)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AfiliadoIndicacoesTreeView;
