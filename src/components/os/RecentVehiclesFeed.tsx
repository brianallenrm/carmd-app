"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Car, User, Clock, FileText, ClipboardList, History,
    Loader2, AlertTriangle, RefreshCw, Gauge, Fuel,
    CheckCircle, PlusCircle, ChevronRight, Wrench, UserCheck, UserPlus
} from "lucide-react";
import Link from "next/link";

interface RecentVehicle {
    idx: number;
    inventoryId: number;
    dateDisplay: string;
    dateTs: number;
    timeAgo: string;
    client: { name: string; phone: string };
    vehicle: { brand: string; model: string; year: string; plates: string; km: number; gas: string };
    motivo: string;
    advisor: string;
    status: 'con_nota' | 'en_piso_registrado' | 'en_piso_nuevo';
    note: { folio: string; total: number; services: string } | null;
    prefillJson: string;
}

const fmtKm = (km: number) => km > 0 ? `${km.toLocaleString("es-MX")} km` : "—";

const STATUS_CONFIG = {
    con_nota: {
        stripe: "bg-emerald-400",
        icon: "text-emerald-500",
        iconBg: "bg-emerald-50",
    },
    en_piso_registrado: {
        stripe: "bg-amber-400",
        icon: "text-[#f16315]",
        iconBg: "bg-orange-50",
    },
    en_piso_nuevo: {
        stripe: "bg-amber-400",
        icon: "text-[#f16315]",
        iconBg: "bg-orange-50",
    },
};

function StatusBadges({ v }: { v: RecentVehicle }) {
    switch (v.status) {
        case 'con_nota':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                    <CheckCircle size={9} /> Con nota #{v.note!.folio}
                </span>
            );
        case 'en_piso_registrado':
            return (
                <>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        <PlusCircle size={9} /> En piso
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full">
                        <UserCheck size={9} /> Cliente registrado
                    </span>
                </>
            );
        case 'en_piso_nuevo':
        default:
            return (
                <>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        <PlusCircle size={9} /> En piso
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-full">
                        <UserPlus size={9} /> Cliente nuevo
                    </span>
                </>
            );
    }
}

function VehicleRow({ v, index, onExpediente }: {
    v: RecentVehicle;
    index: number;
    onExpediente: (plates: string) => void;
}) {
    const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG['en_piso_nuevo'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-200 overflow-hidden"
        >
            {/* Status stripe */}
            <div className={`h-1 w-full ${cfg.stripe}`} />

            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">

                {/* Vehicle & Client info */}
                <div className="flex items-start gap-3 flex-grow min-w-0">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${cfg.iconBg}`}>
                        <Car size={18} className={cfg.icon} />
                    </div>

                    <div className="min-w-0 flex-grow">
                        {/* Vehicle */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-sm">
                                {v.vehicle.brand} {v.vehicle.model} {v.vehicle.year}
                            </span>
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 tracking-wide">
                                {v.vehicle.plates}
                            </span>
                            <StatusBadges v={v} />
                        </div>

                        {/* Client */}
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                            <User size={11} className="flex-shrink-0" />
                            <span className="truncate font-medium">{v.client.name}</span>
                        </div>

                        {/* Motivo + meta */}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {v.motivo && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
                                    <Wrench size={10} className="flex-shrink-0 text-slate-400" />
                                    <span className="italic">{v.motivo}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                {v.vehicle.km > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Gauge size={10} /> {fmtKm(v.vehicle.km)}
                                    </span>
                                )}
                                {v.vehicle.gas && (
                                    <span className="flex items-center gap-1">
                                        <Fuel size={10} /> {v.vehicle.gas}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Clock size={10} /> {v.dateDisplay}
                                    {v.advisor && ` · ${v.advisor}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                    {/* Inventario */}
                    <Link
                        href={`/os/admin/receptions`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200"
                        title="Ver inventario de recepción"
                    >
                        <ClipboardList size={13} />
                        Inventario
                    </Link>

                    {/* Nota: ver si ya existe, o generar */}
                    {v.status === 'con_nota' ? (
                        <a
                            href={`/os/note-preview?folio=${v.note!.folio}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                        >
                            <FileText size={13} />
                            Ver Nota #{v.note!.folio}
                        </a>
                    ) : (
                        <button
                            onClick={() => {
                                localStorage.setItem('carmd:prefill:note', v.prefillJson);
                                window.location.href = '/os';
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f16315] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-orange-200"
                        >
                            <PlusCircle size={13} />
                            Generar Nota
                            <ChevronRight size={11} />
                        </button>
                    )}

                    {/* Expediente */}
                    <button
                        onClick={() => onExpediente(v.vehicle.plates)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors border border-indigo-200"
                    >
                        <History size={13} />
                        Expediente
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

interface RecentVehiclesFeedProps {
    onExpedienteSearch: (plates: string) => void;
}

export default function RecentVehiclesFeed({ onExpedienteSearch }: RecentVehiclesFeedProps) {
    const [vehicles, setVehicles] = useState<RecentVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/os/recent-vehicles");
            if (!res.ok) throw new Error("Error al cargar vehículos recientes");
            const data = await res.json();
            setVehicles(data.vehicles || []);
            setLastRefresh(new Date());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 3 * 60 * 1000);
        return () => clearInterval(interval);
    }, [load]);

    const conNota = vehicles.filter(v => v.status === 'con_nota').length;
    const enPiso = vehicles.filter(v => v.status !== 'con_nota').length;

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {!loading && vehicles.length > 0 && (
                        <>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                                {conNota} con nota
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                {enPiso} en piso
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-[10px] text-slate-400">
                            Actualizado {lastRefresh.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                    <button
                        onClick={load}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading && vehicles.length === 0 ? (
                <div className="flex items-center justify-center gap-3 py-14 text-slate-400">
                    <Loader2 size={20} className="animate-spin text-[#f16315]" />
                    <span className="text-sm">Cargando vehículos recientes...</span>
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    {error}
                    <button onClick={load} className="ml-auto text-xs underline">Reintentar</button>
                </div>
            ) : vehicles.length === 0 ? (
                <div className="text-center py-14 text-slate-400">
                    <Car size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-slate-500">Sin ingresos recientes</p>
                    <p className="text-sm mt-1">Los vehículos aparecerán aquí conforme se registren inventarios.</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <div className="space-y-3">
                        {vehicles.map((v, i) => (
                            <VehicleRow
                                key={`${v.vehicle.plates}-${v.dateTs}-${i}`}
                                v={v}
                                index={i}
                                onExpediente={onExpedienteSearch}
                            />
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
}
