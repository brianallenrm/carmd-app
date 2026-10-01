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
    ArrowUpRight,
    Camera,
    Check
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { CarTrackerData } from "@/types/floor-pipeline";

export default function CarTrackerPage() {
    const params = useParams();
    const token = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "";

    const [data, setData] = useState<CarTrackerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    const fetchTracker = async () => {
        if (!token) return;
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
                });
            } else {
                setError(json.error || "No fue posible consultar el seguimiento.");
            }
        } catch (e) {
            console.error("Tracker fetch error:", e);
            setError("Problema de conexión con el taller. Reintentando...");
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchTracker();
    }, [token]);

    // Live auto-polling every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchTracker();
        }, 30000);
        return () => clearInterval(interval);
    }, [token]);

    // Format gas level segments
    const renderGasSegments = (gasString: string = "") => {
        const lower = gasString.toLowerCase();
        let filledBars = 2; // Default 1/2
        if (lower.includes("vacio") || lower.includes("reserva") || lower.includes("0")) filledBars = 0;
        else if (lower.includes("1/8") || lower.includes("1/4")) filledBars = 1;
        else if (lower.includes("3/8") || lower.includes("1/2") || lower.includes("medio")) filledBars = 2;
        else if (lower.includes("5/8") || lower.includes("3/4")) filledBars = 3;
        else if (lower.includes("lleno") || lower.includes("full") || lower.includes("4/4")) filledBars = 4;

        return (
            <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 font-mono">E</span>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((seg) => (
                        <div
                            key={seg}
                            className={`h-2.5 w-4 rounded-xs transition-colors ${
                                seg <= filledBars
                                    ? filledBars === 1
                                        ? "bg-amber-500 shadow-2xs shadow-amber-500/50"
                                        : "bg-emerald-500 shadow-2xs shadow-emerald-500/50"
                                    : "bg-slate-200"
                            }`}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 font-mono">F</span>
                <span className="text-[11px] font-bold text-slate-700 ml-1">{gasString || "1/2"}</span>
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

    const { vehicle, reception, tracking, client, workshop, rawReceptionData } = data;
    const currentStage = tracking.currentStage;
    const photoCount = rawReceptionData?.photos ? Object.keys(rawReceptionData.photos).length : 0;

    return (
        <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
            {/* Header Limpio y Elegante (Solo Logo y Leyenda Car Tracker) */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
                <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
                    <BrandLogo size="sm" variant="light" />
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50/80 border border-orange-200/70 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f16315]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#f16315]">
                            Car Tracker
                        </span>
                    </div>
                </div>
            </header>

            {/* Contenido Principal Móvil */}
            <main className="flex-1 max-w-xl w-full mx-auto px-3.5 sm:px-4 py-4 space-y-4">

                {/* Banner de Saludo y Matrícula */}
                <div className="flex items-center justify-between gap-2 px-1">
                    <div>
                        <p className="text-[10px] font-black text-[#f16315] uppercase tracking-wider">
                            Seguimiento Técnico
                        </p>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                            Hola, {client.firstName} 👋
                        </h1>
                    </div>

                    {/* Matrícula tipo placa mexicana */}
                    <div className="bg-white border-2 border-slate-800 rounded-lg px-2.5 py-0.5 text-center shadow-xs flex flex-col items-center">
                        <span className="text-[7px] font-black tracking-widest text-[#f16315] uppercase">
                            MÉXICO
                        </span>
                        <span className="text-xs font-black font-mono tracking-wider text-slate-900">
                            {vehicle.plates}
                        </span>
                    </div>
                </div>

                {/* HERO CARD EN TONOS CLAROS: Telemetría y Estatus Flagship */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4"
                >
                    {/* Header del Vehículo */}
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-black tracking-widest text-[#f16315] uppercase flex items-center gap-1.5">
                                <Car size={13} />
                                {vehicle.brand}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                                {vehicle.model}
                            </h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Modelo {vehicle.year}
                            </p>
                        </div>

                        {/* Avance Numérico */}
                        <div className="text-right">
                            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                                {currentStage.progress}%
                            </span>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Progreso
                            </p>
                        </div>
                    </div>

                    {/* Barra de Progreso */}
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

                    {/* Showcase de la Etapa Activa (Tonos Claros Cálidos) */}
                    <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white border border-orange-200/80 text-2xl flex items-center justify-center flex-shrink-0 shadow-xs">
                                {currentStage.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#f16315] block">
                                    Etapa Activa en Taller
                                </span>
                                <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                                    {currentStage.label}
                                </h3>
                            </div>
                        </div>

                        {/* Mensaje de Tranquilidad al Cliente (clientMessage) */}
                        <div className="bg-white rounded-xl p-3 border border-orange-200/70 shadow-2xs">
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                {currentStage.clientMessage}
                            </p>
                        </div>
                    </div>

                    {/* Sincronización */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1.5">
                            <Clock size={11} className="text-[#f16315]" />
                            {tracking.lastUpdateDisplay ? `Actualizado: ${tracking.lastUpdateDisplay}` : "Sincronizado con rampa"}
                        </span>
                        <span className="text-slate-400">{tracking.lastUpdateAgo}</span>
                    </div>
                </motion.div>

                {/* TIMELINE CONECTADO (En Tonos Claros) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                <Sparkles size={13} className="text-[#f16315]" />
                                Proceso de Servicio en Taller
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Ruta técnica paso a paso
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Paso {currentStage.step || 3} de 8
                        </span>
                    </div>

                    {/* Línea de tiempo visual conectada */}
                    <div className="relative pl-7 space-y-3.5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {tracking.pipeline.map((stage) => {
                            const isCurrent = stage.isCurrent;
                            const isCompleted = stage.isCompleted;

                            return (
                                <div key={stage.id} className="relative flex items-center justify-between gap-3">
                                    {/* Indicador en la línea de tiempo */}
                                    <div
                                        className={`absolute -left-7 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                            isCurrent
                                                ? "bg-[#f16315] text-white ring-4 ring-orange-100 shadow-md shadow-orange-500/30 scale-110"
                                                : isCompleted
                                                ? "bg-emerald-500 text-white shadow-2xs"
                                                : "bg-white border-2 border-slate-300 text-slate-400"
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <Check size={12} strokeWidth={3} />
                                        ) : (
                                            <span>{stage.step}</span>
                                        )}
                                    </div>

                                    {/* Contenido de la Etapa */}
                                    <div className="min-w-0 flex-1 flex items-center gap-2">
                                        <span className="text-sm flex-shrink-0">{stage.icon}</span>
                                        <p className={`text-xs truncate ${
                                            isCurrent
                                                ? "font-black text-[#f16315]"
                                                : isCompleted
                                                ? "font-bold text-slate-800"
                                                : "font-medium text-slate-400"
                                        }`}>
                                            {stage.label}
                                        </p>
                                    </div>

                                    {/* Estado en badge compacto */}
                                    <div className="flex-shrink-0">
                                        {isCurrent ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-[#f16315] px-2 py-0.5 rounded-full shadow-2xs">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                En curso
                                            </span>
                                        ) : isCompleted ? (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                                Completado
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-mono font-medium text-slate-300">
                                                {stage.progress}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* BANNER INTERACTIVO: INVENTARIO Y FOTOS DE RECEPCIÓN (En Tonos Claros) */}
                {reception.hasInventoryPdf && (
                    <Link
                        href={`/status/${data.token}/inventario`}
                        className="block bg-white hover:bg-slate-50 text-slate-900 rounded-3xl p-5 border border-slate-200/90 shadow-sm transition-all group"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/70 text-[#f16315] flex items-center justify-center flex-shrink-0">
                                    <Camera size={20} />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#f16315] block">
                                        Evidencia y Resguardo
                                    </span>
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight truncate">
                                        Inventario y Fotos de Recepción
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                        {photoCount > 0 ? `${photoCount} fotos de daños ` : ""}• Herramienta • Estado inicial
                                    </p>
                                </div>
                            </div>
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-[#f16315] group-hover:text-white transition-colors flex-shrink-0">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </Link>
                )}

                {/* FICHA TÉCNICA DE RECEPCIÓN (Cluster Automotriz) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3.5">
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
                            <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                                {vehicle.kmDisplay}
                            </p>
                        </div>

                        {/* Nivel de Gasolina */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <Fuel size={12} className="text-[#f16315]" />
                                Combustible
                            </span>
                            <div className="mt-1">
                                {renderGasSegments(vehicle.gas)}
                            </div>
                        </div>

                        {/* Fecha y Hora de Ingreso */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <Clock size={12} className="text-[#f16315]" />
                                Ingreso Registrado
                            </span>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">
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
                            <div className="bg-orange-50/60 p-3 rounded-2xl border border-orange-200/70 col-span-2">
                                <span className="text-[10px] font-black uppercase text-orange-900 tracking-wider block mb-0.5">
                                    Motivo de Ingreso Reportado
                                </span>
                                <p className="text-xs text-orange-950 font-medium italic leading-relaxed">
                                    &ldquo;{reception.motivo}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* UBICACIÓN DE CARMD: ACCIÓN EXCLUSIVA CÓMO LLEGAR */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3.5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-50 text-[#f16315] rounded-xl">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                Ubicación de CarMD Taller
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Para cuando tu auto esté listo para entrega
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed">
                        <p className="font-bold text-slate-900">{workshop.address}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{workshop.schedule}</p>
                    </div>

                    {/* Botones de Navegación Exclusivos */}
                    <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                        <a
                            href={workshop.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-2xl text-xs font-bold transition-all text-center shadow-2xs"
                        >
                            <Navigation size={14} />
                            <span>Google Maps</span>
                        </a>

                        <a
                            href={workshop.wazeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200/80 rounded-2xl text-xs font-bold transition-all text-center shadow-2xs"
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
