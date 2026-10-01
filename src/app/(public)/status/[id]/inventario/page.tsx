"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, RefreshCw, AlertCircle, FileText } from "lucide-react";
import ReceptionPDF from "@/components/pdf/ReceptionPDF";
import { CarTrackerData } from "@/types/floor-pipeline";

export default function ReceptionPdfViewerPage() {
    const params = useParams();
    const token = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "";

    const [trackerData, setTrackerData] = useState<CarTrackerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        const load = async () => {
            try {
                const res = await fetch(`/api/tracker/${token}`);
                if (!res.ok) {
                    setError("No se encontró el inventario solicitado.");
                    return;
                }
                const json = await res.json();
                if (json.success && json.tracker) {
                    setTrackerData(json.tracker);
                } else {
                    setError("Error al consultar inventario.");
                }
            } catch (e) {
                console.error("Error loading PDF data:", e);
                setError("Error de conexión al cargar el inventario.");
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
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center max-w-sm w-full">
                    <RefreshCw size={26} className="animate-spin text-[#f16315] mb-3" />
                    <h2 className="text-sm font-black text-slate-800">Generando vista de inventario...</h2>
                </div>
            </div>
        );
    }

    if (error || !trackerData || !trackerData.rawReceptionData) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
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

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
            {/* Barra Superior de Herramientas (Oculta al imprimir) */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs print:hidden">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
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
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                            <Printer size={14} />
                            <span>Imprimir / Guardar PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenedor del Documento Oficial */}
            <main className="flex-1 py-4 sm:py-8 px-2 sm:px-4 flex justify-center items-start overflow-x-auto print:p-0 print:m-0">
                <div className="shadow-2xl print:shadow-none bg-white rounded-xl overflow-hidden print:rounded-none max-w-full">
                    <ReceptionPDF data={trackerData.rawReceptionData} />
                </div>
            </main>
        </div>
    );
}
