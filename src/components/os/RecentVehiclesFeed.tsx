"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Car, User, Clock, FileText, ClipboardList, History,
    Loader2, AlertTriangle, RefreshCw, Gauge, Fuel,
    CheckCircle, PlusCircle, ChevronRight, ChevronLeft, Wrench, UserCheck, UserPlus,
    MoreVertical, LogOut, RotateCcw, CheckCircle2, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import FloorControlDrawer from "./FloorControlDrawer";

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
    status: 'con_nota' | 'en_piso_registrado' | 'en_piso_nuevo' | 'salida_sin_nota' | 'entregado' | 'mantenimiento_sin_nota';
    floorData?: {
        status: string;
        mechanic: string;
        exitReason: string;
        partsCount: number;
        externalCount: number;
        logCount: number;
        parts: any[];
        externalServices: any[];
        log: any[];
    } | null;
    note: { folio: string; total: number; services: string } | null;
    prefillJson: string;
}

const fmtKm = (km: number) => km > 0 ? `${km.toLocaleString("es-MX")} km` : "—";

const STATUS_CONFIG: Record<string, { stripe: string; icon: string; iconBg: string }> = {
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
    salida_sin_nota: {
        stripe: "bg-slate-300",
        icon: "text-slate-400",
        iconBg: "bg-slate-100",
    },
    mantenimiento_sin_nota: {
        stripe: "bg-teal-400",
        icon: "text-teal-600",
        iconBg: "bg-teal-50",
    },
    entregado: {
        stripe: "bg-blue-400",
        icon: "text-blue-500",
        iconBg: "bg-blue-50",
    },
};

function StatusBadges({ v }: { v: RecentVehicle }) {
    switch (v.status) {
        case 'mantenimiento_sin_nota':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-full">
                    <Wrench size={9} /> Cortesía / Garantía (Sin nota)
                </span>
            );
        case 'salida_sin_nota':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-full">
                    <LogOut size={9} /> Salida sin nota
                </span>
            );
        case 'entregado':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 size={9} /> Entregado
                </span>
            );
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


