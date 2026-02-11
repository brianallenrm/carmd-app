'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Trash2, Send, Clock, Car, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Type definition for stored reception data
interface ReceptionData {
    id: string; // Timestamp ID
    date: string;
    client: { name: string; phone: string };
    vehicle: { brand: string; model: string; plates: string };
    service: { advisorName: string };
}

export default function ReceptionsDashboard() {
    const [receptions, setReceptions] = useState<ReceptionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load from API (Google Sheets) instead of localStorage
        const loadReceptions = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/inventory/list');
                if (res.ok) {
                    const data = await res.json();
                    setReceptions(data.receptions || []);
                } else {
                    console.error("Failed to fetch receptions");
                }
            } catch (e) {
                console.error("Error loading receptions", e);
            } finally {
                setLoading(false);
            }
        };
        loadReceptions();
    }, []);

    const handleDelete = (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta recepción?')) return;

        // Client-side only delete (doesn't affect Google Sheets)
        const updated = receptions.filter(r => r.id !== id);
        setReceptions(updated);
    };

    const getWhatsAppLink = (reception: ReceptionData) => {
        // Construct a friendly message
        const message = `Hola ${reception.client.name}, le compartimos el inventario de recepción de su vehículo ${reception.vehicle.brand} ${reception.vehicle.model} (${reception.vehicle.plates}). 🚗📋`;
        // In a real app, this would link to a public URL of the PDF. 
        // For now, we simulate the intent.
        return `https://wa.me/52${reception.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    };

    const openPreview = (id: string) => {
        // We need to set the "Current" PDF data to this specific item
        // The note-preview page reads from 'PDF_DATA'.
        // So we find this item, put it in 'PDF_DATA', then open the tab.
        const item = receptions.find(r => r.id === id);
        if (item) {
            // Ensure isReception is always true for items from this page
            // (API data from /api/inventory/list may not include this flag)
            localStorage.setItem('PDF_DATA', JSON.stringify({ ...item, isReception: true }));
            window.open('/note-preview', '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-4xl mx-auto">

                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recepciones Pendientes</h1>
                        <p className="text-slate-500">Supervisa y envía los inventarios realizados por los asesores.</p>
                    </div>
                    <Link href="/inventory" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">
                        + Nueva Recepción
                    </Link>
                </header>

                {loading ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-slate-400 animate-spin" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Cargando recepciones...</h3>
                    </div>
                ) : receptions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No hay recepciones pendientes</h3>
                        <p className="text-slate-500 text-sm">Los inventarios finalizados aparecerán aquí.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence>
                            {receptions.map((reception) => (
                                <motion.div
                                    key={reception.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-4"
                                >
                                    {/* Info */}
                                    <div className="flex-grow flex gap-4 items-center w-full md:w-auto">
                                        <div className="bg-orange-100 p-3 rounded-lg">
                                            <Car className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <div className="flex gap-2 items-center mb-0.5">
                                                <h3 className="font-bold text-slate-900">{reception.client.name}</h3>
                                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                                                    {reception.date || 'Sin fecha'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 flex items-center gap-2">
                                                <span>{reception.vehicle.brand} {reception.vehicle.model}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="font-mono bg-slate-50 px-1 rounded border border-slate-100 text-xs">{reception.vehicle.plates}</span>
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <User className="w-3 h-3" /> Asesor: {reception.service.advisorName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => openPreview(reception.id)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Revisar PDF
                                        </button>

                                        <a
                                            href={getWhatsAppLink(reception)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-bold text-sm rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                            Enviar WA
                                        </a>

                                        <button
                                            onClick={() => handleDelete(reception.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
