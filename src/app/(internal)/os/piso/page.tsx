"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
    Wrench,
    Car,
    ClipboardList,
    History,
    RefreshCw
} from "lucide-react";
import RecentVehiclesFeed from "@/components/os/RecentVehiclesFeed";
import VehicleHistoryTool from "@/components/os/VehicleHistoryTool";

export default function PisoTallerPage() {
    const expedienteSectionRef = useRef<HTMLDivElement>(null);

    const handleExpedienteSearch = (plates: string) => {
        expedienteSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.dispatchEvent(new CustomEvent("carmd:expediente-search", { detail: { query: plates } }));
    };

    const handleRefresh = () => {
        window.dispatchEvent(new CustomEvent("carmd:refresh-recent-vehicles"));
    };

    return (
        <div className="min-h-screen bg-slate-50/70 pb-20">
            {/* Header enfocado 100% en Taller y Operación Móvil */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/95">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-[#f16315] p-2 rounded-xl text-white shadow-md shadow-orange-500/20 flex-shrink-0">
                            <Wrench size={18} />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                                    CONTROL DE PISO
                                </h1>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                Taller en Operación • CarMD
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Botón Refrescar Rampa */}
                        <button
                            onClick={handleRefresh}
                            className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                            title="Actualizar listado de rampa"
                        >
                            <RefreshCw size={14} className="text-slate-600" />
                            <span className="hidden sm:inline">Actualizar</span>
                        </button>

                        {/* Inventario de Recepción */}
                        <Link
                            href="/os/admin/receptions"
                            target="_blank"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#f16315] border border-orange-200/80 rounded-xl text-xs font-bold transition-colors"
                        >
                            <ClipboardList size={14} />
                            <span>Inventario</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
                
                {/* Banner de Ayuda Rápida Móvil */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-50 text-[#f16315] rounded-xl flex-shrink-0 mt-0.5">
                            <Car size={18} />
                        </div>
                        <div>
                            <h2 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                                Autos Activos en Rampa y Taller
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                                Toca cualquier auto para asignar mecánicos, registrar refacciones, fotos de tickets o maquinados.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200">
                            💡 Toca el botón ⋮ para cambiar estatus
                        </span>
                    </div>
                </div>

                {/* Feed de Vehículos en modo piso operativo */}
                <div className="bg-white rounded-2xl sm:rounded-[28px] border border-slate-200/80 shadow-sm p-2.5 sm:p-6 md:p-8">
                    <RecentVehiclesFeed
                        onExpedienteSearch={handleExpedienteSearch}
                        initialFilterMode="activos"
                        mode="piso"
                    />
                </div>

                {/* Sección Expediente del Vehículo */}
                <section ref={expedienteSectionRef} className="pt-2">
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-[10px] sm:text-[11px] font-black text-indigo-700 uppercase tracking-[0.2em] bg-indigo-50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                            <History size={12} />
                            Consulta de Expediente
                        </h2>
                        <div className="h-px bg-slate-200 flex-grow" />
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-6">
                        <VehicleHistoryTool />
                    </div>
                </section>
            </main>
        </div>
    );
}
