import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import {
  AlertCircle,
  BadgeCheck,
  CalendarRange,
  CircleDollarSign,
  Share2 as Facebook,
  Megaphone,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import {
  empresaService,
  type AtribuicaoGrupo,
  type CadastroAtribuido,
  type RelatorioAtribuicao,
} from '@/services/empresa.service';
import PeriodosDivulgacao from '@/components/superadmin/PeriodosDivulgacao';

/** Data de N dias atrás no formato YYYY-MM-DD (input date). */
const diasAtras = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
};
const hoje = () => new Date().toISOString().slice(0, 10);

const percentual = (parte: number, total: number) =>
  total > 0 ? `${Math.round((parte / total) * 100)}%` : '—';

const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const NOMES_PLATAFORMA: Record<string, string> = {
  google: 'Google',
  meta: 'Meta',
  instagram: 'Instagram',
  agencia: 'Agência',
};
const nomesPlataformas = (lista: string[]) =>
  lista.map((p) => NOMES_PLATAFORMA[p] ?? p).join(' + ');

/**
 * Origem de um cadastro. Usa a `atribuicao` do backend (ordem de prioridade:
 * anúncio confirmado → orgânico conhecido → marca gravada → período de
 * divulgação); sem ela, cai nos click-ids como antes.
 */
const origemDoCadastro = (c: CadastroAtribuido) => {
  const a = c.atribuicao;
  if (a) {
    switch (a.tipo) {
      case 'anuncio':
        return {
          label: `${nomesPlataformas(a.plataformas)} Ads`,
          className: a.plataformas.includes('google') ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700',
        };
      case 'presumido':
        return { label: `Período de anúncio · ${nomesPlataformas(a.plataformas)}`, className: 'bg-orange-100 text-orange-700' };
      case 'misto':
        return { label: `Misto · ${nomesPlataformas(a.plataformas)}`, className: 'bg-purple-100 text-purple-700' };
      case 'organico':
        return {
          label:
            a.motivo === 'bio_instagram'
              ? 'Orgânico · bio do Instagram'
              : a.motivo === 'indicacao_afiliado'
                ? 'Orgânico · afiliado'
                : `Orgânico · ${nomesPlataformas(a.plataformas)}`,
          className: 'bg-teal-100 text-teal-700',
        };
      case 'sem':
        return { label: 'Sem atribuição', className: 'bg-gray-100 text-gray-500' };
    }
  }
  if (c.gclid || c.gbraid || c.wbraid) {
    return { label: 'Google Ads', className: 'bg-blue-100 text-blue-700' };
  }
  if (c.fbclid) {
    return { label: 'Meta Ads', className: 'bg-indigo-100 text-indigo-700' };
  }
  if (c.utm_source) {
    return { label: c.utm_source, className: 'bg-amber-100 text-amber-700' };
  }
  return { label: 'Sem atribuição', className: 'bg-gray-100 text-gray-500' };
};

const STATUS_ASSINATURA: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
  TRIAL: { label: 'Trial', className: 'bg-sky-100 text-sky-700' },
  PENDING: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
  CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expirada', className: 'bg-gray-100 text-gray-500' },
};

/** Rótulo que o backend usa para valor vazio nos agrupamentos. */
const SEM_VALOR = '(sem)';
const TODOS = '';

// Mesmos critérios de empresa.service.ts (relatorioAtribuicao) no backend.
const veioDoGoogle = (c: CadastroAtribuido) => !!(c.gclid || c.gbraid || c.wbraid);
const veioDoMeta = (c: CadastroAtribuido) => !!c.fbclid;
const temClickId = (c: CadastroAtribuido) => veioDoGoogle(c) || veioDoMeta(c);
const assinaturaAtiva = (c: CadastroAtribuido) => c.assinatura_status === 'ACTIVE';

type Origem =
  | 'atribuido'
  | 'presumido'
  | 'misto'
  | 'organico'
  | 'anuncio'
  | 'google'
  | 'meta'
  | 'utm'
  | 'sem';

const ORIGENS: { valor: Origem; label: string }[] = [
  { valor: 'atribuido', label: 'Atribuído a anúncio (confirmado, presumido ou misto)' },
  { valor: 'presumido', label: 'Período de anúncio (presumido)' },
  { valor: 'misto', label: 'Misto (anúncio + ação orgânica)' },
  { valor: 'organico', label: 'Orgânico conhecido (bio, afiliado, stories)' },
  { valor: 'anuncio', label: 'De anúncio (Google ou Meta)' },
  { valor: 'google', label: 'Google Ads' },
  { valor: 'meta', label: 'Meta Ads' },
  { valor: 'utm', label: 'Só UTM (sem click-id)' },
  { valor: 'sem', label: 'Sem atribuição' },
];

