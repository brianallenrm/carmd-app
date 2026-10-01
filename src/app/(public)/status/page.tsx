"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Search, ShieldCheck, ArrowRight, Sparkles, Navigation } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function StatusPortalPage() {
    const router = useRouter();
    const [plateInput, setPlateInput] = useState("");
    const [searching, setSearching] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = plateInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (!clean) return;
        setSearching(true);
        router.push(`/status/${clean}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between antialiased">
            {/* Header */}
            <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 py-3.5">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <BrandLogo size="sm" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        Car Tracker
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-md w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 text-center">
                    
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#f16315] flex items-center justify-center mx-auto shadow-sm">
                        <Car size={32} />
                    </div>

                    {/* Titles */}
                    <div className="space-y-1.5">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">
                            Car Tracker de CarMD
                        </h1>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                            Sigue en vivo el avance técnico de tu vehículo en rampa y taller con 100% de transparencia.
                        </p>
                    </div>

                    {/* Formulario de Placas */}
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="relative">
                            <input
                                type="text"
                                value={plateInput}
                                onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                                placeholder="Ej. ABC1234"
                                className="w-full text-center text-lg font-black tracking-widest font-mono uppercase py-3.5 px-4 bg-slate-50 border-2 border-slate-200 focus:border-[#f16315] focus:bg-white rounded-2xl transition-all outline-none placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal placeholder:text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!plateInput.trim() || searching}
                            className="w-full py-3.5 px-4 bg-[#f16315] hover:bg-orange-600 disabled:opacity-40 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
                        >
                            <span>{searching ? "Consultando..." : "Consultar Avance"}</span>
                            <ArrowRight size={15} />
                        </button>
                    </form>

                    {/* Nota de Seguridad */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-left space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800">
                            <ShieldCheck size={14} className="text-[#f16315]" />
                            <span>Enlace Único de Privacidad</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Al recibir tu vehículo en taller, tu asesor te compartirá tu link privado directo por WhatsApp para mayor comodidad.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-[10px] text-slate-400 border-t border-slate-200/60 bg-white">
                <p className="font-bold">CarMD® • Calle Palacio de Iturbide No. 233, Nezahualcóyotl</p>
            </footer>
        </div>
    );
}
