'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';

interface CatalogItem {
    id: string; // Changed to string to match Sheet ID (S-123)
    nombre: string;
    descripcion: string;
    costo_sugerido: number;
    frecuencia: number;
    categoria: string;
    tipo?: 'Servicio' | 'Refaccion';
}

export default function CatalogManager() {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Unified Fetch Logic
    const fetchCatalog = async (query: string) => {
        setLoading(true);
        try {
            const [resS, resP] = await Promise.all([
                fetch(`/api/catalog?type=servicios&search=${encodeURIComponent(query)}`),
                fetch(`/api/catalog?type=refacciones&search=${encodeURIComponent(query)}`)
            ]);

            const dataS = await resS.json();
            const dataP = await resP.json();

            setItems([
                ...(dataS.results || []).map((i: any) => ({ ...i, tipo: 'Servicio', id: `S-${i.id}` })),
                ...(dataP.results || []).map((i: any) => ({ ...i, tipo: 'Refaccion', id: `P-${i.id}` }))
            ]);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce Effect: Handles initial load AND search updates
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCatalog(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Simple state update for input
    const handleSearch = (query: string) => {
        setSearch(query);
    };

    const handleSave = async (item: Partial<CatalogItem>) => {
        setActionLoading(true);
        try {
            const action = isCreating ? 'create' : 'update';
            const res = await fetch('/api/catalog/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, item })
            });

            if (!res.ok) throw new Error("Failed");

            setEditingItem(null);
            setIsCreating(false);
            // Reload query
            handleSearch(search || '');
            alert("Guardado correctamente");
        } catch (error) {
            alert("Error al guardar");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres borrar este elemento?")) return;
        setActionLoading(true);
        try {
            await fetch('/api/catalog/update', {
                method: 'POST',
                body: JSON.stringify({ action: 'delete', item: { id } })
            });
            handleSearch(search || '');
        } catch (e) { alert("Error"); }
        finally { setActionLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto rounded-xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        <span className="text-[#F37014]">///</span> Catálogo Maestro
                    </h1>
                    <button
                        onClick={() => { setIsCreating(true); setEditingItem({ nombre: '', costo_sugerido: 0, tipo: 'Servicio' } as any); }}
                        className="flex items-center gap-2 bg-[#F37014] text-white px-4 py-2 rounded-lg hover:bg-[#d65f0e] transition-colors"
                    >
                        <Plus size={18} /> Nuevo Item
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar servicios o refacciones..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#F37014] focus:outline-none text-black placeholder-gray-500 font-medium"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                {/* Editor Modal */}
                {(editingItem || isCreating) && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-900">{isCreating ? 'Crear Nuevo' : 'Editar Elemento'}</h3>
                                <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className="text-gray-500 hover:text-red-600 font-bold bg-white rounded-full p-1">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-2 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#F37014]"
                                        value={editingItem?.nombre}
                                        onChange={e => setEditingItem(prev => ({ ...prev!, nombre: e.target.value }))}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-2 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#F37014]"
                                            value={editingItem?.tipo}
                                            onChange={e => setEditingItem(prev => ({ ...prev!, tipo: e.target.value as any }))}
                                            disabled={!isCreating}
                                        >
                                            <option value="Servicio">Servicio</option>
                                            <option value="Refaccion">Refacción</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Costo ($)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-lg p-2 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#F37014]"
                                            value={editingItem?.costo_sugerido}
                                            onChange={e => setEditingItem(prev => ({ ...prev!, costo_sugerido: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-2 h-24 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#F37014]"
                                        value={editingItem?.descripcion || ''}
                                        onChange={e => setEditingItem(prev => ({ ...prev!, descripcion: e.target.value }))}
                                    />
                                </div>

                                <button
                                    onClick={() => handleSave(editingItem!)}
                                    disabled={actionLoading}
                                    className="w-full bg-[#111827] text-white py-3 rounded-lg font-bold hover:bg-black transition-colors flex justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <Save />}
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#111827] text-white">
                            <tr>
                                <th className="text-left py-3 px-4">Nombre</th>
                                <th className="text-left py-3 px-4">Tipo</th>
                                <th className="text-right py-3 px-4">Costo</th>
                                <th className="text-center py-3 px-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Cargando...</td></tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 group">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-gray-900">{item.nombre}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1">{item.descripcion}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`text-xs px-2 py-1 rounded-full ${item.tipo === 'Servicio' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {item.tipo || 'item'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-medium text-[#F37014]">
                                        ${item.costo_sugerido?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-blue-100 hover:text-blue-600"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-red-100 hover:text-red-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && items.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            No se encontraron resultados
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