const casaOrigem = (c: CadastroAtribuido, origem: Origem) => {
  const tipo = c.atribuicao?.tipo;
  switch (origem) {
    case 'atribuido':
      return tipo === 'anuncio' || tipo === 'presumido' || tipo === 'misto';
    case 'presumido':
    case 'misto':
    case 'organico':
      return tipo === origem;
    case 'anuncio':
      return temClickId(c);
    case 'google':
      return veioDoGoogle(c);
    case 'meta':
      return veioDoMeta(c);
    case 'utm':
      return !temClickId(c) && !!c.utm_source;
    case 'sem':
      return !temClickId(c) && !c.utm_source;
  }
};

interface Filtros {
  busca: string;
  origem: Origem | typeof TODOS;
  pagamento: 'pagou' | 'nao' | typeof TODOS;
  fonte: string;
  campanha: string;
  conteudo: string;
  assinatura: string;
}

const FILTROS_VAZIOS: Filtros = {
  busca: '',
  origem: TODOS,
  pagamento: TODOS,
  fonte: TODOS,
  campanha: TODOS,
  conteudo: TODOS,
  assinatura: TODOS,
};

/** Filtro de campo UTM: SEM_VALOR casa com vazio, como no agrupamento do backend. */
const casaCampo = (valor: string | null | undefined, filtro: string) =>
  filtro === TODOS || (valor || SEM_VALOR) === filtro;

const aplicarFiltros = (cadastros: CadastroAtribuido[], f: Filtros) => {
  const busca = f.busca.trim().toLowerCase();
  return cadastros.filter(
    (c) =>
      (!busca || c.nome_negocio.toLowerCase().includes(busca)) &&
      (f.origem === TODOS || casaOrigem(c, f.origem)) &&
      (f.pagamento === TODOS || (f.pagamento === 'pagou') === !!c.pagou) &&
      casaCampo(c.utm_source, f.fonte) &&
      casaCampo(c.utm_campaign, f.campanha) &&
      casaCampo(c.utm_content, f.conteudo) &&
      casaCampo(c.assinatura_status, f.assinatura),
  );
};

/** Recalcula o resumo do backend sobre a lista já filtrada. */
const calcularResumo = (cadastros: CadastroAtribuido[]) => ({
  total_cadastros: cadastros.length,
  atribuiveis_a_anuncio: cadastros.filter(temClickId).length,
  atribuiveis_google: cadastros.filter(veioDoGoogle).length,
  atribuiveis_meta: cadastros.filter(veioDoMeta).length,
  sem_atribuicao: cadastros.filter((c) => !temClickId(c) && !c.utm_source).length,
  assinaturas_ativas: cadastros.filter(assinaturaAtiva).length,
  ativas_de_anuncio: cadastros.filter((c) => temClickId(c) && assinaturaAtiva(c)).length,
  ativas_google: cadastros.filter((c) => veioDoGoogle(c) && assinaturaAtiva(c)).length,
  ativas_meta: cadastros.filter((c) => veioDoMeta(c) && assinaturaAtiva(c)).length,
});

/** Recalcula por_fonte / por_campanha do backend sobre a lista já filtrada. */
const agrupar = (
  cadastros: CadastroAtribuido[],
  chave: 'utm_source' | 'utm_campaign',
): AtribuicaoGrupo[] => {
  const mapa = new Map<string, AtribuicaoGrupo>();
  for (const c of cadastros) {
    const valor = c[chave] || SEM_VALOR;
    const atual = mapa.get(valor) || {
      valor,
      total: 0,
      adDriven: 0,
      google: 0,
      meta: 0,
      ativas: 0,
    };
    atual.total += 1;
    if (assinaturaAtiva(c)) atual.ativas += 1;
    if (temClickId(c)) atual.adDriven += 1;
    if (veioDoGoogle(c)) atual.google += 1;
    if (veioDoMeta(c)) atual.meta += 1;
    mapa.set(valor, atual);
  }
  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
};

