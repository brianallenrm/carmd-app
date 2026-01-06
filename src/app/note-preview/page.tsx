"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ServiceNoteTemplate from "@/components/pdf/ServiceNoteTemplate";
import { COMPANY_DEFAULTS } from "@/lib/constants";

function NotePreviewContent() {
    const searchParams = useSearchParams();

    const folio = searchParams.get("folio") || "00001";
    const date = searchParams.get("date") || new Date().toLocaleDateString();
    const includeIva = searchParams.get("includeIva") === 'true';
    const includeIsr = searchParams.get("includeIsr") === 'true';
    const notes = searchParams.get("notes") || ""; // Fix: Retrieve notes param

    // Parse complex objects from JSON strings
    let client = { name: "Cliente Ejemplo", address: "", phone: "", email: "" };
    let vehicle = { brand: "", model: "", year: "", plates: "", vin: "", engine: "", odometer: 0 };
    let company = COMPANY_DEFAULTS;
    let services = [];
    let parts = [];

    try {
        const clientParam = searchParams.get("client");
        if (clientParam) client = JSON.parse(clientParam);

        const vehicleParam = searchParams.get("vehicle");
        if (vehicleParam) vehicle = JSON.parse(vehicleParam);

        const companyParam = searchParams.get("company");
        if (companyParam) company = JSON.parse(companyParam);

        const servicesParam = searchParams.get("services");
        if (servicesParam) services = JSON.parse(servicesParam);

        const partsParam = searchParams.get("parts");
        if (partsParam) parts = JSON.parse(partsParam);
    } catch (e) {
        console.error("Failed to parse parameters", e);
    }

    // Default services if empty
    if (services.length === 0 && parts.length === 0) {
        services = [
            { id: "1", description: "Diagnóstico General Computarizado", laborCost: 850 },
        ];
    }

    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const [isGeneratingImg, setIsGeneratingImg] = React.useState(false);
    const [isSharing, setIsSharing] = React.useState(false);

    const handleDownloadPdf = async () => {
        if (isGeneratingPdf) return;
        setIsGeneratingPdf(true);
        try {
            const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client,
                    company,
                    folio,
                    includeIva,
                    includeIsr,
                    notes,
                    date
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error generating PDF");
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Nota_${folio}.pdf`;
            link.click();
        } catch (error) {
            console.error(error);
            alert(`Error: ${error instanceof Error ? error.message : "Error al descargar el PDF"}`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleSharePdf = async () => {
        // ... (Share implementation if needed, but UI calls handleShareImage currently)
    };

    const handleDownloadImage = async () => {
        if (isGeneratingImg) return;
        setIsGeneratingImg(true);
        try {
            const response = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client,
                    vehicle,
                    services,
                    parts,
                    company,
                    folio,
                    includeIva,
                    includeIsr,
                    notes,
                    date
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error generating Image");
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Nota_${folio}.png`;
            link.click();
        } catch (error) {
            console.error(error);
            alert(`Error: ${error instanceof Error ? error.message : "Error al descargar la imagen"}`);
        } finally {
            setIsGeneratingImg(false);
        }
    };

    const handleShareImage = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const response = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client,
                    vehicle,
                    services,
                    parts,
                    company,
                    folio,
                    includeIva,
                    includeIsr,
                    notes,
                    date
                }),
            });
            if (!response.ok) throw new Error("Error generating Image for sharing");
            const blob = await response.blob();
            // Create file as PNG
            const file = new File([blob], `Nota_${folio}.png`, { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Nota de Servicio ${folio}`,
                    text: `Adjunto imagen de nota de servicio para ${client.name}.`
                });
            } else {
                alert("Tu dispositivo no soporta compartir archivos directamente. Usa el botón Imagen.");
            }
        } catch (error) {
            console.error(error);
            alert("Error al compartir la imagen.");
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 print:bg-white print:p-0 print:m-0">
            {/* Action Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white p-3 rounded-2xl shadow-2xl border border-gray-200 print:hidden z-50 flex items-center gap-3">
                <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className={`flex flex-col items-center gap-1 bg-slate-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg min-w-[90px] ${isGeneratingPdf ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {isGeneratingPdf ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mb-0.5" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    )}
                    <span className="text-xs">{isGeneratingPdf ? 'Generando...' : 'PDF'}</span>
                </button>

                <button
                    onClick={handleDownloadImage}
                    disabled={isGeneratingImg}
                    className={`flex flex-col items-center gap-1 bg-slate-700 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-600 transition-colors shadow-lg min-w-[90px] ${isGeneratingImg ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {isGeneratingImg ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mb-0.5" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    )}
                    <span className="text-xs">{isGeneratingImg ? 'Generando...' : 'Imagen'}</span>
                </button>

                <button
                    onClick={handleShareImage}
                    disabled={isSharing}
                    className={`flex flex-col items-center gap-1 bg-indigo-50 text-indigo-700 px-5 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors border border-indigo-200 min-w-[90px] ${isSharing ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {isSharing ? (
                        <div className="h-5 w-5 border-2 border-indigo-700/30 border-t-indigo-700 rounded-full animate-spin mb-0.5" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    )}
                    <span className="text-xs">{isSharing ? 'Generando...' : 'Compartir'}</span>
                </button>

                <div className="h-10 w-px bg-gray-200"></div>

                <a
                    href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=Hola ${client.name}, te envío tu nota de servicio.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold hover:bg-green-100 transition-colors border border-green-200 min-w-[90px]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span className="text-xs">Cliente</span>
                </a>

                <a
                    href={`https://wa.me/525516473084?text=Nueva nota generada (Folio: ${folio}). Cliente: ${client.name}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-200 min-w-[90px]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    <span className="text-xs">Rafael</span>
                </a>

                <a
                    href={`https://wa.me/525535786087?text=Nueva nota generada (Folio: ${folio}). Cliente: ${client.name}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold hover:bg-purple-100 transition-colors border border-purple-200 min-w-[90px]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span className="text-xs">Susi</span>
                </a>
            </div>

            <div className="shadow-2xl print:shadow-none">
                <ServiceNoteTemplate
                    client={client}
                    vehicle={vehicle}
                    services={services}
                    parts={parts}
                    company={company}
                    folio={folio}
                    date={date}
                    includeIva={includeIva}
                    includeIsr={includeIsr}
                    notes={notes}
                />
            </div>
        </div>
    );
}

export default function NotePreviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando vista previa...</div>}>
            <NotePreviewContent />
        </Suspense>
    );
}
