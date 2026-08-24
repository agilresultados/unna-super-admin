import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
    Megaphone,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Calendar,
    MousePointer2,
    TrendingUp,
    Layout,
    LayoutPanelLeft
} from 'lucide-react';
import { campanhaService, Campanha } from '@/services/campanha.service';
import CampanhaModal from './CampanhaModal';

const Campanhas = () => {
    const [campanhas, setCampanhas] = useState<Campanha[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCampanha, setSelectedCampanha] = useState<Campanha | undefined>(undefined);
    const [metrics, setMetrics] = useState<Record<string, any>>({});

    useEffect(() => {
        loadCampanhas();
    }, []);

    const loadCampanhas = async () => {
        try {
            setLoading(true);
            const data = await campanhaService.findAll();
            setCampanhas(data);

            // Load metrics for each campaign
            const metricsData: Record<string, any> = {};
            await Promise.all(data.map(async (c) => {
                try {
                    const m = await campanhaService.getMetrics(c.id);
                    metricsData[c.id] = m;
                } catch (e) {
                    console.error(`Error loading metrics for ${c.id}`, e);
                }
            }));
            setMetrics(metricsData);
        } catch (error) {
            console.error('Error loading campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Deseja realmente excluir esta campanha?')) {
            try {
                await campanhaService.remove(id);
                loadCampanhas();
            } catch (error) {
                console.error('Error deleting campaign:', error);
            }
        }
    };

    const filteredCampanhas = campanhas.filter(c =>
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 max-w-full space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sans">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Banner Campaigns</h1>
                    <p className="text-sm text-gray-500">Manage promotional banners and partnerships</p>
                </div>
                <Button onClick={() => {
                    setSelectedCampanha(undefined);
                    setModalOpen(true);
                }} className="bg-primary hover:bg-primary/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Campanha
                </Button>
            </div>

            <Card className="bg-white shadow-sm border-0 border-b-2 border-primary/10">
                <CardContent className="p-4">
                    <div className="flex-1 relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Buscar campanhas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 text-sm"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b text-[11px] uppercase tracking-wider text-gray-500 font-bold font-sans">
                                <th className="px-6 py-4">Campanha</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Cliques / Vistas</th>
                                <th className="px-6 py-4 text-center">CTR</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-sans">
                            {filteredCampanhas.map((c) => {
                                const m = metrics[c.id] || { vistas: 0, cliques: 0 };
                                const ctr = m.vistas > 0 ? ((m.cliques / m.vistas) * 100).toFixed(2) : '0.00';

                                return (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border ${c.tipo === 'FLUTUANTE_9_16' ? 'aspect-[9/16]' : 'aspect-video'}`}>
                                                    <img src={c.imagem_url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{c.titulo}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">
                                                        {c.empresaId ? `Empresa: ${c.empresaId.slice(0, 8)}...` : 'Global'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                {c.tipo === 'FIXA_MENU' ? <LayoutPanelLeft size={14} className="text-purple-500" /> : <Layout size={14} className="text-blue-500" />}
                                                {c.tipo === 'FLUTUANTE' ? 'Floating (16:9)' : c.tipo === 'FLUTUANTE_9_16' ? 'Floating (9:16)' : 'Sidebar (4:3)'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${(c as any).ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {(c as any).ativo ? 'Ativa' : 'Inativa'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date((c as any).data_inicio).toLocaleDateString()} - {new Date((c as any).data_fim).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-gray-900">{m.cliques}</p>
                                                    <p className="text-[10px] text-gray-400">Cliques</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-gray-900">{m.vistas}</p>
                                                    <p className="text-[10px] text-gray-400">Vistas</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                                                <TrendingUp size={12} />
                                                {ctr}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-primary transition-colors"
                                                    onClick={() => {
                                                        setSelectedCampanha(c);
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 transition-colors"
                                                    onClick={() => handleDelete(c.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <CampanhaModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                campanha={selectedCampanha}
                onSuccess={loadCampanhas}
            />
        </div>
    );
};

export default Campanhas;
