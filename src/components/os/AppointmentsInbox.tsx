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
    AlertCircle
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
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await fetch("/api/citas/list");
            const data = await res.json();
            setAppointments(data || []);
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
                setAppointments(prev => prev.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error("Error updating status:", error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleWhatsApp = (app: Appointment) => {
        const text = `Hola ${app.name}! 👋\n\nRecibimos tu solicitud de cita para tu *${app.vehicle} ${app.year}*.\n\nMe gustaría confirmar algunos detalles para tu visita el día *${app.date}* a las *${app.time}*.\n\n¿Podemos agendar una breve videollamada para revisar el motivo del servicio?\n\n_Motivo reportado: ${app.problem}_`;
        window.open(getWhatsAppLink(text, app.phone), "_blank");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                <Loader2 size={24} className="animate-spin text-[#f16315]" />
                <span className="text-xs font-bold uppercase tracking-widest">Sincronizando Citas...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                        {appointments.length} Pendientes
                    </span>
                </div>
                <button 
                    onClick={load} 
                    disabled={refreshing}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="flex-grow space-y-3 overflow-y-auto pr-1 max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
                <AnimatePresence mode="popLayout">
                    {appointments.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
                        >
                            <Calendar size={32} className="mx-auto mb-2 text-slate-200" />
                            <p className="text-xs font-bold text-slate-400 uppercase">Sin citas nuevas</p>
                        </motion.div>
                    ) : (
                        appointments.map((app, index) => (
                            <motion.div
                                key={app.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:border-[#f16315]/20 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#f16315]">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 leading-none">{app.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1">{app.timestamp}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-[#f16315] uppercase">{app.date}</div>
                                        <div className="text-[10px] font-bold text-slate-400">{app.time}</div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <Car size={12} className="text-slate-400" />
                                        {app.vehicle} {app.year}
                                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-mono">{app.plate}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                                        <Wrench size={12} className="mt-0.5 flex-shrink-0 text-[#f16315]/40" />
                                        <span className="line-clamp-2">{app.problem}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleWhatsApp(app)}
                                        className="flex-grow flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/10"
                                    >
                                        <MessageCircle size={14} /> Contactar
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(app.id, "Atendida")}
                                        disabled={updatingId === app.id}
                                        className="w-10 flex items-center justify-center bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border border-slate-100 rounded-lg transition-all"
                                        title="Marcar como atendida"
                                    >
                                        {updatingId === app.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(app.id, "Cancelada")}
                                        disabled={updatingId === app.id}
                                        className="w-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-100 rounded-lg transition-all"
                                        title="Cancelar cita"
                                    >
                                        {updatingId === app.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                    <AlertCircle size={10} />
                    Las citas atendidas se archivan automáticamente
                </div>
            </div>
        </div>
    );
}
