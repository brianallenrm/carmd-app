"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, AlertTriangle, CheckCircle, Clock, Zap,
    ChevronDown, ChevronUp, RefreshCw, Disc, Droplet,
    Wrench, Shield, Target, Lightbulb, ArrowRight,
    HelpCircle, Flame, ShieldAlert, Cpu
} from "lucide-react";

interface ComponentStatus {
    id: string;
    nombre: string;
    icono?: string;
    estado: string;
    nivel: 'alerta' | 'advertencia' | 'ok' | 'neutral';
    detalle: string;
    ultimaNota?: string;
}

interface StepperStep {
    paso: number;
    titulo: string;
    notaFolio?: string | null;
    km?: number | null;
    fecha?: string | null;
    estado: 'completado' | 'actual' | 'pendiente';
}

interface KeyInsight {
    tipo: 'diagnostico' | 'recomendacion' | 'garantia';
    icono?: string;
    texto: string;
}

interface ClinicalInsights {
    modo: 'con_afinacion' | 'otros_servicios' | 'primer_ingreso';
    estadoSalud: 'urgente' | 'proxima' | 'al_dia' | 'sin_registro' | 'primer_ingreso';
    tituloEstado: string;
    subtituloEstado: string;
    porcentajeDesgaste?: number;
    kmTranscurridos?: number | null;
    mesesTranscurridos?: number | null;
    ultimaAfinacionReal?: {
        folio: string;
        fecha: string;
        km: number;
        incluyoBujias?: boolean;
        detalles?: string;
    } | null;
    ultimoMantenimientoInspeccion?: {
        folio: string;
        fecha: string;
        km: number;
        tipo: string;
    } | null;
    componentes?: ComponentStatus[];
    stepperCiclo?: StepperStep[];
    puntosClave?: KeyInsight[];
    oportunidadComercial?: string | null;
}

interface ExpedienteAICopilotProps {
    historyData: any;
    onRefreshRequest?: () => void;
}

const getIconComponent = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
        case 'droplet':
            return Droplet;
        case 'disc':
            return Disc;
        case 'wrench':
            return Wrench;
        case 'shield':
            return Shield;
        case 'lightbulb':
            return Lightbulb;
        case 'target':
            return Target;
        case 'sparkles':
        default:
            return Sparkles;
    }
};

