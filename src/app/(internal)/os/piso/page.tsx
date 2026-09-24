"use client";

import React from "react";
import Link from "next/link";
import {
    Wrench,
    Car,
    ClipboardList,
    RefreshCw
} from "lucide-react";
import RecentVehiclesFeed from "@/components/os/RecentVehiclesFeed";

export default function PisoTallerPage() {
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
            <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2.5 sm:py-6 md:py-8 space-y-3 sm:space-y-6">
                
                {/* Banner de Ayuda Rápida Móvil */}
                <div className="bg-white rounded-2xl border border-slate-200/80 px-3.5 py-3 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-orange-50 text-[#f16315] rounded-xl flex-shrink-0">
                        <Car size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide leading-tight">
                            Autos en Rampa y Taller
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            Toca un auto para ver su ficha · Usa <strong>⋮</strong> para cambiar estatus
                        </p>
                    </div>
                </div>

                {/* Feed de Vehículos en modo piso operativo */}
                <div className="bg-white rounded-2xl sm:rounded-[28px] border border-slate-200/80 shadow-sm p-2 sm:p-6 md:p-8">
                    <RecentVehiclesFeed
                        initialFilterMode="activos"
                        mode="piso"
                    />
                </div>
            </main>
        </div>
    );
}
