"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Car, User, Phone, Mail, AlertTriangle, CheckCircle,
    Clock, FileText, Wrench, Package, ReceiptText, ChevronDown,
    ChevronUp, Gauge, ShieldCheck, Zap, ArrowRight, X, Loader2,
    CircleDot, Calendar, Info
} from "lucide-react";
import Link from "next/link";

const fmt = (num: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(num);

const fmtKm = (km: number) => km > 0 ? `${km.toLocaleString("es-MX")} km` : "—";

interface MaintenanceAlert { level: "ok" | "warn" | "danger" | "info"; type: string; message: string; }
interface HistoryEntry {
    type: "note" | "inventory";
    folio?: string;
    dateDisplay: string;
    dateTs: number;
    client: { name: string; phone: string; email: string };
    vehicle: { brand: string; model: string; fullName?: string; year: string; plates: string; km: number; gas?: string; vin?: string; engine?: string };
    pricing?: { mo: number; refacciones: number; total: number; hasFactura: boolean; estatus: string };
    services?: string[];
    hasAfinacion?: boolean;
    hasPreventivo?: boolean;
    motivoIngreso?: string;
    advisor?: string;
}

interface HistoryData {
    found: boolean;
    total: number;
    client: { name: string; phone: string; email: string };
    vehicle: { brand: string; model: string; fullName?: string; year: string; plates: string; km: number };
    maintenance: {
        lastAfinacionDate: string | null;
        lastAfinacionKm: number;
        effectiveCurrentKm: number;
        hasTodayInventory: boolean;
        kmSinceLastAfinacion: number | null;
        preventivosSinceAfinacion: number;
        preventivosDisponibles: number;
        alerts: MaintenanceAlert[];
    };
    priceRef: Record<string, { mo: number; refacciones: number; total: number; date: string; hasFactura: boolean }>;
    entries: HistoryEntry[];
}

function AlertBadge({ alert }: { alert: MaintenanceAlert }) {
    const styles: Record<string, string> = {
        danger: "bg-red-50 border-red-200 text-red-800",
        warn: "bg-amber-50 border-amber-200 text-amber-800",
        ok: "bg-emerald-50 border-emerald-200 text-emerald-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
    };
    const icons: Record<string, React.ReactNode> = {
        danger: <AlertTriangle className="w-4 h-4 text-red-500" />,
        warn: <Zap className="w-4 h-4 text-amber-500" />,
        ok: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        info: <Info className="w-4 h-4 text-blue-500" />,
    };
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${styles[alert.level] ?? styles.info}`}>
            {icons[alert.level]}
            {alert.message}
        </div>
    );
}

function NoteCard({ entry, index }: { entry: HistoryEntry; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const isNote = entry.type === "note";

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative pl-8"
        >
            {/* Timeline dot & line */}
            <div className={`absolute left-0 top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${isNote ? "bg-white border-[#f16315]" : "bg-white border-slate-300"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isNote ? "bg-[#f16315]" : "bg-slate-400"}`} />
            </div>

            <div className={`ml-4 mb-5 rounded-xl border bg-white shadow-sm transition-all duration-200
                ${isNote ? "border-slate-200 hover:border-orange-200" : "border-slate-100 hover:border-slate-200"}`}>

                {/* Card Header */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-left p-4 flex items-start justify-between gap-4"
                >
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 flex-shrink-0
                            ${isNote ? "bg-orange-50 text-[#f16315]" : "bg-slate-100 text-slate-500"}`}>
                            {isNote ? <FileText size={16} /> : <ReceiptText size={16} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800 text-sm">
                                    {isNote ? `Nota #${entry.folio}` : "Inventario de Recepción"}
                                </span>
                                {entry.hasAfinacion && (
                                    <span className="text-[10px] font-black bg-orange-100 text-[#f16315] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Afinación
                                    </span>
                                )}
                                {entry.hasPreventivo && (
                                    <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Preventivo
                                    </span>
                                )}
                                {entry.pricing?.hasFactura && (
                                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Factura (IVA)
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Calendar size={11} /> {entry.dateDisplay}</span>
                                {entry.vehicle.km > 0 && (
                                    <span className="flex items-center gap-1"><Gauge size={11} /> {fmtKm(entry.vehicle.km)}</span>
                                )}
                                {isNote && entry.pricing && (
                                    <span className="font-bold text-slate-600">{fmt(entry.pricing.total)}</span>
                                )}
                                {!isNote && entry.motivoIngreso && (
                                    <span className="italic truncate max-w-[200px]">{entry.motivoIngreso}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-slate-400 flex-shrink-0 mt-1">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </button>

                {/* Expanded Detail */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-4">
                                {/* Services list (for notes) */}
                                {isNote && entry.services && entry.services.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 mt-3">
                                            Servicios Realizados
                                        </p>
                                        <ul className="space-y-1">
                                            {entry.services.map((svc, i) => (
                                                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                                    <CircleDot size={12} className="text-slate-300 mt-1 flex-shrink-0" />
                                                    {svc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Price breakdown (for notes) */}
                                {isNote && entry.pricing && (
                                    <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                                                <Wrench size={10} /> Mano de Obra
                                            </p>
                                            <p className="text-sm font-bold text-slate-800 mt-1">{fmt(entry.pricing.mo)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                                                <Package size={10} /> Refacciones
                                            </p>
                                            <p className="text-sm font-bold text-slate-800 mt-1">{fmt(entry.pricing.refacciones)}</p>
                                        </div>
                                        <div className={`rounded-lg p-1 ${entry.pricing.hasFactura ? "bg-indigo-50" : "bg-orange-50"}`}>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                                                <ReceiptText size={10} /> Total {entry.pricing.hasFactura && "(+ IVA)"}
                                            </p>
                                            <p className={`text-sm font-black mt-1 ${entry.pricing.hasFactura ? "text-indigo-700" : "text-[#f16315]"}`}>
                                                {fmt(entry.pricing.total)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Inventory details */}
                                {!isNote && (
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-3">
                                        {entry.vehicle.gas && <div><span className="text-slate-400">Gasolina:</span> {entry.vehicle.gas}</div>}
                                        {entry.vehicle.engine && <div><span className="text-slate-400">Motor:</span> {entry.vehicle.engine}</div>}
                                        {entry.vehicle.vin && <div className="col-span-2"><span className="text-slate-400">VIN:</span> <span className="font-mono">{entry.vehicle.vin}</span></div>}
                                        {entry.advisor && <div className="col-span-2"><span className="text-slate-400">Asesor:</span> {entry.advisor}</div>}
                                        {entry.motivoIngreso && <div className="col-span-2"><span className="text-slate-400">Motivo:</span> {entry.motivoIngreso}</div>}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default function VehicleHistoryTool() {
    const [query, setQuery] = useState("");
    const [currentKm, setCurrentKm] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<HistoryData | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showKmInput, setShowKmInput] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const search = async (km?: string) => {
        if (query.trim().length < 3) return;
        setLoading(true);
        setResult(null);
        setNotFound(false);
        setError(null);

        try {
            const params = new URLSearchParams({ q: query.trim() });
            if (km) params.set("km", km);
            const res = await fetch(`/api/os/history/search?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error del servidor");
            if (!data.found) {
                setNotFound(true);
            } else {
                setResult(data);
                // Only prompt for manual km if absolutely no km data exists in the whole record
                if (!data.maintenance.effectiveCurrentKm) setShowKmInput(true);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        search(currentKm || undefined);
    };

    const handleKmSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentKm) {
            search(currentKm);
            setShowKmInput(false);
        }
    };

    const clear = () => {
        setQuery("");
        setResult(null);
        setNotFound(false);
        setError(null);
        setShowKmInput(false);
        setCurrentKm("");
        inputRef.current?.focus();
    };

    const noteCount = result?.entries.filter(e => e.type === "note").length ?? 0;
    const inventoryCount = result?.entries.filter(e => e.type === "inventory").length ?? 0;
    const totalInvested = result?.entries
        .filter(e => e.type === "note")
        .reduce((sum, e) => sum + (e.pricing?.total ?? 0), 0) ?? 0;

    return (
        <div className="w-full">
            {/* Search Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-grow">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Buscar por placa (ABC-123) o nombre del cliente..."
                        className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f16315]/30 focus:border-[#f16315] transition-all placeholder:text-slate-400"
                    />
                    {query && (
                        <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={loading || query.trim().length < 3}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#f16315] hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                    Buscar
                </button>
            </form>

            {/* Loading */}
            {loading && (
                <div className="mt-6 flex items-center justify-center gap-3 py-12 text-slate-400">
                    <Loader2 size={20} className="animate-spin text-[#f16315]" />
                    <span className="text-sm">Consultando base de datos...</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Not Found */}
            {notFound && !loading && (
                <div className="mt-6 flex flex-col items-center py-12 text-slate-400">
                    <Car size={40} className="mb-3 opacity-30" />
                    <p className="font-bold text-slate-600">No se encontraron registros</p>
                    <p className="text-sm mt-1">Intenta con otra placa o verifica la ortografía del nombre.</p>
                </div>
            )}

            {/* Manual KM Input */}
            {showKmInput && result && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                    <div className="flex items-start gap-2 text-amber-800 flex-grow">
                        <Info size={16} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                            <strong>Sin registro de kilometraje.</strong> No se encontró km en ningún inventario o nota anterior. Ingresa el km actual para calcular los indicadores de mantenimiento.
                        </p>
                    </div>
                    <form onSubmit={handleKmSubmit} className="flex gap-2 flex-shrink-0">
                        <input
                            type="number"
                            value={currentKm}
                            onChange={e => setCurrentKm(e.target.value)}
                            placeholder="KM actual"
                            className="w-32 px-3 py-1.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                        />
                        <button type="submit" className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors">
                            Calcular
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
                {result && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-5 space-y-5"
                    >
                        {/* Client + Vehicle Summary Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-50 rounded-xl">
                                        <Car size={20} className="text-[#f16315]" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 leading-tight">
                                            {result.vehicle.fullName || `${result.vehicle.brand} ${result.vehicle.model}`} {result.vehicle.year}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                            <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">{result.vehicle.plates}</span>
                                            {result.vehicle.km > 0 && <span className="flex items-center gap-1"><Gauge size={11} /> Últ. registro: {fmtKm(result.vehicle.km)}</span>}
                                        </div>
                                    </div>
                                </div>
                                {/* Quick action: Start new note with this client data */}
                                <Link
                                    href={`/os?prefill=${encodeURIComponent(JSON.stringify({ client: result.client, vehicle: result.vehicle }))}`}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-[#f16315] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0"
                                >
                                    <FileText size={13} />
                                    Nueva Nota
                                    <ArrowRight size={12} />
                                </Link>
                            </div>

                            {/* Client Info Row */}
                            <div className="px-4 py-3 bg-slate-50/50 flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <User size={13} className="text-slate-400" />
                                    <span className="font-medium">{result.client.name}</span>
                                </div>
                                {result.client.phone && (
                                    <a href={`tel:${result.client.phone}`} className="flex items-center gap-1.5 text-slate-600 hover:text-[#f16315] transition-colors">
                                        <Phone size={13} className="text-slate-400" />
                                        {result.client.phone}
                                    </a>
                                )}
                                {result.client.email && result.client.email !== "*" && (
                                    <a href={`mailto:${result.client.email}`} className="flex items-center gap-1.5 text-slate-600 hover:text-[#f16315] transition-colors">
                                        <Mail size={13} className="text-slate-400" />
                                        {result.client.email}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Maintenance Alerts */}
                        {result.maintenance.alerts.length > 0 && (
                            <div className="space-y-2">
                                {result.maintenance.alerts.map((alert, i) => (
                                    <AlertBadge key={i} alert={alert} />
                                ))}
                            </div>
                        )}

                        {/* Stats Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Visitas Totales</p>
                                <p className="text-2xl font-black text-slate-800 mt-1">{result.total}</p>
                                <p className="text-[10px] text-slate-400">{noteCount} notas · {inventoryCount} inventarios</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inversión Total</p>
                                <p className="text-xl font-black text-[#f16315] mt-1">{fmt(totalInvested)}</p>
                                <p className="text-[10px] text-slate-400">en {noteCount} servicios</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1"><ShieldCheck size={10} /> Preventivos</p>
                                <p className="text-2xl font-black text-blue-600 mt-1">{result.maintenance.preventivosDisponibles}</p>
                                <p className="text-[10px] text-slate-400">disponibles de 2</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Últ. Afinación</p>
                                <p className="text-xs font-bold text-slate-700 mt-2 leading-tight">{result.maintenance.lastAfinacionDate ?? "—"}</p>
                                {result.maintenance.lastAfinacionKm > 0 && (
                                    <p className="text-[10px] text-slate-400">{fmtKm(result.maintenance.lastAfinacionKm)}</p>
                                )}
                            </div>
                        </div>

                        {/* Chronological History */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Historial Completo</h4>
                                <div className="h-px bg-slate-100 flex-grow" />
                                <span className="text-[10px] text-slate-400 font-medium">{result.total} entradas</span>
                            </div>

                            {/* Timeline */}
                            <div className="relative">
                                {/* vertical line */}
                                <div className="absolute left-[7px] top-5 bottom-5 w-px bg-slate-100" />
                                {result.entries.map((entry, i) => (
                                    <NoteCard key={`${entry.type}-${entry.folio || entry.dateTs}-${i}`} entry={entry} index={i} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
