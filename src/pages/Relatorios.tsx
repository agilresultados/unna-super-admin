import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Download,
  Calendar,
  Filter,
  AlertCircle
} from 'lucide-react';
import { relatorioVendasService, RelatorioVendas } from '@/services/relatorio-vendas.service';
import { formatCurrencyDynamic } from '@/utils/currencyUtils';

interface RelatorioData {
  receitaMensal: number;
  receitaAnual: number;
  totalEmpresas: number;
  totalUsuarios: number;
  assinaturasAtivas: number;
  assinaturasTrial: number;
  assinaturasCanceladas: number;
  crescimentoMensal: number;
  crescimentoAnual: number;
}

const Relatorios = () => {
  const [data, setData] = useState<RelatorioData>({
    receitaMensal: 0,
    receitaAnual: 0,
    totalEmpresas: 0,
    totalUsuarios: 0,
    assinaturasAtivas: 0,
    assinaturasTrial: 0,
    assinaturasCanceladas: 0,
    crescimentoMensal: 0,
    crescimentoAnual: 0
  });
  const [relatorioVendas, setRelatorioVendas] = useState<RelatorioVendas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('mes');

  useEffect(() => {
    const fetchRelatorioData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Calcular datas baseadas no período selecionado
        const hoje = new Date();
        const fim = new Date();
        let inicio = new Date();
        
        if (periodo === 'mes') {
          inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        } else if (periodo === 'trimestre') {
          inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
        } else if (periodo === 'ano') {
          inicio = new Date(hoje.getFullYear(), 0, 1);
        }

        const filtros = {
          data_inicio: inicio.toISOString().split('T')[0],
          data_fim: fim.toISOString().split('T')[0]
        };

        // Buscar métricas rápidas
        const metricas = await relatorioVendasService.getMetricasRapidas();
        
        // Buscar relatório detalhado com filtros
        const relatorio = await relatorioVendasService.getRelatorioVendas(filtros);
        
        setData({
          receitaMensal: relatorio.resumo.receita_total,
          receitaAnual: (relatorio.resumo.receita_total / (periodo === 'trimestre' ? 3 : periodo === 'ano' ? 12 : 1)) * 12, // Projeção
          totalEmpresas: (metricas as any).total_empresas || 0,
          totalUsuarios: (metricas as any).total_usuarios || 0,
          assinaturasAtivas: relatorio.resumo.assinaturas_ativas,
          assinaturasTrial: relatorio.resumo.assinaturas_trial,
          assinaturasCanceladas: relatorio.resumo.assinaturas_canceladas,
          crescimentoMensal: relatorio.resumo.crescimento_receita,
          crescimentoAnual: (relatorio as any).resumo.crescimento_anual || 0
        });
        
        setRelatorioVendas(relatorio);
      } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        setError('Erro ao carregar relatório. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchRelatorioData();
  }, [periodo]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center md:flex-row flex-col">
        <h1 className="text-3xl font-bold text-gray-900 md:pb-0 pb-4">Relatórios</h1>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros de Período */}
      <Card className='bg-white'>
        <CardContent className="pt-6">
          <div className="flex gap-2 md:flex-row flex-col">
            <Button
              variant={periodo === 'mes' ? 'default' : 'outline'}
              onClick={() => setPeriodo('mes')}
            >
              Mês Atual
            </Button>
            <Button
              variant={periodo === 'trimestre' ? 'default' : 'outline'}
              onClick={() => setPeriodo('trimestre')}
            >
              Último Trimestre
            </Button>
            <Button
              variant={periodo === 'ano' ? 'default' : 'outline'}
              onClick={() => setPeriodo('ano')}
            >
              Ano Atual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className='bg-white'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento {periodo === 'mes' ? 'Mensal' : periodo === 'trimestre' ? 'Trimestral' : 'Anual'}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className='pt-6'>
            <div className="text-2xl font-bold">{formatCurrencyDynamic(data.receitaMensal)}</div>
            <p className="text-xs text-muted-foreground">
              {data.crescimentoMensal > 0 ? '+' : ''}{data.crescimentoMensal.toFixed(1)}% vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card className='bg-white'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className='pt-6'>
            <div className="text-2xl font-bold">{data.totalEmpresas}</div>
            <p className="text-xs text-muted-foreground">
              Cadastradas na plataforma
            </p>
          </CardContent>
        </Card>

        <Card className='bg-white'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className='pt-6'>
            <div className="text-2xl font-bold">{data.totalUsuarios}</div>
            <p className="text-xs text-muted-foreground">
              Colaboradores e Administradores
            </p>
          </CardContent>
        </Card>

        <Card className='bg-white'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className='pt-6'>
            <div className="text-2xl font-bold">{data.assinaturasAtivas}</div>
            <p className="text-xs text-muted-foreground">
              {data.assinaturasTrial} em trial
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className='bg-white'>
          <CardHeader className='pt-6'>
            <CardTitle className='text-sm font-medium'>Status das Assinaturas</CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ativas</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(data.assinaturasAtivas / Math.max(1, (data.assinaturasAtivas + data.assinaturasTrial + data.assinaturasCanceladas))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-green-600">{data.assinaturasAtivas}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Trial</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(data.assinaturasTrial / Math.max(1, (data.assinaturasAtivas + data.assinaturasTrial + data.assinaturasCanceladas))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-blue-600">{data.assinaturasTrial}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Canceladas (No Período)</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${(data.assinaturasCanceladas / Math.max(1, (data.assinaturasAtivas + data.assinaturasTrial + data.assinaturasCanceladas))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-red-600">{data.assinaturasCanceladas}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white'>
          <CardHeader className='pt-6'>
            <CardTitle className='text-sm font-medium'>Taxa de Retenção</CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className="text-3xl font-bold text-green-600">
              {relatorioVendas?.resumo.taxa_retencao.toFixed(1)}%
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">Assinaturas Ativas / Total</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Métrica de conversão da base instalada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Relatório de Vendas de Assinaturas */}
      {relatorioVendas && (
        <Card className='bg-white'>
          <CardHeader className='pt-6 border-b'>
            <CardTitle className='text-sm font-medium'>Desempenho por Unidade</CardTitle>
            <p className="text-sm text-gray-600">
              Período: {new Date(relatorioVendas.periodo.inicio).toLocaleDateString('pt-BR')} - {new Date(relatorioVendas.periodo.fim).toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vendas por Plano */}
              <div>
                <h4 className="font-semibold mb-4 text-gray-700">Participação por Plano</h4>
                <div className="space-y-3">
                  {relatorioVendas.vendas_por_plano.length > 0 ? (
                    relatorioVendas.vendas_por_plano.map((venda, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <span className="font-medium text-gray-900">{venda.plano}</span>
                          <p className="text-sm text-gray-600">{venda.quantidade} assinaturas</p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">{formatCurrencyDynamic(venda.receita || 0)}</span>
                          <div className="flex items-center justify-end gap-1">
                            <div className="w-16 bg-gray-200 rounded-full h-1">
                              <div className="bg-primary h-1 rounded-full" style={{ width: `${venda.percentual}%` }}></div>
                            </div>
                            <p className="text-[10px] text-gray-500">{(venda.percentual || 0).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4 italic">Nenhuma venda registrada no período</p>
                  )}
                </div>
              </div>

              {/* Top Empresas */}
              <div>
                <h4 className="font-semibold mb-4 text-gray-700">Top Empresas (Receita Direta)</h4>
                <div className="space-y-3">
                  {relatorioVendas.top_empresas.length > 0 ? (
                    relatorioVendas.top_empresas.map((empresa, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{empresa.empresa}</span>
                            <p className="text-xs text-gray-500">{empresa.plano}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-blue-600">{formatCurrencyDynamic(empresa.valor)}</span>
                          <p className="text-[10px] text-gray-400">
                            Desde {new Date(empresa.data_inicio).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4 italic">Sem movimentação financeira no período</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Relatorios;