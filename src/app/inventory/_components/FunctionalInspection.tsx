'use client';

import React, { useEffect } from 'react';
import { Volume2, Droplets, Layers, CircleDashed, CheckCircle, XCircle, Lightbulb, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FunctionalData {
    horn: boolean;
    wipers: boolean;
    radio: boolean;

    // Group: Lights
    lightsAllOk: boolean;
    lightsHead: boolean;       // Faros
    lightsTail: boolean;       // Calaveras
    lightsStop: boolean;       // Stop
    lightsTurn: boolean;       // Intermitentes/Direccionales

    // Group: Windows/Mirrors
    windowsAllOk: boolean;
    windowPiloto: boolean;     // Ventana Piloto (conductor)
    windowCopiloto: boolean;   // Ventana Copiloto
    windowRearLeft: boolean;   // Ventana Trasera Izq
    windowRearRight: boolean;  // Ventana Trasera Der
    sunroof: boolean;          // Quemacocos
    mirrors: boolean;          // Espejos eléctricos

    floormats: string; // "0"..."4", "Completo"
    hubcaps: string;   // "0"..."4", "Rines"
    hasRines: boolean; // true = vehicle has rines (alloy wheels), no tapones
}

interface FunctionalInspectionProps {
    data: FunctionalData;
    onChange: (data: FunctionalData) => void;
}

export default function FunctionalInspection({ data, onChange }: FunctionalInspectionProps) {

    // Derive group statuses via useEffect (NOT during render)
    const allLightsOk = data.lightsHead && data.lightsTail && data.lightsStop && data.lightsTurn;
    const allWindowsOk = data.windowPiloto && data.windowCopiloto && data.windowRearLeft && data.windowRearRight && data.sunroof && data.mirrors;

    useEffect(() => {
        if (data.lightsAllOk !== allLightsOk || data.windowsAllOk !== allWindowsOk) {
            onChange({ ...data, lightsAllOk: allLightsOk, windowsAllOk: allWindowsOk });
        }
    }, [allLightsOk, allWindowsOk]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = (field: keyof FunctionalData) => {
        onChange({ ...data, [field]: !data[field] });
    };

    const handleCount = (field: 'floormats' | 'hubcaps', val: string) => {
        onChange({ ...data, [field]: val });
    };

    return (
        <div className="w-full max-w-lg mx-auto space-y-6 pb-20" id="tutorial-functional-inspection">

            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Inspección Funcional</h3>
                <p className="text-slate-500 text-xs">
                    Verifica el funcionamiento de los sistemas clave.
                </p>
            </div>

            <div className="space-y-4">

                {/* 1. Claxon & Limpias (Standalone) */}
                <div className="grid grid-cols-3 gap-4">
                    <FeatureToggle
                        label="Claxon"
                        icon={Volume2}
                        active={data.horn}
                        onClick={() => toggle('horn')}
                    />
                    <FeatureToggle
                        label="Limpiaparabrisas"
                        icon={Droplets}
                        active={data.wipers}
                        onClick={() => toggle('wipers')}
                    />
                    <FeatureToggle
                        label="Radio / Estéreo"
                        icon={Zap}
                        active={data.radio}
                        onClick={() => toggle('radio')}
                    />
                </div>

                {/* 2. Group: Lights - Always expanded */}
                <div className={`p-4 rounded-xl border-2 transition-colors ${allLightsOk ? 'bg-green-50/50 border-green-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${allLightsOk ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Lightbulb size={20} />
                            </div>
                            <span className="font-bold text-slate-900">Iluminación Exterior</span>
                        </div>
                        {allLightsOk
                            ? <span className="text-green-600 text-[10px] font-black uppercase flex items-center gap-1"><CheckCircle size={14} /> Todo OK</span>
                            : <span className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1">Falla Reportada</span>
                        }
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <SubFeatureToggle label="Faros" active={data.lightsHead} onClick={() => toggle('lightsHead')} />
                        <SubFeatureToggle label="Calaveras" active={data.lightsTail} onClick={() => toggle('lightsTail')} />
                        <SubFeatureToggle label="Stop" active={data.lightsStop} onClick={() => toggle('lightsStop')} />
                        <SubFeatureToggle label="Intermitentes" active={data.lightsTurn} onClick={() => toggle('lightsTurn')} />
                    </div>
                </div>

                {/* 3. Group: Windows/Mirrors - Always expanded */}
                <div className={`p-4 rounded-xl border-2 transition-colors ${allWindowsOk ? 'bg-green-50/50 border-green-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${allWindowsOk ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Zap size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-900">Cristales y Espejos</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Solo si son eléctricos</span>
                            </div>
                        </div>
                        {allWindowsOk
                            ? <span className="text-green-600 text-[10px] font-black uppercase flex items-center gap-1"><CheckCircle size={14} /> Todo OK</span>
                            : <span className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1">Falla Reportada</span>
                        }
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <SubFeatureToggle label="Piloto" active={data.windowPiloto} onClick={() => toggle('windowPiloto')} />
                        <SubFeatureToggle label="Copiloto" active={data.windowCopiloto} onClick={() => toggle('windowCopiloto')} />
                        <SubFeatureToggle label="Trasera Izq" active={data.windowRearLeft} onClick={() => toggle('windowRearLeft')} />
                        <SubFeatureToggle label="Trasera Der" active={data.windowRearRight} onClick={() => toggle('windowRearRight')} />
                        <SubFeatureToggle label="Quemacocos" active={data.sunroof} onClick={() => toggle('sunroof')} />
                        <SubFeatureToggle label="Espejos Eléctricos" active={data.mirrors} onClick={() => toggle('mirrors')} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                {/* Tapetes Count */}
                <CountSelector
                    label="Tapetes (Juego)"
                    icon={Layers}
                    value={data.floormats}
                    onChange={(v) => handleCount('floormats', v)}
                    options={['0', '1', '2', '3', '4', 'Completo']}
                />

                {/* Tapones / Rines */}
                <div>
                    {/* Toggle: Tapones vs Rines */}
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => onChange({ ...data, hasRines: false, hubcaps: data.hasRines ? '4' : data.hubcaps })}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!data.hasRines
                                ? 'bg-[#F37014] text-white'
                                : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                        >
                            Tapones
                        </button>
                        <button
                            onClick={() => onChange({ ...data, hasRines: true, hubcaps: 'Rines' })}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${data.hasRines
                                ? 'bg-[#F37014] text-white'
                                : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                        >
                            Rines
                        </button>
                    </div>
                    {data.hasRines ? (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center flex items-center justify-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-green-600 text-xs font-black uppercase tracking-widest">Vehículo con Rines</span>
                        </div>
                    ) : (
                        <CountSelector
                            label="Tapones"
                            icon={CircleDashed}
                            value={data.hubcaps}
                            onChange={(v) => handleCount('hubcaps', v)}
                            options={['0', '1', '2', '3', '4']}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-components
function FeatureToggle({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) {
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-colors h-24 text-center shadow-sm ${active
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
                }`}
        >
            <div className={`p-2 rounded-full mb-2 ${active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                <Icon size={20} />
            </div>
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-tighter leading-tight ${active ? 'text-green-700' : 'text-red-700'}`}>
                {label}
            </span>
        </motion.div>
    );
}

function SubFeatureToggle({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors border shadow-sm ${active
                ? 'bg-white border-slate-100 hover:border-slate-300'
                : 'bg-red-50 border-red-200'
                }`}
        >
            <span className={`text-[10px] font-bold uppercase tracking-tighter ${active ? 'text-slate-600' : 'text-red-700'}`}>{label}</span>
            {active
                ? <CheckCircle size={14} className="text-green-500" />
                : <XCircle size={14} className="text-red-500" />
            }
        </div>
    );
}

function CountSelector({ label, icon: Icon, value, onChange, options }: { label: string, icon: any, value: string, onChange: (v: string) => void, options: string[] }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
                <Icon size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-black transition-all ${value === opt
                            ? 'bg-[#F37014] text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {opt === 'Completo' ? 'Todo' : opt}
                    </button>
                ))}
            </div>
        </div>
    );
}
