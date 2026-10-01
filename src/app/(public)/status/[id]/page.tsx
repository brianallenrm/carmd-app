"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Car,
    Clock,
    Gauge,
    Fuel,
    MapPin,
    Navigation,
    FileText,
    CheckCircle2,
    RefreshCw,
    ShieldCheck,
    AlertCircle,
    Sparkles,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { CarTrackerData } from "@/types/floor-pipeline";

export default function CarTrackerPage() {
    const params = useParams();
    const token = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "";

    const [data, setData] = useState<CarTrackerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState<Date>(new Date());
    const [, startTransition] = useTransition();

    const fetchTracker = async (isManual = false) => {
        if (!token) return;
        if (isManual) setRefreshing(true);
        try {
            const res = await fetch(`/api/tracker/${token}`, {
                cache: "no-store",
            });
            if (!res.ok) {
                if (res.status === 404) {
                    setError("No encontramos un vehículo activo con este enlace.");
                } else {
                    setError("Ocurrió un error al cargar el seguimiento de tu vehículo.");
                }
                setData(null);
                return;
            }
            const json = await res.json();
            if (json.success && json.tracker) {
                startTransition(() => {
                    setData(json.tracker);
                    setError(null);
                    setLastSync(new Date());
                });
            } else {
                setError(json.error || "No fue posible consultar el seguimiento.");
            }
        } catch (e) {
            console.error("Tracker fetch error:", e);
            setError("Problema de conexión con el taller. Reintentando...");
        } finally {
            setLoading(false);
            if (isManual) {
                setTimeout(() => setRefreshing(false), 500);
            }
        }
    };

    // Initial load
    useEffect(() => {
        fetchTracker(false);
    }, [token]);

    // Live auto-polling every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchTracker(false);
        }, 30000);
        return () => clearInterval(interval);
    }, [token]);

    // Format gas level segments
    const renderGasSegments = (gasString: string = "") => {
        const lower = gasString.toLowerCase();
        let filledBars = 2; // Default 1/2
        if (lower.includes("vacio") || lower.includes("reserva") || lower.includes("0")) filledBars = 0;
        else if (lower.includes("1/8")) filledBars = 1;
        else if (lower.includes("1/4")) filledBars = 1;
        else if (lower.includes("3/8")) filledBars = 2;
        else if (lower.includes("1/2") || lower.includes("medio")) filledBars = 2;
        else if (lower.includes("5/8") || lower.includes("3/4")) filledBars = 3;
        else if (lower.includes("lleno") || lower.includes("full") || lower.includes("4/4")) filledBars = 4;

        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((seg) => (
                    <div
                        key={seg}
                        className={`h-2.5 w-4 rounded-xs transition-colors ${
                            seg <= filledBars
                                ? filledBars === 1
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                : "bg-slate-200"
                        }`}
                    />
                ))}
                <span className="text-[11px] font-bold text-slate-700 ml-1.5">{gasString || "1/2"}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center max-w-sm w-full">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#f16315] flex items-center justify-center mb-4">
                        <RefreshCw size={26} className="animate-spin text-[#f16315]" />
                    </div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                        Conectando con CarMD...
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Sincronizando estado en vivo de rampa y taller
                    </p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-md w-full space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                        <AlertCircle size={28} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">
                            Enlace no disponible
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            {error || "El enlace único de seguimiento no existe o la orden ha finalizado."}
                        </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-500 text-left">
                        💡 <strong>¿Necesitas tu enlace?</strong> Si tu auto está en CarMD, solicita a tu asesor que te comparta tu link único por WhatsApp.
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                        <span>Ir a la página principal</span>
                    </Link>
                </div>
            </div>
        );
    }

    const { vehicle, reception, tracking, client, workshop } = data;
    const currentStage = tracking.currentStage;

    return (
        <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col antialiased">
            {/* Header Sticky */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
                <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <BrandLogo size="sm" />
                        <span className="hidden sm:inline-block w-px h-5 bg-slate-200" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Car Tracker
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Indicador EN VIVO */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-[10px] font-black">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>EN VIVO</span>
                        </div>

                        {/* Botón Refrescar */}
                        <button
                            onClick={() => fetchTracker(true)}
                            disabled={refreshing}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors disabled:opacity-50"
                            title="Actualizar estatus"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin text-[#f16315]" : ""} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido Principal Móvil */}
            <main className="flex-1 max-w-xl w-full mx-auto px-4 py-5 space-y-4">
                
                {/* Saludo y Placas */}
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Seguimiento de servicio
                        </p>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                            Hola, {client.firstName} 👋
                        </h1>
                    </div>

                    {/* Matrícula tipo placa mexicana */}
                    <div className="bg-white border-2 border-slate-800 rounded-lg px-2.5 py-1 text-center shadow-xs flex flex-col items-center justify-center">
                        <span className="text-[8px] font-black tracking-widest text-[#f16315] uppercase leading-none">
                            MÉXICO
                        </span>
                        <span className="text-sm font-black font-mono tracking-wider text-slate-900 leading-tight">
                            {vehicle.plates}
                        </span>
                    </div>
                </div>

                {/* Hero Card del Vehículo y Etapa Activa */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4 overflow-hidden relative"
                >
                    {/* Header del Auto */}
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-1.5 text-[#f16315] text-xs font-black uppercase tracking-wider">
                                <Car size={15} />
                                <span>{vehicle.brand}</span>
                            </div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                                {vehicle.model} {vehicle.year}
                            </h2>
                        </div>

                        {/* Badge de Progreso Porcentual */}
                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                                {currentStage.progress}%
                            </span>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                Avance
                            </p>
                        </div>
                    </div>

                    {/* Barra de Progreso Visual */}
                    <div className="space-y-1.5">
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${currentStage.progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-blue-500 via-[#f16315] to-emerald-500 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Tarjeta de la Etapa Actual Destacada */}
                    <div className={`p-4 rounded-2xl border-2 transition-all ${currentStage.badgeBg} ${currentStage.badgeBorder}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xl flex-shrink-0">{currentStage.icon}</span>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                    Etapa Actual en Taller
                                </span>
                                <h3 className={`text-base font-black tracking-tight ${currentStage.badgeText}`}>
                                    {currentStage.label}
                                </h3>
                            </div>
                        </div>

                        {/* Mensaje de Tranquilidad al Cliente (clientMessage) */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/60">
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                {currentStage.clientMessage}
                            </p>
                        </div>
                    </div>

                    {/* Sincronización en vivo */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                            <Clock size={11} />
                            Actualizado: {tracking.lastUpdateDisplay || "En vivo"}
                        </span>
                        <span>{tracking.lastUpdateAgo}</span>
                    </div>
                </motion.div>

                {/* Stepper / Timeline del Pipeline (8 Etapas) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-[#f16315]" />
                            Pipeline de Trabajo en Taller
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400">
                            Paso a paso
                        </span>
                    </div>

                    <div className="space-y-2">
                        {tracking.pipeline.map((stage) => {
                            const isCurrent = stage.isCurrent;
                            const isCompleted = stage.isCompleted;

                            return (
                                <div
                                    key={stage.id}
                                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                        isCurrent
                                            ? `${stage.activeBg} ${stage.activeText} ${stage.activeBorder} shadow-sm ring-2 ring-orange-400/30`
                                            : isCompleted
                                            ? "bg-emerald-50/60 border-emerald-200/70 text-emerald-950"
                                            : "bg-slate-50/60 border-slate-200/60 text-slate-400"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Indicador de paso */}
                                        <div
                                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                                                isCurrent
                                                    ? "bg-white/20 text-white"
                                                    : isCompleted
                                                    ? "bg-emerald-500 text-white shadow-2xs"
                                                    : "bg-slate-200 text-slate-500"
                                            }`}
                                        >
                                            {isCompleted ? <CheckCircle2 size={16} /> : stage.step}
                                        </div>

                                        <span className="text-lg flex-shrink-0">{stage.icon}</span>

                                        <div className="min-w-0">
                                            <p className={`text-xs font-bold truncate leading-tight ${
                                                isCurrent ? "text-white" : isCompleted ? "text-slate-800" : "text-slate-500"
                                            }`}>
                                                {stage.label}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-[10px] text-white/90 mt-0.5 font-medium truncate">
                                                    Trabajando en este momento
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Porcentaje */}
                                    <span className={`text-[10px] font-mono font-bold flex-shrink-0 px-2 py-0.5 rounded-lg ${
                                        isCurrent
                                            ? "bg-white/20 text-white"
                                            : isCompleted
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-slate-100 text-slate-400"
                                    }`}>
                                        {stage.progress}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Ficha Técnica de Recepción y Botón PDF de Inventario */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-[#f16315]" />
                            Ficha de Recepción Técnica
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                            {reception.inventoryFolio || vehicle.plates}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {/* Odómetro */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <Gauge size={12} className="text-[#f16315]" />
                                Kilometraje
                            </span>
                            <p className="text-sm font-black text-slate-900 font-mono mt-1">
                                {vehicle.kmDisplay}
                            </p>
                        </div>

                        {/* Nivel de Gasolina */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <Fuel size={12} className="text-[#f16315]" />
                                Gasolina
                            </span>
                            <div className="mt-1.5">
                                {renderGasSegments(vehicle.gas)}
                            </div>
                        </div>

                        {/* Fecha y Hora de Ingreso */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <Clock size={12} className="text-[#f16315]" />
                                Ingreso a Taller
                            </span>
                            <p className="text-xs font-bold text-slate-800 mt-1">
                                {reception.dateDisplay || "Registrado en recepción"} ({reception.timeAgo})
                            </p>
                        </div>

                        {/* Asesor */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Asesor Técnico Responsable
                            </span>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">
                                {reception.advisor || "Equipo CarMD"}
                            </p>
                        </div>

                        {/* Motivo */}
                        {reception.motivo && (
                            <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-200/60 col-span-2">
                                <span className="text-[10px] font-black uppercase text-orange-900 tracking-wider">
                                    Motivo de Ingreso Reportado
                                </span>
                                <p className="text-xs text-orange-950 font-medium mt-0.5 italic">
                                    &ldquo;{reception.motivo}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>

                    {/* BOTÓN: Ver Inventario de Recepción en PDF */}
                    {reception.hasInventoryPdf && (
                        <Link
                            href={`/status/${data.token}/inventario`}
                            target="_blank"
                            className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-2xl transition-all shadow-sm group"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-white/10 rounded-xl text-white">
                                    <FileText size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold leading-tight">
                                        Ver Inventario de Recepción (PDF)
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        Herramienta, inspección visual y fotos de ingreso
                                    </p>
                                </div>
                            </div>
                            <ArrowUpRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                        </Link>
                    )}
                </div>

                {/* Sección Única de Acción: Cómo Llegar al Taller */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-50 text-[#f16315] rounded-xl">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                Ubicación de CarMD Taller
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Cuando tu auto esté listo para entrega
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed">
                        <p className="font-bold text-slate-900">{workshop.address}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{workshop.schedule}</p>
                    </div>

                    {/* Botones de Navegación Exclusivos */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <a
                            href={workshop.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-2xl text-xs font-bold transition-all text-center"
                        >
                            <Navigation size={14} />
                            <span>Google Maps</span>
                        </a>

                        <a
                            href={workshop.wazeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200/80 rounded-2xl text-xs font-bold transition-all text-center"
                        >
                            <Navigation size={14} />
                            <span>Waze</span>
                        </a>
                    </div>
                </div>

                {/* Sello de Garantía y Transparencia */}
                <div className="py-4 text-center space-y-1 text-slate-400 text-[10px]">
                    <p className="font-bold uppercase tracking-wider text-slate-500">
                        CarMD® • Ingeniería y Transparencia Automotriz
                    </p>
                    <p>
                        Garantía real de 1 año en refacciones y mano de obra
                    </p>
                </div>
            </main>
        </div>
    );
}