/** Valores distintos de um campo, mais frequentes primeiro, para montar o select. */
const opcoesDoCampo = (
  cadastros: CadastroAtribuido[],
  campo: 'utm_source' | 'utm_campaign' | 'utm_content',
) => {
  const contagem = new Map<string, number>();
  for (const c of cadastros) {
    const valor = c[campo] || SEM_VALOR;
    contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
  }
  return Array.from(contagem.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([valor, total]) => ({ valor, total }));
};

const classeCampo = 'border rounded-lg px-3 py-2 text-sm bg-white w-full';
const classeRotulo =
  'block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1';

const SelectFiltro = ({
  rotulo,
  valor,
  onChange,
  opcoes,
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: { valor: string; label: string }[];
}) => (
  <div className="min-w-0">
    <label className={classeRotulo}>{rotulo}</label>
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className={`${classeCampo} ${valor !== TODOS ? 'border-blue-400 bg-blue-50' : ''}`}
    >
      <option value={TODOS}>Todas</option>
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

interface CardResumoProps {
  titulo: string;
  valor: number;
  detalhe?: string;
  icone: React.ReactNode;
  cor: string;
}

const CardResumo = ({ titulo, valor, detalhe, icone, cor }: CardResumoProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold truncate">
            {titulo}
          </p>
          <p className="text-2xl font-black mt-1">{valor}</p>
          {detalhe && <p className="text-xs text-gray-500 mt-0.5">{detalhe}</p>}
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${cor}`}>{icone}</div>
      </div>
    </CardContent>
  </Card>
);

/** Igual ao CardResumo, para valores já formatados (moeda, razão). */
const CardResumoTexto = ({
  titulo,
  valor,
  detalhe,
  icone,
  cor,
}: Omit<CardResumoProps, 'valor'> & { valor: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold truncate">{titulo}</p>
          <p className="text-2xl font-black mt-1 whitespace-nowrap">{valor}</p>
          {detalhe && <p className="text-xs text-gray-500 mt-0.5">{detalhe}</p>}
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${cor}`}>{icone}</div>
      </div>
    </CardContent>
  </Card>
);

