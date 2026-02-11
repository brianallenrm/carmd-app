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
    const [result, setResult] = useState<any | null>(null);
    const [searched, setSearched] = useState(false);

    // Helper for robust search
    const normalize = (str: string) =>
        str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

    const handleSearch = () => {
        if (!query) return;
        setLoading(true);
        setSearched(true);
        setResult(null);

        fetch(`/api/clients?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    setResult(data.results[0]);
                } else {
                    setResult(null);
                }
            })
            .catch(err => {
                console.error("Search Error:", err);
                setResult(null);
            })
            .finally(() => setLoading(false));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleSelectVehicle = (client: any, vehicle: any) => {
        onClientFound({
            ...client,
            vehicle: vehicle // Flatten for the main app format
        });
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6">

            <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold text-white">Buscar Cliente</h3>
                <p className="text-neutral-400 text-sm">Ingresa placas o teléfono para autocompletar</p>
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSearched(false);
                        setResult(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: Susana Moya"
                    className="w-full bg-neutral-800 border-2 border-neutral-700 text-white text-lg px-4 py-4 rounded-xl focus:border-rose-500 outline-none transition-colors placeholder:text-neutral-600"
                />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 bg-rose-600 text-white px-4 rounded-lg font-medium hover:bg-rose-500 disabled:opacity-50 transition-colors"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Search />}
                </button>
            </div>

            {/* Quick Action for New Client */}
            <div className="flex justify-center">
                <button
                    onClick={onNewClient}
                    className="text-sm text-rose-500 hover:text-rose-400 font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={16} />
                    ¿Es cliente nuevo? Registrar ahora
                </button>
            </div>

            {/* Results Area */}
            {searched && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {result ? (
                        <div className="bg-neutral-800/50 border border-green-500/30 rounded-xl p-4 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-white">{result.name}</h4>
                                    <p className="text-neutral-400 text-sm">{result.phone}</p>
                                    <p className="text-neutral-500 text-xs mt-1">{result.address} {result.colonia}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-bold text-neutral-400 uppercase ml-1">Selecciona el vehículo:</p>
                                {result.vehicles.map((car: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectVehicle(result, car)}
                                        className="w-full flex items-center justify-between p-3 bg-neutral-900 hover:bg-neutral-700 border border-neutral-800 rounded-lg group transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Car size={20} className="text-rose-500" />
                                            <div className="text-sm">
                                                <span className="text-white font-medium block">{car.brand} {car.model} ({car.year})</span>
                                                <span className="text-neutral-500 font-mono text-xs">{car.plates}</span>
                                                {car.lastServiceDate && (
                                                    <span className="text-rose-400 text-[10px] block mt-0.5">
                                                        Último servicio: {car.lastServiceDate}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRight size={18} className="text-neutral-600 group-hover:text-white transition-colors" />
                                    </button>
                                ))}

                                <button
                                    onClick={() => handleSelectVehicle(result, { brand: '', model: '', year: '', plates: '', km: '', gas: '', serialNumber: '', motor: '' })}
                                    className="w-full flex items-center justify-center gap-2 p-2 mt-2 text-sm text-neutral-400 hover:text-white border border-dashed border-neutral-700 rounded-lg hover:border-neutral-500 transition-all"
                                >
                                    <Plus size={14} />
                                    Registrar otro vehículo para este cliente
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 py-8">
                            <p className="text-neutral-400">No encontramos a ningún cliente con esos datos.</p>
                            <button
                                onClick={onNewClient}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-medium transition-colors"
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
