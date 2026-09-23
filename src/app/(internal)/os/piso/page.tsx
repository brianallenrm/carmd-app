"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
    Wrench,
    LayoutDashboard,
    Car,
    ClipboardList,
    History,
    ArrowLeft,
    Sparkles,
    ShieldCheck,
    PlusCircle
} from "lucide-react";
import RecentVehiclesFeed from "@/components/os/RecentVehiclesFeed";
import VehicleHistoryTool from "@/components/os/VehicleHistoryTool";

export default function PisoTallerPage() {
    const expedienteSectionRef = useRef<HTMLDivElement>(null);

    const handleExpedienteSearch = (plates: string) => {
        expedienteSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.dispatchEvent(new CustomEvent("carmd:expediente-search", { detail: { query: plates } }));
    };

    return (
        <div className="min-h-screen bg-slate-50/60 pb-16">
            {/* Header enfocado en Taller y Rampa */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/os/centrodecontrol"
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                            title="Regresar a Centro de Control"
                        >
                            <ArrowLeft size={16} />
                            <span className="hidden sm:inline">Centro de Control</span>
                        </Link>

                        <div className="h-5 w-px bg-slate-200" />

                        <div className="bg-[#f16315] p-2 rounded-xl text-white shadow-md shadow-orange-500/20">
                            <Wrench size={18} />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                    CONTROL DE PISO
                                </h1>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Taller en Operación • CarMD
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/os/admin/receptions"
                            target="_blank"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                            <ClipboardList size={14} />
                            <span className="hidden md:inline">Nuevo </span>Inventario
                        </Link>

                        <a
                            href="/os"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-orange-300"
                        >
                            <PlusCircle size={14} />
                            <span>Nueva Nota</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8">
                
                {/* Banner de Ayuda Rápida */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-orange-50 text-[#f16315] rounded-xl flex-shrink-0">
                            <Car size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                                Autos Activos en Rampa y Taller
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Da <strong className="text-slate-700">clic en cualquier coche</strong> para ver mecánicos asignados, refacciones cargadas, fotos de tickets y servicios de rectificación/lavado.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                            💡 Clic derecho para salidas o cortesías
                        </span>
                    </div>
                </div>

                {/* Feed de Vehículos: Inicia por defecto en 'Solo en Taller' */}
                <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-4 sm:p-8">
                    <RecentVehiclesFeed
                        onExpedienteSearch={handleExpedienteSearch}
                        initialFilterMode="activos"
                    />
                </div>

                {/* Sección Expediente del Vehículo */}
                <section ref={expedienteSectionRef} className="pt-4">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-[11px] font-black text-indigo-700 uppercase tracking-[0.25em] bg-indigo-50 px-3 py-1 rounded-md flex items-center gap-1.5">
                            <History size={12} />
                            Consulta de Expediente
                        </h2>
                        <div className="h-px bg-slate-200 flex-grow" />
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                        <VehicleHistoryTool />
                    </div>
                </section>
            </main>
        </div>
    );
}
