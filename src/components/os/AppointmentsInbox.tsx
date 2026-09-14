"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Calendar, 
    User, 
    Car, 
    MessageCircle, 
    CheckCircle, 
    Loader2, 
    RefreshCw, 
    Clock, 
    Wrench, 
    XCircle, 
    ChevronRight, 
    AlertCircle, 
    ExternalLink,
    Archive,
    History
} from "lucide-react";
import { getWhatsAppLink } from "@/lib/constants";

interface Appointment {
    id: number;
    timestamp: string;
    plate: string;
    name: string;
    phone: string;
    email: string;
    vehicle: string;
    year: string;
    km: string;
    date: string;
    time: string;
    problem: string;
    status: string;
}

export default function AppointmentsInbox() {
    const [activeCitas, setActiveCitas] = useState<Appointment[]>([]);
    const [expiredCitas, setExpiredCitas] = useState<Appointment[]>([]);
    const [viewTab, setViewTab] = useState<'active' | 'expired'>('active');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [archivingAll, setArchivingAll] = useState(false);

    const load = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await fetch("/api/citas/list?meta=true");
            const data = await res.json();
            if (data && data.active && data.expired) {
                setActiveCitas(data.active);
                setExpiredCitas(data.expired);
            } else if (Array.isArray(data)) {
                setActiveCitas(data);
                setExpiredCitas([]);
            }
        } catch (error) {
            console.error("Error loading appointments:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 5 * 60 * 1000); // Every 5 mins
        return () => clearInterval(interval);
    }, [load]);

    const handleUpdateStatus = async (id: number, status: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch("/api/citas/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                setActiveCitas(prev => prev.filter(a => a.id !== id));
                setExpiredCitas(prev => prev.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error("Error updating status:", error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleArchiveExpired = async () => {
        if (!confirm(`¿Deseas archivar ${expiredCitas.length} citas pasadas? Ya no aparecerán en las solicitudes pendientes.`)) {
            return;
        }
        setArchivingAll(true);
        try {
            const res = await fetch("/api/citas/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ archiveExpired: true })
            });
            if (res.ok) {
                setExpiredCitas([]);
                setViewTab('active');
            }
        } catch (error) {
            console.error("Error archiving expired appointments:", error);
        } finally {
            setArchivingAll(false);
        }
    };

    const handleWhatsApp = (app: Appointment) => {
        const text = `Hola ${app.name}! 👋\n\nRecibimos tu solicitud de cita para tu *${app.vehicle} ${app.year}*.\n\nMe gustaría confirmar algunos detalles para tu visita el día *${app.date}* a las *${app.time}*.\n\n¿Podemos agendar una breve videollamada para revisar el motivo del servicio?\n\n_Motivo reportado: ${app.problem}_`;
        window.open(getWhatsAppLink(text, app.phone), "_blank");
    };

    const currentList = viewTab === 'active' ? activeCitas : expiredCitas;

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-50 text-[#f16315] p-2 rounded-lg">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Bandeja de Citas</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                            {activeCitas.length} activas · {expiredCitas.length} pasadas
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Selector de pestañas */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewTab('active')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                viewTab === 'active'
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            <span>Hoy y Próximas</span>
                            {activeCitas.length > 0 && (
                                <span className="bg-[#f16315] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                                    {activeCitas.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setViewTab('expired')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                viewTab === 'expired'
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            <History size={11} />
                            <span>Pasadas</span>
                            {expiredCitas.length > 0 && (
                                <span className="bg-slate-300 text-slate-700 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                                    {expiredCitas.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Botón Archivar Citas Pasadas si existen */}
                    {expiredCitas.length > 0 && (
                        <button
                            onClick={handleArchiveExpired}
                            disabled={archivingAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl text-[10px] font-bold uppercase transition-all border border-slate-200"
                            title="Archivar citas vencidas"
                        >
                            {archivingAll ? (
                                <Loader2 size={12} className="animate-spin text-rose-500" />
                            ) : (
                                <Archive size={12} />
                            )}
                            <span>Archivar pasadas ({expiredCitas.length})</span>
                        </button>
                    )}

                    <button 
                        onClick={load} 
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold uppercase transition-all border border-slate-200"
                    >
                        <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                        <span>Sincronizar</span>
                    </button>
                </div>
            </div>


            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                                <th className="px-6 py-4">Vehículo / Placa</th>
                                <th className="px-6 py-4">Propietario</th>
                                <th className="px-6 py-4">Fecha Cita</th>
                                <th className="px-6 py-4">Problema</th>
                                <th className="px-6 py-4 text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence mode="popLayout">
                                {currentList.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <Calendar size={40} className="text-slate-400" />
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                                                    {viewTab === 'active' ? "Sin citas pendientes para hoy o próximas" : "No hay citas pasadas sin archivar"}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentList.map((app, index) => (
                                        <motion.tr
                                            key={app.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.04 }}
                                            className="hover:bg-slate-50/80 transition-colors group"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="font-black text-slate-800 text-xs uppercase group-hover:text-[#f16315] transition-colors">
                                                    {app.vehicle} ({app.year})
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">{app.plate}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                                    {app.name}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{app.phone}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 text-[#f16315] font-black uppercase text-[11px]">
                                                    <Calendar size={12} /> {app.date}
                                                    {viewTab === 'expired' && (
                                                        <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded font-bold">
                                                            Vencida
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] mt-0.5">
                                                    <Clock size={11} /> {app.time}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-[11px] text-slate-500 line-clamp-2 max-w-[200px] italic leading-tight">
                                                    "{app.problem}"
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Enviar a Rafael */}
                                                    <button 
                                                        onClick={() => {
                                                            const msg = `Hola Rafael, se generó una nueva cita:\n👤 Cliente: ${app.name}\n🚗 Vehículo: ${app.vehicle} (${app.year})\n📅 Fecha: ${app.date}\n⏰ Hora: ${app.time}\n📋 Placa: ${app.plate}\n⚠️ Problema: ${app.problem}\n📱 WhatsApp Cliente: wa.me/${app.phone.replace(/[^0-9]/g, '')}`;
                                                            window.open(`https://wa.me/525516473084?text=${encodeURIComponent(msg)}`, '_blank');
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 bg-[#f16315] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                                                    >
                                                        ENVIARA RAFAEL <MessageCircle size={13} />
                                                    </button>

                                                    {/* Contactar Cliente */}
                                                    <button 
                                                        onClick={() => handleWhatsApp(app)}
                                                        className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                                    >
                                                        CLIENTE <ExternalLink size={13} />
                                                    </button>

                                                    {/* Archivar (Pequeño) */}
                                                    <div className="flex gap-1 ml-2 border-l border-slate-100 pl-2">
                                                        <button 
                                                            onClick={() => handleUpdateStatus(app.id, "Atendida")}
                                                            disabled={updatingId === app.id}
                                                            className="p-1.5 text-slate-300 hover:text-emerald-500 transition-colors"
                                                            title="Atendida"
                                                        >
                                                            {updatingId === app.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={14} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(app.id, "Cancelada")}
                                                            disabled={updatingId === app.id}
                                                            className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                                            title="Cancelar"
                                                        >
                                                            {updatingId === app.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
