import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarRange, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import {
  empresaService,
  type PeriodoDivulgacao,
  type PeriodoDivulgacaoInput,
  type TipoPeriodoDivulgacao,
} from '@/services/empresa.service';

const PLATAFORMAS_ANUNCIO = ['google', 'meta', 'instagram', 'agencia', 'tiktok'];
const PLATAFORMAS_ORGANICO = ['stories', 'collab', 'afiliado', 'live', 'evento'];

const FORM_VAZIO: PeriodoDivulgacaoInput = {
  tipo: 'ANUNCIO',
  plataforma: 'google',
  descricao: '',
  inicio: '',
  fim: '',
  investimento: 0,
  utm_campaign: '',
};

const diaDe = (iso: string) => iso.slice(0, 10);
const dataBr = (iso: string) => diaDe(iso).split('-').reverse().join('/');
const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const classeCampo = 'border rounded-lg px-3 py-2 text-sm bg-white w-full';
const classeRotulo = 'block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1';

/**
 * Cadastro dos períodos em que campanhas (ANUNCIO) e ações orgânicas
 * (ORGANICO: stories, collab, afiliado) estiveram no ar. O relatório cruza a
 * data de cada cadastro com estes períodos.
 */
const PeriodosDivulgacao = ({
  periodos,
  onAlterado,
}: {
  periodos: PeriodoDivulgacao[];
  onAlterado: () => void;
}) => {
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<PeriodoDivulgacaoInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const set = <K extends keyof PeriodoDivulgacaoInput>(k: K, v: PeriodoDivulgacaoInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const abrirNovo = () => {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setAberto(true);
  };

  const abrirEdicao = (p: PeriodoDivulgacao) => {
    setEditandoId(p.id);
    setForm({
      tipo: p.tipo,
      plataforma: p.plataforma,
      descricao: p.descricao ?? '',
      inicio: diaDe(p.inicio),
      fim: diaDe(p.fim),
      investimento: p.investimento,
      utm_campaign: p.utm_campaign ?? '',
    });
    setAberto(true);
  };

  const salvar = async () => {
    if (!form.plataforma.trim() || !form.inicio || !form.fim) {
      toast.error('Preencha plataforma, primeiro e último dia.');
      return;
    }
    if (form.fim < form.inicio) {
      toast.error('O último dia não pode ser antes do primeiro.');
      return;
    }
    const dados: PeriodoDivulgacaoInput = {
      ...form,
      investimento: form.tipo === 'ORGANICO' ? 0 : Number(form.investimento) || 0,
    };
    try {
      setSalvando(true);
      if (editandoId) {
        await empresaService.atualizarPeriodoDivulgacao(editandoId, dados);
        toast.success('Período atualizado');
      } else {
        await empresaService.criarPeriodoDivulgacao(dados);
        toast.success('Período cadastrado');
      }
      setAberto(false);
      onAlterado();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar o período.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (p: PeriodoDivulgacao) => {
    if (!window.confirm(`Excluir o período ${p.plataforma} de ${dataBr(p.inicio)} a ${dataBr(p.fim)}?`)) return;
    try {
      await empresaService.removerPeriodoDivulgacao(p.id);
      toast.success('Período excluído');
      onAlterado();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível excluir o período.');
    }
  };

  const sugestoes = form.tipo === 'ANUNCIO' ? PLATAFORMAS_ANUNCIO : PLATAFORMAS_ORGANICO;
  const investimentoTotal = periodos
    .filter((p) => p.tipo === 'ANUNCIO')
    .reduce((s, p) => s + (p.investimento || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarRange size={18} /> Períodos de divulgação
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Cadastro sem click-id nem UTM, feito com anúncio no ar, aparece como “período de
            anúncio (presumido)”. Cadastre também stories, collabs e ações de afiliado: no mesmo
            dia de um anúncio, o cadastro vira “misto”. Investimento total cadastrado:{' '}
            <strong>{brl(investimentoTotal)}</strong>.
          </p>
        </div>
        <Button size="sm" onClick={abrirNovo}>
          <Plus size={14} /> Novo período
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {aberto && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={classeRotulo}>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => {
                    const tipo = e.target.value as TipoPeriodoDivulgacao;
                    setForm((f) => ({
                      ...f,
                      tipo,
                      plataforma: tipo === 'ANUNCIO' ? PLATAFORMAS_ANUNCIO[0] : PLATAFORMAS_ORGANICO[0],
                    }));
                  }}
                  className={classeCampo}
                >
                  <option value="ANUNCIO">Anúncio pago</option>
                  <option value="ORGANICO">Ação orgânica</option>
                </select>
              </div>
              <div>
                <label className={classeRotulo}>Plataforma</label>
                <input
                  list="plataformas-divulgacao"
                  value={form.plataforma}
                  onChange={(e) => set('plataforma', e.target.value)}
                  className={classeCampo}
                  placeholder="google, meta, agencia…"
                />
                <datalist id="plataformas-divulgacao">
                  {sugestoes.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={classeRotulo}>Primeiro dia</label>
                <input type="date" value={form.inicio} onChange={(e) => set('inicio', e.target.value)} className={classeCampo} />
              </div>
              <div>
                <label className={classeRotulo}>Último dia</label>
                <input type="date" value={form.fim} min={form.inicio || undefined} onChange={(e) => set('fim', e.target.value)} className={classeCampo} />
              </div>
              <div className="sm:col-span-2">
                <label className={classeRotulo}>Descrição</label>
                <input value={form.descricao} onChange={(e) => set('descricao', e.target.value)} className={classeCampo} placeholder="Campanha, agência, criativo…" />
              </div>
              <div>
                <label className={classeRotulo}>Investimento (R$)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.tipo === 'ORGANICO' ? 0 : form.investimento}
                  disabled={form.tipo === 'ORGANICO'}
                  onChange={(e) => set('investimento', Number(e.target.value))}
                  className={classeCampo}
                />
              </div>
              <div>
                <label className={classeRotulo}>UTM da campanha</label>
                <input value={form.utm_campaign} onChange={(e) => set('utm_campaign', e.target.value)} className={classeCampo} placeholder="opcional" />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Com UTM preenchida, quem chegar com essa <code>utm_campaign</code> conta como anúncio
              confirmado, não presumido.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={salvar} disabled={salvando}>
                {editandoId ? 'Salvar alterações' : 'Cadastrar período'}
              </Button>
              <button
                onClick={() => setAberto(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
              >
                <X size={14} /> Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Plataforma</th>
                <th className="px-4 py-3">No ar</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3 text-right">Investimento</th>
                <th className="px-4 py-3">UTM</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {periodos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    Nenhum período cadastrado.
                  </td>
                </tr>
              )}
              {periodos.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/30">
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        p.tipo === 'ANUNCIO' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      {p.tipo === 'ANUNCIO' ? 'Anúncio' : 'Orgânico'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium">{p.plataforma}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                    {dataBr(p.inicio)} – {dataBr(p.fim)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{p.descricao || '—'}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {p.tipo === 'ANUNCIO' ? brl(p.investimento || 0) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{p.utm_campaign || '—'}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => abrirEdicao(p)} className="p-1.5 rounded hover:bg-gray-100" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => excluir(p)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PeriodosDivulgacao;
