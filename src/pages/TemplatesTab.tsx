import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/select';
import {
  Plus, Edit, Trash2, Eye, RefreshCw, FileText, Tag,
  Send, X, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { marketingService, EmailTemplate, EmailCampanhaEnvio } from '@/services/marketing.service';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { toast } from 'sonner';

const VARIAVEIS = ['{{nome_empresa}}', '{{nome_admin}}', '{{dias_ativo}}', '{{plano}}', '{{data_hoje}}'];
const CATEGORIAS = ['reativacao', 'sazonais', 'onboarding', 'promocao', 'outro'];

/* ── Modal de criação/edição ── */
const TemplateModal = ({
  template, onClose, onSaved
}: { template?: EmailTemplate; onClose: () => void; onSaved: () => void }) => {
  const [nome, setNome] = useState(template?.nome ?? '');
  const [assunto, setAssunto] = useState(template?.assunto ?? '');
  const [categoria, setCategoria] = useState(template?.categoria ?? '');
  const [corpoHtml, setCorpoHtml] = useState(template?.corpo_html ?? '');
  const [corpoTexto, setCorpoTexto] = useState(template?.corpo_texto ?? '');
  const [saving, setSaving] = useState(false);

  const inserirVariavel = (v: string) => setCorpoHtml(h => h + v);

  const handleSave = async () => {
    if (!nome || !assunto || !corpoHtml) { toast.error('Nome, assunto e HTML são obrigatórios.'); return; }
    try {
      setSaving(true);
      const variaveis = VARIAVEIS.filter(v => corpoHtml.includes(v) || assunto.includes(v));
      const data = { nome, assunto, categoria: categoria || undefined, corpo_html: corpoHtml, corpo_texto: corpoTexto || undefined, variaveis };
      if (template?.id) await marketingService.atualizarTemplate(template.id, data);
      else await marketingService.criarTemplate(data);
      toast.success(template?.id ? 'Template atualizado!' : 'Template criado!');
      onSaved();
      onClose();
    } catch { toast.error('Erro ao salvar template.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="font-bold text-gray-900">{template?.id ? 'Editar Template' : 'Novo Template'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Nome do Template</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Recuperação Direta" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
              <Select value={categoria} onChange={(e: any) => setCategoria(e.target.value)}>
                <option value="">Selecionar...</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Assunto</label>
            <Input value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Assunto do e-mail..." />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase">Corpo do E-mail</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Inserir variável:</span>
                {VARIAVEIS.map(v => (
                  <button key={v} onClick={() => setCorpoHtml(h => h + v)}
                    className="text-[9px] font-mono bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <RichTextEditor value={corpoHtml} onChange={setCorpoHtml} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Corpo Texto Plano (opcional)</label>
            <textarea value={corpoTexto} onChange={e => setCorpoTexto(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 bg-primary text-white" onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw size={14} className="animate-spin mr-2" /> : null}
            {saving ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── Modal de histórico ── */
const HistoricoModal = ({ template, onClose }: { template: EmailTemplate; onClose: () => void }) => {
  const [historico, setHistorico] = useState<EmailCampanhaEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await marketingService.getHistoricoEnvios(template.id, p);
      setHistorico(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch { toast.error('Erro ao carregar histórico.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const statusIcon = (s: string) => {
    if (s === 'enviado') return <CheckCircle size={14} className="text-green-500" />;
    if (s === 'erro') return <XCircle size={14} className="text-red-500" />;
    return <Clock size={14} className="text-yellow-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-gray-900">Histórico de Envios</h2>
            <p className="text-xs text-gray-400">{template.nome} — {total} envio(s)</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw size={24} className="animate-spin text-primary" /></div>
          ) : historico.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-12">Nenhum envio registrado.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] uppercase text-gray-400 font-bold">
                <tr>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historico.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{h.empresa?.nome_negocio}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{h.email_destino}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {statusIcon(h.status)}
                        <span className="text-[10px] font-bold uppercase">{h.status}</span>
                      </div>
                      {h.erro_msg && <p className="text-[9px] text-red-400 mt-0.5">{h.erro_msg}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-3 border-t">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs font-bold">{page}/{pages}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Tab principal de Templates ── */
const TemplatesTab = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | undefined>();
  const [historicoTemplate, setHistoricoTemplate] = useState<EmailTemplate | undefined>();

  const load = async () => {
    try { setLoading(true); setTemplates(await marketingService.listarTemplates()); }
    catch { toast.error('Erro ao carregar templates.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este template permanentemente?')) return;
    try { await marketingService.deletarTemplate(id); toast.success('Removido.'); load(); }
    catch { toast.error('Erro ao remover template.'); }
  };

  const categoriaBadge = (c?: string) => {
    if (!c) return null;
    const colors: Record<string, string> = {
      reativacao: 'bg-orange-100 text-orange-700',
      sazonais: 'bg-pink-100 text-pink-700',
      onboarding: 'bg-green-100 text-green-700',
      promocao: 'bg-blue-100 text-blue-700',
      outro: 'bg-gray-100 text-gray-600',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors[c] ?? 'bg-gray-100 text-gray-600'}`}>{c}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Templates de E-mail</h2>
          <p className="text-xs text-gray-400">Gerencie os modelos de e-mail para campanhas</p>
        </div>
        <Button className="bg-primary text-white" onClick={() => { setEditing(undefined); setModalOpen(true); }}>
          <Plus size={14} className="mr-2" /> Novo Template
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-primary" /></div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center">
          <FileText size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-400">Nenhum template criado ainda.</p>
          <Button className="mt-4 bg-primary text-white" onClick={() => setModalOpen(true)}><Plus size={14} className="mr-1" /> Criar primeiro template</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-[11px] uppercase text-gray-400 font-bold">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Assunto</th>
                <th className="px-5 py-3 text-center">Enviados</th>
                <th className="px-5 py-3">Criado em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {templates.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${t.ativo ? 'bg-green-400' : 'bg-gray-300'}`} />
                      <span className="text-sm font-semibold text-gray-900">{t.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">{categoriaBadge(t.categoria)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-[220px] truncate">{t.assunto}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm font-bold text-gray-800">{t._count?.envios ?? 0}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setHistoricoTemplate(t)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500" title="Ver histórico"><Eye size={14} /></button>
                      <button onClick={() => { setEditing(t); setModalOpen(true); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" title="Editar"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(t.id)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500" title="Remover"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Variáveis disponíveis info */}
      <Card className="bg-blue-50/50 border-blue-100">
        <CardContent className="p-4">
          <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><Tag size={12} /> Variáveis disponíveis nos templates</p>
          <div className="flex flex-wrap gap-2">
            {VARIAVEIS.map(v => (
              <code key={v} className="text-[10px] bg-white border border-blue-100 text-blue-600 px-2 py-0.5 rounded font-mono">{v}</code>
            ))}
          </div>
          <p className="text-[10px] text-blue-500 mt-2">Estas variáveis são substituídas automaticamente pelos dados de cada empresa no momento do envio.</p>
        </CardContent>
      </Card>

      {modalOpen && <TemplateModal template={editing} onClose={() => setModalOpen(false)} onSaved={load} />}
      {historicoTemplate && <HistoricoModal template={historicoTemplate} onClose={() => setHistoricoTemplate(undefined)} />}
    </div>
  );
};

export default TemplatesTab;
