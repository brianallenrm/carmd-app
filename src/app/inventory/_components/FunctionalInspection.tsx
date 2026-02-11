'use client';

import React, { useEffect } from 'react';
import { Volume2, Droplets, Layers, CircleDashed, CheckCircle, XCircle, Lightbulb, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FunctionalData {
    horn: boolean;
    wipers: boolean;

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
        <div className="w-full max-w-lg mx-auto space-y-6 pb-20">

            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">Inspección Funcional</h3>
                <p className="text-neutral-400 text-xs">
                    Verifica el funcionamiento de los sistemas clave.
                </p>
            </div>

            <div className="space-y-4">

                {/* 1. Claxon & Limpias (Standalone) */}
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                {/* 2. Group: Lights - Always expanded */}
                <div className={`p-4 rounded-xl border-2 transition-colors ${allLightsOk ? 'bg-green-500/10 border-green-500/50' : 'bg-neutral-800 border-neutral-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${allLightsOk ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-400'}`}>
                                <Lightbulb size={20} />
                            </div>
                            <span className="font-bold text-white">Iluminación Exterior</span>
                        </div>
                        {allLightsOk
                            ? <span className="text-green-400 text-xs font-bold uppercase flex items-center gap-1"><CheckCircle size={14} /> Todo OK</span>
                            : <span className="text-rose-400 text-xs font-bold uppercase flex items-center gap-1">Falla Reportada</span>
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
                <div className={`p-4 rounded-xl border-2 transition-colors ${allWindowsOk ? 'bg-green-500/10 border-green-500/50' : 'bg-neutral-800 border-neutral-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${allWindowsOk ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-400'}`}>
                                <Zap size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white">Cristales y Espejos</span>
                                <span className="text-[10px] text-neutral-500">Solo si son eléctricos</span>
                            </div>
                        </div>
                        {allWindowsOk
                            ? <span className="text-green-400 text-xs font-bold uppercase flex items-center gap-1"><CheckCircle size={14} /> Todo OK</span>
                            : <span className="text-rose-400 text-xs font-bold uppercase flex items-center gap-1">Falla Reportada</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
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
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!data.hasRines
                                ? 'bg-rose-600 text-white'
                                : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
                        >
                            Tapones
                        </button>
                        <button
                            onClick={() => onChange({ ...data, hasRines: true, hubcaps: 'Rines' })}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${data.hasRines
                                ? 'bg-rose-600 text-white'
                                : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
                        >
                            Rines
                        </button>
                    </div>
                    {data.hasRines ? (
                        <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700 text-center">
                            <span className="text-green-400 text-sm font-bold">✓ Vehículo con Rines</span>
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
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-colors h-24 text-center ${active
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-rose-500/10 border-rose-500/50'
                }`}
        >
            <div className={`p-2 rounded-full mb-2 ${active ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/20 text-rose-400'}`}>
                <Icon size={20} />
            </div>
            <span className={`text-xs font-bold leading-tight ${active ? 'text-green-100' : 'text-rose-100'}`}>{label}</span>
        </motion.div>
    );
}

function SubFeatureToggle({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors border ${active
                ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'
                : 'bg-rose-900/20 border-rose-500/50'
                }`}
        >
            <span className={`text-xs font-medium ${active ? 'text-neutral-300' : 'text-rose-200'}`}>{label}</span>
            {active
                ? <CheckCircle size={14} className="text-neutral-600" />
                : <XCircle size={14} className="text-rose-500" />
            }
        </div>
    );
}

function CountSelector({ label, icon: Icon, value, onChange, options }: { label: string, icon: any, value: string, onChange: (v: string) => void, options: string[] }) {
    return (
        <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
            <div className="flex items-center gap-2 mb-3 text-neutral-300">
                <Icon size={16} />
                <span className="text-sm font-bold">{label}</span>
            </div>
            <div className="flex gap-1 bg-neutral-900/80 p-1 rounded-lg">
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${value === opt
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        {opt === 'Completo' ? 'Todo' : opt}
                    </button>
                ))}
            </div>
        </div>
    );
}
