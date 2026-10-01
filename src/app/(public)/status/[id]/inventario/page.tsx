"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Printer,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Camera,
    Maximize2,
    X,
    Car,
    User,
    Clock,
    Gauge,
    Fuel,
    FileText,
    ShieldCheck,
    Wrench,
    Check
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { CarTrackerData } from "@/types/floor-pipeline";

export default function MobileReceptionInventoryPage() {
    const params = useParams();
    const token = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "";

    const [trackerData, setTrackerData] = useState<CarTrackerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; notes?: string } | null>(null);

    useEffect(() => {
        if (!token) return;
        const load = async () => {
            try {
                const res = await fetch(`/api/tracker/${token}`, { cache: "no-store" });
                if (!res.ok) {
                    setError("No se encontró el inventario solicitado.");
                    return;
                }
                const json = await res.json();
                if (json.success && json.tracker) {
                    setTrackerData(json.tracker);
                } else {
                    setError("Error al consultar los datos del inventario.");
                }
            } catch (e) {
                console.error("Error loading inventory data:", e);
                setError("Problema de conexión al cargar el inventario.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center max-w-sm w-full">
                    <RefreshCw size={26} className="animate-spin text-[#f16315] mb-3" />
                    <h2 className="text-sm font-black text-slate-800">Cargando inventario de recepción...</h2>
                </div>
            </div>
        );
    }

    if (error || !trackerData || !trackerData.rawReceptionData) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-md w-full space-y-4">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-900">Inventario no disponible</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {error || "El inventario de recepción aún no ha sido completado para este vehículo."}
                        </p>
                    </div>
                    <Link
                        href={`/status/${token}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold w-full"
                    >
                        <ArrowLeft size={14} />
                        <span>Volver al Car Tracker</span>
                    </Link>
                </div>
            </div>
        );
    }

    const { rawReceptionData, vehicle, reception } = trackerData;
    const inventory = rawReceptionData?.inventory || {};
    const functional = rawReceptionData?.functional || {};
    const photos = rawReceptionData?.photos || {};
    const service = rawReceptionData?.service || {};

    const inventoryList = [
        { key: "birlo", label: "Birlo de seguridad" },
        { key: "cables", label: "Cables pasa-corriente" },
        { key: "reflejantes", label: "Reflejantes / Triángulos" },
        { key: "herramienta", label: "Herramienta básica" },
        { key: "gato", label: "Gato hidráulico" },
        { key: "llanta", label: "Llanta de refacción" },
        { key: "maletin", label: "Maletín de herramienta" },
        { key: "extintor", label: "Extintor" },
        { key: "antena", label: "Antena exterior" },
        { key: "encendedor", label: "Encendedor" },
        { key: "radio", label: "Radio / Carátula" },
    ];

    const functionalList = [
        { label: "Iluminación / Faros", val: functional?.lights || "Correcto" },
        { label: "Cristales y Espejos", val: functional?.glass || "Correcto" },
        { label: "Claxon", val: functional?.horn || "Correcto" },
        { label: "Limpiaparabrisas", val: functional?.wipers || "Correcto" },
        { label: "Radio / Estéreo", val: functional?.stereo || "Correcto" },
    ];

    const photoEntries = [
        { key: "frente", title: "Frente del Vehículo", data: photos?.frente },
        { key: "atras", title: "Parte Trasera", data: photos?.atras },
        { key: "izq", title: "Costado Izquierdo", data: photos?.izq },
        { key: "der", title: "Costado Derecho", data: photos?.der },
    ].filter(p => p.data?.previewUrl || p.data?.driveUrl);

    return (
        <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
            {/* Header Móvil Sticky (Oculto en Impresión) */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs print:hidden">
                <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <Link
                        href={`/status/${token}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                        <ArrowLeft size={14} />
                        <span>Volver al Tracker</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                            title="Imprimir reporte"
                        >
                            <Printer size={14} />
                            <span>Imprimir</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido Responsivo Móvil */}
            <main className="flex-1 max-w-xl w-full mx-auto px-3.5 sm:px-4 py-5 space-y-4">

                {/* Banner de Encabezado Oficial */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <BrandLogo size="sm" variant="light" />
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            {rawReceptionData.folio || `REC-${vehicle.plates}`}
                        </span>
                    </div>

                    <div className="pt-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#f16315]">
                            Registro Oficial de Ingreso
                        </span>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                            Inventario de Recepción Vehicular
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {reception.dateDisplay || rawReceptionData.date || "Fecha de ingreso registrada"}
                        </p>
                    </div>
                </div>

                {/* Tarjeta del Vehículo y Recepción */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Vehículo Inspeccionado
                            </span>
                            <h2 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                                {vehicle.brand} {vehicle.model} {vehicle.year}
                            </h2>
                        </div>

                        {/* Matrícula tipo placa */}
                        <div className="bg-slate-50 border-2 border-slate-800 rounded-lg px-2.5 py-0.5 text-center flex flex-col items-center">
                            <span className="text-[7px] font-black text-[#f16315] uppercase">MÉXICO</span>
                            <span className="text-xs font-black font-mono tracking-wider text-slate-900">
                                {vehicle.plates}
                            </span>
                        </div>
                    </div>

                    {/* Especificaciones clave de recepción */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <Gauge size={12} className="text-[#f16315]" />
                                Kilometraje
                            </span>
                            <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                                {vehicle.kmDisplay}
                            </p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <Fuel size={12} className="text-[#f16315]" />
                                Combustible
                            </span>
                            <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                                {vehicle.gas || "1/2"}
                            </p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <User size={12} className="text-[#f16315]" />
                                Asesor Técnico Responsable
                            </span>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">
                                {service.advisorName || reception.advisor || "Equipo CarMD"}
                            </p>
                        </div>
                    </div>

                    {/* Motivo de ingreso */}
                    {reception.motivo && (
                        <div className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-200/70">
                            <span className="text-[10px] font-black uppercase text-orange-900 tracking-wider block mb-1">
                                Solicitud de Servicio / Fallas Reportadas
                            </span>
                            <p className="text-xs text-orange-950 font-medium italic leading-relaxed">
                                &ldquo;{reception.motivo}&rdquo;
                            </p>
                        </div>
                    )}
                </div>

                {/* Evidencia Fotográfica al Ingresar (¡Destacado Móvil!) */}
                {photoEntries.length > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-orange-50 text-[#f16315] rounded-xl">
                                    <Camera size={16} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                        Evidencia Fotográfica de Ingreso
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Toca cualquier foto para ampliarla
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                {photoEntries.length} fotos
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {photoEntries.map((photo) => {
                                const url = photo.data?.previewUrl || photo.data?.driveUrl;
                                const notes = photo.data?.notes;

                                return (
                                    <div
                                        key={photo.key}
                                        onClick={() => setSelectedPhoto({ url, title: photo.title, notes })}
                                        className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
                                    >
                                        <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-900">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={url}
                                                alt={photo.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 text-white rounded-xl opacity-90 backdrop-blur-xs">
                                                <Maximize2 size={13} />
                                            </div>
                                            <div className="absolute bottom-2 left-2.5 bg-black/70 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider backdrop-blur-xs">
                                                {photo.title}
                                            </div>
                                        </div>

                                        {/* Observación previa */}
                                        <div className="p-3 bg-white border-t border-slate-100 flex-1">
                                            {notes ? (
                                                <div className="flex items-start gap-1.5 text-rose-900 bg-rose-50/80 p-2 rounded-xl border border-rose-200/80">
                                                    <AlertCircle size={13} className="text-rose-600 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] font-bold leading-snug">
                                                        {notes}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-slate-400 italic">
                                                    Sin observaciones ni golpes registrados en esta toma.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Inventario Físico (Herramienta y Objetos Reportados) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-[#f16315]" />
                            Herramienta y Objetos del Vehículo
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400">
                            Inventario
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                        {inventoryList.map((item) => {
                            const hasItem = Boolean(inventory[item.key]);
                            return (
                                <div
                                    key={item.key}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-colors ${
                                        hasItem
                                            ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950 font-bold"
                                            : "bg-slate-50 border-slate-200/60 text-slate-400 font-medium"
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                            hasItem ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                                        }`}
                                    >
                                        {hasItem ? <Check size={12} /> : "—"}
                                    </div>
                                    <span className="text-xs truncate">{item.label}</span>
                                </div>
                            );
                        })}

                        {/* Tapetes */}
                        <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200/80 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600">Tapetes</span>
                            <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {functional?.floormats || "Completo"}
                            </span>
                        </div>

                        {/* Rines / Tapones */}
                        <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200/80 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600">Rines / Tapones</span>
                            <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {functional?.hasRines ? "Rines" : (functional?.hubcaps || "Completo")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Inspección Visual y Funcional */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Wrench size={14} className="text-[#f16315]" />
                            Inspección Visual y Funcionamiento
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400">
                            Pruebas
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {functionalList.map((item, idx) => (
                            <div key={idx} className="py-2.5 flex items-center justify-between gap-3 first:pt-1 last:pb-1">
                                <span className="text-xs font-medium text-slate-700">{item.label}</span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 size={12} className="text-emerald-600" />
                                    <span>{item.val}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Términos y Firma de Entrada */}
                <div className="p-4 bg-slate-200/50 rounded-2xl border border-slate-200/80 text-[10px] text-slate-500 leading-relaxed text-center space-y-1">
                    <p className="font-bold text-slate-700 uppercase tracking-wider">
                        CarMD • Taller Mecánico Especializado
                    </p>
                    <p>
                        Vehículo recibido bajo resguardo técnico en Calle Palacio de Iturbide No. 233, Nezahualcóyotl, Estado de México.
                    </p>
                </div>
            </main>

            {/* Modal Lightbox para Fotos en Pantalla Completa (Pinch/Tap friendly) */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-md"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        {/* Top bar modal */}
                        <div className="flex items-center justify-between text-white pt-2 px-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                                {selectedPhoto.title}
                            </span>
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Image centered */}
                        <div className="flex-1 flex items-center justify-center p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={selectedPhoto.url}
                                alt={selectedPhoto.title}
                                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
                            />
                        </div>

                        {/* Notes bottom bar */}
                        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-center max-w-md mx-auto w-full">
                            <p className="text-xs text-slate-200 font-medium">
                                {selectedPhoto.notes || "Evidencia fotográfica capturada al momento de recibir el vehículo."}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