const TabelaGrupo = ({
  titulo,
  linhas,
  rotuloColuna,
  selecionado,
  onSelecionar,
}: {
  titulo: string;
  linhas: AtribuicaoGrupo[];
  rotuloColuna: string;
  /** Valor filtrado hoje por esta tabela (TODOS quando nenhum). */
  selecionado: string;
  /** Clicar numa linha filtra por ela; clicar de novo limpa. */
  onSelecionar: (valor: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{titulo}</CardTitle>
      <p className="text-xs text-gray-400">Clique numa linha para filtrar por ela.</p>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              <th className="px-4 py-3">{rotuloColuna}</th>
              <th className="px-4 py-3 text-right">Cadastros</th>
              <th className="px-4 py-3 text-right">Google</th>
              <th className="px-4 py-3 text-right">Meta</th>
              <th className="px-4 py-3 text-right">Ativas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {linhas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Nenhum cadastro no período.
                </td>
              </tr>
            )}
            {linhas.map((linha) => (
              <tr
                key={linha.valor}
                onClick={() =>
                  onSelecionar(selecionado === linha.valor ? TODOS : linha.valor)
                }
                className={`cursor-pointer transition-colors ${
                  selecionado === linha.valor ? 'bg-blue-50' : 'hover:bg-blue-50/30'
                }`}
              >
                <td className="px-4 py-2.5 font-medium">{linha.valor}</td>
                <td className="px-4 py-2.5 text-right">{linha.total}</td>
                <td className="px-4 py-2.5 text-right text-blue-700">{linha.google}</td>
                <td className="px-4 py-2.5 text-right text-indigo-700">{linha.meta}</td>
                <td className="px-4 py-2.5 text-right font-bold text-green-700">
                  {linha.ativas}
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    {percentual(linha.ativas, linha.total)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

const Atribuicao = () => {
  const [inicio, setInicio] = useState(diasAtras(30));
  const [fim, setFim] = useState(hoje());
  const [data, setData] = useState<RelatorioAtribuicao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // O backend filtra por createdAt <= fim; sem hora, "fim" cobre só a meia-noite.
      const resultado = await empresaService.getRelatorioAtribuicao({
        inicio,
        fim: `${fim}T23:59:59`,
      });
      setData(resultado);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar o relatório de atribuição.');
    } finally {
      setLoading(false);
    }
  }, [inicio, fim]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const setFiltro = <K extends keyof Filtros>(chave: K, valor: Filtros[K]) =>
    setFiltros((atual) => ({ ...atual, [chave]: valor }));

  const todosCadastros = useMemo(() => data?.cadastros ?? [], [data]);
  // Tudo abaixo vem da lista filtrada no cliente: o backend devolve o período
  // inteiro sem paginação, e resumo/agrupamentos são derivados dessa mesma lista.
  const cadastros = useMemo(
    () => aplicarFiltros(todosCadastros, filtros),
    [todosCadastros, filtros],
  );
  const resumo = useMemo(() => (data ? calcularResumo(cadastros) : null), [data, cadastros]);
  const porFonte = useMemo(() => agrupar(cadastros, 'utm_source'), [cadastros]);
  const porCampanha = useMemo(() => agrupar(cadastros, 'utm_campaign'), [cadastros]);

  // Opções dos selects saem do período inteiro, não da lista já filtrada,
  // para que escolher uma fonte não esconda as outras do seletor.
  const opcoes = useMemo(() => {
    const comContagem = (campo: 'utm_source' | 'utm_campaign' | 'utm_content') =>
      opcoesDoCampo(todosCadastros, campo).map((o) => ({
        valor: o.valor,
        label: `${o.valor} (${o.total})`,
      }));
    const statusPresentes = new Set<string>(
      todosCadastros.map((c) => c.assinatura_status || SEM_VALOR),
    );
    return {
      fonte: comContagem('utm_source'),
      campanha: comContagem('utm_campaign'),
      conteudo: comContagem('utm_content'),
      assinatura: [...Object.keys(STATUS_ASSINATURA), SEM_VALOR]
        .filter((s) => statusPresentes.has(s))
        .map((s) => ({
          valor: s,
          label: s === SEM_VALOR ? 'Sem assinatura' : STATUS_ASSINATURA[s].label,
        })),
    };
  }, [todosCadastros]);

  const filtrosAtivos = (Object.keys(filtros) as (keyof Filtros)[]).filter(
    (k) => filtros[k].trim() !== '',
  ).length;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Target size={24} /> Atribuição de Marketing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fonte de verdade dos cadastros vindos de anúncio. Compare cada número com o
            painel da plataforma no mesmo período.
          </p>
        </div>
        <Button onClick={carregar} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
        </Button>
      </div>

      {/* Filtro de período */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
              Início
            </label>
            <input
              type="date"
              value={inicio}
              max={fim}
              onChange={(e) => setInicio(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
              Fim
            </label>
            <input
              type="date"
              value={fim}
              min={inicio}
              max={hoje()}
              onChange={(e) => setFim(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '7 dias', dias: 7 },
              { label: '30 dias', dias: 30 },
              { label: '90 dias', dias: 90 },
            ].map((atalho) => (
              <button
                key={atalho.dias}
                onClick={() => {
                  setInicio(diasAtras(atalho.dias));
                  setFim(hoje());
                }}
                className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 transition-colors"
              >
                {atalho.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros dos cadastros — aplicados no cliente sobre o período carregado */}
      {data && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
              <div className="min-w-0">
                <label className={classeRotulo}>Empresa</label>
                <input
                  type="search"
                  value={filtros.busca}
                  onChange={(e) => setFiltro('busca', e.target.value)}
                  placeholder="Nome do negócio"
                  className={`${classeCampo} ${filtros.busca.trim() ? 'border-blue-400 bg-blue-50' : ''}`}
                />
              </div>
              <SelectFiltro
                rotulo="Origem"
                valor={filtros.origem}
                onChange={(v) => setFiltro('origem', v as Filtros['origem'])}
                opcoes={ORIGENS.map((o) => ({ valor: o.valor, label: o.label }))}
              />
              <SelectFiltro
                rotulo="Pagamento"
                valor={filtros.pagamento}
                onChange={(v) => setFiltro('pagamento', v as Filtros['pagamento'])}
                opcoes={[
                  { valor: 'pagou', label: 'Já pagou' },
                  { valor: 'nao', label: 'Ainda não pagou' },
                ]}
              />
              <SelectFiltro
                rotulo="Fonte (utm_source)"
                valor={filtros.fonte}
                onChange={(v) => setFiltro('fonte', v)}
                opcoes={opcoes.fonte}
              />
              <SelectFiltro
                rotulo="Campanha"
                valor={filtros.campanha}
                onChange={(v) => setFiltro('campanha', v)}
                opcoes={opcoes.campanha}
              />
              <SelectFiltro
                rotulo="Conteúdo (CTA)"
                valor={filtros.conteudo}
                onChange={(v) => setFiltro('conteudo', v)}
                opcoes={opcoes.conteudo}
              />
              <SelectFiltro
                rotulo="Assinatura"
                valor={filtros.assinatura}
                onChange={(v) => setFiltro('assinatura', v)}
                opcoes={opcoes.assinatura}
              />
            </div>
            {filtrosAtivos > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-600">
                  {cadastros.length} de {todosCadastros.length} cadastros do período ·{' '}
                  {filtrosAtivos} {filtrosAtivos === 1 ? 'filtro ativo' : 'filtros ativos'}
                </span>
                <button
                  onClick={() => setFiltros(FILTROS_VAZIOS)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <X size={14} /> Limpar filtros
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle size={18} /> {error}
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <Card>
          <CardContent className="p-8 text-center text-gray-400">
            Carregando relatório…
          </CardContent>
        </Card>
      )}

      {resumo && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
            <CardResumo
              titulo="Cadastros"
              valor={resumo.total_cadastros}
              detalhe={
                filtrosAtivos > 0
                  ? `Com os filtros · ${todosCadastros.length} no período`
                  : 'Total no período'
              }
              icone={<Users size={18} className="text-gray-600" />}
              cor="bg-gray-100"
            />
            <CardResumo
              titulo="De anúncio"
              valor={resumo.atribuiveis_a_anuncio}
              detalhe={`${percentual(resumo.atribuiveis_a_anuncio, resumo.total_cadastros)} do total`}
              icone={<TrendingUp size={18} className="text-green-600" />}
              cor="bg-green-100"
            />
            <CardResumo
              titulo="Google Ads"
              valor={resumo.atribuiveis_google}
              detalhe="Com gclid/gbraid/wbraid"
              icone={<Search size={18} className="text-blue-600" />}
              cor="bg-blue-100"
            />
            <CardResumo
              titulo="Meta Ads"
              valor={resumo.atribuiveis_meta}
              detalhe="Com fbclid"
              icone={<Facebook size={18} className="text-indigo-600" />}
              cor="bg-indigo-100"
            />
            <CardResumo
              titulo="Sem atribuição"
              valor={resumo.sem_atribuicao}
              detalhe="Orgânico, indicação, WhatsApp…"
              icone={<Megaphone size={18} className="text-amber-600" />}
              cor="bg-amber-100"
            />
            <CardResumo
              titulo="Assinaturas ativas"
              valor={resumo.assinaturas_ativas}
              detalhe={`${percentual(resumo.assinaturas_ativas, resumo.total_cadastros)} dos cadastros · ${resumo.ativas_de_anuncio} de anúncio (G ${resumo.ativas_google} · M ${resumo.ativas_meta})`}
              icone={<BadgeCheck size={18} className="text-emerald-600" />}
              cor="bg-emerald-100"
            />
          </div>

          {data?.periodo_divulgacao && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                Períodos de divulgação · {data.periodo_divulgacao.dias.com_anuncio} dias com anúncio e{' '}
                {data.periodo_divulgacao.dias.sem_anuncio} sem, no intervalo escolhido (sem os filtros acima)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
                <CardResumo
                  titulo="Pagantes atribuídos"
                  valor={data.periodo_divulgacao.pagantes_atribuidos}
                  detalhe={`${data.periodo_divulgacao.pagantes_anuncio_confirmado} confirmados · ${data.periodo_divulgacao.pagantes_presumidos} presumidos · ${data.periodo_divulgacao.pagantes_mistos} mistos`}
                  icone={<CalendarRange size={18} className="text-orange-600" />}
                  cor="bg-orange-100"
                />
                <CardResumoTexto
                  titulo="MRR atribuído"
                  valor={brl(data.periodo_divulgacao.mrr_atribuido)}
                  detalhe={`${brl(data.periodo_divulgacao.receita_atribuida)} já recebidos`}
                  icone={<TrendingUp size={18} className="text-green-600" />}
                  cor="bg-green-100"
                />
                <CardResumoTexto
                  titulo="Investimento"
                  valor={brl(data.periodo_divulgacao.investimento)}
                  detalhe="Dos períodos de anúncio, rateado pelos dias do intervalo"
                  icone={<CircleDollarSign size={18} className="text-amber-600" />}
                  cor="bg-amber-100"
                />
                <CardResumoTexto
                  titulo="Custo por pagante"
                  valor={
                    data.periodo_divulgacao.custo_por_pagante != null
                      ? brl(data.periodo_divulgacao.custo_por_pagante)
                      : '—'
                  }
                  detalhe="Investimento ÷ pagantes atribuídos · meta da agência: até R$ 150"
                  icone={<Target size={18} className="text-rose-600" />}
                  cor="bg-rose-100"
                />
                <CardResumoTexto
                  titulo="Pagantes por dia"
                  valor={`${(data.periodo_divulgacao.pagantes_por_dia_com_anuncio ?? 0).toLocaleString('pt-BR')} × ${(data.periodo_divulgacao.pagantes_por_dia_sem_anuncio ?? 0).toLocaleString('pt-BR')}`}
                  detalhe={`Com anúncio (${data.periodo_divulgacao.pagantes_em_dias_com_anuncio}) × sem anúncio (${data.periodo_divulgacao.pagantes_em_dias_sem_anuncio}), todas as origens${data.periodo_divulgacao.pagantes_fora_da_comparacao ? ` · ${data.periodo_divulgacao.pagantes_fora_da_comparacao} da importação fora da conta` : ''}`}
                  icone={<Users size={18} className="text-gray-600" />}
                  cor="bg-gray-100"
                />
              </div>
            </div>
          )}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <strong>Como ler:</strong> só entram nas colunas Google/Meta os cadastros que
            chegaram com click-id na URL. Quem veio por busca orgânica, indicação ou
            WhatsApp aparece em “Sem atribuição” — isso é esperado, não é perda de
            rastreio. A divergência normal para o painel do anunciante vem de bloqueadores
            e de quem cadastra em outro dispositivo. “Assinaturas ativas” é o status de
            hoje de quem se cadastrou no período (trial não conta).
            <br />
            <strong>Origem:</strong> a coluna aplica uma ordem de prioridade. Anúncio confirmado
            (click-id do Google, UTM paga ou UTM de campanha cadastrada) vem primeiro; depois
            orgânico conhecido (bio do Instagram, indicação de afiliado); depois a marca gravada no
            histórico; e por fim os períodos de divulgação. “Período de anúncio” é presunção:
            cadastro sem outro sinal feito com campanha no ar. “Misto” é quando, no mesmo dia,
            também havia ação orgânica cadastrada.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TabelaGrupo
              titulo="Por fonte (utm_source)"
              linhas={porFonte}
              rotuloColuna="Fonte"
              selecionado={filtros.fonte}
              onSelecionar={(v) => setFiltro('fonte', v)}
            />
            <TabelaGrupo
              titulo="Por campanha (utm_campaign)"
              linhas={porCampanha}
              rotuloColuna="Campanha"
              selecionado={filtros.campanha}
              onSelecionar={(v) => setFiltro('campanha', v)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Cadastros do período (
                {filtrosAtivos > 0
                  ? `${cadastros.length} de ${todosCadastros.length}`
                  : cadastros.length}
                )
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                      <th className="px-4 py-3">Empresa</th>
                      <th className="px-4 py-3">Criada em</th>
                      <th className="px-4 py-3">Origem</th>
                      <th className="px-4 py-3">Campanha</th>
                      <th className="px-4 py-3">Conteúdo (CTA)</th>
                      <th className="px-4 py-3">Assinatura</th>
                      <th className="px-4 py-3 text-right">MRR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {cadastros.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                          {filtrosAtivos > 0
                            ? 'Nenhum cadastro com esses filtros.'
                            : 'Nenhum cadastro no período.'}
                        </td>
                      </tr>
                    )}
                    {cadastros.map((c) => {
                      const origem = origemDoCadastro(c);
                      const assinatura = c.assinatura_status
                        ? STATUS_ASSINATURA[c.assinatura_status]
                        : null;
                      return (
                        <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-2.5 font-medium">{c.nome_negocio}</td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {formatarData(c.createdAt)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${origem.className}`}
                            >
                              {origem.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {c.utm_campaign || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {c.utm_content || '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            {assinatura ? (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold ${assinatura.className}`}
                              >
                                {assinatura.label}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            {c.pagou ? (
                              c.mrr ? (
                                <span className="font-semibold text-green-700">{brl(c.mrr)}</span>
                              ) : (
                                <span className="text-gray-400">pagou, inativa</span>
                              )
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <PeriodosDivulgacao periodos={data?.periodos ?? []} onAlterado={carregar} />
        </>
      )}
    </div>
  );
};

export default Atribuicao;
