'use client';

import React, { useState } from 'react';
import { Search, User, Car, Plus, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClientSearchProps {
    onClientFound: (data: any) => void;
    onNewClient: () => void;
}

export default function ClientSearch({ onClientFound, onNewClient }: ClientSearchProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = () => {
        if (!query) return;
        setLoading(true);
        setSearched(true);
        setResults([]);

        fetch(`/api/clients?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                setResults(data.results || []);
            })
            .catch(err => {
                console.error("Search Error:", err);
                setResults([]);
            })
            .finally(() => setLoading(false));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleSelectVehicle = (client: any, vehicle: any) => {
        onClientFound({
            ...client,
            vehicle: vehicle
        });
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
                    Buscar Cliente
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">v1.4</span>
                </h3>
                <p className="text-slate-500 text-sm">Ingresa placas, teléfono o nombre para autocompletar</p>
            </div>

            <div className="relative">
                <input
                    id="tutorial-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSearched(false);
                        setResults([]);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: Susana Moya"
                    className="w-full bg-white border-2 border-slate-200 text-slate-900 text-lg px-4 py-4 rounded-xl focus:border-[#F37014] outline-none transition-colors placeholder:text-slate-300 shadow-sm"
                />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 bg-[#F37014] text-white px-4 rounded-lg font-medium hover:bg-[#e06612] disabled:opacity-50 transition-colors shadow-lg shadow-[#F37014]/20"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Search />}
                </button>
            </div>

            <div className="flex justify-center">
                <button
                    id="tutorial-new-client"
                    onClick={onNewClient}
                    className="text-sm text-[#F37014] hover:text-[#e06612] font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={16} />
                    ¿Es cliente nuevo? Registrar ahora
                </button>
            </div>

            {searched && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((client: any) => (
                                <div key={client.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                                    {/* Client Header */}
                                    <div className="p-4 border-b border-slate-100 flex items-start gap-4">
                                        <div className="p-2.5 bg-[#F37014]/10 rounded-full text-[#F37014]">
                                            <User size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900">{client.name}</h4>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                <p className="text-slate-500 text-xs flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span> {client.phone || 'Sin teléfono'}
                                                </p>
                                                {client.address && client.address !== "00" && (
                                                    <p className="text-slate-400 text-[10px] truncate max-w-[200px]">
                                                        {client.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vehicles List */}
                                    <div className="p-2 space-y-1 bg-slate-50/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase ml-2 my-1">Selecciona el vehículo:</p>
                                        {client.vehicles.map((car: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectVehicle(client, car)}
                                                className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl group transition-all text-left shadow-sm hover:shadow-md"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-50 rounded-lg text-[#F37014] group-hover:bg-[#F37014] group-hover:text-white transition-colors">
                                                        <Car size={18} />
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="text-slate-900 font-semibold block">{car.brand} {car.model}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-slate-500 font-mono text-[11px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                                {car.plates}
                                                            </span>
                                                            {car.lastServiceDate && car.lastServiceDate !== "" && (
                                                                <span className="text-slate-600 text-[10px] font-medium">
                                                                    Última: {car.lastServiceDate}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ArrowRight size={18} className="text-slate-300 group-hover:text-[#F37014] transition-colors mr-2" />
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => handleSelectVehicle(client, { brand: '', model: '', year: '', plates: '', km: '', gas: '', serialNumber: '', motor: '' })}
                                            className="w-full flex items-center justify-center gap-2 p-2.5 mt-1 text-xs text-slate-400 hover:text-[#F37014] hover:bg-white border border-dashed border-slate-200 rounded-xl transition-all"
                                        >
                                            <Plus size={14} />
                                            Registrar otro vehículo
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center space-y-4 py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-400">No encontramos a ningún cliente.</p>
                            <button
                                onClick={onNewClient}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200"
                            >
                                <Plus size={20} />
                                Registrar Nuevo Cliente
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
