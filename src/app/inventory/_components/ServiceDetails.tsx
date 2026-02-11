'use client';

import React from 'react';
import { Briefcase, DollarSign, User, FileText, Wallet, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ServiceData {
    serviceType: string;
    hasValuables: boolean;
    valuablesDescription: string;
    advisorName: string;
    comments: string;
}

interface ServiceDetailsProps {
    data: ServiceData;
    onChange: (data: ServiceData) => void;
}

const SERVICE_TAGS = [
    'Afinación', 'Frenos', 'Suspensión',
    'Diagnóstico', 'Cambio de Aceite', 'Clutch',
    'Eléctrico', 'Llantas'
];

export default function ServiceDetails({ data, onChange }: ServiceDetailsProps) {

    const handleChange = (field: keyof ServiceData, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const handleTagClick = (tag: string) => {
        // Appends to existing text or starts new
        const current = data.serviceType;
        const newValue = current ? `${current}, ${tag}` : tag;
        handleChange('serviceType', newValue);
    };

    return (
        <div className="w-full max-w-lg mx-auto space-y-6">

            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">Detalles del Servicio</h3>
                <p className="text-neutral-400 text-xs">Información final para la orden.</p>
            </div>

            <div className="space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar p-1">

                {/* 1. Service Type */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase">
                        <FileText size={14} /> Presupuesto / Motivo de Ingreso *
                    </label>

                    {/* Quick Tags */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {SERVICE_TAGS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded-full border border-neutral-700 transition-colors"
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={data.serviceType}
                        onChange={(e) => handleChange('serviceType', e.target.value)}
                        placeholder="Ej. Revisión de frenos traseros y cambio de aceite..."
                        className="w-full h-20 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500 resize-none"
                    />
                </div>

                {/* 2. Valuables Toggle */}
                <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-white">
                            <Briefcase size={16} /> ¿Deja objetos de valor?
                        </label>
                        <button
                            onClick={() => handleChange('hasValuables', !data.hasValuables)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.hasValuables ? 'bg-rose-600' : 'bg-neutral-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.hasValuables ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <p className="text-xs text-neutral-500 mb-2">
                        {data.hasValuables ? 'Describe los objetos abajo.' : 'Marca si deja laptop, herramientas extra, etc.'}
                    </p>

                    <AnimatePresence>
                        {data.hasValuables && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <input
                                    type="text"
                                    value={data.valuablesDescription}
                                    onChange={(e) => handleChange('valuablesDescription', e.target.value)}
                                    placeholder="Ej. MacBook Pro en cajuela, Lentes RayBan..."
                                    className="w-full mt-2 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white outline-none focus:border-rose-500"
                                    autoFocus
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. Advisor Name */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase">
                        <User size={14} /> Asesor (¿Quién recibe?) *
                    </label>
                    <input
                        type="text"
                        value={data.advisorName}
                        onChange={(e) => handleChange('advisorName', e.target.value)}
                        placeholder="Tu Nombre"
                        className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white outline-none focus:border-rose-500"
                    />
                </div>

                {/* 5. General Comments */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase">
                        <AlertTriangle size={14} /> Comentarios Adicionales del Vehículo
                    </label>
                    <textarea
                        value={data.comments}
                        onChange={(e) => handleChange('comments', e.target.value)}
                        placeholder="Golpes previos, ruidos extraños, recomendaciones..."
                        className="w-full h-20 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500 resize-none"
                    />
                </div>

            </div>
        </div>
    );
}