function VehicleRow({ v, index, onExpediente, onContextMenu, onSelect, mode = 'full' }: {
    v: RecentVehicle;
    index: number;
    onExpediente: (plates: string) => void;
    onContextMenu: (e: React.MouseEvent, v: RecentVehicle) => void;
    onSelect: (v: RecentVehicle) => void;
    mode?: 'full' | 'piso';
}) {
    const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG['en_piso_nuevo'];
    const isExited = v.status === 'salida_sin_nota' || v.status === 'entregado' || v.status === 'mantenimiento_sin_nota';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => onSelect(v)}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(e, v);
            }}
            className={`bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 overflow-hidden cursor-pointer ${
                isExited ? 'opacity-65 bg-slate-50/70' : ''
            }`}
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
                            {v.floorData?.mechanic && (
                                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full">
                                    👨‍🔧 {v.floorData.mechanic}
                                </span>
                            )}
                            {Boolean(v.floorData?.partsCount && v.floorData.partsCount > 0) && (
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                    📦 {v.floorData?.partsCount} refacc.
                                </span>
                            )}
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
                <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                    {/* Botón directo Ficha de Piso en modo piso para uso ágil en celular */}
                    {mode === 'piso' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(v);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-orange-200"
                        >
                            <Wrench size={13} />
                            <span>Ficha</span>
                        </button>
                    )}

                    {/* Inventario */}
                    <Link
                        href={`/os/admin/receptions`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
                    >
                        <ClipboardList size={13} />
                        <span>Inventario</span>
                    </Link>

                    {/* Nota: ver si ya existe, o generar (Solo en modo full/administrativo) */}
                    {mode !== 'piso' && (
                        v.status === 'con_nota' ? (
                            <a
                                href={`/os/note-preview?folio=${v.note!.folio}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                            >
                                <FileText size={13} />
                                <span className="hidden md:inline">Ver </span>Nota #{v.note!.folio}
                            </a>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    localStorage.setItem('carmd:prefill:note', v.prefillJson);
                                    window.open('/os', '_blank');
                                }}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#f16315] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-orange-200"
                            >
                                <PlusCircle size={13} />
                                Generar Nota
                            </button>
                        )
                    )}

                    {/* Expediente */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onExpediente(v.vehicle.plates);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors border border-indigo-200"
                    >
                        <History size={13} />
                        <span>Expediente</span>
                    </button>

                    {/* Botón 3 puntos / opciones de piso */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onContextMenu(e, v);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors border border-slate-200 flex-shrink-0"
                        title="Opciones de piso (o clic derecho)"
                    >
                        <MoreVertical size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

interface RecentVehiclesFeedProps {
    onExpedienteSearch: (plates: string) => void;
    initialFilterMode?: 'todos' | 'activos';
    mode?: 'full' | 'piso';
}

export default function RecentVehiclesFeed({ onExpedienteSearch, initialFilterMode = 'todos', mode = 'full' }: RecentVehiclesFeedProps) {
    const [vehicles, setVehicles] = useState<RecentVehicle[]>([]);
    const [filterMode, setFilterMode] = useState<'todos' | 'activos'>(initialFilterMode);
    const [selectedDrawerVehicle, setSelectedDrawerVehicle] = useState<RecentVehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [page, setPage] = useState(0);
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        vehicle: RecentVehicle | null;
    }>({ visible: false, x: 0, y: 0, vehicle: null });

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

    // Escuchar evento personalizado para refrescar datos desde header
    useEffect(() => {
        const handleCustomRefresh = () => {
            load();
        };
        window.addEventListener("carmd:refresh-recent-vehicles", handleCustomRefresh);
        return () => window.removeEventListener("carmd:refresh-recent-vehicles", handleCustomRefresh);
    }, [load]);

    // Cerrar menú contextual al hacer clic fuera
    useEffect(() => {
        const handleWindowClick = () => {
            setContextMenu(prev => ({ ...prev, visible: false }));
        };
        window.addEventListener('click', handleWindowClick);
        return () => window.removeEventListener('click', handleWindowClick);
    }, []);

    const handleContextMenu = (e: React.MouseEvent, vehicle: RecentVehicle) => {
        const x = Math.max(10, Math.min(e.clientX, window.innerWidth - 270));
        const y = Math.max(10, Math.min(e.clientY, window.innerHeight - 280));
        setContextMenu({
            visible: true,
            x,
            y,
            vehicle
        });
    };

    const handleSetFloorStatus = async (plate: string, status: string, reason?: string) => {
        setContextMenu(prev => ({ ...prev, visible: false }));
        const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Actualización optimista en memoria
        setVehicles(prev => prev.map(v => {
            const vPlate = v.vehicle.plates.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (vPlate === cleanPlate) {
                let newStatus: any = v.status;
                if (status === 'SALIDA_SIN_NOTA') newStatus = 'salida_sin_nota';
                if (status === 'MANTENIMIENTO_SIN_NOTA') newStatus = 'mantenimiento_sin_nota';
                if (status === 'ENTREGADO') newStatus = 'entregado';
                if (status === 'EN_REPARACION') newStatus = v.note ? 'con_nota' : 'en_piso_registrado';

                return {
                    ...v,
                    status: newStatus,
                    floorData: {
                        ...(v.floorData || {
                            mechanic: '',
                            partsCount: 0,
                            externalCount: 0,
                            logCount: 0,
                            parts: [],
                            externalServices: [],
                            log: []
                        }),
                        status,
                        exitReason: reason || '',
                        lastUpdate: new Date().toISOString()
                    }
                };
            }
            return v;
        }));

        // Persistir en servidor
        try {
            await fetch('/api/os/recent-vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plate: cleanPlate, status, reason })
            });
        } catch (e) {
            console.error("Error al actualizar estatus de piso:", e);
        }
    };

    // Filtro activo vs todos: en piso, activos son los autos que NO han salido ni entregados (siguen físicamente en taller)
    const displayVehicles = vehicles.filter(v => {
        if (filterMode === 'activos') {
            if (mode === 'piso') {
                return v.status !== 'salida_sin_nota' && v.status !== 'entregado';
            }
            return v.status !== 'salida_sin_nota' && v.status !== 'entregado' && v.status !== 'con_nota' && v.status !== 'mantenimiento_sin_nota';
        }
        return true;
    });

    const activosCount = vehicles.filter(v => {
        if (mode === 'piso') {
            return v.status !== 'salida_sin_nota' && v.status !== 'entregado';
        }
        return v.status !== 'salida_sin_nota' && v.status !== 'entregado' && v.status !== 'con_nota' && v.status !== 'mantenimiento_sin_nota';
    }).length;
    const conNotaCount = vehicles.filter(v => v.status === 'con_nota').length;
    const cortesiasCount = vehicles.filter(v => v.status === 'mantenimiento_sin_nota').length;
    const salidasCount = vehicles.filter(v => v.status === 'salida_sin_nota').length;

    return (
        <div className="w-full relative">
            {/* Header con estadísticas y selector de filtro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Botones de Filtro: Ver Todos (Principal) y Solo en Taller (Secundaria) */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setFilterMode('todos'); setPage(0); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                filterMode === 'todos'
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            <span>Ver Todos</span>
                            <span className="bg-slate-300 text-slate-700 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                                {vehicles.length}
                            </span>
                        </button>
                        <button
                            onClick={() => { setFilterMode('activos'); setPage(0); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                filterMode === 'activos'
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            <span>Solo en Taller</span>
                            <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                                {activosCount}
                            </span>
                        </button>
                    </div>

                    {!loading && (
                        <div className="hidden md:flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                                {conNotaCount} con nota
                            </span>
                            {cortesiasCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                                    {cortesiasCount} cortesías
                                </span>
                            )}
                            {salidasCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                                    {salidasCount} salidas sin nota
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                        💡 Clic en un coche para detalles de piso • Clic derecho para opciones
                    </span>
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
            ) : displayVehicles.length === 0 ? (
                <div className="text-center py-14 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Car size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-slate-600">No hay vehículos activos en piso</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {filterMode === 'activos' 
                            ? "Todos los vehículos registrados tienen nota o fueron dados de salida." 
                            : "No hay registros recientes."}
                    </p>
                    {filterMode === 'activos' && (
                        <button 
                            onClick={() => setFilterMode('todos')}
                            className="mt-3 px-3 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50"
                        >
                            Ver histórico completo
                        </button>
                    )}
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <div className="space-y-3">
                        {displayVehicles.slice(page * 10, (page + 1) * 10).map((v, i) => (
                            <VehicleRow
                                key={`${v.vehicle.plates}-${v.dateTs}-${i}`}
                                v={v}
                                index={i}
                                onExpediente={onExpedienteSearch}
                                onContextMenu={handleContextMenu}
                                onSelect={(veh) => setSelectedDrawerVehicle(veh)}
                                mode={mode}
                            />
                        ))}

                        {/* Pagination Controls */}
                        {displayVehicles.length > 10 && (
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                                <span className="font-medium">
                                    Mostrando {page * 10 + 1} - {Math.min((page + 1) * 10, displayVehicles.length)} de {displayVehicles.length}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Anteriores 10"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="font-bold px-2 text-slate-600">
                                        Pág {page + 1}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => (p + 1) * 10 < displayVehicles.length ? p + 1 : p)}
                                        disabled={(page + 1) * 10 >= displayVehicles.length}
                                        className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Siguientes 10"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </AnimatePresence>
            )}

            {/* Menú Contextual Flotante (Clic derecho o botón 3 puntos) */}
            {contextMenu.visible && contextMenu.vehicle && (
                <>
                    {/* Backdrop para cerrar al tocar fuera en pantallas táctiles */}
                    <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[0.5px]"
                        onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                    />
                    <div
                        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 w-64 text-left animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            top: contextMenu.y,
                            left: contextMenu.x,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                        <p className="text-xs font-black text-slate-800 uppercase truncate">
                            {contextMenu.vehicle.vehicle.brand} {contextMenu.vehicle.vehicle.model}
                        </p>
                        <p className="text-[10px] font-mono font-bold text-slate-400">
                            Placas: {contextMenu.vehicle.vehicle.plates}
                        </p>
                    </div>

                    <div className="py-1">
                        <button
                            onClick={() => {
                                setSelectedDrawerVehicle(contextMenu.vehicle);
                                setContextMenu(prev => ({ ...prev, visible: false }));
                            }}
                            className="w-full px-4 py-2.5 text-xs font-bold text-[#f16315] hover:bg-orange-50 flex items-center gap-2.5 transition-colors text-left"
                        >
                            <ClipboardList size={14} className="text-[#f16315] flex-shrink-0" />
                            <span>Abrir Ficha de Piso</span>
                        </button>

                        <div className="h-px bg-slate-100 my-1" />

                        {(contextMenu.vehicle.status === 'salida_sin_nota' || contextMenu.vehicle.status === 'mantenimiento_sin_nota') ? (
                            <button
                                onClick={() => {
                                    handleSetFloorStatus(contextMenu.vehicle!.vehicle.plates, 'EN_REPARACION', 'Reingreso a piso');
                                }}
                                className="w-full px-4 py-2.5 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition-colors text-left"
                            >
                                <RotateCcw size={14} className="text-amber-500 flex-shrink-0" />
                                <span>Reincorporar a Piso</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        handleSetFloorStatus(contextMenu.vehicle!.vehicle.plates, 'MANTENIMIENTO_SIN_NOTA', 'Mantenimiento de cortesía incluido / Garantía');
                                    }}
                                    className="w-full px-4 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center gap-2.5 transition-colors text-left"
                                >
                                    <Wrench size={14} className="text-teal-600 flex-shrink-0" />
                                    <span>Mantenimiento cortesía (sin nota)</span>
                                </button>

                                <button
                                    onClick={() => {
                                        handleSetFloorStatus(contextMenu.vehicle!.vehicle.plates, 'SALIDA_SIN_NOTA', 'Salida sin reparación / Presupuesto no aceptado');
                                    }}
                                    className="w-full px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors text-left"
                                >
                                    <LogOut size={14} className="text-rose-500 flex-shrink-0" />
                                    <span>Salida sin reparación / nota</span>
                                </button>
                            </>
                        )}

                        {contextMenu.vehicle.status !== 'entregado' && (
                            <button
                                onClick={() => {
                                    handleSetFloorStatus(contextMenu.vehicle!.vehicle.plates, 'ENTREGADO', 'Entregado al cliente');
                                }}
                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-left"
                            >
                                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                <span>Marcar como Entregado</span>
                            </button>
                        )}

                        <div className="h-px bg-slate-100 my-1" />

                        <button
                            onClick={() => {
                                onExpedienteSearch(contextMenu.vehicle!.vehicle.plates);
                                setContextMenu(prev => ({ ...prev, visible: false }));
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors text-left"
                        >
                            <History size={14} className="text-indigo-500 flex-shrink-0" />
                            <span>Ver Expediente Histórico</span>
                        </button>
                    </div>
                </div>
                </>
            )}

            {/* Drawer de Control de Piso */}
            <AnimatePresence>
                {selectedDrawerVehicle && (
                    <FloorControlDrawer
                        isOpen={!!selectedDrawerVehicle}
                        vehicle={selectedDrawerVehicle}
                        onClose={() => setSelectedDrawerVehicle(null)}
                        onVehicleUpdated={(updated) => {
                            setSelectedDrawerVehicle(updated);
                            setVehicles(prev => prev.map(v => 
                                v.vehicle.plates.toUpperCase().replace(/[^A-Z0-9]/g, '') === updated.vehicle.plates.toUpperCase().replace(/[^A-Z0-9]/g, '')
                                    ? updated
                                    : v
                            ));
                        }}
                        onExpedienteSearch={onExpedienteSearch}
                        mode={mode}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

