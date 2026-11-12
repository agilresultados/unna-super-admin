import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Plus, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/Badge';
import {
  whatsappOficialService,
  type LiberacaoOficial,
  type SalaoOficial,
} from '@/services/whatsapp-oficial.service';

/**
 * Salões no WhatsApp oficial (número próprio) e lista de liberação.
 *
 * A liberação decide quem pode conectar o número; a tabela mostra como cada
 * salão conectado está: estado do canal, modelos aprovados pela Meta, saldo e
 * envios dos últimos 7 dias.
 */

type Tone = 'default' | 'accent' | 'success' | 'warning' | 'danger';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatarNumero = (n: number) => n.toLocaleString('pt-BR');

const estadoDoSalao = (s: SalaoOficial): { rotulo: string; tone: Tone } => {
  switch (s.estado) {
    case 'ativo':
      return { rotulo: 'Ativo', tone: 'success' };
    case 'preparando':
      return { rotulo: 'Preparando', tone: 'accent' };
    case 'desconectado':
      return { rotulo: 'Desconectado', tone: 'default' };
    case 'pausado':
      return s.motivoPausa === 'pagamento_meta'
        ? { rotulo: 'Pausado — pagamento na Meta', tone: 'danger' }
        : { rotulo: 'Pausado — sem saldo', tone: 'warning' };
    default:
      return { rotulo: String(s.estado), tone: 'default' };
  }
};

/** Pausados e com modelo rejeitado primeiro; depois por nome. */
const prioridade = (s: SalaoOficial) => {
  let p = 0;
  if (s.estado === 'pausado') p += 2;
  if (s.templates.rejeitados.length > 0) p += 1;
  return p;
};

