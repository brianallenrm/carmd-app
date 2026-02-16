'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Trash2, Send, Clock, Car, User, Camera, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Type definition for stored reception data
interface ReceptionData {
    id: string; // Timestamp ID
    date: string;
    client: { name: string; phone: string; email?: string; address?: string };
    vehicle: { brand: string; model: string; plates: string; year?: string; vin?: string };
    service: { advisorName: string; serviceType?: string; comments?: string; valuablesDescription?: string; hasValuables?: boolean };
    photos?: Record<string, any>;
}

export default function ReceptionsDashboard() {
    const [receptions, setReceptions] = useState<ReceptionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGallery, setSelectedGallery] = useState<ReceptionData | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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
                    <Link href="/inventario" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">
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
                                            onClick={() => setSelectedGallery(reception)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                        >
                                            <Camera className="w-4 h-4" />
                                            Ver Fotos
                                        </button>

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

            {/* Image Gallery Modal */}
            <AnimatePresence>
                {selectedGallery && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 leading-tight">
                                        Galería de Daños
                                    </h2>
                                    <p className="text-slate-500 text-xs font-medium">
                                        {selectedGallery.vehicle.brand} {selectedGallery.vehicle.model} • {selectedGallery.vehicle.plates}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedGallery(null)}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Grid Context */}
                            <div className="flex-grow overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['frente', 'atras', 'izq', 'der'].map((zone) => {
                                        const photo = selectedGallery.photos?.[zone];
                                        const url = photo?.driveUrl || photo?.previewUrl;

                                        return (
                                            <div key={zone} className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                                                <div className="aspect-video relative overflow-hidden bg-slate-200">
                                                    {url ? (
                                                        <>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={url}
                                                                alt={zone}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            <button
                                                                onClick={() => setZoomedImage(url)}
                                                                className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                                            >
                                                                <Maximize2 size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium italic">
                                                            Sin foto de esta zona
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4 flex-grow border-t border-slate-100 bg-white">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{zone}</span>
                                                        {url && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Capturada</span>}
                                                    </div>
                                                    {photo?.notes ? (
                                                        <div className="p-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl">
                                                            <p className="text-sm font-bold text-rose-900 leading-tight">
                                                                {photo.notes}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-slate-400 italic">Sin observaciones registradas.</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                                    Fin de la evidencia fotográfica principal
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fullscreen Zoom Component */}
            <AnimatePresence>
                {zoomedImage && (
                    <div
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-4 md:p-12 cursor-zoom-out"
                        onClick={() => setZoomedImage(null)}
                    >
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                        >
                            <X size={24} />
                        </motion.button>

                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={zoomedImage}
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
