"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, AlertTriangle, CheckCircle, Clock, Zap,
    ChevronDown, ChevronUp, RefreshCw, Disc, Droplet,
    Wrench, Shield, Target, Lightbulb, ArrowRight,
    HelpCircle, Flame, ShieldAlert, Cpu, CheckCircle2,
    Calendar, AlertCircle
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
    accionHoy?: string;
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

    // Modern color themes (friendly, warm, clear)
    const getTheme = (estado?: string) => {
        switch (estado) {
            case 'urgente':
                return {
                    bgGradient: 'from-rose-50/70 via-red-50/40 to-white',
                    border: 'border-rose-200/80',
                    pillBg: 'bg-rose-100 text-rose-800 border-rose-200',
                    barColor: 'bg-gradient-to-r from-orange-500 to-rose-500',
                    iconBg: 'bg-rose-500 text-white',
                    textColor: 'text-rose-950',
                    actionBg: 'bg-rose-50 border-rose-200/80 text-rose-900',
                    actionBadge: 'bg-rose-500 text-white',
                    icon: ShieldAlert
                };
            case 'proxima':
                return {
                    bgGradient: 'from-amber-50/70 via-orange-50/40 to-white',
                    border: 'border-amber-200/80',
                    pillBg: 'bg-amber-100 text-amber-900 border-amber-200',
                    barColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
                    iconBg: 'bg-amber-500 text-white',
                    textColor: 'text-amber-950',
                    actionBg: 'bg-amber-50 border-amber-200/80 text-amber-900',
                    actionBadge: 'bg-amber-500 text-white',
                    icon: AlertTriangle
                };
            case 'al_dia':
                return {
                    bgGradient: 'from-emerald-50/70 via-teal-50/40 to-white',
                    border: 'border-emerald-200/80',
                    pillBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                    barColor: 'bg-gradient-to-r from-teal-400 to-emerald-500',
                    iconBg: 'bg-emerald-500 text-white',
                    textColor: 'text-emerald-950',
                    actionBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-900',
                    actionBadge: 'bg-emerald-500 text-white',
                    icon: CheckCircle2
                };
            case 'primer_ingreso':
                return {
                    bgGradient: 'from-indigo-50/70 via-blue-50/40 to-white',
                    border: 'border-indigo-200/80',
                    pillBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
                    barColor: 'bg-indigo-500',
                    iconBg: 'bg-indigo-600 text-white',
                    textColor: 'text-indigo-950',
                    actionBg: 'bg-indigo-50 border-indigo-200/80 text-indigo-900',
                    actionBadge: 'bg-indigo-600 text-white',
                    icon: Zap
                };
            case 'sin_registro':
            default:
                return {
                    bgGradient: 'from-slate-50/80 via-gray-50/50 to-white',
                    border: 'border-slate-200',
                    pillBg: 'bg-slate-100 text-slate-800 border-slate-200',
                    barColor: 'bg-slate-400',
                    iconBg: 'bg-slate-600 text-white',
                    textColor: 'text-slate-900',
                    actionBg: 'bg-slate-50 border-slate-200 text-slate-800',
                    actionBadge: 'bg-slate-600 text-white',
                    icon: HelpCircle
                };
        }
    };

    const theme = getTheme(insights?.estadoSalud);

    return (
        <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all overflow-hidden mb-6">
            {/* Friendly, Clean Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50/80 via-white to-orange-50/30 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100/70 text-[#f16315] rounded-2xl flex items-center justify-center shadow-xs">
                        <Sparkles size={18} className={loading ? "animate-spin" : ""} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                Diagnóstico Inteligente del Auto
                            </h3>
                            <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-50 text-[#f16315] border border-orange-200/60 tracking-wider">
                                <Cpu size={10} /> Gemini 3.6 Flash
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            Historial clínico y recomendaciones claras para el mostrador
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchInsights}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        title="Reanalizar expediente"
                    >
                        <RefreshCw size={12} className={loading ? "animate-spin text-[#f16315]" : ""} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 transition-colors"
                        title={expanded ? "Ocultar detalles" : "Ver detalles"}
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
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {/* Shimmer Skeleton Loader */}
                        {loading && !insights ? (
                            <div className="p-6 space-y-4">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-20 bg-slate-100 rounded-2xl w-full" />
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="h-20 bg-slate-100 rounded-2xl" />
                                        <div className="h-20 bg-slate-100 rounded-2xl" />
                                        <div className="h-20 bg-slate-100 rounded-2xl" />
                                        <div className="h-20 bg-slate-100 rounded-2xl" />
                                    </div>
                                    <div className="h-14 bg-slate-100 rounded-2xl w-full" />
                                </div>
                                <div className="text-center py-2 text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                                    <Sparkles size={14} className="text-[#f16315] animate-spin" />
                                    Analizando notas e historial con Gemini 3.6 Flash...
                                </div>
                            </div>
                        ) : error ? (
                            <div className="p-6">
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                                    <AlertCircle size={18} className="flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className="font-bold">No se pudo generar el diagnóstico automático</p>
                                        <p className="text-xs mt-0.5 text-red-600">{error}</p>
                                    </div>
                                    <button
                                        onClick={fetchInsights}
                                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        ) : insights ? (
                            <div className="p-6 space-y-6">

                                {/* ⭐ 1. THE HERO CARD: "¿QUÉ LE TOCA HOY AL AUTO?" ⭐ */}
                                {insights.accionHoy && (
                                    <div className={`p-5 rounded-2xl border ${theme.border} bg-gradient-to-r ${theme.bgGradient} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs`}>
                                        <div className="flex items-start gap-3.5">
                                            <div className={`p-2.5 rounded-2xl ${theme.iconBg} shadow-sm flex-shrink-0 mt-0.5`}>
                                                <theme.icon size={22} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${theme.actionBadge}`}>
                                                        Recomendación de Hoy
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400">•</span>
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {insights.tituloEstado}
                                                    </span>
                                                </div>
                                                <p className="text-sm md:text-base font-black text-slate-900 mt-1 leading-snug">
                                                    {insights.accionHoy}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    {insights.subtituloEstado}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quick Metrics Badges */}
                                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0 self-end md:self-center">
                                            {insights.kmTranscurridos !== null && insights.kmTranscurridos !== undefined && (
                                                <span className="px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 shadow-xs flex items-center gap-1.5">
                                                    <Flame size={13} className="text-[#f16315]" />
                                                    +{insights.kmTranscurridos.toLocaleString('es-MX')} km
                                                </span>
                                            )}
                                            {insights.mesesTranscurridos !== null && insights.mesesTranscurridos !== undefined && (
                                                <span className="px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5">
                                                    <Clock size={13} className="text-slate-400" />
                                                    {insights.mesesTranscurridos} {insights.mesesTranscurridos === 1 ? 'mes' : 'meses'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ⭐ 2. COMPONENT PILLS / MICRO-CARDS (Easy 3-second scan) ⭐ */}
                                {insights.componentes && insights.componentes.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                                                Estado de Componentes Clave
                                            </h4>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                Revisión rápida de mostrador
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {insights.componentes.map((comp) => {
                                                const IconComp = getIconComponent(comp.icono);
                                                
                                                // Pill styles based on severity
                                                const cardStyle = {
                                                    alerta: 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300',
                                                    advertencia: 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300',
                                                    ok: 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300',
                                                    neutral: 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                                                }[comp.nivel] || 'bg-slate-50 border-slate-200';

                                                const badgeStyle = {
                                                    alerta: 'bg-rose-100 text-rose-800 border-rose-200',
                                                    advertencia: 'bg-amber-100 text-amber-900 border-amber-200',
                                                    ok: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                                                    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
                                                }[comp.nivel];

                                                const iconColor = {
                                                    alerta: 'bg-rose-100 text-rose-600',
                                                    advertencia: 'bg-amber-100 text-amber-600',
                                                    ok: 'bg-emerald-100 text-emerald-600',
                                                    neutral: 'bg-slate-100 text-slate-500'
                                                }[comp.nivel];

                                                return (
                                                    <div
                                                        key={comp.id}
                                                        className={`p-4 rounded-2xl border transition-all ${cardStyle} flex flex-col justify-between`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`p-1.5 rounded-xl ${iconColor}`}>
                                                                        <IconComp size={15} />
                                                                    </div>
                                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                                        {comp.nombre}
                                                                    </span>
                                                                </div>
                                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                                                    {comp.estado}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                                {comp.detalle}
                                                            </p>
                                                        </div>

                                                        {comp.ultimaNota && (
                                                            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-bold flex items-center justify-between">
                                                                <span>Último registro:</span>
                                                                <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
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

                                {/* ⭐ 3. MAINTENANCE CYCLE TIMELINE (Clean & Linear) ⭐ */}
                                {insights.stepperCiclo && insights.stepperCiclo.length > 0 && insights.modo === 'con_afinacion' && (
                                    <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/70">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                                                Ciclo de Mantenimiento (CarMD 10,000 km)
                                            </h4>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                Incluye preventivos de cortesía
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {insights.stepperCiclo.map((step, idx) => {
                                                const isCompleted = step.estado === 'completado';
                                                const isActual = step.estado === 'actual';

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`p-3.5 rounded-xl border transition-all ${
                                                            isActual
                                                                ? "bg-white border-orange-300 shadow-xs"
                                                                : isCompleted
                                                                    ? "bg-white/90 border-slate-200"
                                                                    : "bg-slate-100/60 border-slate-200/60 opacity-60"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <div className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                                                                isActual
                                                                    ? "bg-[#f16315] text-white"
                                                                    : isCompleted
                                                                        ? "bg-emerald-500 text-white"
                                                                        : "bg-slate-300 text-slate-600"
                                                            }`}>
                                                                {isCompleted ? <CheckCircle2 size={13} /> : step.paso}
                                                            </div>
                                                            <span className="text-xs font-black text-slate-800">
                                                                {step.titulo}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 font-medium pl-7 space-y-0.5">
                                                            {step.notaFolio && <div className="font-bold text-slate-700">Nota #{step.notaFolio}</div>}
                                                            {step.km ? <div>{step.km.toLocaleString('es-MX')} km</div> : null}
                                                            {step.fecha && <div className="text-slate-400 text-[10px]">{step.fecha}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ⭐ 4. PUNTOS CLAVE PARA EL ASESOR ⭐ */}
                                {insights.puntosClave && insights.puntosClave.length > 0 && (
                                    <div className="space-y-2">
                                        {insights.puntosClave.map((pt, idx) => {
                                            const IconPt = getIconComponent(pt.icono);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-3.5 bg-orange-50/40 border border-orange-100 rounded-2xl flex items-start gap-3 text-xs md:text-sm text-slate-700 leading-relaxed font-medium"
                                                >
                                                    <div className="p-1.5 rounded-xl bg-orange-100 text-[#f16315] mt-0.5 flex-shrink-0">
                                                        <IconPt size={15} />
                                                    </div>
                                                    <span className="pt-0.5">{pt.texto}</span>
                                                </div>
                                            );
                                        })}
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