const ordenar = (saloes: SalaoOficial[]) =>
  [...saloes].sort(
    (a, b) => prioridade(b) - prioridade(a) || (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'),
  );

const normalizarEmails = (emails: string[]) => [
  ...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
];

const mensagemDeErro = (e: unknown, padrao: string) =>
  e instanceof Error && e.message ? e.message : padrao;

const WhatsappOficialSaloes = () => {
  const [saloes, setSaloes] = useState<SalaoOficial[]>([]);
  const [liberacaoSalva, setLiberacaoSalva] = useState<LiberacaoOficial | null>(null);
  const [paraTodos, setParaTodos] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [novoEmail, setNovoEmail] = useState('');
  const [erroEmail, setErroEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      const painel = await whatsappOficialService.listarSaloes();
      setSaloes(painel.saloes);
      setLiberacaoSalva(painel.liberacao);
      setParaTodos(painel.liberacao.liberado_para_todos);
      setEmails(normalizarEmails(painel.liberacao.emails_liberados));
    } catch (e) {
      console.error('Erro ao carregar salões no WhatsApp oficial:', e);
      setErro(mensagemDeErro(e, 'Não foi possível carregar os salões.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const ordenados = useMemo(() => ordenar(saloes), [saloes]);

  const alterado =
    liberacaoSalva !== null &&
    (paraTodos !== liberacaoSalva.liberado_para_todos ||
      JSON.stringify(emails) !== JSON.stringify(normalizarEmails(liberacaoSalva.emails_liberados)));

  const adicionarEmail = () => {
    const email = novoEmail.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_VALIDO.test(email)) {
      setErroEmail('E-mail inválido.');
      return;
    }
    if (emails.includes(email)) {
      setErroEmail('Esse e-mail já está na lista.');
      return;
    }
    setEmails([...emails, email]);
    setNovoEmail('');
    setErroEmail(null);
  };

  const salvar = async () => {
    const ligandoParaTodos = paraTodos && !liberacaoSalva?.liberado_para_todos;
    if (
      ligandoParaTodos &&
      !window.confirm(
        'Liberar o WhatsApp oficial para TODOS os salões? Qualquer salão poderá conectar o número próprio.',
      )
    ) {
      return;
    }
    try {
      setSalvando(true);
      setErroSalvar(null);
      const salva = await whatsappOficialService.atualizarLiberacao({
        liberado_para_todos: paraTodos,
        emails_liberados: emails,
      });
      setLiberacaoSalva(salva);
      setParaTodos(salva.liberado_para_todos);
      setEmails(normalizarEmails(salva.emails_liberados));
      toast.success('Liberação atualizada');
    } catch (e) {
      console.error('Erro ao salvar liberação do WhatsApp oficial:', e);
      setErroSalvar(mensagemDeErro(e, 'Não foi possível salvar a liberação.'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">WhatsApp oficial dos salões</h1>
          <p className="text-sm text-text-muted">
            Salões que conectaram o número próprio na API oficial da Meta e quem pode conectar.
          </p>
        </div>
        <Button onClick={carregar} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw size={14} />
          Atualizar
        </Button>
      </div>

      {erro && (
        <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{erro}</span>
          <Button size="sm" variant="outline" onClick={carregar}>
            Tentar de novo
          </Button>
        </div>
      )}

      <Card className="py-4">
        <CardContent className="space-y-4 px-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-faint">Liberação</h2>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              role="switch"
              className="h-4 w-4"
              checked={paraTodos}
              onChange={(e) => setParaTodos(e.target.checked)}
              disabled={liberacaoSalva === null}
            />
            <span className="text-sm text-text-main">
              Liberar para todos
              <span className="block text-xs text-text-muted">
                Quando ligado, a lista de e-mails é ignorada.
              </span>
            </span>
          </label>

          <div className={paraTodos ? 'opacity-50' : ''}>
            <p className="mb-2 text-sm font-medium text-text-main">E-mails liberados ({emails.length})</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="dona@salao.com.br"
                value={novoEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNovoEmail(e.target.value);
                  setErroEmail(null);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarEmail();
                  }
                }}
                disabled={liberacaoSalva === null}
              />
              <Button size="sm" className="gap-2" onClick={adicionarEmail} disabled={liberacaoSalva === null}>
                <Plus size={14} />
                Adicionar
              </Button>
            </div>
            {erroEmail && <p className="mt-1 text-xs text-danger">{erroEmail}</p>}
            {emails.length === 0 ? (
              <p className="mt-2 text-xs text-text-muted">Nenhum e-mail na lista.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {emails.map((email) => (
                  <li
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full border border-teal-border px-3 py-1 text-xs text-text-main"
                  >
                    {email}
                    <button
                      type="button"
                      aria-label={`Remover ${email}`}
                      onClick={() => setEmails(emails.filter((e) => e !== email))}
                      className="rounded-full p-0.5 hover:bg-teal-hover-bg"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {erroSalvar && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {erroSalvar}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={salvar} disabled={!alterado || salvando}>
              {salvando ? 'Salvando...' : 'Salvar liberação'}
            </Button>
            {alterado && !salvando && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (!liberacaoSalva) return;
                  setParaTodos(liberacaoSalva.liberado_para_todos);
                  setEmails(normalizarEmails(liberacaoSalva.emails_liberados));
                  setErroSalvar(null);
                }}
              >
                Descartar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-teal-border text-[11px] font-bold uppercase tracking-wider text-text-faint">
                <th className="px-4 py-3">Salão</th>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Modelos aprovados</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-right">Enviadas (7 dias)</th>
                <th className="px-4 py-3 text-right">Falhas (7 dias)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-muted">Carregando...</td>
                </tr>
              ) : ordenados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-muted">
                    {erro ? 'Não foi possível carregar a lista.' : 'Nenhum salão conectou o WhatsApp oficial ainda'}
                  </td>
                </tr>
              ) : (
                ordenados.map((s) => {
                  const estado = estadoDoSalao(s);
                  const rejeitados = s.templates.rejeitados;
                  const aberto = expandido === s.empresaId;
                  return (
                    <Fragment key={s.empresaId}>
                      <tr className="text-sm text-text-main">
                        <td className="px-4 py-3 font-medium">{s.nome ?? '—'}</td>
                        <td className="px-4 py-3">{s.numero ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge tone={estado.tone}>{estado.rotulo}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {rejeitados.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setExpandido(aberto ? null : s.empresaId)}
                              className="inline-flex items-center gap-1 text-danger hover:underline"
                              aria-expanded={aberto}
                            >
                              {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {s.templates.aprovados}/{s.templates.total} ({rejeitados.length}{' '}
                              {rejeitados.length === 1 ? 'rejeitado' : 'rejeitados'})
                            </button>
                          ) : (
                            <span>
                              {s.templates.aprovados}/{s.templates.total}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">{formatarNumero(s.saldo)}</td>
                        <td className="px-4 py-3 text-right">{formatarNumero(s.enviados7d)}</td>
                        <td className={`px-4 py-3 text-right ${s.falhas7d > 0 ? 'font-semibold text-danger' : ''}`}>
                          {formatarNumero(s.falhas7d)}
                        </td>
                      </tr>
                      {aberto && (
                        <tr className="bg-danger/5">
                          <td colSpan={7} className="px-4 py-3 text-sm">
                            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-text-faint">
                              Modelos rejeitados pela Meta
                            </p>
                            <ul className="space-y-1">
                              {rejeitados.map((r) => (
                                <li key={r.nome}>
                                  <span className="font-mono text-xs">{r.nome}</span>
                                  <span className="text-text-muted"> — {r.motivo ?? 'motivo não informado'}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default WhatsappOficialSaloes;
