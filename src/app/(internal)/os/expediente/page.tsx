"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Car, User, Phone, Mail, AlertTriangle, CheckCircle,
    FileText, ReceiptText, ChevronDown, ChevronUp, Gauge,
    ArrowLeft, ArrowRight, X, Loader2, CircleDot, Calendar,
    Sparkles, Cpu, Layers, HelpCircle
} from "lucide-react";
import Link from "next/link";
import ExpedienteAICopilot from "@/components/os/ExpedienteAICopilot";

const fmt = (num: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(num);

const fmtKm = (km: number) => km > 0 ? `${km.toLocaleString("es-MX")} km` : "—";

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
    hasInspeccionAfinacion?: boolean;
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
        kmSinceLastAfinacion: number | null;
        daysSinceLastVisit: number | null;
        avgMonthlyKm: number | null;
        alerts: any[];
    };
    entries: HistoryEntry[];
}

function NoteCard({ entry, index }: { entry: HistoryEntry; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const isNote = entry.type === "note";

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="relative pl-8"
        >
            {/* Timeline dot & line */}
            <div className={`absolute left-0 top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${isNote ? (entry.hasAfinacion ? "bg-[#f16315] border-[#f16315]" : "bg-white border-[#f16315]") : "bg-white border-slate-300"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isNote ? (entry.hasAfinacion ? "bg-white" : "bg-[#f16315]") : "bg-slate-400"}`} />
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
                            ${isNote ? (entry.hasAfinacion ? "bg-orange-500 text-white" : "bg-orange-50 text-[#f16315]") : "bg-slate-100 text-slate-500"}`}>
                            {isNote ? <FileText size={16} /> : <ReceiptText size={16} />}
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <span className="font-bold text-slate-800 text-sm truncate">
                                        {isNote ? `Nota #${entry.folio}` : "Inventario de Recepción"}
                                    </span>
                                    {entry.hasAfinacion && (
                                        <span className="text-[9px] font-black bg-orange-100 text-[#f16315] px-1.5 py-0.5 rounded-full uppercase">
                                            Afinación
                                        </span>
                                    )}
                                    {entry.hasInspeccionAfinacion && (
                                        <span className="text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase">
                                            Inspección Afinación
                                        </span>
                                    )}
                                    {entry.pricing?.hasFactura && (
                                        <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase">
                                            Factura
                                        </span>
                                    )}
                                </div>
                                <div className="text-slate-400 flex-shrink-0">
                                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-slate-400 flex-wrap">
                                <span className="flex items-center gap-1 whitespace-nowrap"><Calendar size={11} /> {entry.dateDisplay}</span>
                                {entry.vehicle.km > 0 && (
                                    <span className="flex items-center gap-1 whitespace-nowrap"><Gauge size={11} /> {fmtKm(entry.vehicle.km)}</span>
                                )}
                                {isNote && entry.pricing && (
                                    <span className="font-bold text-slate-600 whitespace-nowrap">{fmt(entry.pricing.total)}</span>
                                )}
                                {!isNote && entry.motivoIngreso && (
                                    <span className="italic truncate">{entry.motivoIngreso}</span>
                                )}
                            </div>
                        </div>
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

                                {isNote && entry.pricing && (
                                    <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Mano de Obra</p>
                                            <p className="text-sm font-bold text-slate-800 mt-1">{fmt(entry.pricing.mo)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Refacciones</p>
                                            <p className="text-sm font-bold text-slate-800 mt-1">{fmt(entry.pricing.refacciones)}</p>
                                        </div>
                                        <div className={`rounded-lg p-1 ${entry.pricing.hasFactura ? "bg-indigo-50" : "bg-orange-50"}`}>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Total</p>
                                            <p className={`text-sm font-black mt-1 ${entry.pricing.hasFactura ? "text-indigo-700" : "text-[#f16315]"}`}>
                                                {fmt(entry.pricing.total)}
                                            </p>
                                        </div>
                                    </div>
                                )}

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

export default function ExpedienteLabPage() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<HistoryData | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchedGarage, setMatchedGarage] = useState<Array<{ plates: string; vehicle: string; count: number }>>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 3) return;
        setLoading(true);
        setResult(null);
        setNotFound(false);
        setError(null);
        setMatchedGarage([]);

        try {
            const params = new URLSearchParams({ q: q.trim() });
            const res = await fetch(`/api/os/history/search?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error del servidor");

            if (!data.found) {
                setNotFound(true);
            } else {
                setResult(data);

                // Detect if multiple unique vehicles exist in the entries
                const plateMap = new Map<string, { plates: string; vehicle: string; count: number }>();
                data.entries.forEach((e: HistoryEntry) => {
                    const pl = e.vehicle?.plates?.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (pl && pl.length >= 4) {
                        const existing = plateMap.get(pl);
                        const vName = e.vehicle?.fullName || `${e.vehicle?.brand || ''} ${e.vehicle?.model || ''} ${e.vehicle?.year || ''}`.trim();
                        if (existing) {
                            existing.count += 1;
                        } else {
                            plateMap.set(pl, { plates: e.vehicle.plates, vehicle: vName, count: 1 });
                        }
                    }
                });

                if (plateMap.size > 1) {
                    setMatchedGarage(Array.from(plateMap.values()));
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        search(query);
    };

    const handleSelectGarageVehicle = (plates: string) => {
        setQuery(plates);
        search(plates);
    };

    const clear = () => {
        setQuery("");
        setResult(null);
        setNotFound(false);
        setError(null);
        setMatchedGarage([]);
        inputRef.current?.focus();
    };

    const noteCount = result?.entries.filter(e => e.type === "note").length ?? 0;
    const inventoryCount = result?.entries.filter(e => e.type === "inventory").length ?? 0;
    const daysSinceLast = result?.maintenance?.daysSinceLastVisit;

    return (
        <div className="min-h-screen bg-slate-50/70 pb-24">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/os/centrodecontrol"
                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 flex items-center gap-1.5 text-xs font-bold"
                        >
                            <ArrowLeft size={15} />
                            <span className="hidden sm:inline">Centro de Control</span>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-black text-slate-900 tracking-tight">
                                    EXPEDIENTE DEL VEHÍCULO
                                </h1>
                                <span className="px-2 py-0.5 rounded-full bg-orange-100/70 text-[#f16315] text-[9px] font-black uppercase tracking-wider">
                                    Lab IA
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Diagnóstico clínico asistido por Gemini 3.6 Flash
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white text-[#f16315] border border-orange-200 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
                            <Cpu size={12} /> Gemini 3.6 Flash
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Search Bar */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                    <div className="max-w-3xl mx-auto text-center mb-6">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                            Consulta del Historial & Diagnóstico Clínico
                        </h2>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                            Ingresa una <strong className="text-gray-700">placa</strong> (ej. PCH2668) o el <strong className="text-gray-700">nombre del cliente</strong> para analizar el expediente con IA.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
                        <div className="relative flex-grow">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Ej: PCH-2668 o Roberto González..."
                                className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f16315]/30 focus:border-[#f16315] transition-all placeholder:text-gray-400 font-medium"
                            />
                            {query && (
                                <button type="button" onClick={clear} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || query.trim().length < 3}
                            className="flex items-center gap-2 px-6 py-3 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            Buscar
                        </button>
                    </form>

                    {/* Quick plate test suggestions */}
                    <div className="max-w-2xl mx-auto mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 flex-wrap text-xs text-gray-400">
                        <span className="font-bold uppercase text-[10px] text-gray-400">Pruebas sugeridas:</span>
                        {['PCH2668', 'NWT7683', 'NXB4834', 'Explorer', 'Sentra'].map(sugg => (
                            <button
                                key={sugg}
                                onClick={() => {
                                    setQuery(sugg);
                                    search(sugg);
                                }}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-orange-50 hover:text-[#f16315] text-gray-600 rounded-lg text-xs font-bold transition-colors font-mono"
                            >
                                {sugg}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3 shadow-sm">
                        <Loader2 size={28} className="animate-spin text-[#f16315]" />
                        <p className="text-sm font-bold text-gray-600">Buscando expediente en Google Sheets...</p>
                        <p className="text-xs text-gray-400">Consultando Base de Datos Maestra e Inventarios</p>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-sm text-red-700">
                        <AlertTriangle size={20} className="flex-shrink-0" />
                        <div className="flex-grow">
                            <p className="font-bold">Error en la consulta</p>
                            <p className="text-xs mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {/* Not Found */}
                {notFound && !loading && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 flex flex-col items-center justify-center shadow-sm">
                        <Car size={44} className="mb-3 opacity-30 text-gray-400" />
                        <p className="font-bold text-gray-700 text-base">No se encontraron registros</p>
                        <p className="text-xs text-gray-500 mt-1">Verifica las placas o intenta buscar por el nombre de pila del cliente.</p>
                    </div>
                )}

                {/* Multi-Vehicle Garage Selector (When searching by Client Name) */}
                {matchedGarage.length > 1 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm space-y-3"
                    >
                        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#f16315] tracking-wider">
                            <Layers size={16} />
                            <span>Garage del Cliente ({matchedGarage.length} vehículos encontrados)</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Este cliente tiene varios autos en su historial. Selecciona el vehículo específico para aislar su expediente clínico:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                            {matchedGarage.map((carItem, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectGarageVehicle(carItem.plates)}
                                    className="p-3 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl text-left transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 group-hover:text-[#f16315] truncate">
                                            {carItem.vehicle}
                                        </p>
                                        <p className="font-mono text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 inline-block mt-1">
                                            {carItem.plates}
                                        </p>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-200/60 text-[10px] text-gray-400 flex items-center justify-between">
                                        <span>{carItem.count} registros</span>
                                        <span className="text-[#f16315] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                            Ver <ArrowRight size={10} />
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Main Results */}
                <AnimatePresence>
                    {result && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Client & Vehicle Header Card */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-3 bg-orange-50 text-[#f16315] rounded-2xl shadow-sm">
                                            <Car size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 leading-tight">
                                                {result.vehicle.fullName || `${result.vehicle.brand} ${result.vehicle.model}`} {result.vehicle.year}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span className="font-mono font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                                                    {result.vehicle.plates}
                                                </span>
                                                {result.vehicle.km > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Gauge size={12} /> Odómetro: {fmtKm(result.vehicle.km)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button: Start new note */}
                                    <button
                                        onClick={() => {
                                            localStorage.setItem('carmd:prefill:note', JSON.stringify({ client: result.client, vehicle: result.vehicle }));
                                            window.open('/os', '_blank');
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex-shrink-0"
                                    >
                                        <FileText size={14} />
                                        <span>Generar Nueva Nota</span>
                                        <ArrowRight size={12} />
                                    </button>
                                </div>

                                {/* Client Info Bar */}
                                <div className="px-5 py-3.5 bg-gray-50/60 flex flex-wrap gap-5 text-sm border-t border-gray-100">
                                    <div className="flex items-center gap-1.5 text-gray-700">
                                        <User size={14} className="text-gray-400" />
                                        <span className="font-bold">{result.client.name}</span>
                                    </div>
                                    {result.client.phone && (
                                        <a href={`tel:${result.client.phone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-[#f16315] transition-colors">
                                            <Phone size={14} className="text-gray-400" />
                                            {result.client.phone}
                                        </a>
                                    )}
                                    {result.client.email && result.client.email !== "*" && (
                                        <a href={`mailto:${result.client.email}`} className="flex items-center gap-1.5 text-gray-600 hover:text-[#f16315] transition-colors">
                                            <Mail size={14} className="text-gray-400" />
                                            {result.client.email}
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* ⭐ STAR COMPONENT: AI CLINICAL COPILOT (Gemini 3.6 Flash) ⭐ */}
                            <ExpedienteAICopilot historyData={result} />

                            {/* Traditional Stats Summary Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-xs">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Última Visita</p>
                                    <p className="text-xl font-black text-gray-900 mt-1">
                                        {daysSinceLast === 0 ? "Hoy" : daysSinceLast === null ? "—" : `Hace ${daysSinceLast} d`}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{noteCount} notas · {inventoryCount} inv.</p>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-xs">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">KM Afinación</p>
                                    <p className={`text-xl font-black mt-1 ${
                                        result.maintenance.kmSinceLastAfinacion !== null && result.maintenance.kmSinceLastAfinacion >= 10000
                                            ? "text-red-500"
                                            : "text-emerald-500"
                                    }`}>
                                        {result.maintenance.kmSinceLastAfinacion !== null ? `+${result.maintenance.kmSinceLastAfinacion.toLocaleString("es-MX")}` : "—"}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">km desde la última</p>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-xs">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Odómetro Registrado</p>
                                    <p className="text-xl font-black text-gray-900 mt-1">
                                        {fmtKm(result.maintenance.effectiveCurrentKm || result.vehicle.km)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">kilometraje del auto</p>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-xs">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">KM Mensuales</p>
                                    <p className="text-xl font-black text-gray-900 mt-1">
                                        {result.maintenance.avgMonthlyKm ? `${result.maintenance.avgMonthlyKm.toLocaleString("es-MX")}` : "—"}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">uso estimado/mes</p>
                                </div>
                            </div>

                            {/* Full Chronological Timeline */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                                    <h4 className="text-xs font-black text-gray-700 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Calendar size={14} className="text-[#f16315]" />
                                        Historial Cronológico de Visitas
                                    </h4>
                                    <span className="text-xs font-bold text-gray-400">
                                        {result.total} registros
                                    </span>
                                </div>

                                <div className="relative">
                                    <div className="absolute left-[7px] top-5 bottom-5 w-px bg-gray-200" />
                                    {result.entries.map((entry, i) => (
                                        <NoteCard key={`${entry.type}-${entry.folio || entry.dateTs}-${i}`} entry={entry} index={i} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
