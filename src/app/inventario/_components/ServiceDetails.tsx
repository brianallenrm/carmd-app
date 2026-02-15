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
        // Parse existing tags and toggle
        const currentTags = data.serviceType
            ? data.serviceType.split(',').map(t => t.trim()).filter(Boolean)
            : [];
        const tagIndex = currentTags.indexOf(tag);
        if (tagIndex >= 0) {
            // Remove tag if already present
            currentTags.splice(tagIndex, 1);
        } else {
            currentTags.push(tag);
        }
        handleChange('serviceType', currentTags.join(', '));
    };

    // Check which tags are currently selected
    const selectedTags = data.serviceType
        ? data.serviceType.split(',').map(t => t.trim())
        : [];

    return (
        <div className="w-full max-w-lg mx-auto space-y-6" id="tutorial-service-details">

            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Detalles del Servicio</h3>
                <p className="text-slate-500 text-xs">Información final para la orden.</p>
            </div>

            <div className="space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar p-1">

                {/* 1. Service Type */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        <FileText size={14} className="text-[#F37014]" /> Presupuesto / Motivo de Ingreso *
                    </label>

                    {/* Quick Tags - Toggle on/off */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {SERVICE_TAGS.map(tag => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => handleTagClick(tag)}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-full border transition-all shadow-sm ${isSelected
                                            ? 'bg-[#F37014] text-white border-[#F37014]'
                                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                >
                                    {isSelected ? '✓ ' : '+ '}{tag}
                                </button>
                            );
                        })}
                    </div>

                    <textarea
                        value={data.serviceType}
                        onChange={(e) => handleChange('serviceType', e.target.value)}
                        placeholder="Ej. Revisión de frenos traseros y cambio de aceite..."
                        className="w-full h-24 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-[#F37014] resize-none shadow-sm transition-all"
                    />
                </div>

                {/* 2. Valuables Toggle */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-tight">
                            <Briefcase size={18} className="text-[#F37014]" /> ¿Deja objetos de valor?
                        </label>
                        <button
                            onClick={() => handleChange('hasValuables', !data.hasValuables)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border shadow-inner ${data.hasValuables ? 'bg-[#F37014] border-[#F37014]' : 'bg-slate-100 border-slate-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${data.hasValuables ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 mb-2 font-medium">
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
                                    className="w-full mt-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold outline-none focus:border-[#F37014] shadow-inner"
                                    autoFocus
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. Advisor Name */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        <User size={14} className="text-[#F37014]" /> Asesor (¿Quién recibe?) *
                    </label>
                    <input
                        type="text"
                        value={data.advisorName}
                        onChange={(e) => handleChange('advisorName', e.target.value)}
                        placeholder="Tu Nombre"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:border-[#F37014] shadow-sm transition-all"
                    />
                </div>

                {/* 5. General Comments */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        <AlertTriangle size={14} className="text-[#F37014]" /> Comentarios Adicionales
                    </label>
                    <textarea
                        value={data.comments}
                        onChange={(e) => handleChange('comments', e.target.value)}
                        placeholder="Golpes previos, ruidos extraños, recomendaciones..."
                        className="w-full h-24 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-[#F37014] resize-none shadow-sm transition-all"
                    />
                </div>

            </div>
        </div>
    );
}
