import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';

export default function MaterialConfig() {
    const [texto, setTexto] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    async function carregar() {
        setCarregando(true);
        setErro('');
        try {
            const data = await apiService.get<{ copy_template: string }>('/afiliados/admin/material/config');
            setTexto(data.copy_template);
        } catch { setErro('Não foi possível carregar a copy.'); }
        finally { setCarregando(false); }
    }
    useEffect(() => { void carregar(); }, []);

    return <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold">Material de divulgação</h3>
        <p className="text-sm text-muted-foreground">A cliente envia a foto e gera um banner com o fundo oficial Unna, nome, Instagram e a tag Parceira Oficial Unna.</p>
        <label className="block text-sm font-medium">Copy padrão da legenda
            <textarea disabled={carregando || salvando} value={texto} maxLength={4000} rows={7} onChange={e => { setTexto(e.target.value); setSucesso(''); }} className="mt-2 w-full rounded-lg border border-border bg-background p-3 font-normal" />
        </label>
        <p className="text-xs text-muted-foreground">Use {'{nome}'}, {'{instagram}'} e {'{codigo}'} para personalizar. A cliente pode editar a legenda antes de copiar. Alterar este texto não configura descontos na assinatura.</p>
        {erro && <p role="alert" className="text-sm text-destructive">{erro} <button type="button" onClick={carregar} className="underline">Recarregar</button></p>}
        {sucesso && <p role="status" className="text-sm text-green-600">{sucesso}</p>}
        <button type="button" disabled={carregando || salvando || !texto.trim()} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 disabled:opacity-50" onClick={async () => {
            setSalvando(true); setErro(''); setSucesso('');
            try {
                const saved = await apiService.put<{ copy_template: string }>('/afiliados/admin/material/config', { copy_template: texto });
                setTexto(saved.copy_template); setSucesso('Copy salva para as próximas gerações.');
            } catch { setErro('Não foi possível salvar a copy.'); }
            finally { setSalvando(false); }
        }}>{carregando ? 'Carregando…' : salvando ? 'Salvando…' : 'Salvar copy'}</button>
    </section>;
}