export default function ExpedienteAICopilot({ historyData }: ExpedienteAICopilotProps) {
    const [insights, setInsights] = useState<ClinicalInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);

    const vehiclePlates = historyData?.vehicle?.plates || '';

    const fetchInsights = useCallback(async () => {
        if (!historyData || !historyData.found) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/os/history/ai-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client: historyData.client,
                    vehicle: historyData.vehicle,
                    entries: historyData.entries,
                    maintenance: historyData.maintenance
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al generar análisis con IA');
            }

            setInsights(data.insights);
        } catch (err: any) {
            console.error('[Expediente AI Frontend Error]', err);
            setError(err.message || 'No fue posible completar el análisis con Gemini');
        } finally {
            setLoading(false);
        }
    }, [historyData]);

    useEffect(() => {
        if (vehiclePlates) {
            fetchInsights();
        }
    }, [vehiclePlates, fetchInsights]);

    if (!historyData || !historyData.found) {
        return null;
    }

    // Health badge styles
    const getHealthColors = (estado?: string) => {
        switch (estado) {
            case 'urgente':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    badge: 'bg-red-500 text-white',
                    bar: 'bg-red-500',
                    icon: ShieldAlert
                };
            case 'proxima':
                return {
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    text: 'text-amber-800',
                    badge: 'bg-amber-500 text-white',
                    bar: 'bg-amber-500',
                    icon: AlertTriangle
                };
            case 'al_dia':
                return {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    text: 'text-emerald-800',
                    badge: 'bg-emerald-500 text-white',
                    bar: 'bg-emerald-500',
                    icon: CheckCircle
                };
            case 'primer_ingreso':
                return {
                    bg: 'bg-indigo-50',
                    border: 'border-indigo-200',
                    text: 'text-indigo-800',
                    badge: 'bg-indigo-600 text-white',
                    bar: 'bg-indigo-600',
                    icon: Zap
                };
            case 'sin_registro':
            default:
                return {
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    text: 'text-slate-700',
                    badge: 'bg-slate-600 text-white',
                    bar: 'bg-slate-500',
                    icon: HelpCircle
                };
        }
    };

    const healthStyle = getHealthColors(insights?.estadoSalud);

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 mb-6">
            {/* Header / Bar */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between gap-4 select-none">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#f16315] text-white rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center">
                        <Sparkles size={18} className={loading ? "animate-spin" : ""} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs md:text-sm font-black tracking-wider uppercase">
                                Diagnóstico Clínico IA
                            </h3>
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-orange-400 border border-white/10 tracking-widest">
                                <Cpu size={10} /> Gemini 3.5 Flash Lite
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                            Análisis multi-nota de lubricación, componentes y ciclo de mantenimiento
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchInsights}
                        disabled={loading}
                        className="p-1.5 md:px-2.5 md:py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        title="Reanalizar expediente"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin text-[#f16315]" : ""} />
                        <span className="hidden md:inline">Actualizar</span>
                    </button>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                        title={expanded ? "Minimizar" : "Expandir"}
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        {/* Loading Skeleton */}
                        {loading && !insights ? (
                            <div className="p-6 space-y-4">
                                <div className="animate-pulse flex flex-col gap-3">
                                    <div className="h-16 bg-slate-100 rounded-xl w-full" />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="h-24 bg-slate-100 rounded-xl" />
                                        <div className="h-24 bg-slate-100 rounded-xl" />
                                        <div className="h-24 bg-slate-100 rounded-xl" />
                                    </div>
                                    <div className="h-12 bg-slate-100 rounded-xl w-full" />
                                </div>
                                <div className="text-center py-2">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse flex items-center justify-center gap-2">
                                        <Sparkles size={14} className="text-[#f16315]" />
                                        Consultando historial clínico con Gemini 3.5 Flash Lite...
                                    </span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="p-6">
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                    <AlertTriangle size={18} className="flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className="font-bold">Error en el análisis de IA</p>
                                        <p className="text-xs mt-0.5 text-red-600">{error}</p>
                                    </div>
                                    <button
                                        onClick={fetchInsights}
                                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        ) : insights ? (
                            <div className="p-5 md:p-6 space-y-6">
                                {/* 1. Hero Health Bar */}
                                <div className={`p-4 md:p-5 rounded-xl border ${healthStyle.border} ${healthStyle.bg} transition-all`}>
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-xl ${healthStyle.badge} mt-0.5 flex-shrink-0 shadow-sm`}>
                                                <healthStyle.icon size={20} />
                                            </div>
                                            <div>
                                                <h4 className={`text-base md:text-lg font-black tracking-tight ${healthStyle.text}`}>
                                                    {insights.tituloEstado}
                                                </h4>
                                                <p className="text-xs md:text-sm text-slate-600 font-medium mt-0.5">
                                                    {insights.subtituloEstado}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Metadata Pills */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {insights.kmTranscurridos !== null && insights.kmTranscurridos !== undefined && (
                                                <span className="px-2.5 py-1 bg-white/80 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1">
                                                    <Flame size={12} className="text-[#f16315]" />
                                                    +{insights.kmTranscurridos.toLocaleString('es-MX')} km
                                                </span>
                                            )}
                                            {insights.mesesTranscurridos !== null && insights.mesesTranscurridos !== undefined && (
                                                <span className="px-2.5 py-1 bg-white/80 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1">
                                                    <Clock size={12} className="text-slate-500" />
                                                    {insights.mesesTranscurridos} {insights.mesesTranscurridos === 1 ? 'mes' : 'meses'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress wear bar */}
                                    {insights.porcentajeDesgaste !== undefined && insights.modo === 'con_afinacion' && (
                                        <div className="mt-4 pt-3 border-t border-slate-200/60">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                                                <span>Desgaste del Ciclo de Afinación</span>
                                                <span className="font-bold text-slate-700">{insights.porcentajeDesgaste}% del límite</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${healthStyle.bar} transition-all duration-500 rounded-full`}
                                                    style={{ width: `${Math.min(100, Math.max(5, insights.porcentajeDesgaste))}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Component Health Matrix (Micro-Cards) */}
                                {insights.componentes && insights.componentes.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                                Trazabilidad de Componentes & Sistemas
                                            </h4>
                                            <div className="h-px bg-slate-100 flex-grow" />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {insights.componentes.map((comp) => {
                                                const IconComp = getIconComponent(comp.icono);
                                                const levelStyles = {
                                                    alerta: 'bg-red-50/60 border-red-200 text-red-700',
                                                    advertencia: 'bg-amber-50/60 border-amber-200 text-amber-700',
                                                    ok: 'bg-emerald-50/60 border-emerald-200 text-emerald-700',
                                                    neutral: 'bg-slate-50 border-slate-200 text-slate-600'
                                                }[comp.nivel] || 'bg-slate-50 border-slate-200 text-slate-600';

                                                const badgeStyles = {
                                                    alerta: 'bg-red-100 text-red-800 border-red-200',
                                                    advertencia: 'bg-amber-100 text-amber-800 border-amber-200',
                                                    ok: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                                                    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
                                                }[comp.nivel];

                                                return (
                                                    <div
                                                        key={comp.id}
                                                        className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-orange-200 transition-all flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`p-1.5 rounded-lg border ${levelStyles}`}>
                                                                        <IconComp size={14} />
                                                                    </div>
                                                                    <span className="text-xs font-black text-slate-800 uppercase">
                                                                        {comp.nombre}
                                                                    </span>
                                                                </div>
                                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeStyles}`}>
                                                                    {comp.estado}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                                                {comp.detalle}
                                                            </p>
                                                        </div>

                                                        {comp.ultimaNota && (
                                                            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold flex items-center justify-between">
                                                                <span>Última referencia:</span>
                                                                <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                    Nota #{comp.ultimaNota}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Maintenance Cycle Stepper */}
                                {insights.stepperCiclo && insights.stepperCiclo.length > 0 && insights.modo === 'con_afinacion' && (
                                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
                                            Ciclo de Vida de Mantenimiento (CarMD 10k km)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                                            {insights.stepperCiclo.map((step, idx) => {
                                                const isCompleted = step.estado === 'completado';
                                                const isActual = step.estado === 'actual';

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`p-3 rounded-lg border transition-all ${
                                                            isActual
                                                                ? "bg-white border-[#f16315] shadow-sm shadow-orange-500/10"
                                                                : isCompleted
                                                                    ? "bg-white/80 border-slate-200"
                                                                    : "bg-slate-100/50 border-slate-200/50 opacity-60"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                                                                isActual
                                                                    ? "bg-[#f16315] text-white"
                                                                    : isCompleted
                                                                        ? "bg-emerald-500 text-white"
                                                                        : "bg-slate-300 text-slate-600"
                                                            }`}>
                                                                {isCompleted ? <CheckCircle size={12} /> : step.paso}
                                                            </div>
                                                            <span className="text-xs font-black text-slate-800 truncate">
                                                                {step.titulo}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium pl-7">
                                                            {step.notaFolio && <div>Nota #{step.notaFolio}</div>}
                                                            {step.km ? <div>{step.km.toLocaleString('es-MX')} km</div> : null}
                                                            {step.fecha && <div className="text-slate-400">{step.fecha}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 4. Executive Bullet Points */}
                                {insights.puntosClave && insights.puntosClave.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                                Puntos Clave para el Asesor
                                            </h4>
                                            <div className="h-px bg-slate-100 flex-grow" />
                                        </div>

                                        <div className="space-y-2">
                                            {insights.puntosClave.map((pt, idx) => {
                                                const IconPt = getIconComponent(pt.icono);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start gap-3 text-xs md:text-sm text-slate-700 leading-relaxed font-medium"
                                                    >
                                                        <div className="p-1.5 rounded-lg bg-orange-100 text-[#f16315] mt-0.5 flex-shrink-0">
                                                            <IconPt size={14} />
                                                        </div>
                                                        <span className="pt-0.5">{pt.texto}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 5. Commercial Opportunity Banner */}
                                {insights.oportunidadComercial && (
                                    <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl flex items-center gap-3">
                                        <div className="p-2 bg-[#f16315] text-white rounded-lg flex-shrink-0">
                                            <Lightbulb size={16} />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-[10px] font-black text-[#f16315] uppercase tracking-wider">
                                                Oportunidad de Servicio CarMD
                                            </p>
                                            <p className="text-xs font-bold text-slate-800 mt-0.5">
                                                {insights.oportunidadComercial}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
