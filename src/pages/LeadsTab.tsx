import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/select';
import {
  Send, X, RefreshCw, Eye, Upload, Copy, CheckCircle, XCircle, Clock,
  ChevronLeft, ChevronRight, AlertCircle, Users, MousePointer, Tag, Link2, Trash2
} from 'lucide-react';
import { marketingService, EmailTemplate, EmailLeadEnvio, LeadInput } from '@/services/marketing.service';
import { toast } from 'sonner';

const VARIAVEIS_LEAD = ['{{nome_lead}}', '{{email_lead}}', '{{link_acesso}}', '{{data_hoje}}', '{{link_unsubscribe}}'];

const EXEMPLO_JSON = `[
  { "nome": "Maria Silva", "email": "maria@exemplo.com" },
  { "nome": "João Santos", "email": "joao@exemplo.com" },
  { "nome": "Ana Oliveira", "email": "ana@exemplo.com" }
]`;

/* ── Modal de histórico de leads ── */
const HistoricoLeadModal = ({ template, onClose }: { template: EmailTemplate; onClose: () => void }) => {
  const [historico, setHistorico] = useState<EmailLeadEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await marketingService.getHistoricoEnviosLead(template.id, p);
      setHistorico(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch { toast.error('Erro ao carregar histórico de leads.'); }
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-gray-900">Histórico de Envios — Leads</h2>
            <p className="text-xs text-gray-400">{template.nome} — {total} envio(s)</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw size={24} className="animate-spin text-primary" /></div>
          ) : historico.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-12">Nenhum envio para leads registrado.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] uppercase text-gray-400 font-bold">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Clicou</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historico.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{h.nome_lead}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{h.email_destino}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {statusIcon(h.status)}
                        <span className="text-[10px] font-bold uppercase">{h.status}</span>
                      </div>
                      {h.erro_msg && <p className="text-[9px] text-red-400 mt-0.5">{h.erro_msg}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {h.clicou_link ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 text-green-600">
                            <MousePointer size={12} />
                            <span className="text-[10px] font-bold">SIM</span>
                          </div>
                          {h.clicou_em && (
                            <span className="text-[9px] text-gray-400">{new Date(h.clicou_em).toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold">—</span>
                      )}
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

/* ── Tab principal de Leads ── */
const LeadsTab = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [linkDestino, setLinkDestino] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [leads, setLeads] = useState<LeadInput[]>([]);
  const [jsonError, setJsonError] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [sending, setSending] = useState(false);
  const [resultado, setResultado] = useState<{ enviados: number; pulados: number; erros: number } | null>(null);
  const [historicoTemplate, setHistoricoTemplate] = useState<EmailTemplate | undefined>();

  useEffect(() => {
    marketingService.listarTemplates()
      .then(t => { setTemplates(t.filter(tp => tp.ativo)); setLoadingTemplates(false); })
      .catch(() => { toast.error('Erro ao carregar templates.'); setLoadingTemplates(false); });
  }, []);

  const parseJson = (text: string) => {
    setJsonText(text);
    setJsonError('');
    setLeads([]);

    if (!text.trim()) return;

    try {
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        setJsonError('O JSON deve ser um array de objetos.');
        return;
      }

      const invalidos: string[] = [];
      const validados: LeadInput[] = [];

      parsed.forEach((item: any, i: number) => {
        if (!item.nome || typeof item.nome !== 'string') {
          invalidos.push(`Índice ${i}: campo "nome" ausente ou inválido`);
          return;
        }
        if (!item.email || typeof item.email !== 'string' || !item.email.includes('@')) {
          invalidos.push(`Índice ${i}: campo "email" ausente ou inválido (${item.email || 'vazio'})`);
          return;
        }
        validados.push({ nome: item.nome.trim(), email: item.email.trim().toLowerCase() });
      });

      if (invalidos.length > 0) {
        setJsonError(`${invalidos.length} item(ns) com problema:\n${invalidos.slice(0, 5).join('\n')}${invalidos.length > 5 ? `\n...e mais ${invalidos.length - 5}` : ''}`);
      }

      // Remover duplicados por email
      const uniqueMap = new Map<string, LeadInput>();
      validados.forEach(l => uniqueMap.set(l.email, l));
      setLeads(Array.from(uniqueMap.values()));
    } catch (e: any) {
      setJsonError(`JSON inválido: ${e.message}`);
    }
  };

  const handleSend = async () => {
    if (!templateId) { toast.error('Selecione um template.'); return; }
    if (!linkDestino) { toast.error('Informe a URL de destino.'); return; }
    if (leads.length === 0) { toast.error('Nenhum lead válido para enviar.'); return; }

    try {
      setSending(true);
      const res = await marketingService.enviarCampanhaLeads(templateId, leads, linkDestino);
      setResultado(res);
      toast.success(`Campanha concluída: ${res.enviados} enviado(s), ${res.pulados} pulado(s), ${res.erros} erro(s)`);
    } catch { toast.error('Erro ao enviar campanha de leads.'); }
    finally { setSending(false); }
  };

  const clearAll = () => {
    setJsonText('');
    setLeads([]);
    setJsonError('');
    setResultado(null);
    setTemplateId('');
    setLinkDestino('');
  };

  const selectedTemplate = templates.find(t => t.id === templateId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Disparo para Leads Externos</h2>
          <p className="text-xs text-gray-400">Envie e-mails para leads não cadastrados no sistema, com rastreamento de cliques</p>
        </div>
      </div>

      {resultado ? (
        /* ── Resultado do envio ── */
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">Campanha Finalizada</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Enviados', value: resultado.enviados, color: 'bg-green-50 text-green-700' },
                { label: 'Pulados', value: resultado.pulados, color: 'bg-yellow-50 text-yellow-700' },
                { label: 'Erros', value: resultado.erros, color: 'bg-red-50 text-red-700' },
              ].map(k => (
                <div key={k.label} className={`${k.color} rounded-xl p-4 text-center`}>
                  <p className="text-2xl font-black">{k.value}</p>
                  <p className="text-xs font-bold uppercase mt-1">{k.label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 text-center">
              Os "pulados" podem ser leads que fizeram opt-out ou sem e-mail válido.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={clearAll}>Nova Campanha</Button>
              {selectedTemplate && (
                <Button className="flex-1 bg-primary text-white" onClick={() => setHistoricoTemplate(selectedTemplate)}>
                  <Eye size={14} className="mr-2" /> Ver Histórico
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ── Formulário de envio ── */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Coluna esquerda: JSON Input */}
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Upload size={12} /> JSON de Leads
                  </label>
                  <button
                    onClick={() => { parseJson(EXEMPLO_JSON); }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Copy size={10} /> Usar exemplo
                  </button>
                </div>

                <textarea
                  value={jsonText}
                  onChange={e => parseJson(e.target.value)}
                  placeholder={`Cole aqui o JSON no formato:\n${EXEMPLO_JSON}`}
                  rows={12}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none bg-gray-50 placeholder:text-gray-300"
                  spellCheck={false}
                />

                {jsonError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 flex items-start gap-2">
                    <XCircle size={14} className="mt-0.5 shrink-0" />
                    <pre className="whitespace-pre-wrap font-mono">{jsonError}</pre>
                  </div>
                )}

                {leads.length > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700 flex items-center gap-2">
                    <CheckCircle size={14} />
                    <span><strong>{leads.length}</strong> lead(s) válido(s) identificado(s)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coluna direita: Configurações */}
            <div className="space-y-4">
              {/* Template */}
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase">Template de E-mail</label>
                  {loadingTemplates ? (
                    <p className="text-xs text-gray-400">Carregando templates...</p>
                  ) : (
                    <Select value={templateId} onChange={(e: any) => setTemplateId(e.target.value)}>
                      <option value="">Selecionar template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.nome} {t.categoria ? `(${t.categoria})` : ''}</option>
                      ))}
                    </Select>
                  )}

                  {selectedTemplate && (
                    <div className="bg-gray-50 border rounded-xl p-3 space-y-1">
                      <p className="text-xs font-bold text-gray-700">{selectedTemplate.assunto}</p>
                      {selectedTemplate.variaveis.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedTemplate.variaveis.map(v => (
                            <code key={v} className="text-[9px] bg-white border text-blue-600 px-1.5 py-0.5 rounded font-mono">{v}</code>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => setHistoricoTemplate(selectedTemplate)}
                        className="text-[10px] text-blue-600 hover:underline font-bold mt-2 flex items-center gap-1"
                      >
                        <Eye size={10} /> Ver histórico de envios
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* URL de destino */}
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Link2 size={12} /> URL de Destino (link tracked)
                  </label>
                  <Input
                    value={linkDestino}
                    onChange={e => setLinkDestino(e.target.value)}
                    placeholder="https://unna.app.br/registro"
                  />
                  <p className="text-[10px] text-gray-400">
                    O link gerado no <code className="bg-gray-100 px-1 rounded font-mono">{'{{link_acesso}}'}</code> apontará diretamente para esta URL com parâmetros UTM e tracking de clique (ex: <code className="bg-gray-100 px-1 rounded font-mono text-[9px]">?utm_source=unna_email&ct=...</code>).
                  </p>
                </CardContent>
              </Card>

              {/* Preview de leads */}
              {leads.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                        <Users size={12} /> Leads ({leads.length})
                      </label>
                      <button onClick={() => { setJsonText(''); setLeads([]); }} className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1">
                        <Trash2 size={10} /> Limpar
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 border rounded-xl p-2">
                      {leads.map((l, i) => (
                        <div key={i} className="text-xs text-gray-600 flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                            {l.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium truncate">{l.nome}</span>
                          <span className="text-gray-400 ml-auto truncate text-[10px]">{l.email}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Botão de envio */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={clearAll}>
              <Trash2 size={14} className="mr-2" /> Limpar Tudo
            </Button>
            <Button
              className="flex-1 bg-primary text-white"
              onClick={handleSend}
              disabled={sending || !templateId || !linkDestino || leads.length === 0}
            >
              {sending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
              {sending ? 'Enviando...' : `Disparar para ${leads.length} Lead(s)`}
            </Button>
          </div>
        </>
      )}

      {/* Info variáveis */}
      <Card className="bg-purple-50/50 border-purple-100">
        <CardContent className="p-4">
          <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1">
            <Tag size={12} /> Variáveis disponíveis para templates de leads
          </p>
          <div className="flex flex-wrap gap-2">
            {VARIAVEIS_LEAD.map(v => (
              <code key={v} className="text-[10px] bg-white border border-purple-100 text-purple-600 px-2 py-0.5 rounded font-mono">{v}</code>
            ))}
          </div>
          <p className="text-[10px] text-purple-500 mt-2">
            Use <code className="font-mono bg-white px-1 rounded">{'{{link_acesso}}'}</code> no corpo do template para inserir o link rastreado automaticamente.
          </p>
        </CardContent>
      </Card>

      {/* Modal de histórico */}
      {historicoTemplate && (
        <HistoricoLeadModal template={historicoTemplate} onClose={() => setHistoricoTemplate(undefined)} />
      )}
    </div>
  );
};

export default LeadsTab;
